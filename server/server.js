const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const path = require('path');

// Load environment variables from multiple locations
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });

console.log('🔧 Environment loaded:');
console.log('📊 NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('🌐 PORT:', process.env.PORT || 5000);
console.log('💾 MONGO_URI:', process.env.MONGO_URI ? 'Set' : 'Not set');
console.log('💾 MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');

// Import routes
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customer');
const sellerRoutes = require('./routes/seller');
const sellerProductRoutes = require('./routes/seller-products');
const sellerOrderRoutes = require('./routes/seller-orders');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const cartRoutes = require('./routes/cart');
const wishlistRoutes = require('./routes/wishlist');
const chatRoutes = require('./routes/chat');
const paymentRoutes = require('./routes/payments');
const shipmentRoutes = require('./routes/shipments');
const reviewRoutes = require('./routes/reviews');
const webhookRoutes = require('./routes/webhooks');
const uploadRoutes = require('./routes/upload');
const customerTicketsRoutes = require('./routes/customer-tickets');

// Admin routes
const adminRoutes = require('./routes/admin');
const adminUsersRoutes = require('./routes/admin-users');
const adminProductsRoutes = require('./routes/admin-products');
const adminOrdersRoutes = require('./routes/admin-orders');
const adminAnalyticsRoutes = require('./routes/admin-analytics');
const adminTicketsRoutes = require('./routes/admin-tickets');

// Import middleware and services
const { errorHandler } = require('./middleware/errorHandler');
const { connectDB } = require('./config/database');
const socketService = require('./utils/socketService');

const app = express();
const server = createServer(app);

// Initialize Socket.IO service
const io = socketService.initialize(server);

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: "*",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);
app.set('trust proxy', 1);

// Body parsing middleware with error handling
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf, encoding) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      console.error('⚠️  Invalid JSON received:', buf.toString().substring(0, 100));
      throw new Error('Invalid JSON');
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically with proper MIME types and CORS headers
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res, filePath) => {
    // Set CORS headers for cross-origin image loading
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    // Set correct MIME types for images
    if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.gif')) {
      res.setHeader('Content-Type', 'image/gif');
    } else if (filePath.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    } else if (filePath.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    } else if (filePath.endsWith('.avif')) {
      res.setHeader('Content-Type', 'image/avif');
    }
  }
}));

// Make socket service accessible to routes
app.use((req, res, next) => {
  req.io = io;
  req.socketService = socketService;
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: dbStatus,
      paypal: process.env.PAYPAL_CLIENT_ID ? 'configured' : 'not configured',
      email: process.env.EMAIL_USER ? 'configured' : 'not configured'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// API routes
console.log('🔧 Setting up API routes...');
app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/seller/products', sellerProductRoutes);
app.use('/api/seller/orders', sellerOrderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/tickets', customerTicketsRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/admin/products', adminProductsRoutes);
app.use('/api/admin/orders', adminOrdersRoutes);
app.use('/api/admin/analytics', adminAnalyticsRoutes);
app.use('/api/admin/tickets', adminTicketsRoutes);

console.log('✅ API routes configured (including Admin routes)');

// JSON parse error handler
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('⚠️  Bad JSON Request:', {
      method: req.method,
      url: req.url,
      body: err.body,
      headers: req.headers
    });
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON in request body'
    });
  }
  next(err);
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

const startServer = () => {
  server.listen(PORT, () => {
    console.log('🚀 Fashion Era Backend Server Started!');
    console.log('='.repeat(50));
    console.log(`🌐 Server running on: http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log('🔧 Environment:', process.env.NODE_ENV || 'development');
    console.log('='.repeat(50));
    console.log('✅ Server is ready to accept connections!');
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.log('❌ Port ' + PORT + ' is already in use');
      console.log('💡 Please stop the other server or use a different port');
      console.log('🔧 You can change the port in the .env file');
      process.exit(1);
    } else {
      console.error('❌ Server error:', error.message);
      process.exit(1);
    }
  });
};

startServer();

module.exports = { app, io };
