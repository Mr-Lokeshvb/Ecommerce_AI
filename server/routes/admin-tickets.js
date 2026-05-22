const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const { adminAuth, checkPermission } = require('./admin');

// @route   GET /api/admin/tickets
// @desc    Get all support tickets
// @access  Private (Admin)
router.get('/', adminAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      category,
      search,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    // Build filter
    const filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    if (search) {
      filter.$or = [
        { subject: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { ticketNumber: new RegExp(search, 'i') }
      ];
    }

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .populate({ path: 'customer', select: 'name email', strictPopulate: false })
        // Skip assignedAgent populate since SupportAgent model may not be loaded
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Ticket.countDocuments(filter)
    ]);

    // Get statistics
    const stats = await Ticket.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusCounts = {
      open: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0
    };

    stats.forEach(stat => {
      statusCounts[stat._id] = stat.count;
    });

    // Log activity
    await req.admin.logActivity('VIEW_TICKETS', 'TICKET', null, 'Viewed support tickets', req.ip);

    res.json({
      success: true,
      data: {
        tickets,
        stats: statusCounts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalTickets: total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching tickets',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/admin/tickets/:id
// @desc    Get ticket details
// @access  Private (Admin)
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('assignedTo', 'name email')
      .populate('messages.sender', 'name email')
      .lean();

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Log activity
    await req.admin.logActivity('VIEW_TICKET', 'TICKET', ticket._id, `Viewed ticket: ${ticket.ticketNumber}`, req.ip);

    res.json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching ticket' });
  }
});

// @route   PATCH /api/admin/tickets/:id/status
// @desc    Update ticket status
// @access  Private (Admin)
router.patch('/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const oldStatus = ticket.status;
    ticket.status = status;

    if (status === 'resolved' || status === 'closed') {
      ticket.resolvedAt = new Date();
    }

    await ticket.save();

    // Log activity
    await req.admin.logActivity(
      'UPDATE_TICKET_STATUS',
      'TICKET',
      ticket._id,
      `Changed ticket ${ticket.ticketNumber} status from ${oldStatus} to ${status}`,
      req.ip
    );

    res.json({
      success: true,
      message: 'Ticket status updated successfully',
      ticket
    });
  } catch (error) {
    console.error('Update ticket status error:', error);
    res.status(500).json({ success: false, message: 'Server error updating ticket status' });
  }
});

// @route   PATCH /api/admin/tickets/:id/assign
// @desc    Assign ticket to support agent
// @access  Private (Admin)
router.patch('/:id/assign', adminAuth, async (req, res) => {
  try {
    const { agentId } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    ticket.assignedTo = agentId;
    if (ticket.status === 'open') {
      ticket.status = 'inProgress';
    }

    await ticket.save();

    // Log activity
    await req.admin.logActivity(
      'ASSIGN_TICKET',
      'TICKET',
      ticket._id,
      `Assigned ticket ${ticket.ticketNumber} to agent`,
      req.ip
    );

    res.json({
      success: true,
      message: 'Ticket assigned successfully',
      ticket
    });
  } catch (error) {
    console.error('Assign ticket error:', error);
    res.status(500).json({ success: false, message: 'Server error assigning ticket' });
  }
});

// @route   POST /api/admin/tickets/:id/message
// @desc    Add message to ticket
// @access  Private (Admin)
router.post('/:id/message', adminAuth, async (req, res) => {
  try {
    const { message } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    ticket.messages.push({
      sender: req.admin._id,
      senderModel: 'Admin',
      message,
      isInternal: false
    });

    await ticket.save();

    // Log activity
    await req.admin.logActivity(
      'ADD_TICKET_MESSAGE',
      'TICKET',
      ticket._id,
      `Added message to ticket ${ticket.ticketNumber}`,
      req.ip
    );

    res.json({
      success: true,
      message: 'Message added successfully',
      ticket
    });
  } catch (error) {
    console.error('Add ticket message error:', error);
    res.status(500).json({ success: false, message: 'Server error adding message' });
  }
});

module.exports = router;
