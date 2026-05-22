const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const Admin = require('../models/Admin');

const createSuperAdmin = async () => {
  try {
    // Connect to MongoDB - prioritize Atlas (cloud) over local
    let mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoURI) {
      console.error('❌ MongoDB URI not found in environment variables');
      process.exit(1);
    }

    // Ensure the database name is included for Atlas connections (same as server config)
    if (mongoURI.includes('mongodb+srv') && mongoURI.includes('/?')) {
      const dbName = 'fashion-era';
      mongoURI = mongoURI.replace('/?', `/${dbName}?`);
      console.log(`🔧 Forcing database name for Atlas connection: ${dbName}`);
    }

    console.log('🔗 Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
    console.log('📊 Database:', mongoose.connection.name);

    // Check if super admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@fashionvr.com' });
    
    if (existingAdmin) {
      console.log('⚠️  Super Admin already exists');
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 Name:', existingAdmin.name);
      console.log('🔑 Role:', existingAdmin.role);
      process.exit(0);
    }

    // Create super admin
    const superAdmin = new Admin({
      name: 'Super Admin',
      email: 'admin@fashionvr.com',
      password: 'admin123', // Will be hashed automatically
      role: 'SUPER_ADMIN',
      isActive: true,
      permissions: {
        manageUsers: true,
        manageSellers: true,
        manageProducts: true,
        manageOrders: true,
        viewAnalytics: true,
        manageSettings: true,
        manageAdmins: true
      }
    });

    await superAdmin.save();

    console.log('✅ Super Admin created successfully!');
    console.log('=' .repeat(50));
    console.log('📧 Email: admin@fashionvr.com');
    console.log('🔑 Password: admin123');
    console.log('🔐 Role: SUPER_ADMIN');
    console.log('=' .repeat(50));
    console.log('⚠️  Please change the password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    process.exit(1);
  }
};

createSuperAdmin();
