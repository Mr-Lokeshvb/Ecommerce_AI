const express = require('express');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const { auth, authorize } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');

const router = express.Router();

// @route   GET /api/seller/orders
// @desc    Get all orders for a seller
// @access  Private (Seller)
router.get('/', [auth, authorize('SELLER')], async (req, res) => {
    try {
        const orders = await Order.find({ 'items.seller': req.user.id }).populate('customer');
        res.json({ success: true, data: orders });
    } catch (error) {
        console.error('Get seller orders error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/seller/orders/:id/status
// @desc    Update order status
// @access  Private (Seller)
router.put('/:id/status', [auth, authorize('SELLER')], async (req, res) => {
    try {
        const { status, trackingNumber, carrier, estimatedDelivery } = req.body;
        
        // Validate status transition
        const validStatuses = ['pending', 'confirmed', 'packing', 'shipping', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const updateData = { status };
        
        // Add tracking info if status is shipping
        if (status === 'shipping') {
            if (trackingNumber) updateData.trackingNumber = trackingNumber;
            if (carrier) updateData.carrier = carrier;
            if (estimatedDelivery) updateData.estimatedDelivery = estimatedDelivery;
        }
        
        // Add delivery date if status is delivered
        if (status === 'delivered') {
            updateData.deliveredAt = new Date();
        }

        const order = await Order.findOneAndUpdate(
            { _id: req.params.id, 'items.seller': req.user.id },
            updateData,
            { new: true }
        ).populate('customer');
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        
        res.json({ success: true, message: 'Order status updated successfully', data: order });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/seller/orders/:id/return
// @desc    Approve/Reject return request
// @access  Private (Seller)
router.put('/:id/return', [auth, authorize('SELLER')], async (req, res) => {
    try {
        const { approve, note } = req.body;
        
        const order = await Order.findOne({ _id: req.params.id, 'items.seller': req.user.id });
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        
        if (!order.returnRequested) {
            return res.status(400).json({ success: false, message: 'No return request found' });
        }
        
        order.returnApproved = approve;
        order.returnApprovedAt = new Date();
        
        if (approve) {
            order.status = 'returned';
            order.statusTimeline.push({
                status: 'returned',
                timestamp: new Date(),
                note: note || 'Return approved by seller',
                updatedBy: req.user.id
            });
        } else {
            order.returnRequested = false;
            order.statusTimeline.push({
                status: order.status,
                timestamp: new Date(),
                note: note || 'Return rejected by seller',
                updatedBy: req.user.id
            });
        }
        
        await order.save();

        // Send email notification to customer
        try {
            const customer = await Customer.findById(order.customer);
            
            if (customer && customer.email) {
                if (approve) {
                    // Send approval email
                    await sendEmail({
                        to: customer.email,
                        subject: `Return Approved - Order #${order.orderNumber}`,
                        template: 'return-approved',
                        data: {
                            customerName: customer.name,
                            orderNumber: order.orderNumber,
                            refundAmount: order.total,
                            returnLabel: null // Can add return label URL if available
                        }
                    });
                    console.log('✅ Return approval email sent to customer');
                } else {
                    // Send rejection email
                    await sendEmail({
                        to: customer.email,
                        subject: `Return Request Update - Order #${order.orderNumber}`,
                        template: 'return-rejected',
                        data: {
                            customerName: customer.name,
                            orderNumber: order.orderNumber,
                            rejectionReason: note || 'The return request does not meet our return policy requirements.'
                        }
                    });
                    console.log('✅ Return rejection email sent to customer');
                }
            }
        } catch (emailError) {
            console.error('❌ Failed to send return decision email:', emailError);
            // Don't fail the operation if email fails
        }
        
        res.json({ success: true, message: approve ? 'Return approved' : 'Return rejected', data: order });
    } catch (error) {
        console.error('Process return error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/seller/orders/analytics
// @desc    Get order analytics for seller
// @access  Private (Seller)
router.get('/analytics', [auth, authorize('SELLER')], async (req, res) => {
    try {
        const orders = await Order.find({ 'items.seller': req.user.id });
        
        // Calculate analytics
        const totalOrders = orders.length;
        const totalRevenue = orders
            .filter(o => o.paymentStatus === 'paid')
            .reduce((sum, order) => {
                // Calculate seller's portion (sum of items where seller matches)
                const sellerItems = order.items.filter(item => 
                    item.seller.toString() === req.user.id
                );
                return sum + sellerItems.reduce((itemSum, item) => itemSum + item.total, 0);
            }, 0);
        
        const pendingOrders = orders.filter(o => o.status === 'pending').length;
        const packingOrders = orders.filter(o => o.status === 'packing').length;
        const shippingOrders = orders.filter(o => o.status === 'shipping').length;
        const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
        const returnRequests = orders.filter(o => o.returnRequested && !o.returnApproved).length;
        
        res.json({
            success: true,
            data: {
                totalOrders,
                totalRevenue,
                pendingOrders,
                packingOrders,
                shippingOrders,
                deliveredOrders,
                returnRequests
            }
        });
    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
