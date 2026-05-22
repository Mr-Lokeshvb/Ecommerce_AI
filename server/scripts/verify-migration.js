require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

// Import all models
const Customer = require('../models/Customer');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');
const Review = require('../models/Review');
const Shipment = require('../models/Shipment');

const NEW_DB_URI = process.env.MONGODB_URI;

console.log('🔍 Database Verification Script');
console.log('================================\n');

async function verifyData() {
  try {
    console.log('📊 Connecting to NEW database...');
    await mongoose.connect(NEW_DB_URI, {
      dbName: 'fashion-era'
    });
    console.log('✅ Connected to NEW database\n');

    console.log('📊 Verifying migrated data...\n');

    const collections = [
      { name: 'Customers', model: Customer },
      { name: 'Sellers', model: Seller },
      { name: 'Products', model: Product },
      { name: 'Orders', model: Order },
      { name: 'Carts', model: Cart },
      { name: 'Wishlists', model: Wishlist },
      { name: 'Reviews', model: Review },
      { name: 'Shipments', model: Shipment }
    ];

    const verificationResults = {};

    for (const collection of collections) {
      const count = await collection.model.countDocuments();
      verificationResults[collection.name] = count;
      
      if (count > 0) {
        // Get sample document
        const sample = await collection.model.findOne().lean();
        console.log(`✅ ${collection.name}: ${count} documents`);
        
        // Show some sample fields
        if (collection.name === 'Customers' || collection.name === 'Sellers') {
          console.log(`   Sample: ${sample.name} (${sample.email})`);
        } else if (collection.name === 'Products') {
          console.log(`   Sample: ${sample.name} - $${sample.price}`);
        } else if (collection.name === 'Orders') {
          console.log(`   Sample: Order #${sample.orderNumber} - $${sample.total}`);
        }
      } else {
        console.log(`⚠️  ${collection.name}: No documents found`);
      }
    }

    console.log('\n📊 VERIFICATION SUMMARY');
    console.log('=======================\n');
    console.table(verificationResults);

    const totalDocs = Object.values(verificationResults).reduce((sum, count) => sum + count, 0);
    console.log(`\n📈 Total Documents in NEW Database: ${totalDocs}`);

    console.log('\n✅ Verification completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed\n');
  }
}

// Run verification
verifyData()
  .then(() => {
    console.log('✅ Verification script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Verification script failed:', error);
    process.exit(1);
  });
