const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Seller = require('../models/Seller');
const { adminAuth, checkPermission } = require('./admin');

// @route   GET /api/admin/users
// @desc    Get all users (customers and sellers)
// @access  Private (Admin)
router.get('/', adminAuth, checkPermission('manageUsers'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type = 'all', // 'customers', 'sellers', or 'all'
      search, 
      status, 
      verified,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    let customers = [];
    let sellers = [];
    let totalCustomers = 0;
    let totalSellers = 0;

    // Build filter
    const buildFilter = () => {
      const filter = {};
      
      if (search) {
        filter.$or = [
          { name: new RegExp(search, 'i') },
          { email: new RegExp(search, 'i') }
        ];
      }
      
      if (status === 'active') filter.isActive = true;
      if (status === 'inactive') filter.isActive = false;
      
      if (verified === 'true') filter.isEmailVerified = true;
      if (verified === 'false') filter.isEmailVerified = false;
      
      return filter;
    };

    const filter = buildFilter();

    // Fetch customers
    if (type === 'all' || type === 'customers') {
      [customers, totalCustomers] = await Promise.all([
        Customer.find(filter)
          .select('-password -passwordResetToken -emailVerificationToken')
          .sort({ [sortBy]: sortOrder })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Customer.countDocuments(filter)
      ]);
    }

    // Fetch sellers
    if (type === 'all' || type === 'sellers') {
      [sellers, totalSellers] = await Promise.all([
        Seller.find(filter)
          .select('-password -passwordResetToken -emailVerificationToken')
          .sort({ [sortBy]: sortOrder })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Seller.countDocuments(filter)
      ]);
    }

    // Combine and format results
    const users = [
      ...customers.map(c => ({ ...c, userType: 'CUSTOMER' })),
      ...sellers.map(s => ({ ...s, userType: 'SELLER' }))
    ];

    // Log activity
    await req.admin.logActivity('VIEW_USERS', 'USER', null, `Viewed users list (${type})`, req.ip);

    res.json({
      success: true,
      data: {
        users,
        stats: {
          totalCustomers,
          totalSellers,
          totalUsers: totalCustomers + totalSellers
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil((totalCustomers + totalSellers) / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching users' });
  }
});

// @route   GET /api/admin/users/stats
// @desc    Get user statistics
// @access  Private (Admin)
router.get('/stats', adminAuth, checkPermission('viewAnalytics'), async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalCustomers,
      totalSellers,
      activeCustomers,
      activeSellers,
      verifiedCustomers,
      verifiedSellers,
      newCustomersToday,
      newSellersToday,
      newCustomersWeek,
      newSellersWeek,
      newCustomersMonth,
      newSellersMonth
    ] = await Promise.all([
      Customer.countDocuments(),
      Seller.countDocuments(),
      Customer.countDocuments({ isActive: true }),
      Seller.countDocuments({ isActive: true }),
      Customer.countDocuments({ isEmailVerified: true }),
      Seller.countDocuments({ isEmailVerified: true }),
      Customer.countDocuments({ createdAt: { $gte: today } }),
      Seller.countDocuments({ createdAt: { $gte: today } }),
      Customer.countDocuments({ createdAt: { $gte: weekAgo } }),
      Seller.countDocuments({ createdAt: { $gte: weekAgo } }),
      Customer.countDocuments({ createdAt: { $gte: monthAgo } }),
      Seller.countDocuments({ createdAt: { $gte: monthAgo } })
    ]);

    res.json({
      success: true,
      stats: {
        total: {
          customers: totalCustomers,
          sellers: totalSellers,
          users: totalCustomers + totalSellers
        },
        active: {
          customers: activeCustomers,
          sellers: activeSellers,
          users: activeCustomers + activeSellers
        },
        verified: {
          customers: verifiedCustomers,
          sellers: verifiedSellers,
          users: verifiedCustomers + verifiedSellers
        },
        new: {
          today: {
            customers: newCustomersToday,
            sellers: newSellersToday,
            total: newCustomersToday + newSellersToday
          },
          week: {
            customers: newCustomersWeek,
            sellers: newSellersWeek,
            total: newCustomersWeek + newSellersWeek
          },
          month: {
            customers: newCustomersMonth,
            sellers: newSellersMonth,
            total: newCustomersMonth + newSellersMonth
          }
        }
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching statistics' });
  }
});

// @route   GET /api/admin/users/:type/:id
// @desc    Get specific user details
// @access  Private (Admin)
router.get('/:type/:id', adminAuth, checkPermission('manageUsers'), async (req, res) => {
  try {
    const { type, id } = req.params;
    let user;

    if (type === 'customer') {
      user = await Customer.findById(id).select('-password -passwordResetToken');
    } else if (type === 'seller') {
      user = await Seller.findById(id).select('-password -passwordResetToken');
    } else {
      return res.status(400).json({ success: false, message: 'Invalid user type' });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Log activity
    await req.admin.logActivity('VIEW_USER', type.toUpperCase(), user._id, `Viewed ${type} details`, req.ip);

    res.json({
      success: true,
      user: { ...user.toObject(), userType: type.toUpperCase() }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching user' });
  }
});

// @route   PATCH /api/admin/users/:type/:id/status
// @desc    Update user status (activate/deactivate)
// @access  Private (Admin)
router.patch('/:type/:id/status', adminAuth, checkPermission('manageUsers'), async (req, res) => {
  try {
    const { type, id } = req.params;
    const { isActive } = req.body;

    let Model = type === 'customer' ? Customer : Seller;
    const user = await Model.findById(id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isActive = isActive;
    await user.save();

    // Log activity
    await req.admin.logActivity(
      isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
      type.toUpperCase(),
      user._id,
      `${isActive ? 'Activated' : 'Deactivated'} ${type}: ${user.email}`,
      req.ip
    );

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ success: false, message: 'Server error updating user status' });
  }
});

// @route   PATCH /api/admin/users/:type/:id/verify
// @desc    Manually verify user email
// @access  Private (Admin)
router.patch('/:type/:id/verify', adminAuth, checkPermission('manageUsers'), async (req, res) => {
  try {
    const { type, id } = req.params;

    let Model = type === 'customer' ? Customer : Seller;
    const user = await Model.findById(id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationOTP = undefined;
    user.emailVerificationOTPExpires = undefined;
    await user.save();

    // Log activity
    await req.admin.logActivity('VERIFY_USER', type.toUpperCase(), user._id, `Verified ${type}: ${user.email}`, req.ip);

    res.json({
      success: true,
      message: 'User email verified successfully',
      user
    });
  } catch (error) {
    console.error('Verify user error:', error);
    res.status(500).json({ success: false, message: 'Server error verifying user' });
  }
});

// @route   DELETE /api/admin/users/:type/:id
// @desc    Delete user account
// @access  Private (Admin)
router.delete('/:type/:id', adminAuth, checkPermission('manageUsers'), async (req, res) => {
  try {
    const { type, id } = req.params;

    let Model = type === 'customer' ? Customer : Seller;
    const user = await Model.findById(id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userEmail = user.email;
    
    // Log activity BEFORE deletion
    await req.admin.logActivity('DELETE_USER', type.toUpperCase(), id, `Deleted ${type}: ${userEmail}`, req.ip);
    
    // Delete user
    await Model.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting user' });
  }
});

// @route   POST /api/admin/users/:type/:id/reset-password
// @desc    Reset user password
// @access  Private (Admin)
router.post('/:type/:id/reset-password', adminAuth, checkPermission('manageUsers'), async (req, res) => {
  try {
    const { type, id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    let Model = type === 'customer' ? Customer : Seller;
    const user = await Model.findById(id).select('+password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Log activity
    await req.admin.logActivity('RESET_PASSWORD', type.toUpperCase(), user._id, `Reset password for ${type}: ${user.email}`, req.ip);

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error resetting password' });
  }
});

module.exports = router;
