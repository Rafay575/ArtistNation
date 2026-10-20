// hooks/useSubscriptionStatus.ts
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

interface SubscriptionStatus {
  is_pending_cancel: boolean;
  expires_at: string | null;
}

export function useSubscriptionStatus() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const response = await api.get("/api/billing/overview");
      const data = response.data.data;
      setStatus({
        is_pending_cancel: data.subscription.is_pending_cancel,
        expires_at: data.subscription.expires_at,
      });
    } catch (error) {
      console.error("Error fetching subscription status:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return { status, loading, refetch: fetchStatus };
}