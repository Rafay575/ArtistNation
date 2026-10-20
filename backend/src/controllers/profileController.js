const pool = require('../config/db');
const { findUserById, updateUserProfile } = require('../models/user');
const { findBusinessByUserId, updateBusinessProfile } = require('../models/business');
const profileSchema = require('../utils/profileValidation');
const { decodeProfilePicture, saveProfilePicture } = require('../utils/profilePicture');

function parseJSON(value, fallback) {
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return fallback; }
  }
  return value ?? fallback;
}

function profileResponse(user, business) {
  const sensitive = new Set(['password_hash', 'otp_hash', 'otp_expires_at', 'reset_otp_hash', 'reset_otp_expires_at']);
  const camel = object => Object.fromEntries(Object.entries(object || {}).filter(([key]) => !sensitive.has(key)).map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()), value]));
  const safeUser = camel(user);
  for (const key of ['secondaryGenres', 'goals']) {
    const value = parseJSON(safeUser[key], []);
    safeUser[key] = Array.isArray(value) ? value.filter(item => typeof item === 'string') : [];
  }
  const socials = parseJSON(safeUser.socials, {});
  safeUser.socials = socials && typeof socials === 'object' && !Array.isArray(socials) ? socials : {};
  safeUser.onboardingData = parseJSON(safeUser.onboardingData, null);
  for (const key of ['isVerified', 'isOnboarded', 'isAdmin', 'isTrialExpired']) safeUser[key] = !!Number(safeUser[key]);
  if (safeUser.yearsActive !== null && safeUser.yearsActive !== undefined) safeUser.yearsActive = String(safeUser.yearsActive);
  const safeBusiness = camel(business);
  for (const key of ['isActive', 'isOnboarded']) safeBusiness[key] = !!Number(safeBusiness[key]);
  return { user: safeUser, business: safeBusiness };
}

async function getProfile(req, res, next) {
  try {
    const user = await findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(profileResponse(user, await findBusinessByUserId(req.user.id)));
  } catch (error) { next(error); }
}

async function updateProfile(req, res, next) {
  let connection;
  let newPicturePath;
  let committed = false;
  try {
    // Subscription and system fields are never editable through the profile API.
    const validated = profileSchema.validate(req.body, { stripUnknown: true });
    if (validated.error) return res.status(400).json({ error: validated.error.message });
    const updates = validated.value;
    if (updates.profilePictureUrl?.startsWith('data:')) {
      try { decodeProfilePicture(updates.profilePictureUrl); }
      catch (error) { return res.status(400).json({ error: error.message }); }
    }
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [users] = await connection.query('SELECT * FROM users WHERE id = ? FOR UPDATE', [req.user.id]);
    const user = users[0];
    if (!user) { await connection.rollback(); return res.status(404).json({ error: 'User not found' }); }
    const businessUpdates = {};
    for (const key of ['businessName', 'businessBillingAddress']) {
      if (updates[key] !== undefined) { businessUpdates[key] = updates[key]; delete updates[key]; }
    }
    if (Object.keys(businessUpdates).length) {
      const [businesses] = await connection.query('SELECT id FROM businesses WHERE user_id = ? FOR UPDATE', [req.user.id]);
      if (!businesses.length) { await connection.rollback(); return res.status(400).json({ error: 'Business record not found' }); }
    }
    if (updates.profilePictureUrl?.startsWith('data:')) {
      const picture = await saveProfilePicture(req.user.id, updates.profilePictureUrl);
      newPicturePath = picture.path;
      updates.profilePictureUrl = picture.url;
    } else if (updates.profilePictureUrl !== undefined && updates.profilePictureUrl !== null
      && updates.profilePictureUrl !== '' && updates.profilePictureUrl !== user.profile_picture_url) {
      await connection.rollback();
      return res.status(400).json({ error: 'Please upload a JPEG, PNG or WebP profile picture' });
    }
    await updateUserProfile(req.user.id, updates, connection);
    await updateBusinessProfile(req.user.id, businessUpdates, connection);
    const [savedUsers] = await connection.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const [savedBusinesses] = await connection.query('SELECT * FROM businesses WHERE user_id = ?', [req.user.id]);
    await connection.commit();
    committed = true;
    return res.json({ message: 'Profile updated successfully', ...profileResponse(savedUsers[0], savedBusinesses[0]) });
  } catch (error) {
    if (connection && !committed) await connection.rollback().catch(() => {});
    if (newPicturePath && !committed) await require('fs/promises').unlink(newPicturePath).catch(() => {});
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'This phone number is already in use' });
    next(error);
  } finally { if (connection) connection.release(); }
}

module.exports = { getProfile, updateProfile };
