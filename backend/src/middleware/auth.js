const { authenticateToken } = require('../utils/userSessions');
module.exports = async (req, res, next) => {
  const header = req.headers.authorization;
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const session = await authenticateToken(header.slice(7));
    if (!session) return res.status(401).json({ error: 'Session expired. Please sign in again.' });
    const user = session.user;
    req.user = { id: user.id, email: user.email, fullName: user.full_name, isAdmin: user.is_admin === 1, isOnboarded: !!user.is_onboarded, isVerified: true };
    req.sessionId = session.sessionId;
    next();
  } catch (error) {
    if (['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(error.name)) return res.status(401).json({ error: 'Invalid or expired token' });
    next(error);
  }
};
