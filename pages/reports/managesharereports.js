// 📁 pages/reports/managesharereports.js (Refactored)

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import {
  shareAllReports,
  shareReport,
  getUserDetails,
} from "../../utils/apiService";

export default function ManageShareReports() {
  const router = useRouter();
  const { reportId, userId: queryUserId } = router.query;

  const [userData, setUserData] = useState(null);
  const [sharedWith, setSharedWith] = useState("");
  const [relationshipType, setRelationshipType] = useState("Friend");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await getUserDetails();
        setUserData(user);
      } catch (err) {
        console.error("❌ Error fetching user data:", err);
        setError("Failed to load user session.");
      }
    };

    fetchUserData();
  }, []);

  const handleShare = async () => {
    if (!sharedWith || !relationshipType) {
      alert("Please enter recipient and select relationship type.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage("");

      const payload = {
        ownerId: userData.userId,
        sharedWith,
        relationshipType,
        permissionType: "view",
      };

      if (reportId) {
        payload.reportId = reportId;
        await shareReport(payload);
        setSuccessMessage("✅ Report shared successfully!");
      } else {
        await shareAllReports(payload);
        setSuccessMessage("✅ All reports shared successfully!");
      }

      setSharedWith("");
      setRelationshipType("Friend");
    } catch (err) {
      console.error("❌ Share error:", err);
      setError(err.message || "Failed to share. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!userData) return <p style={styles.message}>Loading user info...</p>;

  return (
    <div style={styles.container}>
      <Head>
        <title>{reportId ? "Share Report" : "Share All Reports"} | Aether</title>
      </Head>
      <h2>{reportId ? "🔗 Share Single Report" : "🔗 Share All Reports"}</h2>

      <div style={styles.formGroup}>
        <label>Share with (User ID or Email):</label>
        <input
          type="text"
          value={sharedWith}
          onChange={(e) => setSharedWith(e.target.value)}
          placeholder="Enter recipient ID/email"
          style={styles.input}
        />
      </div>

      <div style={styles.formGroup}>
        <label>Relationship Type:</label>
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
      </div>

      <button onClick={handleShare} style={styles.button} disabled={loading}>
        {loading ? "Sharing..." : reportId ? "Share Report" : "Share All Reports"}
      </button>

      {successMessage && <p style={styles.success}>{successMessage}</p>}
      {error && <p style={styles.error}>{error}</p>}

      <button style={styles.backButton} onClick={() => router.push("/dashboard")}>⬅ Back to Dashboard</button>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "600px",
    margin: "40px auto",
    padding: 20,
    fontFamily: "Arial, sans-serif",
  },
  formGroup: {
    marginBottom: 20,
  },
  input: {
    width: "100%",
    padding: 10,
    fontSize: 16,
    borderRadius: 5,
    border: "1px solid #ccc",
  },
  select: {
    width: "100%",
    padding: 10,
    fontSize: 16,
    borderRadius: 5,
    border: "1px solid #ccc",
  },
  button: {
    padding: "10px 20px",
    backgroundColor: "#0D9488",
    color: "white",
    border: "none",
    borderRadius: 5,
    cursor: "pointer",
  },
  backButton: {
    marginTop: 30,
    backgroundColor: "#ccc",
    padding: "10px 15px",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  success: {
    marginTop: 15,
    color: "green",
  },
  error: {
    marginTop: 15,
    color: "red",
  },
  message: {
    textAlign: "center",
    marginTop: 40,
  },
};


