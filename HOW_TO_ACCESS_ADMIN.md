# 🎯 HOW TO ACCESS ADMIN PANEL - STEP BY STEP

## ✅ VERIFICATION: Everything is Loaded

All required files are present and verified:
- ✅ Backend routes: `/server/routes/admin*.js` (5 files)
- ✅ Admin model: `/server/models/Admin.js`
- ✅ Frontend pages: AdminLoginPage, AdminDashboard
- ✅ Admin components: 4 tab components
- ✅ Routes configured in App.tsx
- ✅ Server.js updated with admin routes

---

## 🚀 STEP-BY-STEP ACCESS GUIDE

### **STEP 1: Start MongoDB** (CRITICAL - Must be running!)

```bash
# Windows (Run as Administrator)
net start MongoDB

# OR if installed via installer:
# MongoDB should auto-start, check with:
services.msc
# Look for "MongoDB" service and start it

# Mac/Linux
sudo systemctl start mongod
# OR
brew services start mongodb-community
```

**Verify MongoDB is running:**
- You should see it listening on port `27017`
- Or check: `http://localhost:27017` in browser (should show "It looks like you are trying to access MongoDB over HTTP")

---

### **STEP 2: Create Super Admin Account**

Open a terminal in your project root and run:

```bash
# Navigate to server folder
cd server

# Run the script
node scripts/create-super-admin.js
```

**Expected Output:**
```
✅ Connected to MongoDB
✅ Super Admin created successfully!
==================================================
📧 Email: admin@fashionvr.com
🔑 Password: admin123
🔐 Role: SUPER_ADMIN
==================================================
⚠️  Please change the password after first login!
```

**If you see an error about MongoDB connection:**
- Make sure MongoDB is running (Step 1)
- Check your `.env` file has `MONGO_URI` or `MONGODB_URI`

---

### **STEP 3: Start Backend Server**

In the **server** folder:

```bash
# Make sure you're in the server directory
cd server

# Start the backend
npm run dev

# OR
node server.js
```

**Expected Output:**
```
🚀 Fashion Era Backend Server Started!
==================================================
🌐 Server running on: http://localhost:5000
📊 Health check: http://localhost:5000/health
🔧 Environment: development
==================================================
✅ Server is ready to accept connections!
```

**Keep this terminal open!**

---

### **STEP 4: Start Frontend Server**

Open a **NEW terminal** in project root:

```bash
# From project root directory
npm run dev
```

**Expected Output:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

**Keep this terminal open too!**

---

### **STEP 5: Access Admin Login Page**

Open your browser and navigate to:

```
http://localhost:5173/admin-login
```

**You should see:**
- Dark blue/slate themed page
- Shield logo at the top
- "Admin Control Panel" heading
- Security warning box
- Login form with email and password fields
- Demo credentials displayed

---

### **STEP 6: Login to Admin Panel**

Use the credentials:

```
📧 Email: admin@fashionvr.com
🔑 Password: admin123
```

**Steps:**
1. Enter `admin@fashionvr.com` in the email field
2. Enter `admin123` in the password field
3. Click **"Access Admin Panel"** button
4. Wait for authentication (should take 1-2 seconds)

**What happens:**
- You'll see a success toast notification
- You'll be redirected to `/admin-dashboard`
- Admin token saved in localStorage

---

### **STEP 7: Explore Admin Dashboard**

After successful login, you'll see:

#### **Dashboard Layout:**
```
┌─────────────────────────────────────────────────────┐
│  🛡️ Admin Control Panel    |  John Admin | Logout  │
├─────────────────────────────────────────────────────┤
│ Overview | Users | Sellers | Products | Orders | Analytics
├─────────────────────────────────────────────────────┤
│                                                     │
│  📊 Dashboard Content (depends on active tab)      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### **Available Tabs:**

1. **📊 Overview** (Default)
   - Total users, products, orders, revenue
   - Growth metrics
   - Recent orders and users
   - Top selling products

2. **👥 Users**
   - All customers in table format
   - Actions: Activate/Deactivate, Delete
   - User statistics

3. **🏪 Sellers**
   - All sellers with store info
   - Same actions as users

4. **📦 Products**
   - All products in grid view
   - Actions: Feature, Delete
   - Product images and details

5. **🛒 Orders**
   - All orders in table format
   - Update status dropdown
   - Order details

6. **📈 Analytics**
   - Placeholder for future features

---

## 🎯 QUICK ACCESS URLS

Save these for easy access:

```
Admin Login:     http://localhost:5173/admin-login
Admin Dashboard: http://localhost:5173/admin-dashboard

Customer Login:  http://localhost:5173/login
Seller Login:    http://localhost:5173/seller-login

Homepage:        http://localhost:5173/
```

---

## 🔍 TROUBLESHOOTING

### **Problem: "Connection Refused" when creating admin**
```
Error: connect ECONNREFUSED ::1:27017
```
**Solution:**
- MongoDB is not running
- Start MongoDB (see Step 1)
- Run the create-super-admin script again

---

### **Problem: "Cannot GET /admin-login" or blank page**
**Solution:**
- Frontend server not running
- Make sure you ran `npm run dev` from project root
- Check terminal for errors

---

### **Problem: Login button does nothing**
**Solution:**
- Backend server not running
- Check if `http://localhost:5000/health` responds
- Start backend server (see Step 3)

---

### **Problem: "Invalid credentials" error**
**Solution:**
- Make sure you created the super admin (Step 2)
- Use exact credentials: `admin@fashionvr.com` / `admin123`
- Check for typos

---

### **Problem: "Session expired" message**
**Solution:**
- Admin tokens expire after 8 hours
- Simply login again
- This is normal security behavior

---

### **Problem: Dashboard shows "Loading..." forever**
**Solution:**
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests
4. Verify backend is running
5. Check if MongoDB is connected

---

### **Problem: "Account locked" message**
**Solution:**
- You entered wrong password 5 times
- Account auto-locks for 2 hours
- Wait 2 hours OR
- Manually unlock in database OR
- Create a new admin account

---

## 🎨 WHAT YOU SHOULD SEE

### **Admin Login Page:**
- Dark blue/slate background
- Centered login form
- Shield icon (blue/cyan gradient)
- Security warning box (yellow)
- Demo credentials box
- "Back to Main Site" link

### **Admin Dashboard:**
- Dark theme (different from customer purple)
- Header with admin name and logout
- Tab navigation
- Stats cards with numbers
- Tables or grids depending on tab
- Action buttons (colored)

---

## 📝 ADMIN CREDENTIALS

### **Default Super Admin:**
```
Email:    admin@fashionvr.com
Password: admin123
Role:     SUPER_ADMIN
```

**⚠️ IMPORTANT:** Change this password after first login!

### **To Create Additional Admins:**
1. Login as SUPER_ADMIN
2. Use API endpoint: `POST /api/admin/register`
3. Or create via database

---

## 🔐 SECURITY NOTES

1. **Session Management**
   - Tokens expire after 8 hours
   - Stored in localStorage as `adminToken`
   - Auto-logout when expired

2. **Account Protection**
   - 5 failed attempts = 2-hour lock
   - All login attempts logged
   - IP tracking enabled

3. **Activity Logging**
   - Every action is logged
   - Viewable in admin profile
   - Includes: action, target, IP, timestamp

---

## ✅ VERIFICATION CHECKLIST

Before accessing admin, verify:

- [ ] MongoDB is running (check port 27017)
- [ ] Super admin created successfully
- [ ] Backend server running (port 5000)
- [ ] Frontend server running (port 5173)
- [ ] Can access `http://localhost:5173`
- [ ] Can access `http://localhost:5173/admin-login`

---

## 🎯 TESTING THE SYSTEM

### **After Login, Test These:**

1. **Overview Tab**
   - [ ] Stats cards show numbers
   - [ ] Recent orders appear
   - [ ] Recent users appear

2. **Users Tab**
   - [ ] Click "Users" tab
   - [ ] Table loads with users
   - [ ] Try deactivating a user
   - [ ] Try activating them back

3. **Products Tab**
   - [ ] Click "Products" tab
   - [ ] Products appear in grid
   - [ ] Try featuring a product
   - [ ] Image shows correctly

4. **Orders Tab**
   - [ ] Click "Orders" tab
   - [ ] Orders appear in table
   - [ ] Try changing an order status

5. **Logout**
   - [ ] Click logout button
   - [ ] Redirected to login page
   - [ ] Cannot access dashboard without login

---

## 📞 NEED HELP?

### **Check These First:**
1. Browser console (F12) - Look for red errors
2. Backend terminal - Look for error messages
3. MongoDB status - Is it running?
4. Network tab - Are API calls failing?

### **Common Error Messages:**

| Error | Meaning | Solution |
|-------|---------|----------|
| `ECONNREFUSED` | MongoDB not running | Start MongoDB |
| `401 Unauthorized` | Invalid/expired token | Login again |
| `403 Forbidden` | Insufficient permissions | Check admin role |
| `404 Not Found` | Wrong URL or route | Check URL spelling |
| `500 Server Error` | Backend error | Check server logs |

---

## 🚀 READY TO GO!

**Your complete access flow:**

1. ✅ MongoDB running → Port 27017
2. ✅ Super admin created → Email/Password ready
3. ✅ Backend running → `http://localhost:5000`
4. ✅ Frontend running → `http://localhost:5173`
5. ✅ Navigate to → `http://localhost:5173/admin-login`
6. ✅ Login with credentials
7. ✅ Access dashboard → Manage everything!

---

## 📱 BOOKMARK THESE

Add to your browser bookmarks:

```
Admin Login:  http://localhost:5173/admin-login
```

---

**🎉 You're all set! Access your admin panel now!**
