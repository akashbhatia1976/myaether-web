import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function LoginPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      console.log("🔄 Token found, redirecting to dashboard...");
      router.push("/");
    }
  }, []);

  const handleLogin = async () => {
    console.log("🚀 Login button clicked"); // ✅ Added debug log

    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Login failed: ${errText}`);
      }

      const data = await response.json();

      // ✅ Save user details and token
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("healthId", data.healthId);
      localStorage.setItem("token", data.token);

      console.log("✅ Login successful, token saved.");
      router.push("/dashboard");
    } catch (err) {
      console.error("❌ Login Error:", err.message);
      setError(err.message || "Something went wrong.");
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
        disabled={loading}
        style={{
          width: "100%",
          padding: 10,
          backgroundColor: loading ? "#aaa" : "#6200ee",
          color: "#fff",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Logging in..." : "Login"}
      </button>
    </div>
  );
}

