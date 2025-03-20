import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Dashboard() {
    const router = useRouter();
    const [userData, setUserData] = useState(null);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

    useEffect(() => {
        async function fetchData() {
            try {
                // ✅ Get userId from localStorage or cookies
                const storedUserId = localStorage.getItem("userId"); // Adjust if using cookies
                if (!storedUserId) throw new Error("User ID not found, redirecting to login");

                // ✅ Fetch user details using userId
                const userResponse = await fetch(`${API_BASE_URL}/api/users/${storedUserId}`);
                const user = await userResponse.json();
                if (!userResponse.ok) throw new Error(user.error || "Failed to fetch user data");

                // ✅ Fetch user reports
                const reportsResponse = await fetch(`${API_BASE_URL}/api/reports?userId=${storedUserId}`);
                const reportsData = await reportsResponse.json();
                if (!reportsResponse.ok) throw new Error(reportsData.error || "Failed to fetch reports");

                // ✅ Set state
                setUserData(user);
                setReports(reportsData);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
                router.push("/auth/login"); // Redirect to login if user session is missing
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

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

