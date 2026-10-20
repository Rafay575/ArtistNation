const pool = require('../config/db');

async function createSubmission({ artist_id, name, email, phone, message }) {
  const [result] = await pool.query(
    `INSERT INTO contact_submissions (artist_id, name, email, phone, message)
     VALUES (?, ?, ?, ?, ?)`,
    [artist_id, name, email, phone || null, message]
  );
  return result.insertId;
}

async function getSubmissionsByArtist(artistId, { page = 1, limit = 10, startDate, endDate } = {}) {
  const offset = (page - 1) * limit;
  let query = 'SELECT * FROM contact_submissions WHERE artist_id = ?';
  const params = [artistId];

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

  // Count
  let countQuery = 'SELECT COUNT(*) AS total FROM contact_submissions WHERE artist_id = ?';
  const countParams = [artistId];
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
    submissions: rows,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: countRows[0].total,
      totalPages: Math.ceil(countRows[0].total / limit),
    },
  };
}

module.exports = { createSubmission, getSubmissionsByArtist };