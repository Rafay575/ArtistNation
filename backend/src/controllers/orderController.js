const pool = require('../config/db'); // or wherever your mysql pool/connection is exported from
const orderModel = require('../models/order');

exports.getOrders = async (req, res, next) => {
  try {
    const artistId = req.user.id; // admin auth middleware sets req.user.id
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;
    const data = await orderModel.getOrdersByArtist(artistId, { page, limit, status, startDate, endDate });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const artistId = req.user.id;
    const { orderId } = req.params;
    const { status } = req.body;

    // Verify the order belongs to this artist
    const [rows] = await pool.query('SELECT artist_id FROM orders WHERE id = ?', [orderId]);
    if (!rows.length || rows[0].artist_id !== artistId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await orderModel.updateOrderStatus(orderId, status);
    res.json({ message: 'Order status updated' });
  } catch (err) {
    next(err);
  }
};