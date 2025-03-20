import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function VerifyEmail() {
    const router = useRouter();
    const { token } = router.query; // Get token from URL
    const [verificationStatus, setVerificationStatus] = useState("Verifying...");

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
                setVerificationStatus("✅ Email Verified Successfully! You can now log in.");
            } else {
                setVerificationStatus(`❌ Verification Failed: ${data.error || "Invalid token."}`);
            }
        } catch (error) {
            setVerificationStatus("❌ Error verifying email. Please try again later.");
        }
    };

    return (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
            <h1>Email Verification</h1>
            <p>{verificationStatus}</p>
        </div>
    );
}
