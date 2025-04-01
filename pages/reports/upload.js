// pages/reports/upload.js

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getUserDetails, uploadReport } from "../../utils/apiService";

export default function UploadReportPage() {
  const router = useRouter();
  const [userId, setUserId] = useState(router.query.userId || null);
  const [healthId, setHealthId] = useState(null);
  const [reportName, setReportName] = useState("");
  const [reportDate, setReportDate] = useState(null);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!userId) {
      getUserDetails()
        .then((user) => {
          setUserId(user.userId);
          setHealthId(user.healthId);
        })
        .catch(() => router.push("/auth/login"));
    }
  }, [userId]);

  const handleFileChange = (e) => {
    if (e.target.files?.length > 0) {
      setFile(e.target.files[0]);
      setMessage(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file || !reportDate) {
      setMessage("⚠️ Please select a file and report date.");
      return;
    }

    try {
      setIsUploading(true);
      setMessage(null);

      const response = await uploadReport(
        userId,
        reportDate,
        file,
        false,
        reportName
      );

      if (response?.reportId) {
        router.push({
          pathname: "/reports/reportdetails",
          query: { userId, reportId: response.reportId },
        });
      } else {
        throw new Error(response?.message || "Upload failed");
      }
    } catch (err) {
      console.error("❌ Upload error:", err);
      setMessage(`❌ ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Upload Report</h2>

      {userId && (
        <div style={styles.userInfo}>
          <strong>User ID:</strong> {userId} &nbsp; | &nbsp;
          <strong>Health ID:</strong> {healthId || "Loading..."}
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>Report Name (optional)</label>
        <input
          type="text"
          value={reportName}
          onChange={(e) => setReportName(e.target.value)}
          style={styles.input}
        />

        <label style={styles.label}>Report Date *</label>
        <DatePicker
          selected={reportDate}
          onChange={(date) => setReportDate(date)}
          dateFormat="yyyy-MM-dd"
          placeholderText="Select report date"
          className="form-datepicker"
        />

        <label style={styles.label}>Select File *</label>
        <input
          type="file"
          accept=".pdf,image/*"
          onChange={handleFileChange}
          style={styles.input}
        />

        {message && (
          <div style={message.includes("✅") ? styles.success : styles.error}>
            {message}
          </div>
        )}

        <button
          type="submit"
          style={styles.button}
          disabled={isUploading || !userId}
        >
          {isUploading ? "Uploading..." : "Upload Report"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "600px",
    margin: "40px auto",
    padding: "30px",
    backgroundColor: "#fff",
    borderRadius: "12px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
    fontFamily: "sans-serif",
  },
  title: {
    fontSize: "24px",
    marginBottom: "20px",
  },
  userInfo: {
    marginBottom: "20px",
    fontSize: "14px",
    color: "#555",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  label: {
    fontWeight: "500",
  },
  input: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "14px",
  },
  button: {
    marginTop: "10px",
    backgroundColor: "#4361ee",
    color: "white",
    border: "none",
    padding: "12px",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  success: {
    color: "#10b981",
  },
  error: {
    color: "#ef4444",
  },
};

