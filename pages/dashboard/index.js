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
      setTokenChecked(true);
    } else {
      setTokenChecked(true);
    }
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
        if (!reportsRes.ok) throw new Error("Report fetch failed");
        const reportsData = await reportsRes.json();

        setReports(reportsData.reports || []);
      } catch (err) {
        console.error("❌ Error:", err.message);
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

  if (!tokenChecked) return <p>🧠 Checking login...</p>;
  if (loading) return <p>⏳ Loading dashboard...</p>;
  if (!userData) return <p>⚠️ Unable to load user.</p>;

  return (
    <div style={styles.container}>
      <h1>Welcome, {userData.userId}</h1>
      <p><strong>Health ID:</strong> {userData.healthId}</p>
      <p><strong>Total Reports:</strong> {reports.length}</p>

      <div style={styles.actions}>
        <button onClick={handleUpload} style={styles.button}>Upload Report</button>
        <button onClick={handleShare} style={styles.button}>Share Reports</button>
        <button onClick={handleViewShared} style={styles.button}>View Shared Reports</button>
        <button onClick={handleLogout} style={{ ...styles.button, backgroundColor: "#e53935" }}>Logout</button>
      </div>

      <h2>Your Reports</h2>
      {reports.length === 0 ? (
        <p>No reports uploaded yet.</p>
      ) : (
        <ul>
          {reports.map((report) => (
            <li
              key={report._id}
              onClick={() => router.push(`/reports/${report._id}`)}
              style={styles.reportItem}
            >
              <strong>{report.reportId || report._id}</strong>
              {report.uploadDate && <> - {new Date(report.uploadDate).toLocaleDateString()}</>}
              {report.extractedParameters && (
                <div style={{ fontSize: 14 }}>
                  {report.extractedParameters.length} parameters extracted
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },
  actions: {
    margin: "20px 0",
  },
  button: {
    padding: "10px 15px",
    marginRight: "10px",
    backgroundColor: "#6200ee",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  reportItem: {
    cursor: "pointer",
    color: "blue",
    textDecoration: "underline",
    marginBottom: "10px",
  },
};

