// components/SubscriptionBanner.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";

interface SubscriptionStatus {
  is_pending_cancel: boolean;
  expires_at: string | null;
}

export default function SubscriptionBanner() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [isReactivating, setIsReactivating] = useState(false);

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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "the end of your billing period";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDaysRemaining = (dateStr: string | null) => {
    if (!dateStr) return null;
    const days = Math.ceil(
      (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return days > 0 ? days : 0;
  };

  const handleReactivate = async () => {
    setIsReactivating(true);
    try {
      const response = await api.post("/api/billing/reactivate");
      if (response.data.success) {
        setIsVisible(false);
        await fetchStatus(); // Refresh status
        // Show success toast or notification
      }
    } catch (error) {
      console.error("Reactivate error:", error);
      alert("Failed to reactivate. Please try again.");
    } finally {
      setIsReactivating(false);
    }
  };

  // Don't show if not pending cancel or dismissed
  if (loading || !status || !status.is_pending_cancel || !isVisible) {
    return null;
  }

  const daysRemaining = getDaysRemaining(status.expires_at);
  const dateFormatted = formatDate(status.expires_at);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="w-full bg-amber-50 border-b border-amber-200 px-4 py-3"
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Left: Icon + Message */}
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                ⚠️ Your subscription has been canceled
              </p>
              <p className="text-sm text-amber-700">
                Your site will be deactivated on{" "}
                <span className="font-bold">{dateFormatted}</span>
                {daysRemaining !== null && (
                  <span className="text-xs text-amber-600 ml-2">
                    ({daysRemaining} days remaining)
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleReactivate}
              disabled={isReactivating}
              className="inline-flex items-center px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white text-sm font-medium rounded-md transition-colors"
            >
              {isReactivating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                  Reactivating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Reactivate
                </>
              )}
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="text-amber-400 hover:text-amber-600 transition-colors p-1"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}