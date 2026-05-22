const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Seller = require('../models/Seller');
const { adminAuth, checkPermission } = require('./admin');

// @route   GET /api/admin/analytics/dashboard
// @desc    Get dashboard analytics
// @access  Private (Admin)
router.get('/dashboard', adminAuth, checkPermission('viewAnalytics'), async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalSellers,
      totalProducts,
      totalOrders,
      todayUsers,
      yesterdayUsers,
      todayOrders,
      yesterdayOrders,
      weekRevenue,
      monthRevenue,
      recentOrders,
      topProducts,
      recentUsers
    ] = await Promise.all([
      Customer.countDocuments(),
      Seller.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Customer.countDocuments({ createdAt: { $gte: today } }),
      Customer.countDocuments({ createdAt: { $gte: yesterday, $lt: today } }),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ createdAt: { $gte: yesterday, $lt: today } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: weekAgo }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: monthAgo }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.find()
        .populate('customer', 'name email')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Product.find({ status: 'active' })
        .sort({ salesCount: -1 })
        .limit(10)
        .lean(),
      Customer.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('name email createdAt')
        .lean()
    ]);

    // Calculate growth percentages
    const userGrowth = yesterdayUsers > 0 
      ? ((todayUsers - yesterdayUsers) / yesterdayUsers * 100).toFixed(2)
      : 100;
    
    const orderGrowth = yesterdayOrders > 0
      ? ((todayOrders - yesterdayOrders) / yesterdayOrders * 100).toFixed(2)
      : 100;

    res.json({
      success: true,
      analytics: {
        overview: {
          totalUsers,
          totalSellers,
          totalProducts,
          totalOrders,
          todayUsers,
          todayOrders,
          userGrowth: parseFloat(userGrowth),
          orderGrowth: parseFloat(orderGrowth)
        },
        revenue: {
          week: weekRevenue[0]?.total || 0,
          month: monthRevenue[0]?.total || 0
        },
        recentOrders,
        topProducts,
        recentUsers
      }
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching analytics' });
  }
});

// @route   GET /api/admin/analytics/revenue
// @desc    Get revenue analytics
// @access  Private (Admin)
router.get('/revenue', adminAuth, checkPermission('viewAnalytics'), async (req, res) => {
  try {
    const { period = 'month' } = req.query; // day, week, month, year

    const now = new Date();
    let startDate;
    let groupBy;

    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        groupBy = { $hour: '$createdAt' };
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupBy = { $dayOfWeek: '$createdAt' };
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        groupBy = { $month: '$createdAt' };
        break;
      default: // month
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        groupBy = { $dayOfMonth: '$createdAt' };
    }

    const revenueData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get total revenue and comparison
    const [currentPeriod, previousPeriod] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(startDate.getTime() - (now.getTime() - startDate.getTime())),
              $lt: startDate
            },
            status: { $ne: 'cancelled' }
          }
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    const currentRevenue = currentPeriod[0]?.total || 0;
    const previousRevenue = previousPeriod[0]?.total || 0;
    const growth = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(2)
      : 100;

    res.json({
      success: true,
      data: {
        period,
        revenueData,
        summary: {
          current: currentRevenue,
          previous: previousRevenue,
          growth: parseFloat(growth)
        }
      }
    });
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching revenue analytics' });
  }
});

// @route   GET /api/admin/analytics/products
// @desc    Get product analytics
// @access  Private (Admin)
router.get('/products', adminAuth, checkPermission('viewAnalytics'), async (req, res) => {
  try {
    const [
      topSellingProducts,
      categoryDistribution,
      stockStatus,
      priceRanges
    ] = await Promise.all([
      Product.find({ status: 'active' })
        .sort({ salesCount: -1 })
        .limit(20)
        .populate('seller', 'storeName')
        .lean(),
      Product.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 }, revenue: { $sum: { $multiply: ['$price', '$salesCount'] } } } },
        { $sort: { revenue: -1 } }
      ]),
      Product.aggregate([
        {
          $project: {
            status: {
              $cond: [
                { $eq: ['$stock', 0] },
                'out_of_stock',
                { $cond: [{ $lte: ['$stock', 10] }, 'low_stock', 'in_stock'] }
              ]
            }
          }
        },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Product.aggregate([
        {
          $bucket: {
            groupBy: '$price',
            boundaries: [0, 50, 100, 200, 500, 1000, 5000],
            default: '5000+',
            output: { count: { $sum: 1 } }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      analytics: {
        topSellingProducts,
        categoryDistribution,
        stockStatus,
        priceRanges
      }
    });
  } catch (error) {
    console.error('Get product analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching product analytics' });
  }
});

// @route   GET /api/admin/analytics/sellers
// @desc    Get seller analytics
// @access  Private (Admin)
router.get('/sellers', adminAuth, checkPermission('viewAnalytics'), async (req, res) => {
  try {
    const [topSellers, sellerStats] = await Promise.all([
      Product.aggregate([
        { $group: { _id: '$seller', productCount: { $sum: 1 }, totalSales: { $sum: '$salesCount' } } },
        { $sort: { totalSales: -1 } },
        { $limit: 20 },
        {
          $lookup: {
            from: 'sellers',
            localField: '_id',
            foreignField: '_id',
            as: 'sellerInfo'
          }
        },
        { $unwind: '$sellerInfo' },
        {
          $project: {
            storeName: '$sellerInfo.storeName',
            email: '$sellerInfo.email',
            productCount: 1,
            totalSales: 1
          }
        }
      ]),
      Seller.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: ['$isActive', 1, 0] } },
            verified: { $sum: { $cond: ['$isEmailVerified', 1, 0] } }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      analytics: {
        topSellers,
        stats: sellerStats[0] || { total: 0, active: 0, verified: 0 }
      }
    });
  } catch (error) {
    console.error('Get seller analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching seller analytics' });
  }
});

// @route   GET /api/admin/analytics/export
// @desc    Export analytics data
// @access  Private (Admin)
router.get('/export', adminAuth, checkPermission('viewAnalytics'), async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;

    const filter = {};
    if (startDate) filter.createdAt = { $gte: new Date(startDate) };
    if (endDate) filter.createdAt = { ...filter.createdAt, $lte: new Date(endDate) };

    let data;

    switch (type) {
      case 'orders':
        data = await Order.find(filter)
          .populate('customer', 'name email')
          .lean();
        break;
      case 'users':
        data = await Customer.find(filter).lean();
        break;
      case 'sellers':
        data = await Seller.find(filter).lean();
        break;
      case 'products':
        data = await Product.find(filter).populate('seller', 'storeName').lean();
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid export type' });
    }

    // Log activity
    await req.admin.logActivity('EXPORT_DATA', 'SYSTEM', null, `Exported ${type} data`, req.ip);

    res.json({
      success: true,
      data,
      exportedAt: new Date(),
      recordCount: data.length
    });
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ success: false, message: 'Server error exporting data' });
  }
});

module.exports = router;
