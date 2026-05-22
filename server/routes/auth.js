const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Customer = require('../models/Customer');
const Seller = require('../models/Seller');
const { auth } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');

const router = express.Router();

console.log('🔧 Auth routes module loaded');

// Test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Auth routes are working!',
    timestamp: new Date().toISOString()
  });
});

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Helper function to generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @route   POST /api/auth/register
// @desc    Register a new customer and send OTP
// @access  Public
router.post('/register', [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
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

        const { name, email, password } = req.body;

        const existingCustomer = await Customer.findOne({ email });
        if (existingCustomer) {
            return res.status(400).json({
                success: false,
                message: 'A customer with this email already exists'
            });
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        const customer = new Customer({ 
            name, 
            email, 
            password,
            emailVerificationOTP: otp,
            emailVerificationOTPExpires: otpExpires,
            isEmailVerified: false
        });
        await customer.save();

        // Send OTP email
        try {
            await sendEmail({
                to: email,
                subject: 'Verify Your Email - Fashion Era',
                template: 'otp-verification',
                data: {
                    name,
                    otp,
                    expiresIn: 10
                }
            });
            console.log(`✅ OTP email sent to ${email}`);
        } catch (emailError) {
            console.error('Failed to send OTP email:', emailError);
            // Continue even if email fails - user can request resend
        }

        res.status(201).json({
            success: true,
            message: 'Registration successful! Please check your email for the verification code.',
            data: {
                userId: customer._id,
                email: customer.email,
                requiresVerification: true
            }
        });
    } catch (error) {
        console.error('Customer registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during customer registration'
        });
    }
});

// @route   POST /api/auth/seller/register
// @desc    Register a new seller and send OTP
// @access  Public
router.post('/seller/register', [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('storeName').trim().isLength({ min: 2 }).withMessage('Store name must be at least 2 characters'),
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

        const { name, email, password, storeName } = req.body;

        const existingSeller = await Seller.findOne({ email });
        if (existingSeller) {
            return res.status(400).json({
                success: false,
                message: 'A seller with this email already exists'
            });
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        const seller = new Seller({ 
            name, 
            email, 
            password, 
            storeName,
            emailVerificationOTP: otp,
            emailVerificationOTPExpires: otpExpires,
            isEmailVerified: false
        });
        await seller.save();

        // Send OTP email
        try {
            await sendEmail({
                to: email,
                subject: 'Verify Your Email - Fashion Era Seller Account',
                template: 'otp-verification',
                data: {
                    name,
                    otp,
                    expiresIn: 10
                }
            });
            console.log(`✅ OTP email sent to seller ${email}`);
        } catch (emailError) {
            console.error('Failed to send OTP email:', emailError);
        }

        res.status(201).json({
            success: true,
            message: 'Seller registration successful! Please check your email for the verification code.',
            data: {
                userId: seller._id,
                email: seller.email,
                requiresVerification: true
            }
        });
    } catch (error) {
        console.error('Seller registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during seller registration'
        });
    }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP for customer
// @access  Public
router.post('/verify-otp', [
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
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

        const { email, otp } = req.body;

        const customer = await Customer.findOne({ email });
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if already verified
        if (customer.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email already verified'
            });
        }

        // Check if OTP matches
        if (customer.emailVerificationOTP !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        // Check if OTP has expired
        if (customer.emailVerificationOTPExpires < Date.now()) {
            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new one.'
            });
        }

        // Verify email
        customer.isEmailVerified = true;
        customer.emailVerificationOTP = undefined;
        customer.emailVerificationOTPExpires = undefined;
        await customer.save();

        // Generate token and log them in
        const token = generateToken(customer._id);

        // Send welcome email
        try {
            await sendEmail({
                to: email,
                subject: 'Welcome to Fashion Era!',
                template: 'welcome',
                data: {
                    name: customer.name,
                    role: 'CUSTOMER'
                }
            });
        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
        }

        res.json({
            success: true,
            message: 'Email verified successfully!',
            data: {
                user: {
                    id: customer._id,
                    name: customer.name,
                    email: customer.email,
                    role: customer.role,
                    isEmailVerified: customer.isEmailVerified
                },
                token
            }
        });
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during OTP verification'
        });
    }
});

// @route   POST /api/auth/seller/verify-otp
// @desc    Verify OTP for seller
// @access  Public
router.post('/seller/verify-otp', [
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
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

        const { email, otp } = req.body;

        const seller = await Seller.findOne({ email });
        if (!seller) {
            return res.status(404).json({
                success: false,
                message: 'Seller not found'
            });
        }

        if (seller.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email already verified'
            });
        }

        if (seller.emailVerificationOTP !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        if (seller.emailVerificationOTPExpires < Date.now()) {
            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new one.'
            });
        }

        seller.isEmailVerified = true;
        seller.emailVerificationOTP = undefined;
        seller.emailVerificationOTPExpires = undefined;
        await seller.save();

        const token = generateToken(seller._id);

        // Send welcome email
        try {
            await sendEmail({
                to: email,
                subject: 'Welcome to Fashion Era Seller Platform!',
                template: 'welcome',
                data: {
                    name: seller.name,
                    role: 'SELLER'
                }
            });
        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
        }

        res.json({
            success: true,
            message: 'Email verified successfully!',
            data: {
                user: {
                    id: seller._id,
                    name: seller.name,
                    email: seller.email,
                    role: seller.role,
                    storeName: seller.storeName,
                    isEmailVerified: seller.isEmailVerified
                },
                token
            }
        });
    } catch (error) {
        console.error('Seller OTP verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during OTP verification'
        });
    }
});

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP for customer
// @access  Public
router.post('/resend-otp', [
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email')
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

        const { email } = req.body;

        const customer = await Customer.findOne({ email });
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (customer.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email already verified'
            });
        }

        // Generate new OTP
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        customer.emailVerificationOTP = otp;
        customer.emailVerificationOTPExpires = otpExpires;
        await customer.save();

        // Send OTP email
        await sendEmail({
            to: email,
            subject: 'Verify Your Email - Fashion Era',
            template: 'otp-verification',
            data: {
                name: customer.name,
                otp,
                expiresIn: 10
            }
        });

        res.json({
            success: true,
            message: 'OTP resent successfully. Please check your email.'
        });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during OTP resend'
        });
    }
});

// @route   POST /api/auth/seller/resend-otp
// @desc    Resend OTP for seller
// @access  Public
router.post('/seller/resend-otp', [
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email')
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

        const { email } = req.body;

        const seller = await Seller.findOne({ email });
        if (!seller) {
            return res.status(404).json({
                success: false,
                message: 'Seller not found'
            });
        }

        if (seller.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email already verified'
            });
        }

        // Generate new OTP
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

        seller.emailVerificationOTP = otp;
        seller.emailVerificationOTPExpires = otpExpires;
        await seller.save();

        // Send OTP email
        await sendEmail({
            to: email,
            subject: 'Verify Your Email - Fashion Era Seller Account',
            template: 'otp-verification',
            data: {
                name: seller.name,
                otp,
                expiresIn: 10
            }
        });

        res.json({
            success: true,
            message: 'OTP resent successfully. Please check your email.'
        });
    } catch (error) {
        console.error('Seller resend OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during OTP resend'
        });
    }
});

// @route   POST /api/auth/login
// @desc    Login a customer
// @access  Public
router.post('/login', [
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
    body('password').exists().withMessage('Password is required')
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

        const { email, password } = req.body;

        const customer = await Customer.findOne({ email }).select('+password');
        if (!customer) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const isMatch = await customer.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const token = generateToken(customer._id);

        res.json({
            success: true,
            message: 'Customer login successful',
            data: {
                user: {
                    id: customer._id,
                    name: customer.name,
                    email: customer.email,
                    role: customer.role
                },
                token
            }
        });
    } catch (error) {
        console.error('Customer login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during customer login'
        });
    }
});

// @route   POST /api/auth/seller/login
// @desc    Login a seller
// @access  Public
router.post('/seller/login', [
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
    body('password').exists().withMessage('Password is required')
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

        const { email, password } = req.body;

        console.log('🔍 Seller login attempt for:', email);

        const seller = await Seller.findOne({ email }).select('+password');
        if (!seller) {
            console.log('❌ Seller not found:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        console.log('✅ Seller found:', seller.name);
        console.log('🔑 Password field exists:', !!seller.password);
        console.log('🔐 Password field type:', typeof seller.password);
        console.log('🔧 comparePassword method exists:', typeof seller.comparePassword);

        if (!seller.password) {
            console.error('❌ Seller password is missing or undefined!');
            return res.status(500).json({
                success: false,
                message: 'Account configuration error. Please contact support.'
            });
        }

        if (typeof seller.comparePassword !== 'function') {
            console.error('❌ comparePassword method not found!');
            return res.status(500).json({
                success: false,
                message: 'Account configuration error. Please contact support.'
            });
        }

        const isMatch = await seller.comparePassword(password);
        console.log('🔐 Password match result:', isMatch);

        if (!isMatch) {
            console.log('❌ Password mismatch for seller:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const token = generateToken(seller._id);

        console.log('✅ Seller login successful:', seller.name);

        res.json({
            success: true,
            message: 'Seller login successful',
            data: {
                user: {
                    id: seller._id,
                    name: seller.name,
                    email: seller.email,
                    role: seller.role,
                    storeName: seller.storeName
                },
                token
            }
        });
    } catch (error) {
        console.error('❌ Seller login error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Server error during seller login'
        });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    let user = await Customer.findById(req.user.id);
    if (!user) {
        user = await Seller.findById(req.user.id);
    }
    
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        storeName: user.storeName,
        avatar: user.avatar,
        addresses: user.addresses,
        paymentMethods: user.paymentMethods,
        businessType: user.businessType,
        gstin: user.gstin,
        phoneNumber: user.phoneNumber,
        pickupAddress: user.pickupAddress,
        bankDetails: user.bankDetails,
        isVerified: user.isVerified,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email',
        errors: errors.array()
      });
    }

    const { email } = req.body;
    let user = await Customer.findOne({ email });
    if (!user) {
        user = await Seller.findOne({ email });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    // Generate reset token
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send reset email
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    
    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Request',
        template: 'password-reset',
        data: {
          name: user.name,
          resetUrl
        }
      });

      res.json({
        success: true,
        message: 'Password reset email sent'
      });
    } catch (emailError) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      return res.status(500).json({
        success: false,
        message: 'Email could not be sent'
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password
// @access  Public
router.post('/reset-password', [
    body('token').notEmpty().withMessage('Token is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
        }

        const { token, password } = req.body;

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        let user = await Customer.findOne({ _id: decoded.id, passwordResetToken: token, passwordResetExpires: { $gt: Date.now() } });
        if (!user) {
            user = await Seller.findOne({ _id: decoded.id, passwordResetToken: token, passwordResetExpires: { $gt: Date.now() } });
        }

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired password reset token' });
        }

        // Set new password
        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.json({ success: true, message: 'Password has been reset successfully' });

    } catch (error) {
        console.error('Reset password error:', error);
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(400).json({ success: false, message: 'Invalid or expired password reset token' });
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
