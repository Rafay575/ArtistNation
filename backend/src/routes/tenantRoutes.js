// src/routes/tenantRoutes.js
const express = require('express');
const router = express.Router();

// GET /api/tenant/config
// Returns the settings for the current tenant (subdomain)
// Relies on the tenantMiddleware to have already attached req.tenant
router.get('/config', async (req, res, next) => {
    try {
        // If the tenant middleware ran correctly, req.tenant should exist
        if (!req.tenant) {
            // This shouldn't happen if middleware is working, but just in case
            return res.status(404).json({ error: 'Tenant not found' });
        }

        // For now, return default settings + business name.
        // Later, you can query a tenant_settings table for logos/colors.
        // Example: const settings = await getTenantSettings(req.tenant.id);
        const settings = {
            siteTitle: req.tenant.business_name || 'My Site',
            primaryColor: '#007bff',
            secondaryColor: '#6c757d',
            logoUrl: 'https://via.placeholder.com/200x50?text=Logo',
            faviconUrl: 'https://via.placeholder.com/32x32?text=Favicon',
            // Add any other settings you want to expose to the React app
        };

        res.json(settings);
    } catch (err) {
        next(err);
    }
});

module.exports = router;