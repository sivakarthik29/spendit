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

/* ======================================================
   DASHBOARD
====================================================== */

router.get("/dashboard", async (req, res) => {
  try {
    const transactions = await Transaction.find().lean();

    const core = calculateCoreMetrics(transactions || []);
    const health = calculateHealthScore(transactions || []);

    const [categories, monthlyCategory, latestInsights] =
      await Promise.all([
        getCategoryBreakdown(),
        getMonthlyCategorySpending(),
        Insights.findOne().sort({ createdAt: -1 }).lean(),
      ]);

    return res.status(200).json({
      success: true,
      core: core || {},
      health: health || {},
      categories: categories || [],
      monthlyCategory: monthlyCategory || [],
      insights:
        latestInsights?.content ||
        "No AI insights generated yet. Upload a statement to generate insights.",
    });
  } catch (err) {
    console.error("❌ Dashboard Error:", err.message);

    return res.status(500).json({
      success: false,
      error: "Failed to load dashboard data",
    });
  }
});

/* ======================================================
   FORECAST
====================================================== */

router.get("/forecast", async (req, res) => {
  try {
    const transactions = await Transaction.find().lean();

    const { forecast, trend } = calculateForecast(transactions || []);

    return res.status(200).json({
      success: true,
      forecast: forecast || [],
      trend: trend || "neutral",
    });
  } catch (err) {
    console.error("❌ Forecast Error:", err.message);

    return res.status(500).json({
      success: false,
      error: "Failed to generate forecast",
    });
  }
});

/* ======================================================
   WIPE DATABASE (SAFE IN DEV ONLY)
====================================================== */

router.delete("/wipe", async (req, res) => {
  try {
    // Prevent wipe in production
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        success: false,
        error: "Database wipe is disabled in production",
      });
    }

    await Transaction.deleteMany({});
    await Insights.deleteMany({});

    return res.status(200).json({
      success: true,
      message: "Database wiped successfully",
    });
  } catch (err) {
    console.error("❌ Wipe Error:", err.message);

    return res.status(500).json({
      success: false,
      error: "Failed to wipe database",
    });
  }
});

export default router;