import { useState } from "react";
import { useRouter } from "next/router";

export default function LoginPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    
    try {
      const response = await fetch("/api/users/login", { // ✅ Relative URL for API
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Login failed.");

      // ✅ Store UserID and Health ID in local storage
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("healthId", data.healthId);

      console.log("✅ Login successful! Redirecting...");
      router.push("/dashboard"); // ✅ Redirect to dashboard
    } catch (err) {
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

