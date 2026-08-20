const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  source: {
    type: String,
    default: 'website',
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

subscriberSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('NewsletterSubscriber', subscriberSchema);

