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
        setReports(reportsData);
        console.log("📦 Reports fetched:", reportsData);

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
  const handleShare = () => router.push("/share/managesharereports");
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
            category,
          });
        }
      }
    }
    return flatParams.slice(0, 3);
  };

  const filteredReports = reports.filter((report) => {
    if (activeTab !== "all") return true;
    if (!searchTerm) return true;
    const reportId = (report.reportId || "").toLowerCase();
    const date = report.date ? new Date(report.date).toLocaleDateString() : "";
    return (
      reportId.includes(searchTerm.toLowerCase()) ||
      date.includes(searchTerm.toLowerCase())
    );
  });

  const formatDate = (dateString) => {
    if (!dateString) return "No date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!tokenChecked) return <p>Checking login...</p>;
  if (loading) return <p>Loading dashboard...</p>;
  if (!userData) return <p>⚠️ Unable to load user</p>;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.userInfo}>
            <h1 style={styles.username}>Hi, {userData.userId}</h1>
            <p style={styles.healthId}>Health ID: {userData.healthId}</p>
          </div>
          <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
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
                    query: {
                      reportId: report.reportId || report._id,
                      userId: userData.userId,
                    },
                  })
                }
              >
                <h3>{report.name || report.fileName || "Unnamed Report"}</h3>
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

const styles = {
  container: { padding: 20, fontFamily: "Arial, sans-serif" },
  header: { backgroundColor: "#4361ee", color: "white", padding: 20, borderRadius: 10 },
  headerContent: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  userInfo: {},
  username: { margin: 0, fontSize: 24 },
  healthId: { margin: 0, fontSize: 14 },
  logoutButton: {
    backgroundColor: "#fff",
    color: "#4361ee",
    border: "none",
    padding: "8px 15px",
    borderRadius: "5px",
    cursor: "pointer",
  },
  actionsContainer: { display: "flex", gap: 15, margin: "20px 0" },
  actionButton: {
    flex: 1,
    padding: 15,
    border: "1px solid #ccc",
    borderRadius: 10,
    backgroundColor: "white",
    cursor: "pointer",
  },
  reportsSection: { marginTop: 30 },
  reportsHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  searchInput: { padding: 8, borderRadius: 4, border: "1px solid #ccc" },
  reportList: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20, marginTop: 20 },
  reportCard: {
    border: "1px solid #ddd",
    borderRadius: 10,
    padding: 15,
    backgroundColor: "#f9f9f9",
    cursor: "pointer",
    transition: "0.2s ease",
  },
};

