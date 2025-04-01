import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function ReportDetails() {
  const router = useRouter();
  const [reportDetails, setReportDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [userId, setUserId] = useState(null);


  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

    useEffect(() => {
      if (!router.isReady) return;

      const { reportId } = router.query;
      if (!reportId) return;

      const fetchUserAndReport = async () => {
        try {
          const userRes = await fetch(`${API_BASE_URL}/api/users/me`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });

          if (!userRes.ok) throw new Error("Failed to fetch user");

          const user = await userRes.json();
          const userId = user.userId;

          setUserId(userId);
          console.log(`📡 Fetching report: ${API_BASE_URL}/api/reports/${userId}/${reportId}`);
          fetchReportDetails(userId, reportId);
        } catch (err) {
          console.error("❌ Failed to fetch user from token:", err);
          router.push("/auth/login");
        }
      };

      fetchUserAndReport();
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

    const fetchAIAnalysis = async (reportId) => {
      setAnalyzing(true);
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("Missing authentication token");
        }

        // Get userId from /api/users/me
        const userRes = await fetch(`${API_BASE_URL}/api/users/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!userRes.ok) throw new Error("Failed to fetch user");

        const user = await userRes.json();
        const userId = user.userId;

        const res = await fetch(`${API_BASE_URL}/api/ai-analysis/analyze-report`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
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

    const { reportId } = router.query;


  return (
    <div style={styles.container}>
      <button onClick={() => router.push("/dashboard")} style={styles.backButton}>⬅️ Back to Dashboard</button>

      <h1>📝 Report Details</h1>
      <p><strong>Report ID:</strong> {reportDetails.reportId}</p>
      <p><strong>Date:</strong> {new Date(reportDetails.date).toLocaleDateString()}</p>

      <h2>📊 Extracted Parameters</h2>
      {renderParameters(reportDetails.extractedParameters)}

      {!aiAnalysis && !analyzing && (
        <button
          onClick={() => fetchAIAnalysis(userId, reportId)}
          style={styles.analyzeButton}
        >
          🧠 Analyze with AI
        </button>
      )}

      <h2>🧠 AI Health Analysis</h2>
      {analyzing ? (
        <p>Analyzing report... 🤖</p>
      ) : (
        <pre style={styles.analysisBox}>{aiAnalysis}</pre>
      )}

      <button onClick={() => router.push("/dashboard")} style={styles.backButton}>⬅️ Back to Dashboard</button>
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
};

