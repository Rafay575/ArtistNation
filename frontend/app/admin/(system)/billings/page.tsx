"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { FileDown, ExternalLink, Loader2, RotateCcw, CalendarX2 } from "lucide-react";
import { toast } from "sonner";

// ============================================================
// Types
// ============================================================

interface BillingOverview {
  success: boolean;
  data: {
    user: {
      id: number;
      full_name: string;
      email: string;
      plan: string;
      billing_cycle: string;
    };
    business: {
      id: number;
      name: string;
      subdomain: string;
      is_active: boolean;
      grace_period_end: string | null;
      lifecycle: 'active' | 'grace' | 'expired' | 'unavailable';
    };
    subscription: {
      id: number;
      stripe_id: string;
      status: string;
      stripe_status: string;
      cancel_at_period_end: boolean;
      started_at: string;
      expires_at: string;
      is_trialing: boolean;
      is_active: boolean;
      is_pending_cancel: boolean;
      is_inactive: boolean;
      can_renew: boolean;
    };
  };
}

interface Invoice {
  id: number;
  stripe_invoice_id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'unpaid' | 'failed' | 'refunded';
  paid_at: string | null;
  invoice_pdf_url: string | null;
  hosted_invoice_url: string | null;
  created_at: string;
}

interface InvoiceResponse {
  success: boolean;
  invoices: Invoice[];
}

// ============================================================
// Helper Functions
// ============================================================

const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getStatusBadge = (status: string) => {
  const map: Record<string, string> = {
    'active': 'text-emerald-700 bg-emerald-50',
    'trialing': 'text-blue-700 bg-blue-50',
    'pending_cancel': 'text-amber-700 bg-amber-50',
    'inactive': 'text-rose-700 bg-rose-50',
    'paid': 'text-emerald-700 bg-emerald-50',
    'unpaid': 'text-amber-700 bg-amber-50',
    'failed': 'text-rose-700 bg-rose-50',
    'refunded': 'text-gray-700 bg-gray-50',
  };
  return map[status] || 'text-gray-700 bg-gray-50';
};

// ============================================================
// Main Component
// ============================================================

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
} as any;

const tableRow = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
} as any;

export default function BillingsPage() {
  const queryClient = useQueryClient();
  const [changingSubscription, setChangingSubscription] = useState(false);
  const [openingInvoice, setOpeningInvoice] = useState<number | null>(null);
  const openInvoice = async (invoice: Invoice) => {
    if (openingInvoice !== null) return;
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    setOpeningInvoice(invoice.id);
    try {
      const { data } = await api.get(`/api/billing/invoices/${invoice.id}/document`);
      if (!data.available) { tab?.close(); toast.info(data.message); return; }
      const url = new URL(data.url);
      if (url.protocol !== "https:" || !(url.hostname === "stripe.com" || url.hostname.endsWith(".stripe.com"))) throw new Error("Invalid invoice document URL");
      if (tab) tab.location.href = url.href;
      else window.location.assign(url.href);
    } catch (error: any) { tab?.close(); toast.error(error.response?.data?.error || "Unable to open this invoice. Please retry."); }
    finally { setOpeningInvoice(null); }
  };
  // ============================================================
  // State
  // ============================================================

  const [loading, setLoading] = useState(true);
  const [openingBilling, setOpeningBilling] = useState(false);
  const openStripeBilling = async (renew: boolean) => {
    if (openingBilling) return;
    setOpeningBilling(true);
    try {
      const { data } = await api.post(renew ? '/api/billing/renew' : '/api/billing/portal');
      const url = new URL(data.url);
      if (url.protocol !== 'https:' || !['billing.stripe.com', 'checkout.stripe.com'].includes(url.hostname)) throw new Error('Invalid billing redirect');
      window.location.assign(url.href);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Unable to open billing. Please retry.');
    } finally { setOpeningBilling(false); }
  };
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [overview, setOverview] = useState<BillingOverview['data'] | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Modal state
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: 'cancel' | 'reactivate' | null;
    title: string;
    message: string;
    confirmText: string;
    confirmColor: string;
  }>({
    isOpen: false,
    type: null,
    title: '',
    message: '',
    confirmText: '',
    confirmColor: '',
  });

  // ============================================================
  // Stats Calculation
  // ============================================================

  const stats = [
    {
      id: 1,
      label: "Total Revenue",
      value: invoices.reduce((sum, inv) => sum + (inv.status === 'paid' ? inv.amount : 0), 0),
      iconBg: "bg-emerald-50",
      icon: (
        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 2,
      label: "Pending",
      value: invoices.reduce((sum, inv) => sum + (inv.status === 'unpaid' ? inv.amount : 0), 0),
      iconBg: "bg-amber-50",
      icon: (
        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 3,
      label: "Paid This Month",
      value: invoices
        .filter(inv => {
          if (!inv.paid_at) return false;
          const now = new Date();
          const paid = new Date(inv.paid_at);
          return paid.getMonth() === now.getMonth() && paid.getFullYear() === now.getFullYear() && inv.status === 'paid';
        })
        .reduce((sum, inv) => sum + inv.amount, 0),
      iconBg: "bg-blue-50",
      icon: (
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 4,
      label: "Overdue",
      value: invoices.reduce((sum, inv) => sum + (inv.status === 'failed' ? inv.amount : 0), 0),
      iconBg: "bg-rose-50",
      icon: (
        <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )
    },
  ];

  // ============================================================
  // Fetch Data
  // ============================================================

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const overviewRes = await api.get<BillingOverview>('/api/billing/overview');
      // Invoice sync finishes with overview; fetch documents afterwards.
      const invoicesRes = await api.get<InvoiceResponse>('/api/billing/invoices');

      setOverview(overviewRes.data.data);
      setInvoices((invoicesRes.data.invoices || []).filter(invoice => Number(invoice.amount) > 0));
      void queryClient.invalidateQueries({ queryKey: ["billingStatus"] });
    } catch (err: any) {
      console.error('Billing fetch error:', err);
      setError(err.response?.data?.error || 'Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ============================================================
  // Modal Handlers
  // ============================================================

  const openCancelModal = () => {
    setModal({
      isOpen: true,
      type: 'cancel',
      title: 'Cancel Subscription?',
      message: 'Are you sure you want to cancel your subscription? You will continue to have access until the end of your current billing period.',
      confirmText: 'Yes, Cancel',
      confirmColor: 'bg-rose-600 hover:bg-rose-700',
    });
  };

  const openReactivateModal = () => {
    setModal({
      isOpen: true,
      type: 'reactivate',
      title: 'Reactivate Subscription?',
      message: 'Do you want to reactivate your subscription? It will continue to renew normally.',
      confirmText: 'Yes, Reactivate',
      confirmColor: 'bg-purple-600 hover:bg-purple-700',
    });
  };

  const closeModal = () => {
    if (changingSubscription) return;
    setModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleConfirm = async () => {
    if (changingSubscription || !modal.type) return;
    setChangingSubscription(true);
    try {
      const { data } = await api.post(modal.type === 'cancel' ? '/api/billing/cancel' : '/api/billing/reactivate');
      toast.success(data.message);
      setModal(prev => ({ ...prev, isOpen: false }));
      await fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Unable to update your subscription. Please retry.');
    } finally { setChangingSubscription(false); }
  };

  // ============================================================
  // Filter Invoices
  // ============================================================

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.stripe_invoice_id.toLowerCase().includes(search.toLowerCase()) ||
      inv.amount.toString().includes(search) ||
      inv.status.toLowerCase().includes(search.toLowerCase())
  );

  // ============================================================
  // Loading / Error States
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading billing information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-rose-200 p-8 max-w-md text-center">
          <div className="text-rose-600 text-4xl mb-4">⚠️</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-sm text-gray-500">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:p-8">
      <div className="mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-xl font-semibold text-slate-800">Billings</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your ArtistNation subscription, payment details, and invoices
          </p>
        </motion.div>

        {/* Subscription Overview Card */}
        {overview && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-700">Current Plan</h2>
                <p className="text-2xl font-bold text-gray-900 capitalize">
                  {overview.user.plan || 'No Plan'}
                </p>
                <p className="text-sm text-gray-500">
                  {overview.user.billing_cycle || 'N/A'} · 
                  {overview.subscription.is_trialing ? (
                    <span className="text-blue-600 ml-1">Trial</span>
                  ) : overview.subscription.is_active ? (
                    <span className="text-emerald-600 ml-1">Active</span>
                  ) : overview.subscription.is_pending_cancel ? (
                    <span className="text-amber-600 ml-1">Will Cancel</span>
                  ) : (
                    <span className="text-rose-600 ml-1">Inactive</span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Next Billing</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(overview.subscription.expires_at)}
                </p>
                <div className="flex flex-wrap gap-2 mt-2 justify-end">
                  <button onClick={() => openStripeBilling(false)} disabled={openingBilling} className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50">
                    {openingBilling ? 'Opening Stripe...' : 'Manage payment details / Pay invoices'}
                  </button>
                  {overview.subscription.can_renew && (
                    <button onClick={() => openStripeBilling(true)} disabled={openingBilling} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm disabled:opacity-50">Renew subscription</button>
                  )}
                  {overview.subscription.is_pending_cancel && (
                    <button
                      onClick={openReactivateModal}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                    >
                      <RotateCcw className="h-4 w-4" /> Restore renewal
                    </button>
                  )}
                  {overview.subscription.is_active && !overview.subscription.is_pending_cancel && (
                    <button
                      onClick={openCancelModal}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 text-sm font-semibold rounded-xl transition-colors"
                    >
                      <CalendarX2 className="h-4 w-4" /> Cancel renewal
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stat Cards */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.id}
              variants={fadeUp}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-4"
            >
              <div className={`w-10 h-10 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(stat.value)}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Invoices Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
            <div><h2 className="text-base font-bold text-gray-900">Payment history</h2><p className="mt-1 text-xs text-gray-500">Subscription invoices and documents. Zero-value trial invoices are excluded.</p></div>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search invoices..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Sr.</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Invoice</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Amount</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Date</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Document</th>
                </tr>
              </thead>
              <motion.tbody variants={container} initial="hidden" animate="show">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-500">
                      {search ? "No invoices match your search." : "No chargeable subscription invoices yet. Your trial does not generate a paid invoice."}
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv, index) => (
                    <motion.tr
                      key={inv.id}
                      variants={tableRow}
                      whileHover={{ backgroundColor: "#faf5ff" }}
                      className="border-b border-gray-100 last:border-0 transition-colors"
                    >
                      <td className="px-5 py-3 text-sm text-gray-400 tabular-nums">{index + 1}</td>
                      <td className="px-5 py-3 text-sm text-gray-800 font-medium">
                        {inv.stripe_invoice_id}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-800 font-medium">
                        {formatCurrency(inv.amount, inv.currency)}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(inv.status)}`}>
                          {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">
                        {formatDate(inv.paid_at || inv.created_at)}
                      </td>
                      <td className="px-5 py-3">
                        <button onClick={() => openInvoice(inv)} disabled={openingInvoice !== null} className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-purple-100 bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700 transition hover:bg-purple-100 disabled:opacity-50">
                          {openingInvoice === inv.id ? <Loader2 className="h-4 w-4 animate-spin" /> : inv.invoice_pdf_url ? <FileDown className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
                          {openingInvoice === inv.id ? 'Opening...' : inv.invoice_pdf_url ? 'Download PDF' : 'View invoice'}
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </motion.tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* ============================================================
          Confirmation Modal
          ============================================================ */}
      <AnimatePresence>
        {modal.isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                <div className="text-center">
                  {/* Icon */}
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                    modal.type === 'cancel' ? 'bg-rose-100' : 'bg-purple-100'
                  }`}>
                    {modal.type === 'cancel' ? (
                      <svg className="w-8 h-8 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    ) : (
                      <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {modal.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    {modal.message}
                  </p>

                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={closeModal}
                      disabled={changingSubscription}
                      className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={changingSubscription}
                      className={`px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm ${modal.confirmColor}`}
                    >
                      {changingSubscription ? "Updating..." : modal.confirmText}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
