import { useState } from "react";
import { confirmTransactions } from "../api.js";

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

function toDateInputValue(value) {
  return String(value).slice(0, 10);
}

export default function PreviewTable({ previewResult, onCancel, onConfirmed }) {
  const [rows, setRows] = useState(
    previewResult.preview.map((tx, index) => ({ ...tx, _key: index }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateRow(key, field, value) {
    setRows((prev) => prev.map((row) => (row._key === key ? { ...row, [field]: value } : row)));
  }

  function removeRow(key) {
    setRows((prev) => prev.filter((row) => row._key !== key));
  }

  async function handleConfirm() {
    if (!rows.length || saving) return;

    setSaving(true);
    setError("");

    try {
      // eslint-disable-next-line no-unused-vars
      const cleaned = rows.map(({ _key, ...tx }) => ({ ...tx, amount: Number(tx.amount) }));
      const result = await confirmTransactions(cleaned);
      onConfirmed(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <h2>Review Before Saving</h2>
      <p className="hint">
        {rows.length} transaction{rows.length === 1 ? "" : "s"} ready to save.
        {previewResult.skipped > 0 && ` ${previewResult.skipped} row(s) skipped (couldn't be read reliably).`}
        {previewResult.duplicatesRemoved > 0 &&
          ` ${previewResult.duplicatesRemoved} duplicate row(s) removed automatically.`}
      </p>

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
            {rows.map((row) => (
              <tr key={row._key}>
                <td>
                  <input
                    type="date"
                    value={toDateInputValue(row.date)}
                    onChange={(e) => updateRow(row._key, "date", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={row.description}
                    onChange={(e) => updateRow(row._key, "description", e.target.value)}
                  />
                </td>
                <td>
                  <select
                    value={row.category}
                    onChange={(e) => updateRow(row._key, "category", e.target.value)}
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
                    value={row.amount}
                    onChange={(e) => updateRow(row._key, "amount", e.target.value)}
                  />
                </td>
                <td>
                  <button className="btn secondary small" onClick={() => removeRow(row._key)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="upload-row" style={{ marginTop: "1rem" }}>
        <button className="btn" onClick={handleConfirm} disabled={!rows.length || saving}>
          {saving ? "Saving…" : `Save ${rows.length} Transaction${rows.length === 1 ? "" : "s"}`}
        </button>
        <button className="btn secondary" onClick={onCancel} disabled={saving}>
          Discard
        </button>
      </div>
    </div>
  );
}
