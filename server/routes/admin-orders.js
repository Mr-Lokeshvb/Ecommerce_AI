const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { adminAuth, checkPermission } = require('./admin');

// @route   GET /api/admin/orders
// @desc    Get all orders
// @access  Private (Admin)
router.get('/', adminAuth, checkPermission('manageOrders'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    // Build filter
    const filter = {};

    if (status) filter.status = status;

    if (search) {
      filter.$or = [
        { orderNumber: new RegExp(search, 'i') }
      ];
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    if (minAmount || maxAmount) {
      filter.totalAmount = {};
      if (minAmount) filter.totalAmount.$gte = parseFloat(minAmount);
      if (maxAmount) filter.totalAmount.$lte = parseFloat(maxAmount);
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate({ path: 'customer', select: 'name email', strictPopulate: false })
        .populate({ path: 'items.product', select: 'title name basePrice price images', strictPopulate: false })
        .populate({ path: 'items.seller', select: 'storeName name email', strictPopulate: false })
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Order.countDocuments(filter)
    ]);

    // Log activity
    await req.admin.logActivity('VIEW_ORDERS', 'ORDER', null, 'Viewed orders list', req.ip);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalOrders: total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching orders' });
  }
});

// @route   GET /api/admin/orders/stats
// @desc    Get order statistics
// @access  Private (Admin)
router.get('/stats', adminAuth, checkPermission('viewAnalytics'), async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      todayOrders,
      weekOrders,
      monthOrders,
      revenueStats,
      topCustomers
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'processing' }),
      Order.countDocuments({ status: 'shipped' }),
      Order.countDocuments({ status: 'delivered' }),
      Order.countDocuments({ status: 'cancelled' }),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ createdAt: { $gte: weekAgo } }),
      Order.countDocuments({ createdAt: { $gte: monthAgo } }),
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            avgOrderValue: { $avg: '$totalAmount' }
          }
        }
      ]),
      Order.aggregate([
        { $group: { _id: '$customer', orderCount: { $sum: 1 }, totalSpent: { $sum: '$totalAmount' } } },
        { $sort: { totalSpent: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'customers',
            localField: '_id',
            foreignField: '_id',
            as: 'customerInfo'
          }
        },
        { $unwind: '$customerInfo' },
        {
          $project: {
            name: '$customerInfo.name',
            email: '$customerInfo.email',
            orderCount: 1,
            totalSpent: 1
          }
        }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        total: totalOrders,
        byStatus: {
          pending: pendingOrders,
          processing: processingOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders
        },
        new: {
          today: todayOrders,
          week: weekOrders,
          month: monthOrders
        },
        revenue: {
          total: revenueStats[0]?.totalRevenue || 0,
          average: revenueStats[0]?.avgOrderValue || 0
        },
        topCustomers
      }
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching statistics' });
  }
});

// @route   GET /api/admin/orders/:id
// @desc    Get order details
// @access  Private (Admin)
router.get('/:id', adminAuth, checkPermission('manageOrders'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('items.product', 'name price images')
      .populate('items.seller', 'storeName email phone')
      .lean();

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Log activity
    await req.admin.logActivity('VIEW_ORDER', 'ORDER', order._id, `Viewed order: ${order.orderNumber}`, req.ip);

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching order' });
  }
});

// @route   PATCH /api/admin/orders/:id/status
// @desc    Update order status
// @access  Private (Admin)
router.patch('/:id/status', adminAuth, checkPermission('manageOrders'), async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    order.status = status;
    await order.save();

    // Log activity
    await req.admin.logActivity('UPDATE_ORDER_STATUS', 'ORDER', order._id, `Changed status to ${status}: ${order.orderNumber}`, req.ip);

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, message: 'Server error updating order status' });
  }
});

// @route   POST /api/admin/orders/:id/cancel
// @desc    Cancel order
// @access  Private (Admin)
router.post('/:id/cancel', adminAuth, checkPermission('manageOrders'), async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status === 'delivered' || order.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot cancel this order' });
    }

    order.status = 'cancelled';
    order.cancelReason = reason || 'Cancelled by admin';
    order.cancelledAt = new Date();
    await order.save();

    // Log activity
    await req.admin.logActivity('CANCEL_ORDER', 'ORDER', order._id, `Cancelled order: ${order.orderNumber}`, req.ip);

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ success: false, message: 'Server error cancelling order' });
  }
});

// @route   POST /api/admin/orders/:id/refund
// @desc    Issue refund for order
// @access  Private (Admin)
router.post('/:id/refund', adminAuth, checkPermission('manageOrders'), async (req, res) => {
  try {
    const { amount, reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const refundAmount = amount || order.totalAmount;

    if (refundAmount > order.totalAmount) {
      return res.status(400).json({ success: false, message: 'Refund amount cannot exceed order total' });
    }

    order.status = 'refunded';
    order.refundAmount = refundAmount;
    order.refundReason = reason || 'Refunded by admin';
    order.refundedAt = new Date();
    await order.save();

    // Log activity
    await req.admin.logActivity('REFUND_ORDER', 'ORDER', order._id, `Refunded $${refundAmount} for order: ${order.orderNumber}`, req.ip);

    res.json({
      success: true,
      message: 'Refund issued successfully',
      order
    });
  } catch (error) {
    console.error('Refund order error:', error);
    res.status(500).json({ success: false, message: 'Server error issuing refund' });
  }
});

module.exports = router;
