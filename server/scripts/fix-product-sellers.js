require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Seller = require('../models/Seller');

const MONGODB_URI = process.env.MONGODB_URI;

console.log('🔧 Fixing Product Seller References');
console.log('====================================\n');

async function fixProductSellers() {
  try {
    console.log('📊 Connecting to database...');
    await mongoose.connect(MONGODB_URI, {
      dbName: 'fashion-era'
    });
    console.log('✅ Connected to database\n');

    // Get all sellers
    const sellers = await Seller.find({});
    console.log(`📊 Found ${sellers.length} sellers in database`);
    
    if (sellers.length === 0) {
      console.log('❌ No sellers found! Cannot assign products.');
      return;
    }

    // Get products without seller or with empty seller using direct MongoDB query
    const productsWithoutSeller = await mongoose.connection.db
      .collection('products')
      .find({
        $or: [
          { seller: null },
          { seller: '' },
          { seller: { $exists: false } }
        ]
      })
      .toArray();

    console.log(`📦 Found ${productsWithoutSeller.length} products without seller\n`);

    if (productsWithoutSeller.length === 0) {
      console.log('✅ All products already have sellers assigned!\n');
      return;
    }

    // Assign products to sellers in round-robin fashion
    let sellerIndex = 0;
    const updatedProducts = [];

    for (const product of productsWithoutSeller) {
      const seller = sellers[sellerIndex % sellers.length];
      
      // Update directly in MongoDB
      await mongoose.connection.db
        .collection('products')
        .updateOne(
          { _id: product._id },
          { $set: { seller: seller._id } }
        );
      
      console.log(`✅ Assigned "${product.title}" to seller "${seller.name}"`);
      
      updatedProducts.push({
        productId: product._id,
        productName: product.title,
        sellerId: seller._id,
        sellerName: seller.name
      });
      
      sellerIndex++;
    }

    console.log(`\n✅ Successfully updated ${updatedProducts.length} products\n`);
    
    // Show summary
    console.log('📊 ASSIGNMENT SUMMARY');
    console.log('====================\n');
    
    const sellerCounts = {};
    updatedProducts.forEach(p => {
      sellerCounts[p.sellerName] = (sellerCounts[p.sellerName] || 0) + 1;
    });
    
    console.table(sellerCounts);

    // Verify all products now have sellers
    const remainingWithoutSeller = await mongoose.connection.db
      .collection('products')
      .countDocuments({
        $or: [
          { seller: null },
          { seller: '' },
          { seller: { $exists: false } }
        ]
      });

    if (remainingWithoutSeller === 0) {
      console.log('\n✅ SUCCESS! All products now have sellers assigned!\n');
    } else {
      console.log(`\n⚠️  Warning: ${remainingWithoutSeller} products still without sellers\n`);
    }

  } catch (error) {
    console.error('\n❌ Error fixing product sellers:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed\n');
  }
}

// Run the fix
fixProductSellers()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
