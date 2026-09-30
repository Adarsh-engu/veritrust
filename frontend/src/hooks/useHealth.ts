import { useState, useEffect } from "react";

export function useHealth() {
  const [isHealthy, setIsHealthy] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/health`;
        const res = await fetch(url);
        if (mounted) {
          setIsHealthy(res.ok);
        }
      } catch (err) {
        if (mounted) {
          setIsHealthy(false);
        }
      }
    };
    check();
    const interval = setInterval(check, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return isHealthy;
}
