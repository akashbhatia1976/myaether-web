// 📁 pages/reports/sharedreports.js

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  getSharedReportsByUser,
  getReportsSharedWithUser,
} from "../../utils/apiService";

export default function SharedReportsPage() {
  const router = useRouter();
  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  const [sharedReports, setSharedReports] = useState([]);
  const [receivedReports, setReceivedReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState("shared");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;
    fetchSharedReports();
    fetchReceivedReports();
  }, [userId]);

  const fetchSharedReports = async () => {
    try {
      const data = await getSharedReportsByUser(userId);
      console.log("✅ Web shared-by data:", data);
      setSharedReports(data);
    } catch (err) {
      console.error("❌ Error fetching shared-by reports:", err);
      setError("Could not load reports shared by you.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReceivedReports = async () => {
    try {
      const data = await getReportsSharedWithUser(userId);
      console.log("✅ Web shared-with data:", data);
      setReceivedReports(data);
    } catch (err) {
      console.error("❌ Error fetching received reports:", err);
      setError("Could not load reports shared with you.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReportClick = (reportId, ownerId) => {
    router.push({
      pathname: "/reports/reportdetails",
      query: { reportId, userId: ownerId },
    });
  };

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  const renderReportItem = (report) => {
    const label = viewMode === "shared"
      ? report.sharedWithId || report.sharedWithEmail || report.recipientPhone || "Unknown"
      : report.ownerId || "Unknown";

    const reportName = report.name || report.fileName || report.reportId || "Unnamed Report";

    return (
      <li
        key={report._id}
        style={styles.reportItem}
        onClick={() => handleReportClick(report.reportId, viewMode === "shared" ? userId : report.ownerId)}
      >
        <p><strong>📄 Report:</strong> {reportName}</p>
        <p>
          {viewMode === "shared"
            ? `👤 Shared With: ${label}`
            : `📥 Shared By: ${label}`}
        </p>
        <p>📅 Shared On: {formatDate(report.sharedAt)}</p>
      </li>
    );
  };

  return (
    <div style={styles.container}>
      <h2>📑 Shared Reports</h2>

      <div style={styles.toggleContainer}>
        <button
          onClick={() => setViewMode("shared")}
          style={viewMode === "shared" ? styles.activeToggle : styles.toggle}
        >
          Shared by me
        </button>
        <button
          onClick={() => setViewMode("received")}
          style={viewMode === "received" ? styles.activeToggle : styles.toggle}
        >
          Shared with me
        </button>
      </div>

      {isLoading ? (
        <p>Loading reports...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <ul style={styles.list}>
          {(viewMode === "shared" ? sharedReports : receivedReports).map(renderReportItem)}
        </ul>
      )}

      <button style={styles.backButton} onClick={() => router.push("/dashboard")}>⬅️ Back to Dashboard</button>
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
  toggleContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 20,
  },
  toggle: {
    marginRight: 10,
    padding: "10px 15px",
    backgroundColor: "#ddd",
    border: "none",
    borderRadius: 5,
    cursor: "pointer",
  },
  activeToggle: {
    marginRight: 10,
    padding: "10px 15px",
    backgroundColor: "#0D9488",
    color: "white",
    border: "none",
    borderRadius: 5,
    cursor: "pointer",
  },
  list: {
    listStyleType: "none",
    padding: 0,
  },
  reportItem: {
    padding: 15,
    backgroundColor: "#f2f2f2",
    borderRadius: 6,
    marginBottom: 10,
    cursor: "pointer",
  },
  backButton: {
    marginTop: "20px",
    padding: "10px 15px",
    backgroundColor: "#0D9488",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};


