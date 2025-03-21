import { useEffect } from "react";
import { useRouter } from "next/router";

export default function RedirectHome() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return <p>Redirecting to dashboard...</p>;
}

