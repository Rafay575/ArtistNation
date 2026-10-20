"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Calendar, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";

interface CancelAlertProps {
  subscription: {
    is_pending_cancel: boolean;
    expires_at: string | null;
    status: string;
  };
  onReactivate?: () => void;
}

export default function CancelAlert({ subscription, onReactivate }: CancelAlertProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isReactivating, setIsReactivating] = useState(false);
  const [reactivateSuccess, setReactivateSuccess] = useState(false);

  // Hide if not pending cancel or already hidden
  if (!subscription.is_pending_cancel || !isVisible) {
    return null;
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "the end of your billing period";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleReactivate = async () => {
    setIsReactivating(true);
    try {
      const response = await api.post("/api/billing/reactivate");
      if (response.data.success) {
        setReactivateSuccess(true);
        // Call the parent callback to refresh data
        if (onReactivate) {
          onReactivate();
        }
        // Auto-hide after 3 seconds
        setTimeout(() => {
          setIsReactivating(false);
          setIsVisible(false);
        }, 3000);
      }
    } catch (error) {
      console.error("Reactivate error:", error);
      alert("Failed to reactivate. Please try again.");
      setIsReactivating(false);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="relative bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4 mb-6 shadow-sm"
          role="alert"
        >
          <div className="flex flex-wrap items-start gap-4">
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>

            {/* Message */}
            <div className="flex-1 min-w-[200px]">
              {reactivateSuccess ? (
                <p className="text-sm text-emerald-700 font-medium">
                  ✅ Your subscription has been reactivated successfully!
                </p>
              ) : (
                <>
                  <h4 className="text-sm font-semibold text-amber-800">
                    ⚠️ Your subscription has been canceled
                  </h4>
                  <p className="text-sm text-amber-700 mt-1">
                    Your site and subdomain will be deactivated on{" "}
                    <span className="font-bold">
                      {formatDate(subscription.expires_at)}
                    </span>
                    .
                    {subscription.expires_at && (
                      <span className="block text-xs text-amber-600 mt-1">
                        You have {Math.ceil(
                          (new Date(subscription.expires_at).getTime() - Date.now()) /
                            (1000 * 60 * 60 * 24)
                        )} days remaining.
                      </span>
                    )}
                  </p>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {!reactivateSuccess && (
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
                      Reactivate Subscription
                    </>
                  )}
                </button>
              )}
              <button
                onClick={() => setIsVisible(false)}
                className="text-amber-400 hover:text-amber-600 transition-colors p-1"
                aria-label="Dismiss alert"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}