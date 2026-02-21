import dotenv from "dotenv";
dotenv.config();

import { GoogleGenAI } from "@google/genai";

async function test() {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    apiVersion: "v1"
  });

  console.log("Listing available models...");

  const models = await ai.models.list();

  console.log(JSON.stringify(models, null, 2));
}

test().catch(console.error);
