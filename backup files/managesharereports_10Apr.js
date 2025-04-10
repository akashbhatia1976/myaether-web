// 📁 pages/reports/managesharereports.js

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import {
  shareAllReports,
  shareReport,
  getUserDetails,
} from "../../utils/apiService";

// Server-side authentication check
export async function getServerSideProps(context) {
  const { req } = context;
  const cookies = req.cookies;

  if (!cookies.token) {
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}

export default function ManageShareReports() {
  const router = useRouter();
  const { reportId } = router.query;

  const [userData, setUserData] = useState(null);
  const [sharedWith, setSharedWith] = useState("");
  const [relationshipType, setRelationshipType] = useState("Friend");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const user = await getUserDetails();
        setUserData(user);
      } catch (err) {
        console.error("❌ Error loading user data:", err);
        setError("Could not load user data. Please try logging in again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleShare = async () => {
    if (!sharedWith) {
      return alert("Please enter a user ID, email, or phone number.");
    }

    if (!userData) {
      return alert("User data is not loaded yet. Please try again.");
    }

    const payload = {
      ownerId: userData.userId,
      sharedWith,
      relationshipType,
      permissionType: "view",
    };

    if (reportId) {
      payload.reportId = reportId;
    }

    console.log("📦 Payload being sent:", payload);

    try {
      setLoading(true);
      setError(null);

      let data;
      if (reportId) {
        data = await shareReport(payload);
      } else {
        data = await shareAllReports(payload);
      }

      alert(`✅ Report${reportId ? "" : "s"} shared successfully!`);
      setSharedWith("");
      setRelationshipType("Friend");
      router.push("/dashboard");
    } catch (error) {
      console.error("❌ Share error:", error);
      setError(error.message || "Failed to share reports. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !userData) {
    return (
      <div style={styles.container}>
        <p style={styles.loadingText}>Loading user data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <p style={styles.errorText}>{error}</p>
        <button
          onClick={() => router.push("/auth/login")}
          style={styles.button}
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Head>
        <title>Share Health Reports | Aether Health</title>
      </Head>

      <div style={styles.header}>
        <button
          onClick={() => router.push("/dashboard")}
          style={styles.backButton}
        >
          ← Back to Dashboard
        </button>
      </div>

      <h2 style={styles.title}>
        {reportId ? "Share Report" : "Share All Reports"}
      </h2>

      {userData && (
        <div style={styles.userInfo}>
          <p>
            Sharing as: <strong>{userData.userId}</strong>
          </p>
        </div>
      )}

      <label style={styles.label}>
        Share with (user ID, email, or phone):
      </label>
      <input
        type="text"
        placeholder="Enter user ID, email, or phone"
        value={sharedWith}
        onChange={(e) => setSharedWith(e.target.value)}
        style={styles.input}
      />

      <label style={styles.label}>Relationship Type:</label>
      <select
        value={relationshipType}
        onChange={(e) => setRelationshipType(e.target.value)}
        style={styles.select}
      >
        <option value="Friend">Friend</option>
        <option value="Family">Family</option>
        <option value="Doctor">Doctor</option>
        <option value="Caregiver">Caregiver</option>
        <option value="Other">Other</option>
      </select>

      <button
        onClick={handleShare}
        style={
          loading
            ? { ...styles.button, ...styles.buttonDisabled }
            : styles.button
        }
        disabled={loading}
      >
        {loading
          ? "Sharing..."
          : reportId
          ? "Share Report"
          : "Share All Reports"}
      </button>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "500px",
    margin: "40px auto",
    padding: "20px",
    backgroundColor: "#fff",
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    fontFamily: "'Segoe UI', sans-serif",
  },
  header: {
    marginBottom: "20px",
  },
  backButton: {
    background: "none",
    border: "none",
    color: "#4361ee",
    fontSize: "16px",
    cursor: "pointer",
    padding: "0",
  },
  title: {
    fontSize: "24px",
    marginBottom: "20px",
    color: "#333",
    fontWeight: "600",
  },
  userInfo: {
    padding: "10px",
    backgroundColor: "#f5f8ff",
    borderRadius: "6px",
    marginBottom: "20px",
  },
  label: {
    display: "block",
    marginTop: "15px",
    marginBottom: "5px",
    color: "#555",
    fontWeight: "500",
  },
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "14px",
  },
  select: {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "14px",
  },
  button: {
    marginTop: "25px",
    width: "100%",
    padding: "12px",
    borderRadius: "6px",
    backgroundColor: "#4361ee",
    color: "white",
    fontSize: "16px",
    fontWeight: "600",
    border: "none",
    cursor: "pointer",
  },
  buttonDisabled: {
    backgroundColor: "#a0aae8",
    cursor: "not-allowed",
  },
  loadingText: {
    textAlign: "center",
    fontSize: "16px",
    color: "#666",
  },
  errorText: {
    color: "#e53935",
    textAlign: "center",
    marginBottom: "20px",
  },
};

