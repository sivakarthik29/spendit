export function calculateForecast(transactions) {
  const monthly = {};

  transactions.forEach((t) => {
    const month = t.date.slice(0, 7);
    monthly[month] = (monthly[month] || 0) + t.amount;
  });

  const values = Object.values(monthly);
  const trend =
    values.length > 1
      ? values[values.length - 1] > values[values.length - 2]
        ? "positive"
        : "negative"
      : "neutral";

  return {
    monthlyCashflow: monthly,
    trend
  };
}
