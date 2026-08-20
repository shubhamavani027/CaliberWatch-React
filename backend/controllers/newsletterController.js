const NewsletterSubscriber = require('../models/NewsletterSubscriber');
const { sendEmail } = require('../services/mailer');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const subscribe = async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const source = String(req.body?.source || 'website').trim() || 'website';

    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    const existing = await NewsletterSubscriber.findOne({ email }).lean();
    if (existing) {
      return res.status(200).json({ message: 'You are already subscribed.' });
    }

    await NewsletterSubscriber.create({ email, source });

    try {
      await sendEmail({
        to: email,
        subject: 'Welcome to Caliber Watch',
        text: 'Thanks for subscribing to the Caliber Watch newsletter. You’ll get early access to releases and offers.',
        html:
          '<p>Thanks for subscribing to the <strong>Caliber Watch</strong> newsletter.</p><p>You’ll get early access to releases and offers.</p>',
      });
    } catch {
      // Email is optional (may be unconfigured in dev); subscription still succeeds.
    }

    return res.status(201).json({ message: 'Subscribed successfully.' });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(200).json({ message: 'You are already subscribed.' });
    }
    return res.status(500).json({ message: 'Failed to subscribe', error: err.message });
  }
};

module.exports = { subscribe };

