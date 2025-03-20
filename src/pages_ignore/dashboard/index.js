import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Dashboard() {
  const router = useRouter();
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      router.push("/auth/login");
    } else {
      setUserId(storedUserId);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userId");
    router.push("/auth/login");
  };

  return (
    <div style={{ maxWidth: 500, margin: "auto", padding: 20 }}>
      <h2>Welcome, {userId}</h2>
      <p>Your Aether dashboard is under development.</p>
      <button onClick={handleLogout} style={{ padding: 10, backgroundColor: "red", color: "#fff" }}>
        Logout
      </button>
    </div>
  );
}

