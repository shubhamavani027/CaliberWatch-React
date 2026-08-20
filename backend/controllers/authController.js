const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { normalizeEmail, sendEmailOtp, verifyEmailOtp } = require('../services/emailOtp');

const normalizeRole = (role) => (role === 'admin' ? 'admin' : 'user');

const requireJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    const err = new Error('Missing JWT_SECRET');
    err.code = 'MISSING_JWT_SECRET';
    throw err;
  }
};

const issueJwt = (user) => {
  requireJwtSecret();
  const role = normalizeRole(user.role);
  return jwt.sign({ id: user._id, email: user.email, name: user.name, role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

exports.issueJwt = issueJwt;

// Send OTP (Email)
exports.sendOtp = async (req, res) => {
  try {
    const { email, intent } = req.body;
    const purpose = intent === 'register' ? 'register' : 'login';

    const normalized = normalizeEmail(email);
    if (!normalized) {
      return res.status(400).json({ message: 'Valid email is required' });
    }

    const user = await User.findOne({ email: normalized }).select('name');
    const name = user ? user.name : null;

    const metadata = {
      userAgent: req.headers['user-agent'] || 'Unknown Device',
      ip: req.ip || req.connection.remoteAddress || 'Unknown Location',
    };

    const result = await sendEmailOtp({ email: normalized, purpose, name, metadata });
    res.json({ message: 'OTP sent', expiresAt: result.expiresAt });
  } catch (error) {
    if (error.code === 'OTP_RATE_LIMIT') {
      return res.status(429).json({
        message: error.message || 'Too many requests',
        retryAfterSeconds: error.retryAfterSeconds,
      });
    }
    res.status(500).json({ message: error.message || 'Failed to send OTP' });
  }
};

// Verify OTP and login/register user
exports.verifyOtp = async (req, res) => {
  try {
    const { email, code, intent, name } = req.body;
    const normalized = normalizeEmail(email);
    if (!normalized) return res.status(400).json({ message: 'Valid email is required' });
    if (!code) return res.status(400).json({ message: 'OTP code is required' });

    const mode = intent === 'register' ? 'register' : 'login';

    const verification = await verifyEmailOtp({ email: normalized, purpose: mode, code });
    if (!verification.ok) {
      const reason = verification.reason;
      const msg =
        reason === 'expired'
          ? 'OTP expired'
          : reason === 'too_many_attempts'
            ? 'Too many wrong attempts'
            : 'Invalid OTP';
      return res.status(400).json({ message: msg });
    }

    let user = await User.findOne({ email: normalized });

    if (mode === 'register') {
      if (!name) return res.status(400).json({ message: 'Name is required for registration' });
      if (user) return res.status(400).json({ message: 'Email already registered. Please login.' });

      user = new User({
        name: String(name).trim(),
        email: normalized,
        role: 'user',
      });

      await user.save();
    } else if (!user) {
      return res.status(404).json({ message: 'Account not found. Please register first.' });
    }

    const token = issueJwt(user);
    const role = normalizeRole(user.role);

    res.json({
      message: mode === 'register' ? 'Registration successful' : 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role },
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'OTP verification failed' });
  }
};

// Backwards-compatible endpoints (now OTP-based)
exports.registerUser = async (req, res) => {
  req.body.intent = 'register';
  return exports.verifyOtp(req, res);
};

exports.loginUser = async (req, res) => {
  req.body.intent = 'login';
  return exports.verifyOtp(req, res);
};

// Get User Profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const {
      name,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      zip,
      country,
    } = req.body || {};

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (typeof name === 'string' && name.trim()) {
      user.name = name.trim();
    }

    if (typeof phone === 'string') {
      const normalizedPhone = phone.trim();
      user.phone = normalizedPhone || undefined;
    }

    user.address = {
      ...(user.address || {}),
      addressLine1: typeof addressLine1 === 'string' ? addressLine1.trim() : user.address?.addressLine1,
      addressLine2: typeof addressLine2 === 'string' ? addressLine2.trim() : user.address?.addressLine2,
      city: typeof city === 'string' ? city.trim() : user.address?.city,
      state: typeof state === 'string' ? state.trim() : user.address?.state,
      zip: typeof zip === 'string' ? zip.trim() : user.address?.zip,
      country: typeof country === 'string' ? country.trim() : user.address?.country,
    };

    await user.save();

    return res.json({
      message: 'Profile updated',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: normalizeRole(user.role),
        address: user.address || {},
      },
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'Phone number is already in use' });
    }
    return res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};
 
// Admin: list users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

// Admin: get user by id
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
};

// Admin: update user
exports.updateUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { ...(name ? { name } : {}), ...(email ? { email } : {}), ...(role ? { role: normalizeRole(role) } : {}) },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User updated', user: updated });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
};

// Admin: delete user
exports.deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id).select('-password');
    if (!deleted) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};
