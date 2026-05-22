# 📧 Fashion Era - Complete Email System Documentation

## Overview
This document describes the comprehensive email notification system implemented in the Fashion Era e-commerce platform. The system handles all customer and seller communications throughout the order lifecycle.

## 🎯 Features Implemented

### 1. **OTP Email Verification**
- ✅ Email verification during customer registration
- ✅ Email verification during seller registration
- ✅ OTP resend functionality
- ✅ 10-minute OTP expiration
- ✅ Welcome emails after successful verification

### 2. **Order Lifecycle Emails**
- ✅ Order confirmation to customers
- ✅ New order notifications to sellers
- ✅ Order status update notifications
- ✅ Shipping confirmation with tracking
- ✅ Delivery confirmation

### 3. **Return Management Emails**
- ✅ Return request confirmation to customers
- ✅ Return request notification to sellers
- ✅ Return approval emails
- ✅ Return rejection emails with reasons

### 4. **Account Management**
- ✅ Password reset emails
- ✅ Welcome emails for new users

## 📨 Email Templates

### Customer Emails
1. **OTP Verification** - `otp-verification`
2. **Welcome Email** - `welcome`
3. **Order Confirmation** - `order-confirmation`
4. **Order Shipped** - `order-shipped`
5. **Order Delivered** - `order-delivered`
6. **Order Status Update** - `order-status-update`
7. **Return Request Confirmation** - `return-request-confirmation`
8. **Return Approved** - `return-approved`
9. **Return Rejected** - `return-rejected`
10. **Password Reset** - `password-reset`

### Seller Emails
1. **OTP Verification** - `otp-verification`
2. **Welcome Email** - `welcome`
3. **New Order Notification** - `seller-new-order`
4. **Return Request Notification** - `seller-return-notification`

## 🔧 Configuration

### Environment Variables (.env)
```env
# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Fashion Era <your-email@gmail.com>

# Client URL
CLIENT_URL=http://localhost:5173
```

### Gmail App Password Setup
1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Go to Security > App Passwords
4. Generate a new app password for "Mail"
5. Use this password in `EMAIL_PASS`

## 🚀 API Endpoints

### Authentication Endpoints

#### Register Customer with OTP
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Registration successful! Please check your email for the verification code.",
  "data": {
    "userId": "user_id",
    "email": "john@example.com",
    "requiresVerification": true
  }
}
```

#### Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully!",
  "data": {
    "user": { ... },
    "token": "jwt_token"
  }
}
```

#### Resend OTP
```http
POST /api/auth/resend-otp
Content-Type: application/json

{
  "email": "john@example.com"
}
```

#### Seller Registration (Similar endpoints with /seller prefix)
```http
POST /api/auth/seller/register
POST /api/auth/seller/verify-otp
POST /api/auth/seller/resend-otp
```

### Order Email Triggers

#### Place Order
```http
POST /api/orders/create
Authorization: Bearer {token}
```
**Emails Sent:**
- Order confirmation to customer
- New order notification to all sellers in the order

#### Update Order Status
```http
PATCH /api/orders/:id/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "shipping",
  "trackingNumber": "TRACK123",
  "carrier": "fedex"
}
```
**Emails Sent:**
- Status update email to customer
- Shipping confirmation (if status is "shipping")
- Delivery confirmation (if status is "delivered")

#### Request Return
```http
POST /api/orders/:id/return
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Item does not fit"
}
```
**Emails Sent:**
- Return request confirmation to customer
- Return request notification to sellers

#### Approve/Reject Return
```http
PUT /api/seller/orders/:id/return
Authorization: Bearer {token}
Content-Type: application/json

{
  "approve": true,
  "note": "Return approved"
}
```
**Emails Sent:**
- Return approved email (if approved)
- Return rejected email (if rejected)

## 🧪 Testing

### Run Email System Tests
```bash
cd server
node test-email-system.js
```

This will send test emails for all templates to verify they're working correctly.

### Manual Testing Flow

#### 1. Test Customer Registration with OTP
```bash
# 1. Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "your-email@gmail.com",
    "password": "password123"
  }'

# 2. Check email for OTP
# 3. Verify OTP
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@gmail.com",
    "otp": "123456"
  }'
```

#### 2. Test Order Flow
```bash
# Create order (after login)
curl -X POST http://localhost:5000/api/orders/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [...],
    "shippingAddress": {...},
    "total": 100
  }'
```

## 📋 Email Flow Diagrams

### Customer Registration Flow
```
Customer Registers
    ↓
OTP Email Sent (6-digit code)
    ↓
Customer Enters OTP
    ↓
Email Verified
    ↓
Welcome Email Sent
```

### Order Lifecycle Flow
```
Order Placed
    ↓
├─> Customer: Order Confirmation Email
└─> Seller(s): New Order Notification Email
    ↓
Order Status Updates
    ↓
├─> Confirmed/Processing: Status Update Email
├─> Shipping: Shipping Confirmation + Tracking
└─> Delivered: Delivery Confirmation Email
```

### Return Flow
```
Customer Requests Return
    ↓
├─> Customer: Return Request Confirmation
└─> Seller: Return Request Notification
    ↓
Seller Reviews Return
    ↓
├─> Approved: Return Approved Email
└─> Rejected: Return Rejected Email
```

## 🎨 Email Template Customization

All email templates are located in `server/utils/email.js` in the `templates` object.

### Template Structure
```javascript
'template-name': (data) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #color; padding: 40px; text-align: center;">
      <h1 style="color: white; margin: 0;">Email Title</h1>
    </div>
    <div style="padding: 40px; background: #f8f9fa;">
      <!-- Email content here -->
    </div>
  </div>
`
```

### Adding a New Template
1. Add template to `templates` object in `server/utils/email.js`
2. Use the template in your route:
```javascript
await sendEmail({
  to: user.email,
  subject: 'Email Subject',
  template: 'template-name',
  data: {
    name: user.name,
    // ... other data
  }
});
```

## 🔒 Security Features

- ✅ OTP expires after 10 minutes
- ✅ Email verification required before login
- ✅ Secure password reset tokens
- ✅ Email sending errors don't break application flow
- ✅ Proper error logging for debugging

## 📊 Database Schema Updates

### Customer Model
```javascript
{
  emailVerificationOTP: String,
  emailVerificationOTPExpires: Date,
  isEmailVerified: Boolean,
  // ... other fields
}
```

### Seller Model
```javascript
{
  emailVerificationOTP: String,
  emailVerificationOTPExpires: Date,
  isEmailVerified: Boolean,
  // ... other fields
}
```

## 🐛 Troubleshooting

### Emails Not Sending
1. Check Gmail App Password is correct
2. Verify `EMAIL_USER` and `EMAIL_PASS` in `.env`
3. Check server logs for error messages
4. Ensure 2FA is enabled on Gmail account

### Emails Going to Spam
1. Add sender to contacts
2. Mark email as "Not Spam"
3. Check SPF/DKIM records (for production)

### OTP Not Working
1. Check OTP expiration (10 minutes)
2. Verify email address is correct
3. Check database for OTP storage

## 📈 Future Enhancements

- [ ] Email templates with HTML builder
- [ ] Email preferences/unsubscribe
- [ ] Email analytics and tracking
- [ ] SMS notifications integration
- [ ] Multi-language email support
- [ ] Email queue system for high volume

## 🎉 Summary

The Fashion Era email system provides:
- **13 different email templates** covering all scenarios
- **Complete OTP verification** for secure registration
- **Real-time order notifications** for customers and sellers
- **Full return management** email workflow
- **Professional, branded emails** with responsive design
- **Robust error handling** to prevent system failures

All email communications are automated and trigger at the appropriate points in the user journey, providing a seamless experience for both customers and sellers.
