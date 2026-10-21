const Joi = require('joi');
const email = Joi.string().trim().lowercase().email({ tlds: { allow: false } }).max(255).required();
const password = Joi.string().min(8).max(72).custom((value, helpers) => Buffer.byteLength(value) <= 72 ? value : helpers.error('any.invalid')).required();
const schemas = {
  login: Joi.object({ email, password, portal: Joi.string().valid('artist', 'admin').default('artist') }),
  email: Joi.object({ email }),
  resetOTP: Joi.object({ email, otp: Joi.string().pattern(/^\d{6}$/).required() }),
  signupOTP: Joi.object({ verificationToken: Joi.string().max(2048).required(), userId: Joi.number().integer().positive().required(), otp: Joi.string().pattern(/^\d{6}$/).required() }),
  resend: Joi.object({ verificationToken: Joi.string().max(2048).required(), userId: Joi.number().integer().positive().required() }),
  reset: Joi.object({ resetToken: Joi.string().max(2048).required(), newPassword: password }),
};
module.exports = name => (req, res, next) => {
  const result = schemas[name].validate(req.body);
  if (result.error) return res.status(400).json({ error: result.error.message });
  req.body = result.value;
  next();
};
