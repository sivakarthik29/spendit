import express from "express";
import Transaction from "../models/Transaction.model.js";
import Insight from "../models/Insight.model.js";
import { cleanTransactions, dedupeTransactions, saveTransactions } from "../services/transaction.service.js";
import { generateInsight } from "../services/insights.service.js";
import { computeCoreMetrics } from "../services/analytics.service.js";

const router = express.Router();

// GET /api/transactions?page=1&limit=50
router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);

    const [transactions, total] = await Promise.all([
      Transaction.find()
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(),
    ]);

    res.json({ success: true, transactions, total, page, limit });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/transactions/confirm
 *
 * Saves a previewed batch from /api/ingest/upload, after the user has
 * had a chance to review or edit it on the client. The same
 * cleanTransactions() validation used at extraction time runs again
 * here — a client-side edit is never trusted as already-clean before
 * it's persisted.
 */
router.post("/confirm", async (req, res, next) => {
  try {
    const incoming = Array.isArray(req.body.transactions) ? req.body.transactions : [];
    const { valid, skipped } = cleanTransactions(incoming);
    // Re-run even though /api/ingest/upload already deduped this batch —
    // the client sends back whatever it has, edited or not, and the
    // server never assumes it arrives in the same shape it was handed out.
    const { unique, duplicates } = dedupeTransactions(valid);

    if (!unique.length) {
      return res.status(422).json({ success: false, error: "No valid transactions to save" });
    }

    const { inserted } = await saveTransactions(unique);

    // Best-effort refresh of the descriptive insight — an upload
    // still counts as successful even if this part fails.
    try {
      const allTransactions = await Transaction.find().lean();
      const core = computeCoreMetrics(allTransactions);
      const content = await generateInsight({
        ...core,
        transactionCount: allTransactions.length,
      });
      if (content) await Insight.create({ content });
    } catch (err) {
      console.warn("Insight generation skipped:", err.message);
    }

    res.json({ success: true, inserted, skipped, duplicatesRemoved: duplicates });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/transactions/:id
// Merges the edit onto the existing record before validating, so a
// partial edit (e.g. just fixing the category) doesn't get rejected
// for "missing" fields it never touched.
router.patch("/:id", async (req, res, next) => {
  try {
    const existing = await Transaction.findById(req.params.id).lean();
    if (!existing) {
      return res.status(404).json({ success: false, error: "Transaction not found" });
    }

    const merged = { ...existing, ...req.body };
    const { valid } = cleanTransactions([merged]);

    if (!valid.length) {
      return res.status(400).json({ success: false, error: "Invalid transaction data" });
    }

    const updated = await Transaction.findByIdAndUpdate(req.params.id, valid[0], {
      new: true,
    });

    res.json({ success: true, transaction: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/transactions/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await Transaction.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: "Transaction not found" });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
