import { useEffect, useState } from "react";
import FileUpload from "./FileUpload";
import CategoryPieChart from "../CategoryPieChart";

import {
  fetchHealth,
  fetchTransactions,
  fetchForecast,
  fetchCategoryBreakdown,
} from "../services/backendService";

type Health = {
  success: boolean;
  score: number;
  status: string;
};

type Forecast = {
  success: boolean;
  monthlyCashflow: Record<string, number>;
  trend: string;
};

type Transaction = {
  _id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
};

export default function Dashboard() {
  const [health, setHealth] = useState<Health | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [
          healthData,
          forecastData,
          txData,
          categoryData,
        ] = await Promise.all([
          fetchHealth(),
          fetchForecast(),
          fetchTransactions(),
          fetchCategoryBreakdown(),
        ]);

        setHealth(healthData);
        setForecast(forecastData);
        setTransactions(txData.data || []);
        setCategories(categoryData.data || []);
      } catch (error) {
        console.error("Dashboard load error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const totalTransactions = transactions.length;

  const netCashFlow = transactions.reduce(
    (sum, t) => sum + t.amount,
    0
  );

  const avgTransaction =
    totalTransactions > 0
      ? netCashFlow / totalTransactions
      : 0;

  if (loading) {
    return (
      <div className="p-8 text-gray-500">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">

      {/* Upload Section */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">
          Upload Bank Statement
        </h2>
        <FileUpload />
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* Health */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow p-6">
          <h3 className="text-sm opacity-80">
            Financial Health
          </h3>
          <p className="text-4xl font-bold mt-2">
            {health?.score ?? 0}
          </p>
          <p className="mt-2 text-sm">
            {health?.status ?? "Unknown"}
          </p>
        </div>

        {/* Total Transactions */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-sm text-gray-500">
            Total Transactions
          </h3>
          <p className="text-3xl font-semibold mt-2">
            {totalTransactions}
          </p>
        </div>

        {/* Net Cash Flow */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-sm text-gray-500">
            Net Cash Flow
          </h3>
          <p
            className={`text-3xl font-semibold mt-2 ${
              netCashFlow >= 0
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            ₹ {netCashFlow.toFixed(2)}
          </p>
        </div>

        {/* Average Transaction */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-sm text-gray-500">
            Avg Transaction
          </h3>
          <p className="text-3xl font-semibold mt-2">
            ₹ {avgTransaction.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Forecast Section */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">
          Monthly Cashflow Forecast
        </h2>

        {forecast?.monthlyCashflow &&
        Object.keys(forecast.monthlyCashflow).length > 0 ? (
          <div className="space-y-2">
            {Object.entries(
              forecast.monthlyCashflow
            ).map(([month, value]) => (
              <div
                key={month}
                className="flex justify-between border-b pb-2"
              >
                <span>{month}</span>
                <span
                  className={
                    value >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  ₹ {value.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">
            No forecast data available.
          </p>
        )}

        <div className="mt-4 text-sm text-gray-500">
          Trend:{" "}
          <span className="font-semibold text-black">
            {forecast?.trend?.toUpperCase() ??
              "NEUTRAL"}
          </span>
        </div>
      </div>

      {/* Category Breakdown */}
      <CategoryPieChart data={categories} />

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">
          Recent Transactions
        </h2>

        {transactions.length === 0 ? (
          <p className="text-gray-500">
            No transactions available.
          </p>
        ) : (
          <div className="space-y-3">
            {transactions.slice(0, 10).map((tx) => (
              <div
                key={tx._id}
                className="flex justify-between border-b pb-2"
              >
                <div>
                  <p className="font-medium">
                    {tx.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(tx.date).toLocaleDateString()} •{" "}
                    {tx.category}
                  </p>
                </div>

                <p
                  className={`font-semibold ${
                    tx.amount >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  ₹ {tx.amount.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}