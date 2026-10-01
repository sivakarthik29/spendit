import express from "express";
import Transaction from "../models/Transaction.model.js";
import Insight from "../models/Insight.model.js";
import {
  computeCoreMetrics,
  getCategoryBreakdown,
  getMonthlyCategorySpending,
} from "../services/analytics.service.js";

const router = express.Router();

router.get("/dashboard", async (req, res, next) => {
  try {
    const transactions = await Transaction.find().lean();
    const core = computeCoreMetrics(transactions);

    const [categories, monthlyCategory, latestInsight] = await Promise.all([
      getCategoryBreakdown(),
      getMonthlyCategorySpending(),
      Insight.findOne().sort({ createdAt: -1 }).lean(),
    ]);

    res.json({
      success: true,
      core,
      categories,
      monthlyCategory,
      insight: latestInsight?.content || "Upload a statement to see insights here.",
    });
  } catch (err) {
    next(err);
  }
});

// This is the ONLY reset endpoint in the app (the old build accidentally
// had a second, unprotected one under /transactions). Disabled outright
// in production.
router.delete("/wipe", async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        success: false,
        error: "Wipe is disabled in production",
      });
    }

    await Promise.all([Transaction.deleteMany({}), Insight.deleteMany({})]);

    res.json({ success: true, message: "Data cleared" });
  } catch (err) {
    next(err);
  }
});

export default router;
