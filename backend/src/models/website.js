const pool = require('../config/db');

// Parse JSON fields that are stored as text in MySQL
function normalizeSettings(row) {
  if (!row) return row;

  const jsonFields = ['footer_data', 'nav_links'];
  const result = { ...row };

  for (const field of jsonFields) {
    if (typeof result[field] === 'string') {
      try {
        result[field] = JSON.parse(result[field]);
      } catch {
        result[field] = field === 'nav_links' ? [] : null;
      }
    }
  }
  // ensure defaults
  if (!Array.isArray(result.nav_links)) result.nav_links = [];
  if (result.footer_data !== null && typeof result.footer_data !== 'object') result.footer_data = null;

  return result;
}

async function getSettings(userId) {
  const [rows] = await pool.query(
    'SELECT * FROM website_settings WHERE user_id = ?',
    [userId]
  );

  if (rows.length === 0) {
    // Create default settings row
    await pool.query(
      `INSERT INTO website_settings (user_id, site_name, primary_color, nav_links)
       VALUES (?, ?, ?, ?)`,
      [
        userId,
        'My Artist Site',
        '#5D2FDB',
        JSON.stringify([{ label: 'Home', href: '/', type: 'page' }])
      ]
    );
    const [newRows] = await pool.query(
      'SELECT * FROM website_settings WHERE user_id = ?',
      [userId]
    );
    return normalizeSettings(newRows[0]);
  }

  return normalizeSettings(rows[0]);
}

async function updateSettings(userId, {
  siteName,
  primaryColor,
  logoUrl,
  faviconUrl,
  logoUrlLight,
  logoUrlDark,
  footerData,
  navLinks
}) {
  // Ensure the row exists (no-op if already there)
  await getSettings(userId);

  const fieldMap = {
    siteName: 'site_name',
    primaryColor: 'primary_color',
    logoUrl: 'logo_url',
    faviconUrl: 'favicon_url',
    logoUrlLight: 'logo_url_light',
    logoUrlDark: 'logo_url_dark',
  };

  const setClauses = [];
  const values = [];

  for (const [key, column] of Object.entries(fieldMap)) {
    if (arguments[1][key] !== undefined) {
      setClauses.push(`${column} = ?`);
      values.push(arguments[1][key]);
    }
  }

  // JSON columns
  if (footerData !== undefined) {
    setClauses.push('footer_data = ?');
    values.push(footerData ? JSON.stringify(footerData) : null);
  }
  if (navLinks !== undefined) {
    setClauses.push('nav_links = ?');
    values.push(Array.isArray(navLinks) ? JSON.stringify(navLinks) : null);
  }

  if (setClauses.length === 0) return getSettings(userId);

  values.push(userId);
  await pool.query(
    `UPDATE website_settings SET ${setClauses.join(', ')} WHERE user_id = ?`,
    values
  );

  return getSettings(userId);
}

// ------------------ Pages ------------------
async function getPagesByUser(userId) {
  const [rows] = await pool.query(
    'SELECT * FROM website_pages WHERE user_id = ? ORDER BY menu_order ASC',
    [userId]
  );
  return rows;
}

async function getPageBySlug(userId, slug) {
  const [rows] = await pool.query(
    'SELECT * FROM website_pages WHERE user_id = ? AND slug = ?',
    [userId, slug]
  );
  return rows[0];
}

async function getPageById(pageId) {
  const [rows] = await pool.query(
    'SELECT * FROM website_pages WHERE id = ?',
    [pageId]
  );
  return rows[0];
}

async function createPage(userId, { slug, title, metaDescription, isPublished, showInMenu, menuOrder }) {
  const [result] = await pool.query(
    `INSERT INTO website_pages (user_id, slug, title, meta_description, is_published, show_in_menu, menu_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, slug, title, metaDescription || null, isPublished ? 1 : 0, showInMenu ? 1 : 0, menuOrder || 0]
  );
  return result.insertId;
}

async function updatePage(pageId, updates) {
  const fieldMap = {
    slug: 'slug',
    title: 'title',
    metaDescription: 'meta_description',
    isPublished: 'is_published',
    showInMenu: 'show_in_menu',
    menuOrder: 'menu_order',
  };
  const setClauses = [];
  const values = [];
  for (const [key, column] of Object.entries(fieldMap)) {
    if (updates[key] !== undefined) {
      setClauses.push(`${column} = ?`);
      values.push(updates[key]);
    }
  }
  if (setClauses.length === 0) return;
  values.push(pageId);
  await pool.query(
    `UPDATE website_pages SET ${setClauses.join(', ')} WHERE id = ?`,
    values
  );
}

async function deletePage(pageId) {
  await pool.query('DELETE FROM website_pages WHERE id = ?', [pageId]);
}

// ------------------ Sections ------------------
async function getSectionsByPage(pageId) {
  const [rows] = await pool.query(
    'SELECT * FROM website_sections WHERE page_id = ? ORDER BY order_index ASC',
    [pageId]
  );
  return rows;
}

async function getSectionById(sectionId) {
  const [rows] = await pool.query(
    'SELECT * FROM website_sections WHERE id = ?',
    [sectionId]
  );
  return rows[0];
}

async function createSection(pageId, { type, content, orderIndex, settings }) {
  const [result] = await pool.query(
    `INSERT INTO website_sections (page_id, type, content, order_index, settings)
     VALUES (?, ?, ?, ?, ?)`,
    [pageId, type, typeof content === 'string' ? content : JSON.stringify(content), orderIndex || 0, settings ? JSON.stringify(settings) : null]
  );
  return result.insertId;
}

async function updateSection(sectionId, updates) {
  const setClauses = [];
  const values = [];

  if (updates.type !== undefined) {
    setClauses.push('type = ?');
    values.push(updates.type);
  }
  if (updates.content !== undefined) {
    setClauses.push('content = ?');
    values.push(typeof updates.content === 'string' ? updates.content : JSON.stringify(updates.content));
  }
  if (updates.orderIndex !== undefined) {
    setClauses.push('order_index = ?');
    values.push(updates.orderIndex);
  }
  if (updates.settings !== undefined) {
    setClauses.push('settings = ?');
    values.push(updates.settings ? JSON.stringify(updates.settings) : null);
  }
  // ✅ NEW: handle isPublished
  if (updates.isPublished !== undefined) {
    setClauses.push('is_published = ?');
    values.push(updates.isPublished ? 1 : 0);
  }

  if (setClauses.length === 0) return;
  values.push(sectionId);
  await pool.query(`UPDATE website_sections SET ${setClauses.join(', ')} WHERE id = ?`, values);
}

async function deleteSection(sectionId) {
  await pool.query('DELETE FROM website_sections WHERE id = ?', [sectionId]);
}

// ------------------ Media ------------------
async function getUserMedia(userId) {
  const [rows] = await pool.query(
    'SELECT * FROM website_media WHERE user_id = ? ORDER BY id DESC',
    [userId]
  );
  return rows;
}

async function createMedia(userId, { url, type, altText, fileName, fileSize, mimeType, metadata }) {
  const [result] = await pool.query(
    `INSERT INTO website_media (user_id, url, type, alt_text, file_name, file_size, mime_type, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, url, type, altText || '', fileName || null, fileSize || null, mimeType || null, metadata ? JSON.stringify(metadata) : null]
  );
  return result.insertId;
}

async function deleteMedia(mediaId, userId) {
  const [rows] = await pool.query(
    'SELECT url FROM website_media WHERE id = ? AND user_id = ?',
    [mediaId, userId]
  );
  if (rows.length === 0) return null;
  const url = rows[0].url;
  await pool.query('DELETE FROM website_media WHERE id = ? AND user_id = ?', [mediaId, userId]);
  return url;
}

module.exports = {
  getSettings,
  updateSettings,
  getPagesByUser,
  getPageBySlug,
  getPageById,
  createPage,
  updatePage,
  deletePage,
  getSectionsByPage,
  getSectionById,
  createSection,
  updateSection,
  deleteSection,
  getUserMedia,
  createMedia,
  deleteMedia,
};