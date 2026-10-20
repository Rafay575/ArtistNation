const db = require('../config/db');

/**
 * GET /api/admin/users
 * Returns paginated list of users with business and subscription info.
 * Query params: page (default 1), limit (default 20), search (optional)
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    // Build search condition
    let whereClause = '';
    const searchParams = [];
    if (search) {
      whereClause = `
        WHERE u.full_name LIKE ? 
           OR u.email LIKE ? 
           OR u.phone LIKE ?
           OR b.business_name LIKE ?
      `;
      const like = `%${search}%`;
      searchParams.push(like, like, like, like);
    }

    // Count total
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM users u
      LEFT JOIN businesses b ON u.id = b.user_id
      ${whereClause}
    `;
    const [countResult] = await db.query(countQuery, searchParams);
    const total = countResult.total;

    // Main data query – now with many more columns
    const dataQuery = `
      SELECT 
        u.id AS user_id,
        u.full_name,
        u.email,
        u.phone,
        u.created_at AS user_created_at,
        u.updated_at AS user_updated_at,
        u.is_verified,
        u.is_onboarded,
        u.is_admin,
        u.artist_name,
        u.bio,
        u.city,
        u.state,
        u.country,
        u.primary_genre,
        u.secondary_genres,
        u.profile_picture_url,
        u.stripe_customer_id,
        u.trial_start_date,
        u.trial_end_date,
        u.is_trial_expired,
        u.plan AS user_plan,
        u.billing_cycle AS user_billing_cycle,
        u.billing_address AS user_billing_address,
        u.onboarding_step,
        u.signed_status,
        u.label_name,
        u.management_company,
        u.agency_info,
        u.goals,
        u.socials,
        u.website_url,
        u.years_active,
        u.experience_level,
        b.id AS business_id,
        b.business_name,
        b.subdomain,
        b.is_active AS business_active,
        b.is_onboarded AS business_onboarded,
        b.stripe_account_status,
        b.stripe_account_id,
        b.billing_address AS business_billing_address,
        s.id AS subscription_id,
        s.plan AS subscription_plan,
        s.billing_cycle AS subscription_billing_cycle,
        s.status AS subscription_status,
        s.started_at AS subscription_started_at,
        s.expires_at AS subscription_expires_at,
        s.stripe_subscription_id,
        s.stripe_customer_id AS subscription_stripe_customer_id
      FROM users u
      LEFT JOIN businesses b ON u.id = b.user_id
      LEFT JOIN subscriptions s ON b.id = s.business_id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const dataParams = [...searchParams, limit, offset];
    const [rows] = await db.query(dataQuery, dataParams);

    // Format response
    const users = rows.map(row => ({
      user: {
        id: row.user_id,
        full_name: row.full_name,
        email: row.email,
        phone: row.phone,
        created_at: row.user_created_at,
        updated_at: row.user_updated_at,
        is_verified: row.is_verified === 1,
        is_onboarded: row.is_onboarded === 1,
        is_admin: row.is_admin === 1,
        artist_name: row.artist_name,
        bio: row.bio,
        city: row.city,
        state: row.state,
        country: row.country,
        primary_genre: row.primary_genre,
        secondary_genres: row.secondary_genres,
        profile_picture_url: row.profile_picture_url,
        stripe_customer_id: row.stripe_customer_id,
        trial_start_date: row.trial_start_date,
        trial_end_date: row.trial_end_date,
        is_trial_expired: row.is_trial_expired === 1,
        plan: row.user_plan,
        billing_cycle: row.user_billing_cycle,
        billing_address: row.user_billing_address,
        onboarding_step: row.onboarding_step,
        signed_status: row.signed_status,
        label_name: row.label_name,
        management_company: row.management_company,
        agency_info: row.agency_info,
        goals: row.goals,
        socials: row.socials,
        website_url: row.website_url,
        years_active: row.years_active,
        experience_level: row.experience_level,
      },
      business: row.business_id ? {
        id: row.business_id,
        name: row.business_name,
        subdomain: row.subdomain,
        is_active: row.business_active === 1,
        is_onboarded: row.business_onboarded === 1,
        stripe_account_status: row.stripe_account_status,
        stripe_account_id: row.stripe_account_id,
        billing_address: row.business_billing_address,
      } : null,
      subscription: row.subscription_id ? {
        id: row.subscription_id,
        plan: row.subscription_plan,
        billing_cycle: row.subscription_billing_cycle,
        status: row.subscription_status,
        started_at: row.subscription_started_at,
        expires_at: row.subscription_expires_at,
        stripe_subscription_id: row.stripe_subscription_id,
        stripe_customer_id: row.subscription_stripe_customer_id,
      } : null,
    }));

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};


/**
 * GET /api/admin/users/:id
 * Returns full details of a single user with business and subscription info.
 */
exports.getUserById = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const query = `
      SELECT 
        u.id AS user_id,
        u.full_name,
        u.email,
        u.phone,
        u.created_at AS user_created_at,
        u.updated_at AS user_updated_at,
        u.is_verified,
        u.is_onboarded,
        u.is_admin,
        u.artist_name,
        u.bio,
        u.city,
        u.state,
        u.country,
        u.primary_genre,
        u.secondary_genres,
        u.profile_picture_url,
        u.stripe_customer_id,
        u.trial_start_date,
        u.trial_end_date,
        u.is_trial_expired,
        u.plan AS user_plan,
        u.billing_cycle AS user_billing_cycle,
        u.billing_address AS user_billing_address,
        u.onboarding_step,
        u.signed_status,
        u.label_name,
        u.management_company,
        u.agency_info,
        u.goals,
        u.socials,
        u.website_url,
        u.years_active,
        u.experience_level,
        b.id AS business_id,
        b.business_name,
        b.subdomain,
        b.is_active AS business_active,
        b.is_onboarded AS business_onboarded,
        b.stripe_account_status,
        b.stripe_account_id,
        b.billing_address AS business_billing_address,
        s.id AS subscription_id,
        s.plan AS subscription_plan,
        s.billing_cycle AS subscription_billing_cycle,
        s.status AS subscription_status,
        s.started_at AS subscription_started_at,
        s.expires_at AS subscription_expires_at,
        s.stripe_subscription_id,
        s.stripe_customer_id AS subscription_stripe_customer_id
      FROM users u
      LEFT JOIN businesses b ON u.id = b.user_id
      LEFT JOIN subscriptions s ON b.id = s.business_id
      WHERE u.id = ?
    `;

    const [rows] = await db.query(query, [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const row = rows[0];
    const user = {
      user: {
        id: row.user_id,
        full_name: row.full_name,
        email: row.email,
        phone: row.phone,
        created_at: row.user_created_at,
        updated_at: row.user_updated_at,
        is_verified: row.is_verified === 1,
        is_onboarded: row.is_onboarded === 1,
        is_admin: row.is_admin === 1,
        artist_name: row.artist_name,
        bio: row.bio,
        city: row.city,
        state: row.state,
        country: row.country,
        primary_genre: row.primary_genre,
        secondary_genres: row.secondary_genres,
        profile_picture_url: row.profile_picture_url,
        stripe_customer_id: row.stripe_customer_id,
        trial_start_date: row.trial_start_date,
        trial_end_date: row.trial_end_date,
        is_trial_expired: row.is_trial_expired === 1,
        plan: row.user_plan,
        billing_cycle: row.user_billing_cycle,
        billing_address: row.user_billing_address,
        onboarding_step: row.onboarding_step,
        signed_status: row.signed_status,
        label_name: row.label_name,
        management_company: row.management_company,
        agency_info: row.agency_info,
        goals: row.goals,
        socials: row.socials,
        website_url: row.website_url,
        years_active: row.years_active,
        experience_level: row.experience_level,
      },
      business: row.business_id ? {
        id: row.business_id,
        name: row.business_name,
        subdomain: row.subdomain,
        is_active: row.business_active === 1,
        is_onboarded: row.business_onboarded === 1,
        stripe_account_status: row.stripe_account_status,
        stripe_account_id: row.stripe_account_id,
        billing_address: row.business_billing_address,
      } : null,
      subscription: row.subscription_id ? {
        id: row.subscription_id,
        plan: row.subscription_plan,
        billing_cycle: row.subscription_billing_cycle,
        status: row.subscription_status,
        started_at: row.subscription_started_at,
        expires_at: row.subscription_expires_at,
        stripe_subscription_id: row.stripe_subscription_id,
        stripe_customer_id: row.subscription_stripe_customer_id,
      } : null,
    };

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};