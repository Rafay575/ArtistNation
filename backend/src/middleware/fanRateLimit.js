// Per-process protection; use a shared gateway/store when running multiple workers.
module.exports = function fanRateLimit(limit, windowMs) {
  const requests = new Map();
  return (req, res, next) => {
    const now = Date.now();
    for (const [key, value] of requests) if (value.until <= now) requests.delete(key);
    // Bound memory without discarding active limits under pressure.
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const keys = [`ip:${ip}`];
    if (typeof req.body?.email === 'string') {
      keys.push(`account:${String(req.params?.subdomain || '').slice(0, 100)}:${req.body.email.trim().toLowerCase().slice(0, 255)}`);
    }
    if (keys.some(key => !requests.has(key)) && requests.size + keys.length > 10000) {
      res.set('Retry-After', String(Math.ceil(windowMs / 1000)));
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
    for (const key of keys) {
      const state = requests.get(key) || { count: 0, until: now + windowMs };
      state.count++;
      requests.set(key, state);
      if (state.count > limit) {
        res.set('Retry-After', String(Math.ceil((state.until - now) / 1000)));
        return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
      }
    }
    next();
  };
};
