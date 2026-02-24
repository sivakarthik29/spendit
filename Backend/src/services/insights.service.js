import { GoogleGenAI } from "@google/genai";

export async function generateInsights(summaryData) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not set in environment variables");
  }

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    apiVersion: "v1",
  });

  const prompt = `
You are a senior financial analyst.

Generate professional financial insights based on:

${JSON.stringify(summaryData, null, 2)}
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return response.text;
}