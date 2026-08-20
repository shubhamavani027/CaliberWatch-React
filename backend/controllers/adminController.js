const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Order = require('../models/Order');
const Setting = require('../models/Setting');

const normalizeRole = (role) => (role === 'admin' ? 'admin' : 'user');
const ALLOWED_ADMIN_EMAILS = ['tirthkumbhani11@gmail.com', 'dhruvilkyada483@gmail.com'];
const isAllowedAdminEmail = (email) => ALLOWED_ADMIN_EMAILS.includes(String(email || '').toLowerCase());

// Admin login (role-based)
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const role = normalizeRole(user.role);
    if (role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    if (!isAllowedAdminEmail(user.email)) {
      return res.status(403).json({ message: 'This email is not allowed to access the admin panel' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name, role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Admin login successful',
      token,
      admin: { id: user._id, name: user.name, email: user.email, role },
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// Admin profile
exports.getAdminProfile = async (req, res) => {
  try {
    const user = await User.findById(req.admin.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    if (normalizeRole(user.role) !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    const usersWithStatus = users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      verified: u.verified || false,
      createdAt: u.createdAt,
      totalOrders: 0,
    }));
    res.json(usersWithStatus);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};

// Get analytics
exports.getAnalytics = async (req, res) => {
  try {
    const users = await User.find();
    const orders = await Order.find();

    const totalRevenue = orders.reduce((sum, order) => {
      return sum + Number(order.totalPrice || order.total || 0);
    }, 0);

    const ordersByStatus = {};
    const monthlyOrderData = {};
    const monthlyRevenueData = {};
    const userGrowthData = {};

    users.forEach((user) => {
      const date = new Date(user.createdAt || new Date());
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      userGrowthData[monthKey] = (userGrowthData[monthKey] || 0) + 1;
    });

    orders.forEach((order) => {
      const status = order.status || 'pending';
      ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;

      const date = new Date(order.createdAt || new Date());
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      monthlyOrderData[monthKey] = (monthlyOrderData[monthKey] || 0) + 1;
      
      const orderValue = Number(order.totalPrice || order.total || 0);
      monthlyRevenueData[monthKey] = (monthlyRevenueData[monthKey] || 0) + orderValue;
    });

    res.json({
      totalUsers: users.length,
      totalOrders: orders.length,
      totalRevenue,
      ordersByStatus,
      monthlyOrderData,
      monthlyRevenueData,
      userGrowthData,
      avgOrderValue: orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
};

// Get settings
exports.getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching settings', error: error.message });
  }
};

// Update settings
exports.updateSettings = async (req, res) => {
  try {
    const { storeName, supportEmail, enableNotifications, autoConfirmOrders, maintenanceMode } = req.body;
    let settings = await Setting.findOne();
    
    if (!settings) {
      settings = await Setting.create(req.body);
    } else {
      if (storeName !== undefined) settings.storeName = storeName;
      if (supportEmail !== undefined) settings.supportEmail = supportEmail;
      if (enableNotifications !== undefined) settings.enableNotifications = enableNotifications;
      if (autoConfirmOrders !== undefined) settings.autoConfirmOrders = autoConfirmOrders;
      if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;
      await settings.save();
    }
    
    res.json({ message: 'Settings updated successfully', settings });
  } catch (error) {
    res.status(500).json({ message: 'Error updating settings', error: error.message });
  }
};
