import dotenv from "dotenv";
dotenv.config(); // MUST be first

import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import ingestRoutes from "./routes/ingest.routes.js";
import transactionsRoutes from "./routes/transactions.routes.js";
import analysisRoutes from "./routes/analysis.routes.js";

const app = express();

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;

console.log("🔑 GEMINI_API_KEY loaded:", !!process.env.GEMINI_API_KEY);

/* ===============================
   MIDDLEWARE
================================= */
app.use(cors());
app.use(express.json());

/* ===============================
   DATABASE
================================= */
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

/* ===============================
   ROUTES
================================= */
app.use("/api/ingest", ingestRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/analysis", analysisRoutes);

app.get("/", (req, res) => {
  res.json({ status: "Backend running" });
});

/* ===============================
   START SERVER
================================= */
app.listen(PORT, () => {
  console.log("=================================");
  console.log(`🚀 Server running on port ${PORT}`);
  console.log("=================================");
});
