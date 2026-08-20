const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      default: 'The Caliber',
    },
    supportEmail: {
      type: String,
      default: 'support@caliber.com',
    },
    enableNotifications: {
      type: Boolean,
      default: true,
    },
    autoConfirmOrders: {
      type: Boolean,
      default: false,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Setting', settingSchema);
