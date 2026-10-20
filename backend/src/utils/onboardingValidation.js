const Joi = require('joi');

const reserved = ['www', 'admin', 'api', 'test', 'unavailable', 'mail', 'support'];
const text = (max = 100) => Joi.string().trim().max(max).allow('').default('');
const genres = ['Pop', 'Hip-Hop', 'R&B', 'Country', 'Rock', 'Electronic', 'Indie', 'Jazz', 'Classical', 'Latin', 'Reggae', 'Folk', 'Metal', 'Gospel', 'Afrobeat', 'K-Pop'];
const profileSchema = Joi.object({
  profilePicture: Joi.string().max(2800000).allow(null).default(null),
  artistName: text(50), bio: text(500), city: text(), state: text(), country: text(),
  websiteUrl: Joi.string().uri({ scheme: ['http', 'https'] }).max(255).allow('').default(''),
  primaryGenre: Joi.string().valid('', ...genres).default(''),
  secondaryGenres: Joi.array().items(Joi.string().valid(...genres)).unique().max(16).default([]),
  artistType: Joi.string().valid('', 'Singer', 'Rapper', 'DJ', 'Producer', 'Band', 'Songwriter', 'Influencer', 'Content Creator').default(''),
  yearsActive: Joi.string().pattern(/^\d{1,2}$/).allow('').default(''),
  experienceLevel: Joi.string().valid('', 'beginner', 'intermediate', 'professional', 'veteran').default(''),
  signedStatus: Joi.string().valid('', 'independent', 'signed').default(''),
  labelName: text(), managementCompany: text(), agencyInfo: text(),
  socials: Joi.object().pattern(/^(instagram|tiktok|youtube|spotify|soundcloud|facebook|x)$/, text(255)).default({}),
  goals: Joi.array().items(Joi.string().trim().max(100)).unique().max(20).default([]),
});
const signupSchema = Joi.object({
  fullName: Joi.string().trim().min(1).max(50).required(),
  email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).max(255).required(),
  phone: Joi.string().trim().pattern(/^[0-9 ()-]+$/).custom((v, h) => {
    const digits = v.replace(/\D/g, '');
    return digits.length >= 7 && digits.length <= 15 ? digits : h.error('any.invalid');
  }).required(),
  password: Joi.string().min(8).max(72).custom((value, helpers) => Buffer.byteLength(value) <= 72 ? value : helpers.error('any.invalid')).required(),
  businessName: Joi.string().trim().min(1).max(50).required(),
  subdomain: Joi.string().lowercase().trim().min(3).max(30).pattern(/^[a-z0-9]+(-[a-z0-9]+)*$/).invalid(...reserved).required(),
  billingAddress: Joi.string().trim().min(1).max(255).required(),
  paymentMethodId: Joi.string().pattern(/^pm_[A-Za-z0-9]+$/).required(),
  plan: Joi.string().valid('starter', 'professional', 'enterprise').required(),
  billingCycle: Joi.string().valid('monthly', 'yearly').required(),
});
function validateProfile(data, complete = false) {
  const result = profileSchema.validate(data, { abortEarly: false });
  if (result.error) return result;
  if (result.value.profilePicture) {
    try { require('./profilePicture').decodeProfilePicture(result.value.profilePicture); }
    catch (error) { return { error: { message: error.message } }; }
  }
  if (complete) {
    const required = ['artistName', 'bio', 'city', 'state', 'country', 'primaryGenre', 'artistType', 'yearsActive', 'experienceLevel', 'signedStatus'];
    if (result.value.signedStatus === 'signed') required.push('labelName', 'managementCompany');
    const missing = required.filter(key => !result.value[key]);
    if (missing.length) return { error: { message: `Required fields: ${missing.join(', ')}` } };
  }
  return result;
}
function siteUrl(business) {
  if (!business || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(business.subdomain) || reserved.includes(business.subdomain)) throw new Error('Artist site is not configured');
  const template = process.env.ARTIST_SITE_URL_TEMPLATE || 'https://{subdomain}.artistnation.studio';
  const url = new URL(template.replace('{subdomain}', business.subdomain));
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid artist site URL');
  return url.href;
}
module.exports = { signupSchema, validateProfile, siteUrl };
