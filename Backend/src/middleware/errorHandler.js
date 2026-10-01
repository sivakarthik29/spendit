export function errorHandler(err, req, res, next) {
  console.error("Server error:", err.message);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ success: false, error: "File is too large (max 5MB)" });
  }

  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal server error",
  });
}
