import { useState } from "react";
import Dashboard from "./components/Dashboard";
import TransactionHistory from "./components/TransactionHistory";
import ForecastingView from "./components/ForecastingView";
import TaxingView from "./components/TaxingView";
import { wipeDatabase } from "./services/backendService";

export default function App() {
  const [active, setActive] = useState("dashboard");

  const renderView = () => {
    switch (active) {
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

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Fin</h1>

        <nav className="flex flex-col gap-4">
          <button onClick={() => setActive("dashboard")}>Dashboard</button>
          <button onClick={() => setActive("history")}>History</button>
          <button onClick={() => setActive("forecast")}>Forecast</button>
          <button onClick={() => setActive("tax")}>Tax</button>
        </nav>

        <button
          onClick={wipeDatabase}
          className="mt-10 text-red-600 text-sm"
        >
          Wipe Database
        </button>
      </aside>

      <main className="flex-1 p-8">{renderView()}</main>
    </div>
  );
}
