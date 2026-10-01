export default function InsightCard({ insight }) {
  return (
    <div className="card">
      <h2>Insight</h2>
      <p className="insight-text">{insight || "Upload a statement to see insights here."}</p>
    </div>
  );
}
