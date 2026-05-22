const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Shipment = require('../models/Shipment');
const Customer = require('../models/Customer');
const Seller = require('../models/Seller');
const { auth, authorize } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');

const router = express.Router();

// @route   POST /api/orders/create
// @desc    Create a new order (simple flow without payment gateway)
// @access  Private
router.post('/create', auth, async (req, res) => {
  try {
    const { items, shippingAddress, billingAddress, paymentMethod, subtotal, tax, shipping, total } = req.body;
    const userId = req.user.id;

    console.log('📦 Creating order for user:', userId);
    console.log('📋 Order items:', items?.length);

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item'
      });
    }

    // Validate shipping address
    if (!shippingAddress || !shippingAddress.address || !shippingAddress.city) {
      return res.status(400).json({
        success: false,
        message: 'Valid shipping address is required'
      });
    }

    // Generate order number
    const orderCount = await Order.countDocuments();
    const orderNumber = `ORD-${Date.now()}-${(orderCount + 1).toString().padStart(4, '0')}`;

    // Create order
    const order = new Order({
      orderNumber,  // Explicitly set order number
      customer: userId,
      items: items.map(item => {
        // Extract seller ID if it's an object
        const sellerId = typeof item.seller === 'object' ? item.seller._id || item.seller : item.seller;
        console.log(`  - Item: ${item.title}, Seller: ${sellerId}`);
        return {
          productId: item.productId,
          seller: sellerId,
          title: item.title,
          image: item.image,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          price: item.price,
          total: item.total
        };
      }),
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod: paymentMethod || 'cod',
      subtotal,
      tax,
      shipping: shipping || 0,
      total,
      status: 'placed',
      paymentStatus: 'paid' // Mark as paid for simple flow
    });

    await order.save();

    console.log('✅ Order created successfully:', order._id);
    console.log('📋 Order details:', {
      orderNumber: order.orderNumber,
      customer: order.customer,
      itemCount: order.items.length,
      total: order.total,
      sellers: [...new Set(order.items.map(i => i.seller.toString()))]
    });

    // Clear user's cart
    await Cart.findOneAndUpdate(
      { userId },
      { items: [], subtotal: 0, tax: 0, total: 0 }
    );

    // Send email notifications
    try {
      // Get customer info
      const customer = await Customer.findById(userId);
      
      if (customer && customer.email) {
        // Send order confirmation email to customer
        await sendEmail({
          to: customer.email,
          subject: `Order Confirmation - ${orderNumber}`,
          template: 'order-confirmation',
          data: {
            name: customer.name,
            orderNumber,
            items: order.items,
            total: order.total,
            shippingAddress: order.shippingAddress
          }
        });
        console.log('✅ Order confirmation email sent to customer');
      }

      // Send notification emails to sellers
      const sellerIds = [...new Set(order.items.map(item => item.seller.toString()))];
      
      for (const sellerId of sellerIds) {
        const seller = await Seller.findById(sellerId);
        if (seller && seller.email) {
          // Get items for this seller
          const sellerItems = order.items.filter(item => item.seller.toString() === sellerId);
          const sellerTotal = sellerItems.reduce((sum, item) => sum + item.total, 0);
          const sellerEarnings = sellerTotal * 0.85; // Assuming 15% commission
          
          await sendEmail({
            to: seller.email,
            subject: `New Order Received - ${orderNumber}`,
            template: 'seller-new-order',
            data: {
              sellerName: seller.name,
              orderNumber,
              items: sellerItems,
              sellerEarnings
            }
          });
          console.log(`✅ New order email sent to seller: ${seller.email}`);
        }
      }
    } catch (emailError) {
      console.error('❌ Failed to send order emails:', emailError);
      // Don't fail the order creation if email fails
    }

    res.json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    console.error('❌ Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
});

// @route   GET /api/orders
// @desc    Get user's orders or seller's orders
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let filter = {};

    if (req.user.role === 'CUSTOMER') {
      filter.customer = req.user.id;  // Changed from userId to customer
    } else if (req.user.role === 'SELLER') {
      filter['items.seller'] = req.user.id;  // Changed from sellerId to seller
    }

    if (status) {
      filter.status = status;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('customer', 'name email')  // Changed from userId to customer
        .populate('items.productId', 'title images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Order.countDocuments(filter)
    ]);

    // Filter items for sellers to show only their products
    if (req.user.role === 'SELLER') {
      orders.forEach(order => {
        order.items = order.items.filter(item => 
          item.seller.toString() === req.user.id  // Changed from sellerId to seller
        );
      });
    }

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
    res.status(500).json({
      success: false,
      message: 'Server error fetching orders'
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email')  // Changed from userId to customer
      .populate('items.productId', 'title images')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check authorization
    const isOwner = order.customer._id.toString() === req.user.id;  // Changed from userId to customer
    const isSeller = req.user.role === 'SELLER' && 
      order.items.some(item => item.seller.toString() === req.user.id);  // Changed from sellerId to seller
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isSeller && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    // Filter items for sellers
    if (req.user.role === 'SELLER' && !isAdmin) {
      order.items = order.items.filter(item => 
        item.seller.toString() === req.user.id  // Changed from sellerId to seller
      );
    }

    // Get shipment info if exists
    const shipment = await Shipment.findOne({ orderId: order._id }).lean();

    res.json({
      success: true,
      data: {
        order,
        shipment
      }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching order'
    });
  }
});

// @route   PATCH /api/orders/:id/status
// @desc    Update order status
// @access  Private (Seller/Admin only)
router.patch('/:id/status', [
  auth,
  authorize('SELLER', 'ADMIN'),
  body('status').isIn(['confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status'),
  body('trackingNumber').optional().trim().isLength({ min: 5 }).withMessage('Invalid tracking number'),
  body('carrier').optional().isIn(['fedex', 'ups', 'usps', 'dhl', 'other']).withMessage('Invalid carrier')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { status, trackingNumber, carrier, note } = req.body;
    
    const order = await Order.findById(req.params.id).populate('customer', 'name email');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if seller owns items in this order
    if (req.user.role === 'SELLER') {
      const hasSellerItems = order.items.some(item => 
        item.seller.toString() === req.user.id
      );
      
      if (!hasSellerItems) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this order'
        });
      }
    }

    // Update order status
    const previousStatus = order.status;
    order.status = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (carrier) order.carrier = carrier;

    // Add to status timeline
    order.statusTimeline.push({
      status,
      timestamp: new Date(),
      note,
      updatedBy: req.user.id
    });

    await order.save();

    // Send email notifications based on status
    try {
      const customer = order.customer;
      
      if (customer && customer.email) {
        let emailTemplate = null;
        let emailSubject = '';
        let emailData = {
          name: customer.name,
          orderNumber: order.orderNumber,
          status
        };

        // Determine which email to send
        if (status === 'shipped' && trackingNumber && carrier) {
          // Create or update shipment
          let shipment = await Shipment.findOne({ orderId: order._id });
          
          if (!shipment) {
            shipment = new Shipment({
              orderId: order._id,
              trackingNumber,
              carrier,
              status: 'picked_up',
              shippingAddress: order.shippingAddress
            });
          } else {
            shipment.status = 'picked_up';
            shipment.trackingNumber = trackingNumber;
            shipment.carrier = carrier;
          }
          
          await shipment.save();

          // Send shipping notification
          emailTemplate = 'order-shipped';
          emailSubject = `Your Order Has Shipped - ${order.orderNumber}`;
          emailData = {
            ...emailData,
            trackingNumber,
            carrier: carrier.toUpperCase(),
            estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString()
          };
        } else if (status === 'delivered') {
          // Send delivery confirmation
          emailTemplate = 'order-delivered';
          emailSubject = `Order Delivered - ${order.orderNumber}`;
          emailData = {
            ...emailData,
            deliveryDate: new Date().toLocaleDateString(),
            deliveryAddress: `${order.shippingAddress.address}, ${order.shippingAddress.city}`
          };
        } else if (status === 'confirmed') {
          // Send order confirmation email when seller confirms
          emailTemplate = 'order-confirmed-by-seller';
          emailSubject = `Order Confirmed - ${order.orderNumber}`;
          emailData = {
            ...emailData
          };
        } else {
          // Send generic status update for other statuses
          emailTemplate = 'order-status-update';
          emailSubject = `Order Status Update - ${order.orderNumber}`;
          
          // Add status-specific messages
          const statusMessages = {
            'packing': 'Your order is being carefully packed.',
            'cancelled': 'Your order has been cancelled. If you have any questions, please contact us.',
            'placed': 'Your order is pending seller confirmation.',
            'processing': 'Your order is being processed.'
          };
          
          emailData.statusMessage = statusMessages[status] || `Your order status has been updated to ${status}.`;
        }

        // Send the email if template is determined
        if (emailTemplate) {
          await sendEmail({
            to: customer.email,
            subject: emailSubject,
            template: emailTemplate,
            data: emailData
          });
          console.log(`✅ Order status email sent to customer: ${emailTemplate}`);
        }
      }
    } catch (emailError) {
      console.error('❌ Failed to send status update email:', emailError);
      // Don't fail the status update if email fails
    }

    // Emit socket event
    if (req.io) {
      req.io.to(`user-${order.userId._id}`).emit('order-updated', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        trackingNumber: order.trackingNumber
      });
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating order status'
    });
  }
});

// @route   GET /api/orders/track/:trackingNumber
// @desc    Track order by tracking number
// @access  Public
router.get('/track/:trackingNumber', async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    
    const shipment = await Shipment.findOne({ trackingNumber })
      .populate({
        path: 'orderId',
        select: 'orderNumber status items shippingAddress',
        populate: {
          path: 'items.productId',
          select: 'title images'
        }
      })
      .lean();

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Tracking number not found'
      });
    }

    res.json({
      success: true,
      data: { shipment }
    });
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error tracking order'
    });
  }
});

// @route   PUT /api/orders/:id/return
// @desc    Request return for a delivered order
// @access  Private (Customer)
router.put('/:id/return', auth, async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a reason for return'
      });
    }

    const order = await Order.findById(req.params.id)
      .populate('items.productId', 'name images')
      .populate('customer', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order belongs to the customer
    if (order.customer._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    // Check if order is delivered
    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Only delivered orders can be returned'
      });
    }

    // Check if return already requested
    if (order.returnRequested) {
      return res.status(400).json({
        success: false,
        message: 'Return already requested for this order'
      });
    }

    // Check if order was delivered within return window (e.g., 30 days)
    const deliveredDate = order.deliveredAt || order.updatedAt;
    const currentDate = new Date();
    const daysSinceDelivery = Math.floor((currentDate - deliveredDate) / (1000 * 60 * 60 * 24));
    
    if (daysSinceDelivery > 30) {
      return res.status(400).json({
        success: false,
        message: 'Return window has expired. Returns are only accepted within 30 days of delivery.'
      });
    }

    order.returnRequested = true;
    order.returnReason = reason;
    order.returnRequestedAt = new Date();

    await order.save();

    // Send email notifications
    try {
      // Send confirmation to customer
      await sendEmail({
        to: order.customer.email,
        subject: `Return Request Confirmed - Order #${order.orderNumber}`,
        template: 'return-request-confirmation',
        data: {
          customerName: order.customer.name,
          orderNumber: order.orderNumber,
          returnReason: reason,
          orderTotal: order.total
        }
      });
      console.log('✅ Return request confirmation email sent to customer');

      // Send notification to sellers
      const sellerIds = order.items && order.items.length > 0 
        ? [...new Set(order.items.map(item => item.seller?.toString()).filter(Boolean))]
        : [];
      
      for (const sellerId of sellerIds) {
        const seller = await Seller.findById(sellerId);
        if (seller && seller.email) {
          await sendEmail({
            to: seller.email,
            subject: `Return Request Received - Order #${order.orderNumber}`,
            template: 'seller-return-notification',
            data: {
              sellerName: seller.name,
              customerName: order.customer.name,
              orderNumber: order.orderNumber,
              returnReason: reason,
              orderTotal: order.total
            }
          });
          console.log(`✅ Return request notification sent to seller: ${seller.email}`);
        }
      }
    } catch (emailError) {
      console.error('❌ Return notification email error:', emailError);
      // Continue without failing the request
    }

    res.json({
      success: true,
      message: 'Return request submitted successfully. The seller will review your request.',
      data: order
    });
  } catch (error) {
    console.error('Request return error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing return request',
      error: error.message
    });
  }
});

module.exports = router;