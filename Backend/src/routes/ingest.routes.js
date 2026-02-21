import express from "express";
import multer from "multer";
import { ingestPdf } from "../services/ingest.service.js";

const router = express.Router();
const upload = multer();

router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const result = await ingestPdf(req.file.buffer);

    res.json(result);

  } catch (err) {
    console.error("🔥 UPLOAD ROUTE ERROR:", err.message);

    res.status(500).json({
      error: "Failed to process statement",
      message: err.message
    });
  }
});

export default router;
