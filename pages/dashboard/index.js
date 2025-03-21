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
  console.log("🌐 API_BASE_URL:", API_BASE_URL);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        setToken(storedToken);
        setTokenChecked(true);
      } else {
        setTokenChecked(true);
      }
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
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!userRes.ok) throw new Error("User fetch failed");
        const user = await userRes.json();
        setUserData(user);

        // Fetch user's reports
        const reportsRes = await fetch(`${API_BASE_URL}/api/reports/${user.userId}`);
        if (!reportsRes.ok) {
          const errText = await reportsRes.text();
          throw new Error("Reports fetch failed: " + errText);
        }

        const reportsData = await reportsRes.json();
        setReports(reportsData.reports || []);
      } catch (err) {
        console.error("❌ Dashboard Load Error:", err.message);
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
      localStorage.clear();
    router.replace("/auth/login");
  };

  const handleUpload = () => router.push("/upload");
  const handleShare = () => router.push("/share");
  const handleViewShared = () => router.push("/shared");

  if (!tokenChecked) return <p>🧠 Checking login...</p>;
  if (loading) return <p>⏳ Loading dashboard...</p>;
  if (!userData) return <p>⚠️ Unable to load user.</p>;

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Welcome, {userData.userId}</h1>
      <p><strong>Health ID:</strong> {userData.healthId}</p>

      <div style={{ marginTop: "20px", marginBottom: "20px" }}>
        <button onClick={handleUpload} style={btnStyle}>Upload Report</button>
        <button onClick={handleShare} style={btnStyle}>Share Reports</button>
        <button onClick={handleViewShared} style={btnStyle}>View Shared Reports</button>
        <button onClick={handleLogout} style={{ ...btnStyle, backgroundColor: "#d32f2f" }}>Logout</button>
      </div>

      <h2>Your Reports ({reports.length})</h2>
      {reports.length === 0 ? (
        <p>No reports uploaded yet.</p>
      ) : (
        <ul>
          {reports.map((report) => (
            <li
              key={report._id || report.reportId}
              style={{ cursor: "pointer", color: "blue", textDecoration: "underline", marginBottom: 8 }}
              onClick={() => router.push(`/reports/${report.reportId || report._id}`)}
            >
              {report.fileName || "Unnamed Report"}{" "}
              {report.uploadDate ? `- ${new Date(report.uploadDate).toLocaleDateString()}` : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const btnStyle = {
  marginRight: "10px",
  padding: "10px 15px",
  backgroundColor: "#6200ee",
  color: "#fff",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

