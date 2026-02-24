import Transaction from "../models/Transaction.model.js";

export function calculateCoreMetrics(transactions) {
  let totalCredit = 0;
  let totalDebit = 0;

  for (const tx of transactions) {
    if (tx.amount > 0) totalCredit += tx.amount;
    else totalDebit += Math.abs(tx.amount);
  }

  return {
    totalCredit: Number(totalCredit.toFixed(2)),
    totalDebit: Number(totalDebit.toFixed(2)),
    netCashFlow: Number((totalCredit - totalDebit).toFixed(2)),
  };
}

export function calculateHealthScore(transactions) {
  const { totalCredit, totalDebit } =
    calculateCoreMetrics(transactions);

  if (!transactions.length) {
    return { score: 50, status: "Fair" };
  }

  const savingsRate =
    totalCredit === 0 ? 0 : (totalCredit - totalDebit) / totalCredit;

  let score = Math.round(50 + savingsRate * 50);
  score = Math.max(0, Math.min(100, score));

  let status = "Fair";
  if (score >= 75) status = "Excellent";
  else if (score >= 60) status = "Good";
  else if (score < 40) status = "Poor";

  return { score, status };
}

export async function getCategoryBreakdown() {
  return await Transaction.aggregate([
    { $match: { amount: { $lt: 0 } } },
    {
      $group: {
        _id: "$category",
        total: { $sum: { $abs: "$amount" } },
      },
    },
    {
      $project: {
        category: "$_id",
        total: { $round: ["$total", 2] },
        _id: 0,
      },
    },
    { $sort: { total: -1 } },
  ]);
}

export async function getMonthlyCategorySpending() {
  return await Transaction.aggregate([
    { $match: { amount: { $lt: 0 } } },
    {
      $group: {
        _id: {
          month: {
            $dateToString: { format: "%Y-%m", date: "$date" },
          },
          category: "$category",
        },
        total: { $sum: { $abs: "$amount" } },
      },
    },
    {
      $project: {
        month: "$_id.month",
        category: "$_id.category",
        total: { $round: ["$total", 2] },
        _id: 0,
      },
    },
    { $sort: { month: 1 } },
  ]);
}