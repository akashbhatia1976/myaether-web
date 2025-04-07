import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

export default function VerifyEmail() {
  const router = useRouter();
  const { token } = router.query; // Get token from URL
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("Verifying your email address...");

  useEffect(() => {
    if (token) {
      verifyEmail();
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/verify-email?token=${token}`);
      const data = await response.json();
      
      if (response.ok) {
        setStatus("success");
        setMessage("Your email has been successfully verified!");
        // Auto-redirect to login page after 3 seconds
        setTimeout(() => router.push("/auth/login"), 3000);
      } else {
        setStatus("error");
        setMessage(`Verification failed: ${data.error || "Invalid token."}`);
      }
    } catch (error) {
      setStatus("error");
      setMessage("Error verifying email. Please try again later.");
    }
  };

  const handleLogin = () => {
    router.push("/auth/login");
  };

  return (
    <div style={styles.container}>
      <Head>
        <title>Email Verification | Aether Health</title>
      </Head>
      
      <div style={styles.logoContainer}>
        <div style={styles.logo}>⚡</div>
        <h1 style={styles.appName}>Aether Health</h1>
      </div>
      
      <div style={styles.verificationCard}>
        <div style={{
          ...styles.statusIcon,
          backgroundColor: status === 'verifying' ? '#F3F4F6' : status === 'success' ? '#DEF7EC' : '#FDE8E8',
          color: status === 'verifying' ? '#6B7280' : status === 'success' ? '#0E9F6E' : '#E02424'
        }}>
          {status === "verifying" && <div style={styles.spinner}></div>}
          {status === "success" && "✓"}
          {status === "error" && "✗"}
        </div>
        
        <h2 style={styles.title}>Email Verification</h2>
        
        <p style={styles.message}>{message}</p>
        
        {status === "success" && (
          <div>
            <p style={styles.welcomeMessage}>
              Welcome to Aether Health! Your account is now active.
            </p>
            <p style={styles.redirectMessage}>
              You will be redirected to the login page in a few seconds...
            </p>
          </div>
        )}
        
        {status === "error" && (
          <div>
            <p style={styles.errorHelp}>
              Please try clicking the link from your email again, or request a new verification email.
            </p>
          </div>
        )}
        
        <button onClick={handleLogin} style={styles.button}>
          {status === "success" ? "Go to Login" : "Back to Login"}
        </button>
      </div>
      
      <div style={styles.footer}>
        <p>© {new Date().getFullYear()} Aether Health. All rights reserved.</p>
      </div>

      <style jsx global>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

// Inline styles
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: '#f5f7fa',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif'
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '2rem'
  },
  logo: {
    backgroundColor: '#0D9488',
    color: 'white',
    fontSize: '1.5rem',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    marginRight: '0.75rem'
  },
  appName: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#0D9488',
    margin: '0'
  },
  verificationCard: {
    backgroundColor: 'white',
    borderRadius: '10px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '2.5rem',
    width: '100%',
    maxWidth: '500px',
    textAlign: 'center',
    marginBottom: '2rem'
  },
  statusIcon: {
    width: '70px',
    height: '70px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.5rem',
    fontSize: '2rem'
  },
  spinner: {
    width: '30px',
    height: '30px',
    border: '3px solid rgba(0, 0, 0, 0.1)',
    borderTop: '3px solid #6B7280',
    borderRadius: '50%',
    animation: 'spin 1s ease-in-out infinite'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: '1rem'
  },
  message: {
    fontSize: '1.125rem',
    color: '#4B5563',
    marginBottom: '1.5rem'
  },
  welcomeMessage: {
    fontWeight: '500',
    color: '#0E9F6E',
    marginBottom: '0.5rem'
  },
  redirectMessage: {
    fontSize: '0.875rem',
    color: '#6B7280',
    marginBottom: '1.5rem'
  },
  errorHelp: {
    color: '#6B7280',
    fontSize: '0.875rem',
    marginBottom: '1.5rem'
  },
  button: {
    backgroundColor: '#0D9488',
    color: 'white',
    fontWeight: '500',
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem'
  },
  footer: {
    color: '#6B7280',
    fontSize: '0.875rem',
    marginTop: 'auto',
    textAlign: 'center'
  }
};