// controllers/publicController.js
const { findBusinessBySubdomain } = require('../models/business');
const { getSettings, getPageBySlug, getSectionsByPage } = require('../models/website');
const { accessState } = require('../utils/billingLifecycle');

// getArtistData now returns only settings (which includes nav_links)
exports.getArtistData = async (req, res, next) => {
    try {
        const { subdomain } = req.params;
        const business = await findBusinessBySubdomain(subdomain);
        if (!business) {
            return res.status(404).json({ error: 'Artist not found' });
        }

        const userId = business.user_id;
        const billing = await accessState(business.id);
        if (billing.state !== 'active') return res.status(402).json({ error: 'SUBSCRIPTION_EXPIRED', state: billing.state });
        const settings = await getSettings(userId); // already contains nav_links

        res.json({ settings });
    } catch (err) {
        next(err);
    }
};

// getArtistPage remains unchanged (page content + sections)
exports.getArtistPage = async (req, res, next) => {
    try {
        const { subdomain, slug = 'home' } = req.params;
        const business = await findBusinessBySubdomain(subdomain);
        if (!business) {
            return res.status(404).json({ error: 'Artist not found' });
        }

        const userId = business.user_id;
        const billing = await accessState(business.id);
        if (billing.state !== 'active') return res.status(402).json({ error: 'SUBSCRIPTION_EXPIRED', state: billing.state });
        const page = await getPageBySlug(userId, slug);
        if (!page || !page.is_published) {
            return res.status(404).json({ error: 'Page not found' });
        }

        const sections = await getSectionsByPage(page.id);
        page.sections = sections;

        res.json(page);
    } catch (err) {
        next(err);
    }
};
