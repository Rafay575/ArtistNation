"use client";

import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api as axios } from "@/lib/api";
import {
  CheckCircle2,
  ExternalLink,

  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function StripeIntegrationPage() {
  // ---------- Fetch real Stripe Connect status ----------
  const {
    data: statusData,
    isLoading: statusLoading,
    isError: statusError,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ["stripeConnectStatus"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/stripe/connect/status");
      return res.data; // { connected, status, accountId }
    },
  });

  // ---------- Start Stripe onboarding ----------
  const connectMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.post("/api/admin/stripe/connect/onboard");
      return res.data; // { url }
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to start onboarding");
    },
  });

  const connected = statusData?.connected ?? false;
  const accountId = statusData?.accountId ?? "";
  const connectionStatusText = statusLoading
    ? "Loading..."
    : connected
    ? "Connected to Stripe"
    : statusData?.status === "pending"
    ? "Onboarding pending"
    : "Not connected";

  // In case of error fetching status, show a warning and retry button
  if (statusError) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-600 font-medium">Failed to load Stripe status.</p>
          <Button onClick={() => refetchStatus()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto space-y-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Stripe Integration</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Connect a Standard Stripe account to receive store payments. Stripe processing fees apply.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-medium text-gray-500">
            <span className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500" : "bg-amber-500"}`} />
            {connected ? "Ready for payments" : "Setup required"}
          </div>
        </motion.div>

        {/* Connection card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#635BFF]/10 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none">
                <path
                  d="M15.4 12.6c0-1.1 1-1.5 2.5-1.5 2.2 0 5 .7 7.2 1.8V6.6c-2.4-1-4.8-1.3-7.2-1.3-5.9 0-9.8 3-9.8 8.1 0 7.8 10.9 6.6 10.9 9.9 0 1.3-1.2 1.7-2.8 1.7-2.4 0-5.5-1-8-2.3v6.4c2.7 1.2 5.4 1.7 8 1.7 6 0 10.2-2.9 10.2-8.1 0-8.4-11-7-11-9.9z"
                  fill="#635BFF"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-900">{connectionStatusText}</p>
                {connected && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                {statusLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
              </div>
              {connected ? (
                <p className="text-xs text-gray-500 mt-0.5">Account ID: {accountId}</p>
              ) : (
                <p className="text-xs text-gray-500 mt-0.5">
                  {statusData?.status === "migration_required"
                    ? "Your existing connection needs migration to Standard. Contact support."
                    : statusData?.status === "pending"
                    ? "Complete your onboarding to start receiving payments."
                    : "Connect an account so this client can start receiving payouts."}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {connected ? (
              <>
                <a
                  href="https://dashboard.stripe.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View in Stripe
                </a>

              </>
            ) : (
              <Button
                onClick={() => connectMutation.mutate()}
                disabled={connectMutation.isPending || statusData?.status === "migration_required"}
                className="bg-[#635BFF] hover:bg-[#544ce0] text-white"
              >
                {connectMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  "Set up Standard Stripe"
                )}
              </Button>
            )}
          </div>
        </motion.div>

        {/* When connected, you can later add real earnings / payout data here. */}
        {connected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="bg-white rounded-xl border border-gray-200 p-6 text-center text-sm text-gray-500"
          >
            Your Stripe account is active. Store payments will be automatically processed.
            Future updates will show your balance, payouts, and transaction history here.
          </motion.div>
        )}
      </div>
    </div>
  );
}