export default function Nav({ activeTab, onTabChange }) {
  return (
    <div className="nav">
      <div className="nav-inner">
        <div className="brand">
          Spend<span>It</span>
        </div>
        <div className="tabs">
          <button
            className={`tab ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => onTabChange("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={`tab ${activeTab === "transactions" ? "active" : ""}`}
            onClick={() => onTabChange("transactions")}
          >
            Transactions
          </button>
        </div>
      </div>
    </div>
  );
}
