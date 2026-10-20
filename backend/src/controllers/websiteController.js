const {
  getSettings: getSettingsModel,
  updateSettings: updateSettingsModel,
  getPagesByUser,
  getPageBySlug,
  getPageById,
  createPage: createPageModel,
  updatePage: updatePageModel,
  deletePage: deletePageModel,
  getSectionsByPage,
  getSectionById,
  createSection,
  updateSection: updateSectionModel,
  deleteSection: deleteSectionModel,
  getUserMedia,
  createMedia,
  deleteMedia: deleteMediaModel,
} = require('../models/website');
const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

// ------------------ Settings ------------------
async function getSettingsHandler(req, res, next) {
  try {
    const userId = req.user.id;
    const settings = await getSettingsModel(userId);
    res.json(settings);
  } catch (err) {
    next(err);
  }
}

async function updateSettingsHandler(req, res, next) {
  try {
    const userId = req.user.id;
    const {
      siteName,
      primaryColor,
      logoUrl,
      faviconUrl,
      logoUrlLight,
      logoUrlDark,
      footerData,
      navLinks
    } = req.body;

    const settings = await updateSettingsModel(userId, {
      siteName,
      primaryColor,
      logoUrl,
      faviconUrl,
      logoUrlLight,
      logoUrlDark,
      footerData,
      navLinks
    });

    res.json({ message: 'Settings updated', settings });
  } catch (err) {
    next(err);
  }
}

// ------------------ Pages ------------------
async function getPages(req, res, next) {
  try {
    const userId = req.user.id;
    const pages = await getPagesByUser(userId);
    for (const page of pages) {
      page.sections = await getSectionsByPage(page.id);
    }
    res.json(pages);
  } catch (err) {
    next(err);
  }
}

async function getPage(req, res, next) {
  try {
    const userId = req.user.id;
    const { slug } = req.params;
    const page = await getPageBySlug(userId, slug);
    if (!page) return res.status(404).json({ error: 'Page not found' });
    page.sections = await getSectionsByPage(page.id);
    res.json(page);
  } catch (err) {
    next(err);
  }
}

async function createPage(req, res, next) {
  try {
    const userId = req.user.id;
    const { slug, title, metaDescription, isPublished, showInMenu, menuOrder } = req.body;
    if (!slug || !title) {
      return res.status(400).json({ error: 'Slug and title are required' });
    }
    const pageId = await createPageModel(userId, { slug, title, metaDescription, isPublished, showInMenu, menuOrder });
    res.status(201).json({ id: pageId, message: 'Page created' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Page with this slug already exists' });
    }
    next(err);
  }
}

async function updatePage(req, res, next) {
  try {
    const userId = req.user.id;
    const { pageId } = req.params;
    const page = await getPageById(pageId);
    if (!page || page.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    await updatePageModel(pageId, req.body);
    res.json({ message: 'Page updated' });
  } catch (err) {
    next(err);
  }
}

async function deletePage(req, res, next) {
  try {
    const userId = req.user.id;
    const { pageId } = req.params;
    const page = await getPageById(pageId);
    if (!page || page.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    await deletePageModel(pageId);
    res.json({ message: 'Page deleted' });
  } catch (err) {
    next(err);
  }
}

// ------------------ Sections ------------------
async function addSection(req, res, next) {
  try {
    const userId = req.user.id;
    const { pageId } = req.params;
    const page = await getPageById(pageId);
    if (!page || page.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const { type, content, orderIndex, settings } = req.body;
    if (!type || !content) {
      return res.status(400).json({ error: 'Type and content are required' });
    }
    const sectionId = await createSection(pageId, { type, content, orderIndex, settings });
    res.status(201).json({ id: sectionId, message: 'Section added' });
  } catch (err) {
    next(err);
  }
}

async function updateSection(req, res, next) {
  try {
    const userId = req.user.id;
    const { sectionId } = req.params;
    const section = await getSectionById(sectionId);
    if (!section) return res.status(404).json({ error: 'Section not found' });
    const page = await getPageById(section.page_id);
    if (!page || page.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    await updateSectionModel(sectionId, req.body);
    res.json({ message: 'Section updated' });
  } catch (err) {
    next(err);
  }
}

async function deleteSection(req, res, next) {
  try {
    const userId = req.user.id;
    const { sectionId } = req.params;
    const section = await getSectionById(sectionId);
    if (!section) return res.status(404).json({ error: 'Section not found' });
    const page = await getPageById(section.page_id);
    if (!page || page.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    await deleteSectionModel(sectionId);
    res.json({ message: 'Section deleted' });
  } catch (err) {
    next(err);
  }
}

async function getAllSections(req, res, next) {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      `SELECT s.*, p.title as pageTitle, p.slug as pageSlug
       FROM website_sections s
       JOIN website_pages p ON s.page_id = p.id
       WHERE p.user_id = ?`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function getSection(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const section = await getSectionById(id);
    if (!section) return res.status(404).json({ error: 'Section not found' });
    const page = await getPageById(section.page_id);
    if (!page || page.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    res.json(section);
  } catch (err) {
    next(err);
  }
}

// ------------------ Media ------------------
async function getMedia(req, res, next) {
  try {
    const userId = req.user.id;
    const media = await getUserMedia(userId);
    res.json(media);
  } catch (err) {
    next(err);
  }
}

async function uploadMediaHandler(req, res, next) {
  try {
    const userId = req.user.id;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    const { altText, type } = req.body;
    const mimeType = file.mimetype;
    let mediaType = type;
    if (!mediaType) {
      if (mimeType.startsWith('image/')) mediaType = 'image';
      else if (mimeType.startsWith('video/')) mediaType = 'video';
      else if (mimeType.startsWith('audio/')) mediaType = 'audio';
      else mediaType = 'file';
    }
    const url = `${process.env.BACKEND_URL}/uploads/user_${userId}/${file.filename}`;
    const mediaId = await createMedia(userId, {
      url,
      type: mediaType,
      altText: altText || '',
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      metadata: { originalName: file.originalname }
    });
    res.status(201).json({ id: mediaId, url, message: 'Media uploaded successfully' });
  } catch (err) {
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }
    next(err);
  }
}

async function deleteMedia(req, res, next) {
  try {
    const userId = req.user.id;
    const { mediaId } = req.params;
    const fileUrl = await deleteMediaModel(mediaId, userId);
    if (!fileUrl) {
      return res.status(404).json({ error: 'Media not found' });
    }
    const filePath = path.join(__dirname, '..', fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.json({ message: 'Media deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSettingsHandler,
  updateSettingsHandler,
  getPages,
  getPage,
  createPage,
  updatePage,
  deletePage,
  addSection,
  updateSection,
  deleteSection,
  getMedia,
  uploadMediaHandler,
  deleteMedia,
  getAllSections,
  getSection,
};