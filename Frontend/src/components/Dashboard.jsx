import { useEffect, useState } from "react";
import { getDashboard } from "../api.js";
import UploadCard from "./UploadCard.jsx";
import PreviewTable from "./PreviewTable.jsx";
import MetricCards from "./MetricCards.jsx";
import CategoryChart from "./CategoryChart.jsx";
import MonthlyChart from "./MonthlyChart.jsx";
import InsightCard from "./InsightCard.jsx";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);

  async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      const result = await getDashboard();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const hasAnyTransactions = data && (data.core?.totalCredit > 0 || data.core?.totalDebit > 0);

  return (
    <div>
      <UploadCard onPreviewReady={setPreview} />

      {preview && (
        <PreviewTable
          previewResult={preview}
          onCancel={() => setPreview(null)}
          onConfirmed={() => {
            setPreview(null);
            loadDashboard();
          }}
        />
      )}

      {loading && <p className="loading-state">Loading your dashboard…</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && data && !hasAnyTransactions && (
        <div className="empty-state">Upload your first bank statement above to see your spending here.</div>
      )}

      {!loading && !error && data && hasAnyTransactions && (
        <>
          <MetricCards core={data.core} />

          <div className="card">
            <h2>Spending by Category</h2>
            <CategoryChart categories={data.categories} />
          </div>

          <div className="card">
            <h2>Monthly Spending</h2>
            <MonthlyChart monthlyCategory={data.monthlyCategory} />
          </div>

          <InsightCard insight={data.insight} />
        </>
      )}
    </div>
  );
}
