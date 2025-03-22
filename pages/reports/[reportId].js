import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function ReportDetails() {
  const router = useRouter();
  const { reportId } = router.query;

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
      fetchReport(userId);
    }

    async function fetchReport(userId) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/reports/${userId}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to fetch reports");

        const match = data.reports.find((r) => r.reportId === reportId);
        if (!match) throw new Error("Report not found");

        setReport(match);
      } catch (err) {
        console.error("❌ Report fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }, [reportId, router]);

  if (loading) return <p>Loading report...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!report) return <p>No report found.</p>;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Report: {report.reportId}</h2>
      <p>
        <strong>Date:</strong>{" "}
        {report.date ? new Date(report.date).toLocaleDateString() : "N/A"}
      </p>

      <h3>Extracted Parameters</h3>
      {report.extractedParameters ? (
        Object.entries(report.extractedParameters).map(([category, params]) => (
          <div key={category} style={styles.categoryBox}>
            <h4 style={styles.category}>{category}</h4>
            <ul style={styles.paramList}>
              {Object.entries(params).map(([param, details]) => (
                <li key={param} style={styles.paramItem}>
                  {param}: <strong>{details.Value}</strong>{" "}
                  {details.Unit && `(${details.Unit})`}{" "}
                  {details["Reference Range"] && ` - Ref: ${details["Reference Range"]}`}
                </li>
              ))}
            </ul>
          </div>
        ))
      ) : (
        <p>No extracted parameters found.</p>
      )}

      <button onClick={() => router.push("/dashboard")} style={styles.backButton}>
        Back to Dashboard
      </button>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "700px",
    margin: "auto",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },
  title: {
    fontSize: "24px",
    color: "#6200ee",
  },
  categoryBox: {
    marginTop: "20px",
    padding: "10px",
    backgroundColor: "#f2f2f2",
    borderRadius: "6px",
  },
  category: {
    fontSize: "18px",
    marginBottom: "8px",
  },
  paramList: {
    listStyleType: "none",
    paddingLeft: "10px",
  },
  paramItem: {
    marginBottom: "4px",
  },
  backButton: {
    marginTop: "20px",
    padding: "10px 15px",
    backgroundColor: "#6200ee",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

