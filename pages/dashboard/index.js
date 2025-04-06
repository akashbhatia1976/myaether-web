// pages/dashboard/index.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import styles from "../../styles/dashboard.module.css";
import {
  getUserDetails,
  getReports,
  searchReportsWithNLP,
  axiosInstance,
  formatReportsForTimeline,
getReportsWithParameters
} from "../../utils/apiService";
import SearchResultsVisualization from "../../components/SearchResultsVisualization";
// Import Health Timeline and Dashboard Summary components
import HealthTimeline from "../../components/HealthTimeline";
import DashboardSummary from "../../components/DashboardSummary";

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
  const [timelineReports, setTimelineReports] = useState([]);
  
  // NLP Search states
  const [queryText, setQueryText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  
  // Visualization toggle state
  const [showVisualization, setShowVisualization] = useState(true);
  
  // Parameters state
  const [reportParameters, setReportParameters] = useState({});
  const [fetchingParameters, setFetchingParameters] = useState(false);

  // Fetch user data and reports
    useEffect(() => {
      const fetchData = async () => {
        try {
          setLoading(true);

          const user = await getUserDetails();
          setUserData(user);

          console.log("📡 Calling getReports() with userId:", user.userId);

          // Get regular reports for the report list
          const reportsData = await getReports(user.userId);
          setReports(reportsData);
          console.log("📦 Reports fetched:", reportsData.length);

            // In your fetchData function in dashboard/index.js
            try {
              const timelineReportsData = await getReportsWithParameters(user.userId);
              console.log("📊 Timeline reports fetched:", timelineReportsData.length);
              setTimelineReports(timelineReportsData);
            } catch (timelineError) {
              // If the new endpoint fails, fall back to existing code
              console.error("❌ Error fetching timeline reports:", timelineError);
              console.log("Falling back to using report details for timeline");
              
              try {
                // Use the updated async version and pass userId
                const formattedReports = await formatReportsForTimeline(reportsData, user.userId);
                setTimelineReports(formattedReports);
              } catch (fallbackError) {
                console.error("❌ Even fallback approach failed:", fallbackError);
                setTimelineReports([]);
              }
            }

        } catch (err) {
          console.error("❌ Error loading dashboard:", err.message);
          router.replace("/auth/login");
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [router]);

  // Fetch parameters for reports
  useEffect(() => {
    const fetchParameters = async () => {
      if (!reports.length || fetchingParameters) return;
      
      setFetchingParameters(true);
      const paramsMap = {};
      
      try {
        // Try first if reports already have extractedParameters
        const reportsWithParams = reports.filter(report => report.extractedParameters);
        
        if (reportsWithParams.length > 0) {
          // If some reports already have parameters, use those
          reportsWithParams.forEach(report => {
            paramsMap[report._id || report.reportId] = report.extractedParameters;
          });
          console.log(`Using ${reportsWithParams.length} reports with embedded parameters`);
        } else {
          // Otherwise fetch parameters for each report
          console.log("Fetching parameters separately for each report");
          
          // Fetch for first 10 reports to avoid too many requests
          await Promise.all(
            reports.slice(0, 10).map(async (report) => {
              const reportId = report._id || report.reportId;
              try {
                const response = await axiosInstance.get(`/parameters/${reportId}`);
                if (response.data) {
                  paramsMap[reportId] = response.data;
                  console.log(`Fetched parameters for report ${reportId}`);
                }
              } catch (error) {
                console.error(`Failed to fetch parameters for report ${reportId}:`, error.message);
              }
            })
          );
        }
        
        setReportParameters(paramsMap);
        console.log(`Parameters available for ${Object.keys(paramsMap).length} reports`);
      } catch (error) {
        console.error("Error handling parameters:", error);
      } finally {
        setFetchingParameters(false);
      }
    };
    
    fetchParameters();
  }, [reports]);
    
  // This goes right after your existing useEffect for fetching parameters

  // Add this test function
  const testParameterFetching = async () => {
    if (!reports.length || !userData) return;
    
    const reportId = reports[0]._id;
    console.log("Testing parameter fetching for report:", reportId);
    
    // Approach 1: Direct parameters endpoint
    try {
      const response = await axiosInstance.get(`/parameters/${reportId}`);
      console.log("Parameters endpoint:",
                 response.data ? "Data returned" : "No data");
      console.log("Response preview:",
                 JSON.stringify(response.data).substring(0, 200));
    } catch (error) {
      console.error("Parameters endpoint failed:", error.message);
    }
    
    // Approach 2: Detailed report endpoint
    try {
      const response = await axiosInstance.get(`/reports/${userData.userId}/${reportId}`);
      console.log("Detailed report:",
                 response.data ? "Data returned" : "No data");
      console.log("Has extractedParameters:",
                 !!response.data.extractedParameters);
      
      // Check for other possible field names
      const possibleFields = [
        'extractedParameters', 'parameters', 'testResults',
        'tests', 'results', 'values', 'data'
      ];
      
      for (const field of possibleFields) {
        if (response.data[field]) {
          console.log(`Found data in field: ${field}`);
          console.log("Preview:",
                     JSON.stringify(response.data[field]).substring(0, 200));
        }
      }
    } catch (error) {
      console.error("Detailed report endpoint failed:", error.message);
    }
  };

  // And add this useEffect to call it
  useEffect(() => {
    if (reports.length > 0 && userData) {
      testParameterFetching();
    }
  }, [reports, userData]);

  // Then continue with your other functions (handleLogout, etc.)
  
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


  // Helper function to determine parameter status
  const determineStatus = (value, normalLow, normalHigh) => {
    if (value === undefined || value === null) return "normal";
    
    const stringValue = String(value);
    const numValue = parseFloat(stringValue.replace(/[^\d.-]/g, ''));
    
    if (isNaN(numValue)) return "normal";
    
    if (normalLow !== undefined && normalLow !== null && numValue < parseFloat(normalLow)) {
      return "low";
    } else if (normalHigh !== undefined && normalHigh !== null && numValue > parseFloat(normalHigh)) {
      return "high";
    }
    
    return "normal";
  };

  // Function to get top parameters for a report
  const getTopParameters = (report) => {
    const reportId = report._id || report.reportId;
    const parameters = reportParameters[reportId];
    
    if (!parameters) {
      return []; // No parameters available for this report
    }
    
    const paramList = [];
    
    // Handle object of parameters (most likely case based on ReportDetailsScreen.js)
    if (typeof parameters === 'object' && !Array.isArray(parameters)) {
      for (const key in parameters) {
        if (!parameters.hasOwnProperty(key)) continue;
        
        const param = parameters[key];
        
        // Handle different parameter value formats
        let value, unit, normalLow, normalHigh, referenceRange;
        
        if (typeof param === 'object') {
          // If param is an object with value/unit properties
          value = param.Value || param.value || JSON.stringify(param);
          unit = param.Unit || param.unit || '';
          normalLow = param.lowerLimit || param.normalLow || param["Reference Range Low"];
          normalHigh = param.upperLimit || param.normalHigh || param["Reference Range High"];
          referenceRange = param.referenceRange || param["Reference Range"] || '';
        } else {
          // If param is a primitive value
          value = param;
          unit = '';
        }
        
        // Determine if value is abnormal
        const status = determineStatus(value, normalLow, normalHigh);
        
        paramList.push({
          name: key,
          value,
          unit,
          category: 'General',
          status,
          normalLow,
          normalHigh,
          referenceRange
        });
      }
    }
    // Handle array of parameters
    else if (Array.isArray(parameters)) {
      parameters.forEach(param => {
        if (!param.name && !param.parameter) return;
        
        const name = param.name || param.parameter;
        const value = param.value || param.result || 'N/A';
        const unit = param.unit || '';
        const status = determineStatus(value, param.normalLow, param.normalHigh);
        
        paramList.push({
          name,
          value,
          unit,
          category: param.category || 'General',
          status,
          normalLow: param.normalLow || param.lowerLimit,
          normalHigh: param.normalHigh || param.upperLimit,
          referenceRange: param.referenceRange || ''
        });
      });
    }
    
    // Sort parameters - abnormal first, then by name
    paramList.sort((a, b) => {
      // Abnormal parameters first
      if (a.status !== "normal" && b.status === "normal") return -1;
      if (a.status === "normal" && b.status !== "normal") return 1;
      // Then sort alphabetically
      return a.name.localeCompare(b.name);
    });
    
    return paramList.slice(0, 3); // Return top 3 parameters (prioritizing abnormal ones)
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

  // Format the reports for the timeline - using our utility function
 // const timelineReports = formatReportsForTimeline(reports);
 // console.log("Reports for timeline:", timelineReports.length);

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
          
          {/* Dashboard Summary Section - New addition */}
          <DashboardSummary reports={reports} userData={userData} />
        </section>
        
        {/* Health Timeline Section - New addition */}
        <section className={styles.timelineSection}>
          <HealthTimeline reports={timelineReports} userData={userData} />
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
                    {getTopParameters(report).map((param, i) => (
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
                    {getTopParameters(report).length === 0 && !fetchingParameters && (
                      <li className={styles.parameterItem}>
                        <span className={styles.parameterName}>No parameters available</span>
                      </li>
                    )}
                    {getTopParameters(report).length === 0 && fetchingParameters && (
                      <li className={styles.parameterItem}>
                        <span className={styles.parameterName}>Loading parameters...</span>
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
