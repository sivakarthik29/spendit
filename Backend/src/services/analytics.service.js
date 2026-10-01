import Transaction from "../models/Transaction.model.js";

export function computeCoreMetrics(transactions) {
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

export async function getCategoryBreakdown() {
  return Transaction.aggregate([
    { $match: { amount: { $lt: 0 } } },
    { $group: { _id: "$category", total: { $sum: { $abs: "$amount" } } } },
    { $project: { category: "$_id", total: { $round: ["$total", 2] }, _id: 0 } },
    { $sort: { total: -1 } },
  ]);
}

export async function getMonthlyCategorySpending() {
  return Transaction.aggregate([
    { $match: { amount: { $lt: 0 } } },
    {
      $group: {
        _id: {
          month: { $dateToString: { format: "%Y-%m", date: "$date" } },
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
