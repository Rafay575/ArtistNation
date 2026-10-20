"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// ============================================================
// Types
// ============================================================

interface AnalyticsData {
  kpi: {
    sales: number;
    subscribers: number;
    activeTrials: number;
    payments: number;
  };
  charts: {
    salesOverTime: Array<{ date: string; count: number; revenue: number }>;
    artistTypeDistribution: {
      labels: string[];
      data: number[];
    };
    signupsOverTime: Array<{ date: string; count: number }>;
    trialVsActive: {
      trial: number;
      active: number;
    };
  };
}

// ============================================================
// Helpers
// ============================================================

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

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

const chartFade = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
} as const;

// ============================================================
// Colors
// ============================================================

const colors = {
  purple: '#5D2FDB',
  emerald: '#10B981',
  amber: '#F59E0B',
  blue: '#3B82F6',
};

// ============================================================
// Component
// ============================================================

export default function ExecutiveDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dateError, setDateError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    if (startDate > endDate) {
      setDateError('Start date cannot be after end date.');
      return;
    }
    setDateError(null);

    try {
      setLoading(true);
      setError(null);

      const response = await api.get<{ success: boolean; data: AnalyticsData }>(
        `/api/admin/executive/analytics?startDate=${startDate}&endDate=${endDate}`
      );

      setData(response.data.data);
    } catch (err: any) {
      console.error('Analytics fetch error:', err);
      setError(err.response?.data?.error || 'Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // ============================================================
  // Chart Configs
  // ============================================================

  const salesChartData = {
    labels: data?.charts.salesOverTime.map(d => formatDate(d.date)) || [],
    datasets: [{
      label: 'Sales',
      data: data?.charts.salesOverTime.map(d => d.count) || [],
      borderColor: colors.purple,
      backgroundColor: `${colors.purple}20`,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: colors.purple,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
    }],
  };

  const salesChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx: any) => `Sales: ${ctx.parsed.y}` } },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
      x: { grid: { display: false } },
    },
  };

  const artistTypeChartData = {
    labels: data?.charts.artistTypeDistribution.labels || [],
    datasets: [{
      label: 'Artists by Type',
      data: data?.charts.artistTypeDistribution.data || [],
      backgroundColor: [colors.purple, colors.blue, colors.emerald],
      borderWidth: 0,
      borderRadius: 4,
      barPercentage: 0.6,
    }],
  };

  const artistTypeChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { usePointStyle: true, padding: 20, font: { size: 12 } },
      },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
      x: { grid: { display: false } },
    },
  };

  const signupsChartData = {
    labels: data?.charts.signupsOverTime.map(d => formatDate(d.date)) || [],
    datasets: [{
      label: 'Signups',
      data: data?.charts.signupsOverTime.map(d => d.count) || [],
      borderColor: colors.emerald,
      backgroundColor: `${colors.emerald}20`,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: colors.emerald,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
    }],
  };

  const signupsChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx: any) => `Signups: ${ctx.parsed.y}` } },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
      x: { grid: { display: false } },
    },
  };

  const trialVsActiveData = {
    labels: ['Trialing', 'Active'],
    datasets: [{
      data: [
        data?.charts.trialVsActive.trial || 0,
        data?.charts.trialVsActive.active || 0,
      ],
      backgroundColor: [colors.amber, colors.purple],
      borderWidth: 0,
    }],
  };

  const trialVsActiveOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { usePointStyle: true, padding: 20, font: { size: 12 } },
      },
    },
    cutout: '60%',
  };

  // ============================================================
  // Loading
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading executive dashboard...</p>
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
        {/* Header + Date Filter */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-wrap items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Executive Dashboard</h1>
            <p className="text-sm text-gray-500">Dynamic KPI and analytics reporting</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
            <div>
              <label className="text-xs text-gray-500 block mb-0.5">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>
            <span className="text-gray-400">→</span>
            <div>
              <label className="text-xs text-gray-500 block mb-0.5">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>
            <button
              onClick={fetchAnalytics}
              className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm mt-1.5"
            >
              Apply
            </button>
          </div>
        </motion.div>

        {/* Date Error */}
        {dateError && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700">
            ⚠️ {dateError}
          </div>
        )}

        {/* API Error */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
            <p className="text-rose-700 font-medium">⚠️ {error}</p>
            <button
              onClick={fetchAnalytics}
              className="mt-3 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* KPI Cards + Charts */}
        {data && (
          <>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <motion.div variants={fadeUp} whileHover={{ y: -2 }} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-gray-500">Sales (Total)</p>
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.kpi.sales)}</p>
              </motion.div>

              <motion.div variants={fadeUp} whileHover={{ y: -2 }} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-gray-500">Subscribers (Total)</p>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{data.kpi.subscribers.toLocaleString()}</p>
              </motion.div>

              <motion.div variants={fadeUp} whileHover={{ y: -2 }} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-gray-500">Active Trials</p>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{data.kpi.activeTrials.toLocaleString()}</p>
              </motion.div>

              <motion.div variants={fadeUp} whileHover={{ y: -2 }} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-gray-500">Payments</p>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{data.kpi.payments.toLocaleString()}</p>
              </motion.div>
            </motion.div>

            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <motion.div variants={chartFade} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Sales Over Time</h3>
                <div className="h-64">
                  <Line data={salesChartData} options={salesChartOptions} />
                </div>
              </motion.div>

              <motion.div variants={chartFade} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Artist Type Distribution</h3>
                <div className="h-64">
                  <Bar data={artistTypeChartData} options={artistTypeChartOptions} />
                </div>
              </motion.div>

              <motion.div variants={chartFade} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Signups Over Time</h3>
                <div className="h-64">
                  <Line data={signupsChartData} options={signupsChartOptions} />
                </div>
              </motion.div>

              <motion.div variants={chartFade} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Trial vs Active Subscriptions</h3>
                <div className="h-64 flex items-center justify-center">
                  <div className="w-64 h-64">
                    <Doughnut data={trialVsActiveData} options={trialVsActiveOptions} />
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {data.kpi.sales === 0 &&
              data.kpi.subscribers === 0 &&
              data.kpi.activeTrials === 0 &&
              data.kpi.payments === 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <div className="text-4xl mb-4">📊</div>
                  <p className="text-gray-500 text-lg">No data available for the selected period.</p>
                  <p className="text-sm text-gray-400 mt-1">Try adjusting your date range.</p>
                </div>
              )}
          </>
        )}
      </div>
    </div>
  );
}