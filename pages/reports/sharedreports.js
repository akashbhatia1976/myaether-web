import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function ShareReports() {
  const router = useRouter();
  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  const [sharedReports, setSharedReports] = useState([]);
  const [receivedReports, setReceivedReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState("shared"); // "shared" or "received"
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;
    fetchSharedReports();
    fetchReceivedReports();
  }, [userId]);

  const fetchSharedReports = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/share/shared-by/${userId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch shared reports.");
      setSharedReports(data.sharedReports || []);
    } catch (err) {
      console.error("Error fetching shared reports:", err);
      setError("Could not load shared reports.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReceivedReports = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/share/shared-with/${userId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch received reports.");
      setReceivedReports(data.sharedReports || []);
    } catch (err) {
      console.error("Error fetching received reports:", err);
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
          
          <button style={styles.backButton} onClick={() => router.push("/dashboard")}>
            ⬅️ Back to Dashboard
          </button>


      <div style={styles.toggleContainer}>
        <button onClick={() => setViewMode("shared")} style={viewMode === "shared" ? styles.activeToggle : styles.toggle}>Shared by me</button>
        <button onClick={() => setViewMode("received")} style={viewMode === "received" ? styles.activeToggle : styles.toggle}>Shared with me</button>
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
      marginBottom: 20,
      padding: "8px 14px",
      backgroundColor: "#eee",
      border: "1px solid #ccc",
      borderRadius: 5,
      cursor: "pointer",
      fontSize: 14,
    },

};
