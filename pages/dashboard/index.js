import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getUserDetails, getReports } from "../../utils/apiService";

export default function Dashboard() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [tokenChecked, setTokenChecked] = useState(false);
  const [userData, setUserData] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) setToken(storedToken);
    setTokenChecked(true);
  }, []);

  useEffect(() => {
    if (tokenChecked && !token) {
      router.replace("/auth/login");
    }
  }, [tokenChecked, token]);

  useEffect(() => {
    if (!tokenChecked || !token) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const user = await getUserDetails();
        setUserData(user);

        const reportsData = await getReports(user.userId);
        setReports(reportsData.reports || []);
      } catch (err) {
        console.error("❌ Error loading dashboard:", err.message);
        router.replace("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tokenChecked, token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("healthId");
    router.replace("/auth/login");
  };

  const handleUpload = () => router.push("/reports/upload");
  const handleShare = () => router.push("/share");
  const handleViewShared = () => router.push("/reports/sharedreports");

  const getTopParameters = (extracted) => {
    if (!extracted || typeof extracted !== "object") return [];

    const flatParams = [];

    for (const category in extracted) {
      const params = extracted[category];
      if (typeof params === "object") {
        for (const [name, details] of Object.entries(params)) {
          flatParams.push({
            name,
            value: details?.Value || details?.value || "N/A",
            unit: details?.Unit || details?.unit || "",
            category
          });
        }
      }
    }

    return flatParams.slice(0, 3);
  };

  const filteredReports = reports.filter(report => {
    if (activeTab !== "all") {
      return true;
    }

    if (!searchTerm) return true;

    const reportId = (report.reportId || "").toLowerCase();
    const date = report.date ? new Date(report.date).toLocaleDateString() : "";

    return reportId.includes(searchTerm.toLowerCase()) ||
           date.includes(searchTerm.toLowerCase());
  });

  const formatDate = (dateString) => {
    if (!dateString) return "No date";

    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  if (!tokenChecked) return <LoadingState message="Checking login" />;
  if (loading) return <LoadingState message="Loading dashboard" />;
  if (!userData) return <ErrorState message="Unable to load user" />;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.userInfo}>
            <h1 style={styles.username}>Hi, {userData.userId}</h1>
            <p style={styles.healthId}>Health ID: {userData.healthId}</p>
          </div>
          <div style={styles.headerActions}>
            <button onClick={handleLogout} style={styles.logoutButton}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div style={styles.actionsContainer}>
        <button onClick={handleUpload} style={styles.actionButton}>📤 Upload Report</button>
        <button onClick={handleShare} style={styles.actionButton}>🔗 Share Reports</button>
        <button onClick={handleViewShared} style={styles.actionButton}>👥 View Shared</button>
      </div>

      <div style={styles.reportsSection}>
        <div style={styles.reportsHeader}>
          <h2>Your Reports</h2>
          <input
            type="text"
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        {filteredReports.length === 0 ? (
          <p>No reports found.</p>
        ) : (
          <div style={styles.reportList}>
            {filteredReports.map((report) => (
              <div
                key={report._id}
                style={styles.reportCard}
                onClick={() =>
                  router.push({
                    pathname: "/reports/reportdetails",
                    query: { reportId: report.reportId, userId: userData.userId }
                  })
                }
              >
                <h3>{report.name || "Unnamed Report"}</h3>
                <p>{formatDate(report.date)}</p>
                <ul>
                  {getTopParameters(report.extractedParameters).map((param, i) => (
                    <li key={i}>{param.name}: {param.value} {param.unit}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const LoadingState = ({ message }) => (
  <div style={{ padding: 40, textAlign: 'center' }}>
    <p>{message}...</p>
  </div>
);

const ErrorState = ({ message }) => (
  <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>
    <p>⚠️ {message}</p>
  </div>
);

const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0",
    fontFamily: "'Roboto', 'Segoe UI', sans-serif",
    backgroundColor: "#f8f9fa",
    minHeight: "100vh",
  },
  
  // Header styles
  header: {
    backgroundColor: "#4361ee",
    padding: "20px",
    color: "white",
    borderRadius: "0 0 15px 15px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  headerContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    display: "flex",
    flexDirection: "column",
  },
  username: {
    fontSize: "24px",
    fontWeight: "500",
    margin: "0",
  },
  healthId: {
    margin: "5px 0 0",
    fontSize: "14px",
    opacity: "0.9",
  },
  headerActions: {
    display: "flex",
  },
  logoutButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    color: "white",
    border: "none",
    padding: "8px 15px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
  },
  
  // Stats container
  statsContainer: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    margin: "20px",
  },
  statCard: {
    backgroundColor: "white",
    borderRadius: "10px",
    padding: "15px",
    flex: "1",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  },
  statNumber: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#4361ee",
  },
  statLabel: {
    fontSize: "14px",
    color: "#6c757d",
    marginTop: "5px",
  },
  
  // Action buttons
  actionsContainer: {
    display: "flex",
    justifyContent: "space-between",
    gap: "15px",
    margin: "20px",
  },
  actionButton: {
    backgroundColor: "white",
    border: "none",
    borderRadius: "10px",
    padding: "15px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: "1",
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  actionIcon: {
    fontSize: "24px",
    marginBottom: "8px",
  },
  
  // Reports section
  reportsSection: {
    backgroundColor: "white",
    borderRadius: "10px",
    margin: "20px",
    padding: "20px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  },
  reportsSectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  reportsTitle: {
    margin: "0",
    fontSize: "20px",
    fontWeight: "500",
    color: "#343a40",
  },
  searchBox: {
    position: "relative",
  },
  searchInput: {
    padding: "10px 15px",
    borderRadius: "5px",
    border: "1px solid #dee2e6",
    outline: "none",
    width: "250px",
  },
  
  // Tabs
  tabsContainer: {
    display: "flex",
    marginBottom: "20px",
    borderBottom: "1px solid #dee2e6",
  },
  tab: {
    padding: "10px 20px",
    backgroundColor: "transparent",
    border: "none",
    borderBottom: "2px solid transparent",
    color: "#6c757d",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s",
  },
  activeTab: {
    padding: "10px 20px",
    backgroundColor: "transparent",
    border: "none",
    borderBottom: "2px solid #4361ee",
    color: "#4361ee",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
  
  // Report cards
  reportList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "20px",
  },
  reportCard: {
    backgroundColor: "white",
    borderRadius: "10px",
    padding: "15px",
    cursor: "pointer",
    border: "1px solid #eaeaea",
    transition: "transform 0.2s, box-shadow 0.2s",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  },
  reportCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  reportName: {
    margin: "0",
    fontSize: "16px",
    fontWeight: "500",
    color: "#343a40",
  },
  sharedBadge: {
    backgroundColor: "#4361ee",
    color: "white",
    padding: "2px 8px",
    borderRadius: "20px",
    fontSize: "12px",
  },
  reportDate: {
    display: "flex",
    alignItems: "center",
    color: "#6c757d",
    fontSize: "14px",
    marginBottom: "15px",
  },
  dateIcon: {
    marginRight: "5px",
  },
  parameters: {
    marginTop: "10px",
    borderTop: "1px solid #f0f0f0",
    paddingTop: "10px",
  },
  parameter: {
    display: "flex",
    justifyContent: "space-between",
    margin: "5px 0",
  },
  parameterName: {
    fontSize: "14px",
    color: "#495057",
  },
  parameterValue: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#343a40",
  },
  parameterUnit: {
    fontSize: "12px",
    color: "#6c757d",
  },
  viewDetails: {
    marginTop: "15px",
    textAlign: "center",
    color: "#4361ee",
    fontWeight: "500",
    fontSize: "14px",
    borderTop: "1px solid #f0f0f0",
    paddingTop: "10px",
  },
  
  // Empty state
  emptyState: {
    padding: "40px 0",
    textAlign: "center",
  },
  emptyStateText: {
    color: "#6c757d",
    marginBottom: "15px",
  },
  uploadButton: {
    backgroundColor: "#4361ee",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "500",
  },
  clearSearchButton: {
    backgroundColor: "transparent",
    color: "#4361ee",
    border: "1px solid #4361ee",
    padding: "10px 20px",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "500",
  },
  
  // Loading state
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
  },
  loadingSpinner: {
    width: "40px",
    height: "40px",
    border: "3px solid rgba(67, 97, 238, 0.3)",
    borderRadius: "50%",
    borderTop: "3px solid #4361ee",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    marginTop: "15px",
    color: "#4361ee",
    fontWeight: "500",
  },
  
  // Error state
  errorContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
  },
  errorMessage: {
    color: "#dc3545",
    fontWeight: "500",
  },
};

