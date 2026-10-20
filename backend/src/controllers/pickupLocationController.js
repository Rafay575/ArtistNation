const locationModel = require('../models/pickupLocation');

// Admin: list all locations for logged-in artist
exports.getLocations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const locations = await locationModel.getLocationsByUser(userId);
    res.json(locations);
  } catch (err) {
    next(err);
  }
};

// Admin: create a new location
exports.createLocation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, address, city, state, postalCode, isActive } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Location name is required' });
    }
    const id = await locationModel.createLocation(userId, { name, address, city, state, postalCode, isActive });
    res.status(201).json({ id, message: 'Location created' });
  } catch (err) {
    next(err);
  }
};

// Admin: update a location
exports.updateLocation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { locationId } = req.params;
    const location = await locationModel.getLocationById(locationId);
    if (!location || location.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const { name, address, city, state, postalCode, isActive } = req.body;
    await locationModel.updateLocation(locationId, { name, address, city, state, postalCode, isActive });
    res.json({ message: 'Location updated' });
  } catch (err) {
    next(err);
  }
};

// Admin: delete a location
exports.deleteLocation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { locationId } = req.params;
    const location = await locationModel.getLocationById(locationId);
    if (!location || location.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    await locationModel.deleteLocation(locationId);
    res.json({ message: 'Location deleted' });
  } catch (err) {
    next(err);
  }
};

// Public: get active locations for a specific artist (by subdomain)
exports.getPublicLocations = async (req, res, next) => {
  try {
    const { subdomain } = req.params;
    const business = await require('../models/business').findBusinessBySubdomain(subdomain);
    if (!business) return res.status(404).json({ error: 'Artist not found' });
    const locations = await locationModel.getActiveLocationsByUser(business.user_id);
    res.json(locations);
  } catch (err) {
    next(err);
  }
};

exports.getPublicLocations = async (req, res, next) => {
  try {
    const { subdomain } = req.params;
    const business = await require('../models/business').findBusinessBySubdomain(subdomain);
    if (!business) return res.status(404).json({ error: 'Artist not found' });
    const locations = await locationModel.getActiveLocationsByUser(business.user_id);
    res.json(locations);
  } catch (err) {
    next(err);
  }
};