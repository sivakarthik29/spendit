import { GoogleGenAI } from "@google/genai";

function createClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not set");
  }

  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    apiVersion: "v1",
  });
}

function splitIntoChunks(text, maxLength = 12000) {
  const chunks = [];
  for (let i = 0; i < text.length; i += maxLength) {
    chunks.push(text.slice(i, i + maxLength));
  }
  return chunks;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function parseChunk(chunk, retry = 0) {
  const ai = createClient();

  const prompt = `
Extract all transactions from the following bank statement text.

Return ONLY valid JSON array.

Format:
[
  {
    "date": "YYYY-MM-DD",
    "description": "string",
    "amount": number,
    "category": "string",
    "source": "bank_statement"
  }
]

Debit = negative
Credit = positive

Text:
${chunk}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const cleaned = response.text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) {
      throw new Error("Invalid Gemini response format");
    }

    return parsed;
  } catch (error) {
    if (error?.status === 429 && retry < 2) {
      console.warn("Rate limit hit. Retrying...");
      await sleep(60000);
      return parseChunk(chunk, retry + 1);
    }

    throw error;
  }
}

export async function parseStatementWithGemini(text) {
  const chunks = splitIntoChunks(text);
  const results = [];

  for (const chunk of chunks) {
    const parsed = await parseChunk(chunk);
    results.push(parsed);
    await sleep(12000); // rate safety
  }

  return results.flat();
}