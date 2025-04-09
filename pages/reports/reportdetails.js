import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import styles from "../../styles/reportdetails.module.css";

import {
  getConfidenceScore,
  submitConfidenceFeedback,
  getUserDetails,
  axiosInstance,
  BASE_URL,
} from "../../utils/apiService";

export async function getServerSideProps(context) {
  const { req } = context;
  const cookies = req.cookies;

  if (!cookies.token) {
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}

export default function ReportDetails() {
  const router = useRouter();
  const { reportId } = router.query;

  const [reportDetails, setReportDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [userId, setUserId] = useState(null);
  const [confidenceScore, setConfidenceScore] = useState(null);
  const [activeTab, setActiveTab] = useState("parameters");
    
  const fetchConfidenceScore = async () => {
    try {
      const score = await getConfidenceScore(reportId);
      console.log("✅ Confidence Score:", score);
      setConfidenceScore(score);
    } catch (err) {
      console.error("❌ Confidence score fetch error:", err);
    }
  };

  const handleConfidenceFeedback = async (isPositive) => {
    try {
      await submitConfidenceFeedback(reportId, {
        reportFeedback: isPositive,
        confidenceScore: confidenceScore?.overallConfidence
      });
    } catch (error) {
      console.error('Feedback submission failed:', error);
    }
  };

  useEffect(() => {
    if (!router.isReady || !reportId) return;

    const fetchUserAndReport = async () => {
      try {
        const user = await getUserDetails();
        setUserId(user.userId);

        console.log(`📡 Fetching report: ${BASE_URL}/reports/${user.userId}/${reportId}`);
        fetchReportDetails(user.userId, reportId);
        fetchConfidenceScore();
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
      const res = await axiosInstance.get(`/reports/${userId}/${reportId}`);
      const data = res.data;
      console.log("✅ Fetched:", data);

      if (data) {
        setReportDetails(data);
        if (data.aiAnalysis) setAiAnalysis(data.aiAnalysis);
      } else {
        console.warn("⚠️ Report fetch returned empty.", data);
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
      const res = await axiosInstance.post(`/ai-analysis/analyze-report`, {
        userId,
        reportId,
      });
      const data = res.data;
      setAiAnalysis(data.analysis);
      setActiveTab("ai");
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
      const params = reportDetails.extractedParameters;
      if (params && typeof params === "object") {
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

  // [Rest of the existing methods remain exactly the same - renderParameters(), renderAIAnalysis(), etc.]

  // In the return statement, update the reportHeader section
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
            {confidenceScore && (
              <div className={styles.reportMetaItem}>
                <div className="flex items-center">
                  <span
                    className={`
                      inline-block w-3 h-3 rounded-full mr-2 
                      ${confidenceScore.overallConfidence >= 80 ? 'bg-green-500' : 
                        confidenceScore.overallConfidence >= 50 ? 'bg-yellow-500' : 
                        'bg-red-500'}
                    `}
                  />
                  <span className={styles.metaLabel}>Extraction Confidence:</span>
                  <span className={`${styles.metaValue} ml-2`}>
                    {Math.round(confidenceScore.overallConfidence)}%
                  </span>
                  <div className="ml-2 flex space-x-1">
                    <button
                      onClick={() => handleConfidenceFeedback(true)}
                      className="text-green-500 hover:bg-green-100 rounded-full p-1"
                      aria-label="Thumbs up for confidence"
                    >
                      👍
                    </button>
                    <button
                      onClick={() => handleConfidenceFeedback(false)}
                      className="text-red-500 hover:bg-red-100 rounded-full p-1"
                      aria-label="Thumbs down for confidence"
                    >
                      👎
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rest of the existing code remains exactly the same */}
        <div className={styles.tabsContainer}>
          {/* ... existing tabs ... */}
        </div>

        <div className={styles.contentSection}>
          {activeTab === "parameters" && renderParameters(groupedParams)}
          {activeTab === "ai" && renderAIAnalysis()}
        </div>

        <div className={styles.bottomActions}>
          <button onClick={() => router.push("/dashboard")} className={styles.backButton}>
            ← Return to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}
