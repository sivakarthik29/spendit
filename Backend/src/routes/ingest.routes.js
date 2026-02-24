import express from "express";
import multer from "multer";
import { ingestStatement } from "../services/ingest.service.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const result = await ingestStatement(req.file.buffer);

    res.json({
      success: true,
      message: "Upload successful",
      inserted: result.inserted,
    });
  } catch (err) {
    console.error("Ingest error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;