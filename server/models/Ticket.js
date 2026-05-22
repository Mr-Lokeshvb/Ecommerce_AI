const mongoose = require('mongoose');

const ticketMessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'messages.senderModel',
    required: true
  },
  senderModel: {
    type: String,
    enum: ['Customer', 'SupportAgent', 'Seller'],
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  senderType: {
    type: String,
    enum: ['customer', 'agent', 'system'],
    required: true
  },
  message: {
    type: String,
    required: true,
    maxlength: 5000
  },
  attachments: [{
    url: String,
    name: String,
    size: Number,
    type: String
  }],
  isInternal: {
    type: Boolean,
    default: false // true for internal agent notes
  },
  readBy: [{
    user: mongoose.Schema.Types.ObjectId,
    readAt: Date
  }]
}, {
  timestamps: true
});

const ticketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  assignedAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SupportAgent',
    default: null
  },
  
  // Ticket Details
  subject: {
    type: String,
    required: [true, 'Ticket subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Ticket description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    required: true,
    enum: ['Product', 'Order', 'Payment', 'Shipping', 'Return', 'Technical', 'Account', 'Other'],
    default: 'Other'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'assigned', 'in-progress', 'waiting-customer', 'resolved', 'closed'],
    default: 'open'
  },
  
  // Related Context
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  chatId: {
    type: String,
    default: null // Link to AI chat conversation that created this ticket
  },
  chatTranscript: {
    type: String,
    default: '' // Store the chat history that led to ticket creation
  },
  
  // Conversation
  messages: [ticketMessageSchema],
  
  // Metadata
  tags: [String],
  
  // Customer Feedback
  satisfaction: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  feedbackComment: {
    type: String,
    maxlength: 1000
  },
  feedbackSubmittedAt: Date,
  
  // Timing Metrics
  firstResponseAt: Date,
  resolvedAt: Date,
  closedAt: Date,
  
  // SLA Tracking
  slaDeadline: Date, // When ticket must be responded to
  slaBreach: {
    type: Boolean,
    default: false
  },
  
  // Assignment History
  assignmentHistory: [{
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SupportAgent'
    },
    assignedAt: Date,
    unassignedAt: Date,
    reason: String
  }],
  
  // Status History
  statusHistory: [{
    status: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'statusHistory.changedByModel'
    },
    changedByModel: {
      type: String,
      enum: ['Customer', 'SupportAgent']
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    note: String
  }],
  
  // Escalation
  isEscalated: {
    type: Boolean,
    default: false
  },
  escalatedAt: Date,
  escalatedReason: String,
  
  // Internal flags
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Generate unique ticket number before saving
ticketSchema.pre('save', async function(next) {
  if (this.isNew) {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const count = await mongoose.model('Ticket').countDocuments();
    this.ticketNumber = `TKT-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;
    
    // Add initial status to history
    this.statusHistory.push({
      status: this.status,
      changedByModel: 'Customer',
      changedBy: this.customer,
      changedAt: new Date(),
      note: 'Ticket created'
    });
    
    // Set SLA deadline based on priority
    this.slaDeadline = this.calculateSLADeadline();
  }
  next();
});

// Update status history when status changes
ticketSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date()
    });
    
    // Update resolved/closed timestamps
    if (this.status === 'resolved' && !this.resolvedAt) {
      this.resolvedAt = new Date();
    }
    if (this.status === 'closed' && !this.closedAt) {
      this.closedAt = new Date();
    }
  }
  next();
});

// Calculate SLA deadline based on priority
ticketSchema.methods.calculateSLADeadline = function() {
  const now = new Date();
  const hours = {
    'urgent': 1,
    'high': 4,
    'medium': 12,
    'low': 24
  };
  
  const deadline = new Date(now.getTime() + (hours[this.priority] * 60 * 60 * 1000));
  return deadline;
};

// Calculate response time (from creation to first agent response)
ticketSchema.virtual('responseTime').get(function() {
  if (!this.firstResponseAt) return null;
  return Math.round((this.firstResponseAt - this.createdAt) / (1000 * 60)); // in minutes
});

// Calculate resolution time (from creation to resolved)
ticketSchema.virtual('resolutionTime').get(function() {
  if (!this.resolvedAt) return null;
  return Math.round((this.resolvedAt - this.createdAt) / (1000 * 60 * 60)); // in hours
});

// Check if SLA is breached
ticketSchema.virtual('isSLABreached').get(function() {
  if (this.firstResponseAt) return false; // Already responded
  return new Date() > this.slaDeadline;
});

// Get total message count (excluding internal notes)
ticketSchema.virtual('messageCount').get(function() {
  return this.messages.filter(m => !m.isInternal).length;
});

// Get unread message count for customer
ticketSchema.methods.getUnreadCountForCustomer = function() {
  return this.messages.filter(m => 
    m.senderType === 'agent' && 
    !m.isInternal &&
    !m.readBy.some(r => r.user.toString() === this.customer.toString())
  ).length;
};

// Get unread message count for agent
ticketSchema.methods.getUnreadCountForAgent = function(agentId) {
  if (!agentId) return 0;
  return this.messages.filter(m => 
    m.senderType === 'customer' && 
    !m.readBy.some(r => r.user.toString() === agentId.toString())
  ).length;
};

ticketSchema.set('toJSON', { virtuals: true });
ticketSchema.set('toObject', { virtuals: true });

// Indexes for performance
ticketSchema.index({ customer: 1, status: 1 });
ticketSchema.index({ assignedAgent: 1, status: 1 });
ticketSchema.index({ ticketNumber: 1 });
ticketSchema.index({ status: 1, priority: -1, createdAt: -1 });
ticketSchema.index({ slaDeadline: 1, status: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);
