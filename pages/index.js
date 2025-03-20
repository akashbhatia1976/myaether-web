import { useEffect, useState } from "react";
import { useRouter } from "next/router";

function DashboardPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [healthId, setHealthId] = useState("");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    const storedHealthId = localStorage.getItem("healthId");

    if (!storedUserId) {
      router.push("/auth/login");
      return;
    }

    setUserId(storedUserId);
    setHealthId(storedHealthId || "Fetching...");

    fetchReports(storedUserId);
  }, []);

  const fetchReports = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reports/${userId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch reports.");
      setReports(data.reports || []);
    } catch (err) {
      console.error("❌ Error fetching reports:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("healthId");
    router.push("/auth/login");
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Welcome, {userId}</h2>
      <p style={styles.subHeader}>
        Health ID: <strong>{healthId}</strong>
      </p>

      <h3 style={styles.sectionHeader}>Your Reports</h3>
      {loading ? (
        <p>Loading reports...</p>
      ) : error ? (
        <p style={styles.error}>{error}</p>
      ) : reports.length > 0 ? (
        <ul style={styles.reportList}>
          {reports.map((report, index) => (
            <li key={index} style={styles.reportItem}>
            <button
                onClick={() => router.push(`/reports/${report.reportId}`)}
            >

            <strong>Report ID:</strong> {report.reportId} <br />
                <strong>Date:</strong> {new Date(report.date).toLocaleDateString()}
            </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No reports found.</p>
      )}

      <div style={styles.buttonContainer}>
        <button onClick={() => router.push("/upload")} style={styles.primaryButton}>
          Upload Report
        </button>

        <button onClick={() => router.push("/shared")} style={styles.primaryButton}>
          View Shared Reports
        </button>

        <button onClick={() => router.push("/trends")} style={styles.primaryButton}>
          View Health Trends
        </button>

        <button onClick={handleLogout} style={styles.logoutButton}>
          Logout
        </button>
      </div>
    </div>
  );
}

// ✅ Styled Components for Better UI
const styles = {
  container: {
    maxWidth: "700px",
    margin: "auto",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
    textAlign: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  },
  header: { fontSize: "26px", color: "#6200ee" },
  subHeader: { fontSize: "16px", marginBottom: "15px" },
  sectionHeader: { fontSize: "18px", marginTop: "20px", color: "#333" },
  error: { color: "red", fontWeight: "bold" },
  reportList: { listStyleType: "none", padding: "0" },
  reportItem: { marginBottom: "10px" },
  reportButton: {
    width: "100%",
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ddd",
    backgroundColor: "#ffffff",
    cursor: "pointer",
    fontSize: "16px",
    textAlign: "left",
  },
  buttonContainer: { marginTop: "20px" },
  primaryButton: {
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
    backgroundColor: "#6200ee",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  logoutButton: {
    width: "100%",
    padding: "10px",
    marginTop: "10px",
    backgroundColor: "red",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

export default DashboardPage;

