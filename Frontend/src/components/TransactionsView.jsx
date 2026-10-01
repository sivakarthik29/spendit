import { useEffect, useState } from "react";
import { getTransactions, updateTransaction, deleteTransaction } from "../api.js";

const CATEGORIES = [
  "Food",
  "Shopping",
  "Rent",
  "Utilities",
  "Transport",
  "Entertainment",
  "Income",
  "ATM",
  "UPI",
  "Other",
];

const PAGE_SIZE = 20;

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function TransactionsView() {
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});

  async function load() {
    setLoading(true);
    setError("");
    try {
      const result = await getTransactions(page, PAGE_SIZE);
      setTransactions(result.transactions);
      setTotal(result.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function startEdit(tx) {
    setEditingId(tx._id);
    setDraft({
      date: String(tx.date).slice(0, 10),
      description: tx.description,
      category: tx.category,
      amount: tx.amount,
    });
  }

  async function saveEdit(id) {
    try {
      const result = await updateTransaction(id, {
        ...draft,
        amount: Number(draft.amount),
      });
      setTransactions((prev) => prev.map((t) => (t._id === id ? result.transaction : t)));
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeTransaction(id) {
    if (!window.confirm("Delete this transaction?")) return;
    try {
      await deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t._id !== id));
      setTotal((prev) => prev - 1);
    } catch (err) {
      setError(err.message);
    }
  }

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <div className="card">
      <h2>Transactions</h2>

      {loading && <p className="loading-state">Loading transactions…</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && transactions.length === 0 && (
        <div className="empty-state">No transactions yet — upload a statement from the Dashboard tab.</div>
      )}

      {!loading && transactions.length > 0 && (
        <>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isEditing = editingId === tx._id;
                  return (
                    <tr key={tx._id}>
                      {isEditing ? (
                        <>
                          <td>
                            <input
                              type="date"
                              value={draft.date}
                              onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={draft.description}
                              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                            />
                          </td>
                          <td>
                            <select
                              value={draft.category}
                              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                            >
                              {CATEGORIES.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              type="number"
                              value={draft.amount}
                              onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
                            />
                          </td>
                          <td className="row-actions">
                            <button className="btn small" onClick={() => saveEdit(tx._id)}>
                              Save
                            </button>
                            <button className="btn secondary small" onClick={() => setEditingId(null)}>
                              Cancel
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{formatDate(tx.date)}</td>
                          <td>{tx.description}</td>
                          <td>
                            <span className="category-pill">{tx.category}</span>
                          </td>
                          <td className={`amount ${tx.amount >= 0 ? "positive" : "negative"}`}>
                            ₹{Math.abs(tx.amount).toLocaleString("en-IN")}
                          </td>
                          <td className="row-actions">
                            <button className="btn secondary small" onClick={() => startEdit(tx)}>
                              Edit
                            </button>
                            <button className="btn danger small" onClick={() => removeTransaction(tx._id)}>
                              Delete
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button
              className="btn secondary small"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              className="btn secondary small"
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
