import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import styles from "../styles/login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      console.log("🔄 Token found, redirecting to dashboard...");
      router.push("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("🚀 Form submitted");

    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        // Login logic
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

        // Save user details and token
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("healthId", data.healthId);
        localStorage.setItem("token", data.token);

        console.log("✅ Login successful, token saved.");
        router.push("/dashboard");
      } else {
        // Registration logic
        if (!email && !phone) {
          throw new Error("Email or phone number is required");
        }

        const response = await fetch(`${API_BASE_URL}/api/users/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, email, phone, password }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Registration failed: ${errText}`);
        }

        const data = await response.json();

        alert("Account created successfully! Please verify your account.");
        setIsLogin(true);
      }
    } catch (err) {
      console.error("❌ Error:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{isLogin ? "Sign In" : "Create Account"} | Aether Health</title>
      </Head>

      <div className={styles.loginContainer}>
        <div className={styles.logoContainer}>
          <div className={styles.logo}>⚡</div>
          <h1 className={styles.title}>Aether Health</h1>
          <p className={styles.subtitle}>Your personal health records manager</p>
        </div>

        <h2 className={styles.title}>
          {isLogin ? "Welcome Back" : "Create Your Account"}
        </h2>
        <p className={styles.subtitle}>
          {isLogin
            ? "Sign in to access your health records"
            : "Start managing your health data securely"}
        </p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="userId" className={styles.label}>
              User ID
            </label>
            <input
              id="userId"
              type="text"
              className={styles.input}
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            />
          </div>

          {!isLogin && (
            <>
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  Email (optional)
                </label>
                <input
                  id="email"
                  type="email"
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="phone" className={styles.label}>
                  Phone (optional)
                </label>
                <input
                  id="phone"
                  type="tel"
                  className={styles.input}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <p className={styles.subtitle}>
                  At least one contact method is required
                </p>
              </div>
            </>
          )}

          <div className={styles.formGroup}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              {isLogin && (
                <a href="#" className={styles.forgotPassword}>
                  Forgot password?
                </a>
              )}
            </div>
            <input
              id="password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className={styles.button}
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : isLogin
              ? "Sign In"
              : "Create Account"}
          </button>

          <div className={styles.toggleContainer}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <span
              className={styles.toggleLink}
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Create one now" : "Sign in"}
            </span>
          </div>
        </form>

        <div className={styles.footer}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </div>
      </div>
    </>
  );
}
