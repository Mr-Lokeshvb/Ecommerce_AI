const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const Customer = require('../models/Customer');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { auth, authorize } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

// Admin Authentication Middleware
const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'No authentication token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select('+password');

    if (!admin || !admin.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid authentication' });
    }

    // Check if account is locked
    if (admin.isLocked) {
      return res.status(423).json({ success: false, message: 'Account is locked due to too many failed login attempts' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid authentication token' });
  }
};

// Check specific permission
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin.permissions[permission] && req.admin.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    next();
  };
};

// @route   POST /api/admin/login
// @desc    Admin login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password, ipAddress } = req.body;

    // Find admin
    const admin = await Admin.findOne({ email }).select('+password');

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if account is locked
    if (admin.isLocked) {
      return res.status(423).json({ 
        success: false, 
        message: 'Account is locked due to too many failed login attempts. Try again later.' 
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    // Verify password
    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      await admin.incLoginAttempts();
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check IP whitelist if configured
    if (admin.allowedIPs && admin.allowedIPs.length > 0) {
      if (!admin.allowedIPs.includes(ipAddress)) {
        await admin.logActivity('FAILED_LOGIN_IP', 'SYSTEM', null, `Login attempt from unauthorized IP: ${ipAddress}`, ipAddress);
        return res.status(403).json({ success: false, message: 'Login from this IP address is not allowed' });
      }
    }

    // Reset login attempts on successful login
    if (admin.loginAttempts > 0 || admin.lockUntil) {
      await admin.updateOne({
        $set: { loginAttempts: 0 },
        $unset: { lockUntil: 1 }
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Log activity
    await admin.logActivity('LOGIN', 'SYSTEM', null, 'Successful login', ipAddress);

    // Generate token
    const token = jwt.sign(
      { id: admin._id, role: admin.role, type: 'ADMIN' },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      admin: admin.toJSON()
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// @route   POST /api/admin/register
// @desc    Create new admin (SUPER_ADMIN only)
// @access  Private (SUPER_ADMIN)
router.post('/register', adminAuth, async (req, res) => {
  try {
    // Only SUPER_ADMIN can create new admins
    if (req.admin.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Only Super Admin can create admin accounts' });
    }

    const { name, email, password, role, permissions, allowedIPs } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: 'Admin with this email already exists' });
    }

    // Create admin
    const admin = new Admin({
      name,
      email,
      password,
      role: role || 'ADMIN',
      permissions,
      allowedIPs,
      createdBy: req.admin._id
    });

    await admin.save();

    // Log activity
    await req.admin.logActivity('CREATE_ADMIN', 'SYSTEM', admin._id, `Created new admin: ${email}`, req.ip);

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      admin: admin.toJSON()
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({ success: false, message: 'Server error creating admin account' });
  }
});

// @route   GET /api/admin/me
// @desc    Get current admin profile
// @access  Private (Admin)
router.get('/me', adminAuth, async (req, res) => {
  res.json({
    success: true,
    admin: req.admin.toJSON()
  });
});

module.exports = router;
module.exports.adminAuth = adminAuth;
module.exports.checkPermission = checkPermission;
