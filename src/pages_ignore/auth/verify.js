import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function VerifyEmail() {
  const router = useRouter();
  const { token } = router.query;
  const [status, setStatus] = useState("Verifying...");

  useEffect(() => {
    if (token) {
      fetch(`http://localhost:3000/api/users/verify-email?token=${token}`)
        .then((res) => res.json())
        .then((data) => {
          setStatus(data.message || "Verification failed.");
        })
        .catch(() => setStatus("Error verifying email."));
    }
  }, [token]);

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
      <h2>Email Verification</h2>
      <p>{status}</p>
      {status.includes("success") && (
        <button onClick={() => router.push("/auth/login")} style={{ padding: 10, backgroundColor: "#6200ee", color: "#fff" }}>
          Go to Login
        </button>
      )}
    </div>
  );
}

