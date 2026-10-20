const jwt = require('jsonwebtoken');
const { findFanAuthById } = require('../models/fan');
const { matchesVersion } = require('../utils/fanTokens');
const { findBusinessBySubdomain } = require('../models/business');

module.exports = async function fanAuth(req, res, next) {
  const header = req.headers.authorization;
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  let decoded;
  try {
    decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET, { algorithms: ['HS256'] });
    if (decoded.role !== 'fan' || decoded.purpose !== 'fan-access'
      || !Number.isInteger(decoded.id) || !Number.isInteger(decoded.artistId)) {
      return res.status(401).json({ error: 'Invalid fan access token' });
    }
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  try {
    const fan = await findFanAuthById(decoded.id);
    if (!fan || !fan.is_verified || fan.artist_id !== decoded.artistId || !matchesVersion(decoded.version, fan.password_hash)) {
      return res.status(401).json({ error: 'Session expired. Please sign in again.' });
    }
    if (req.params?.subdomain) {
      const business = await findBusinessBySubdomain(req.params.subdomain);
      if (!business || !business.is_active || business.user_id !== fan.artist_id) {
        return res.status(403).json({ error: 'This account does not belong to this artist.' });
      }
    }
    req.fan = { id: fan.id, artist_id: fan.artist_id };
    next();
  } catch (error) { next(error); }
};
