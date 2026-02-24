import { useEffect, useState } from "react";
import {
  fetchDashboard,
  uploadStatement,
} from "../services/backendService";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#ef4444", "#8b5cf6"];

const formatCurrency = (value: number) =>
  `₹ ${value?.toLocaleString("en-IN")}`;

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetchDashboard();
      setData(res);
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file");
      return;
    }

    try {
      setUploading(true);
      await uploadStatement(file);
      await loadDashboard();
      setFile(null);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500">Loading dashboard...</div>;
  }

  const { core, health, categories, monthlyCategory, insights } =
    data || {};

  const monthlyGrouped =
    monthlyCategory?.reduce((acc: any, item: any) => {
      if (!acc[item.month]) {
        acc[item.month] = { month: item.month, total: 0 };
      }
      acc[item.month].total += item.total;
      return acc;
    }, {}) || {};

  const monthlyData = Object.values(monthlyGrouped);

  const healthColor =
    health?.score > 70
      ? "bg-green-600"
      : health?.score > 40
      ? "bg-yellow-500"
      : "bg-red-600";

  const cleanInsight = insights
    ?.replace(/^Okay,.*?\*\*\n\n/s, "")
    ?.slice(0, 500);

  return (
    <div className="space-y-8">

      {/* Upload Section */}
      <div className="bg-white p-6 rounded-xl shadow flex items-center gap-4">
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {uploading ? "Processing..." : "Upload"}
        </button>
      </div>

      {/* Core Cards */}
      <div className="grid grid-cols-4 gap-6">
        <MetricCard
          title="Total Credited"
          value={formatCurrency(core?.totalCredit ?? 0)}
          positive
        />
        <MetricCard
          title="Total Spent"
          value={formatCurrency(core?.totalDebit ?? 0)}
        />
        <MetricCard
          title="Net Cash Flow"
          value={formatCurrency(core?.netCashFlow ?? 0)}
          positive={core?.netCashFlow >= 0}
        />
        <div className={`rounded-xl shadow p-6 text-white ${healthColor}`}>
          <h2 className="text-sm opacity-80">Financial Health</h2>
          <p className="text-3xl font-bold">{health?.score ?? 0}</p>
          <p>{health?.status}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold mb-4">Spending Distribution</h2>
          {categories?.length ? (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="total"
                  nameKey="category"
                  label={false}
                  outerRadius={120}
                >
                  {categories.map((_: any, index: number) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400">No data available</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold mb-4">Monthly Spending</h2>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(v) => `₹ ${v}`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="total" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="font-semibold mb-4">AI Financial Insights</h2>
        <p className="text-gray-700 whitespace-pre-line">
          {cleanInsight || "No AI insights generated yet."}
        </p>
      </div>
    </div>
  );
}

function MetricCard({ title, value, positive }: any) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-sm text-gray-500">{title}</h2>
      <p
        className={`text-2xl font-bold ${
          positive ? "text-green-600" : "text-red-600"
        }`}
      >
        {value}
      </p>
    </div>
  );
}