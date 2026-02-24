import Transaction from "../models/Transaction.model.js";
import Insights from "../models/Insights.model.js";
import { parseStatementWithGemini } from "./gemini.service.js";
import { generateInsights } from "./insights.service.js";
import PDFParser from "pdf2json";

function extractTextFromPDF(buffer) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (errData) =>
      reject(errData.parserError)
    );

    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      let text = "";

      pdfData.Pages.forEach((page) => {
        page.Texts.forEach((textItem) => {
          textItem.R.forEach((r) => {
            text += decodeURIComponent(r.T) + " ";
          });
        });
      });

      resolve(text);
    });

    pdfParser.parseBuffer(buffer);
  });
}

function normalizeDate(dateString) {
  if (!dateString) return null;

  if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
    return new Date(dateString);
  }

  const parts = dateString.split("-");
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts;
    return new Date(`${yyyy}-${mm}-${dd}`);
  }

  return new Date(dateString);
}

function cleanTransaction(tx) {
  const cleaned = {
    date: normalizeDate(tx.date),
    description: tx.description?.trim() || "",
    amount: Number(tx.amount),
    category: tx.category || "Other",
    source: tx.source || "bank_statement",
  };

  if (!cleaned.date || isNaN(cleaned.date.getTime())) {
    throw new Error(`Invalid date: ${tx.date}`);
  }

  if (isNaN(cleaned.amount)) {
    throw new Error(`Invalid amount: ${tx.amount}`);
  }

  return cleaned;
}

export async function ingestStatement(fileBuffer) {
  if (!fileBuffer) throw new Error("No file uploaded");

  const rawText = await extractTextFromPDF(fileBuffer);
  if (!rawText || rawText.length < 50)
    throw new Error("Invalid or empty PDF");

  const parsedTransactions = await parseStatementWithGemini(rawText);

  if (!parsedTransactions.length)
    throw new Error("No transactions parsed");

  const cleanedTransactions = parsedTransactions.map(cleanTransaction);

  try {
    await Transaction.insertMany(cleanedTransactions, {
      ordered: false,
    });
  } catch (err) {
    // Ignore duplicate key errors
    if (err.code !== 11000) throw err;
  }

  try {
    const summary = {
      totalTransactions: cleanedTransactions.length,
    };

    const insightsText = await generateInsights(summary);

    if (insightsText) {
      await Insights.create({ content: insightsText });
    }
  } catch (e) {
    console.warn("Insight generation failed:", e.message);
  }

  return {
    success: true,
    inserted: cleanedTransactions.length,
  };
}