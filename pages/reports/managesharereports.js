// 📁 pages/reports/managesharereports.js (rewritten to mirror mobile ShareScreen)

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import {
  getSharedReportsByUser,
  getReportsSharedWithUser,
  revokeSharedReport,
  getUserDetails,
} from "../../utils/apiService";

export default function ManageShareReports() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [sharedReports, setSharedReports] = useState([]);
  const [receivedReports, setReceivedReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState("shared");
  const [error, setError] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const user = await getUserDetails();
        setUserId(user.userId);
        const [shared, received] = await Promise.all([
          getSharedReportsByUser(user.userId),
          getReportsSharedWithUser(user.userId),
        ]);
        setSharedReports(shared);
        setReceivedReports(received);
      } catch (err) {
        console.error("❌ Failed to load shared reports:", err);
        setError("Failed to load shared reports.");
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const handleRevoke = async (report) => {
    if (!confirm(`Revoke access to report ${report.reportId}?`)) return;
    try {
      await revokeSharedReport({
        ownerId: userId,
        reportId: report.reportId,
        sharedWithId: report.sharedWithId || undefined,
        sharedWithEmail: report.sharedWithEmail || undefined,
      });
      setSharedReports((prev) => prev.filter((r) => r._id !== report._id));
    } catch (err) {
      alert("Failed to revoke access. Try again.");
    }
  };

  const renderReportItem = (report) => (
    <div key={report._id} style={styles.card}>
      <p><strong>📄 Report:</strong> {report.reportId}</p>
      <p>
        {viewMode === "shared"
          ? `👤 Shared With: ${report.sharedWithId || report.sharedWithEmail || "(invite sent)"}`
          : `📥 Shared By: ${report.ownerId}`}
      </p>
      <p>📅 Shared On: {new Date(report.sharedAt).toLocaleDateString()}</p>
      <button
        onClick={() => router.push(`/reports/reportdetails?reportId=${report.reportId}&userId=${report.ownerId || userId}`)}
        style={styles.viewBtn}
      >
        View Report
      </button>
      {viewMode === "shared" && (
        <button onClick={() => handleRevoke(report)} style={styles.revokeBtn}>Revoke Access</button>
      )}
    </div>
  );

  return (
    <div style={styles.container}>
      <Head><title>Manage Shared Reports | Aether</title></Head>
      <h2>🔗 Shared Reports</h2>
      <div style={styles.toggleGroup}>
        <button
          onClick={() => setViewMode("shared")}
          style={viewMode === "shared" ? styles.activeToggle : styles.toggle}
        >Shared by Me</button>
        <button
          onClick={() => setViewMode("received")}
          style={viewMode === "received" ? styles.activeToggle : styles.toggle}
        >Shared with Me</button>
      </div>
      {isLoading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <div>{(viewMode === "shared" ? sharedReports : receivedReports).map(renderReportItem)}</div>
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
  toggleGroup: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    marginBottom: 20,
  },
  toggle: {
    padding: "10px 20px",
    border: "1px solid #ccc",
    borderRadius: 5,
    backgroundColor: "#f0f0f0",
    cursor: "pointer",
  },
  activeToggle: {
    padding: "10px 20px",
    border: "1px solid #6200ee",
    borderRadius: 5,
    backgroundColor: "#6200ee",
    color: "white",
    cursor: "pointer",
  },
  card: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    border: "1px solid #e0e0e0",
  },
  viewBtn: {
    marginTop: 8,
    marginRight: 10,
    backgroundColor: "#0D9488",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: 4,
    cursor: "pointer",
  },
  revokeBtn: {
    marginTop: 8,
    backgroundColor: "#EF4444",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: 4,
    cursor: "pointer",
  },
  backButton: {
    marginTop: 30,
    backgroundColor: "#ccc",
    padding: "10px 15px",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
};

