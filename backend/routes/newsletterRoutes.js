const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');

router.get('/subscribe', (req, res) => {
  res.status(405).json({
    message: 'Method Not Allowed. Use POST /api/newsletter/subscribe with JSON { "email": "you@example.com" }',
  });
});

router.post('/subscribe', newsletterController.subscribe);

module.exports = router;
