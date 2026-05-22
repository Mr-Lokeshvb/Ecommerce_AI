const { Server } = require('socket.io');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
    this.connectedSellers = new Map();
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.setupEventHandlers();
    return this.io;
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 User connected: ${socket.id}`);

      // User authentication and room joining
      socket.on('authenticate', (data) => {
        const { userId, userType, token } = data;
        
        // In production, verify JWT token here
        socket.userId = userId;
        socket.userType = userType;
        
        if (userType === 'CUSTOMER') {
          socket.join(`user-${userId}`);
          this.connectedUsers.set(userId, socket.id);
          console.log(`👤 Customer ${userId} joined room user-${userId}`);
        } else if (userType === 'SELLER') {
          socket.join(`seller-${userId}`);
          this.connectedSellers.set(userId, socket.id);
          console.log(`🏪 Seller ${userId} joined room seller-${userId}`);
        } else if (userType === 'ADMIN') {
          socket.join('admin');
          console.log(`👑 Admin ${userId} joined admin room`);
        }

        socket.emit('authenticated', { success: true });
      });

      // Order tracking
      socket.on('track-order', (orderId) => {
        socket.join(`order-${orderId}`);
        console.log(`📦 User tracking order: ${orderId}`);
      });

      // Live chat support
      socket.on('join-support-chat', (data) => {
        const { userId, orderId } = data;
        const chatRoom = `support-${userId}-${orderId}`;
        socket.join(chatRoom);
        console.log(`💬 User joined support chat: ${chatRoom}`);
      });

      socket.on('support-message', (data) => {
        const { userId, orderId, message, sender } = data;
        const chatRoom = `support-${userId}-${orderId}`;
        
        this.io.to(chatRoom).emit('support-message', {
          message,
          sender,
          timestamp: new Date(),
          userId,
          orderId
        });
      });

      // Seller notifications
      socket.on('join-seller-notifications', (sellerId) => {
        socket.join(`seller-notifications-${sellerId}`);
        console.log(`🔔 Seller ${sellerId} joined notifications`);
      });

      // Inventory alerts
      socket.on('monitor-inventory', (productIds) => {
        productIds.forEach(productId => {
          socket.join(`inventory-${productId}`);
        });
        console.log(`📊 Monitoring inventory for products: ${productIds.join(', ')}`);
      });

      // Disconnect handling
      socket.on('disconnect', () => {
        console.log(`🔌 User disconnected: ${socket.id}`);
        
        if (socket.userId) {
          if (socket.userType === 'CUSTOMER') {
            this.connectedUsers.delete(socket.userId);
          } else if (socket.userType === 'SELLER') {
            this.connectedSellers.delete(socket.userId);
          }
        }
      });
    });
  }

  // Order-related notifications
  notifyOrderCreated(order) {
    // Notify customer
    this.io.to(`user-${order.userId}`).emit('order-created', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total,
      timestamp: new Date()
    });

    // Notify sellers
    const sellerIds = [...new Set(order.items.map(item => item.sellerId.toString()))];
    sellerIds.forEach(sellerId => {
      const sellerItems = order.items.filter(item => item.sellerId.toString() === sellerId);
      this.io.to(`seller-${sellerId}`).emit('new-order', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        items: sellerItems,
        customerInfo: {
          name: order.shippingAddress.firstName + ' ' + order.shippingAddress.lastName,
          address: order.shippingAddress
        },
        timestamp: new Date()
      });
    });

    // Notify admin
    this.io.to('admin').emit('new-order-admin', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      total: order.total,
      itemCount: order.items.length,
      timestamp: new Date()
    });
  }

  notifyOrderStatusUpdate(order, previousStatus) {
    const statusUpdate = {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      previousStatus,
      timestamp: new Date()
    };

    // Notify customer
    this.io.to(`user-${order.userId}`).emit('order-status-updated', statusUpdate);

    // Notify order trackers
    this.io.to(`order-${order._id}`).emit('order-status-updated', statusUpdate);

    // Notify sellers if relevant
    if (['shipped', 'delivered'].includes(order.status)) {
      const sellerIds = [...new Set(order.items.map(item => item.sellerId.toString()))];
      sellerIds.forEach(sellerId => {
        this.io.to(`seller-${sellerId}`).emit('order-status-updated', statusUpdate);
      });
    }
  }

  notifyPaymentUpdate(order, paymentStatus) {
    const paymentUpdate = {
      orderId: order._id,
      orderNumber: order.orderNumber,
      paymentStatus,
      timestamp: new Date()
    };

    // Notify customer
    this.io.to(`user-${order.userId}`).emit('payment-updated', paymentUpdate);

    // Notify sellers
    const sellerIds = [...new Set(order.items.map(item => item.sellerId.toString()))];
    sellerIds.forEach(sellerId => {
      this.io.to(`seller-${sellerId}`).emit('payment-updated', paymentUpdate);
    });
  }

  // Inventory notifications
  notifyLowStock(product, sellerId) {
    this.io.to(`seller-${sellerId}`).emit('low-stock-alert', {
      productId: product._id,
      productName: product.title,
      currentStock: product.totalStock,
      threshold: 5,
      timestamp: new Date()
    });

    this.io.to(`inventory-${product._id}`).emit('stock-updated', {
      productId: product._id,
      stock: product.totalStock,
      timestamp: new Date()
    });
  }

  notifyStockUpdate(productId, newStock) {
    this.io.to(`inventory-${productId}`).emit('stock-updated', {
      productId,
      stock: newStock,
      timestamp: new Date()
    });
  }

  // Shipping notifications
  notifyShippingUpdate(shipment) {
    const shippingUpdate = {
      orderId: shipment.orderId,
      trackingNumber: shipment.trackingNumber,
      carrier: shipment.carrier,
      status: shipment.status,
      events: shipment.events,
      timestamp: new Date()
    };

    // Notify customer
    this.io.to(`order-${shipment.orderId}`).emit('shipping-updated', shippingUpdate);
  }

  // Analytics and live updates
  notifyLiveSales(saleData) {
    this.io.to('admin').emit('live-sale', {
      orderId: saleData.orderId,
      amount: saleData.amount,
      productCount: saleData.productCount,
      timestamp: new Date()
    });
  }

  // Broadcast system announcements
  broadcastAnnouncement(message, userType = 'all') {
    if (userType === 'all') {
      this.io.emit('system-announcement', {
        message,
        timestamp: new Date()
      });
    } else if (userType === 'customers') {
      this.connectedUsers.forEach((socketId, userId) => {
        this.io.to(`user-${userId}`).emit('system-announcement', {
          message,
          timestamp: new Date()
        });
      });
    } else if (userType === 'sellers') {
      this.connectedSellers.forEach((socketId, userId) => {
        this.io.to(`seller-${userId}`).emit('system-announcement', {
          message,
          timestamp: new Date()
        });
      });
    }
  }

  // Get connection statistics
  getConnectionStats() {
    return {
      totalConnections: this.io.sockets.sockets.size,
      connectedCustomers: this.connectedUsers.size,
      connectedSellers: this.connectedSellers.size,
      rooms: Array.from(this.io.sockets.adapter.rooms.keys())
    };
  }
}

module.exports = new SocketService();
