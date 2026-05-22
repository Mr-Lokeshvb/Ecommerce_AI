const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Email templates
const templates = {
  welcome: (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
        <h1 style="color: white; margin: 0;">Welcome to Fashion Era!</h1>
      </div>
      <div style="padding: 40px; background: #f8f9fa;">
        <h2>Hello ${data.name}!</h2>
        <p>Welcome to Fashion Era, where fashion meets excellence!</p>
        <p>Your ${data.role.toLowerCase()} account has been created successfully.</p>
        ${data.role === 'SELLER' ? 
          '<p>You can now start adding products to your store and manage your business through the seller dashboard.</p>' :
          '<p>Start exploring our amazing collection and try our revolutionary virtual try-on feature!</p>'
        }
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">
            Get Started
          </a>
        </div>
        <p>Best regards,<br>The Fashion Era Team</p>
      </div>
    </div>
  `,
  
  'order-confirmation': (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #007bff; padding: 40px; text-align: center;">
        <h1 style="color: white; margin: 0;">Order Placed Successfully!</h1>
      </div>
      <div style="padding: 40px; background: #f8f9fa;">
        <h2>Hello ${data.name}!</h2>
        <p>Thank you for your order! Your order <strong>${data.orderNumber}</strong> has been placed and sent to the seller for confirmation.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Order Details:</h3>
          ${data.items.map(item => `
            <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
              <strong>${item.title}</strong><br>
              Size: ${item.size} | Color: ${item.color} | Qty: ${item.quantity}<br>
              <span style="color: #28a745;">$${item.total.toFixed(2)}</span>
            </div>
          `).join('')}
          <div style="text-align: right; margin-top: 15px; font-size: 18px;">
            <strong>Total: $${data.total.toFixed(2)}</strong>
          </div>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Shipping Address:</h3>
          <p>
            ${data.shippingAddress.firstName} ${data.shippingAddress.lastName}<br>
            ${data.shippingAddress.address}<br>
            ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zipCode}
          </p>
        </div>
        
        <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
          <h3 style="color: #0056b3; margin-top: 0;">📋 What's Next?</h3>
          <ol style="color: #0056b3; padding-left: 20px; margin: 10px 0;">
            <li style="margin: 8px 0;">Seller will review and confirm your order within 24 hours</li>
            <li style="margin: 8px 0;">You'll receive a confirmation email once the seller accepts</li>
            <li style="margin: 8px 0;">Order will be prepared and shipped</li>
            <li style="margin: 8px 0;">You'll get tracking details when shipped</li>
          </ol>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/customer-dashboard?tab=orders" style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">
            Track Your Order
          </a>
        </div>
        
        <p>We'll keep you updated via email as your order progresses.</p>
        <p>Best regards,<br>The Fashion Era Team</p>
      </div>
    </div>
  `,

  'order-shipped': (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #007bff; padding: 40px; text-align: center;">
        <h1 style="color: white; margin: 0;">Your Order Has Shipped!</h1>
      </div>
      <div style="padding: 40px; background: #f8f9fa;">
        <h2>Hello ${data.name}!</h2>
        <p>Great news! Your order <strong>${data.orderNumber}</strong> has been shipped.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Tracking Information:</h3>
          <p><strong>Carrier:</strong> ${data.carrier}</p>
          <p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
          <p><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/track/${data.trackingNumber}" style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">
            Track Package
          </a>
        </div>
        
        <p>Best regards,<br>The Fashion Era Team</p>
      </div>
    </div>
  `,

  'password-reset': (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #dc3545; padding: 40px; text-align: center;">
        <h1 style="color: white; margin: 0;">Password Reset Request</h1>
      </div>
      <div style="padding: 40px; background: #f8f9fa;">
        <h2>Hello ${data.name}!</h2>
        <p>You requested a password reset for your Fashion Era account.</p>
        <p>Click the button below to reset your password. This link will expire in 1 hour.</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.resetUrl}" style="background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">
            Reset Password
          </a>
        </div>

        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>Best regards,<br>The Fashion Era Team</p>
      </div>
    </div>
  `,

  'seller-new-order': (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #ffc107; padding: 40px; text-align: center;">
        <h1 style="color: #212529; margin: 0;">New Order Received!</h1>
      </div>
      <div style="padding: 40px; background: #f8f9fa;">
        <h2>Hello ${data.sellerName}!</h2>
        <p>You have received a new order <strong>${data.orderNumber}</strong>!</p>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Order Items:</h3>
          ${data.items.map(item => `
            <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
              <strong>${item.title}</strong><br>
              Size: ${item.size} | Color: ${item.color} | Qty: ${item.quantity}<br>
              <span style="color: #28a745;">$${item.total.toFixed(2)}</span>
            </div>
          `).join('')}
          <div style="text-align: right; margin-top: 15px; font-size: 18px;">
            <strong>Your Earnings: $${data.sellerEarnings.toFixed(2)}</strong>
          </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/seller-dashboard/orders" style="background: #ffc107; color: #212529; padding: 15px 30px; text-decoration: none; border-radius: 5px;">
            Manage Order
          </a>
        </div>

        <p>Please process this order as soon as possible.</p>
        <p>Best regards,<br>The Fashion Era Team</p>
      </div>
    </div>
  `,

  'low-stock-alert': (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #fd7e14; padding: 40px; text-align: center;">
        <h1 style="color: white; margin: 0;">Low Stock Alert</h1>
      </div>
      <div style="padding: 40px; background: #f8f9fa;">
        <h2>Hello ${data.sellerName}!</h2>
        <p>Some of your products are running low on stock:</p>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          ${data.products.map(product => `
            <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
              <strong>${product.title}</strong><br>
              <span style="color: #fd7e14;">Only ${product.stock} left in stock</span>
            </div>
          `).join('')}
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/seller-dashboard/products" style="background: #fd7e14; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">
            Update Inventory
          </a>
        </div>

        <p>Consider restocking these items to avoid missing sales.</p>
        <p>Best regards,<br>The Fashion Era Team</p>
      </div>
    </div>
  `,

  'refund-notification': (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #6c757d; padding: 40px; text-align: center;">
        <h1 style="color: white; margin: 0;">Refund Processed</h1>
      </div>
      <div style="padding: 40px; background: #f8f9fa;">
        <h2>Hello ${data.name}!</h2>
        <p>Your refund for order <strong>${data.orderNumber}</strong> has been processed.</p>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Refund Details:</h3>
          <p><strong>Refund Amount:</strong> $${data.refundAmount.toFixed(2)}</p>
          <p><strong>Processing Time:</strong> 3-5 business days</p>
          <p><strong>Refund Method:</strong> Original payment method</p>
        </div>

        <p>The refund will appear on your statement within 3-5 business days.</p>
        <p>Best regards,<br>The Fashion Era Team</p>
      </div>
    </div>
  `,

  'return-request-confirmation': (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
        <h1 style="color: white; margin: 0;">📨 Return Request Sent</h1>
      </div>
      <div style="padding: 40px; background: #f8f9fa;">
        <h2>Hi ${data.customerName}!</h2>
        <p>Your return request for order <strong>#${data.orderNumber}</strong> has been sent to the seller.</p>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <h3 style="color: #667eea; margin-top: 0;">Return Details</h3>
          <p><strong>Order Number:</strong> ${data.orderNumber}</p>
          <p><strong>Reason:</strong> ${data.returnReason}</p>
          <p><strong>Order Total:</strong> $${data.orderTotal.toFixed(2)}</p>
          <p><strong>Request Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <div style="background: #e0e7ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #4338ca; margin-top: 0;">📦 Next Steps:</h3>
          <ol style="color: #4338ca; padding-left: 20px; margin: 10px 0;">
            <li style="margin: 8px 0;">Seller will review your request within 24 hours</li>
            <li style="margin: 8px 0;">You'll receive a return shipping label via email</li>
            <li style="margin: 8px 0;">Pack the item securely in original packaging</li>
            <li style="margin: 8px 0;">Ship using the provided label</li>
            <li style="margin: 8px 0;">Refund processed within 5-7 days after we receive the item</li>
          </ol>
        </div>

        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e;"><strong>⚠️ Return Policy:</strong></p>
          <ul style="color: #92400e; margin: 10px 0; padding-left: 20px;">
            <li>Items must be in original condition with tags attached</li>
            <li>Returns accepted within 30 days of delivery</li>
            <li>Refund will be issued to original payment method</li>
          </ul>
        </div>

        <p>You can track your return status in your dashboard.</p>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <p style="margin-top: 30px;">Thank you for shopping with us!</p>
        <p style="color: #6b7280;">Best regards,<br>The Fashion Era Team</p>
      </div>
    </div>
  `,

  'otp-verification': (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
        <h1 style="color: white; margin: 0;">🔐 Verify Your Email</h1>
      </div>
      <div style="padding: 40px; background: #f8f9fa;">
        <h2>Hello ${data.name}!</h2>
        <p>Thank you for signing up with Fashion Era! To complete your registration, please use the verification code below:</p>
        
        <div style="background: white; padding: 30px; border-radius: 8px; margin: 30px 0; text-align: center; border: 2px dashed #667eea;">
          <p style="color: #666; margin-bottom: 10px; font-size: 14px;">Your Verification Code</p>
          <h1 style="color: #667eea; font-size: 48px; letter-spacing: 10px; margin: 10px 0; font-family: monospace;">${data.otp}</h1>
          <p style="color: #999; margin-top: 10px; font-size: 12px;">This code will expire in ${data.expiresIn || 10} minutes</p>
        </div>

        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p style="margin: 0; color: #856404;"><strong>⚠️ Security Notice:</strong></p>
          <ul style="color: #856404; margin: 10px 0; padding-left: 20px; font-size: 14px;">
            <li>Never share this code with anyone</li>
            <li>Fashion Era will never ask for your OTP via phone or email</li>
            <li>If you didn't request this code, please ignore this email</li>
          </ul>
        </div>

        <p style="color: #666; font-size: 14px; margin-top: 30px;">If you're having trouble, please contact our support team.</p>
        <p style="color: #6b7280;">Best regards,<br>The Fashion Era Team</p>
      </div>
    </div>
  `,

  'return-approved': (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #28a745; padding: 40px; text-align: center;">
        <h1 style="color: white; margin: 0;">✅ Return Request Approved</h1>
      </div>
      <div style="padding: 40px; background: #f8f9fa;">
        <h2>Hello ${data.customerName}!</h2>
        <p>Good news! Your return request for order <strong>#${data.orderNumber}</strong> has been approved by the seller.</p>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
          <h3 style="color: #28a745; margin-top: 0;">Return Approved</h3>
          <p><strong>Order Number:</strong> ${data.orderNumber}</p>
          <p><strong>Approval Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Refund Amount:</strong> $${data.refundAmount.toFixed(2)}</p>
        </div>

        <div style="background: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #0c5460; margin-top: 0;">📦 Return Instructions:</h3>
          <ol style="color: #0c5460; padding-left: 20px;">
            <li style="margin: 8px 0;">Pack the item(s) securely in the original packaging</li>
            <li style="margin: 8px 0;">Print and attach the return shipping label (see below)</li>
            <li style="margin: 8px 0;">Drop off the package at any authorized shipping location</li>
            <li style="margin: 8px 0;">Your refund will be processed within 5-7 business days after we receive the return</li>
          </ol>
        </div>

        ${data.returnLabel ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.returnLabel}" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Download Return Label
            </a>
          </div>
        ` : ''}

        <p>Thank you for your patience. We look forward to serving you again!</p>
        <p style="color: #6b7280;">Best regards,<br>The Fashion Era Team</p>
      </div>
    </div>
  `,

  'return-rejected': (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #dc3545; padding: 40px; text-align: center;">
        <h1 style="color: white; margin: 0;">❌ Return Request Not Approved</h1>
      </div>
      <div style="padding: 40px; background: #f8f9fa;">
        <h2>Hello ${data.customerName}!</h2>
        <p>We regret to inform you that your return request for order <strong>#${data.orderNumber}</strong> could not be approved.</p>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
          <h3 style="color: #dc3545; margin-top: 0;">Reason for Rejection</h3>
          <p>${data.rejectionReason || 'The item does not meet our return policy requirements.'}</p>
        </div>

        <div style="background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #721c24;"><strong>Common Reasons for Return Rejection:</strong></p>
          <ul style="color: #721c24; margin: 10px 0; padding-left: 20px;">
            <li>Item shows signs of wear or damage</li>
            <li>Tags have been removed</li>
            <li>Return window has expired (30 days from delivery)</li>
            <li>Item not in original packaging</li>
          </ul>
        </div>

        <p>If you believe this decision was made in error, please contact our customer support team within 48 hours.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/contact" style="background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Contact Support
          </a>
        </div>

        <p style="color: #6b7280;">Best regards,<br>The Fashion Era Team</p>
      </div>
    </div>
  `,

  'order-delivered': (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 40px; text-align: center;">
        <h1 style="color: white; margin: 0;">🎉 Order Delivered!</h1>
      </div>
      <div style="padding: 40px; background: #f8f9fa;">
        <h2>Hello ${data.name}!</h2>
        <p>Great news! Your order <strong>#${data.orderNumber}</strong> has been successfully delivered.</p>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
          <h3 style="color: #28a745; margin-top: 0;">✅ Delivery Confirmed</h3>
          <p><strong>Delivered On:</strong> ${data.deliveryDate || new Date().toLocaleDateString()}</p>
          <p><strong>Delivered To:</strong> ${data.deliveryAddress}</p>
        </div>

        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #856404; margin-top: 0;">⭐ We'd Love Your Feedback!</h3>
          <p style="color: #856404;">How was your shopping experience? Your review helps us improve and helps other customers make informed decisions.</p>
          <div style="text-align: center; margin-top: 15px;">
            <a href="${process.env.CLIENT_URL}/orders/${data.orderNumber}/review" style="background: #ffc107; color: #212529; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Write a Review
            </a>
          </div>
        </div>

        <p>If there are any issues with your order, please don't hesitate to contact us within 48 hours.</p>
        <p style="color: #6b7280;">Thank you for shopping with Fashion Era!</p>
        <p style="color: #6b7280;">Best regards,<br>The Fashion Era Team</p>
      </div>
    </div>
  `,

  'order-status-update': (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
        <h1 style="color: white; margin: 0;">📦 Order Status Update</h1>
      </div>
      <div style="padding: 40px; background: #f8f9fa;">
        <h2>Hello ${data.name}!</h2>
        <p>Your order <strong>#${data.orderNumber}</strong> status has been updated.</p>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <h3 style="color: #667eea; margin-top: 0;">Current Status: ${data.status}</h3>
          <p>${data.statusMessage || ''}</p>
          <p><strong>Updated On:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/customer-dashboard?tab=orders" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Track Your Order
          </a>
        </div>

        <p>We'll keep you updated as your order progresses.</p>
        <p style="color: #6b7280;">Best regards,<br>The Fashion Era Team</p>
      </div>
    </div>
  `,

  'order-confirmed-by-seller': (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #28a745; padding: 40px; text-align: center;">
        <h1 style="color: white; margin: 0;">✅ Order Confirmed by Seller!</h1>
      </div>
      <div style="padding: 40px; background: #f8f9fa;">
        <h2>Hello ${data.name}!</h2>
        <p>Great news! The seller has confirmed your order <strong>#${data.orderNumber}</strong>.</p>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
          <h3 style="color: #28a745; margin-top: 0;">Order Confirmed</h3>
          <p><strong>Order Number:</strong> ${data.orderNumber}</p>
          <p><strong>Status:</strong> Confirmed</p>
          <p><strong>Confirmed On:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <div style="background: #d1f2eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #0c5460; margin-top: 0;">📦 What's Next?</h3>
          <p style="color: #0c5460; margin: 0;">Your order is now being prepared for shipment. You'll receive tracking information once it ships.</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/customer-dashboard?tab=orders" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Track Your Order
          </a>
        </div>

        <p>Thank you for shopping with Fashion Era!</p>
        <p style="color: #6b7280;">Best regards,<br>The Fashion Era Team</p>
      </div>
    </div>
  `,

  'seller-return-notification': (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #fd7e14; padding: 40px; text-align: center;">
        <h1 style="color: white; margin: 0;">🔄 Return Request Received</h1>
      </div>
      <div style="padding: 40px; background: #f8f9fa;">
        <h2>Hello ${data.sellerName}!</h2>
        <p>A customer has requested a return for order <strong>#${data.orderNumber}</strong>.</p>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #fd7e14;">
          <h3 style="color: #fd7e14; margin-top: 0;">Return Request Details</h3>
          <p><strong>Customer:</strong> ${data.customerName}</p>
          <p><strong>Order Number:</strong> ${data.orderNumber}</p>
          <p><strong>Reason:</strong> ${data.returnReason}</p>
          <p><strong>Order Total:</strong> $${data.orderTotal.toFixed(2)}</p>
        </div>

        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;"><strong>⚠️ Action Required:</strong></p>
          <p style="color: #856404; margin: 10px 0;">Please review this return request within 24 hours. You can approve or reject the request from your seller dashboard.</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/seller-dashboard?tab=orders" style="background: #fd7e14; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Review Return Request
          </a>
        </div>

        <p style="color: #6b7280;">Best regards,<br>The Fashion Era Team</p>
      </div>
    </div>
  `
};

// Send email function
const sendEmail = async ({ to, subject, template, data }) => {
  try {
    const transporter = createTransporter();
    
    // Get HTML template
    const html = templates[template] ? templates[template](data) : data.html;
    
    const mailOptions = {
      from: `"Fashion Era" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Email sending failed:', {
      message: error.message,
      code: error.code,
      response: error.response,
      stack: error.stack
    });
    throw new Error('Failed to send email. Please check server logs for details.');
  }
};

// Send bulk emails
const sendBulkEmails = async (emails) => {
  const results = [];
  
  for (const email of emails) {
    try {
      const result = await sendEmail(email);
      results.push({ success: true, messageId: result.messageId, to: email.to });
    } catch (error) {
      results.push({ success: false, error: error.message, to: email.to });
    }
  }
  
  return results;
};

module.exports = {
  sendEmail,
  sendBulkEmails
};
