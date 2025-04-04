// 📁 pages/reports/sharedreports.js

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  getSharedReportsByUser,
  getReportsSharedWithUser,
} from "../../utils/apiService";

export default function ShareReports() {
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
      setSharedReports(data.sharedReports || []);
    } catch (err) {
      console.error("❌ Error fetching shared reports:", err);
      setError("Could not load shared reports.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReceivedReports = async () => {
    try {
      const data = await getReportsSharedWithUser(userId);
      setReceivedReports(data.sharedReports || []);
    } catch (err) {
      console.error("❌ Error fetching received reports:", err);
      setError("Could not load received reports.");
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
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return "Invalid Date";
    }
  };

  const renderReportItem = (report) => {
    const recipient =
      report.sharedWithUserId?.trim() && report.sharedWithUserId !== ""
        ? report.sharedWithUserId
        : `${report.sharedWith} (invite sent)`;

    return (
      <li
        key={report._id}
        style={styles.reportItem}
        onClick={() =>
          handleReportClick(
            report.reportId,
            viewMode === "shared" ? userId : report.ownerId
          )
        }
      >
        <p><strong>📄 Report ID:</strong> {report.reportId}</p>
        <p>
          {viewMode === "shared"
            ? `👤 Shared With: ${
                report.sharedWithId
                  ? report.sharedWithId
                  : report.sharedWith
                  ? `${report.sharedWith} (invite sent)`
                  : "Unknown"
              }`
            : `📥 Shared By: ${report.ownerId}`}
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
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <ul style={styles.list}>
          {(viewMode === "shared" ? sharedReports : receivedReports).map(renderReportItem)}
        </ul>
      )}

      <button style={styles.backButton} onClick={() => router.push("/dashboard")}>
        ⬅️ Back to Dashboard
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
    backgroundColor: "#6200ee",
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
    backgroundColor: "#6200ee",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

