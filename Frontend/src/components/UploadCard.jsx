import { useState } from "react";
import { uploadStatement } from "../api.js";

export default function UploadCard({ onPreviewReady }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload() {
    if (!file || uploading) return;

    setUploading(true);
    setError("");

    try {
      const result = await uploadStatement(file);
      onPreviewReady(result);
      setFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="card">
      <h2>Upload a Statement</h2>
      <div className="upload-row">
        <input
          type="file"
          accept=".pdf,.csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          disabled={uploading}
        />
        <button className="btn" onClick={handleUpload} disabled={!file || uploading}>
          {uploading ? "Extracting…" : "Upload & Extract"}
        </button>
      </div>
      <p className="hint">
        PDF or CSV bank statement. Nothing is saved until you review and confirm below.
        {uploading && " Larger statements can take a minute — transactions are extracted in batches."}
      </p>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
