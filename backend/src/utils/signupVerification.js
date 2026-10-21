const jwt = require('jsonwebtoken');
function issueVerificationToken(userId, email) {
  return jwt.sign({ id: userId, email, purpose: 'signup-verification' }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '30m' });
}
function readVerificationToken(token) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  if (decoded.purpose !== 'signup-verification' || !Number.isInteger(decoded.id) || typeof decoded.email !== 'string') throw new Error('Invalid verification context');
  return decoded;
}
function requireVerification(req, res, next) {
  try {
    const context = readVerificationToken(req.body.verificationToken);
    if (context.id !== req.body.userId) return res.status(400).json({ error: 'Verification account changed. Please sign in again.' });
    req.verification = context;
    next();
  } catch {
    return res.status(403).json({ error: 'Verification expired. Please sign in again to continue.' });
  }
}
module.exports = { issueVerificationToken, readVerificationToken, requireVerification };
