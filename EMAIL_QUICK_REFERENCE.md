# 📧 Email System - Quick Reference Guide

## 🚀 Quick Start

### Send an Email
```javascript
const { sendEmail } = require('./utils/email');

await sendEmail({
  to: 'user@example.com',
  subject: 'Email Subject',
  template: 'template-name',
  data: {
    name: 'User Name',
    // ... other template data
  }
});
```

---

## 📨 Available Templates

### Authentication
```javascript
// OTP Verification
template: 'otp-verification'
data: { name, otp, expiresIn }

// Welcome Email
template: 'welcome'
data: { name, role }

// Password Reset
template: 'password-reset'
data: { name, resetUrl }
```

### Orders (Customer)
```javascript
// Order Confirmation
template: 'order-confirmation'
data: { name, orderNumber, items, total, shippingAddress }

// Order Shipped
template: 'order-shipped'
data: { name, orderNumber, trackingNumber, carrier, estimatedDelivery }

// Order Delivered
template: 'order-delivered'
data: { name, orderNumber, deliveryDate, deliveryAddress }

// Status Update
template: 'order-status-update'
data: { name, orderNumber, status, statusMessage }
```

### Returns (Customer)
```javascript
// Return Request Confirmation
template: 'return-request-confirmation'
data: { customerName, orderNumber, returnReason, orderTotal }

// Return Approved
template: 'return-approved'
data: { customerName, orderNumber, refundAmount, returnLabel }

// Return Rejected
template: 'return-rejected'
data: { customerName, orderNumber, rejectionReason }
```

### Seller
```javascript
// New Order Notification
template: 'seller-new-order'
data: { sellerName, orderNumber, items, sellerEarnings }

// Return Request Notification
template: 'seller-return-notification'
data: { sellerName, customerName, orderNumber, returnReason, orderTotal }
```

---

## 🔑 API Endpoints Cheat Sheet

### Customer Auth
```bash
# Register with OTP
POST /api/auth/register
{ "name": "...", "email": "...", "password": "..." }

# Verify OTP
POST /api/auth/verify-otp
{ "email": "...", "otp": "123456" }

# Resend OTP
POST /api/auth/resend-otp
{ "email": "..." }
```

### Seller Auth
```bash
# Register with OTP
POST /api/auth/seller/register
{ "name": "...", "email": "...", "password": "...", "storeName": "..." }

# Verify OTP
POST /api/auth/seller/verify-otp
{ "email": "...", "otp": "123456" }

# Resend OTP
POST /api/auth/seller/resend-otp
{ "email": "..." }
```

### Orders
```bash
# Create Order (sends confirmation + seller notification)
POST /api/orders/create
Authorization: Bearer {token}

# Update Status (sends status update email)
PATCH /api/orders/:id/status
Authorization: Bearer {token}
{ "status": "shipping", "trackingNumber": "...", "carrier": "..." }

# Request Return (sends return emails)
POST /api/orders/:id/return
Authorization: Bearer {token}
{ "reason": "..." }

# Approve/Reject Return (sends approval/rejection email)
PUT /api/seller/orders/:id/return
Authorization: Bearer {token}
{ "approve": true, "note": "..." }
```

---

## 🧪 Testing

### Run All Email Tests
```bash
cd server
node test-email-system.js
```

### Test Single Email
```javascript
const { sendEmail } = require('./utils/email');

await sendEmail({
  to: 'test@example.com',
  subject: 'Test Email',
  template: 'otp-verification',
  data: {
    name: 'Test User',
    otp: '123456',
    expiresIn: 10
  }
});
```

---

## ⚙️ Environment Setup

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Fashion Era <your-email@gmail.com>
CLIENT_URL=http://localhost:5173
```

### Get Gmail App Password
1. Enable 2FA on Google Account
2. Go to: https://myaccount.google.com/apppasswords
3. Generate password for "Mail"
4. Use in `EMAIL_PASS`

---

## 🎯 Common Use Cases

### 1. User Registers
```javascript
// In /api/auth/register
const otp = generateOTP(); // 6-digit code
user.emailVerificationOTP = otp;
user.emailVerificationOTPExpires = Date.now() + 10*60*1000;
await user.save();

await sendEmail({
  to: user.email,
  subject: 'Verify Your Email',
  template: 'otp-verification',
  data: { name: user.name, otp, expiresIn: 10 }
});
```

### 2. Order Placed
```javascript
// In /api/orders/create
await sendEmail({
  to: customer.email,
  subject: `Order Confirmation - ${orderNumber}`,
  template: 'order-confirmation',
  data: { name, orderNumber, items, total, shippingAddress }
});

// Notify sellers
for (const seller of sellers) {
  await sendEmail({
    to: seller.email,
    subject: `New Order - ${orderNumber}`,
    template: 'seller-new-order',
    data: { sellerName: seller.name, orderNumber, items, sellerEarnings }
  });
}
```

### 3. Order Delivered
```javascript
// In /api/orders/:id/status (when status='delivered')
await sendEmail({
  to: customer.email,
  subject: `Order Delivered - ${orderNumber}`,
  template: 'order-delivered',
  data: {
    name: customer.name,
    orderNumber,
    deliveryDate: new Date().toLocaleDateString(),
    deliveryAddress: `${address.street}, ${address.city}`
  }
});
```

### 4. Return Requested
```javascript
// In /api/orders/:id/return
await sendEmail({
  to: customer.email,
  subject: `Return Request Confirmed - ${orderNumber}`,
  template: 'return-request-confirmation',
  data: { customerName, orderNumber, returnReason, orderTotal }
});

await sendEmail({
  to: seller.email,
  subject: `Return Request - ${orderNumber}`,
  template: 'seller-return-notification',
  data: { sellerName, customerName, orderNumber, returnReason, orderTotal }
});
```

---

## 🐛 Debugging

### Check Email Logs
```javascript
console.log('✅ Email sent successfully');  // Success
console.log('❌ Failed to send email:', error);  // Error
```

### Common Issues
1. **Email not sending**: Check `EMAIL_USER` and `EMAIL_PASS`
2. **Goes to spam**: Add sender to contacts
3. **OTP expired**: OTPs expire in 10 minutes
4. **Template not found**: Check template name matches exactly

### Enable Debug Logging
```javascript
// In sendEmail function
console.log('Sending email:', { to, subject, template });
```

---

## 📊 Status Messages

### Order Statuses
- `pending` - "Your order is pending confirmation"
- `confirmed` - "Your order has been confirmed"
- `packing` - "Your order is being carefully packed"
- `shipping` - Uses shipping template with tracking
- `delivered` - Uses delivery template
- `cancelled` - "Your order has been cancelled"
- `returned` - Return approved

---

## 🎨 Customization

### Add New Template
1. Open `server/utils/email.js`
2. Add to `templates` object:
```javascript
'my-template': (data) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #667eea; padding: 40px; text-align: center;">
      <h1 style="color: white;">My Email</h1>
    </div>
    <div style="padding: 40px; background: #f8f9fa;">
      <h2>Hello ${data.name}!</h2>
      <p>Your custom content here...</p>
    </div>
  </div>
`
```

### Use New Template
```javascript
await sendEmail({
  to: user.email,
  subject: 'My Custom Email',
  template: 'my-template',
  data: { name: user.name, customField: 'value' }
});
```

---

## ✅ Checklist Before Production

- [ ] Update `EMAIL_USER` with production email
- [ ] Update `EMAIL_PASS` with production app password
- [ ] Update `EMAIL_FROM` with your brand name
- [ ] Update `CLIENT_URL` with production URL
- [ ] Test all email templates
- [ ] Check emails don't go to spam
- [ ] Set up email monitoring
- [ ] Configure email rate limits if needed

---

## 📞 Support

For issues or questions:
1. Check `EMAIL_SYSTEM_GUIDE.md` for detailed docs
2. Run `node test-email-system.js` to test
3. Check server logs for errors
4. Verify email configuration in `.env`

---

**Quick Reference Version**: 1.0  
**Last Updated**: February 16, 2026
