import { GoogleGenAI } from "@google/genai";

// Defined once and reused everywhere a Gemini call is made (here and in
// insights.service.js), so switching models later is a one-line change.
export const MODEL = "gemini-3.1-flash-lite";
const CHUNK_SIZE = 12000; // chars per chunk, keeps each request well under token limits
const CHUNK_OVERLAP = 300; // chars shared between consecutive chunks
const BATCH_SIZE = 3; // chunks processed concurrently per batch
const BATCH_DELAY_MS = 4000; // pause between batches to stay under free-tier rate limits

function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    // Thrown once, up front, from the exported functions below — not from
    // inside a per-chunk try/catch. A missing key should fail loudly and
    // immediately, not look like "every chunk quietly returned nothing."
    const error = new Error("GEMINI_API_KEY is not set — check your environment configuration");
    error.status = 500;
    throw error;
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

/**
 * Splits into overlapping chunks so a transaction whose text happens to
 * fall right on a chunk boundary still appears in full inside at least
 * one chunk, instead of being split in half and lost by both. The
 * overlap means the same transaction can now be extracted from both
 * neighboring chunks — dedupeTransactions() in transaction.service.js
 * is what collapses that back down to one.
 */
function splitIntoChunks(text, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    chunks.push(text.slice(start, end));
    if (end === text.length) break;
    start = end - overlap;
  }

  return chunks;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildPrompt(chunk) {
  return `Extract every transaction from this bank statement text.

Return ONLY a JSON array. No explanation, no markdown fences.

Each item must look like:
{"date":"YYYY-MM-DD","description":"string","amount":number,"category":"string"}

Rules:
- Debits (money out) are negative numbers, credits (money in) are positive.
- category should be one short word like Food, Shopping, Rent, Utilities, Transport, Entertainment, Income, ATM, UPI, or Other.
- If the same transaction appears more than once in this text, list it only once.

Text:
${chunk}`;
}

async function parseChunk(ai, chunk, attempt = 0) {
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: buildPrompt(chunk),
    });

    const raw = response.text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    const isRateLimited = error?.status === 429;

    if (isRateLimited && attempt < 2) {
      await sleep(15000 * (attempt + 1));
      return parseChunk(ai, chunk, attempt + 1);
    }

    // One unparseable chunk shouldn't fail the whole statement — this is
    // a runtime/data problem (bad response, transient failure), not a
    // configuration problem, so it degrades gracefully instead of
    // throwing: log it and move on with whatever chunks did parse.
    console.warn("Skipping a chunk that failed to parse:", error.message);
    return [];
  }
}

function buildCategorizationPrompt(descriptions) {
  return `Assign one category to each transaction description below.

Allowed categories: Food, Shopping, Rent, Utilities, Transport, Entertainment, Income, ATM, UPI, Other.

Return ONLY a JSON object mapping each description exactly as given to one category. No explanation, no markdown fences.

Descriptions:
${JSON.stringify(descriptions)}`;
}

/**
 * CSV rows are already structured, so they skip full extraction — but
 * they still need a category, which a CSV rarely includes on its own.
 * This sends the unique descriptions as one batch call instead of one
 * call per row, which keeps a large CSV from burning through the rate
 * limit the way per-row calls would.
 */
export async function categorizeDescriptions(descriptions) {
  const unique = [...new Set(descriptions.filter(Boolean))];
  if (!unique.length) return {};

  const ai = getClient(); // missing/invalid key surfaces immediately, not as a silent empty result

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: buildCategorizationPrompt(unique),
    });

    const raw = response.text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(raw);
  } catch (error) {
    console.warn("Categorization skipped:", error.message);
    return {};
  }
}

/**
 * Splits the statement into overlapping chunks and parses them in small
 * concurrent batches with Promise.all. A single Promise.all across every
 * chunk would blow through Gemini's free-tier requests-per-minute limit
 * on anything but a short statement, so chunks are processed in bounded
 * batches instead — each batch genuinely runs in parallel, and a short
 * pause between batches keeps the whole run under the rate limit.
 */
export async function parseStatementWithGemini(text) {
  const ai = getClient(); // fail fast, once, before touching any chunk

  const chunks = splitIntoChunks(text);
  const results = [];

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map((chunk) => parseChunk(ai, chunk)));
    results.push(...batchResults);

    const isLastBatch = i + BATCH_SIZE >= chunks.length;
    if (!isLastBatch) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  return results.flat();
}
