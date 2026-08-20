const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  shippingAddress: {
    addressLine1: {
      type: String,
      required: true,
    },
    addressLine2: String,
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    zip: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
  },
  items: [
    {
      watch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Watch',
        required: true,
      },
      title: String,
      price: Number,
      quantity: {
        type: Number,
        default: 1,
      },
    },
  ],
  subtotal: {
    type: Number,
    required: true,
  },
  shipping: {
    type: Number,
    default: 10,
  },
  total: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'INR',
  },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending',
  },
  payment: {
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
      default: 'Pending',
    },
    provider: String,
    method: String,
    transactionId: String,
    paidAt: Date,
  },
  receiptNumber: {
    type: String,
    index: true,
  },
  receiptIssuedAt: Date,
  receiptSentAt: Date,
  cancelledAt: Date,
  cancelledBy: {
    type: String,
    enum: ['user', 'admin', 'system'],
  },
  cancelReason: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Order', orderSchema);
