const Order = require('../models/Order');
const User = require('../models/User');
const { generateReceiptNumber, renderReceiptHtml, renderReceiptText } = require('../services/receipt');
const { sendEmail } = require('../services/mailer');

const isAdminRequest = (req) => req.admin?.role === 'admin' || req.user?.role === 'admin';

const ensureOwnerOrAdmin = (req, order) => {
  if (isAdminRequest(req)) return true;
  return order.user?.toString?.() === req.user?.id;
};

const sendReceiptEmailForOrder = async (order) => {
  const to = order.userEmail;
  const subject = `Your Caliber Watch receipt ${order.receiptNumber ? `(${order.receiptNumber})` : ''}`.trim();
  const html = renderReceiptHtml(order);
  const text = renderReceiptText(order);
  return sendEmail({ to, subject, html, text });
};

const getCancelWindowMinutes = () => {
  const raw = process.env.ORDER_CANCEL_WINDOW_MINUTES;
  const parsed = raw ? Number(raw) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return 30;
};

// Create order
exports.createOrder = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      shippingAddress,
      items,
      subtotal,
      shipping,
      total,
      payment,
    } = req.body;

    if (!fullName || !phone || !shippingAddress || !items || items.length === 0) {
      return res.status(400).json({ message: 'All order fields are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newOrder = new Order({
      user: req.user.id,
      userEmail: user.email,
      fullName,
      phone,
      shippingAddress,
      items,
      subtotal,
      shipping,
      total,
      status: 'Pending',
    });

    const paymentMethod = typeof payment?.method === 'string' ? payment.method.trim().toLowerCase() : '';
    const paymentProvider = typeof payment?.provider === 'string' ? payment.provider.trim().toLowerCase() : '';
    const paymentTransactionId = typeof payment?.transactionId === 'string' ? payment.transactionId.trim() : '';
    const allowedMethods = new Set(['card', 'upi', 'netbanking', 'wallet', 'cod']);

    if (paymentMethod && allowedMethods.has(paymentMethod)) {
      newOrder.payment = {
        ...(newOrder.payment || {}),
        status: 'Pending',
        provider: paymentProvider || (paymentMethod === 'cod' ? 'cod' : 'fake'),
        method: paymentMethod,
        transactionId: paymentTransactionId ? paymentTransactionId.slice(0, 80) : undefined,
      };
    }

    await newOrder.save();
    await newOrder.populate('items.watch');

    res.status(201).json({ message: 'Order created successfully', order: newOrder });
  } catch (error) {
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
};

// Get user orders
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).populate('items.watch');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.watch');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user owns this order
    if (order.user.toString() !== req.user.id && req.admin?.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
};

// Get all orders (Admin only)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('items.watch');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

// Update order status (Admin only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const allowedStatuses = new Set(['Pending', 'Processing', 'Shipped', 'Delivered']);
    if (!allowedStatuses.has(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const existingOrder = await Order.findById(req.params.id).populate('items.watch');
    if (!existingOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (existingOrder.status === 'Delivered' && status !== 'Delivered') {
      return res.status(409).json({ message: 'Delivered orders cannot be changed' });
    }

    if (existingOrder.status === 'Cancelled' && status !== 'Cancelled') {
      return res.status(409).json({ message: 'Cancelled orders cannot be changed' });
    }

    existingOrder.status = status;

    let emailResult;
    const isDelivered = status === 'Delivered';
    const paymentMethod = String(existingOrder.payment?.method || '').toLowerCase();
    const isCod = paymentMethod === 'cod';

    if (isDelivered && isCod && existingOrder.payment?.status !== 'Paid') {
      existingOrder.payment = {
        ...(existingOrder.payment || {}),
        status: 'Paid',
        provider: existingOrder.payment?.provider || 'cod',
        method: 'cod',
        transactionId: existingOrder.payment?.transactionId || 'COD',
        paidAt: new Date(),
      };
    }

    const shouldEmailReceiptOnDelivery =
      isDelivered &&
      !!existingOrder.userEmail &&
      existingOrder.payment?.status === 'Paid' &&
      !existingOrder.receiptSentAt;

    if (shouldEmailReceiptOnDelivery && !existingOrder.receiptNumber) {
      existingOrder.receiptNumber = generateReceiptNumber(existingOrder._id);
      existingOrder.receiptIssuedAt = new Date();
    }

    await existingOrder.save();

    if (shouldEmailReceiptOnDelivery) {
      try {
        emailResult = await sendReceiptEmailForOrder(existingOrder);
        existingOrder.receiptSentAt = new Date();
        await existingOrder.save();
      } catch (emailError) {
        return res.status(200).json({
          message: 'Order status updated; receipt email failed',
          order: existingOrder,
          email: { ok: false, error: emailError.message },
        });
      }
    }

    return res.json({
      message: 'Order status updated',
      order: existingOrder,
      ...(emailResult ? { email: { ok: true, ...emailResult } } : {}),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating order', error: error.message });
  }
};

// Cancel order (User)
exports.cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body || {};
    const order = await Order.findById(req.params.id).populate('items.watch');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!ensureOwnerOrAdmin(req, order)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (order.status === 'Cancelled') {
      return res.status(200).json({ message: 'Order already cancelled', order });
    }

    if (order.status === 'Delivered') {
      return res.status(409).json({ message: 'Delivered orders cannot be cancelled' });
    }

    if (order.status === 'Shipped') {
      return res.status(409).json({ message: 'Shipped orders cannot be cancelled' });
    }

    if (order.status !== 'Pending' && order.status !== 'Processing') {
      return res.status(409).json({ message: `Orders with status "${order.status}" cannot be cancelled` });
    }

    const cancelWindowMinutes = getCancelWindowMinutes();
    const createdAtMs = order.createdAt ? new Date(order.createdAt).getTime() : 0;
    const ageMs = Date.now() - createdAtMs;
    const windowMs = cancelWindowMinutes * 60 * 1000;
    if (!createdAtMs || ageMs > windowMs) {
      return res.status(409).json({ message: `Cancellation is allowed only within ${cancelWindowMinutes} minutes of placing the order` });
    }

    order.status = 'Cancelled';
    order.cancelledAt = new Date();
    order.cancelledBy = isAdminRequest(req) ? 'admin' : 'user';
    order.cancelReason = typeof reason === 'string' ? reason.slice(0, 300) : undefined;
    await order.save();

    return res.json({
      message: 'Order cancelled',
      order,
      cancelWindowMinutes,
      refundRequired: order.payment?.status === 'Paid',
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error cancelling order', error: error.message });
  }
};

// Mark payment successful + generate & email receipt (User/Admin)
exports.markPaymentSuccess = async (req, res) => {
  try {
    const { provider, method, transactionId } = req.body || {};
    const order = await Order.findById(req.params.id).populate('items.watch');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!ensureOwnerOrAdmin(req, order)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (order.status === 'Cancelled') {
      return res.status(409).json({ message: 'Cancelled orders cannot be marked as paid' });
    }

    const methodNorm = typeof method === 'string' ? method.trim().toLowerCase() : '';
    if (methodNorm === 'cod' && order.status !== 'Delivered') {
      return res.status(409).json({ message: 'Cash on Delivery orders are paid only after delivery' });
    }

    if (order.payment?.status !== 'Paid') {
      order.payment = {
        ...(order.payment || {}),
        status: 'Paid',
        provider: provider || order.payment?.provider,
        method: method || order.payment?.method,
        transactionId: transactionId || order.payment?.transactionId,
        paidAt: order.payment?.paidAt || new Date(),
      };
    }

    if (!order.receiptNumber) {
      order.receiptNumber = generateReceiptNumber(order._id);
      order.receiptIssuedAt = new Date();
    }

    await order.save();

    let emailResult;
    try {
      emailResult = await sendReceiptEmailForOrder(order);
      order.receiptSentAt = new Date();
      await order.save();
    } catch (emailError) {
      return res.status(200).json({
        message: 'Payment marked successful; receipt email failed',
        order,
        email: { ok: false, error: emailError.message },
      });
    }

    res.json({ message: 'Payment marked successful; receipt emailed', order, email: { ok: true, ...emailResult } });
  } catch (error) {
    res.status(500).json({ message: 'Error marking payment successful', error: error.message });
  }
};

// Re-send receipt email (User/Admin)
exports.sendReceipt = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.watch');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!ensureOwnerOrAdmin(req, order)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (order.status === 'Cancelled') {
      return res.status(409).json({ message: 'Cancelled orders cannot receive receipts' });
    }

    if (String(order.payment?.method || '').toLowerCase() === 'cod' && order.status !== 'Delivered') {
      return res.status(409).json({ message: 'Cash on Delivery receipts are available only after delivery' });
    }

    if (!order.receiptNumber) {
      order.receiptNumber = generateReceiptNumber(order._id);
      order.receiptIssuedAt = new Date();
      await order.save();
    }

    let emailResult;
    try {
      emailResult = await sendReceiptEmailForOrder(order);
      order.receiptSentAt = new Date();
      await order.save();
    } catch (emailError) {
      return res.status(200).json({
        message: 'Receipt generated; email failed',
        order,
        email: { ok: false, error: emailError.message },
      });
    }

    res.json({ message: 'Receipt emailed', order, email: { ok: true, ...emailResult } });
  } catch (error) {
    res.status(500).json({ message: 'Error sending receipt', error: error.message });
  }
};

// Download receipt (User/Admin)
exports.downloadReceipt = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.watch');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!ensureOwnerOrAdmin(req, order)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (order.status === 'Cancelled') {
      return res.status(409).json({ message: 'Cancelled orders cannot receive receipts' });
    }

    if (order.payment?.status !== 'Paid') {
      return res.status(409).json({ message: 'Receipt is available only after payment is successful' });
    }

    if (!order.receiptNumber) {
      order.receiptNumber = generateReceiptNumber(order._id);
      order.receiptIssuedAt = new Date();
      await order.save();
    }

    const html = renderReceiptHtml(order);
    const safeReceipt = String(order.receiptNumber || 'receipt').replace(/[^a-z0-9-_]/gi, '_');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${safeReceipt}.html"`);
    return res.status(200).send(html);
  } catch (error) {
    return res.status(500).json({ message: 'Error downloading receipt', error: error.message });
  }
};
