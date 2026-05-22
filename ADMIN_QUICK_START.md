# 🚀 Admin System - Quick Start Guide

## Step 1: Create Super Admin

Run this command in your terminal:

```bash
# Windows PowerShell
cd server; node scripts/create-super-admin.js

# Mac/Linux
cd server && node scripts/create-super-admin.js
```

You should see:
```
✅ Super Admin created successfully!
==================================================
📧 Email: admin@fashionvr.com
🔑 Password: admin123
🔐 Role: SUPER_ADMIN
==================================================
⚠️  Please change the password after first login!
```

---

## Step 2: Start the Server

```bash
# Start backend (from root directory)
cd server
npm run dev

# Start frontend (in another terminal, from root)
npm run dev
```

---

## Step 3: Access Admin Panel

1. Open browser: `http://localhost:5173/admin-login`
2. Login with:
   - **Email:** admin@fashionvr.com
   - **Password:** admin123

---

## Step 4: Explore Features

### 📊 Overview Tab
- View real-time statistics
- See recent orders and users
- Monitor growth metrics

### 👥 Users Tab
- View all customers
- Activate/deactivate accounts
- Delete users
- Reset passwords

### 🏪 Sellers Tab
- Manage seller accounts
- View store information
- Monitor seller performance

### 📦 Products Tab
- View all products
- Feature products
- Delete products
- Bulk operations

### 🛒 Orders Tab
- View all orders
- Update order status
- Cancel orders
- Issue refunds

### 📈 Analytics Tab
- Revenue reports
- User growth
- Product performance

---

## 🎯 Quick Actions

### Feature a Product
1. Go to Products tab
2. Find the product
3. Click "Feature" button
4. Product will appear on homepage

### Deactivate a User
1. Go to Users tab
2. Find the user
3. Click the Ban icon
4. User account will be deactivated

### Update Order Status
1. Go to Orders tab
2. Find the order
3. Select new status from dropdown
4. Order status updates automatically

---

## 🔐 Security Notes

- ⚠️ Change default password immediately!
- 🔒 Account locks after 5 failed login attempts
- ⏱️ Session expires after 8 hours
- 📝 All actions are logged

---

## 🆘 Troubleshooting

**Cannot login?**
- Verify super admin was created
- Check email/password
- Clear browser cache

**Data not loading?**
- Ensure backend server is running on port 5000
- Check browser console for errors
- Verify token in localStorage

**Session expired?**
- Login again
- Token expires after 8 hours

---

## 📚 Full Documentation

See `ADMIN_SYSTEM_GUIDE.md` for complete documentation.

---

**Happy Managing! 👑**
