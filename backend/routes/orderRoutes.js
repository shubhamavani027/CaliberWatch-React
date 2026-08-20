const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken, authenticateAdmin } = require('../middleware/auth');

// User routes (protected)
router.post('/', authenticateToken, orderController.createOrder);
router.get('/user', authenticateToken, orderController.getUserOrders);
router.post('/:id/cancel', authenticateToken, orderController.cancelOrder);
router.post('/:id/payment-success', authenticateToken, orderController.markPaymentSuccess);
router.post('/:id/receipt/send', authenticateToken, orderController.sendReceipt);
router.get('/:id/receipt/download', authenticateToken, orderController.downloadReceipt);
router.get('/:id', authenticateToken, orderController.getOrderById);

// Admin routes
router.get('/', authenticateAdmin, orderController.getAllOrders);
router.put('/:id', authenticateAdmin, orderController.updateOrderStatus);
router.put('/:id/status', authenticateAdmin, orderController.updateOrderStatus);

module.exports = router;
