const express = require('express');
const router = express.Router();
const watchController = require('../controllers/watchController');
const { authenticateAdmin } = require('../middleware/auth');
const { watchMediaUpload } = require('../middleware/upload');

// Public routes
router.get('/', watchController.getAllWatches);
router.get('/:id', watchController.getWatchById);

// Admin routes
router.post('/', authenticateAdmin, watchMediaUpload, watchController.createWatch);
router.put('/:id', authenticateAdmin, watchMediaUpload, watchController.updateWatch);
router.delete('/:id', authenticateAdmin, watchController.deleteWatch);

module.exports = router;
