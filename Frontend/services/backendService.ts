const API_URL = import.meta.env.VITE_API_URL;

/* ===============================
   HEALTH
================================= */
export async function fetchHealth() {
  const res = await fetch(`${API_URL}/analysis/health`);
  if (!res.ok) throw new Error("Failed to fetch health");
  return res.json();
}

/* ===============================
   FORECAST
================================= */
export async function fetchForecast() {
  const res = await fetch(`${API_URL}/analysis/forecast`);
  if (!res.ok) throw new Error("Failed to fetch forecast");
  return res.json();
}

/* ===============================
   TRANSACTIONS
================================= */
export async function fetchTransactions() {
  const res = await fetch(`${API_URL}/transactions`);
  if (!res.ok) throw new Error("Failed to fetch transactions");
  return res.json();
}

/* ===============================
   WIPE DATABASE
================================= */
export async function wipeDatabase() {
  const res = await fetch(`${API_URL}/transactions/wipe`, {
    method: "DELETE",
  });

  if (!res.ok) throw new Error("Failed to wipe database");

  return res.json();
}

/* ===============================
   Category Breakdown
================================= */
export async function fetchCategoryBreakdown() {
  const res = await fetch(`${API_URL}/analysis/categories`);
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

/* ===============================
   UPLOAD STATEMENT (CORRECT)
================================= */
export async function uploadStatement(file: File) {
  const formData = new FormData();

  // MUST match multer field name
  formData.append("file", file);

  const res = await fetch(`${API_URL}/ingest`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Upload failed");
  }

  return data;
}
