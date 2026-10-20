const pool = require('../config/db');

async function createSubscriber(artistId, email) {
    const [result] = await pool.query(
        'INSERT INTO subscribers (artist_id, email) VALUES (?, ?)',
        [artistId, email]
    );
    return result.insertId;
}

async function findSubscriberByEmail(artistId, email) {
    const [rows] = await pool.query(
        'SELECT * FROM subscribers WHERE artist_id = ? AND email = ?',
        [artistId, email]
    );
    return rows[0] || null;
}

// UPDATED: Now accepts limit and offset, and returns { subscribers, total }
async function getSubscribersByArtist(artistId, limit, offset) {
    // 1. Get paginated subscribers
    const [subscribers] = await pool.query(
        'SELECT id, email, created_at FROM subscribers WHERE artist_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [artistId, limit, offset]
    );

    // 2. Get total count of subscribers for this artist
    const [countResult] = await pool.query(
        'SELECT COUNT(*) as total FROM subscribers WHERE artist_id = ?',
        [artistId]
    );
    
    const total = countResult[0].total;

    // 3. Return the object structure the controller expects
    return {
        subscribers,
        total
    };
}

module.exports = {
    createSubscriber,
    findSubscriberByEmail,
    getSubscribersByArtist,
};