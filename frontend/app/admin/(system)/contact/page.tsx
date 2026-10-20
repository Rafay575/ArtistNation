"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

interface Submission {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: 'new' | 'read' | 'responded';
  created_at: string;
  updated_at: string;
}

// ============================================================
// Animation Variants
// ============================================================

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

// ============================================================
// Helper Functions
// ============================================================

const getStatusBadge = (status: string) => {
  const map: Record<string, string> = {
    'new': 'text-rose-700 bg-rose-50',
    'read': 'text-amber-700 bg-amber-50',
    'responded': 'text-emerald-700 bg-emerald-50',
  };
  return map[status] || 'text-gray-700 bg-gray-50';
};

export default function AdminSiteContactPage() {
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/site-contact');
      setSubmissions(response.data.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching submissions:', err);
      setError(err.response?.data?.error || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.put(`/api/admin/site-contact/${id}/status`, { status });
      await fetchSubmissions();
    } catch (error) {
      console.error('Update status error:', error);
      alert('Failed to update status');
    }
  };

  const deleteSubmission = async (id: number) => {
    if (!confirm('Are you sure you want to delete this submission?')) return;
    try {
      await api.delete(`/api/admin/site-contact/${id}`);
      await fetchSubmissions();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete submission');
    }
  };

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      sub.name.toLowerCase().includes(search.toLowerCase()) ||
      sub.email.toLowerCase().includes(search.toLowerCase()) ||
      sub.message.toLowerCase().includes(search.toLowerCase()) ||
      (sub.subject && sub.subject.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: submissions.length,
    new: submissions.filter((s) => s.status === 'new').length,
    read: submissions.filter((s) => s.status === 'read').length,
    responded: submissions.filter((s) => s.status === 'responded').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading submissions...</p>
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
          <h1 className="text-xl font-semibold text-slate-800">Contact Submissions</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage and track all contact inquiries
          </p>
        </motion.div>

        {/* Stat Cards */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Total */}
          <motion.div
            variants={fadeUp}
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-6"
          >
            <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Submissions</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </motion.div>

          {/* New */}
          <motion.div
            variants={fadeUp}
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-6"
          >
            <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">New</p>
              <p className="text-xl font-bold text-rose-600">{stats.new}</p>
            </div>
          </motion.div>

          {/* Read */}
          <motion.div
            variants={fadeUp}
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-6"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Read</p>
              <p className="text-xl font-bold text-amber-600">{stats.read}</p>
            </div>
          </motion.div>

          {/* Responded */}
          <motion.div
            variants={fadeUp}
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-6"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Responded</p>
              <p className="text-xl font-bold text-emerald-600">{stats.responded}</p>
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
          <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-base font-bold text-gray-900">All Submissions</h2>
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
                  placeholder="Search submissions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="read">Read</option>
                <option value="responded">Responded</option>
              </select>

              <button
                onClick={fetchSubmissions}
                className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="px-5 py-3 bg-rose-50 border-b border-rose-200 text-sm text-rose-700">
              ⚠️ {error}
            </div>
          )}

          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">
                  From
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">
                  Subject
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">
                  Message
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">
                  Date
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <motion.tbody variants={container} initial="hidden" animate="show">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-500">
                    No submissions match your search.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((sub) => (
                  <motion.tr
                    key={sub.id}
                    variants={tableRow}
                    whileHover={{ backgroundColor: "#faf5ff" }}
                    className="border-b border-gray-100 last:border-0 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="text-sm text-gray-800 font-medium">{sub.name}</div>
                      <div className="text-xs text-gray-500">{sub.email}</div>
                      {sub.phone && <div className="text-xs text-gray-400">{sub.phone}</div>}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-800">
                      {sub.subject || 'No subject'}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500 max-w-[200px] truncate" title={sub.message}>
                      {sub.message}
                    </td>
                    <td className="px-5 py-3">
                      <select
                        value={sub.status}
                        onChange={(e) => updateStatus(sub.id, e.target.value)}
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border-0 focus:ring-2 focus:ring-purple-300 ${getStatusBadge(sub.status)}`}
                      >
                        <option value="new">New</option>
                        <option value="read">Read</option>
                        <option value="responded">Responded</option>
                      </select>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">
                      {new Date(sub.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => deleteSubmission(sub.id)}
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

         
        </motion.div>
      </div>
    </div>
  );
}