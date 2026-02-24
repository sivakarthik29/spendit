import { useEffect, useState } from "react";
import { fetchForecast } from "../services/backendService";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ForecastItem {
  month: string;
  predicted: number;
}

const formatCurrency = (value: number) =>
  `₹ ${value?.toLocaleString("en-IN")}`;

export default function ForecastingView() {
  const [forecastData, setForecastData] = useState<ForecastItem[]>([]);
  const [trend, setTrend] = useState<string>("neutral");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadForecast = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetchForecast();

      if (!res || !Array.isArray(res.forecast)) {
        setForecastData([]);
        return;
      }

      setForecastData(res.forecast);
      setTrend(res.trend || "neutral");
    } catch (err: any) {
      console.error("Forecast fetch error:", err);
      setError("Unable to load forecast data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForecast();
  }, []);

  if (loading) {
    return <div className="p-8 text-gray-500">Loading forecast...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">{error}</div>;
  }

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Spending Forecast</h1>

      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold">Projected Monthly Spending</h2>
          <span
            className={`px-3 py-1 rounded text-sm font-medium ${
              trend === "increasing"
                ? "bg-red-100 text-red-600"
                : trend === "decreasing"
                ? "bg-green-100 text-green-600"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            Trend: {trend}
          </span>
        </div>

        {forecastData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(v) => `₹ ${v}`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-400 text-center py-8">
            No forecast data available.
          </p>
        )}
      </div>
    </div>
  );
}