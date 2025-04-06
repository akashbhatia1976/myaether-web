import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { token } = router.query;
  const [status, setStatus] = useState("Verifying...");
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/verify-email?token=${token}`, { method: "GET" });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Verification failed.");

      setStatus("✅ Email verified successfully! Redirecting to login...");
      setVerified(true);
      setTimeout(() => router.push("/auth/login"), 3000); // Auto-redirect after 3s
    } catch (error) {
      console.error("❌ Email verification error:", error);
      setStatus("❌ Verification failed. Invalid or expired token.");
    }
  };

  return (
    <div style={styles.container}>
      <h2>Email Verification</h2>
      <p>{status}</p>

      {verified && (
        <button onClick={() => router.push("/auth/login")} style={styles.button}>
          Go to Login
        </button>
      )}
    </div>
  );
}

// ✅ Inline Styles
const styles = {
  container: {
    maxWidth: "500px",
    margin: "auto",
    padding: "20px",
    textAlign: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
  },
  button: {
    padding: "10px",
    backgroundColor: "#6200ee",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    marginTop: "10px",
  },
};


