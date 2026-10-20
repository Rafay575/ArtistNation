const Joi = require('joi');

const email = Joi.string().trim().lowercase().email({ tlds: { allow: false } }).max(255).required();
const password = Joi.string().min(8).max(72).custom((value, helpers) =>
  Buffer.byteLength(value, 'utf8') <= 72 ? value : helpers.error('any.invalid')).required();
const otp = Joi.string().pattern(/^\d{6}$/).required();
const schemas = {
  register: Joi.object({ email, password, fullName: Joi.string().trim().min(1).max(100).required() }),
  login: Joi.object({ email, password }),
  email: Joi.object({ email }),
  otp: Joi.object({ email, otp }),
  reset: Joi.object({ resetToken: Joi.string().max(2048).required(), newPassword: password }),
};

module.exports = name => (req, res, next) => {
  const result = schemas[name].validate(req.body);
  if (result.error) return res.status(400).json({ error: result.error.message });
  req.body = result.value;
  next();
};
