"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { Eye, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface User {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
  updated_at: string;
  is_verified: boolean;
  is_onboarded: boolean;
  is_admin: boolean;
  artist_name: string | null;
  bio: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  primary_genre: string | null;
  secondary_genres: string | null;
  profile_picture_url: string | null;
  stripe_customer_id: string | null;
  trial_start_date: string | null;
  trial_end_date: string | null;
  is_trial_expired: boolean;
  plan: string | null;
  billing_cycle: string | null;
  billing_address: string | null;
  onboarding_step: number;
  signed_status: string | null;
  label_name: string | null;
  management_company: string | null;
  agency_info: string | null;
  goals: string | null;
  socials: string | null;
  website_url: string | null;
  years_active: string | null;
  experience_level: string | null;
}

interface Business {
  id: number;
  name: string;
  subdomain: string;
  is_active: boolean;
  is_onboarded: boolean;
  stripe_account_status: string;
  stripe_account_id: string | null;
  billing_address: string | null;
}

interface Subscription {
  id: number;
  plan: string;
  billing_cycle: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
}

interface ApiUser {
  user: User;
  business: Business | null;
  subscription: Subscription | null;
}

interface ApiResponse {
  success: boolean;
  data: ApiUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ── Animation variants ──────────────────────────────────────────────────────

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

// ── Component ──────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // ── Fetch users ─────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<ApiResponse>("/api/admin/users", {
        params: {
          page,
          limit,
          search: debouncedSearch || undefined,
        },
      });
      if (response.data.success) {
        setUsers(response.data.data);
        setTotal(response.data.pagination.total);
        setTotalPages(response.data.pagination.totalPages);
      } else {
        throw new Error("Failed to fetch users");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── Debounce search ─────────────────────────────────────────────────────

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // ── Stats (computed from current page – replace with backend stats later) ──

  const totalUsers = total;
  const activeNow = users.filter((u) => u.user.is_verified).length;
  const now = new Date();
  const newThisMonth = users.filter((u) => {
    const created = new Date(u.user.created_at);
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;
  const subscribed = users.filter((u) => u.subscription?.status === "active").length;

  // ── Pagination helpers ──────────────────────────────────────────────────

  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const total = totalPages;
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      const left = Math.max(2, page - 2);
      const right = Math.min(total - 1, page + 2);
      pages.push(1);
      if (left > 2) pages.push("...");
      for (let i = left; i <= right; i++) pages.push(i);
      if (right < total - 1) pages.push("...");
      pages.push(total);
    }
    return pages;
  };

  // ── UI handlers ─────────────────────────────────────────────────────────

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-xl font-semibold text-slate-800">Users</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage your community members</p>
        </motion.div>

        {/* Stat Cards */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <motion.div variants={fadeUp} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-6">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <img src="/s-icon1.png" alt="Total Users" className="w-5 h-5 object-contain" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Users</p>
              <p className="text-xl font-bold text-gray-900">{totalUsers}</p>
            </div>
          </motion.div>
          <motion.div variants={fadeUp} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-6">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <img src="/s-icon2.png" alt="Active Now" className="w-5 h-5 object-contain" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Active Now</p>
              <p className="text-xl font-bold text-gray-900">{activeNow}</p>
            </div>
          </motion.div>
          <motion.div variants={fadeUp} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-6">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <img src="/s-icon3.png" alt="New This Month" className="w-5 h-5 object-contain" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">New This Month</p>
              <p className="text-xl font-bold text-gray-900">{newThisMonth}</p>
            </div>
          </motion.div>
          <motion.div variants={fadeUp} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-6">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <img src="/s-icon4.png" alt="Subscribed" className="w-5 h-5 object-contain" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Subscribed</p>
              <p className="text-xl font-bold text-gray-900">{subscribed}</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Search + Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-base font-bold text-gray-900">All Users</h2>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={handleSearchChange}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">
                    SR#
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">
                    Name
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">
                    Email
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">
                    Phone
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">
                    Business
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">
                    Plan
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">
                    Joined
                  </th>
                  <th className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">
                    Action
                  </th>
                </tr>
              </thead>
              <motion.tbody variants={container} initial="hidden" animate="show">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-10 text-center text-sm text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-10 text-center text-sm text-red-500">
                      {error}
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-10 text-center text-sm text-gray-500">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((item, idx) => {
                    const user = item.user;
                    const serial = (page - 1) * limit + idx + 1;
                    const status = user.is_verified ? "Active" : "Inactive";
                    const joined = new Date(user.created_at).toLocaleDateString();
                    const businessName = item.business?.name || "—";
                    const plan = item.subscription?.plan || user.plan || "—";

                    return (
                      <motion.tr
                        key={user.id}
                        variants={tableRow}
                        whileHover={{ backgroundColor: "#faf5ff" }}
                        className="border-b border-gray-100 last:border-0 transition-colors"
                      >
                        <td className="px-5 py-3 text-sm text-gray-500">{serial}</td>
                        <td className="px-5 py-3 text-sm text-gray-800 font-medium">
                          {user.full_name}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-600">{user.email}</td>
                        <td className="px-5 py-3 text-sm text-gray-600">{user.phone || "—"}</td>
                        <td className="px-5 py-3 text-sm text-gray-600">{businessName}</td>
                        <td className="px-5 py-3 text-sm text-gray-600">
                          <span className="capitalize">{plan}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                              status === "Active" ? "text-green-700" : "text-gray-500"
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                status === "Active" ? "bg-green-500" : "bg-gray-400"
                              }`}
                            />
                            {status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-500">{joined}</td>
                        <td className="px-5 py-3 text-center">
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="inline-block text-gray-400 hover:text-purple-600 transition"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </motion.tbody>
            </table>
          </div>

          {/* Pagination – always visible if totalPages > 0 */}
          {!loading && !error && totalPages > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-gray-500">
                Showing {users.length} of {total} users
              </div>
              <div className="flex items-center gap-1">
                {/* First */}
                <button
                  onClick={() => goToPage(1)}
                  disabled={page === 1}
                  className="px-2 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                >
                  First
                </button>
                {/* Prev */}
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                  className="px-2 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page numbers */}
                {getPageNumbers().map((p, idx) =>
                  typeof p === "number" ? (
                    <button
                      key={idx}
                      onClick={() => goToPage(p)}
                      className={`px-3 py-1 text-sm border rounded-md transition ${
                        p === page
                          ? "bg-purple-600 text-white border-purple-600"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {p}
                    </button>
                  ) : (
                    <span key={idx} className="px-1 text-gray-400">
                      …
                    </span>
                  )
                )}

                {/* Next */}
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-2 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                {/* Last */}
                <button
                  onClick={() => goToPage(totalPages)}
                  disabled={page === totalPages}
                  className="px-2 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}