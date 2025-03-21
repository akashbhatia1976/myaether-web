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

        const reportsResponse = await fetch(`${API_BASE_URL}/api/reports/${user.userId}`);
        console.log("📦 Fetching reports for userId:", user.userId);

        if (!reportsResponse.ok) {
          const errText = await reportsResponse.text();
          throw new Error("Reports fetch failed: " + errText);
        }

        const reportsData = await reportsResponse.json();
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
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("healthId");
      console.log("🔒 Logged out. Token cleared.");
      router.replace("/auth/login");
    } catch (err) {
      console.error("❌ Logout failed:", err.message);
    }
  };

  const handleUpload = () => {
    router.push("/upload");
  };

  const handleShare = () => {
    router.push("/share");
  };

  const handleViewShared = () => {
    router.push("/shared");
  };

  if (!tokenChecked) return <p>🧠 Checking login...</p>;
  if (loading) return <p>⏳ Loading dashboard...</p>;
  if (!userData) return <p>⚠️ Unable to load user.</p>;

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Welcome, {userData.userId}</h1>
      <p><strong>Health ID:</strong> {userData.healthId}</p>
      <p><strong>Total Reports:</strong> {reports.length}</p>

      <div style={{ margin: "20px 0" }}>
        <button onClick={handleUpload} style={buttonStyle}>Upload Report</button>
        <button onClick={handleShare} style={buttonStyle}>Share Reports</button>
        <button onClick={handleViewShared} style={buttonStyle}>View Shared Reports</button>
        <button onClick={handleLogout} style={{ ...buttonStyle, backgroundColor: "#e53935" }}>Logout</button>
      </div>

      <h2>Your Reports</h2>
      {reports.length === 0 ? (
        <p>No reports uploaded yet.</p>
      ) : (
        <ul>
          {reports.map((report) => (
            <li
              key={report._id}
              style={{ cursor: "pointer", color: "blue", textDecoration: "underline", marginBottom: 6 }}
              onClick={() => router.push(`/reports/${report._id}`)}
            >
              {report.fileName}
              {report.uploadDate && (
                <> - {new Date(report.uploadDate).toLocaleDateString()}</>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const buttonStyle = {
  padding: "10px 15px",
  marginRight: "10px",
  backgroundColor: "#6200ee",
  color: "#fff",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

