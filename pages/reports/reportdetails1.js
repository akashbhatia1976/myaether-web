import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import styles from "../../styles/reportdetails.module.css";
import {
  getUserDetails,
  getAuthHeaders,
  axiosInstance,
  getConfidenceScore,
  submitConfidenceFeedback,
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
  const [confidenceScore, setConfidenceScore] = useState(null);
  const [userId, setUserId] = useState(null);
  const [activeTab, setActiveTab] = useState("parameters");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    if (!router.isReady || !reportId) return;

    const fetchUserAndReport = async () => {
      try {
        const user = await getUserDetails();
        setUserId(user.userId);

        console.log(`📡 Fetching report: ${BASE_URL}/reports/${user.userId}/${reportId}`);
        await fetchReportDetails(user.userId, reportId);
          
        // Fetch confidence score
        try {
          const score = await getConfidenceScore(reportId);
          setConfidenceScore(score);
        } catch (error) {
          console.error('Failed to fetch confidence score:', error);
        }
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
    
  // Method to handle confidence feedback
  const handleConfidenceFeedback = async (isPositive) => {
    try {
      await submitConfidenceFeedback(reportId, {
        reportFeedback: isPositive,
        confidenceScore: confidenceScore?.overallConfidence
      });
      
      setFeedbackSubmitted(true);
      setTimeout(() => setFeedbackSubmitted(false), 3000);
    } catch (error) {
      console.error('Feedback submission failed:', error);
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

  const renderParameters = (params) => {
    if (!params || Object.keys(params).length === 0) {
      return <div className={styles.noDataMessage}>No parameters found in this report.</div>;
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
                {val?.Value ?? "N/A"} {val?.Unit || ""}
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
        <div className={styles.analysisLoading}>
          <div className={styles.loadingIcon}>🧠</div>
          <p>Our AI is analyzing your medical report...</p>
          <p>This may take a few moments</p>
        </div>
      );
    }

    if (!aiAnalysis) {
      return (
        <div className={styles.noDataMessage}>
          <button onClick={fetchAIAnalysis} className={styles.analyzeButton}>
            <span className={styles.analyzeIcon}>🧠</span>
            Generate AI Health Insights
          </button>
          <p>Let our AI analyze this report to give you personalized health insights.</p>
        </div>
      );
    }

    const formatAndStructureAnalysis = (analysisText) => {
      if (!analysisText) return null;
      if (analysisText.startsWith("⚠️")) {
        return (
          <div className={styles.analysisBox}>
            <div dangerouslySetInnerHTML={{ __html: analysisText }} />
          </div>
        );
      }

      const containsHtml = /<[a-z][\s\S]*>/i.test(analysisText);

      if (containsHtml) {
        return (
          <div className={styles.analysisBox}>
            <div dangerouslySetInnerHTML={{ __html: analysisText }} />
          </div>
        );
      }

      const potentialSections = analysisText.split(
        /\n\s*(?=Summary:|Overview:|Assessment:|Findings:|Recommendations:|Abnormalities:|Concerns:|Interpretation:|Follow-up:|###)/gi
      );

      if (potentialSections.length > 1) {
        return (
          <>
            {potentialSections.map((section, index) => {
              const headingMatch = section.match(
                /^(Summary|Overview|Assessment|Findings|Recommendations|Abnormalities|Concerns|Interpretation|Follow-up|###\s*[\w\s]+):/i
              );

              if (headingMatch && index > 0) {
                let heading = headingMatch[1].replace(/^###\s*/, "");
                const content = section.substring(headingMatch[0].length).trim();

                let icon = "📋";
                if (/summary|overview/i.test(heading)) icon = "📝";
                if (/assessment|findings|interpretation/i.test(heading)) icon = "🔍";
                if (/recommendations|follow-up/i.test(heading)) icon = "✅";
                if (/abnormalities|concerns/i.test(heading)) icon = "⚠️";

                return (
                  <div key={index} className={styles.analysisSection}>
                    <h4 className={styles.sectionTitle}>
                      <span className={styles.sectionIcon}>{icon}</span>
                      {heading}
                    </h4>
                    <div className={styles.analysisBox}>
                      {content.split("\n").map((paragraph, i) => {
                        const highlightedText = highlightValues(paragraph);
                        return <p key={i} dangerouslySetInnerHTML={{ __html: highlightedText }} />;
                      })}
                    </div>
                  </div>
                );
              }

              if (index === 0 || !headingMatch) {
                return (
                  <div key={index} className={styles.analysisBox}>
                    {section.split("\n").map((paragraph, i) => {
                      const highlightedText = highlightValues(paragraph);
                      return <p key={i} dangerouslySetInnerHTML={{ __html: highlightedText }} />;
                    })}
                  </div>
                );
              }

              return null;
            })}
          </>
        );
      }

      return (
        <div className={styles.analysisBox}>
          {analysisText.split("\n").map((paragraph, i) => {
            const highlightedText = highlightValues(paragraph);
            return <p key={i} dangerouslySetInnerHTML={{ __html: highlightedText }} />;
          })}
        </div>
      );
    };

    const highlightValues = (text) => {
      if (/<[a-z][\s\S]*>/i.test(text)) return text;
      const abnormalPattern = /(\bnot normal\b|\babnormal\b|\bhigh\b|\blow\b|\belevated\b|\bdecreased\b|\bincreased\b|\bexceeds\b)/gi;
      const normalPattern = /(\bnormal\b|\bwithin normal\b|\bhealthy\b|\boptimal\b)/gi;

      return text
        .replace(abnormalPattern, (match) => `<span class="${styles.abnormalValue}">${match}</span>`)
        .replace(normalPattern, (match) => `<span class="${styles.normalValue}">${match}</span>`);
    };

    try {
      return (
        <div className={styles.aiAnalysisContainer}>
          <div className={styles.aiHeader}>
            <div className={styles.aiIcon}>🧠</div>
            <div>
              <h3 className={styles.aiTitle}>AI Health Insights</h3>
              <p className={styles.aiSubtitle}>Generated {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {typeof aiAnalysis === "string"
            ? formatAndStructureAnalysis(aiAnalysis)
            : <div className={styles.analysisBox}><div dangerouslySetInnerHTML={{ __html: JSON.stringify(aiAnalysis) }} /></div>}

          <div className={styles.aiAnalysisDisclaimer}>
            <strong>Important:</strong> This analysis is generated by AI and should not replace professional medical advice. Always consult with a healthcare provider about your test results.
          </div>
        </div>
      );
    } catch (err) {
      console.error("Error rendering AI analysis:", err);
      return (
        <div className={styles.aiAnalysisSection}>
          <div className={styles.analysisBox}>
            <div dangerouslySetInnerHTML={{ __html: typeof aiAnalysis === "string" ? aiAnalysis : JSON.stringify(aiAnalysis) }} />
          </div>
          <p className={styles.aiAnalysisDisclaimer}>
            This analysis is generated by AI and should not replace professional medical advice.
          </p>
        </div>
      );
    }
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
        <button onClick={() => router.push("/dashboard")} className={styles.backButton}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  const extractedParams = reportDetails.extractedParameters || [];
  const groupedParams = groupParametersByCategory(extractedParams);
  const reportName = reportDetails.name || reportDetails.fileName || "Unnamed Report";

  // Style for feedback toast
  const feedbackToastStyle = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    backgroundColor: '#10B981',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '6px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
    opacity: feedbackSubmitted ? 1 : 0,
    transition: 'opacity 0.3s ease',
    pointerEvents: feedbackSubmitted ? 'auto' : 'none'
  };

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
              <div className={styles.reportMetaItem} style={{ display: 'flex', alignItems: 'center' }}>
                {/* Confidence Indicator */}
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    display: 'inline-block',
                    marginRight: '8px',
                    backgroundColor: confidenceScore.overallConfidence >= 80 ? '#10B981' :
                                    confidenceScore.overallConfidence >= 50 ? '#F59E0B' :
                                    '#EF4444'
                  }}
                />
                
                {/* Confidence Percentage */}
                <span className={styles.metaLabel}>Extraction Confidence:</span>
                <span className={styles.metaValue} style={{ marginRight: '8px' }}>
                  {Math.round(confidenceScore.overallConfidence)}%
                </span>
                
                {/* Feedback Buttons */}
                <div style={{ display: 'inline-flex' }}>
                  <button
                    onClick={() => handleConfidenceFeedback(true)}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      fontSize: '16px',
                      padding: '2px 6px',
                      borderRadius: '50%'
                    }}
                    aria-label="Thumbs up for confidence"
                    title="Data extraction looks good"
                  >
                    👍
                  </button>
                  <button
                    onClick={() => handleConfidenceFeedback(false)}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      fontSize: '16px',
                      padding: '2px 6px',
                      borderRadius: '50%'
                    }}
                    aria-label="Thumbs down for confidence"
                    title="Data extraction needs improvement"
                  >
                    👎
                  </button>
                </div>
              </div>
            )}
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
            onClick={() => router.push(`/reports/managesharereports?reportId=${reportDetails.reportId}&userId=${userId}`)}
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
          <button onClick={() => router.push("/dashboard")} className={styles.backButton}>
            ← Return to Dashboard
          </button>
        </div>
      </main>
      
      {/* Feedback Toast */}
      <div style={feedbackToastStyle}>
        Thank you for your feedback!
      </div>
    </div>
  );
}
