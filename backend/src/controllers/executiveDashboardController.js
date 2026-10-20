const pool = require('../config/db');

/**
 * GET /api/admin/executive/analytics
 * Get all executive dashboard analytics for a date range
 */
async function getExecutiveAnalytics(req, res) {
  try {
    const { startDate, endDate } = req.query;

    // 1. Validate date inputs
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Both startDate and endDate are required.'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format. Use YYYY-MM-DD.'
      });
    }

    if (start > end) {
      return res.status(400).json({
        error: 'Start date cannot be after end date.'
      });
    }

    // 2. Execute all queries in parallel
    const [
      kpiSales,
      kpiSubscribers,
      kpiActiveTrials,
      kpiPayments,
      chartSalesOverTime,
      chartArtistType,
      chartSignupsOverTime,
      chartTrialVsActive
    ] = await Promise.all([
      // ============================================================
      // KPI 1: Total Sales (from invoice_history)
      // ============================================================
      pool.query(
        `SELECT COALESCE(SUM(amount), 0) as total
         FROM invoice_history
         WHERE status = 'paid'
           AND paid_at BETWEEN ? AND ?`,
        [start, end]
      ),

      // ============================================================
      // KPI 2: Subscribers (from site_subscribers - admin site subscribers)
      // ============================================================
      pool.query(
        `SELECT COUNT(*) as total
         FROM site_subscribers
         WHERE status = 'active'
           AND created_at BETWEEN ? AND ?`,
        [start, end]
      ),

      // ============================================================
      // KPI 3: Active Trials (from subscriptions)
      // ============================================================
      pool.query(
        `SELECT COUNT(*) as total
         FROM subscriptions
         WHERE status = 'trialing'
           AND started_at BETWEEN ? AND ?`,
        [start, end]
      ),

      // ============================================================
      // KPI 4: Payments (count of paid invoices)
      // ============================================================
      pool.query(
        `SELECT COUNT(*) as total
         FROM invoice_history
         WHERE status = 'paid'
           AND paid_at BETWEEN ? AND ?`,
        [start, end]
      ),

      // ============================================================
      // Chart 1: Sales Over Time (from invoice_history)
      // ============================================================
      pool.query(
        `SELECT DATE(paid_at) as date, 
                COUNT(*) as count, 
                SUM(amount) as revenue
         FROM invoice_history
         WHERE status = 'paid'
           AND paid_at BETWEEN ? AND ?
         GROUP BY DATE(paid_at)
         ORDER BY date ASC`,
        [start, end]
      ),

      // ============================================================
      // Chart 2: Artist Type Distribution (from users)
      // ============================================================
      pool.query(
        `SELECT artist_type, COUNT(*) as count
         FROM users
         WHERE artist_type IS NOT NULL
           AND artist_type != ''
           AND created_at BETWEEN ? AND ?
         GROUP BY artist_type`,
        [start, end]
      ),

      // ============================================================
      // Chart 3: Signups Over Time (from users)
      // ============================================================
      pool.query(
        `SELECT DATE(created_at) as date, COUNT(*) as count
         FROM users
         WHERE created_at BETWEEN ? AND ?
         GROUP BY DATE(created_at)
         ORDER BY date ASC`,
        [start, end]
      ),

      // ============================================================
      // Chart 4: Trial vs Active (from subscriptions)
      // ============================================================
      pool.query(
        `SELECT status, COUNT(*) as count
         FROM subscriptions
         WHERE status IN ('trialing', 'active')
           AND started_at BETWEEN ? AND ?
         GROUP BY status`,
        [start, end]
      ),
    ]);

    // 3. Format response
    const response = {
      success: true,
      data: {
        kpi: {
          sales: parseFloat(kpiSales[0][0]?.total || 0),
          subscribers: parseInt(kpiSubscribers[0][0]?.total || 0),
          activeTrials: parseInt(kpiActiveTrials[0][0]?.total || 0),
          payments: parseInt(kpiPayments[0][0]?.total || 0),
        },
        charts: {
          salesOverTime: chartSalesOverTime[0].map(row => ({
            date: row.date,
            count: parseInt(row.count),
            revenue: parseFloat(row.revenue || 0),
          })),
          artistTypeDistribution: {
            labels: chartArtistType[0].map(row => row.artist_type),
            data: chartArtistType[0].map(row => parseInt(row.count)),
          },
          signupsOverTime: chartSignupsOverTime[0].map(row => ({
            date: row.date,
            count: parseInt(row.count),
          })),
          trialVsActive: {
            trial: parseInt(chartTrialVsActive[0].find(row => row.status === 'trialing')?.count || 0),
            active: parseInt(chartTrialVsActive[0].find(row => row.status === 'active')?.count || 0),
          }
        }
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Executive analytics error:', error);
    res.status(500).json({
      error: 'Failed to fetch executive analytics. Please try again later.'
    });
  }
}

module.exports = { getExecutiveAnalytics };