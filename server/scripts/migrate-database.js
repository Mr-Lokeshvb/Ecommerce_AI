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

// Old and New Database URIs
const OLD_DB_URI = 'mongodb+srv://mohitnaik:mohitnaik@cluster0.g0po2zr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const NEW_DB_URI = process.env.MONGODB_URI;

console.log('🔄 Database Migration Script');
console.log('============================\n');

async function migrateData() {
  let oldConnection;
  let newConnection;
  
  try {
    console.log('📊 Step 1: Connecting to OLD database...');
    oldConnection = await mongoose.createConnection(OLD_DB_URI, {
      dbName: 'fashion-era'
    });
    console.log('✅ Connected to OLD database\n');

    console.log('📊 Step 2: Connecting to NEW database...');
    newConnection = await mongoose.createConnection(NEW_DB_URI, {
      dbName: 'fashion-era'
    });
    console.log('✅ Connected to NEW database\n');

    // Define models for both connections
    const oldModels = {
      Customer: oldConnection.model('Customer', Customer.schema),
      Seller: oldConnection.model('Seller', Seller.schema),
      Product: oldConnection.model('Product', Product.schema),
      Order: oldConnection.model('Order', Order.schema),
      Cart: oldConnection.model('Cart', Cart.schema),
      Wishlist: oldConnection.model('Wishlist', Wishlist.schema),
      Review: oldConnection.model('Review', Review.schema),
      Shipment: oldConnection.model('Shipment', Shipment.schema)
    };

    const newModels = {
      Customer: newConnection.model('Customer', Customer.schema),
      Seller: newConnection.model('Seller', Seller.schema),
      Product: newConnection.model('Product', Product.schema),
      Order: newConnection.model('Order', Order.schema),
      Cart: newConnection.model('Cart', Cart.schema),
      Wishlist: newConnection.model('Wishlist', Wishlist.schema),
      Review: newConnection.model('Review', Review.schema),
      Shipment: newConnection.model('Shipment', Shipment.schema)
    };

    console.log('📊 Step 3: Migrating data...\n');

    const collections = ['Customer', 'Seller', 'Product', 'Order', 'Cart', 'Wishlist', 'Review', 'Shipment'];
    const migrationStats = {};

    for (const collectionName of collections) {
      try {
        console.log(`\n📦 Migrating ${collectionName}s...`);
        
        // Get count from old database
        const oldCount = await oldModels[collectionName].countDocuments();
        console.log(`   Found ${oldCount} documents in OLD database`);
        
        if (oldCount === 0) {
          console.log(`   ⚠️  No ${collectionName}s to migrate`);
          migrationStats[collectionName] = { old: 0, new: 0, migrated: 0 };
          continue;
        }

        // Fetch all documents from old database
        const documents = await oldModels[collectionName].find({}).lean();
        console.log(`   Fetched ${documents.length} documents`);

        // Check if data already exists in new database
        const newCount = await newModels[collectionName].countDocuments();
        
        if (newCount > 0) {
          console.log(`   ⚠️  NEW database already has ${newCount} ${collectionName}s`);
          console.log(`   Clearing NEW database ${collectionName}s first...`);
          await newModels[collectionName].deleteMany({});
          console.log(`   ✅ Cleared ${newCount} old documents`);
        }

        // Insert into new database
        if (documents.length > 0) {
          // For Customer and Seller, use direct collection insertion to bypass Mongoose validation
          if (collectionName === 'Customer' || collectionName === 'Seller') {
            const collectionNameLower = collectionName.toLowerCase() + 's';
            await newConnection.collection(collectionNameLower).insertMany(documents);
            console.log(`   ✅ Migrated ${documents.length} ${collectionName}s (direct insert)`);
          } else {
            await newModels[collectionName].insertMany(documents, { validateBeforeSave: false });
            console.log(`   ✅ Migrated ${documents.length} ${collectionName}s`);
          }
        }

        // Verify migration
        const finalCount = await newModels[collectionName].countDocuments();
        console.log(`   ✅ Verification: ${finalCount} documents in NEW database`);

        migrationStats[collectionName] = {
          old: oldCount,
          new: finalCount,
          migrated: documents.length
        };

      } catch (error) {
        console.error(`   ❌ Error migrating ${collectionName}:`, error.message);
        migrationStats[collectionName] = { error: error.message };
      }
    }

    console.log('\n\n📊 MIGRATION SUMMARY');
    console.log('===================\n');
    console.table(migrationStats);

    // Calculate totals
    const totalOld = Object.values(migrationStats).reduce((sum, stat) => sum + (stat.old || 0), 0);
    const totalNew = Object.values(migrationStats).reduce((sum, stat) => sum + (stat.new || 0), 0);
    const totalMigrated = Object.values(migrationStats).reduce((sum, stat) => sum + (stat.migrated || 0), 0);

    console.log('\n📈 TOTALS:');
    console.log(`   Old Database: ${totalOld} documents`);
    console.log(`   New Database: ${totalNew} documents`);
    console.log(`   Migrated: ${totalMigrated} documents`);

    if (totalOld === totalNew) {
      console.log('\n✅ Migration completed successfully!');
      console.log('All data has been transferred to the new database.\n');
    } else {
      console.log('\n⚠️  Migration completed with warnings!');
      console.log('Please review the migration stats above.\n');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    console.log('\n🔌 Closing database connections...');
    if (oldConnection) await oldConnection.close();
    if (newConnection) await newConnection.close();
    console.log('✅ Connections closed\n');
  }
}

// Run migration
migrateData()
  .then(() => {
    console.log('✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });
