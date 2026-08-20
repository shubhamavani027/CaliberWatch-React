const mongoose = require('mongoose');

const watchSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true,
  },
  images: {
    type: [String],
    default: [],
  },
  video: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  category: {
    type: String,
    enum: ['luxury', 'sports', 'casual', 'smartwatch'],
    default: 'casual',
  },
  rating: {
    type: Number,
    default: 5,
    min: 0,
    max: 5,
  },
  reviews: {
    type: Number,
    default: 0,
  },
  stock: {
    type: Number,
    default: 10,
  },
  brand: {
    type: String,
    default: 'Titan',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Watch', watchSchema);
