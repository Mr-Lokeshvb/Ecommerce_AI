const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminActivitySchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  targetType: {
    type: String,
    enum: ['USER', 'SELLER', 'PRODUCT', 'ORDER', 'TICKET', 'SHIPMENT', 'SYSTEM'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'activities.targetType'
  },
  details: {
    type: String
  },
  ipAddress: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const adminSchema = new mongoose.Schema({
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
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'],
    default: 'ADMIN'
  },
  avatar: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    trim: true
  },
  permissions: {
    manageUsers: { type: Boolean, default: true },
    manageSellers: { type: Boolean, default: true },
    manageProducts: { type: Boolean, default: true },
    manageOrders: { type: Boolean, default: true },
    viewAnalytics: { type: Boolean, default: true },
    manageSettings: { type: Boolean, default: false }, // Only SUPER_ADMIN
    manageAdmins: { type: Boolean, default: false } // Only SUPER_ADMIN
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: String,
  allowedIPs: [String], // IP whitelist
  activities: [adminActivitySchema],
  passwordResetToken: String,
  passwordResetExpires: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

// Virtual for checking if account is locked
adminSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Hash password before saving
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Increment login attempts
adminSchema.methods.incLoginAttempts = async function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 hours
  
  // Lock the account if max attempts reached
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }
  
  return this.updateOne(updates);
};

// Log admin activity
adminSchema.methods.logActivity = async function(action, targetType, targetId, details, ipAddress) {
  this.activities.push({
    action,
    targetType,
    targetId,
    details,
    ipAddress
  });
  
  // Keep only last 1000 activities
  if (this.activities.length > 1000) {
    this.activities = this.activities.slice(-1000);
  }
  
  await this.save();
};

// Remove password from JSON output
adminSchema.methods.toJSON = function() {
  const adminObject = this.toObject();
  delete adminObject.password;
  delete adminObject.passwordResetToken;
  delete adminObject.passwordResetExpires;
  delete adminObject.twoFactorSecret;
  delete adminObject.loginAttempts;
  delete adminObject.lockUntil;
  return adminObject;
};

// Set permissions based on role
adminSchema.pre('save', function(next) {
  if (this.role === 'SUPER_ADMIN') {
    this.permissions = {
      manageUsers: true,
      manageSellers: true,
      manageProducts: true,
      manageOrders: true,
      viewAnalytics: true,
      manageSettings: true,
      manageAdmins: true
    };
  } else if (this.role === 'MODERATOR') {
    this.permissions = {
      manageUsers: false,
      manageSellers: false,
      manageProducts: true,
      manageOrders: false,
      viewAnalytics: true,
      manageSettings: false,
      manageAdmins: false
    };
  }
  next();
});

module.exports = mongoose.model('Admin', adminSchema);
