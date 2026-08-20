const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateAdmin } = require('../middleware/auth');

// Public route
router.post('/login', adminController.adminLogin);

// Protected routes
router.get('/profile', authenticateAdmin, adminController.getAdminProfile);
router.get('/users', authenticateAdmin, adminController.getAllUsers);
router.delete('/users/:userId', authenticateAdmin, adminController.deleteUser);
router.get('/analytics', authenticateAdmin, adminController.getAnalytics);
router.get('/settings', authenticateAdmin, adminController.getSettings);
router.put('/settings', authenticateAdmin, adminController.updateSettings);

module.exports = router;
