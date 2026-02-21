import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { parseStatementWithGemini } from "./gemini.service.js";
import { classifyTransaction } from "./category.service.js";
import Transaction from "../models/Transaction.model.js";

export async function ingestPdf(buffer) {
  try {
    const uint8Array = new Uint8Array(buffer);

    const loadingTask = pdfjsLib.getDocument({
      data: uint8Array,
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;

    let text = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item) => item.str);
      text += strings.join(" ") + "\n";
    }

    if (!text || text.length < 10) {
      throw new Error("PDF text extraction failed");
    }

    const aiTransactions = await parseStatementWithGemini(text);

    if (!Array.isArray(aiTransactions)) {
      throw new Error("Invalid AI output format");
    }

    /**
     * Validate & sanitize AI output
     */
    const cleanTransactions = aiTransactions
      .filter(
        (t) =>
          t.date &&
          t.description &&
          typeof t.amount === "number"
      )
      .map((t) => ({
        date: new Date(t.date),
        description: t.description.trim(),
        amount: Number(t.amount),
        category: classifyTransaction(t.description),
        source: "bank_statement",
      }));

    if (cleanTransactions.length === 0) {
      throw new Error("No valid transactions parsed");
    }

    if (cleanTransactions.length > 2000) {
      throw new Error("Suspicious AI output volume");
    }

    await Transaction.insertMany(cleanTransactions, {
      ordered: false,
    });

    return {
      success: true,
      inserted: cleanTransactions.length,
    };
  } catch (err) {
    console.error("🔥 Ingest error:", err.message);
    throw err;
  }
}