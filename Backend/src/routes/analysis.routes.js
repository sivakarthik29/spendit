import express from "express";
import Transaction from "../models/Transaction.model.js";
import Insights from "../models/Insights.model.js";

import {
  calculateCoreMetrics,
  calculateHealthScore,
  getCategoryBreakdown,
  getMonthlyCategorySpending,
} from "../services/analytics.service.js";

import { calculateForecast } from "../services/forecast.service.js";

const router = express.Router();

/* ================= DASHBOARD ================= */

router.get("/dashboard", async (req, res) => {
  try {
    const transactions = await Transaction.find().lean();

    const core = calculateCoreMetrics(transactions);
    const health = calculateHealthScore(transactions);

    const [categories, monthlyCategory, latestInsights] =
      await Promise.all([
        getCategoryBreakdown(),
        getMonthlyCategorySpending(),
        Insights.findOne().sort({ createdAt: -1 }),
      ]);

    res.json({
      success: true,
      core,
      health,
      categories,
      monthlyCategory,
      insights:
        latestInsights?.content ||
        "No AI insights generated yet. Upload a statement to generate insights.",
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ================= FORECAST ================= */

router.get("/forecast", async (req, res) => {
  try {
    const transactions = await Transaction.find().lean();

    const { forecast, trend } = calculateForecast(transactions);

    res.json({
      success: true,
      forecast,
      trend,
    });
  } catch (err) {
    console.error("Forecast error:", err);
    res.status(500).json({ error: "Failed to generate forecast" });
  }
});

export default router;