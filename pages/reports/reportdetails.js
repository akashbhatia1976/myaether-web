import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function ReportDetails() {
  const router = useRouter();
  const { userId, reportId } = router.query;
  const [reportDetails, setReportDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (userId && reportId) {
      fetchReportDetails();
    }
  }, [userId, reportId]);

  const fetchReportDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/reports/${userId}/${reportId}`);
      const data = await res.json();
      if (res.ok && data.report) {
        setReportDetails(data.report);
        if (data.report.aiAnalysis) {
          setAiAnalysis(data.report.aiAnalysis);
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

  if (loading) return <p>⏳ Loading report...</p>;

  if (!reportDetails) return <p>⚠️ Report not found.</p>;

  return (
    <div style={styles.container}>
      <h1>📝 Report Details</h1>
      <p><strong>Report ID:</strong> {reportDetails.reportId}</p>
      <p><strong>Date:</strong> {new Date(reportDetails.date).toLocaleDateString()}</p>

      <h2>📊 Extracted Parameters</h2>
      {reportDetails.extractedParameters
        ? renderParameters(reportDetails.extractedParameters)
        : <p>No extracted parameters found.</p>}

      <h2>🧠 AI Health Analysis</h2>
      {analyzing ? (
        <p>Analyzing report... 🤖</p>
      ) : (
        <pre style={styles.analysisBox}>{aiAnalysis || "No analysis available."}</pre>
      )}
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
};

