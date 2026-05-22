import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Truck, Shield, RotateCcw } from 'lucide-react';
import { useProductStore } from '../store/productStore';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { useCurrencyStore } from '../store/currencyStore';
import { useAuthStore } from '../store/authStore';
import ProductReviews from '../components/product/ProductReviews';
import toast from 'react-hot-toast';

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { allProducts, fetchAllProducts } = useProductStore();
  const { addItem } = useCartStore();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isItemInWishlist } = useWishlistStore();
  const { formatPrice, currency } = useCurrencyStore();
  const { user } = useAuthStore();
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Fetch products if not already loaded
  React.useEffect(() => {
    if (allProducts.length === 0) {
      fetchAllProducts();
    }
  }, [allProducts.length, fetchAllProducts]);

  const product = allProducts.find(p => p.id === id || (p as any)._id === id);

  // Extract sizes and colors from variants if they exist
  const availableSizes = product?.variants && product.variants.length > 0
    ? [...new Set(product.variants.map((v: any) => v.size))]
    : (product as any)?.sizes || [];

  const availableColors = product?.variants && product.variants.length > 0
    ? [...new Set(product.variants.map((v: any) => v.color))]
    : (product as any)?.colors || [];

  // Get image URL helper
  const getImageUrl = (image: any) => {
    if (typeof image === 'string') return image;
    return image?.url || '';
  };

  // Get primary image or first image
  const getPrimaryImageUrl = () => {
    if (!product?.images || product.images.length === 0) {
      console.log('❌ ProductDetailPage: No images found');
      return 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800';
    }
    
    console.log('🖼️ ProductDetailPage: Product images:', product.images);
    
    // Find primary image
    const primaryImage = product.images.find((img: any) => 
      typeof img === 'object' && img.isPrimary === true
    );
    
    if (primaryImage) {
      console.log('✅ ProductDetailPage: Using primary image:', primaryImage.url);
      return getImageUrl(primaryImage);
    }
    
    console.log('⚠️ ProductDetailPage: No primary, using first image');
    // Fallback to first image
    return getImageUrl(product.images[0]);
  };

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Product not found</h1>
        <Link to="/products" className="text-purple-600 hover:text-purple-700 mt-4 inline-block">
          Browse all products
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor) {
      toast.error('Please select size and color');
      return;
    }

    // Extract seller ID - handle both object and string formats
    const seller = (product as any).seller;
    const sellerId = typeof seller === 'object' && seller !== null
      ? (seller._id || seller.id || '')
      : (seller || (product as any).sellerId || '');

    console.log('🛒 Adding to cart - seller:', seller, 'sellerId:', sellerId);

    if (!sellerId) {
      toast.error('Unable to add to cart: seller information missing');
      console.error('❌ Seller ID is missing for product:', product);
      return;
    }

    addItem({
      productId: product.id,
      sellerId: sellerId,
      name: product.name || (product as any).title || 'Product',
      price: product.price || (product as any).basePrice || 0,
      image: getImageUrl(product.images?.[0]) || '',
      size: selectedSize,
      color: selectedColor,
      quantity,
    });
    toast.success('Added to cart!');
  };

  const handleWishlistToggle = () => {
    if (isItemInWishlist(product.id)) {
      removeFromWishlist(product.id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist({
        id: Date.now().toString(),
        productId: product.id,
        name: product.name || (product as any).title || 'Product',
        price: product.price || (product as any).basePrice || 0,
        image: getImageUrl(product.images?.[0]) || '',
      });
      toast.success('Added to wishlist');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl bg-gray-100">
            <img
              src={selectedImage === 0 ? getPrimaryImageUrl() : getImageUrl(product.images?.[selectedImage])}
              alt={product.name || (product as any).title}
              className="w-full h-96 lg:h-[600px] object-cover"
              onError={(e) => {
                console.error('Failed to load product image:', selectedImage);
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800';
              }}
            />
            {(product as any).isNew && (
              <span className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                NEW
              </span>
            )}
          </div>
          
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                    selectedImage === index ? 'border-purple-600' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={getImageUrl(image)}
                    alt={`${product.name || (product as any).title} ${index + 1}`}
                    className="w-full h-20 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200';
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name || (product as any).title}</h1>
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(product.rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-gray-600">({product.reviewCount} reviews)</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div>
                <span className="text-3xl font-bold text-gray-900">{formatPrice(product.price || product.basePrice || 0)}</span>
                {currency === 'INR' && (
                  <span className="text-sm text-gray-500 ml-2">
                    (${(product.price || product.basePrice || 0).toFixed(2)} USD)
                  </span>
                )}
              </div>
              {product.originalPrice && (
                <span className="text-xl text-gray-500 line-through">${product.originalPrice}</span>
              )}
              {product.originalPrice && (
                <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-sm font-semibold">
                  Save ${(product.originalPrice - product.price).toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <p className="text-gray-600 leading-relaxed">{product.description}</p>

          {/* Size Selection */}
          {availableSizes.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Size</h3>
              <div className="grid grid-cols-5 gap-3">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`py-3 px-4 border rounded-lg text-sm font-medium transition-colors ${
                      selectedSize === size
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-purple-600'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color Selection */}
          {availableColors.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Color</h3>
              <div className="flex flex-wrap gap-3">
                {availableColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-12 h-12 rounded-full border-4 transition-all ${
                      selectedColor === color
                        ? 'border-purple-600 scale-110'
                        : 'border-gray-300 hover:border-purple-400'
                    } ${getColorClass(color)}`}
                    title={color}
                  >
                    {selectedColor === color && (
                      <div className="w-full h-full rounded-full bg-black bg-opacity-20 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Quantity</h3>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                -
              </button>
              <span className="text-lg font-semibold w-8 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            {user?.role?.toUpperCase() === 'SELLER' ? (
              // Seller View - Display only message
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 text-center">
                <p className="text-blue-800 font-semibold text-lg mb-2">Seller View Mode</p>
                <p className="text-blue-600 text-sm">
                  You're viewing this product as a seller. Customers can purchase this product from the store.
                </p>
              </div>
            ) : (
              // Customer View - Show purchase options
              <div className="flex space-x-4">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-purple-600 text-white py-4 px-6 rounded-full font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span>Add to Cart</span>
                </button>
                <button
                  onClick={handleWishlistToggle}
                  className={`p-4 border-2 rounded-full transition-colors ${
                    isItemInWishlist(product.id)
                      ? 'bg-red-500 text-white border-red-500'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-red-500 hover:text-red-500'
                  }`}
                >
                  <Heart className="h-6 w-6" fill={isItemInWishlist(product.id) ? 'currentColor' : 'none'} />
                </button>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6 pt-8 border-t border-gray-200">
            {((product as any).material) && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Material</h4>
                <p className="text-gray-600">{(product as any).material}</p>
              </div>
            )}

            {((product as any).careInstructions || (product as any).care) && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Care Instructions</h4>
                <ul className="text-gray-600 space-y-1">
                  {((product as any).careInstructions || (product as any).care || []).map((instruction: string, index: number) => (
                    <li key={index}>• {instruction}</li>
                  ))}
                </ul>
              </div>
            )}

            {((product as any).features && (product as any).features.length > 0) && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Features</h4>
                <ul className="text-gray-600 space-y-1">
                  {(product as any).features.map((feature: string, index: number) => (
                    <li key={index}>• {feature}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <Truck className="h-5 w-5" />
                <span className="text-sm">Free Shipping</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Shield className="h-5 w-5" />
                <span className="text-sm">Secure Payment</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <RotateCcw className="h-5 w-5" />
                <span className="text-sm">Easy Returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ProductReviews productId={id || ''} />
      </div>
    </div>
  );
};

const getColorClass = (color: string) => {
  const colorMap: { [key: string]: string } = {
    // Basic colors
    white: 'bg-white',
    White: 'bg-white',
    black: 'bg-black',
    Black: 'bg-black',
    brown: 'bg-amber-700',
    Brown: 'bg-amber-700',
    gray: 'bg-gray-500',
    Gray: 'bg-gray-500',
    grey: 'bg-gray-500',
    Grey: 'bg-gray-500',
    
    // Blues
    navy: 'bg-blue-900',
    Navy: 'bg-blue-900',
    'dark-blue': 'bg-blue-800',
    'light-blue': 'bg-blue-300',
    blue: 'bg-blue-500',
    Blue: 'bg-blue-500',
    
    // Reds & Pinks
    red: 'bg-red-500',
    Red: 'bg-red-500',
    pink: 'bg-pink-500',
    Pink: 'bg-pink-500',
    maroon: 'bg-red-900',
    Maroon: 'bg-red-900',
    
    // Greens
    green: 'bg-green-500',
    Green: 'bg-green-500',
    olive: 'bg-green-700',
    Olive: 'bg-green-700',
    teal: 'bg-teal-500',
    Teal: 'bg-teal-500',
    
    // Yellows & Oranges
    yellow: 'bg-yellow-400',
    Yellow: 'bg-yellow-400',
    orange: 'bg-orange-500',
    Orange: 'bg-orange-500',
    beige: 'bg-amber-200',
    Beige: 'bg-amber-200',
    gold: 'bg-yellow-600',
    Gold: 'bg-yellow-600',
    
    // Purples
    purple: 'bg-purple-500',
    Purple: 'bg-purple-500',
    
    // Special
    charcoal: 'bg-gray-800',
    'floral-blue': 'bg-blue-400',
    'floral-pink': 'bg-pink-400',
    'solid-white': 'bg-white',
    silver: 'bg-gray-300',
    Silver: 'bg-gray-300',
  };
  return colorMap[color] || 'bg-gray-400';
};

export default ProductDetailPage;