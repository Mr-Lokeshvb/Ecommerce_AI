const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

/**
 * Process and compress image
 * @param {Buffer} buffer - Image buffer
 * @param {Object} options - Processing options
 * @returns {Promise<Buffer>} - Processed image buffer
 */
async function compressImage(buffer, options = {}) {
  const {
    width = 1200,
    height = 1200,
    quality = 85,
    format = 'webp',
    fit = 'inside' // inside, cover, contain, fill
  } = options;

  try {
    let processor = sharp(buffer);

    // Get image metadata
    const metadata = await processor.metadata();
    console.log(`📊 Original image: ${metadata.width}x${metadata.height}, ${metadata.format}, ${(buffer.length / 1024).toFixed(2)}KB`);

    // Resize image
    processor = processor.resize({
      width,
      height,
      fit,
      withoutEnlargement: true // Don't enlarge smaller images
    });

    // Convert and compress based on format
    switch (format) {
      case 'webp':
        processor = processor.webp({ quality, effort: 6 });
        break;
      case 'jpeg':
      case 'jpg':
        processor = processor.jpeg({ quality, progressive: true, mozjpeg: true });
        break;
      case 'png':
        processor = processor.png({ quality, compressionLevel: 9, progressive: true });
        break;
      default:
        processor = processor.webp({ quality, effort: 6 });
    }

    const outputBuffer = await processor.toBuffer();
    console.log(`✅ Compressed to: ${(outputBuffer.length / 1024).toFixed(2)}KB (${((1 - outputBuffer.length / buffer.length) * 100).toFixed(1)}% reduction)`);

    return outputBuffer;
  } catch (error) {
    console.error('❌ Image compression error:', error);
    throw error;
  }
}

/**
 * Create multiple sizes/thumbnails from an image
 * @param {Buffer} buffer - Image buffer
 * @returns {Promise<Object>} - Object with different sizes
 */
async function createThumbnails(buffer) {
  const sizes = {
    thumbnail: { width: 150, height: 150, fit: 'cover' },
    small: { width: 400, height: 400, fit: 'inside' },
    medium: { width: 800, height: 800, fit: 'inside' },
    large: { width: 1200, height: 1200, fit: 'inside' }
  };

  const thumbnails = {};

  for (const [name, options] of Object.entries(sizes)) {
    thumbnails[name] = await compressImage(buffer, { ...options, format: 'webp' });
  }

  return thumbnails;
}

/**
 * Upload image to Cloudinary
 * @param {Buffer} buffer - Image buffer
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Cloudinary response
 */
async function uploadToCloudinary(buffer, options = {}) {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured');
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'products',
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 1200, crop: 'limit', quality: 'auto:good' },
          { fetch_format: 'auto' }
        ],
        ...options
      },
      (error, result) => {
        if (error) {
          console.error('❌ Cloudinary upload error:', error);
          reject(error);
        } else {
          console.log('✅ Uploaded to Cloudinary:', result.secure_url);
          resolve(result);
        }
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Delete image from Cloudinary
 * @param {String} publicId - Cloudinary public ID
 * @returns {Promise<Object>}
 */
async function deleteFromCloudinary(publicId) {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured');
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('🗑️ Deleted from Cloudinary:', publicId);
    return result;
  } catch (error) {
    console.error('❌ Cloudinary delete error:', error);
    throw error;
  }
}

/**
 * Crop image
 * @param {Buffer} buffer - Image buffer
 * @param {Object} cropData - Crop dimensions {x, y, width, height}
 * @returns {Promise<Buffer>}
 */
async function cropImage(buffer, cropData) {
  const { x, y, width, height } = cropData;

  try {
    const croppedBuffer = await sharp(buffer)
      .extract({ left: Math.round(x), top: Math.round(y), width: Math.round(width), height: Math.round(height) })
      .toBuffer();

    console.log(`✂️ Cropped image: ${width}x${height} from (${x}, ${y})`);
    return croppedBuffer;
  } catch (error) {
    console.error('❌ Image crop error:', error);
    throw error;
  }
}

/**
 * Apply filters/effects to image
 * @param {Buffer} buffer - Image buffer
 * @param {Object} filters - Filter options
 * @returns {Promise<Buffer>}
 */
async function applyFilters(buffer, filters = {}) {
  let processor = sharp(buffer);

  if (filters.rotate) {
    processor = processor.rotate(filters.rotate);
  }

  if (filters.flip) {
    processor = processor.flip();
  }

  if (filters.flop) {
    processor = processor.flop();
  }

  if (filters.grayscale) {
    processor = processor.grayscale();
  }

  if (filters.blur) {
    processor = processor.blur(filters.blur);
  }

  if (filters.sharpen) {
    processor = processor.sharpen();
  }

  if (filters.brightness) {
    processor = processor.modulate({ brightness: filters.brightness });
  }

  if (filters.saturation) {
    processor = processor.modulate({ saturation: filters.saturation });
  }

  return await processor.toBuffer();
}

module.exports = {
  compressImage,
  createThumbnails,
  uploadToCloudinary,
  deleteFromCloudinary,
  cropImage,
  applyFilters,
  isCloudinaryConfigured
};
