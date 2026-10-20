const pool = require('../config/db');

/**
 * GET /api/admin/payments/stats
 * Get payment summary stats
 */
async function getPaymentStats(req, res) {
  try {
    const [totalRevenue] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM invoice_history WHERE status = 'paid'`
    );
    const [totalPayments] = await pool.query(
      `SELECT COUNT(*) as total FROM invoice_history WHERE status = 'paid'`
    );
    const [failedPayments] = await pool.query(
      `SELECT COUNT(*) as total FROM invoice_history WHERE status = 'failed'`
    );
    const [pendingPayments] = await pool.query(
      `SELECT COUNT(*) as total FROM invoice_history WHERE status = 'unpaid'`
    );

    res.json({
      success: true,
      data: {
        totalRevenue: parseFloat(totalRevenue[0]?.total || 0),
        totalPayments: parseInt(totalPayments[0]?.total || 0),
        failedPayments: parseInt(failedPayments[0]?.total || 0),
        pendingPayments: parseInt(pendingPayments[0]?.total || 0),
      }
    });
  } catch (error) {
    console.error('Payment stats error:', error);
    res.status(500).json({ error: 'Failed to fetch payment stats' });
  }
}

/**
 * GET /api/admin/payments
 * Get all payments with filters and pagination
 * Query params: search, status, startDate, endDate, page, limit
 */
async function getPayments(req, res) {
  try {
    const {
      search = '',
      status = '',
      startDate = '',
      endDate = '',
      page = 1,
      limit = 20,
    } = req.query;

    const offset = (page - 1) * limit;

    let whereClause = '1=1';
    const params = [];

    if (search) {
      whereClause += ` AND (
        u.full_name LIKE ? OR
        u.email LIKE ? OR
        b.business_name LIKE ? OR
        ih.stripe_invoice_id LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (status) {
      whereClause += ` AND ih.status = ?`;
      params.push(status);
    }

    if (startDate) {
      whereClause += ` AND ih.paid_at >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ` AND ih.paid_at <= ?`;
      params.push(endDate + ' 23:59:59');
    }

    // Count total
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total
       FROM invoice_history ih
       JOIN subscriptions s ON s.stripe_subscription_id = ih.stripe_subscription_id
       JOIN businesses b ON b.id = s.business_id
       JOIN users u ON u.id = b.user_id
       WHERE ${whereClause}`,
      params
    );
    const total = countResult[0]?.total || 0;

    // Get paginated payments
    const [payments] = await pool.query(
      `SELECT 
         ih.id,
         ih.stripe_invoice_id,
         ih.amount,
         ih.currency,
         ih.status,
         ih.paid_at,
         ih.invoice_pdf_url,
         ih.hosted_invoice_url,
         ih.created_at,
         s.id as subscription_id,
         s.plan,
         s.billing_cycle,
         b.id as business_id,
         b.business_name,
         b.subdomain,
         u.id as user_id,
         u.full_name as customer_name,
         u.email as customer_email
       FROM invoice_history ih
       JOIN subscriptions s ON s.stripe_subscription_id = ih.stripe_subscription_id
       JOIN businesses b ON b.id = s.business_id
       JOIN users u ON u.id = b.user_id
       WHERE ${whereClause}
       ORDER BY ih.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    res.json({
      success: true,
      data: {
        payments: payments.map(p => ({
          ...p,
          amount: parseFloat(p.amount),
        })),
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        }
      }
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
}

module.exports = { getPaymentStats, getPayments };