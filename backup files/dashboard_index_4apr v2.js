import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import styles from "../../styles/dashboard.module.css";
import { getUserDetails, getReports } from "../../utils/apiService";

// Add server-side authentication check
export async function getServerSideProps(context) {
  const { req, res } = context;
  const cookies = req.cookies;
  
  if (!cookies.token) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      }
    };
  }
  
  return {
    props: {}, // Will be passed to the page component
  };
}

export default function Dashboard() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Simplified useEffect without token checking (since we do server-side auth)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const user = await getUserDetails();
        setUserData(user);

        console.log("📡 Calling getReports() with userId:", user.userId);

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
  }, [router]);

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("healthId");
    
    // Clear cookies
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "userId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "healthId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    
    router.replace("/auth/login");
  };

  const handleUpload = () => router.push("/reports/upload");
  
  const handleShareAll = () => router.push({
    pathname: "/reports/managesharereports",
    query: { userId: userData?.userId },
  });
  
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
    const reportName = (report.name || report.fileName || "").toLowerCase();
    const date = report.date ? new Date(report.date).toLocaleDateString() : "";
    const searchLower = searchTerm.toLowerCase();
    return (
      reportId.includes(searchLower) ||
      reportName.includes(searchLower) ||
      date.includes(searchLower)
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

  if (loading) return <div className={styles.loading}>Loading dashboard...</div>;
  if (!userData) return <div className={styles.error}>⚠️ Unable to load user</div>;

  return (
    <div className={styles.container}>
      <Head>
        <title>Dashboard | Aether Health</title>
      </Head>
      
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logoSection}>
            <div className={styles.logo}>⚡</div>
            <h1 className={styles.appName}>Aether Health</h1>
          </div>
          
          <div className={styles.userSection}>
            <div className={styles.userInfo}>
              <h2 className={styles.username}>{userData.userId}</h2>
              <p className={styles.healthId}>Health ID: {userData.healthId}</p>
            </div>
            <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
          </div>
        </div>
      </header>

      <main className={styles.mainContent}>
        <section className={styles.welcomeSection}>
          <h2 className={styles.welcomeTitle}>Welcome back, {userData.userId}!</h2>
          <p className={styles.welcomeSubtitle}>Manage and analyze your health reports</p>
        </section>
        
        <section className={styles.actionsContainer}>
          <button onClick={handleUpload} className={styles.actionButton}>
            <span className={styles.actionIcon}>📤</span>
            <span className={styles.actionLabel}>Upload Report</span>
          </button>
          <button onClick={handleShareAll} className={styles.actionButton}>
            <span className={styles.actionIcon}>🔗</span>
            <span className={styles.actionLabel}>Share All Reports</span>
          </button>
          <button onClick={handleViewShared} className={styles.actionButton}>
            <span className={styles.actionIcon}>👥</span>
            <span className={styles.actionLabel}>View Shared Reports</span>
          </button>
        </section>

        <section>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Your Reports</h3>
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {filteredReports.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>📄</div>
              <p>No reports found. Upload your first report to get started.</p>
            </div>
          ) : (
            <div className={styles.reportList}>
              {filteredReports.map((report) => (
                <div key={report._id || report.reportId} className={styles.reportCard}>
                  <h3 className={styles.reportTitle}>{report.name || report.fileName || "Unnamed Report"}</h3>
                  <p className={styles.reportDate}>{formatDate(report.date)}</p>
                  
                  <ul className={styles.parameterList}>
                    {getTopParameters(report.extractedParameters).map((param, i) => (
                      <li key={i} className={styles.parameterItem}>
                        <span className={styles.parameterName}>{param.name}</span>
                        <span className={styles.parameterValue}>
                          {param.value} {param.unit}
                        </span>
                      </li>
                    ))}
                    {getTopParameters(report.extractedParameters).length === 0 && (
                      <li className={styles.parameterItem}>
                        <span className={styles.parameterName}>No parameters extracted</span>
                      </li>
                    )}
                  </ul>
                  
                  <div className={styles.reportActions}>
                    <button
                      onClick={() =>
                        router.push({
                          pathname: "/reports/reportdetails",
                          query: {
                            reportId: report.reportId || report._id,
                            userId: userData.userId,
                          },
                        })
                      }
                      className={styles.viewButton}
                    >
                      View Details
                    </button>
                    <button
                      onClick={() =>
                        router.push({
                          pathname: "/reports/managesharereports",
                          query: {
                            reportId: report.reportId || report._id,
                            userId: userData.userId,
                          },
                        })
                      }
                      className={styles.shareButton}
                    >
                      Share
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
