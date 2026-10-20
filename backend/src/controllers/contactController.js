const contactModel = require('../models/contactSubmission');
const { findBusinessBySubdomain } = require('../models/business');

// Public submission
exports.submitContactForm = async (req, res, next) => {
  try {
    const { subdomain } = req.params;
    const { name, email, phone, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    const business = await findBusinessBySubdomain(subdomain);
    if (!business) return res.status(404).json({ error: 'Artist not found' });

    await contactModel.createSubmission({
      artist_id: business.user_id,
      name,
      email,
      phone,
      message,
    });

    res.status(201).json({ message: 'Message sent successfully' });
  } catch (err) {
    next(err);
  }
};

// Admin list
exports.getSubmissions = async (req, res, next) => {
  try {
    const artistId = req.user.id;
    const { page = 1, limit = 10, startDate, endDate } = req.query;
    const data = await contactModel.getSubmissionsByArtist(artistId, { page, limit, startDate, endDate });
    res.json(data);
  } catch (err) {
    next(err);
  }
};