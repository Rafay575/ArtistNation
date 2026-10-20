const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Adjust the number of '..' so this points to the SAME root-level
// `uploads` folder that app.js serves via express.static.
// If upload.js is in src/middleware, and app.js is in src/, and
// uploads/ sits next to src/ at the project root, this is right:
const UPLOADS_ROOT = path.join(__dirname, '..', '..', 'uploads');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const userId = req.user.id;
        const userDir = path.join(UPLOADS_ROOT, `user_${userId}`);
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir, { recursive: true });
        }
        cb(null, userDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `file-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({ storage });

module.exports = upload;