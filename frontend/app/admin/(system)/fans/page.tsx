"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useFans } from "@/hooks/useFans";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

export default function FansPage() {
  const { data: fans, isLoading, error } = useFans();
  const [search, setSearch] = useState("");
  console.log(`Fetched fans:`, fans);
  const filteredFans = fans?.filter(
    (fan: any) =>
      fan.full_name.toLowerCase().includes(search.toLowerCase()) ||
      fan.email.toLowerCase().includes(search.toLowerCase())
  ) || [];

  // Compute stats
  const totalFans = fans?.length || 0;
  const verifiedFans = fans?.filter((f: any) => f.is_verified).length || 0;
  const recentFans = fans?.filter(
    (f: any) => new Date(f.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ).length || 0;

  const stats = [
    { id: 1, label: "Total Fans", value: totalFans.toString(), iconBg: "bg-indigo-50" },
    { id: 2, label: "Verified", value: verifiedFans.toString(), iconBg: "bg-emerald-50" },
    { id: 3, label: "New This Month", value: recentFans.toString(), iconBg: "bg-blue-50" },
    { id: 4, label: "Active", value: (totalFans - verifiedFans).toString(), iconBg: "bg-amber-50" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        Failed to load fans. Please try again.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-xl font-semibold text-slate-800">Your Fans</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage and track your fan community
          </p>
        </motion.div>

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
              className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-6"
            >
              <div
                className={`w-10 h-10 rounded-lg ${stat.iconBg} flex items-center justify-center`}
              >
                {/* Inline icons */}
                {stat.id === 1 && (
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                )}
                {stat.id === 2 && (
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {stat.id === 3 && (
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
                {stat.id === 4 && (
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Search + Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">All Fans</h2>
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
                placeholder="Search fans..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition"
              />
            </div>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">
                  Sr. No.
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">
                  Name
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">
                  Email
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">
                  Joined
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">
                  Status
                </th>
              </tr>
            </thead>
            <motion.tbody variants={container} initial="hidden" animate="show">
              {filteredFans.length > 0 ? (
                filteredFans.map((fan: any, index: number) => (
                  <motion.tr
                    key={fan.id}
                    variants={tableRow}
                    whileHover={{ backgroundColor: "#faf5ff" }}
                    className="border-b border-gray-100 last:border-0 transition-colors"
                  >
                    <td className="px-5 py-3 text-sm text-gray-500 text-left">
                      {index + 1}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-800 font-medium">
                      {fan.full_name}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {fan.email}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">
                      {new Date(fan.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        variant={fan.is_verified ? "default" : "secondary"}
                        className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                      >
                        {fan.is_verified ? "Verified" : "Unverified"}
                      </Badge>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-500">
                    No fans match your search.
                  </td>
                </tr>
              )}
            </motion.tbody>
          </table>
        </motion.div>
      </div>
    </div>
  );
}