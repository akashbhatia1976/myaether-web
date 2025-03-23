import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function ReportDetails() {
  const router = useRouter();
  const [reportDetails, setReportDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!router.isReady) return;

    const { userId, reportId } = router.query;
    if (userId && reportId) {
      console.log("🔧 API_BASE_URL =", API_BASE_URL);
      console.log("👤 userId =", userId);
      console.log("📄 reportId =", reportId);
      console.log(`📡 Fetching: ${API_BASE_URL}/api/reports/${userId}/${reportId}`);
      fetchReportDetails(userId, reportId);
    }
  }, [router.isReady, router.query]);

  const fetchReportDetails = async (userId, reportId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/reports/${userId}/${reportId}`);
      const data = await res.json();

      console.log("✅ Fetched:", data);

      if (res.ok && data) {
        setReportDetails(data);

        if (data.aiAnalysis) {
          setAiAnalysis(data.aiAnalysis);
        } else {
          fetchAIAnalysis(userId, reportId);
        }
      } else {
        console.warn("⚠️ Report fetch returned empty or failed.", data);
      }
    } catch (err) {
      console.error("❌ Failed to load report:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAIAnalysis = async (userId, reportId) => {
    setAnalyzing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/ai-analysis/analyze-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, reportId }),
      });
      const data = await res.json();
      if (res.ok) {
        setAiAnalysis(data.analysis);
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

  const goBackToDashboard = () => {
    router.push("/dashboard");
  };

  if (loading) return <p>⏳ Loading report...</p>;
  if (!reportDetails) return <p>⚠️ Report not found.</p>;

  return (
    <div style={styles.container}>
      <button onClick={goBackToDashboard} style={styles.backButton}>← Back to Dashboard</button>

      <h1>📝 Report Details</h1>
      <p><strong>Report ID:</strong> {reportDetails.reportId}</p>
      <p><strong>Date:</strong> {new Date(reportDetails.date).toLocaleDateString()}</p>

      <h2>📊 Extracted Parameters</h2>
      {renderParameters(reportDetails.extractedParameters)}

      <h2>🧠 AI Health Analysis</h2>
      {analyzing ? (
        <p>Analyzing report... 🤖</p>
      ) : (
        <pre style={styles.analysisBox}>{aiAnalysis}</pre>
      )}

      <button onClick={goBackToDashboard} style={{ ...styles.backButton, marginTop: "30px" }}>
        ← Back to Dashboard
      </button>
    </div>
  );
}

// Helper function to render nested parameters
const renderParameters = (params) => {
  return Object.entries(params).map(([category, values]) => (
    <div key={category} style={styles.categoryBlock}>
      <h3>{category}</h3>
      <ul>
        {Object.entries(values).map(([key, val]) => (
          <li key={key}>
            {key}: {val.Value} {val.Unit} (Range: {val["Reference Range"]})
          </li>
        ))}
      </ul>
    </div>
  ));
};

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
    color: "#fff",
    border: "none",
    padding: "10px 15px",
    borderRadius: "5px",
    cursor: "pointer",
    marginBottom: "20px",
  },
};

