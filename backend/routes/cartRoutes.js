// Cart routes - for managing cart in session/localStorage on frontend
// This is a simple placeholder as carts are typically managed on the frontend

const express = require('express');
const router = express.Router();

// Cart operations can be handled on frontend using localStorage
// These endpoints are optional and can be used for persistent cart storage if needed

router.get('/', (req, res) => {
  res.json({ message: 'Cart endpoints available' });
});

module.exports = router;
