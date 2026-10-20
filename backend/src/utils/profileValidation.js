const Joi = require('joi');
const text = (max = 100) => Joi.string().trim().max(max).allow('');
module.exports = Joi.object({
  fullName: Joi.string().trim().min(1).max(50),
  phone: Joi.string().trim().pattern(/^[0-9 ()+-]{7,30}$/).allow(''),
  billingAddress: text(255), businessBillingAddress: text(255), businessName: Joi.string().trim().min(1).max(100),
  artistName: text(50), bio: text(500), city: text(), state: text(), country: text(),
  websiteUrl: Joi.string().uri({ scheme: ['http', 'https'] }).max(255).allow(''),
  primaryGenre: text(50), secondaryGenres: Joi.array().items(text(50)).unique().max(16),
  artistType: text(50), yearsActive: Joi.string().pattern(/^\d{1,2}$/).allow(''),
  experienceLevel: Joi.string().valid('', 'beginner', 'intermediate', 'professional', 'veteran'),
  signedStatus: Joi.string().valid('', 'independent', 'signed'),
  labelName: text(), managementCompany: text(), agencyInfo: text(),
  socials: Joi.object().pattern(/^(instagram|tiktok|youtube|spotify|soundcloud|facebook|x)$/, text(255)),
  goals: Joi.array().items(text(100)).unique().max(20),
  profilePictureUrl: Joi.string().max(2800000).allow('', null),
});
