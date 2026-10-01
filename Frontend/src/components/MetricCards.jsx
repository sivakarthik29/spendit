function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export default function MetricCards({ core }) {
  const net = core?.netCashFlow ?? 0;

  return (
    <div className="metrics">
      <div className="metric">
        <div className="label">Total Credit</div>
        <div className="value positive">{formatCurrency(core?.totalCredit)}</div>
      </div>
      <div className="metric">
        <div className="label">Total Debit</div>
        <div className="value negative">{formatCurrency(core?.totalDebit)}</div>
      </div>
      <div className="metric">
        <div className="label">Net Cash Flow</div>
        <div className={`value ${net >= 0 ? "positive" : "negative"}`}>
          {formatCurrency(net)}
        </div>
      </div>
    </div>
  );
}
