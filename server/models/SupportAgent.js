const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const workingHoursSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true
  },
  isWorking: {
    type: Boolean,
    default: true
  },
  startTime: {
    type: String,
    default: '09:00' // 24-hour format
  },
  endTime: {
    type: String,
    default: '17:00'
  }
}, { _id: false });

const supportAgentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['SUPPORT_AGENT', 'SUPPORT_MANAGER', 'SUPPORT_ADMIN'],
    default: 'SUPPORT_AGENT'
  },
  avatar: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    trim: true
  },
  
  // Agent Details
  employeeId: {
    type: String,
    unique: true,
    sparse: true
  },
  department: {
    type: String,
    enum: ['general', 'technical', 'billing', 'shipping', 'returns', 'vip'],
    default: 'general'
  },
  specializations: [{
    type: String,
    enum: ['Product', 'Order', 'Payment', 'Shipping', 'Return', 'Technical', 'Account']
  }],
  languages: [{
    type: String,
    default: ['English']
  }],
  
  // Status & Availability
  status: {
    type: String,
    enum: ['available', 'busy', 'away', 'offline'],
    default: 'offline'
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  },
  
  // Capacity Management
  maxActiveTickets: {
    type: Number,
    default: 10,
    min: 1,
    max: 50
  },
  currentActiveTickets: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Working Hours
  workingHours: [workingHoursSchema],
  timezone: {
    type: String,
    default: 'UTC'
  },
  
  // Performance Metrics
  metrics: {
    totalTicketsHandled: {
      type: Number,
      default: 0
    },
    totalTicketsResolved: {
      type: Number,
      default: 0
    },
    averageResponseTime: {
      type: Number,
      default: 0 // in minutes
    },
    averageResolutionTime: {
      type: Number,
      default: 0 // in hours
    },
    averageSatisfactionRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalSatisfactionRatings: {
      type: Number,
      default: 0
    },
    firstResponseRate: {
      type: Number,
      default: 0 // percentage of tickets responded within SLA
    },
    resolutionRate: {
      type: Number,
      default: 0 // percentage of assigned tickets resolved
    }
  },
  
  // Monthly Performance (for tracking)
  monthlyStats: [{
    month: String, // YYYY-MM
    ticketsHandled: Number,
    ticketsResolved: Number,
    avgResponseTime: Number,
    avgResolutionTime: Number,
    avgSatisfaction: Number
  }],
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  // Authentication
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: Date,
  
  // Notifications Preferences
  notificationPreferences: {
    email: {
      newTicket: { type: Boolean, default: true },
      ticketAssigned: { type: Boolean, default: true },
      customerReply: { type: Boolean, default: true },
      escalation: { type: Boolean, default: true }
    },
    push: {
      newTicket: { type: Boolean, default: false },
      ticketAssigned: { type: Boolean, default: true },
      customerReply: { type: Boolean, default: true }
    }
  }
}, {
  timestamps: true
});

// Generate employee ID before saving
supportAgentSchema.pre('save', async function(next) {
  if (this.isNew && !this.employeeId) {
    const count = await mongoose.model('SupportAgent').countDocuments();
    this.employeeId = `AGT-${(count + 1).toString().padStart(5, '0')}`;
  }
  next();
});

// Hash password before saving
supportAgentSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Initialize default working hours for new agents
supportAgentSchema.pre('save', function(next) {
  if (this.isNew && this.workingHours.length === 0) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    this.workingHours = days.map((day, index) => ({
      day,
      isWorking: index < 5, // Monday-Friday working, Saturday-Sunday off
      startTime: '09:00',
      endTime: '17:00'
    }));
  }
  next();
});

// Compare password method
supportAgentSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if agent is currently working (based on schedule)
supportAgentSchema.methods.isCurrentlyWorking = function() {
  const now = new Date();
  const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
  const currentTime = now.toTimeString().substring(0, 5); // HH:MM format
  
  const todaySchedule = this.workingHours.find(wh => wh.day === dayName);
  if (!todaySchedule || !todaySchedule.isWorking) return false;
  
  return currentTime >= todaySchedule.startTime && currentTime <= todaySchedule.endTime;
};

// Check if agent can accept more tickets
supportAgentSchema.methods.canAcceptTickets = function() {
  return this.status === 'available' && 
         this.currentActiveTickets < this.maxActiveTickets &&
         this.isActive;
};

// Update metrics after ticket resolution
supportAgentSchema.methods.updateMetrics = async function(ticket) {
  this.metrics.totalTicketsHandled += 1;
  
  if (ticket.status === 'resolved' || ticket.status === 'closed') {
    this.metrics.totalTicketsResolved += 1;
  }
  
  // Update average response time
  if (ticket.responseTime) {
    const totalResponse = this.metrics.averageResponseTime * (this.metrics.totalTicketsHandled - 1);
    this.metrics.averageResponseTime = (totalResponse + ticket.responseTime) / this.metrics.totalTicketsHandled;
  }
  
  // Update average resolution time
  if (ticket.resolutionTime) {
    const totalResolution = this.metrics.averageResolutionTime * this.metrics.totalTicketsResolved;
    this.metrics.averageResolutionTime = totalResolution / this.metrics.totalTicketsResolved;
  }
  
  // Update satisfaction rating
  if (ticket.satisfaction) {
    const totalSatisfaction = this.metrics.averageSatisfactionRating * this.metrics.totalSatisfactionRatings;
    this.metrics.totalSatisfactionRatings += 1;
    this.metrics.averageSatisfactionRating = (totalSatisfaction + ticket.satisfaction) / this.metrics.totalSatisfactionRatings;
  }
  
  await this.save();
};

// Remove sensitive data from JSON output
supportAgentSchema.methods.toJSON = function() {
  const agentObject = this.toObject();
  delete agentObject.password;
  delete agentObject.passwordResetToken;
  delete agentObject.passwordResetExpires;
  return agentObject;
};

// Virtual for workload percentage
supportAgentSchema.virtual('workloadPercentage').get(function() {
  return Math.round((this.currentActiveTickets / this.maxActiveTickets) * 100);
});

supportAgentSchema.set('toJSON', { virtuals: true });
supportAgentSchema.set('toObject', { virtuals: true });

// Indexes
supportAgentSchema.index({ email: 1 });
supportAgentSchema.index({ employeeId: 1 });
supportAgentSchema.index({ status: 1, currentActiveTickets: 1 });
supportAgentSchema.index({ department: 1, status: 1 });

module.exports = mongoose.model('SupportAgent', supportAgentSchema);
