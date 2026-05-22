# 🔐 Admin System - Complete Guide

## Overview

A comprehensive admin control panel has been created for FashionVR with full management capabilities over users, sellers, products, orders, and analytics.

---

## 🚀 Getting Started

### 1. Create Super Admin Account

First, create the super admin account by running:

```bash
node server/scripts/create-super-admin.js
```

This will create an admin account with:
- **Email:** admin@fashionvr.com
- **Password:** admin123
- **Role:** SUPER_ADMIN

⚠️ **Important:** Change the password after first login!

### 2. Access Admin Panel

Navigate to: `http://localhost:5173/admin-login`

---

## 📊 Features

### **1. Overview Dashboard**
- Real-time statistics (users, products, orders, revenue)
- Growth metrics and trends
- Recent orders and users
- Top selling products
- Quick access to important metrics

### **2. User Management**
- View all customers and sellers
- Filter and search users
- Activate/deactivate accounts
- Delete user accounts
- View user details and activity
- Export user data

**Actions Available:**
- ✅ Activate/Deactivate users
- ✉️ Manually verify emails
- 🔑 Reset passwords
- 🗑️ Delete accounts

### **3. Seller Management**
- View all sellers with store details
- Monitor seller performance
- Approve/reject seller applications
- Review business licenses
- Track sales and product counts

### **4. Product Management**
- View all products across sellers
- Feature/unfeature products
- Change product status
- Delete products
- Bulk operations
- Export product data

**Actions Available:**
- ⭐ Feature products on homepage
- 📝 Edit product details
- 🗑️ Delete products
- 📊 View product analytics
- 🔄 Bulk status updates

### **5. Order Management**
- View all orders system-wide
- Update order status
- Cancel orders
- Issue refunds
- Filter by status, date, amount
- Export order data

**Order Statuses:**
- Pending
- Processing
- Shipped
- Delivered
- Cancelled
- Refunded

### **6. Analytics & Reports**
- Revenue analytics (daily, weekly, monthly, yearly)
- User growth metrics
- Product performance
- Seller statistics
- Top customers
- Export data to CSV

---

## 🎯 Admin Roles & Permissions

### **SUPER_ADMIN**
- Full system access
- Can create/manage other admins
- Access to system settings
- All permissions enabled

### **ADMIN**
- Manage users, sellers, products, orders
- View analytics
- Cannot create other admins
- Cannot modify system settings

### **MODERATOR**
- Limited to content moderation
- Manage products and reviews
- View analytics only
- No user management access

---

## 🔒 Security Features

### **1. Authentication**
- Separate admin login system
- JWT token-based authentication
- 8-hour session timeout
- Password hashing with bcrypt (12 rounds)

### **2. Account Protection**
- Account lockout after 5 failed attempts
- 2-hour lockout period
- IP whitelisting support (optional)

### **3. Activity Logging**
- All admin actions logged
- Tracks: action type, target, timestamp, IP address
- Maintains last 1000 activities per admin
- Audit trail for compliance

### **4. Access Control**
- Role-based permissions
- Permission checks on every action
- API endpoint protection

---

## 🛠️ API Endpoints

### **Admin Authentication**
```
POST   /api/admin/login              - Admin login
POST   /api/admin/register           - Create new admin (SUPER_ADMIN only)
GET    /api/admin/me                 - Get current admin profile
```

### **User Management**
```
GET    /api/admin/users              - Get all users (customers & sellers)
GET    /api/admin/users/stats        - Get user statistics
GET    /api/admin/users/:type/:id    - Get specific user
PATCH  /api/admin/users/:type/:id/status - Update user status
PATCH  /api/admin/users/:type/:id/verify - Verify user email
DELETE /api/admin/users/:type/:id    - Delete user
POST   /api/admin/users/:type/:id/reset-password - Reset password
```

### **Product Management**
```
GET    /api/admin/products           - Get all products
GET    /api/admin/products/stats     - Get product statistics
GET    /api/admin/products/:id       - Get product details
PATCH  /api/admin/products/:id       - Update product
PATCH  /api/admin/products/:id/feature - Feature/unfeature product
PATCH  /api/admin/products/:id/status - Change product status
DELETE /api/admin/products/:id       - Delete product
POST   /api/admin/products/bulk-action - Bulk operations
```

### **Order Management**
```
GET    /api/admin/orders             - Get all orders
GET    /api/admin/orders/stats       - Get order statistics
GET    /api/admin/orders/:id         - Get order details
PATCH  /api/admin/orders/:id/status  - Update order status
POST   /api/admin/orders/:id/cancel  - Cancel order
POST   /api/admin/orders/:id/refund  - Issue refund
```

### **Analytics**
```
GET    /api/admin/analytics/dashboard  - Get dashboard analytics
GET    /api/admin/analytics/revenue    - Get revenue analytics
GET    /api/admin/analytics/products   - Get product analytics
GET    /api/admin/analytics/sellers    - Get seller analytics
GET    /api/admin/analytics/export     - Export data
```

---

## 📱 Frontend Routes

```
/admin-login           - Admin login page
/admin-dashboard       - Main admin dashboard
```

### **Dashboard Tabs:**
1. **Overview** - Dashboard statistics and quick actions
2. **Users** - Customer management
3. **Sellers** - Seller management
4. **Products** - Product management
5. **Orders** - Order management
6. **Analytics** - Reports and analytics

---

## 💻 Code Structure

### **Backend**
```
server/
├── models/
│   └── Admin.js                    - Admin model with authentication
├── routes/
│   ├── admin.js                    - Admin auth routes
│   ├── admin-users.js              - User management routes
│   ├── admin-products.js           - Product management routes
│   ├── admin-orders.js             - Order management routes
│   └── admin-analytics.js          - Analytics routes
└── scripts/
    └── create-super-admin.js       - Script to create super admin
```

### **Frontend**
```
src/
├── pages/
│   ├── AdminLoginPage.tsx          - Admin login page
│   └── AdminDashboard.tsx          - Main admin dashboard
└── components/
    └── admin/
        ├── OverviewTab.tsx         - Overview dashboard
        ├── UsersTab.tsx            - User management
        ├── ProductsTab.tsx         - Product management
        └── OrdersTab.tsx           - Order management
```

---

## 🎨 UI/UX Design

### **Color Scheme**
- **Primary:** Dark slate/blue theme
- **Accent:** Blue (#3B82F6) and Cyan (#06B6D4)
- **Status Colors:**
  - Green: Success, Active, Delivered
  - Yellow: Pending, Warning
  - Red: Error, Cancelled, Inactive
  - Blue: Processing, Info

### **Key Features**
- Dark professional theme (distinct from customer purple theme)
- Responsive design
- Real-time data updates
- Smooth animations
- Toast notifications for all actions
- Loading states
- Empty states

---

## 🔧 Configuration

### **Environment Variables**
No additional environment variables needed. Uses existing:
- `JWT_SECRET` - For token generation
- `MONGO_URI` - Database connection

### **Token Configuration**
- **Expiration:** 8 hours
- **Storage:** localStorage
- **Key:** `adminToken`

---

## 📈 Usage Examples

### **Create Additional Admin**
Only SUPER_ADMIN can create new admins:

```javascript
POST /api/admin/register
Headers: { Authorization: "Bearer <super_admin_token>" }
Body: {
  "name": "John Admin",
  "email": "john@admin.com",
  "password": "securepassword123",
  "role": "ADMIN",
  "permissions": {
    "manageUsers": true,
    "manageSellers": true,
    "manageProducts": true,
    "manageOrders": true,
    "viewAnalytics": true,
    "manageSettings": false,
    "manageAdmins": false
  }
}
```

### **Feature a Product**
```javascript
PATCH /api/admin/products/:productId/feature
Headers: { Authorization: "Bearer <admin_token>" }
Body: {
  "featured": true
}
```

### **Cancel an Order**
```javascript
POST /api/admin/orders/:orderId/cancel
Headers: { Authorization: "Bearer <admin_token>" }
Body: {
  "reason": "Customer request"
}
```

---

## 🔍 Activity Logs

All admin actions are automatically logged with:
- **Action:** What was done (e.g., "DELETE_USER", "UPDATE_PRODUCT")
- **Target Type:** What was affected (USER, SELLER, PRODUCT, ORDER, SYSTEM)
- **Target ID:** Specific record ID
- **Details:** Additional information
- **IP Address:** Admin's IP
- **Timestamp:** When it occurred

Access logs via admin profile or database.

---

## 🚨 Common Issues & Solutions

### **Issue: Cannot Login**
- Check if super admin was created
- Verify email and password
- Check if account is locked (wait 2 hours)
- Clear browser cache and try again

### **Issue: "Session Expired"**
- Token expires after 8 hours
- Simply login again
- Token stored in localStorage

### **Issue: "Insufficient Permissions"**
- Check admin role and permissions
- Some actions require SUPER_ADMIN role
- Contact super admin to update permissions

### **Issue: Data Not Loading**
- Check browser console for errors
- Verify backend server is running
- Check network tab for failed requests
- Ensure admin token is valid

---

## 🎯 Best Practices

### **Security**
1. Change default password immediately
2. Use strong passwords (min 8 characters)
3. Enable IP whitelisting for production
4. Regularly review activity logs
5. Create role-specific admin accounts
6. Never share admin credentials

### **Usage**
1. Use filters to find specific records
2. Export data before bulk operations
3. Double-check before deleting
4. Monitor dashboard regularly
5. Review analytics weekly
6. Keep activity logs for compliance

### **Maintenance**
1. Regular database backups
2. Monitor admin activity logs
3. Review and remove inactive admins
4. Update permissions as needed
5. Keep system up to date

---

## 📝 Future Enhancements

Potential features to add:
- [ ] Two-factor authentication (2FA)
- [ ] Advanced search and filters
- [ ] Custom reports builder
- [ ] Email notifications for critical events
- [ ] Admin activity dashboard
- [ ] Bulk user import/export
- [ ] Advanced analytics charts
- [ ] Role customization
- [ ] Scheduled reports
- [ ] Mobile app

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review activity logs
3. Check browser console for errors
4. Contact system administrator

---

## ✅ Checklist

Before going to production:

- [ ] Create super admin account
- [ ] Change default password
- [ ] Configure IP whitelist (optional)
- [ ] Test all features
- [ ] Set up activity log monitoring
- [ ] Create additional admin accounts
- [ ] Document custom processes
- [ ] Set up backup strategy
- [ ] Review security settings
- [ ] Train admin users

---

**System Status:** ✅ Fully Operational

**Last Updated:** 2026-02-18

**Version:** 1.0.0
