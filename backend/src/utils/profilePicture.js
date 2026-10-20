const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');

function decodeProfilePicture(data) {
  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(data || '');
  if (!match) throw new Error('Invalid profile picture');
  const bytes = Buffer.from(match[2], 'base64');
  const type = match[1];
  const valid = type === 'png' ? bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))
    : type === 'jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  if (!valid || bytes.length > 2 * 1024 * 1024 || bytes.length < 12) throw new Error('Invalid profile picture or picture exceeds 2 MB');
  return { bytes, type };
}

async function saveProfilePicture(userId, data) {
  const { bytes, type } = decodeProfilePicture(data);
  const relative = `uploads/user_${userId}/profile-${randomUUID()}.${type}`;
  const filename = path.join(__dirname, '../..', relative);
  await fs.mkdir(path.dirname(filename), { recursive: true });
  await fs.writeFile(filename, bytes);
  const origin = (process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');
  return { path: filename, url: `${origin}/${relative}` };
}
module.exports = { saveProfilePicture, decodeProfilePicture };
