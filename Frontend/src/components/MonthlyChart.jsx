import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#1f7a53", "#2f9e73", "#6fbf9b", "#a6d6bf", "#c0392b", "#e08e7d", "#f4b183", "#8e8e8e"];

/**
 * The backend returns one flat row per (month, category) pair. Recharts'
 * stacked bars expect one row per month with a key per category instead,
 * so this reshapes it before rendering.
 */
function pivotByMonth(rows) {
  const months = new Map();
  const categories = new Set();

  for (const row of rows) {
    categories.add(row.category);
    if (!months.has(row.month)) months.set(row.month, { month: row.month });
    months.get(row.month)[row.category] = row.total;
  }

  return {
    data: [...months.values()].sort((a, b) => a.month.localeCompare(b.month)),
    categories: [...categories],
  };
}

export default function MonthlyChart({ monthlyCategory }) {
  if (!monthlyCategory || monthlyCategory.length === 0) {
    return <p className="hint">No monthly data yet — upload a statement to see this.</p>;
  }

  const { data, categories } = pivotByMonth(monthlyCategory);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip formatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`} />
        <Legend />
        {categories.map((category, index) => (
          <Bar key={category} dataKey={category} stackId="spend" fill={COLORS[index % COLORS.length]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
