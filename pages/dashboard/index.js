import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Dashboard() {
    const router = useRouter();
    const [userData, setUserData] = useState(null);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasTriedFetch, setHasTriedFetch] = useState(false);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

    useEffect(() => {
        // Prevent running on server-side
        if (typeof window === "undefined") return;

        const fetchDashboardData = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                console.warn("No token found, redirecting to login...");
                setLoading(false);
                router.push("/auth/login");
                return;
            }

            try {
                const userRes = await fetch(`${API_BASE_URL}/api/users/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!userRes.ok) {
                    throw new Error("Invalid token or user not found");
                }

                const user = await userRes.json();
                setUserData(user);

                const reportsRes = await fetch(`${API_BASE_URL}/api/reports?userId=${user.userId}`);
                const reportsData = await reportsRes.json();
                if (!reportsRes.ok) throw new Error("Error fetching reports");
                setReports(reportsData);
            } catch (err) {
                console.error("❌ Error fetching dashboard data:", err.message);
                router.push("/auth/login");
            } finally {
                setLoading(false);
                setHasTriedFetch(true);
            }
        };

        // Only try fetch once
        if (!hasTriedFetch) {
            fetchDashboardData();
        }
    }, [hasTriedFetch]);

    if (loading) return <p>Loading dashboard...</p>;
    if (!userData) return <p>Error loading user data.</p>;

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
                    {reports.map(report => (
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

