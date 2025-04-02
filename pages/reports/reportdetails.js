import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import styles from "../../styles/reportdetails.module.css";
import { getUserDetails, getAuthHeaders, BASE_URL } from '../../utils/apiService';

export default function ReportDetails() {
  const router = useRouter();
  const { reportId } = router.query;

  const [reportDetails, setReportDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [userId, setUserId] = useState(null);
  const [activeTab, setActiveTab] = useState("parameters");

  useEffect(() => {
    if (!router.isReady || !reportId) return;

    const fetchUserAndReport = async () => {
      try {
        const user = await getUserDetails();
        setUserId(user.userId);

        console.log(`📡 Fetching report: ${BASE_URL}/reports/${user.userId}/${reportId}`);
        fetchReportDetails(user.userId, reportId);
      } catch (err) {
        console.error("❌ Failed to fetch user from token:", err);
        router.push("/auth/login");
      }
    };

    fetchUserAndReport();
  }, [router.isReady, reportId, router]);

  const fetchReportDetails = async (userId, reportId) => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/reports/${userId}/${reportId}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      const data = await res.json();
      console.log("✅ Fetched:", data);

      if (res.ok && data) {
        setReportDetails(data);
        if (data.aiAnalysis) setAiAnalysis(data.aiAnalysis);
      } else {
        console.warn("⚠️ Report fetch returned empty or failed.", data);
      }
    } catch (err) {
      console.error("❌ Failed to load report:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAIAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch(`${BASE_URL}/ai-analysis/analyze-report`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, reportId }),
      });

      const data = await res.json();
      if (res.ok) {
        setAiAnalysis(data.analysis);
        setActiveTab("ai");
      } else {
        console.error("⚠️ AI Analysis failed:", data);
        setAiAnalysis("⚠️ AI analysis could not be generated.");
      }
    } catch (err) {
      console.error("❌ AI analysis error:", err);
      setAiAnalysis("⚠️ Error fetching AI analysis.");
    } finally {
      setAnalyzing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No date available";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const groupParametersByCategory = (paramsArray) => {
    const grouped = {};
    
    if (!Array.isArray(paramsArray) || paramsArray.length === 0) {
      // Handle case where extractedParameters is an object already
      const params = reportDetails.extractedParameters;
      if (params && typeof params === 'object') {
        return params;
      }
      return {};
    }
    
    paramsArray.forEach((param) => {
      if (!grouped[param.category]) grouped[param.category] = {};
      grouped[param.category][param.name] = {
        Value: param.value,
        Unit: param.unit,
        "Reference Range": param.referenceRange,
      };
    });
    return grouped;
  };

  const renderParameters = (params) => {
    if (!params || Object.keys(params).length === 0) {
      return (
        <div className={styles.noDataMessage}>
          No parameters found in this report.
        </div>
      );
    }
    
    return Object.entries(params).map(([category, values]) => (
      <div key={category} className={styles.categoryBlock}>
        <h3 className={styles.categoryTitle}>{category}</h3>
        <ul className={styles.parametersList}>
          {Object.entries(values).map(([key, val]) => (
            <li key={key} className={styles.parameterItem}>
              <div>
                <div className={styles.parameterName}>{key}</div>
                {val?.["Reference Range"] && (
                  <div className={styles.parameterRange}>
                    Range: {val["Reference Range"]}
                  </div>
                )}
              </div>
              <div className={styles.parameterValue}>
                {val?.Value ?? 'N/A'} {val?.Unit || ''}
              </div>
            </li>
          ))}
        </ul>
      </div>
    ));
  };

  const renderAIAnalysis = () => {
    if (analyzing) {
      return (
        <div className={styles.loadingState}>
          <div>🧠</div>
          <p className={styles.loadingText}>Analyzing report with AI...</p>
        </div>
      );
    }
    
    if (!aiAnalysis) {
      return (
        <div className={styles.noDataMessage}>
          <button onClick={fetchAIAnalysis} className={styles.analyzeButton}>
            <span className={styles.analyzeIcon}>🧠</span>
            Generate AI Analysis
          </button>
        </div>
      );
    }
    
    // Try to format the AI analysis if it's just a string
    try {
      const formattedAnalysis = typeof aiAnalysis === 'string'
        ? formatAIAnalysis(aiAnalysis)
        : aiAnalysis;
        
      return (
        <div className={styles.aiAnalysisSection}>
          <pre className={styles.analysisBox}>{formattedAnalysis}</pre>
          <p className={styles.aiAnalysisDisclaimer}>
            This analysis is generated by AI and should not replace professional medical advice.
          </p>
        </div>
      );
    } catch (err) {
      // Fallback to just displaying as is
      return (
        <div className={styles.aiAnalysisSection}>
          <pre className={styles.analysisBox}>{aiAnalysis}</pre>
          <p className={styles.aiAnalysisDisclaimer}>
            This analysis is generated by AI and should not replace professional medical advice.
          </p>
        </div>
      );
    }
  };
  
  // Helper to format AI analysis text
  const formatAIAnalysis = (text) => {
    return text;
  };

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div>⏳</div>
        <p className={styles.loadingText}>Loading report details...</p>
      </div>
    );
  }
  
  if (!reportDetails) {
    return (
      <div className={styles.errorState}>
        <p>⚠️ Report not found or access denied.</p>
        <button
          onClick={() => router.push("/dashboard")}
          className={styles.backButton}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const extractedParams = reportDetails.extractedParameters || [];
  const groupedParams = groupParametersByCategory(extractedParams);
  const reportName = reportDetails.name || reportDetails.fileName || "Unnamed Report";

  return (
    <div className={styles.container}>
      <Head>
        <title>{reportName} | Aether Health</title>
      </Head>
      
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link href="/dashboard">
            <a className={styles.backLink}>
              <span className={styles.backIcon}>←</span>
              Back to Dashboard
            </a>
          </Link>
        </div>
      </header>
      
      <main className={styles.mainContent}>
        <div className={styles.reportHeader}>
          <h1 className={styles.reportTitle}>{reportName}</h1>
          <div className={styles.reportMeta}>
            <div className={styles.reportMetaItem}>
              <span className={styles.metaLabel}>Report ID:</span>
              <span className={styles.metaValue}>{reportDetails.reportId}</span>
            </div>
            <div className={styles.reportMetaItem}>
              <span className={styles.metaLabel}>Date:</span>
              <span className={styles.metaValue}>{formatDate(reportDetails.date)}</span>
            </div>
          </div>
        </div>
        
        <div className={styles.tabsContainer}>
          <button
            onClick={() => setActiveTab("parameters")}
            className={`${styles.tabButton} ${activeTab === "parameters" ? styles.activeTab : styles.inactiveTab}`}
          >
            <span className={styles.tabIcon}>📊</span>
            Parameters
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className={`${styles.tabButton} ${activeTab === "ai" ? styles.activeTab : styles.inactiveTab}`}
          >
            <span className={styles.tabIcon}>🧠</span>
            AI Analysis
          </button>
          <button
            onClick={() =>
              router.push(
                `/reports/managesharereports?reportId=${reportDetails.reportId}&userId=${userId}`
              )
            }
            className={styles.shareButton}
          >
            <span className={styles.shareIcon}>🔗</span>
            Share Report
          </button>
        </div>
        
        <div className={styles.contentSection}>
          {activeTab === "parameters" && renderParameters(groupedParams)}
          {activeTab === "ai" && renderAIAnalysis()}
        </div>
        
        <div className={styles.bottomActions}>
          <button
            onClick={() => router.push("/dashboard")}
            className={styles.backButton}
          >
            ← Return to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}
