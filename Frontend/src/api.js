const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const ROOT_URL = BASE_URL.replace(/\/api\/?$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }

  return data;
}

/**
 * Render's free tier spins the backend down after inactivity, so the
 * first request after a while can take 30-50s instead of failing or
 * hanging silently. The app pings the root route once on load so it can
 * show an honest "waking up" message instead of looking broken.
 */
export function pingServer() {
  return fetch(ROOT_URL).then((res) => res.ok);
}

export function uploadStatement(file) {
  const formData = new FormData();
  formData.append("file", file);
  return request("/ingest/upload", { method: "POST", body: formData });
}

export function confirmTransactions(transactions) {
  return request("/transactions/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transactions }),
  });
}

export function getTransactions(page = 1, limit = 50) {
  return request(`/transactions?page=${page}&limit=${limit}`);
}

export function updateTransaction(id, updates) {
  return request(`/transactions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
}

export function deleteTransaction(id) {
  return request(`/transactions/${id}`, { method: "DELETE" });
}

export function getDashboard() {
  return request("/analysis/dashboard");
}
