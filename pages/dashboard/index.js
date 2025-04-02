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

