// 📁 pages/reports/managesharereports.js

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  shareAllReports,
  getUserDetails,
} from "../../utils/apiService";

export default function ManageShareReports() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [sharedWith, setSharedWith] = useState("");
  const [relationshipType, setRelationshipType] = useState("Friend");
  const [loading, setLoading] = useState(false);
  const [tokenChecked, setTokenChecked] = useState(false);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
    }
    setTokenChecked(true);
  }, []);

  useEffect(() => {
    if (!tokenChecked || !token) return;

    const fetchUser = async () => {
      try {
        const user = await getUserDetails();
        setUserData(user);
      } catch (err) {
        console.error("❌ Error loading user:", err);
        router.replace("/auth/login");
      }
    };

    fetchUser();
  }, [tokenChecked, token]);

  const handleShare = async () => {
    if (!sharedWith) return alert("Please enter a user ID, email, or phone number.");

    const payload = {
      ownerId: userData.userId,
      sharedWith,
      relationshipType,
      permissionType: "view",
    };

    console.log("📦 Payload being sent:", payload);

    try {
      setLoading(true);
      const data = await shareAllReports(payload); // ✅ Centralized, authenticated call

      alert("✅ Reports shared successfully!");
      setSharedWith("");
      setRelationshipType("Friend");
      router.push("/dashboard");

    } catch (error) {
      console.error("❌ Share error:", error);
      alert(error.message || "Failed to share reports. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!tokenChecked) return <p>Checking authentication...</p>;
  if (!userData) return <p>Loading user...</p>;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Manage Report Sharing</h2>

      <label style={styles.label}>Share with (user ID, email, or phone):</label>
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

      <button onClick={handleShare} style={styles.button} disabled={loading}>
        {loading ? "Sharing..." : "Share All Reports"}
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
  title: {
    fontSize: "20px",
    marginBottom: "20px",
    color: "#333",
    fontWeight: "600",
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
};

