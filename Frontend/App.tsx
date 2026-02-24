import { useState } from "react";
import Dashboard from "./components/Dashboard";
import TransactionHistory from "./components/TransactionHistory";
import ForecastingView from "./components/ForecastingView";
import TaxingView from "./components/TaxingView";

type View = "dashboard" | "history" | "forecast" | "tax";

export default function App() {
  const [activeView, setActiveView] = useState<View>("dashboard");

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <Dashboard />;

      case "history":
        return <TransactionHistory />;

      case "forecast":
        return <ForecastingView />;

      case "tax":
        return <TaxingView />;

      default:
        return <Dashboard />;
    }
  };

  const NavButton = ({
    label,
    value,
  }: {
    label: string;
    value: View;
  }) => (
    <button
      onClick={() => setActiveView(value)}
      className={`block w-full text-left px-4 py-2 rounded ${
        activeView === value
          ? "bg-blue-600 text-white"
          : "hover:bg-gray-100"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Fin</h1>

        <div className="space-y-2">
          <NavButton label="Dashboard" value="dashboard" />
          <NavButton label="History" value="history" />
          <NavButton label="Forecast" value="forecast" />
          <NavButton label="Tax" value="tax" />
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-8">{renderView()}</main>
    </div>
  );
}