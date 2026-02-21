import express from "express";
import Transaction from "../models/Transaction.model.js";
import {
  calculateHealthScore,
  generateForecast,
  getCategoryBreakdown,
} from "../services/analytics.service.js";

const router = express.Router();

router.get("/forecast", async (req, res, next) => {
  try {
    const transactions = await Transaction.find().lean();
    const result = generateForecast(transactions);

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

router.get("/health", async (req, res, next) => {
  try {
    const transactions = await Transaction.find().lean();
    const result = calculateHealthScore(transactions);

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

router.get("/categories", async (req, res) => {
  try {
    const data = await getCategoryBreakdown();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

export default router;