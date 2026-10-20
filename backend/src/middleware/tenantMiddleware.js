const { findActiveBusinessBySubdomain } = require('../models/business');

const tenantMiddleware = async (req, res, next) => {
    // Skip OPTIONS preflight requests
    if (req.method === 'OPTIONS') return next();

    // 1. Extract hostname (remove port if present)
    const host = req.get('host') || '';
    const hostname = host.split(':')[0];

    // 2. Skip root/admin domains (including test staging domain)
    if (
        hostname === 'localhost' || 
        hostname === 'artistnation.studio' || 
        hostname === 'test.artistnation.studio'
    ) {
        return next();
    }

    // 3. Try to extract subdomain from custom header (for local proxy) OR from Host header
    let subdomain = req.headers['x-subdomain'];
    if (!subdomain) {
        const parts = hostname.split('.');
        if (parts.length >= 2) {
            const potentialSub = parts[0];
            // Skip reserved system subdomains
            if (!['www', 'admin', 'api', 'test'].includes(potentialSub)) {
                subdomain = potentialSub;
            }
        }
    }

    // 4. If we have a valid client subdomain, check if it's active in the database
    if (subdomain) {
        try {
            const business = await findActiveBusinessBySubdomain(subdomain);
            if (!business) {
                return res.status(404).json({
                    error: 'TENANT_NOT_FOUND_OR_INACTIVE',
                    message: 'This site is not yet active or does not exist.',
                    subdomain,
                });
            }
            // Attach the business/tenant data to the request object
            req.tenant = business;
        } catch (err) {
            console.error('Tenant middleware error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    next();
};

module.exports = tenantMiddleware;


