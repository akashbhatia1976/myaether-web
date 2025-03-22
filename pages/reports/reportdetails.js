import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function ReportDetails() {
  const router = useRouter();
  const { reportId, userId } = router.query;

  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId && reportId) {
      fetchReportDetails();
    }

    async function fetchReportDetails() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/reports/${userId}/${reportId}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to fetch report");

        const extracted = data.extractedParameters || data.parameters;
        if (!extracted || Object.keys(extracted).length === 0) {
          console.warn("⚠️ No extracted parameters found.");
        }

        setReport({
          userId: data.userId,
          reportId: data.reportId,
          date: data.date,
          fileName: data.fileName,
          parameters: extracted,
        });
      } catch (err) {
        console.error("❌ Error fetching report:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }, [userId, reportId]);

  const renderParameters = (data) => {
    if (typeof data === "object" && !Array.isArray(data)) {
      return Object.entries(data).map(([key, value], index) => (
        <div key={index} style={styles.nestedContainer}>
          <p style={styles.parameterKey}>{key}:</p>
          {typeof value === "object" ? renderParameters(value) : (
            <p style={styles.parameterValue}>{String(value)}</p>
          )}
        </div>
      ));
    }
    return <p style={styles.parameterValue}>{String(data)}</p>;
  };

  if (loading) return <p style={styles.loading}>Loading Report Details...</p>;
  if (error) return <p style={styles.error}>{error}</p>;
  if (!report) return <p>No report found.</p>;

  return (
    <div style={styles.container}>
      <h2>📄 Report: {report.reportId}</h2>
      <p><strong>User:</strong> {report.userId}</p>
      <p><strong>Date:</strong> {report.date ? new Date(report.date).toLocaleDateString() : "N/A"}</p>
      <p><strong>File:</strong> {report.fileName}</p>

      <h3>Extracted Parameters:</h3>
      <div>{renderParameters(report.parameters)}</div>

      <button onClick={() => router.push("/dashboard")} style={styles.backButton}>
        ← Back to Dashboard
      </button>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "700px",
    margin: "auto",
    padding: 20,
    fontFamily: "Arial, sans-serif",
  },
  loading: { textAlign: "center", marginTop: 50 },
  error: { color: "red", textAlign: "center", marginTop: 50 },
  nestedContainer: { marginLeft: 15, marginBottom: 5 },
  parameterKey: { fontWeight: "bold", color: "#333" },
  parameterValue: { color: "#555", marginLeft: 10 },
  backButton: {
    marginTop: 30,
    padding: "10px 20px",
    backgroundColor: "#6200ee",
    color: "#fff",
    border: "none",
    borderRadius: 5,
    cursor: "pointer",
  },
};

