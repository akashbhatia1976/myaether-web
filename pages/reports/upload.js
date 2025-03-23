// pages/reports/upload.js
import React, { useState } from "react";
import { useRouter } from "next/router";

export default function UploadReportPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [reportDate, setReportDate] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  const handleFileChange = (e) => {
    const picked = e.target.files[0];
    setFile(picked);
    setMessage(picked ? `✅ File selected: ${picked.name}` : "");
  };

  const handleUpload = async () => {
    if (!userId || !reportDate || !file) {
      alert("Please fill in all fields and select a file.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("reportDate", reportDate);
      formData.append("file", file);

      const res = await fetch(`${API_BASE_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.reportId) {
        setMessage("✅ Report uploaded successfully!");
        setFile(null);
        setReportDate("");
        router.push(`/reports/reportdetails?reportId=${data.reportId}&userId=${userId}`);
      } else {
        throw new Error(data.message || "Upload failed.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Upload Report</h1>

      <input
        style={styles.input}
        type="text"
        placeholder="Enter User ID"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
      />

      <input
        style={styles.input}
        type="text"
        placeholder="Enter Report Date (YYYY-MM-DD)"
        value={reportDate}
        onChange={(e) => setReportDate(e.target.value)}
      />

      <input type="file" accept=".pdf,image/*" onChange={handleFileChange} style={{ marginBottom: 10 }} />

      <button style={styles.button} onClick={handleUpload} disabled={loading}>
        {loading ? "Uploading..." : "Upload Report"}
      </button>

      {message && (
        <p style={{ color: message.includes("✅") ? "green" : "red", marginTop: 10 }}>{message}</p>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "600px",
    margin: "auto",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f8f8f8",
    borderRadius: "8px",
  },
  header: {
    textAlign: "center",
    color: "#6200ee",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
    border: "1px solid #ccc",
    borderRadius: "5px",
  },
  button: {
    backgroundColor: "#6200ee",
    color: "white",
    padding: "10px 20px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};
