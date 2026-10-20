// models/business.js
const pool = require('../config/db');

async function createBusiness(
  connection, // <-- added
  { userId, businessName, subdomain, billingAddress }
) {
  const [result] = await connection.execute(
    `INSERT INTO businesses (user_id, business_name, subdomain, billing_address, is_onboarded) 
     VALUES (?, ?, ?, ?, false)`,
    [userId, businessName, subdomain, billingAddress]
  );
  return result.insertId;
}

async function findBusinessBySubdomain(subdomain) {
    const [rows] = await pool.query('SELECT * FROM businesses WHERE subdomain = ?', [subdomain]);
    return rows[0];
}

// NEW: find business by user ID
async function findBusinessByUserId(userId) {
    const [rows] = await pool.query('SELECT * FROM businesses WHERE user_id = ?', [userId]);
    return rows[0];
}

// NEW: update onboarding data
async function updateBusinessOnboarding(userId, { logo, industry, website, taxId }) {
    await pool.query(
        `UPDATE businesses 
         SET logo = ?, industry = ?, website = ?, tax_id = ?, is_onboarded = true 
         WHERE user_id = ?`,
        [logo, industry, website, taxId, userId]
    );
}
// models/business.js – add this function

// models/business.js – updateBusinessProfile function
async function updateBusinessProfile(userId, data, connection = pool) {
    const { businessName, businessBillingAddress } = data;

    const fields = [];
    const values = [];

    if (businessName !== undefined) {
        fields.push('business_name = ?');
        values.push(businessName);
    }

    if (businessBillingAddress !== undefined) {
        fields.push('billing_address = ?');
        values.push(businessBillingAddress);
    }

    if (fields.length === 0) return;

    values.push(userId);
    const query = `UPDATE businesses SET ${fields.join(', ')} WHERE user_id = ?`;
    await connection.query(query, values);
}

// Find business by subdomain (returns any, regardless of active)

// Find ONLY active business by subdomain (used by tenant middleware)
async function findActiveBusinessBySubdomain(subdomain) {
    const [rows] = await pool.query(
        'SELECT * FROM businesses WHERE subdomain = ? AND is_active = TRUE',
        [subdomain]
    );
    return rows[0];
}

// Activate a business by user ID (set is_active = TRUE)
async function activateBusinessByUserId(userId) {
    const [result] = await pool.query(
        'UPDATE businesses SET is_active = TRUE WHERE user_id = ?',
        [userId]
    );
    return result.affectedRows > 0;
}
async function findBusinessBySubdomain(subdomain) {
    const [rows] = await pool.query('SELECT * FROM businesses WHERE subdomain = ?', [subdomain]);
   
   
   
    return rows[0];
}


async function getBusinessByUserId(userId) {
  const [rows] = await pool.query('SELECT * FROM businesses WHERE user_id = ?', [userId]);
  return rows[0];
}

async function updateStripeAccount(businessId, stripeAccountId, status) {
  await pool.query(
    'UPDATE businesses SET stripe_account_id = ?, stripe_account_status = ? WHERE id = ?',
    [stripeAccountId, status, businessId]
  );
}

module.exports = {
    createBusiness,
    findBusinessBySubdomain,
    findBusinessByUserId,
    updateBusinessOnboarding,
    updateBusinessProfile,
    findActiveBusinessBySubdomain,
    activateBusinessByUserId,
    findBusinessBySubdomain,
    getBusinessByUserId,
    updateStripeAccount
};