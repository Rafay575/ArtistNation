const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authenticateUser = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');

// ============================================================
// PUBLIC: Submit contact form (admin site)
// POST /api/public/site-contact
// ============================================================

router.post('/site-contact', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        error: 'Please provide name, email, and message.'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO site_contact_submissions 
       (name, email, phone, subject, message, status) 
       VALUES (?, ?, ?, ?, ?, 'new')`,
      [name, email, phone || null, subject || null, message]
    );

    res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully! We\'ll get back to you soon.',
      id: result.insertId
    });

  } catch (error) {
    console.error('Site contact submission error:', error);
    res.status(500).json({
      error: 'Failed to send message. Please try again later.'
    });
  }
});

// ============================================================
// ADMIN: Get all site contact submissions
// GET /api/admin/site-contact
// ============================================================

router.get('/admin/site-contact', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const [submissions] = await pool.query(
      `SELECT 
         id,
         name,
         email,
         phone,
         subject,
         message,
         status,
         created_at,
         updated_at
       FROM site_contact_submissions
       ORDER BY 
         CASE status 
           WHEN 'new' THEN 1 
           WHEN 'read' THEN 2 
           WHEN 'responded' THEN 3 
         END,
         created_at DESC`
    );

    res.json({
      success: true,
      data: submissions
    });

  } catch (error) {
    console.error('Admin site contact error:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// ============================================================
// ADMIN: Update submission status
// PUT /api/admin/site-contact/:id/status
// ============================================================

router.put('/admin/site-contact/:id/status', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['new', 'read', 'responded'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const [result] = await pool.query(
      'UPDATE site_contact_submissions SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json({
      success: true,
      message: 'Status updated successfully'
    });

  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// ============================================================
// ADMIN: Delete submission
// DELETE /api/admin/site-contact/:id
// ============================================================

router.delete('/admin/site-contact/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      'DELETE FROM site_contact_submissions WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json({
      success: true,
      message: 'Submission deleted successfully'
    });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete submission' });
  }
});
// ============================================================
// PUBLIC: Subscribe to newsletter
// POST /api/public/subscribe
// ============================================================

router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }

    // Check existing
    const [existing] = await pool.query(
      'SELECT id, status FROM site_subscribers WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      if (existing[0].status === 'unsubscribed') {
        await pool.query(
          'UPDATE site_subscribers SET status = "active", updated_at = NOW() WHERE id = ?',
          [existing[0].id]
        );
        return res.json({ success: true, message: 'You have been resubscribed!' });
      }
      return res.status(400).json({ error: 'This email is already subscribed.' });
    }

    await pool.query(
      'INSERT INTO site_subscribers (email) VALUES (?)',
      [email]
    );

    res.status(201).json({
      success: true,
      message: 'Subscription successful!'
    });

  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Failed to subscribe. Please try again.' });
  }
});

// ============================================================
// ADMIN: Get all subscribers
// GET /api/admin/subscribers
// ============================================================

router.get('/admin/subscribers', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const [subscribers] = await pool.query(
      `SELECT 
         id, email, status, created_at, updated_at
       FROM site_subscribers
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      data: subscribers
    });

  } catch (error) {
    console.error('Admin subscribers error:', error);
    res.status(500).json({ error: 'Failed to fetch subscribers.' });
  }
});

// ============================================================
// ADMIN: Delete subscriber
// DELETE /api/admin/subscribers/:id
// ============================================================

router.delete('/admin/subscribers/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM site_subscribers WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Subscriber not found.' });
    }

    res.json({ success: true, message: 'Subscriber deleted successfully.' });

  } catch (error) {
    console.error('Delete subscriber error:', error);
    res.status(500).json({ error: 'Failed to delete subscriber.' });
  }
});
module.exports = router;