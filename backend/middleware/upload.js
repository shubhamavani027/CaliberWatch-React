const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const base = path
      .basename(file.originalname || 'file', ext)
      .replace(/[^a-z0-9_-]+/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60);

    cb(null, `${Date.now()}-${Math.random().toString(16).slice(2)}-${base}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'images') {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image uploads are allowed for images'));
    return cb(null, true);
  }

  if (file.fieldname === 'video') {
    if (!file.mimetype.startsWith('video/')) return cb(new Error('Only video uploads are allowed for video'));
    return cb(null, true);
  }

  return cb(new Error('Unexpected file field'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    files: 11,
    fileSize: 50 * 1024 * 1024,
  },
});

const watchMediaUpload = upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'video', maxCount: 1 },
]);

module.exports = { watchMediaUpload, uploadsDir };
