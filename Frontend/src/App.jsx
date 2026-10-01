import { useEffect, useState } from "react";
import Nav from "./components/Nav.jsx";
import Dashboard from "./components/Dashboard.jsx";
import TransactionsView from "./components/TransactionsView.jsx";
import { pingServer } from "./api.js";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [wakingUp, setWakingUp] = useState(true);
  const [slowWake, setSlowWake] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Render's free tier spins the backend down when idle, so the first
    // load after a while can take 30-50s. Rather than let the dashboard
    // fetch fail (or hang) with no explanation, ping the server once up
    // front and show an honest "waking up" message while it comes online.
    const slowTimer = setTimeout(() => {
      if (!cancelled) setSlowWake(true);
    }, 5000);

    pingServer()
      .catch(() => {}) // if the ping itself fails, let the real page load and surface its own error
      .finally(() => {
        if (!cancelled) setWakingUp(false);
        clearTimeout(slowTimer);
      });

    return () => {
      cancelled = true;
      clearTimeout(slowTimer);
    };
  }, []);

  if (wakingUp) {
    return (
      <div className="loading-screen">
        <strong>Starting up SpendIt…</strong>
        <span>
          {slowWake
            ? "Still waking up the server — free hosting spins down when idle, this can take up to a minute."
            : "One moment…"}
        </span>
      </div>
    );
  }

  return (
    <>
      <Nav activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="container">
        {activeTab === "dashboard" ? <Dashboard /> : <TransactionsView />}
      </div>
    </>
  );
}
