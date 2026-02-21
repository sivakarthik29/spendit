import express from "express";
import Transaction from "../models/Transaction.model.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const transactions = await Transaction.find().sort({ date: -1 });

  res.json({
    success: true,
    count: transactions.length,
    data: transactions
  });
});

router.delete("/wipe", async (req, res) => {
  await Transaction.deleteMany({});
  res.json({
    success: true,
    message: "All transactions deleted"
  });
});

export default router;
