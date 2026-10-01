import express from "express";
import multer from "multer";
import path from "path";
import { extractTextFromPDF } from "../services/pdf.service.js";
import { parseStatementWithGemini, categorizeDescriptions } from "../services/gemini.service.js";
import { parseCSV } from "../services/csv.service.js";
import { cleanTransactions, dedupeTransactions } from "../services/transaction.service.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (![".pdf", ".csv"].includes(ext)) {
      return cb(new Error("Only PDF or CSV files are supported"));
    }
    cb(null, true);
  },
});

/**
 * Full path: POST /api/ingest/upload
 *
 * Extracts and validates transactions but does NOT save them yet —
 * this returns an editable preview. The client shows it to the user
 * and calls POST /api/transactions/confirm to actually persist it.
 * That gives the user a chance to catch a wrong category or amount
 * before anything hits the database.
 *
 * CSV is already structured, so it's parsed directly with no AI
 * call. PDF text is unstructured, so it goes through Gemini.
 */
router.post("/upload", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    let rawTransactions;

    if (ext === ".csv") {
      let rows;
      try {
        rows = parseCSV(req.file.buffer);
      } catch (csvErr) {
        return res.status(400).json({ success: false, error: csvErr.message });
      }
      // CSV skips the AI extraction step (the data's already structured),
      // but still needs categorization, which a CSV rarely includes.
      // One batched call for all unique descriptions, not one per row.
      const categoryMap = await categorizeDescriptions(rows.map((r) => r.description));
      rawTransactions = rows.map((r) => ({ ...r, category: categoryMap[r.description] }));
    } else {
      const rawText = await extractTextFromPDF(req.file.buffer);
      if (!rawText || rawText.length < 50) {
        return res.status(400).json({
          success: false,
          error: "Could not read a valid statement from this file",
        });
      }
      rawTransactions = await parseStatementWithGemini(rawText);
    }

    const { valid, skipped } = cleanTransactions(rawTransactions);
    // Chunk overlap on the PDF path (see gemini.service.js) means the same
    // transaction can legitimately come back from two neighboring chunks —
    // collapse that here so the preview the user reviews already shows
    // accurate totals, rather than relying solely on the DB's unique index
    // to catch it later at save time.
    const { unique, duplicates } = dedupeTransactions(valid);

    if (!unique.length) {
      return res.status(422).json({
        success: false,
        error: "No valid transactions could be extracted from this file",
      });
    }

    res.json({
      success: true,
      preview: unique,
      skipped,
      duplicatesRemoved: duplicates,
      source: ext === ".csv" ? "csv" : "pdf",
    });
  } catch (err) {
    next(err);
  }
});

export default router;
