// Backend/src/services/forecast.service.js

export function calculateForecast(transactions) {
  if (!transactions || transactions.length === 0) {
    return {
      forecast: [],
      trend: "neutral",
    };
  }

  const monthlyMap = {};

  transactions.forEach((t) => {
    const month = new Date(t.date).toISOString().slice(0, 7);

    // Only count debit (spending) for forecast
    if (t.amount < 0) {
      monthlyMap[month] = (monthlyMap[month] || 0) + Math.abs(t.amount);
    }
  });

  const sortedMonths = Object.keys(monthlyMap).sort();

  const monthlyCashflow = sortedMonths.map((m) => ({
    month: m,
    predicted: Number(monthlyMap[m].toFixed(2)),
  }));

  let trend = "neutral";

  if (monthlyCashflow.length >= 2) {
    const last = monthlyCashflow[monthlyCashflow.length - 1].predicted;
    const prev = monthlyCashflow[monthlyCashflow.length - 2].predicted;
    trend = last >= prev ? "increasing" : "decreasing";
  }

  return {
    forecast: monthlyCashflow,
    trend,
  };
}