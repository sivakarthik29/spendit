import { GoogleGenAI } from "@google/genai";
import { MODEL } from "./gemini.service.js";

/**
 * Generates a short, purely descriptive summary of spending activity —
 * facts about the data, not advice. The prompt explicitly forbids
 * recommendations and preamble so the output can be shown as-is,
 * with no client-side text scrubbing needed.
 */
export async function generateInsight(summary) {
  if (!process.env.GEMINI_API_KEY) return null;

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const prompt = `Here is a summary of a user's recent transaction data:

${JSON.stringify(summary, null, 2)}

Write 2-3 short sentences describing what this data shows.
Rules:
- Only describe facts in the data (totals, biggest category, direction of change).
- Do not give advice, suggestions, or recommendations.
- Do not include a greeting, preamble, or markdown formatting.
- Return only the sentences.`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
  });

  return response.text.trim();
}
