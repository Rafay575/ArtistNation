// controllers/mainWebsiteController.js
const pool = require('../config/db');

const SECTION_COLUMNS = {
  navbar: 'navbar',
  heroSlides: 'hero_slides',
  heroVideo: 'hero_video',   // ✅ NEW
  about: 'about',
  features: 'features',
  services: 'services',
  merchandise: 'merchandise',
  events: 'events',
  pricing: 'pricing',
  contact: 'contact',
  footer: 'footer',
};

const HIDEABLE_SECTIONS = [
  'heroSlides',
  'about',
  'features',
  'services',
  'merchandise',
  'events',
  'pricing',
  'contact',
];

function safeParse(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function rowToConfig(row, { forAdmin = false } = {}) {
  if (!row) return null;

  const visibility = safeParse(row.visibility, {});
  const isVisible = (section) => visibility[section] !== false;

  const raw = {
    navbar: safeParse(row.navbar, {}),
    heroSlides: safeParse(row.hero_slides, []),
    heroVideo: safeParse(row.hero_video, {   // ✅ NEW
      type: 'youtube',
      url: '',
      file: '',
    }),
    about: safeParse(row.about, {}),
    features: safeParse(row.features, {}),
    services: safeParse(row.services, {}),
    merchandise: safeParse(row.merchandise, {}),
    events: safeParse(row.events, {}),
    pricing: safeParse(row.pricing, {}),
    contact: safeParse(row.contact, {}),
    footer: safeParse(row.footer, {}),
  };

  if (forAdmin) {
    return { ...raw, visibility, updatedAt: row.updated_at };
  }

  const filtered = { ...raw };
  for (const section of HIDEABLE_SECTIONS) {
    if (!isVisible(section)) filtered[section] = null;
  }
  return { ...filtered, updatedAt: row.updated_at };
}

async function getRow() {
  const [rows] = await pool.execute('SELECT * FROM website_config WHERE id = 1 LIMIT 1');
  return rows[0];
}

async function getPublic(req, res, next) {
  try {
    const row = await getRow();
    if (!row) {
      return res.status(404).json({ error: 'Website config not found. Run the seed script.' });
    }
    res.json(rowToConfig(row, { forAdmin: false }));
  } catch (err) {
    next(err);
  }
}

async function getAdmin(req, res, next) {
  try {
    const row = await getRow();
    if (!row) {
      return res.status(404).json({ error: 'Website config not found. Run the seed script.' });
    }
    res.json(rowToConfig(row, { forAdmin: true }));
  } catch (err) {
    next(err);
  }
}

async function updateSection(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const { section } = req.params;
    const newValue = req.body;
    const column = SECTION_COLUMNS[section];

    if (!column) {
      return res.status(400).json({ error: `Unknown section "${section}"` });
    }
    if (!newValue || typeof newValue !== 'object') {
      return res.status(400).json({ error: 'Request body must be a JSON object' });
    }

    const [existing] = await conn.execute(
      `SELECT ${column} AS current_value FROM website_config WHERE id = 1`
    );
    if (!existing.length) {
      return res.status(404).json({ error: 'Website config not found. Run the seed script.' });
    }

    await conn.beginTransaction();

    await conn.execute(
      `INSERT INTO website_config_revisions (section, payload, edited_by) VALUES (?, ?, ?)`,
      [section, JSON.stringify(existing[0].current_value), req.user.id]
    );
    await conn.execute(`UPDATE website_config SET ${column} = ? WHERE id = 1`, [
      JSON.stringify(newValue),
    ]);

    await conn.commit();

    const row = await getRow();
    res.json(rowToConfig(row, { forAdmin: true }));
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

async function replaceAll(req, res, next) {
  try {
    const cols = Object.keys(SECTION_COLUMNS);
    const setClause = cols.map((k) => `${SECTION_COLUMNS[k]} = ?`).join(', ');
    const values = cols.map((key) => JSON.stringify(req.body[key] ?? null));

    await pool.execute(`UPDATE website_config SET ${setClause} WHERE id = 1`, values);

    const row = await getRow();
    res.json(rowToConfig(row, { forAdmin: true }));
  } catch (err) {
    next(err);
  }
}

async function updateVisibility(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const { section } = req.params;
    const { visible } = req.body;

    if (section === 'navbar' || section === 'footer') {
      return res.status(400).json({ error: 'navbar and footer cannot be hidden' });
    }
    if (!HIDEABLE_SECTIONS.includes(section)) {
      return res.status(400).json({ error: `Unknown section "${section}"` });
    }
    if (typeof visible !== 'boolean') {
      return res.status(400).json({ error: '"visible" must be true or false' });
    }

    const [existing] = await conn.execute(
      'SELECT visibility FROM website_config WHERE id = 1'
    );
    if (!existing.length) {
      return res.status(404).json({ error: 'Website config not found. Run the seed script.' });
    }

    const currentVisibility = existing[0].visibility || {};

    await conn.beginTransaction();

    await conn.execute(
      `INSERT INTO website_config_revisions (section, payload, edited_by) VALUES (?, ?, ?)`,
      ['VISIBILITY', JSON.stringify(currentVisibility), req.user.id]
    );

    const updatedVisibility = { ...currentVisibility, [section]: visible };

    await conn.execute('UPDATE website_config SET visibility = ? WHERE id = 1', [
      JSON.stringify(updatedVisibility),
    ]);

    await conn.commit();

    const row = await getRow();
    res.json(rowToConfig(row, { forAdmin: true }));
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

async function uploadImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const publicPath = `/uploads/user_${req.user.id}/${req.file.filename}`;
    res.status(201).json({ url: publicPath });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPublic,
  getAdmin,
  updateSection,
  replaceAll,
  updateVisibility,
  uploadImage,
};