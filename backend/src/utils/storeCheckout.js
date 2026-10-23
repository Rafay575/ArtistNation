const pool = require('../config/db');
function priceCart(sections, requested) {
 const catalog = new Map();
 for (const section of sections) {
  const content = typeof section.content === 'string' ? JSON.parse(section.content) : section.content;
  (content.products || []).forEach((product, index) => catalog.set(`${section.id}:${index}`, product));
 }
 const seen = new Set();
 return requested.map(item => {
  const product = catalog.get(item.id);
  if (!product || seen.has(item.id) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) throw new Error('Cart contains an unavailable product or invalid quantity. Please refresh your cart.');
  if (item.title !== (product.name || product.title) || (item.image || '') !== (product.image || '/placeholder.png')) throw new Error('Product changed. Remove it and add it again from the store.');
  seen.add(item.id);
  const cents = Math.round(Number(product.price) * 100);
  if (!Number.isSafeInteger(cents) || cents < 50 || cents > 99999999) throw new Error('Product price is unavailable');
  return { id: item.id, title: String(product.name || product.title).slice(0, 200), price: cents / 100, quantity: item.quantity };
 });
}
async function fulfill(session, accountId) {
 if (session.payment_status !== 'paid' || session.status !== 'complete') return null;
 const connection = await pool.getConnection();
 try {
  await connection.beginTransaction();
  const [rows] = await connection.query('SELECT * FROM store_checkouts WHERE id = ? AND stripe_account_id = ? FOR UPDATE', [session.client_reference_id, accountId]);
  const checkout = rows[0];
  if (!checkout || checkout.amount !== session.amount_total || session.currency !== 'usd' || (checkout.session_id && checkout.session_id !== session.id)) throw new Error('Checkout verification failed');
  if (checkout.order_id) { await connection.commit(); return checkout.order_id; }
  const data = typeof checkout.payload === 'string' ? JSON.parse(checkout.payload) : checkout.payload;
  const [order] = await connection.query(`INSERT INTO orders
   (fan_id, artist_id, business_id, items, total, status, pickup_location, first_name, last_name, email, phone, street_address, city, postal_code, payment_intent_id)
   VALUES (?, ?, ?, ?, ?, 'processing', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
   [checkout.fan_id, checkout.artist_id, checkout.business_id, JSON.stringify(data.items), checkout.amount / 100,
    data.pickupLocation, data.firstName, data.lastName, data.email, data.phone, data.street, data.city, data.postalCode,
    typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id]);
  await connection.query('UPDATE store_checkouts SET order_id = ?, session_id = ? WHERE id = ?', [order.insertId, session.id, checkout.id]);
  await connection.commit(); return order.insertId;
 } catch (error) { await connection.rollback(); throw error; }
 finally { connection.release(); }
}
module.exports = { priceCart, fulfill };
