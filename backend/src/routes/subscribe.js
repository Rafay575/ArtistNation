const { artistAccess } = require('../middleware/artistAccess');
const express = require('express');
const router = express.Router();
const { findBusinessBySubdomain } = require('../models/business');
const { findUserById } = require('../models/user');
const { createSubscriber, findSubscriberByEmail, getSubscribersByArtist } = require('../models/subscriber');
const auth = require('../middleware/auth');
// POST /api/subscribe/:subdomain
router.post('/:subdomain', async (req, res) => {
    try {
        const { subdomain } = req.params;
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // 1. Find artist by subdomain
        const business = await findBusinessBySubdomain(subdomain);
        if (!business) {
            return res.status(404).json({ error: 'Artist not found' });
        }
        const artistId = business.user_id;

        // 2. Check if already subscribed
        const existing = await findSubscriberByEmail(artistId, email);
        if (existing) {
            return res.status(409).json({ error: 'Email already subscribed' });
        }

        // 3. Create subscriber
        await createSubscriber(artistId, email);

        res.status(201).json({ message: 'Subscribed successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/subscribers (admin protected – requires auth)
// GET /api/subscribers (admin protected – requires auth)
router.get('/', auth, artistAccess, async (req, res) => {
    try {
        const artistId = req.user.id; 
        
        // 1. Get page and limit from query params (defaults provided)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // 2. You will need to update your getSubscribersByArtist model 
        // to accept limit and offset for pagination, and return a total count.
        const { subscribers, total } = await getSubscribersByArtist(artistId, limit, offset);

        // 3. Return the object structure the frontend expects
        res.json({
            subscribers: subscribers,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;