const jwt = require('jsonwebtoken');
const ALLOWED_ADMIN_EMAILS = ['tirthkumbhani11@gmail.com', 'dhruvilkyada483@gmail.com'];
const isAllowedAdminEmail = (email) => ALLOWED_ADMIN_EMAILS.includes(String(email || '').toLowerCase());

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Admin token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, admin) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired admin token' });
    }
    if (admin.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    if (!isAllowedAdminEmail(admin.email)) {
      return res.status(403).json({ message: 'This email is not allowed to access the admin panel' });
    }
    req.admin = admin;
    next();
  });
};

module.exports = { authenticateToken, authenticateAdmin };
