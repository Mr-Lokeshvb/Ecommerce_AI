const express = require('express');
const multer = require('multer');
const upload = require('../middleware/upload');
const { auth, authorize } = require('../middleware/auth');
const path = require('path');
const fs = require('fs').promises;
const { 
  compressImage
  // Cloudinary disabled - using local storage only
  // uploadToCloudinary, 
  // deleteFromCloudinary,
  // cropImage,
  // applyFilters,
  // isCloudinaryConfigured 
} = require('../utils/imageProcessor');

const router = express.Router();

// @route   POST /api/upload/product-images
// @desc    Upload product images with compression and optional cloud storage
// @access  Private (Seller)
router.post('/product-images', [auth, authorize('SELLER')], upload.memoryUpload.array('images', 6), async (req, res) => {
  try {
    console.log('📸 Upload request received');
    console.log('👤 User:', req.user?.email);
    console.log('📁 Files received:', req.files?.length || 0);
    
    if (!req.files || req.files.length === 0) {
      console.error('❌ No files in request');
      return res.status(400).json({
        success: false,
        message: 'No images uploaded'
      });
    }

    console.log(`📸 Processing ${req.files.length} image(s)...`);
    
    // Force local storage (disable Cloudinary for now)
    const useCloudinary = false; // isCloudinaryConfigured() && req.query.cloudinary !== 'false';
    console.log(`💾 Using ${useCloudinary ? 'Cloudinary' : 'Local Storage'}`);
    
    const imageUrls = [];

    for (let index = 0; index < req.files.length; index++) {
      const file = req.files[index];
      const originalSize = file.size;
      
      console.log(`\n🖼️ Processing image ${index + 1}/${req.files.length}: ${file.originalname}`);
      console.log(`📊 Original size: ${(originalSize / 1024).toFixed(2)}KB`);

      let imageBuffer = file.buffer;

      // Crop and filter features disabled for now
      // Just compress and save

      // Compress image - keep original format for PNGs, otherwise convert to WebP
      const originalFormat = file.mimetype.includes('png') ? 'png' : 'webp';
      const compressedBuffer = await compressImage(imageBuffer, {
        width: 1200,
        height: 1200,
        quality: 85,
        format: originalFormat,
        fit: 'inside'
      });

      const compressedSize = compressedBuffer.length;
      const reduction = ((1 - compressedSize / originalSize) * 100).toFixed(1);
      console.log(`✅ Compressed: ${(compressedSize / 1024).toFixed(2)}KB (${reduction}% reduction)`);

      // Save locally with correct extension
      const ext = file.mimetype.includes('png') ? 'png' : 'webp';
      const filename = `product-${Date.now()}-${index}.${ext}`;
      const uploadDir = path.join(__dirname, '../../uploads/products');
      const filepath = path.join(uploadDir, filename);

      await fs.writeFile(filepath, compressedBuffer);
      console.log(`💾 Saved locally: ${filename} (${ext.toUpperCase()})`);

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      imageUrls.push({
        url: `${baseUrl}/uploads/products/${filename}`,
        alt: req.body.alt || 'Product image',
        isPrimary: index === 0,
        filename: filename,
        size: compressedSize,
        storage: 'local'
      });
    }

    console.log(`\n✅ All images processed successfully!`);
    console.log(`📦 Storage: Local`);

    res.json({
      success: true,
      data: imageUrls,
      message: `${req.files.length} image(s) uploaded and compressed successfully`,
      storage: 'local'
    });
  } catch (error) {
    console.error('❌ Image upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload images'
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB per image.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 6 images.'
      });
    }
  }
  
  res.status(400).json({
    success: false,
    message: error.message || 'File upload failed'
  });
});

module.exports = router;
