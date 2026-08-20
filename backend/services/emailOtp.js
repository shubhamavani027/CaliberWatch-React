const crypto = require('crypto');
const EmailOtp = require('../models/EmailOtp');
const { sendEmail } = require('./mailer');

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getOtpSecret = () => process.env.OTP_SECRET || process.env.JWT_SECRET || 'dev_otp_secret_change_me';

const hashCode = ({ email, purpose, code }) => {
  const secret = getOtpSecret();
  return crypto
    .createHash('sha256')
    .update(`${secret}:${purpose}:${normalizeEmail(email)}:${String(code).trim()}`)
    .digest('hex');
};

const generateCode = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');

const otpExpiryMinutes = () => {
  const minutes = Number(process.env.EMAIL_OTP_EXP_MINUTES || 10);
  return Number.isFinite(minutes) && minutes > 0 ? minutes : 10;
};

const resendCooldownSeconds = () => {
  const seconds = Number(process.env.EMAIL_OTP_RESEND_SECONDS || 60);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : 60;
};

const parseUserAgent = (ua) => {
  if (!ua) return 'Unknown Device';
  const isMobile = /Mobile|Android|iPhone/i.test(ua);
  const os = /Windows/i.test(ua) ? 'Windows' : /Macintosh/i.test(ua) ? 'macOS' : /Linux/i.test(ua) ? 'Linux' : /Android/i.test(ua) ? 'Android' : /iPhone|iPad/i.test(ua) ? 'iOS' : 'Unknown OS';
  const browser = /Chrome/i.test(ua) ? 'Google Chrome' : /Firefox/i.test(ua) ? 'Firefox' : /Safari/i.test(ua) && !/Chrome/i.test(ua) ? 'Safari' : /Edge/i.test(ua) ? 'Microsoft Edge' : 'Web Browser';
  return `${browser} ${os} (${isMobile ? 'Mobile' : 'Desktop'})`;
};

const buildOtpEmailHtml = ({ code, purpose, expiresInMinutes, email, name, metadata }) => {
  const safeCode = escapeHtml(code);
  const safeEmail = escapeHtml(email);
  const safeName = name ? escapeHtml(name) : 'there';
  
  const whenStr = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short'
  }).format(new Date());

  const deviceStr = parseUserAgent(metadata?.userAgent);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <style>
      body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #333; line-height: 1.6; }
      .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
      .logo { margin-bottom: 32px; }
      .greeting { font-size: 18px; font-weight: 500; margin-bottom: 24px; color: #111; }
      .body-text { font-size: 16px; margin-bottom: 24px; color: #444; }
      .details-table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
      .details-table td { padding: 4px 0; font-size: 14px; color: #555; }
      .details-label { font-weight: 600; width: 80px; color: #111; }
      .action-box { border-top: 1px solid #eee; padding-top: 24px; margin-top: 24px; }
      .code-label { font-size: 16px; font-weight: 700; margin-bottom: 12px; color: #000; }
      .code { font-size: 36px; font-weight: 800; letter-spacing: 2px; color: #000; margin: 0; }
      .footer { margin-top: 48px; border-top: 1px solid #eee; padding-top: 20px; font-size: 13px; color: #888; }
      .footer a { color: #007bff; text-decoration: none; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="logo">
         <div style="font-size: 32px; font-weight: 900; color: #d6b24a; letter-spacing: -1px;">
           Caliber<span style="color: #111;">Watch</span>
         </div>
      </div>

      <div class="greeting">Hello ${safeName},</div>

      <div class="body-text">
        Someone is attempting to ${purpose === 'register' ? 'create an account with' : 'sign in to'} your account.
      </div>

      <table class="details-table">
        <tr>
          <td class="details-label">When:</td>
          <td>${whenStr}</td>
        </tr>
        <tr>
          <td class="details-label">Device:</td>
          <td>${deviceStr}</td>
        </tr>
        <tr>
          <td class="details-label">Near:</td>
          <td>${metadata?.ip || 'Unknown Location'}</td>
        </tr>
      </table>

      <div class="action-box">
        <div class="code-label">If this was you, your verification code is:</div>
        <div class="code">${safeCode}</div>
      </div>

      <div class="footer">
        If you didn't request it: <a href="#">click here to deny.</a><br />
        Don't share it with others. This code expires in ${expiresInMinutes} minutes.
      </div>
    </div>
  </body>
</html>`;
};

const sendEmailOtp = async ({ email, purpose, name, metadata }) => {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    const err = new Error('Valid email is required');
    err.code = 'INVALID_EMAIL';
    throw err;
  }

  const latest = await EmailOtp.findOne({ email: normalized, purpose }).sort({ createdAt: -1 });
  if (latest) {
    const cooldownMs = resendCooldownSeconds() * 1000;
    const ageMs = Date.now() - new Date(latest.createdAt).getTime();
    if (ageMs < cooldownMs) {
      const err = new Error('Please wait before requesting another OTP');
      err.code = 'OTP_RATE_LIMIT';
      err.retryAfterSeconds = Math.ceil((cooldownMs - ageMs) / 1000);
      throw err;
    }
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + otpExpiryMinutes() * 60 * 1000);
  const codeHash = hashCode({ email: normalized, purpose, code });

  await EmailOtp.create({ email: normalized, purpose, codeHash, expiresAt });

  const subject = 'Your Caliber Watch OTP';
  const text = `Your OTP code is: ${code}\n\nThis code expires in ${otpExpiryMinutes()} minutes.\n\nIf you did not request this, you can ignore this email.`;
  const html = buildOtpEmailHtml({
    code,
    purpose,
    expiresInMinutes: otpExpiryMinutes(),
    email: normalized,
    name,
    metadata
  });
  await sendEmail({ to: normalized, subject, text, html });

  return { sent: true, expiresAt };
};

const verifyEmailOtp = async ({ email, purpose, code }) => {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    const err = new Error('Valid email is required');
    err.code = 'INVALID_EMAIL';
    throw err;
  }
  if (!code) {
    const err = new Error('OTP code is required');
    err.code = 'MISSING_CODE';
    throw err;
  }

  const record = await EmailOtp.findOne({ email: normalized, purpose }).sort({ createdAt: -1 });
  if (!record) return { ok: false, reason: 'not_found' };
  if (record.expiresAt && new Date(record.expiresAt).getTime() < Date.now()) return { ok: false, reason: 'expired' };
  if ((record.attempts || 0) >= 5) return { ok: false, reason: 'too_many_attempts' };

  const expectedHash = hashCode({ email: normalized, purpose, code });
  if (expectedHash !== record.codeHash) {
    await EmailOtp.updateOne({ _id: record._id }, { $inc: { attempts: 1 } });
    return { ok: false, reason: 'invalid' };
  }

  await EmailOtp.deleteMany({ email: normalized, purpose });
  return { ok: true };
};

module.exports = { normalizeEmail, sendEmailOtp, verifyEmailOtp };
