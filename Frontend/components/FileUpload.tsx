import { useState } from "react";
import { uploadStatement } from "../services/backendService";

export default function FileUpload() {
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      await uploadStatement(file);
      alert("Upload successful");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-lg font-semibold mb-3">Upload Bank Statement</h2>
      <input type="file" accept=".pdf,.csv" onChange={handleUpload} />
      {loading && <p className="text-blue-500 mt-2">Processing...</p>}
    </div>
  );
}
