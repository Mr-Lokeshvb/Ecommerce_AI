const express = require('express');
const { body, validationResult } = require('express-validator');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/reviews/product/:productId
// @desc    Get reviews for a product
// @access  Public
router.get('/product/:productId', async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'createdAt' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    console.log('📝 Fetching reviews for product:', req.params.productId);

    const [reviews, total] = await Promise.all([
      Review.find({ 
        productId: req.params.productId, 
        isApproved: true 
      })
        .populate({
          path: 'userId',
          model: 'Customer',
          select: 'name avatar'
        })
        .sort({ [sort]: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Review.countDocuments({ 
        productId: req.params.productId, 
        isApproved: true 
      })
    ]);

    console.log('✅ Found reviews:', reviews.length);

    // Calculate rating distribution
    const ratingDistribution = await Review.aggregate([
      { $match: { productId: req.params.productId, isApproved: true } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        reviews,
        ratingDistribution,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalReviews: total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('❌ Get product reviews error:', error);
    console.error('Error message:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error fetching reviews',
      error: error.message
    });
  }
});

// @route   POST /api/reviews
// @desc    Create a review
// @access  Private
router.post('/', [
  auth,
  body('productId').isMongoId().withMessage('Invalid product ID'),
  body('orderId').isMongoId().withMessage('Invalid order ID'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be 5-100 characters'),
  body('comment').trim().isLength({ min: 10, max: 1000 }).withMessage('Comment must be 10-1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('❌ Review validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { productId, orderId, rating, title, comment, images } = req.body;
    console.log('📝 Creating review:', { productId, orderId, rating, title: title?.substring(0, 20) });

    // Verify the order exists and belongs to the user
    const order = await Order.findOne({
      _id: orderId,
      customer: req.user.id
    });

    console.log('🔍 Order lookup:', { 
      orderId, 
      userId: req.user.id, 
      found: !!order,
      status: order?.status 
    });

    if (!order) {
      return res.status(400).json({
        success: false,
        message: 'Order not found or does not belong to you'
      });
    }

    // Check if order is delivered (case-insensitive)
    if (order.status.toLowerCase() !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: `Order must be delivered before reviewing. Current status: ${order.status}`
      });
    }

    // Verify the product was in the order
    const orderItem = order.items.find(item => 
      item.productId.toString() === productId
    );

    if (!orderItem) {
      return res.status(400).json({
        success: false,
        message: 'Product not found in this order'
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      userId: req.user.id,
      productId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    // Create review
    const review = new Review({
      userId: req.user.id,
      productId,
      orderId,
      rating,
      title,
      comment,
      images: images || [],
      verifiedPurchase: true
    });

    console.log('💾 Saving review...');
    await review.save();
    console.log('✅ Review saved successfully');

    // Update product rating
    try {
      const product = await Product.findById(productId);
      if (product) {
        const allReviews = await Review.find({ productId, isApproved: true });
        
        const totalRating = allReviews.reduce((sum, rev) => sum + rev.rating, 0);
        product.ratingAverage = totalRating / allReviews.length;
        product.ratingCount = allReviews.length;
        
        await product.save();
        console.log('✅ Product rating updated');
      } else {
        console.warn('⚠️ Product not found, skipping rating update');
      }
    } catch (error) {
      console.error('⚠️ Error updating product rating (non-critical):', error.message);
      // Don't fail the review creation if rating update fails
    }

    await review.populate({
      path: 'userId',
      model: 'Customer',
      select: 'name avatar'
    });

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: { review }
    });
  } catch (error) {
    console.error('❌ Create review error:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error creating review',
      error: error.message
    });
  }
});

// @route   POST /api/reviews/:id/helpful
// @desc    Mark review as helpful
// @access  Private
router.post('/:id/helpful', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user already voted
    const existingVote = review.helpfulVotes.find(vote => 
      vote.userId.toString() === req.user.id
    );

    if (existingVote) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted on this review'
      });
    }

    // Add vote
    review.helpfulVotes.push({
      userId: req.user.id,
      vote: 'helpful'
    });

    review.helpful = review.helpfulVotes.filter(vote => 
      vote.vote === 'helpful'
    ).length;

    await review.save();

    res.json({
      success: true,
      message: 'Vote recorded successfully',
      data: { helpful: review.helpful }
    });
  } catch (error) {
    console.error('Vote helpful error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error recording vote'
    });
  }
});

module.exports = router;