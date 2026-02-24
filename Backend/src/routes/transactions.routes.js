import express from "express";
import Transaction from "../models/Transaction.model.js";
import Insights from "../models/Insights.model.js";

const router = express.Router();

/* ================= GET ALL ================= */

router.get("/", async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ date: -1 });
    res.json({ success: true, transactions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= WIPE ================= */

router.delete("/wipe", async (req, res) => {
  try {
    await Promise.all([
      Transaction.deleteMany({}),
      Insights.deleteMany({}),
    ]);

    res.json({
      success: true,
      message: "Database wiped successfully",
    });
  } catch (err) {
    console.error("Wipe error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;