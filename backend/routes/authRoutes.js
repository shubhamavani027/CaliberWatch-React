const express = require('express');
const passport = require('passport');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, authenticateAdmin } = require('../middleware/auth');

const googleOauthEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

// Public routes
router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.post('/otp/send', authController.sendOtp);
router.post('/otp/verify', authController.verifyOtp);

if (googleOauthEnabled) {
  router.get(
    '/google',
    (req, res, next) => {
      passport.authenticate('google', {
        scope: ['profile', 'email'],
        prompt: 'select_account',
        session: false,
      })(req, res, next);
    }
  );

  router.get('/google/callback', (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user) => {
      const clientUrl = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
      if (err || !user) {
        return res.redirect(`${clientUrl}/login?error=Google authentication failed`);
      }

      const token = authController.issueJwt(user);
      return res.redirect(`${clientUrl}/auth/google/callback?token=${encodeURIComponent(token)}`);
    })(req, res, next);
  });
} else {
  router.get('/google', (req, res) => {
    res.status(503).json({ message: 'Google OAuth is not configured' });
  });

  router.get('/google/callback', (req, res) => {
    res.status(503).json({ message: 'Google OAuth is not configured' });
  });
}

// Protected routes
router.get('/profile', authenticateToken, authController.getUserProfile);
router.put('/profile', authenticateToken, authController.updateUserProfile);

// Admin routes
router.get('/users', authenticateAdmin, authController.getAllUsers);
router.get('/users/:id', authenticateAdmin, authController.getUserById);
router.put('/users/:id', authenticateAdmin, authController.updateUser);
router.delete('/users/:id', authenticateAdmin, authController.deleteUser);

module.exports = router;
