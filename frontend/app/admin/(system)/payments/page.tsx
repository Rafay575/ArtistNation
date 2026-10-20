"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

interface Payment {
  id: number;
  stripe_invoice_id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'unpaid' | 'failed' | 'refunded';
  paid_at: string | null;
  invoice_pdf_url: string | null;
  hosted_invoice_url: string | null;
  created_at: string;
  subscription_id: number;
  plan: string;
  billing_cycle: string;
  business_id: number;
  business_name: string;
  subdomain: string;
  user_id: number;
  customer_name: string;
  customer_email: string;
}

interface Stats {
  totalRevenue: number;
  totalPayments: number;
  failedPayments: number;
  pendingPayments: number;
}

// ============================================================
// Animation Variants
// ============================================================

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
} as const;

const tableRow = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
} as const;

// ============================================================
// Helper Functions
// ============================================================

const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusBadge = (status: string) => {
  const map: Record<string, string> = {
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

export default function AdminPaymentsPage() {
  // ============================================================
  // State
  // ============================================================

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 0,
    limit: 20,
  });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // ============================================================
  // Fetch Data
  // ============================================================

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query params
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
      });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      // Fetch stats and payments in parallel
      const [statsRes, paymentsRes] = await Promise.all([
        api.get<{ success: boolean; data: Stats }>('/api/admin/payments/stats'),
        api.get<{ success: boolean; data: { payments: Payment[]; pagination: typeof pagination } }>(
          `/api/admin/payments?${params.toString()}`
        ),
      ]);

      setStats(statsRes.data.data);
      setPayments(paymentsRes.data.data.payments);
      setPagination(paymentsRes.data.data.pagination);
    } catch (err: any) {
      console.error('Payments fetch error:', err);
      setError(err.response?.data?.error || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.page, search, statusFilter, startDate, endDate]);

  // ============================================================
  // Handlers
  // ============================================================

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  // ============================================================
  // Loading / Error States
  // ============================================================

  if (loading && !payments.length) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading payments...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-xl font-semibold text-slate-800">Payments</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            View and manage all subscription payments
          </p>
        </motion.div>

        {/* Stats Cards */}
        {stats && (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <motion.div
              variants={fadeUp}
              whileHover={{ y: -2 }}
              className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              whileHover={{ y: -2 }}
              className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Total Payments</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalPayments}</p>
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              whileHover={{ y: -2 }}
              className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Failed Payments</p>
                <p className="text-xl font-bold text-rose-600">{stats.failedPayments}</p>
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              whileHover={{ y: -2 }}
              className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Pending Payments</p>
                <p className="text-xl font-bold text-amber-600">{stats.pendingPayments}</p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Filters & Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-base font-bold text-gray-900">All Payments</h2>
            <div className="flex flex-wrap items-center gap-3">
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
                  placeholder="Search by customer, business, invoice..."
                  value={search}
                  onChange={handleSearch}
                  className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition"
                />
              </div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
              <span className="text-gray-400">→</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
              <select
                value={statusFilter}
                onChange={handleStatusChange}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
              >
                <option value="">All Status</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                  setStartDate('');
                  setEndDate('');
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {error && (
            <div className="px-5 py-3 bg-rose-50 border-b border-rose-200 text-sm text-rose-700">
              ⚠️ {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Invoice</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Customer</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Business</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Amount</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Date</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">PDF</th>
                </tr>
              </thead>
              <motion.tbody variants={container} initial="hidden" animate="show">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-500">
                      No payments found.
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <motion.tr
                      key={payment.id}
                      variants={tableRow}
                      whileHover={{ backgroundColor: "#faf5ff" }}
                      className="border-b border-gray-100 last:border-0 transition-colors"
                    >
                      <td className="px-5 py-3 text-sm text-gray-800 font-mono">
                        {payment.stripe_invoice_id}
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-sm text-gray-800 font-medium">{payment.customer_name}</div>
                        <div className="text-xs text-gray-400">{payment.customer_email}</div>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">
                        {payment.business_name}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-800 font-medium">
                        {formatCurrency(payment.amount, payment.currency)}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(payment.status)}`}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">
                        {formatDate(payment.paid_at || payment.created_at)}
                      </td>
                      <td className="px-5 py-3">
                        {payment.invoice_pdf_url ? (
                          <a
                            href={payment.invoice_pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-800 text-sm font-medium transition-colors"
                          >
                            PDF
                          </a>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                    </motion.tr>
                  ))
                )}
              </motion.tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-4">
              <p className="text-sm text-gray-500">
                Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm bg-purple-50 border border-purple-200 rounded-lg text-purple-700 font-medium">
                  {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}