const pool = require('../config/db');

/**
 * GET /api/dashboard/stats
 * Get all dashboard stats for the artist
 */
async function getDashboardStats(req, res) {
  try {
    const userId = req.user.id; // From auth middleware

    // 1. Total Sales (from orders)
    const [sales] = await pool.query(
      `SELECT COALESCE(SUM(total), 0) as total_sales
       FROM orders
       WHERE artist_id = ? AND status = 'completed'`,
      [userId]
    );

    // 2. Total Fans
    const [fans] = await pool.query(
      `SELECT COUNT(*) as total_fans FROM fans WHERE artist_id = ?`,
      [userId]
    );

    // 3. Total Orders (instead of page views)
    const [orders] = await pool.query(
      `SELECT COUNT(*) as total_orders FROM orders WHERE artist_id = ?`,
      [userId]
    );

    // 4. Total Payments (from invoice_history via subscriptions)
    const [payments] = await pool.query(
      `SELECT COALESCE(SUM(ih.amount), 0) as total_payments
       FROM invoice_history ih
       JOIN subscriptions s ON s.id = ih.subscription_id
       JOIN businesses b ON b.id = s.business_id
       WHERE b.user_id = ? AND ih.status = 'paid'`,
      [userId]
    );

    // 5. New Fans (last 10)
    const [newFans] = await pool.query(
      `SELECT id, email, full_name as name, created_at as date
       FROM fans
       WHERE artist_id = ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId]
    );

    // 6. Total Subscribers (from subscribers table)
    const [subscribers] = await pool.query(
      `SELECT COUNT(*) as total_subscribers
       FROM subscribers WHERE artist_id = ?`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        sales: parseFloat(sales[0]?.total_sales || 0),
        fans: parseInt(fans[0]?.total_fans || 0),
        orders: parseInt(orders[0]?.total_orders || 0), // ✅ New: Orders count
        totalPayments: parseFloat(payments[0]?.total_payments || 0),
        subscribers: parseInt(subscribers[0]?.total_subscribers || 0),
        newFans: newFans.map(fan => ({
          id: fan.id,
          email: fan.email,
          name: fan.name,
          date: new Date(fan.date).toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric'
          })
        }))
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
}

module.exports = { getDashboardStats };