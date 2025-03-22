import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Dashboard() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [tokenChecked, setTokenChecked] = useState(false);
  const [userData, setUserData] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
    }
    setTokenChecked(true);
  }, []);

  useEffect(() => {
    if (tokenChecked && !token) {
      router.replace("/auth/login");
    }
  }, [tokenChecked, token]);

  useEffect(() => {
    if (!tokenChecked || !token) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const userRes = await fetch(`${API_BASE_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!userRes.ok) throw new Error("User fetch failed");

        const user = await userRes.json();
        setUserData(user);

        const reportsRes = await fetch(`${API_BASE_URL}/api/reports/${user.userId}`);
        if (!reportsRes.ok) throw new Error("Reports fetch failed");

        const reportsData = await reportsRes.json();
        setReports(reportsData.reports || []);
      } catch (err) {
        console.error("❌ Error loading dashboard:", err.message);
        router.replace("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tokenChecked, token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("healthId");
    router.replace("/auth/login");
  };

  const handleUpload = () => router.push("/upload");
  const handleShare = () => router.push("/share");
  const handleViewShared = () => router.push("/shared");

  const extractTop3Params = (extractedParams) => {
    if (!extractedParams) return [];
    const flatParams = [];

    Object.entries(extractedParams).forEach(([category, tests]) => {
      Object.entries(tests).forEach(([param, details]) => {
        flatParams.push({
          parameter: param,
          value: details?.Value || "N/A",
          unit: details?.Unit || "",
        });
      });
    });

    return flatParams.slice(0, 3);
  };

  if (!tokenChecked) return <p>🧠 Checking login...</p>;
  if (loading) return <p>⏳ Loading dashboard...</p>;
  if (!userData) return <p>⚠️ Unable to load user.</p>;

  return (
    <div style={styles.container}>
      <h1>Welcome, {userData.userId}</h1>
      <p><strong>Health ID:</strong> {userData.healthId}</p>
      <p><strong>Total Reports:</strong> {reports.length}</p>

      <div style={styles.buttonContainer}>
        <button onClick={handleUpload} style={styles.button}>Upload Report</button>
        <button onClick={handleShare} style={styles.button}>Share Reports</button>
        <button onClick={handleViewShared} style={styles.button}>View Shared Reports</button>
        <button onClick={handleLogout} style={{ ...styles.button, backgroundColor: "#e53935" }}>Logout</button>
      </div>

      <h2>Your Reports</h2>
      {reports.length === 0 ? (
        <p>No reports uploaded yet.</p>
      ) : (
        <ul style={styles.reportList}>
          {reports.map((report) => {
            const top3 = extractTop3Params(report.extractedParameters);
            return (
              <li
                key={report._id}
                style={styles.reportItem}
                onClick={() => router.push(`/reports/${userData.userId}/${report._id}`)}
              >
                <strong>{report.reportId || "Unnamed Report"}</strong>{" "}
                <em>({report.date ? new Date(report.date).toLocaleDateString() : "No date"})</em>
                <ul style={styles.paramList}>
                  {top3.map((param, idx) => (
                    <li key={idx} style={styles.paramItem}>
                      {param.parameter}: {param.value} {param.unit}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
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
  buttonContainer: {
    marginTop: "20px",
    marginBottom: "20px",
  },
  button: {
    marginRight: "10px",
    padding: "10px 15px",
    backgroundColor: "#6200ee",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  reportList: {
    listStyleType: "none",
    padding: 0,
  },
  reportItem: {
    background: "#f2f2f2",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "5px",
    cursor: "pointer",
  },
  paramList: {
    paddingLeft: "15px",
    marginTop: "5px",
  },
  paramItem: {
    fontSize: "14px",
  },
};

