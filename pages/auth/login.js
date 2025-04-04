import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import styles from "../../styles/login.module.css";
import axiosInstance from "../../utils/apiService"; // 🔁 Import Axios instance

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token") || getCookie("token");
    if (token) {
      console.log("🔄 Token found, redirecting to dashboard...");
      router.push("/dashboard");
    }
  }, [router]);

  const getCookie = (name) => {
    if (typeof document === "undefined") return null;
    const cookies = document.cookie.split(";").map((c) => c.trim());
    for (const cookie of cookies) {
      const [key, value] = cookie.split("=");
      if (key === name) return value;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("🚀 Form submitted");
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        // 🔁 Axios login
        const { data } = await axiosInstance.post("/users/login", {
          userId,
          password,
        });

        // Save token & details
        document.cookie = `token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`;
        document.cookie = `userId=${data.userId}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`;
        document.cookie = `healthId=${data.healthId}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`;

        localStorage.setItem("userId", data.userId);
        localStorage.setItem("healthId", data.healthId);
        localStorage.setItem("token", data.token);

        console.log("✅ Login successful, token saved.");
        router.push("/dashboard");
      } else {
        // 🔁 Axios registration
        if (!email && !phone) throw new Error("Email or phone number is required");

        const { data } = await axiosInstance.post("/users/register", {
          userId,
          email,
          phone,
          password,
        });

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
        {/* UI unchanged */}
        {/* ... */}
      </div>
    </>
  );
}

