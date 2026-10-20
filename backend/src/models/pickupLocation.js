const pool = require('../config/db');

async function getLocationsByUser(userId) {
  const [rows] = await pool.query(
    'SELECT * FROM pickup_locations WHERE user_id = ? ORDER BY name ASC',
    [userId]
  );
  return rows;
}

async function getLocationById(locationId) {
  const [rows] = await pool.query('SELECT * FROM pickup_locations WHERE id = ?', [locationId]);
  return rows[0];
}

async function createLocation(userId, { name, address, city, state, postalCode, isActive }) {
  const [result] = await pool.query(
    `INSERT INTO pickup_locations (user_id, name, address, city, state, postal_code, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, name, address || null, city || null, state || null, postalCode || null, isActive ? 1 : 0]
  );
  return result.insertId;
}

async function updateLocation(locationId, { name, address, city, state, postalCode, isActive }) {
  const setClauses = [];
  const values = [];
  if (name !== undefined) { setClauses.push('name = ?'); values.push(name); }
  if (address !== undefined) { setClauses.push('address = ?'); values.push(address); }
  if (city !== undefined) { setClauses.push('city = ?'); values.push(city); }
  if (state !== undefined) { setClauses.push('state = ?'); values.push(state); }
  if (postalCode !== undefined) { setClauses.push('postal_code = ?'); values.push(postalCode); }
  if (isActive !== undefined) { setClauses.push('is_active = ?'); values.push(isActive ? 1 : 0); }

  if (setClauses.length === 0) return;
  values.push(locationId);
  await pool.query(`UPDATE pickup_locations SET ${setClauses.join(', ')} WHERE id = ?`, values);
}

async function deleteLocation(locationId) {
  await pool.query('DELETE FROM pickup_locations WHERE id = ?', [locationId]);
}

// Public: get active locations for a user (by userId)
async function getActiveLocationsByUser(userId) {
  const [rows] = await pool.query(
    'SELECT id, name, address, city, state, postal_code FROM pickup_locations WHERE user_id = ? AND is_active = 1 ORDER BY name ASC',
    [userId]
  );
  return rows;
}

module.exports = {
  getLocationsByUser,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
  getActiveLocationsByUser,
};