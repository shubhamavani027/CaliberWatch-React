const pad2 = (n) => String(n).padStart(2, '0');

const escapeHtml = (value) => {
  const s = String(value ?? '');
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const formatMoney = (amount, currency = 'INR') => {
  const n = Number(amount || 0);
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
};

const generateReceiptNumber = (orderId, now = new Date()) => {
  const yyyy = now.getFullYear();
  const mm = pad2(now.getMonth() + 1);
  const dd = pad2(now.getDate());
  const shortId = String(orderId || '').replace(/[^a-f0-9]/gi, '').slice(-6).toUpperCase() || 'ORDER';
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RCPT-${yyyy}${mm}${dd}-${shortId}-${rand}`;
};

const renderReceiptHtml = (order) => {
  const currency = order.currency || 'INR';
  const items = Array.isArray(order.items) ? order.items : [];
  const created = order.payment?.paidAt || order.createdAt || new Date();

  const rows = items
    .map((item) => {
      const title = escapeHtml(item.title || item.watch?.title || 'Item');
      const qty = Number(item.quantity || 1);
      const unit = Number(item.price || 0);
      const line = unit * qty;
      return `
        <tr>
          <td style="padding:10px 8px;border-bottom:1px solid #e9ecef;">${title}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e9ecef;text-align:center;">${qty}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e9ecef;text-align:right;">${escapeHtml(formatMoney(unit, currency))}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e9ecef;text-align:right;">${escapeHtml(formatMoney(line, currency))}</td>
        </tr>
      `;
    })
    .join('');

  const address = order.shippingAddress || {};
  const addressLines = [
    address.addressLine1,
    address.addressLine2,
    [address.city, address.state, address.zip].filter(Boolean).join(', '),
    address.country,
  ]
    .filter(Boolean)
    .map((l) => `<div>${escapeHtml(l)}</div>`)
    .join('');

  const paymentStatus = escapeHtml(order.payment?.status || 'Pending');
  const paymentMethod = order.payment?.method ? escapeHtml(order.payment.method) : '';
  const transactionId = order.payment?.transactionId ? escapeHtml(order.payment.transactionId) : '';

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Receipt ${escapeHtml(order.receiptNumber || '')}</title>
  </head>
  <body style="margin:0;background:#f6f8fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;overflow:hidden;">
    <div style="max-width:720px;margin:0 auto;padding:18px 18px 14px;">
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
        <div style="padding:20px 22px;background:#0b0f17;color:#e8eefc;">
          <div style="font-size:18px;font-weight:800;letter-spacing:.2px;">Caliber Watch</div>
          <div style="opacity:.85;margin-top:6px;">Payment Receipt</div>
        </div>

        <div style="padding:20px;">
          <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;">
            <div>
              <div style="font-size:14px;color:#475569;">Receipt</div>
              <div style="font-size:18px;font-weight:800;margin-top:2px;">${escapeHtml(order.receiptNumber || '')}</div>
              <div style="font-size:13px;color:#64748b;margin-top:6px;">Order ID: ${escapeHtml(order._id || '')}</div>
              <div style="font-size:13px;color:#64748b;margin-top:2px;">Date: ${escapeHtml(new Date(created).toLocaleString())}</div>
            </div>
            <div style="min-width:240px;">
              <div style="font-size:14px;color:#475569;">Billed To</div>
              <div style="font-weight:700;margin-top:6px;">${escapeHtml(order.fullName || '')}</div>
              <div style="font-size:13px;color:#64748b;margin-top:2px;">${escapeHtml(order.userEmail || '')}</div>
              <div style="font-size:13px;color:#64748b;margin-top:2px;">${escapeHtml(order.phone || '')}</div>
            </div>
          </div>

          <div style="margin-top:16px;padding:14px 14px;border:1px solid #e5e7eb;border-radius:12px;background:#fbfdff;">
            <div style="font-size:14px;color:#475569;font-weight:700;">Shipping Address</div>
            <div style="margin-top:8px;font-size:13px;color:#334155;line-height:1.5;">
              ${addressLines || '<div>-</div>'}
            </div>
          </div>

          <div style="margin-top:18px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr style="background:#f1f5f9;color:#0f172a;">
                  <th style="text-align:left;padding:10px 8px;font-size:13px;">Item</th>
                  <th style="text-align:center;padding:10px 8px;font-size:13px;">Qty</th>
                  <th style="text-align:right;padding:10px 8px;font-size:13px;">Price</th>
                  <th style="text-align:right;padding:10px 8px;font-size:13px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${rows || ''}
              </tbody>
            </table>
          </div>

          <div style="margin-top:16px;display:flex;justify-content:flex-end;">
            <div style="width:min(100%,320px);border:1px solid #e5e7eb;border-radius:12px;padding:12px 14px;background:#ffffff;">
              <div style="display:flex;justify-content:space-between;margin:6px 0;color:#334155;">
                <span>Subtotal</span>
                <span>${escapeHtml(formatMoney(order.subtotal, currency))}</span>
              </div>
              <div style="display:flex;justify-content:space-between;margin:6px 0;color:#334155;">
                <span>Shipping</span>
                <span>${escapeHtml(formatMoney(order.shipping, currency))}</span>
              </div>
              <div style="height:1px;background:#e5e7eb;margin:10px 0;"></div>
              <div style="display:flex;justify-content:space-between;margin:6px 0;font-weight:800;">
                <span>Total</span>
                <span>${escapeHtml(formatMoney(order.total, currency))}</span>
              </div>
              <div style="margin-top:10px;font-size:12px;color:#64748b;">
                Payment status: <b>${paymentStatus}</b>
                ${paymentMethod ? ` • Method: ${paymentMethod}` : ''}
                ${transactionId ? ` • Transaction: ${transactionId}` : ''}
              </div>
            </div>
          </div>

          <div style="margin-top:18px;font-size:12px;color:#64748b;line-height:1.5;">
            If you have any questions about this receipt, reply to this email.
          </div>
        </div>
      </div>
      <div style="text-align:center;font-size:12px;color:#94a3b8;margin-top:14px;">
        © ${new Date().getFullYear()} Caliber Watch
      </div>
    </div>
  </body>
</html>`;
};

const renderReceiptText = (order) => {
  const currency = order.currency || 'INR';
  const lines = [];
  lines.push('Caliber Watch - Payment Receipt');
  if (order.receiptNumber) lines.push(`Receipt: ${order.receiptNumber}`);
  lines.push(`Order ID: ${order._id}`);
  lines.push(`Date: ${new Date(order.payment?.paidAt || order.createdAt || new Date()).toISOString()}`);
  lines.push('');
  lines.push(`Billed To: ${order.fullName} (${order.userEmail})`);
  lines.push('');
  lines.push('Items:');
  for (const item of order.items || []) {
    const title = item.title || item.watch?.title || 'Item';
    const qty = Number(item.quantity || 1);
    const unit = Number(item.price || 0);
    lines.push(`- ${title} x${qty} @ ${formatMoney(unit, currency)} = ${formatMoney(unit * qty, currency)}`);
  }
  lines.push('');
  lines.push(`Subtotal: ${formatMoney(order.subtotal, currency)}`);
  lines.push(`Shipping: ${formatMoney(order.shipping, currency)}`);
  lines.push(`Total: ${formatMoney(order.total, currency)}`);
  lines.push(`Payment status: ${order.payment?.status || 'Pending'}`);
  if (order.payment?.method) lines.push(`Payment method: ${order.payment.method}`);
  if (order.payment?.transactionId) lines.push(`Transaction: ${order.payment.transactionId}`);
  return lines.join('\n');
};

module.exports = {
  generateReceiptNumber,
  renderReceiptHtml,
  renderReceiptText,
  formatMoney,
};
