const ContactInquiry = require('../models/ContactInquiry');
const { sendEmail } = require('../services/mailer');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const submitContact = async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const phone = String(req.body?.phone || '').trim();
    const subject = String(req.body?.subject || 'Contact page inquiry').trim() || 'Contact page inquiry';
    const message = String(req.body?.message || '').trim();

    if (!name) {
      return res.status(400).json({ message: 'Please enter your name' });
    }

    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    if (!message) {
      return res.status(400).json({ message: 'Please enter your message' });
    }

    const inquiry = await ContactInquiry.create({
      name,
      email,
      phone,
      subject,
      message,
      status: 'new',
    });

    try {
      await sendEmail({
        to: email,
        subject: 'We received your message',
        text: `Hi ${name},\n\nThanks for contacting Caliber Watch. We have received your message and will get back to you soon.\n\nSubject: ${subject}\n\nMessage:\n${message}`,
        html: `<p>Hi ${name},</p><p>Thanks for contacting <strong>Caliber Watch</strong>. We have received your message and will get back to you soon.</p><p><strong>Subject:</strong> ${subject}</p><p><strong>Message:</strong><br/>${message.replace(/\n/g, '<br/>')}</p>`,
      });
    } catch {
      // Email is optional in development; the inquiry is still saved.
    }

    return res.status(201).json({
      message: 'Your message has been stored successfully.',
      inquiryId: inquiry._id,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Unable to send your message right now.', error: err.message });
  }
};

module.exports = { submitContact };
