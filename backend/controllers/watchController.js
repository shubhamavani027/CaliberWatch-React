const Watch = require('../models/Watch');

const toNumberOrUndefined = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

const getUploadedFilenames = (req, field) => {
  const files = req.files && req.files[field];
  if (!files) return [];
  return files.map((f) => f.filename).filter(Boolean);
};

// Get all watches
exports.getAllWatches = async (req, res) => {
  try {
    const watches = await Watch.find();
    res.json(watches);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching watches', error: error.message });
  }
};

// Get watch by ID
exports.getWatchById = async (req, res) => {
  try {
    const watch = await Watch.findById(req.params.id);
    if (!watch) {
      return res.status(404).json({ message: 'Watch not found' });
    }
    res.json(watch);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching watch', error: error.message });
  }
};

// Create watch (Admin only)
exports.createWatch = async (req, res) => {
  try {
    const { image, title, description, price, category, brand, rating, reviews, stock } = req.body;

    const uploadedImages = getUploadedFilenames(req, 'images');
    const uploadedVideo = getUploadedFilenames(req, 'video')[0] || '';

    const primaryImage = uploadedImages[0] || image;

    if (!primaryImage || !title || !description || price === undefined || price === null || price === '') {
      return res.status(400).json({ message: 'Image, title, description, and price are required' });
    }

    const newWatch = new Watch({
      image: primaryImage,
      images: uploadedImages.length > 0 ? uploadedImages : [],
      video: uploadedVideo,
      title,
      description,
      price: Number(price),
      ...(category ? { category } : {}),
      ...(brand ? { brand } : {}),
      ...(toNumberOrUndefined(rating) !== undefined ? { rating: toNumberOrUndefined(rating) } : {}),
      ...(toNumberOrUndefined(reviews) !== undefined ? { reviews: toNumberOrUndefined(reviews) } : {}),
      ...(toNumberOrUndefined(stock) !== undefined ? { stock: toNumberOrUndefined(stock) } : {}),
    });

    await newWatch.save();
    res.status(201).json({ message: 'Watch created successfully', watch: newWatch });
  } catch (error) {
    res.status(500).json({ message: 'Error creating watch', error: error.message });
  }
};

// Update watch (Admin only)
exports.updateWatch = async (req, res) => {
  try {
    const { image, title, description, price, category, brand, rating, reviews, stock } = req.body;

    const update = {
      ...(image !== undefined ? { image } : {}),
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(price !== undefined ? { price: Number(price) } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(brand !== undefined ? { brand } : {}),
      ...(toNumberOrUndefined(rating) !== undefined ? { rating: toNumberOrUndefined(rating) } : {}),
      ...(toNumberOrUndefined(reviews) !== undefined ? { reviews: toNumberOrUndefined(reviews) } : {}),
      ...(toNumberOrUndefined(stock) !== undefined ? { stock: toNumberOrUndefined(stock) } : {}),
    };

    const uploadedImages = getUploadedFilenames(req, 'images');
    const uploadedVideo = getUploadedFilenames(req, 'video')[0] || '';

    if (uploadedImages.length > 0) {
      update.images = uploadedImages;
      update.image = uploadedImages[0];
    }

    if (uploadedVideo) {
      update.video = uploadedVideo;
    }

    const updatedWatch = await Watch.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );

    if (!updatedWatch) {
      return res.status(404).json({ message: 'Watch not found' });
    }

    res.json({ message: 'Watch updated successfully', watch: updatedWatch });
  } catch (error) {
    res.status(500).json({ message: 'Error updating watch', error: error.message });
  }
};

// Delete watch (Admin only)
exports.deleteWatch = async (req, res) => {
  try {
    const deletedWatch = await Watch.findByIdAndDelete(req.params.id);

    if (!deletedWatch) {
      return res.status(404).json({ message: 'Watch not found' });
    }

    res.json({ message: 'Watch deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting watch', error: error.message });
  }
};
