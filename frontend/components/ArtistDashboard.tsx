"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import Link from 'next/link';

interface DashboardStats {
  sales: number;
  fans: number;
  orders: number;
  totalPayments: number;
  subscribers: number;
  newFans: Array<{
    id: number;
    email: string;
    name: string;
    date: string;
  }>;
}

export default function ArtistDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/api/dashboard/stats');
        setStats(response.data.data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      id: 1,
      label: "Sales",
      value: `$${stats?.sales.toLocaleString() || 0}`,
      icon: "💰",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-600",
    },
    {
      id: 2,
      label: "Fans",
      value: stats?.fans.toLocaleString() || 0,
      icon: "👥",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      id: 3,
      label: "Orders",
      value: stats?.orders.toLocaleString() || 0,
      icon: "📦",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      id: 4,
      label: "Total Payments",
      value: `$${stats?.totalPayments.toLocaleString() || 0}`,
      icon: "💳",
      bgColor: "bg-amber-50",
      textColor: "text-amber-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Welcome back! Here's an overview of your stats.
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {statCards.map((stat) => (
            <motion.div
              key={stat.id}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{stat.icon}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stat.bgColor} ${stat.textColor}`}>
                  {stat.id === 3 ? 'New' : ''}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* New Fans Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
        >
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">New Fans</h2>
            {stats?.newFans && stats.newFans.length > 0 && (
              <Link
                href="/admin/fans"
                className="text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
              >
                View More →
              </Link>
            )}
          </div>

          <div className="overflow-x-auto">
            {stats?.newFans && stats.newFans.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.newFans.map((fan) => (
                    <tr
                      key={fan.id}
                      className="border-b border-gray-50 last:border-0 hover:bg-purple-50/30 transition-colors"
                    >
                      <td className="px-6 py-3 text-sm text-gray-800">{fan.email}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{fan.name}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">{fan.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="px-6 py-10 text-center">
                <p className="text-gray-500 text-sm">No fans yet. Share your music to start growing your audience!</p>
              </div>
            )}
          </div>

          <div className="px-6 py-3 border-t border-gray-50 bg-gray-50/50">
            <p className="text-xs text-gray-500">
              {stats?.subscribers || 0} subscribers · {stats?.fans || 0} total fans
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}