const pool = require('../config/db');

async function createOrder(data) {
  const {
    fan_id,
    artist_id,
    business_id,
    items,
    total,
    pickup_location,
    first_name,
    last_name,
    email,
    phone,
    street_address,
    city,
    postal_code,
    payment_intent_id,
  } = data;

  const [result] = await pool.query(
    `INSERT INTO orders 
     (fan_id, artist_id, business_id, items, total, status, pickup_location,
      first_name, last_name, email, phone, street_address, city, postal_code, payment_intent_id)
     VALUES (?, ?, ?, ?, ?, 'processing', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      fan_id, artist_id, business_id,
      JSON.stringify(items), total,
      pickup_location,
      first_name, last_name, email, phone,
      street_address, city, postal_code, payment_intent_id,
    ]
  );
  return result.insertId;
}

async function getOrdersByArtist(artistId, { page = 1, limit = 10, status, startDate, endDate } = {}) {
  const offset = (page - 1) * limit;

  let query = `
    SELECT
      o.*,
      f.full_name AS fan_name,
      f.email AS fan_email,
      f.is_verified AS fan_is_verified
    FROM orders o
    LEFT JOIN fans f ON f.id = o.fan_id
    WHERE o.artist_id = ?
  `;
  const params = [artistId];

  if (status) {
    query += ' AND o.status = ?';
    params.push(status);
  }
  if (startDate) {
    query += ' AND o.created_at >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND o.created_at <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const [rows] = await pool.query(query, params);

  // Count total (no join needed here — filtering is only on orders columns)
  let countQuery = 'SELECT COUNT(*) AS total FROM orders WHERE artist_id = ?';
  const countParams = [artistId];
  if (status) {
    countQuery += ' AND status = ?';
    countParams.push(status);
  }
  if (startDate) {
    countQuery += ' AND created_at >= ?';
    countParams.push(startDate);
  }
  if (endDate) {
    countQuery += ' AND created_at <= ?';
    countParams.push(endDate);
  }
  const [countRows] = await pool.query(countQuery, countParams);
  const totalOrders = countRows[0].total;

  return {
    orders: rows.map(row => ({
      ...row,
      items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
    })),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
    },
  };
}

async function updateOrderStatus(orderId, status) {
  await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
}

module.exports = { createOrder, getOrdersByArtist, updateOrderStatus };

async function updateOrderStatus(orderId, status) {
  await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
}
async function getOrdersByFan(fanId, { page = 1, limit = 10, status, startDate, endDate } = {}) {
  const offset = (page - 1) * limit;
  let query = 'SELECT * FROM orders WHERE fan_id = ?';
  const params = [fanId];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (startDate) {
    query += ' AND created_at >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND created_at <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const [rows] = await pool.query(query, params);

  // Total count
  let countQuery = 'SELECT COUNT(*) AS total FROM orders WHERE fan_id = ?';
  const countParams = [fanId];
  if (status) {
    countQuery += ' AND status = ?';
    countParams.push(status);
  }
  if (startDate) {
    countQuery += ' AND created_at >= ?';
    countParams.push(startDate);
  }
  if (endDate) {
    countQuery += ' AND created_at <= ?';
    countParams.push(endDate);
  }
  const [countRows] = await pool.query(countQuery, countParams);

  return {
    orders: rows.map(row => ({
      ...row,
      items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
    })),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: countRows[0].total,
      totalPages: Math.ceil(countRows[0].total / limit),
    },
  };
}

// Make sure to export it
module.exports = { createOrder, getOrdersByArtist, updateOrderStatus, getOrdersByFan };