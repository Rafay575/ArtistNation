const { randomInt } = require('crypto');
const { resetGrantHash, newResetNonce } = require('../utils/fanTokens');
const pool = require("../config/db");
const bcrypt = require("bcrypt");

// Create user – store hashed password & hashed OTP
async function createUser(
  connection, // <-- added
  {
    fullName,
    email,
    phone,
    password,
    stripeCustomerId,
    stripePaymentIntentId,
    plan,
    billingCycle,
    billingAddress,
  }
) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const otp = randomInt(100000, 1000000).toString();
  const hashedOtp = await bcrypt.hash(otp, 10);
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const [result] = await connection.execute(
    `INSERT INTO users 
       (full_name, email, phone, password_hash, otp_hash, otp_expires_at, 
        stripe_customer_id, stripe_payment_intent_id, plan, billing_cycle, billing_address,
        is_verified, is_onboarded) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, false, false)`,
    [
      fullName,
      email,
      phone,
      hashedPassword,
      hashedOtp,
      otpExpiresAt,
      stripeCustomerId,
      stripePaymentIntentId,
      plan,
      billingCycle,
      billingAddress,
    ]
  );
  return { userId: result.insertId, otp };
}

async function findUserByEmail(email) {
  const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
    email,
  ]);
  return rows[0];
}

async function findUserByPhone(phone) {
  const [rows] = await pool.query("SELECT * FROM users WHERE phone = ?", [
    phone,
  ]);
  return rows[0];
}

async function findUserById(userId) {
  const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [userId]);
  return rows[0];
}

// Verify OTP – compare plain OTP with stored hash
async function verifyOTP(userId, plainOtp) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query('SELECT * FROM users WHERE id = ? AND otp_expires_at > NOW() FOR UPDATE', [userId]);
    const user = rows[0];
    if (!user?.otp_hash || !(await bcrypt.compare(plainOtp, user.otp_hash))) {
      await connection.rollback();
      return false;
    }
    const [businesses] = await connection.query('SELECT id FROM businesses WHERE user_id = ? FOR UPDATE', [userId]);
    if (!businesses.length) throw new Error('Business not found');
    await initializeWebsite(userId, connection);
    // Keep the app trial aligned with the subscription created at signup.
    const [subscriptions] = await connection.query('SELECT started_at, expires_at FROM subscriptions WHERE business_id = ? ORDER BY id DESC LIMIT 1', [businesses[0].id]);
    if (!subscriptions.length) throw new Error('Subscription not found');
    await connection.query('UPDATE users SET is_verified = true, otp_hash = NULL, otp_expires_at = NULL, trial_start_date = ?, trial_end_date = ? WHERE id = ?', [subscriptions[0].started_at, subscriptions[0].expires_at, userId]);
    await connection.query('UPDATE businesses SET is_active = true WHERE user_id = ?', [userId]);
    await connection.commit();
    return true;
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}

// Resend OTP – generate new plain OTP, store hash, return plain OTP
async function updateOTP(userId) {
  const newOTP = randomInt(100000, 1000000).toString();
  const hashedOtp = await bcrypt.hash(newOTP, 10);
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await pool.query(
    "UPDATE users SET otp_hash = ?, otp_expires_at = ? WHERE id = ?",
    [hashedOtp, otpExpiresAt, userId],
  );
  return newOTP; // plain OTP to send via email
}

// Set trial dates (after OTP verification)
async function setTrialDates(userId, trialStart, trialEnd) {
  await pool.query(
    "UPDATE users SET trial_start_date = ?, trial_end_date = ? WHERE id = ?",
    [trialStart, trialEnd, userId],
  );
}

// Mark user as onboarded (for later)
async function setOnboarded(userId, status) {
  await pool.query("UPDATE users SET is_onboarded = ? WHERE id = ?", [
    status,
    userId,
  ]);
}

// Fetch onboarding draft for a user
async function getOnboardingDraft(userId) {
  const [rows] = await pool.query(
    "SELECT onboarding_data, onboarding_step FROM users WHERE id = ?",
    [userId],
  );
  return rows[0];
}

// Save onboarding draft
async function saveOnboardingDraft(userId, step, data) {
  await pool.query(
    "UPDATE users SET onboarding_step = ?, onboarding_data = ? WHERE id = ? AND is_verified = true AND is_onboarded = false",
    [step, JSON.stringify(data), userId],
  );
}

// Clear draft (after completion)
async function clearOnboardingDraft(userId) {
  await pool.query(
    "UPDATE users SET onboarding_step = 0, onboarding_data = NULL WHERE id = ?",
    [userId],
  );
}

// Finalize onboarding – save all profile fields and mark onboarded
async function completeOnboarding(userId, profileData) {
  const {
    artistName,
    bio,
    city,
    state,
    country,
    websiteUrl,
    primaryGenre,
    secondaryGenres,
    artistType,
    yearsActive,
    experienceLevel,
    signedStatus,
    labelName,
    managementCompany,
    agencyInfo,
    socials,
    goals,
    profilePictureUrl,
  } = profileData;

  const connection = await pool.getConnection();
  let picturePath;
  try {
    await connection.beginTransaction();
    const [users] = await connection.query('SELECT is_verified, is_onboarded FROM users WHERE id = ? FOR UPDATE', [userId]);
    if (!users[0]?.is_verified || users[0].is_onboarded) throw new Error('Onboarding is unavailable');
    const picture = profileData.profilePicture
      ? await require('../utils/profilePicture').saveProfilePicture(userId, profileData.profilePicture)
      : null;
    picturePath = picture?.path;
    await connection.query(
    `UPDATE users SET 
            artist_name = ?,
            bio = ?,
            city = ?,
            state = ?,
            country = ?,
            website_url = ?,
            primary_genre = ?,
            secondary_genres = ?,
            artist_type = ?,
            years_active = ?,
            experience_level = ?,
            signed_status = ?,
            label_name = ?,
            management_company = ?,
            agency_info = ?,
            socials = ?,
            goals = ?,
            profile_picture_url = ?,
            is_onboarded = true,
            onboarding_step = 0,
            onboarding_data = NULL
        WHERE id = ?`,
    [
      artistName,
      bio,
      city,
      state,
      country,
      websiteUrl,
      primaryGenre,
      JSON.stringify(secondaryGenres),
      artistType,
      yearsActive,
      experienceLevel,
      signedStatus,
      labelName,
      managementCompany,
      agencyInfo,
      JSON.stringify(socials),
      JSON.stringify(goals),
      picture?.url || null,
      userId,
    ],
  );
    await connection.query('UPDATE businesses SET is_onboarded = true WHERE user_id = ?', [userId]);
    // Profile photos belong to the user profile; preserve the site's own artwork.
    await connection.query('UPDATE website_settings SET site_name = ? WHERE user_id = ?', [artistName, userId]);
    const [sections] = await connection.query("SELECT s.id, s.type, s.content FROM website_sections s JOIN website_pages p ON p.id = s.page_id WHERE p.user_id = ? AND p.slug = 'home' AND s.type IN ('hero', 'about')", [userId]);
    for (const section of sections) {
      const content = typeof section.content === 'string' ? JSON.parse(section.content) : section.content;
      if (section.type === 'hero') {
        content.heading = artistName; content.subheading = bio;
      } else {
        content.title = 'About ' + artistName; content.paragraphs = [bio];
      }
      await connection.query('UPDATE website_sections SET content = ? WHERE id = ?', [JSON.stringify(content), section.id]);
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    if (picturePath) await require('fs/promises').unlink(picturePath).catch(() => {});
    throw error;
  } finally { connection.release(); }

}
// models/user.js – add these functions

// Find user by email (already exists, but we'll use it)
// async function findUserByEmail(email) { ... }

// Generate reset OTP and store hash
async function setResetOTP(userId) {
  const otp = randomInt(100000, 1000000).toString();
  const hashed = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min
  await pool.query(
    "UPDATE users SET reset_otp_hash = ?, reset_otp_expires_at = ? WHERE id = ?",
    [hashed, expiresAt, userId],
  );
  return otp; // plain OTP to send via email
}

// Verify reset OTP
async function verifyResetOTP(userId, plainOtp) {
  const [rows] = await pool.query('SELECT reset_otp_hash FROM users WHERE id = ? AND reset_otp_expires_at > NOW()', [userId]);
  const hash = rows[0]?.reset_otp_hash;
  if (!hash?.startsWith('$2') || !(await bcrypt.compare(plainOtp, hash))) return null;
  const nonce = newResetNonce();
  const [result] = await pool.query('UPDATE users SET reset_otp_hash = ?, reset_otp_expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE id = ? AND reset_otp_hash = ? AND reset_otp_expires_at > NOW()', [resetGrantHash(nonce), userId, hash]);
  return result.affectedRows === 1 ? nonce : null;
}

async function consumePasswordReset(userId, nonce, password) {
  const hash = await bcrypt.hash(password, 10);
  const [result] = await pool.query('UPDATE users SET password_hash = ?, reset_otp_hash = NULL, reset_otp_expires_at = NULL WHERE id = ? AND reset_otp_hash = ? AND reset_otp_expires_at > NOW()', [hash, userId, resetGrantHash(nonce)]);
  return result.affectedRows === 1;
}

// Update password
async function updatePassword(userId, newPassword) {
  const hashed = await bcrypt.hash(newPassword, 10);
  await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [
    hashed,
    userId,
  ]);
}

// models/user.js – add this function

// Update user profile fields (excluding sensitive ones like password_hash, stripe_*)
async function updateUserProfile(userId, data, connection = pool) {
  const {
    fullName,
    phone,
    billingAddress,
    plan,
    billingCycle,
    artistName,
    bio,
    city,
    state,
    country,
    websiteUrl,
    primaryGenre,
    secondaryGenres,
    artistType,
    yearsActive,
    experienceLevel,
    signedStatus,
    labelName,
    managementCompany,
    agencyInfo,
    socials,
    goals,
    profilePictureUrl,
  } = data;

  const fields = [];
  const values = [];

  if (fullName !== undefined) {
    fields.push("full_name = ?");
    values.push(fullName);
  }
  if (phone !== undefined) {
    fields.push("phone = ?");
    values.push(phone);
  }
  if (billingAddress !== undefined) {
    fields.push("billing_address = ?");
    values.push(billingAddress);
  }
  if (plan !== undefined) {
    fields.push("plan = ?");
    values.push(plan);
  }
  if (billingCycle !== undefined) {
    fields.push("billing_cycle = ?");
    values.push(billingCycle);
  }
  if (artistName !== undefined) {
    fields.push("artist_name = ?");
    values.push(artistName);
  }
  if (bio !== undefined) {
    fields.push("bio = ?");
    values.push(bio);
  }
  if (city !== undefined) {
    fields.push("city = ?");
    values.push(city);
  }
  if (state !== undefined) {
    fields.push("state = ?");
    values.push(state);
  }
  if (country !== undefined) {
    fields.push("country = ?");
    values.push(country);
  }
  if (websiteUrl !== undefined) {
    fields.push("website_url = ?");
    values.push(websiteUrl);
  }
  if (primaryGenre !== undefined) {
    fields.push("primary_genre = ?");
    values.push(primaryGenre);
  }
  if (secondaryGenres !== undefined) {
    fields.push("secondary_genres = ?");
    values.push(JSON.stringify(secondaryGenres));
  }
  if (artistType !== undefined) {
    fields.push("artist_type = ?");
    values.push(artistType);
  }
  if (yearsActive !== undefined) {
    fields.push("years_active = ?");
    values.push(yearsActive);
  }
  if (experienceLevel !== undefined) {
    fields.push("experience_level = ?");
    values.push(experienceLevel);
  }
  if (signedStatus !== undefined) {
    fields.push("signed_status = ?");
    values.push(signedStatus);
  }
  if (labelName !== undefined) {
    fields.push("label_name = ?");
    values.push(labelName);
  }
  if (managementCompany !== undefined) {
    fields.push("management_company = ?");
    values.push(managementCompany);
  }
  if (agencyInfo !== undefined) {
    fields.push("agency_info = ?");
    values.push(agencyInfo);
  }
  if (socials !== undefined) {
    fields.push("socials = ?");
    values.push(JSON.stringify(socials));
  }
  if (goals !== undefined) {
    fields.push("goals = ?");
    values.push(JSON.stringify(goals));
  }
  if (profilePictureUrl !== undefined) {
    fields.push("profile_picture_url = ?");
    values.push(profilePictureUrl);
  }

  // If no fields to update, return early
  if (fields.length === 0) {
    return { success: true, message: 'No fields to update' };
  }

  values.push(userId);
  const query = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;

  try {
    await connection.query(query, values);
    return { success: true };
  } catch (error) {
    // Throw error so controller catches it
    throw error;
  }
}
async function initializeWebsite(userId, connection = pool) {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";

  // ---------- 1. Create the home page (if not already present) ----------
  let homePageId;
  const [existing] = await connection.query(
    'SELECT id FROM website_pages WHERE user_id = ? AND slug = ?',
    [userId, 'home']
  );
  if (existing.length === 0) {
    const [insertResult] = await connection.query(
      `INSERT INTO website_pages (user_id, slug, title, is_published, show_in_menu, menu_order)
       VALUES (?, ?, ?, 1, 1, 0)`,
      [userId, 'home', 'Home']
    );
    homePageId = insertResult.insertId;
  } else {
    return;
  }

  // ---------- 2. Default images ----------
  const defaultHeroImage = `${backendUrl}/uploads/default-hero.png`;
  const defaultAboutImage1 = `${backendUrl}/uploads/default-about1.png`;
  const defaultAboutImage2 = `${backendUrl}/uploads/default-about2.png`;
  const defaultAboutImage3 = `${backendUrl}/uploads/default-about3.png`;
  const defaultAboutImage4 = `${backendUrl}/uploads/default-about4.png`;

  // ---------- 3. Insert all default sections ----------
  // Hero
  await connection.query(
    `INSERT INTO website_sections (page_id, type, order_index, content)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE content = VALUES(content)`,
    [
      homePageId, "hero", 0,
      JSON.stringify({
        heading: "Listen new album & song of Imagine Dragons",
        subheading: "Listen over 80 milions songs, exclusive releases and music videos.",
        image: defaultHeroImage,
        ctaText: "Listen new album",
        ctaLink: "#music",
         overlayOpacity: 40, 
      }),
    ]
  );

  // About
  await connection.query(
    `INSERT INTO website_sections (page_id, type, order_index, content)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE content = VALUES(content)`,
    [
      homePageId, "about", 1,
      JSON.stringify({
        title: "About us",
        paragraphs: [
          "Come experience a unique and edgy barbershop for all your hair and beard needs. ravida haretra nuam enim mi obortis eset uctus enec accumsan eu justo alisuame amet auctor orci donec vitae vehicula risus.",
          "In December 2016, a documentary about Lipa was commissioned by TheFader magazine, titled See in Blue.",
        ],
        images: [defaultAboutImage1, defaultAboutImage2, defaultAboutImage3, defaultAboutImage4],
        buttonText: "Read More",
        buttonLink: "#",
      }),
    ]
  );

  // Music
  await connection.query(
    `INSERT INTO website_sections (page_id, type, order_index, content)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE content = VALUES(content)`,
    [
      homePageId, "music", 2,
      JSON.stringify({
        heading: "Music",
        description:
          "Music is the way to express your emotions and the thing you enjoyed most in life – it's one of the most important parts of our lives.",
        tracks: [
          {
            trackTitle: "Midnight Travel",
            artistName: "Artistocrat with Guitar",
            coverImage: `${backendUrl}/uploads/default-about2.png`,
            audioUrl: `${backendUrl}/uploads/default-music.mp3`,
          },
          {
            trackTitle: "Sunset Boulevard",
            artistName: "The Dreamers",
            coverImage: `${backendUrl}/uploads/default-about3.png`,
            audioUrl: `${backendUrl}/uploads/default-music.mp3`,
          },
          {
            trackTitle: "Neon Lights",
            artistName: "Electro Vibes",
            coverImage: `${backendUrl}/uploads/default-about4.png`,
            audioUrl: `${backendUrl}/uploads/default-music.mp3`,
          },
        ],
      }),
    ]
  );

  // Events
  await connection.query(
    `INSERT INTO website_sections (page_id, type, order_index, content)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE content = VALUES(content)`,
    [
      homePageId, "events", 3,
      JSON.stringify({
        heading: "Upcoming events",
        description: "Track to get concert, live stream and tour updates.",
        image: `${backendUrl}/uploads/up-img.png`,
        events: [
          { title: "One MusicFest", location: "Atlanta, GA, USA", date: "SAT, OCT 29" },
          { title: "Austin City Limits", location: "Austin, TX, USA", date: "SAT, NOV 26" },
          { title: "Lost Lands", location: "Thomville, OH, USA", date: "FRI, SEP 30" },
          { title: "Monterey Jazz Festival", location: "Monterey, CA, USA", date: "FRI, OCT 14" },
        ],
      }),
    ]
  );

  // Gallery
  await connection.query(
    `INSERT INTO website_sections (page_id, type, order_index, content)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE content = VALUES(content)`,
    [
      homePageId, "gallery", 4,
      JSON.stringify({
        heading: "Gallery",
        description: "Music is the way to express your emotions and the thing you enjoyed most in life – it's one of the most important parts of our lives.",
        images: [
          `${backendUrl}/uploads/car1.png`,
          `${backendUrl}/uploads/car2.png`,
          `${backendUrl}/uploads/car3.png`,
          `${backendUrl}/uploads/car4.png`,
        ],
      }),
    ]
  );

  // News
  await connection.query(
    `INSERT INTO website_sections (page_id, type, order_index, content)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE content = VALUES(content)`,
    [
      homePageId, "news", 5,
      JSON.stringify({
        heading: "Latest News",
        readMoreLink: "/news",
        newsItems: [
          { title: "How A Musical Revolution Changed The World", description: "The world of music is a vast...", image: `${backendUrl}/uploads/n1.png`, link: "/news/1" },
          { title: "The Greatest Live Performance Of All Time", description: "The world of music is a vast...", image: `${backendUrl}/uploads/n2.png`, link: "/news/2" },
          { title: "Culturally Influential Music Bands", description: "The world of music is a vast...", image: `${backendUrl}/uploads/n3.png`, link: "/news/3" },
         
        ],
      }),
    ]
  );

  // Store
  await connection.query(
    `INSERT INTO website_sections (page_id, type, order_index, content)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE content = VALUES(content)`,
    [
      homePageId, "store", 6,
      JSON.stringify({
        heading: "Store",
        description: "Music is the way to express your emotions and the thing you enjoyed most in life – it's one of the most important parts of our lives.",
        products: [
          { title: "Music Item Name", price: 29, stars: 5, image: `${backendUrl}/uploads/n1.png` },
          { title: "Music Item Name", price: 29, stars: 5, image: `${backendUrl}/uploads/n2.png` },
          { title: "Music Item Name", price: 29, stars: 5, image: `${backendUrl}/uploads/n3.png` },
       
        ],
      }),
    ]
  );

  // Contact
  await connection.query(
    `INSERT INTO website_sections (page_id, type, order_index, content, is_published)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE content = VALUES(content)`,
    [
      homePageId, "contact", 7,
      JSON.stringify({
        subtitle: "Get in Touch",
        title: "Let's Connect",
        description: "We'd love to hear from you! Drop us a message and we'll get back to you as soon as possible.",
        image: `${backendUrl}/uploads/default-contact.png`,
        buttonText: "Send Message",
      }),
      1,
    ]
  );


await connection.query(
  `INSERT INTO website_settings (user_id, site_name, primary_color, logo_url, logo_url_light, logo_url_dark, footer_data, nav_links)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)
   ON DUPLICATE KEY UPDATE
     site_name = VALUES(site_name),
     primary_color = VALUES(primary_color),
     logo_url = VALUES(logo_url),
     logo_url_light = VALUES(logo_url_light),
     logo_url_dark = VALUES(logo_url_dark),
     footer_data = VALUES(footer_data),
     nav_links = VALUES(nav_links)`,
  [
    userId,
    'My Artist Site',
    '#5D2FDB',
    `${backendUrl}/uploads/logo.png`,
    `${backendUrl}/uploads/logo.png`,
    `${backendUrl}/uploads/logo.png`,
    JSON.stringify({
      contact:
        '0665 Broadway NY, New York 10001 United States of America<br><b>855 100 4444</b><br>info@barber.com',
      socials: [
        { platform: 'facebook', url: 'https://facebook.com/artist' },
        { platform: 'instagram', url: 'https://instagram.com/artist' },
        { platform: 'x', url: 'https://x.com/artist' },
      ],
      subscribeText: 'Subscribe & follow',
      subscribeEnabled: true,
    }),
    JSON.stringify([
      { label: 'Home', href: '#home', type: 'anchor' },
      { label: 'About', href: '#about', type: 'anchor' },
      { label: 'Catalog', href: '#catalog', type: 'anchor' },
      { label: 'Events', href: '#events', type: 'anchor' },
      { label: 'Gallery', href: '#gallery', type: 'anchor' },
      { label: 'Store', href: '#store', type: 'anchor' },
    ]),
  ]
);
}


module.exports = {
  consumePasswordReset,
  createUser,
  findUserByEmail,
  findUserByPhone,
  findUserById,
  verifyOTP,
  updateOTP,
  setTrialDates,
  setOnboarded,
  getOnboardingDraft,
  saveOnboardingDraft,
  clearOnboardingDraft,
  completeOnboarding,
  setResetOTP,
  verifyResetOTP,
  updatePassword,
  updateUserProfile,
  initializeWebsite,
};
