import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import connectDB from "./config/db.js";

import ingestRoutes from "./routes/ingest.routes.js";
import transactionsRoutes from "./routes/transactions.routes.js";
import analysisRoutes from "./routes/analysis.routes.js";

/* ========================================
   ENV CONFIG
======================================== */
dotenv.config();

/* ========================================
   APP INIT
======================================== */
const app = express();
const PORT = process.env.PORT || 4000;

/* ========================================
   DATABASE CONNECTION
======================================== */
connectDB();

/* ========================================
   SECURITY MIDDLEWARE
======================================== */
app.use(helmet());
app.use(morgan("dev"));

/* ========================================
   CORS CONFIG (PRODUCTION SAFE)
======================================== */
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow server-to-server requests or Postman
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(
          new Error(`CORS blocked for origin: ${origin}`)
        );
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

/* ========================================
   BODY PARSER
======================================== */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* ========================================
   HEALTH CHECK
======================================== */
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Finance Backend Running",
  });
});

/* ========================================
   API ROUTES
======================================== */
app.use("/api/ingest", ingestRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/analysis", analysisRoutes);

/* ========================================
   404 HANDLER
======================================== */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

/* ========================================
   GLOBAL ERROR HANDLER
======================================== */
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.message);

  res.status(500).json({
    success: false,
    error: err.message || "Internal Server Error",
  });
});

/* ========================================
   SERVER START
======================================== */
app.listen(PORT, () => {
  console.log("=====================================");
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("=====================================");
});