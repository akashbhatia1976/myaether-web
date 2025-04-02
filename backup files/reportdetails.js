import { useEffect, useState } from "react";
import { useRouter } from "next/router";
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
  }, [router.isReady, reportId]);

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

  const groupParametersByCategory = (paramsArray) => {
    const grouped = {};
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
    if (!params || Object.keys(params).length === 0) return <p>No parameters found.</p>;
    return Object.entries(params).map(([category, values]) => (
      <div key={category} style={styles.categoryBlock}>
        <h3>{category}</h3>
        <ul>
          {Object.entries(values).map(([key, val]) => (
            <li key={key}>
              {key}: {val?.Value ?? 'N/A'} {val?.Unit || ''} (Range: {val?.["Reference Range"] || 'N/A'})
            </li>
          ))}
        </ul>
      </div>
    ));
  };

  if (loading) return <p>⏳ Loading report...</p>;
  if (!reportDetails) return <p>⚠️ Report not found.</p>;

  const extractedParams = reportDetails.extractedParameters || [];
  const groupedParams = groupParametersByCategory(extractedParams);

  return (
    <div style={styles.container}>
      <button onClick={() => router.push("/dashboard")} style={styles.backButton}>
        ⬅️ Back to Dashboard
      </button>

      <h1>📝 Report Details</h1>
      <p><strong>Report ID:</strong> {reportDetails.reportId}</p>
      <p><strong>Date:</strong> {new Date(reportDetails.date).toLocaleDateString()}</p>

      <div style={styles.tabContainer}>
        <button
          onClick={() => setActiveTab("parameters")}
          style={activeTab === "parameters" ? styles.activeTab : styles.inactiveTab}
        >📊 Parameters</button>
        <button
          onClick={() => setActiveTab("ai")}
          style={activeTab === "ai" ? styles.activeTab : styles.inactiveTab}
        >🧠 AI Analysis</button>
        <button
          onClick={() =>
            router.push(
              `/reports/managesharereports?reportId=${reportDetails.reportId}&userId=${userId}`
            )
          }
          style={styles.shareButton}
        >
          🔗 Share Report
        </button>
      </div>

      {activeTab === "parameters" && renderParameters(groupedParams)}

      {activeTab === "ai" && (
        analyzing ? (
          <p>Analyzing report... 🤖</p>
        ) : aiAnalysis ? (
          <pre style={styles.analysisBox}>{aiAnalysis}</pre>
        ) : (
          <button onClick={fetchAIAnalysis} style={styles.analyzeButton}>
            🧠 Generate AI Analysis
          </button>
        )
      )}

      <button onClick={() => router.push("/dashboard")} style={styles.backButton}>
        ⬅️ Back to Dashboard
      </button>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "800px",
    margin: "auto",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },
  categoryBlock: {
    marginBottom: "20px",
  },
  analysisBox: {
    whiteSpace: "pre-wrap",
    backgroundColor: "#f8f8f8",
    padding: "15px",
    borderRadius: "5px",
    border: "1px solid #ccc",
  },
  backButton: {
    backgroundColor: "#0070f3",
    color: "white",
    padding: "10px 20px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    marginBottom: "20px",
  },
  analyzeButton: {
    backgroundColor: "#28a745",
    color: "white",
    padding: "10px 20px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    marginBottom: "20px",
  },
  tabContainer: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
  },
  activeTab: {
    padding: "10px 20px",
    backgroundColor: "#0D9488",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  inactiveTab: {
    padding: "10px 20px",
    backgroundColor: "#f3f4f6",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: "5px",
    cursor: "pointer",
  },
  shareButton: {
    padding: "10px 20px",
    backgroundColor: "#f59e0b",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

