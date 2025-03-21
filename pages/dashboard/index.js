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

  // ✅ Check token only once client is ready
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        setToken(storedToken);
        setTokenChecked(true);
      } else {
        // No token — defer redirect outside render loop
        setTokenChecked(true);
      }
    }
  }, []);

  // ✅ If no token after check, redirect to login
  useEffect(() => {
    if (tokenChecked && !token) {
      router.replace("/auth/login");
    }
  }, [tokenChecked, token]);

  // ✅ Fetch user and reports after token check passes
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

        const reportsRes = await fetch(`${API_BASE_URL}/api/reports?userId=${user.userId}`);
        if (!reportsRes.ok) throw new Error("Reports fetch failed");

        const reportsData = await reportsRes.json();
        setReports(reportsData);
      } catch (err) {
        console.error("❌ Error:", err.message);
        router.replace("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tokenChecked, token]);

  // ✅ UI Rendering
  if (!tokenChecked) return <p>🧠 Checking login...</p>;
  if (loading) return <p>⏳ Loading dashboard...</p>;
  if (!userData) return <p>⚠️ Unable to load user.</p>;

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Welcome, {userData.userId}</h1>
      <p><strong>Health ID:</strong> {userData.healthId}</p>
      <p><strong>Total Reports:</strong> {reports.length}</p>

      <h2>Your Reports</h2>
      {reports.length === 0 ? (
        <p>No reports uploaded yet.</p>
      ) : (
        <ul>
          {reports.map((report) => (
            <li
              key={report._id}
              style={{ cursor: "pointer", color: "blue", textDecoration: "underline" }}
              onClick={() => router.push(`/reports/${report._id}`)}
            >
              {report.fileName} - {new Date(report.uploadDate).toLocaleDateString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

