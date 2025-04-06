import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";
import styles from "../styles/verify.module.css";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { token } = router.query;
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("Verifying your email address...");

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

      setStatus("success");
      setMessage("Your email has been successfully verified!");
      setTimeout(() => router.push("/auth/login"), 3000); // Auto-redirect after 3s
    } catch (error) {
      console.error("❌ Email verification error:", error);
      setStatus("error");
      setMessage("Verification failed. The link may be invalid or expired.");
    }
  };

  const handleLogin = () => {
    router.push("/auth/login");
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Email Verification | Aether Health</title>
      </Head>
      
      <div className={styles.logoContainer}>
        <div className={styles.logo}>⚡</div>
        <h1 className={styles.appName}>Aether Health</h1>
      </div>
      
      <div className={styles.verificationCard}>
        <div className={`${styles.statusIcon} ${styles[status]}`}>
          {status === "verifying" && <div className={styles.spinner}></div>}
          {status === "success" && "✓"}
          {status === "error" && "✗"}
        </div>
        
        <h2 className={styles.title}>Email Verification</h2>
        
        <p className={styles.message}>{message}</p>
        
        {status === "success" && (
          <div className={styles.successContent}>
            <p className={styles.welcomeMessage}>
              Welcome to Aether Health! Your account is now active.
            </p>
            <p className={styles.redirectMessage}>
              You'll be redirected to the login page in a few seconds...
            </p>
          </div>
        )}
        
        {status === "error" && (
          <div className={styles.errorContent}>
            <p className={styles.errorHelp}>
              Please try clicking the link from your email again, or request a new verification email.
            </p>
          </div>
        )}
        
        <button onClick={handleLogin} className={styles.button}>
          {status === "success" ? "Go to Login" : "Back to Login"}
        </button>
      </div>
      
      <div className={styles.footer}>
        <p>© {new Date().getFullYear()} Aether Health. All rights reserved.</p>
      </div>
    </div>
  );
}