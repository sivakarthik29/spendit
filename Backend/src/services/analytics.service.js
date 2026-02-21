import Transaction from "../models/Transaction.model.js";

/* ======================================================
   HEALTH SCORE
====================================================== */
export function calculateHealthScore(transactions) {
  if (!transactions.length) {
    return { score: 50, status: "Fair" };
  }

  const totalIncome = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  if (totalIncome === 0 && totalExpense > 0) {
    return { score: 30, status: "Poor" };
  }

  const savingsRate =
    totalIncome === 0
      ? 0
      : (totalIncome - totalExpense) / totalIncome;

  let score = Math.round(50 + savingsRate * 50);
  score = Math.max(0, Math.min(100, score));

  let status = "Fair";
  if (score >= 75) status = "Excellent";
  else if (score >= 60) status = "Good";
  else if (score < 40) status = "Poor";

  return { score, status };
}

/* ======================================================
   MONTHLY FORECAST (BAR GRAPH DATA)
====================================================== */
export function generateForecast(transactions) {
  const monthlyCashflow = {};

  for (const tx of transactions) {
    const dateObj = new Date(tx.date);

    if (isNaN(dateObj)) continue;

    // Extract only YYYY-MM (no T00:00:00.000Z)
    const month = dateObj.toISOString().slice(0, 7);

    if (!monthlyCashflow[month]) {
      monthlyCashflow[month] = 0;
    }

    monthlyCashflow[month] += tx.amount;
  }

  // Fix floating precision
  Object.keys(monthlyCashflow).forEach((key) => {
    monthlyCashflow[key] = Number(
      monthlyCashflow[key].toFixed(2)
    );
  });

  const values = Object.values(monthlyCashflow);

  let trend = "neutral";
  if (values.length >= 2) {
    const last = values[values.length - 1];
    const prev = values[values.length - 2];

    if (last > prev) trend = "positive";
    else if (last < prev) trend = "negative";
  }

  return { monthlyCashflow, trend };
}

/* ======================================================
   CATEGORY BREAKDOWN (PIE CHART DATA)
====================================================== */
export async function getCategoryBreakdown() {
  const result = await Transaction.aggregate([
    { $match: { amount: { $lt: 0 } } }, // Only expenses
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

  return result;
}