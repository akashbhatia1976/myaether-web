import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Dashboard() {
  const router = useRouter();
  const [tokenChecked, setTokenChecked] = useState(false);
  const [token, setToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  // ✅ Phase 1: Check for token only on client
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("token");
      if (!storedToken) {
        console.warn("Token not found. Redirecting to login.");
        router.push("/auth/login");
      } else {
        setToken(storedToken);
      }
      setTokenChecked(true);
    }
  }, []);

  // ✅ Phase 2: Fetch user data after token is confirmed
  useEffect(() => {
    if (!tokenChecked || !token) return;

    async function fetchData() {
      try {
        const userResponse = await fetch(`${API_BASE_URL}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!userResponse.ok) {
          throw new Error("Failed to fetch user data");
        }

        const user = await userResponse.json();
        setUserData(user);

        // ✅ Fetch reports
        const reportsResponse = await fetch(`${API_BASE_URL}/api/reports?userId=${user.userId}`);
        if (!reportsResponse.ok) {
          throw new Error("Failed to fetch reports");
        }

        const reportsData = await reportsResponse.json();
        setReports(reportsData);
      } catch (err) {
        console.error("Error fetching dashboard data:", err.message);
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [tokenChecked, token]);

  // ✅ Phase 3: UI States
  if (!tokenChecked) return <p>🔒 Checking authentication...</p>;
  if (loading) return <p>⏳ Loading dashboard...</p>;
  if (!userData) return <p>❌ Error loading user data.</p>;

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Welcome, {userData.userId}</h1>
      <p><strong>Health ID:</strong> {userData.healthId}</p>
      <p><strong>Total Reports:</strong> {reports.length}</p>

      <h2>Your Reports</h2>
      {reports.length === 0 ? (
        <p>No reports available.</p>
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

