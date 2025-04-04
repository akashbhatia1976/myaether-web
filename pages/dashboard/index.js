// pages/dashboard/index.js
import { useEffect, useState, useContext } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import styles from "../../styles/dashboard.module.css";
import {
  getUserDetails,
  getReports,
  searchReportsWithNLP
} from "../../utils/apiService";
import SearchResultsVisualization from "../../components/SearchResultsVisualization";

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
    props: {},
  };
}

export default function Dashboard() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  // NLP Search states
  const [queryText, setQueryText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  
  // Visualization toggle state
  const [showVisualization, setShowVisualization] = useState(true);

  // Fetch user data and reports
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

  // NLP Search function
  const handleNlpSearch = async () => {
    if (!queryText.trim()) return;
    
    setSearching(true);
    setSearchResults([]);
    
    try {
      const response = await searchReportsWithNLP(userData.userId, queryText);
      
      // Check if response has the expected structure
      if (response && response.success && Array.isArray(response.reports)) {
        setSearchResults(response.reports);
        console.log("🔍 Search results:", response.reports);
      } else {
        console.error("❌ Unexpected response format:", response);
        setSearchResults([]);
      }
    } catch (error) {
      console.error("❌ Search failed:", error.message);
      alert("Search failed. Please try a different query.");
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleUpload = () => router.push("/reports/upload");
  const handleShareAll = () => router.push({
    pathname: "/reports/managesharereports",
    query: { userId: userData?.userId },
  });
  const handleViewShared = () => router.push("/reports/sharedreports");

  // Enhanced getTopParameters function that prioritizes abnormal values
    const getTopParameters = (extracted) => {
      // Debug: Log the structure of the extracted parameters
      console.log("Report extracted parameters:", extracted);

      if (!extracted || typeof extracted !== "object") {
        console.log("No parameters found or invalid format");
        return [];
      }
      
      const flatParams = [];
      
      // Try to extract in different possible formats
      if (Array.isArray(extracted)) {
        // If it's already an array of parameters
        extracted.forEach(param => {
          const value = param.value || param.Value || "N/A";
          const unit = param.unit || param.Unit || "";
          const name = param.name || param.Name || param.parameter || param.Parameter || "";
          
          if (name) {
            flatParams.push({
              name,
              value,
              unit,
              category: param.category || "General",
              status: "normal", // Default status, will be updated below
              normalLow: param.normalLow || param.lowerLimit,
              normalHigh: param.normalHigh || param.upperLimit,
              referenceRange: param.referenceRange || param["Reference Range"] || ""
            });
          }
        });
      } else {
        // If it's an object with categories
        for (const category in extracted) {
          const params = extracted[category];
          if (typeof params === "object" && !Array.isArray(params)) {
            for (const [name, details] of Object.entries(params)) {
              const value = details?.Value || details?.value || "N/A";
              const unit = details?.Unit || details?.unit || "";
              
              flatParams.push({
                name,
                value,
                unit,
                category,
                status: "normal", // Default status, will be updated below
                normalLow: details?.["Reference Range Low"] || details?.normalLow || details?.lowerLimit,
                normalHigh: details?.["Reference Range High"] || details?.normalHigh || details?.upperLimit,
                referenceRange: details?.["Reference Range"] || details?.referenceRange || ""
              });
            }
          } else if (Array.isArray(params)) {
            // If category contains an array of parameters
            params.forEach(param => {
              const name = param.name || param.Name || param.parameter || param.Parameter || "";
              const value = param.value || param.Value || "N/A";
              const unit = param.unit || param.Unit || "";
              
              if (name) {
                flatParams.push({
                  name,
                  value,
                  unit,
                  category,
                  status: "normal", // Default status, will be updated below
                  normalLow: param.normalLow || param.lowerLimit,
                  normalHigh: param.normalHigh || param.upperLimit,
                  referenceRange: param.referenceRange || param["Reference Range"] || ""
                });
              }
            });
          }
        }
      }
      
      // Process reference ranges and determine status
      flatParams.forEach(param => {
        // Try to extract normalLow and normalHigh from Reference Range if it exists
        if (param.referenceRange && typeof param.referenceRange === 'string') {
          // Common formats: "3.5-5.0", "< 5.0", "> 3.5", "3.5 - 5.0"
          const rangeMatch = param.referenceRange.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/);
          if (rangeMatch) {
            param.normalLow = param.normalLow || rangeMatch[1];
            param.normalHigh = param.normalHigh || rangeMatch[2];
          } else {
            const lowerMatch = param.referenceRange.match(/>\s*(\d+\.?\d*)/);
            const upperMatch = param.referenceRange.match(/<\s*(\d+\.?\d*)/);
            if (lowerMatch) param.normalLow = param.normalLow || lowerMatch[1];
            if (upperMatch) param.normalHigh = param.normalHigh || upperMatch[1];
          }
        }
        
        // Determine if the value is out of range
        let numValue = parseFloat(String(param.value).replace(/[^\d.-]/g, ''));
        
        if (!isNaN(numValue)) {
          if (param.normalLow !== undefined && numValue < parseFloat(param.normalLow)) {
            param.status = "low";
          } else if (param.normalHigh !== undefined && numValue > parseFloat(param.normalHigh)) {
            param.status = "high";
          }
        }
      });
      
      // Log the extracted parameters
      console.log("Extracted parameters:", flatParams);
      
      // Sort parameters - abnormal first, then by name
      flatParams.sort((a, b) => {
        // Abnormal parameters first
        if (a.status !== "normal" && b.status === "normal") return -1;
        if (a.status === "normal" && b.status !== "normal") return 1;
        // Then sort alphabetically
        return a.name.localeCompare(b.name);
      });
      
      return flatParams.slice(0, 3); // Return top 3 parameters (prioritizing abnormal ones)
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
        
        {/* NLP Search Section - New addition */}
        <section className={styles.nlpSearchSection}>
          <div className={styles.searchContainer}>
            <div className={styles.searchInputWrapper}>
              <svg className={styles.searchIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="Search your reports (e.g. 'Hb in October')"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                className={styles.nlpSearchInput}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && queryText.trim()) {
                    handleNlpSearch();
                  }
                }}
              />
            </div>
            <button
              onClick={handleNlpSearch}
              className={styles.nlpSearchButton}
              disabled={searching || !queryText.trim()}
            >
              {searching ? "Searching..." : "Search"}
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className={styles.searchResults}>
              <h3 className={styles.searchResultsTitle}>Search Results</h3>
              
              {/* Visualization Component with Toggle */}
              <div className={styles.visualizationHeader}>
                <h3 className={styles.visualizationTitle}>Trend Analysis</h3>
                <button
                  onClick={() => setShowVisualization(!showVisualization)}
                  className={styles.toggleVisualizationButton}
                  aria-label={showVisualization ? "Hide visualization" : "Show visualization"}
                >
                  {showVisualization ? (
                    <>
                      <span className={styles.toggleIcon}>▼</span>
                      <span className={styles.toggleText}>Hide Chart</span>
                    </>
                  ) : (
                    <>
                      <span className={styles.toggleIcon}>▶</span>
                      <span className={styles.toggleText}>Show Chart</span>
                    </>
                  )}
                </button>
              </div>
              
              {showVisualization && (
                <div className={styles.visualizationContainer}>
                  <SearchResultsVisualization searchResults={searchResults} />
                </div>
              )}
              
              <div className={styles.searchResultsList}>
                {searchResults.map((item, index) => (
                  <div key={`result-${index}`} className={styles.searchResultCard}>
                    <div className={styles.resultRow}>
                      <span className={styles.resultLabel}>Test:</span>
                      <span className={styles.resultValue}>{item.testName}</span>
                    </div>
                    <div className={styles.resultRow}>
                      <span className={styles.resultLabel}>Value:</span>
                      <span className={styles.resultValue}>{item.value} {item.unit}</span>
                    </div>
                    <div className={styles.resultRow}>
                      <span className={styles.resultLabel}>Date:</span>
                      <span className={styles.resultValue}>{new Date(item.date).toDateString()}</span>
                    </div>
                    <div className={styles.resultRow}>
                      <span className={styles.resultLabel}>Report:</span>
                      <span className={styles.resultValue}>{item.fileName}</span>
                    </div>
                    <button
                      className={styles.viewReportButton}
                      onClick={() =>
                        router.push({
                          pathname: "/reports/reportdetails",
                          query: {
                            reportId: item.reportId,
                            userId: userData.userId,
                          },
                        })
                      }
                    >
                      View Report
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searching && (
            <div className={styles.searchingIndicator}>
              <div className={styles.spinner}></div>
              <p>Searching through your reports...</p>
            </div>
          )}
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
              placeholder="Filter reports..."
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
                      <li key={i} className={`${styles.parameterItem} ${styles[param.status + 'Item']}`}>
                        <span className={styles.parameterName}>{param.name}</span>
                        <div className={styles.parameterDetails}>
                          <span className={`${styles.parameterValue} ${styles[param.status + 'Value']}`}>
                            {param.value} {param.unit}
                          </span>
                          {param.status !== "normal" && (
                            <span className={`${styles.statusIndicator} ${styles[param.status + 'Indicator']}`}>
                              {param.status === "high" ? "↑" : "↓"}
                            </span>
                          )}
                          {param.referenceRange && (
                            <span className={styles.referenceRange}>
                              (Range: {param.referenceRange})
                            </span>
                          )}
                        </div>
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
