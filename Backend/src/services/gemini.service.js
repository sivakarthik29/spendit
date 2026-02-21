import { GoogleGenAI } from "@google/genai";

export async function parseStatementWithGemini(text) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY missing");
    }

    const ai = new GoogleGenAI({
      apiKey,
      apiVersion: "v1"
    });

    const prompt = `
You are a financial data extraction engine.

Extract ALL transactions from the bank statement text below.

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

Rules:
- Debit = negative amount
- Credit = positive amount
- Dates must be ISO format
- No markdown
- No explanation

Text:
${text}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    const raw = response.text;

    const cleaned = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) {
      throw new Error("Invalid Gemini output");
    }

    return parsed;

  } catch (err) {
    console.error("🔥 Gemini parsing error:", err);
    throw new Error("Gemini parsing failed");
  }
}
