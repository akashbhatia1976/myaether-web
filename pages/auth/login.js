import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function LoginPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ Ensure API URL is properly formatted
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.startsWith("http")
      ? process.env.NEXT_PUBLIC_API_URL
      : `http://${process.env.NEXT_PUBLIC_API_URL}`;

  useEffect(() => {
    if (!API_BASE_URL) {
      console.warn("⚠️ API Base URL is missing. Set NEXT_PUBLIC_API_URL in .env.local");
    }
  }, []);

  // ✅ Redirect if already logged in
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      console.log("🔄 User already logged in, redirecting...");
      router.push("/dashboard");
    }
  }, []);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      console.log("📌 Sending login request to:", `${API_BASE_URL}/api/users/login`);

      const response = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password }),
      });

      let data;
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server Error (${response.status}): ${errorText}`);
      }

      // ✅ Parse JSON only if response is JSON
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const textData = await response.text();
        console.error("❌ Unexpected Response Format. Raw Data:", textData);
        throw new Error("Unexpected response format. Contact support.");
      }

      console.log("✅ Parsed Response:", data);

      // ✅ Ensure user data is stored **before** redirecting
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("healthId", data.healthId);
        localStorage.setItem("token", data.token); // ✅ Save JWT token

      console.log("✅ Login successful! Redirecting...");
      router.push("/dashboard");
    } catch (err) {
      console.error("❌ Login Error:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
      <h2>Login to Aether</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <input
        type="text"
        placeholder="User ID"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 10 }}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 10 }}
      />

      <button
        onClick={handleLogin}
        style={{
          width: "100%",
          padding: 10,
          backgroundColor: loading ? "#aaa" : "#6200ee",
          color: "#fff",
          cursor: loading ? "not-allowed" : "pointer",
        }}
        disabled={loading}
      >
        {loading ? "Logging in..." : "Login"}
      </button>
    </div>
  );
}

