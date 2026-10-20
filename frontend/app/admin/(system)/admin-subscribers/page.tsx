"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

interface Subscriber {
  id: number;
  email: string;
  status: 'active' | 'unsubscribed';
  created_at: string;
  updated_at: string;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
} as const;

const tableRow = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
} as const;

export default function AdminSubscribersPage() {
  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/admin/subscribers");
      setSubscribers(response.data.data);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching subscribers:", err);
      setError(err.response?.data?.error || "Failed to load subscribers");
    } finally {
      setLoading(false);
    }
  };

  const deleteSubscriber = async (id: number) => {
    if (!confirm("Are you sure you want to delete this subscriber?")) return;
    try {
      await api.delete(`/api/admin/subscribers/${id}`);
      await fetchSubscribers();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete subscriber.");
    }
  };

  const filteredSubscribers = subscribers.filter((sub) =>
    sub.email.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: subscribers.length,
    active: subscribers.filter((s) => s.status === "active").length,
    unsubscribed: subscribers.filter((s) => s.status === "unsubscribed").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading subscribers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-xl font-semibold text-slate-800">Subscribers</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage newsletter subscribers
          </p>
        </motion.div>

        {/* Stat Cards */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <motion.div
            variants={fadeUp}
            whileHover={{ y: -2 }}
            className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-4"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Subscribers</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
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
              <p className="text-xs text-gray-500 mb-1">Active</p>
              <p className="text-xl font-bold text-emerald-600">{stats.active}</p>
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
              <p className="text-xs text-gray-500 mb-1">Unsubscribed</p>
              <p className="text-xl font-bold text-rose-600">{stats.unsubscribed}</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-base font-bold text-gray-900">All Subscribers</h2>
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
                placeholder="Search subscribers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition"
              />
            </div>
          </div>

          {error && (
            <div className="px-5 py-3 bg-rose-50 border-b border-rose-200 text-sm text-rose-700">
              ⚠️ {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Email</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Subscribed</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Actions</th>
                </tr>
              </thead>
              <motion.tbody variants={container} initial="hidden" animate="show">
                {filteredSubscribers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-sm text-gray-500">
                      No subscribers found.
                    </td>
                  </tr>
                ) : (
                  filteredSubscribers.map((sub) => (
                    <motion.tr
                      key={sub.id}
                      variants={tableRow}
                      whileHover={{ backgroundColor: "#faf5ff" }}
                      className="border-b border-gray-100 last:border-0 transition-colors"
                    >
                      <td className="px-5 py-3 text-sm text-gray-800 font-medium">
                        {sub.email}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            sub.status === "active"
                              ? "text-emerald-700 bg-emerald-50"
                              : "text-rose-700 bg-rose-50"
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">
                        {new Date(sub.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => deleteSubscriber(sub.id)}
                          className="text-sm text-rose-600 hover:text-rose-800 font-medium transition-colors"
                        >
                          Delete
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
    </div>
  );
}