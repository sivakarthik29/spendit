import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#1f7a53", "#2f9e73", "#6fbf9b", "#a6d6bf", "#c0392b", "#e08e7d", "#f4b183", "#8e8e8e"];

export default function CategoryChart({ categories }) {
  if (!categories || categories.length === 0) {
    return <p className="hint">No category data yet — upload a statement to see this.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={categories}
          dataKey="total"
          nameKey="category"
          cx="50%"
          cy="50%"
          outerRadius={90}
          label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
        >
          {categories.map((entry, index) => (
            <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
