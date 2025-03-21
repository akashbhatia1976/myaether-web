import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

function ReportDetailsPage() {
  const router = useRouter();
  const { reportId } = router.query; // Get reportId from URL
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      router.push("/auth/login");
      return;
    }

    if (reportId) {
      fetchReportDetails(userId, reportId);
    }
  }, [reportId]);

  const fetchReportDetails = async (userId, reportId) => {
    try {
      console.log(`📌 Fetching report details: ${API_BASE_URL}/api/reports/${userId}/${reportId}`);
      
      const response = await fetch(`${API_BASE_URL}/api/reports/${userId}/${reportId}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to fetch report details.");
      console.log("✅ Report Data Received:", data);

      setReport(data);
    } catch (err) {
      console.error("❌ Error fetching report details:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Report Details</h2>

      {loading ? (
        <p>Loading report...</p>
      ) : error ? (
        <p style={styles.error}>{error}</p>
      ) : report ? (
        <div style={styles.reportDetails}>
          <p><strong>Report ID:</strong> {report.reportId}</p>
          <p><strong>Date:</strong> {new Date(report.date).toLocaleDateString()}</p>

          <h3>Extracted Parameters</h3>
          {report.extractedParameters && Object.keys(report.extractedParameters).length > 0 ? (
            <ul style={styles.parameterList}>
              {Object.entries(report.extractedParameters).map(([category, parameters]) => (
                <li key={category} style={styles.parameterCategory}>
                  <strong>{category}</strong>
                  <ul>
                    {Object.entries(parameters).map(([param, details]) => (
                      <li key={param} style={styles.parameterItem}>
                        {param}: <strong>{details.Value || "N/A"}</strong> {details.Unit ? `(${details.Unit})` : ""}
                        {details["Reference Range"] ? ` - Ref: ${details["Reference Range"]}` : ""}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          ) : (
            <p>No extracted parameters found.</p>
          )}
        </div>
      ) : (
        <p>No report details found.</p>
      )}

      <button onClick={() => router.push("/dashboard")} style={styles.backButton}>
        Back to Dashboard
      </button>
    </div>
  );
}

// ✅ Updated Inline Styles
const styles = {
  container: {
    maxWidth: "700px",
    margin: "auto",
    padding: "20px",
    textAlign: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)"
  },
  header: { fontSize: "24px", color: "#6200ee" },
  error: { color: "red", fontWeight: "bold" },
  reportDetails: { textAlign: "left", marginTop: "20px" },
  parameterList: { listStyleType: "none", padding: "0" },
  parameterCategory: { marginBottom: "15px", fontSize: "18px" },
  parameterItem: { marginBottom: "5px", fontSize: "16px" },
  backButton: {
    marginTop: "20px",
    padding: "10px",
    backgroundColor: "#6200ee",
    color: "#fff",
    borderRadius: "5px",
    cursor: "pointer"
  }
};

export default ReportDetailsPage;

