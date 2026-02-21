import { useEffect, useState } from "react";
import { fetchForecast } from "../services/backendService";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type Forecast = {
  success: boolean;
  monthlyCashflow: Record<string, number>;
  trend: string;
};

export default function ForecastingView() {
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadForecast() {
      try {
        const data = await fetchForecast();
        setForecast(data);
      } catch (error) {
        console.error("Forecast error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadForecast();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-gray-500">
        Loading forecast...
      </div>
    );
  }

  const chartData =
    forecast?.monthlyCashflow
      ? Object.entries(forecast.monthlyCashflow).map(
          ([month, value]) => ({
            month,
            value,
          })
        )
      : [];

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">
        Spending Forecast
      </h1>

      <div className="bg-white rounded-xl shadow p-6">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500">
            No forecast data available.
          </p>
        )}
      </div>

      {/* Trend Badge */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-2">
          Trend Analysis
        </h2>

        <span
          className={`px-4 py-2 rounded-full text-sm font-semibold ${
            forecast?.trend === "positive"
              ? "bg-green-100 text-green-700"
              : forecast?.trend === "negative"
              ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {forecast?.trend?.toUpperCase() ?? "NEUTRAL"}
        </span>
      </div>
    </div>
  );
}
