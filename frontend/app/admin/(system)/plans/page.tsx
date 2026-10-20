"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const stats = [
  { id: 1, label: "Total Plans", value: "4", iconBg: "bg-indigo-50" },
  { id: 2, label: "Active Plans", value: "3", iconBg: "bg-emerald-50" },
  { id: 3, label: "Total Subscribers", value: "2,480", iconBg: "bg-blue-50" },
  { id: 4, label: "Monthly Revenue", value: "$9,620", iconBg: "bg-violet-50" },
];

const plans = [
  {
    name: "Basic",
    price: "$9/mo",
    subscribers: 1200,
    status: "Active",
    features: "Up to 5 projects, Basic analytics, Email support",
    created: "15/03/2022",
  },
  {
    name: "Pro",
    price: "$29/mo",
    subscribers: 890,
    status: "Active",
    features: "Unlimited projects, Advanced analytics, Priority support",
    created: "15/03/2022",
  },
  {
    name: "Enterprise",
    price: "$99/mo",
    subscribers: 340,
    status: "Active",
    features: "Custom integrations, Dedicated manager, 24/7 phone support",
    created: "10/06/2022",
  },
  {
    name: "Starter (Legacy)",
    price: "$5/mo",
    subscribers: 50,
    status: "Archived",
    features: "3 projects, Community support",
    created: "01/01/2021",
  },
];

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

const statusStyles = {
  Active: "text-emerald-700 bg-emerald-50",
  Archived: "text-slate-500 bg-slate-100",
};

export default function PlansPage() {
  const [search, setSearch] = useState("");
  const filteredPlans = plans.filter(
    (plan) =>
      plan.name.toLowerCase().includes(search.toLowerCase()) ||
      plan.status.toLowerCase().includes(search.toLowerCase()) ||
      plan.features.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-xl font-semibold text-slate-800">Plans</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage subscription plans and pricing
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
                {/* Inline icons matching the stat type */}
                {stat.id === 1 && (
                  <svg
                    className="w-5 h-5 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                )}
                {stat.id === 2 && (
                  <svg
                    className="w-5 h-5 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
                {stat.id === 3 && (
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
                {stat.id === 4 && (
                  <svg
                    className="w-5 h-5 text-violet-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
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
            <h2 className="text-base font-bold text-gray-900">All Plans</h2>
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
                placeholder="Search plans..."
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
                  Plan
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">
                  Price
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">
                  Subscribers
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">
                  Features
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">
                  Created
                </th>
              </tr>
            </thead>
            <motion.tbody variants={container} initial="hidden" animate="show">
              {filteredPlans.map((plan, i) => (
                <motion.tr
                  key={i}
                  variants={tableRow}
                  whileHover={{ backgroundColor: "#faf5ff" }}
                  className="border-b border-gray-100 last:border-0 transition-colors"
                >
                  <td className="px-5 py-3 text-sm text-gray-800 font-medium">
                    {plan.name}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-800 font-medium">
                    {plan.price}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">
                    {plan.subscribers.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500 max-w-[220px] truncate" title={plan.features}>
                    {plan.features}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        statusStyles[plan.status as keyof typeof statusStyles]
                      }`}
                    >
                      {plan.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">{plan.created}</td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>

          {filteredPlans.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-gray-500">
              No plans match your search.
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}