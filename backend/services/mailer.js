let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch {
  nodemailer = null;
}

const https = require('https');

const getEmailMode = () => (process.env.EMAIL_MODE || '').trim().toLowerCase(); // "smtp" | "sendgrid" | "log"

const getSmtpConfig = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;
  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465;
  return { host, port, user, pass, from, secure };
};

const validateSmtpConfig = (cfg) => {
  const missing = [];
  if (!cfg.host) missing.push('SMTP_HOST');
  if (!cfg.port) missing.push('SMTP_PORT');
  if (!cfg.user) missing.push('SMTP_USER');
  const passLooksPlaceholder =
    typeof cfg.pass === 'string' &&
    (cfg.pass.trim() === 'YOUR_GMAIL_APP_PASSWORD_HERE' || cfg.pass.trim() === 'YOUR_SMTP_PASSWORD_HERE');
  if (!cfg.pass || passLooksPlaceholder) missing.push('SMTP_PASS');
  if (!cfg.from) missing.push('SMTP_FROM');
  return missing;
};

const sendWithSendGrid = async ({ to, subject, html, text }) => {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.SENDGRID_FROM;
  if (!apiKey || !from) {
    const missing = [];
    if (!apiKey) missing.push('SENDGRID_API_KEY');
    if (!from) missing.push('SENDGRID_FROM');
    throw new Error(`Email is not configured: missing ${missing.join(', ')}`);
  }

  const payload = JSON.stringify({
    personalizations: [{ to: [{ email: to }] }],
    from: { email: from },
    subject,
    content: [
      ...(text ? [{ type: 'text/plain', value: text }] : []),
      ...(html ? [{ type: 'text/html', value: html }] : []),
    ],
  });

  const res = await new Promise((resolve, reject) => {
    const req = https.request(
      {
        method: 'POST',
        host: 'api.sendgrid.com',
        path: '/v3/mail/send',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (resp) => {
        const chunks = [];
        resp.on('data', (c) => chunks.push(c));
        resp.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8');
          resolve({ statusCode: resp.statusCode, body });
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });

  if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
    throw new Error(`SendGrid error: HTTP ${res.statusCode}${res.body ? ` - ${res.body}` : ''}`);
  }

  return { mode: 'sendgrid', statusCode: res.statusCode };
};

const sendEmail = async ({ to, subject, html, text }) => {
  const isDev = (process.env.NODE_ENV || '').toLowerCase() !== 'production';
  const mode = getEmailMode() || (isDev ? 'log' : 'smtp');

  if (mode === 'log') {
    console.log('[EMAIL_MODE=log] To:', to);
    console.log('[EMAIL_MODE=log] Subject:', subject);
    console.log('[EMAIL_MODE=log] Text:\n', text);
    return { mode: 'log', messageId: 'logged' };
  }

  if (mode === 'sendgrid') {
    return sendWithSendGrid({ to, subject, html, text });
  }

  const cfg = getSmtpConfig();
  if (
    typeof cfg.host === 'string' &&
    cfg.host.toLowerCase().includes('gmail.com') &&
    typeof cfg.pass === 'string' &&
    /\s/.test(cfg.pass)
  ) {
    cfg.pass = cfg.pass.replace(/\s+/g, '');
  }
  const missing = validateSmtpConfig(cfg);
  if (missing.length) {
    throw new Error(`Email is not configured: missing ${missing.join(', ')}`);
  }

  if (!nodemailer) {
    throw new Error('Email is not configured for SMTP: install "nodemailer" or set EMAIL_MODE=sendgrid');
  }

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
  });

  let info;
  try {
    info = await transporter.sendMail({
      from: cfg.from,
      to,
      subject,
      text,
      html,
    });
  } catch (err) {
    const message = err?.message || 'SMTP error';
    const code = err?.code || '';
    const looksLikeGmailBadCredentials =
      typeof cfg.host === 'string' &&
      cfg.host.toLowerCase().includes('gmail.com') &&
      (code === 'EAUTH' ||
        message.includes('Username and Password not accepted') ||
        message.includes('BadCredentials') ||
        message.includes('535'));

    if (looksLikeGmailBadCredentials) {
      throw new Error(
        'SMTP authentication failed (Gmail). Set SMTP_PASS to a Google App Password (16 characters, no spaces). Regular Gmail passwords will not work.'
      );
    }

    throw err;
  }

  return { mode: 'smtp', messageId: info.messageId, response: info.response };
};

module.exports = {
  sendEmail,
  getSmtpConfig,
};
