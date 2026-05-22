const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const { auth } = require('../middleware/auth');

// @route   POST /api/tickets
// @desc    Create a new support ticket
// @access  Private (Customer)
router.post('/', auth, async (req, res) => {
  try {
    const { subject, description, category, priority } = req.body;

    // Validate required fields
    if (!subject || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide subject, description, and category'
      });
    }

    // Create ticket
    const ticket = new Ticket({
      customer: req.user._id,
      subject,
      description,
      category,
      priority: priority || 'medium',
      status: 'open'
    });

    await ticket.save();

    // Populate customer details
    await ticket.populate('customer', 'name email');

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      data: { ticket }
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating ticket'
    });
  }
});

// @route   GET /api/tickets/my-tickets
// @desc    Get customer's own tickets
// @access  Private (Customer)
router.get('/my-tickets', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build filter
    const filter = { customer: req.user._id };
    if (status) filter.status = status;

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Ticket.countDocuments(filter)
    ]);

    // Get statistics
    const stats = await Ticket.aggregate([
      { $match: { customer: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusCounts = {
      open: 0,
      assigned: 0,
      'in-progress': 0,
      'waiting-customer': 0,
      resolved: 0,
      closed: 0
    };

    stats.forEach(stat => {
      statusCounts[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        stats: statusCounts
      }
    });
  } catch (error) {
    console.error('Get my tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching tickets'
    });
  }
});

// @route   GET /api/tickets/:ticketNumber
// @desc    Get ticket by ticket number
// @access  Private (Customer - own tickets only)
router.get('/:ticketNumber', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ 
      ticketNumber: req.params.ticketNumber 
    }).lean();

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Check if ticket belongs to current user
    if (ticket.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this ticket'
      });
    }

    res.json({
      success: true,
      data: { ticket }
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching ticket'
    });
  }
});

// @route   POST /api/tickets/:ticketNumber/message
// @desc    Add message to ticket
// @access  Private (Customer)
router.post('/:ticketNumber/message', auth, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const ticket = await Ticket.findOne({ 
      ticketNumber: req.params.ticketNumber 
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Check if ticket belongs to current user
    if (ticket.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this ticket'
      });
    }

    // Add message
    ticket.messages.push({
      sender: req.user._id,
      senderType: 'customer',
      message,
      attachments: []
    });

    // If ticket was waiting for customer, change status to in-progress
    if (ticket.status === 'waiting-customer') {
      ticket.status = 'in-progress';
    }

    await ticket.save();

    res.json({
      success: true,
      message: 'Message added successfully',
      data: { ticket }
    });
  } catch (error) {
    console.error('Add message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding message'
    });
  }
});

module.exports = router;
