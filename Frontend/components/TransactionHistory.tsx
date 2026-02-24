import { useEffect, useState } from "react";
import { fetchTransactions } from "../services/backendService";

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchTransactions();
        if (res.success) {
          setTransactions(res.transactions || []);
        }
      } catch (err) {
        console.error("Transaction fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) return <div>Loading transactions...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Transactions</h2>

      {transactions.length === 0 ? (
        <p>No transactions found</p>
      ) : (
        <table className="w-full bg-white shadow rounded-xl">
          <thead>
            <tr className="bg-gray-200">
              <th>Date</th>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t._id}>
                <td>{new Date(t.date).toLocaleDateString()}</td>
                <td>{t.description}</td>
                <td style={{ color: t.amount < 0 ? "red" : "green" }}>
                  ₹{t.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}