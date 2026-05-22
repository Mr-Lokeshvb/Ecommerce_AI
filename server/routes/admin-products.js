const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { adminAuth, checkPermission } = require('./admin');

// @route   GET /api/admin/products
// @desc    Get all products
// @access  Private (Admin)
router.get('/', adminAuth, checkPermission('manageProducts'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      status,
      featured,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    // Build filter
    const filter = {};

    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { brand: new RegExp(search, 'i') }
      ];
    }

    if (category) filter.category = category;
    if (status) filter.status = status;
    if (featured !== undefined) filter.featured = featured === 'true';

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('seller', 'name email storeName')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments(filter)
    ]);

    // Log activity
    await req.admin.logActivity('VIEW_PRODUCTS', 'PRODUCT', null, 'Viewed products list', req.ip);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalProducts: total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching products' });
  }
});

// @route   GET /api/admin/products/stats
// @desc    Get product statistics
// @access  Private (Admin)
router.get('/stats', adminAuth, checkPermission('viewAnalytics'), async (req, res) => {
  try {
    const [
      totalProducts,
      activeProducts,
      inactiveProducts,
      featuredProducts,
      outOfStock,
      categoryCounts,
      avgPrice,
      topCategories
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ status: 'active' }),
      Product.countDocuments({ status: 'inactive' }),
      Product.countDocuments({ featured: true }),
      Product.countDocuments({ stock: 0 }),
      Product.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Product.aggregate([
        { $group: { _id: null, avgPrice: { $avg: '$price' } } }
      ]),
      Product.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 }, totalStock: { $sum: '$stock' } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        total: totalProducts,
        active: activeProducts,
        inactive: inactiveProducts,
        featured: featuredProducts,
        outOfStock: outOfStock,
        averagePrice: avgPrice[0]?.avgPrice || 0,
        categories: categoryCounts,
        topCategories
      }
    });
  } catch (error) {
    console.error('Get product stats error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching statistics' });
  }
});

// @route   GET /api/admin/products/:id
// @desc    Get product details
// @access  Private (Admin)
router.get('/:id', adminAuth, checkPermission('manageProducts'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name email storeName phone')
      .lean();

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Log activity
    await req.admin.logActivity('VIEW_PRODUCT', 'PRODUCT', product._id, `Viewed product: ${product.name}`, req.ip);

    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching product' });
  }
});

// @route   PATCH /api/admin/products/:id
// @desc    Update product
// @access  Private (Admin)
router.patch('/:id', adminAuth, checkPermission('manageProducts'), async (req, res) => {
  try {
    const updates = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Update product fields
    Object.keys(updates).forEach(key => {
      product[key] = updates[key];
    });

    await product.save();

    // Log activity
    await req.admin.logActivity('UPDATE_PRODUCT', 'PRODUCT', product._id, `Updated product: ${product.name}`, req.ip);

    res.json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ success: false, message: 'Server error updating product' });
  }
});

// @route   PATCH /api/admin/products/:id/feature
// @desc    Feature/unfeature product
// @access  Private (Admin)
router.patch('/:id/feature', adminAuth, checkPermission('manageProducts'), async (req, res) => {
  try {
    const { featured } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.isFeatured = featured;
    await product.save();

    // Log activity
    await req.admin.logActivity(
      featured ? 'FEATURE_PRODUCT' : 'UNFEATURE_PRODUCT',
      'PRODUCT',
      product._id,
      `${featured ? 'Featured' : 'Unfeatured'} product: ${product.name}`,
      req.ip
    );

    res.json({
      success: true,
      message: `Product ${featured ? 'featured' : 'unfeatured'} successfully`,
      product
    });
  } catch (error) {
    console.error('Feature product error:', error);
    res.status(500).json({ success: false, message: 'Server error updating product' });
  }
});

// @route   PATCH /api/admin/products/:id/status
// @desc    Change product active/inactive status
// @access  Private (Admin)
router.patch('/:id/status', adminAuth, checkPermission('manageProducts'), async (req, res) => {
  try {
    const { isActive } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.isActive = isActive;
    await product.save();

    // Log activity
    await req.admin.logActivity('UPDATE_PRODUCT_STATUS', 'PRODUCT', product._id, `Changed product to ${isActive ? 'active' : 'inactive'}: ${product.title || product.name}`, req.ip);

    res.json({
      success: true,
      message: `Product ${isActive ? 'activated' : 'deactivated'} successfully`,
      product
    });
  } catch (error) {
    console.error('Update product status error:', error);
    res.status(500).json({ success: false, message: 'Server error updating product status' });
  }
});

// @route   DELETE /api/admin/products/:id
// @desc    Delete product
// @access  Private (Admin)
router.delete('/:id', adminAuth, checkPermission('manageProducts'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const productName = product.name;
    await Product.findByIdAndDelete(req.params.id);

    // Log activity
    await req.admin.logActivity('DELETE_PRODUCT', 'PRODUCT', req.params.id, `Deleted product: ${productName}`, req.ip);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting product' });
  }
});

// @route   POST /api/admin/products/bulk-action
// @desc    Perform bulk actions on products
// @access  Private (Admin)
router.post('/bulk-action', adminAuth, checkPermission('manageProducts'), async (req, res) => {
  try {
    const { productIds, action, value } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid product IDs' });
    }

    let result;

    switch (action) {
      case 'delete':
        result = await Product.deleteMany({ _id: { $in: productIds } });
        await req.admin.logActivity('BULK_DELETE_PRODUCTS', 'PRODUCT', null, `Deleted ${result.deletedCount} products`, req.ip);
        break;

      case 'feature':
        result = await Product.updateMany({ _id: { $in: productIds } }, { featured: value });
        await req.admin.logActivity('BULK_FEATURE_PRODUCTS', 'PRODUCT', null, `Featured ${result.modifiedCount} products`, req.ip);
        break;

      case 'status':
        result = await Product.updateMany({ _id: { $in: productIds } }, { status: value });
        await req.admin.logActivity('BULK_UPDATE_STATUS', 'PRODUCT', null, `Updated status for ${result.modifiedCount} products`, req.ip);
        break;

      default:
        return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    res.json({
      success: true,
      message: `Bulk action completed successfully`,
      result
    });
  } catch (error) {
    console.error('Bulk action error:', error);
    res.status(500).json({ success: false, message: 'Server error performing bulk action' });
  }
});

module.exports = router;
