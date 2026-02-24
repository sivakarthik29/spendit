const BASE_URL: string =
  import.meta.env.VITE_API_URL || "http://localhost:4000/api";

/* =======================================================
   GENERIC REQUEST HANDLER (Production Safe)
======================================================= */

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...(options.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...options.headers,
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "API request failed");
    }

    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }

    return {} as T;
  } catch (error: any) {
    console.error("API Error:", error.message);
    throw error;
  }
}

/* =======================================================
   DASHBOARD
======================================================= */

export const fetchDashboard = async () => {
  return request<any>("/analysis/dashboard");
};

/* =======================================================
   FORECAST
======================================================= */

export const fetchForecast = async () => {
  return request<any>("/analysis/forecast");
};

/* =======================================================
   TRANSACTIONS
======================================================= */

export const fetchTransactions = async () => {
  return request<any>("/transactions");
};

/* =======================================================
   FILE UPLOAD
======================================================= */

export const uploadStatement = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  return request<any>("/ingest/upload", {
    method: "POST",
    body: formData,
  });
};

/* =======================================================
   WIPE DATABASE
======================================================= */

export const wipeDatabase = async () => {
  return request<any>("/analysis/wipe", {
    method: "DELETE",
  });
};