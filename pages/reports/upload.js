// pages/reports/upload.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function UploadReport() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [reportDate, setReportDate] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      router.push("/auth/login");
    } else {
      setUserId(storedUserId);
    }
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage("");
  };

  const handleUpload = async () => {
    if (!reportDate || !file) {
      setMessage("Please enter report date and select a file.");
      return;
    }

    try {
      setIsLoading(true);
      setMessage("");

      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("reportDate", reportDate);
      formData.append("file", file);
      formData.append("autoCreateUser", "true");

      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Upload failed");

      setMessage("✅ Upload successful! Redirecting...");
      router.push(`/reports/reportdetails?reportId=${data.reportId}&userId=${userId}`);
    } catch (error) {
      console.error("Upload error:", error);
      setMessage(`❌ ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1>📤 Upload Report</h1>
      <p><strong>User ID:</strong> {userId}</p>

      <label>Date of Report:</label>
      <input
        type="date"
        value={reportDate}
        onChange={(e) => setReportDate(e.target.value)}
        style={styles.input}
      />

      <label>Select File:</label>
      <input type="file" accept=".pdf,image/*" onChange={handleFileChange} style={styles.input} />

      <button onClick={handleUpload} disabled={isLoading} style={styles.button}>
        {isLoading ? "Uploading..." : "Upload"}
      </button>

      {message && <p style={{ marginTop: 10 }}>{message}</p>}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "600px",
    margin: "auto",
    padding: 20,
    fontFamily: "Arial",
  },
  input: {
    width: "100%",
    marginBottom: 15,
    padding: 10,
    borderRadius: 4,
    border: "1px solid #ccc",
  },
  button: {
    padding: 10,
    backgroundColor: "#4361ee",
    color: "white",
    border: "none",
    borderRadius: 5,
    cursor: "pointer",
  },
};

