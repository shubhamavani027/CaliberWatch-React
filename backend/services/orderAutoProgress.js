const Order = require('../models/Order');
const { generateReceiptNumber, renderReceiptHtml, renderReceiptText } = require('./receipt');
const { sendEmail } = require('./mailer');

const STATUS_FLOW = ['Pending', 'Processing', 'Shipped', 'Delivered'];

const normalizeStatus = (value) => {
  const s = String(value || '').trim();
  if (!s) return '';
  const lower = s.toLowerCase();
  const match = STATUS_FLOW.find((v) => v.toLowerCase() === lower);
  if (match) return match;
  if (lower === 'cancelled') return 'Cancelled';
  return s;
};

const desiredStatusFromAgeMinutes = (ageMinutes) => {
  if (ageMinutes >= 3) return 'Delivered';
  if (ageMinutes >= 2) return 'Shipped';
  if (ageMinutes >= 1) return 'Processing';
  return 'Pending';
};

const progressOrdersOnce = async () => {
  const now = Date.now();
  const candidates = await Order.find({
    status: { $in: ['Pending', 'Processing', 'Shipped'] },
  })
    .select({ status: 1, createdAt: 1, payment: 1, userEmail: 1, receiptNumber: 1, receiptIssuedAt: 1, items: 1, total: 1, currency: 1 })
    .lean();

  if (!Array.isArray(candidates) || candidates.length === 0) return { checked: 0, updated: 0 };

  let updated = 0;
  for (const order of candidates) {
    const status = normalizeStatus(order.status);
    if (status === 'Delivered' || status === 'Cancelled') continue;

    const createdAtMs = order.createdAt ? new Date(order.createdAt).getTime() : 0;
    if (!createdAtMs) continue;

    const ageMinutes = Math.floor((now - createdAtMs) / 60000);
    const desired = desiredStatusFromAgeMinutes(ageMinutes);

    const currentIdx = STATUS_FLOW.indexOf(status);
    const desiredIdx = STATUS_FLOW.indexOf(desired);
    if (currentIdx < 0 || desiredIdx < 0) continue;
    if (desiredIdx <= currentIdx) continue;

    const set = { status: desired };

    const isCod = String(order.payment?.method || '').toLowerCase() === 'cod';
    const shouldMarkPaid = desired === 'Delivered' && isCod && order.payment?.status !== 'Paid';

    if (shouldMarkPaid) {
      set.payment = {
        ...(order.payment || {}),
        status: 'Paid',
        provider: order.payment?.provider || 'cod',
        method: 'cod',
        transactionId: order.payment?.transactionId || 'COD',
        paidAt: order.payment?.paidAt || new Date(),
      };

      if (!order.receiptNumber) {
        set.receiptNumber = generateReceiptNumber(order._id);
        set.receiptIssuedAt = new Date();
      }
    }

    const res = await Order.updateOne({ _id: order._id, status: order.status }, { $set: set });
    if (res?.modifiedCount) {
      updated += 1;

      const sendEmailEnabled = String(process.env.ORDER_AUTO_PROGRESS_SEND_EMAIL || '').toLowerCase() === 'true';
      if (sendEmailEnabled && shouldMarkPaid && order.userEmail) {
        try {
          const subject = `Your Caliber Watch receipt ${set.receiptNumber ? `(${set.receiptNumber})` : ''}`.trim();
          const html = renderReceiptHtml({ ...order, ...set });
          const text = renderReceiptText({ ...order, ...set });
          await sendEmail({ to: order.userEmail, subject, html, text });
        } catch {
          // ignore
        }
      }
    }
  }

  return { checked: candidates.length, updated };
};

const startOrderAutoProgress = () => {
  const enabledRaw = process.env.ORDER_AUTO_PROGRESS;
  const isDev = String(process.env.NODE_ENV || '').toLowerCase() !== 'production';
  const enabled = enabledRaw != null ? String(enabledRaw).toLowerCase() === 'true' : isDev;
  if (!enabled) return null;

  const intervalMsRaw = process.env.ORDER_AUTO_PROGRESS_INTERVAL_MS;
  const intervalMs = intervalMsRaw ? Number(intervalMsRaw) : 60000;
  const safeInterval = Number.isFinite(intervalMs) && intervalMs >= 10000 ? intervalMs : 60000;

  const timer = setInterval(async () => {
    try {
      await progressOrdersOnce();
    } catch (err) {
      console.error('[orderAutoProgress] tick failed:', err?.message || err);
    }
  }, safeInterval);

  if (typeof timer.unref === 'function') timer.unref();
  return timer;
};

module.exports = {
  startOrderAutoProgress,
  progressOrdersOnce,
};
