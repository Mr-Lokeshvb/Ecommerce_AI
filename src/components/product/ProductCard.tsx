import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, ShoppingCart, Eye } from 'lucide-react';
import { Product } from '../../store/productStore';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { useCurrencyStore } from '../../store/currencyStore';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem } = useCartStore();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isItemInWishlist } = useWishlistStore();
  const { formatPrice, currency } = useCurrencyStore();
  const { user } = useAuthStore();
  const [imageError, setImageError] = React.useState(false);

  const getImageUrl = () => {
    if (product.images && product.images.length > 0) {
      console.log(`\n🖼️ Product: "${product.name || (product as any).title}"`);
      console.log('📦 Product ID:', product.id);
      console.log('🎨 All images:', JSON.stringify(product.images, null, 2));
      
      // Find the primary image first
      const primaryImage = product.images.find((img: any) => 
        typeof img === 'object' && img.isPrimary === true
      );
      
      if (primaryImage) {
        console.log('✅ Found primary image:', primaryImage.url);
        return primaryImage.url;
      }
      
      console.log('⚠️ No primary image found, using first image');
      // Fallback to first image
      const firstImage = product.images[0];
      const url = typeof firstImage === 'string' ? firstImage : firstImage?.url;
      console.log('📍 Using URL:', url);
      return url;
    }
    console.log('❌ No images for this product, using fallback');
    return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&crop=center';
  };

  const handleImageError = () => {
    console.error('Image failed to load:', getImageUrl());
    setImageError(true);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();

    // Extract seller ID from product
    const seller = (product as any).seller;
    const sellerId = typeof seller === 'object' && seller !== null
      ? (seller._id || seller.id || '')
      : (seller || (product as any).sellerId || '');

    console.log('🛒 Quick add to cart - Product:', product.name || product.title);
    console.log('👤 Seller data:', seller);
    console.log('🆔 Extracted sellerId:', sellerId);

    if (!sellerId) {
      toast.error('Unable to add to cart: seller information missing. Please try from product details page.');
      console.error('❌ No sellerId found for product:', product);
      return;
    }

    // Get available sizes and colors from variants or fallback to defaults
    const availableSizes = product.variants?.map(v => v.size) || product.sizes || ['M'];
    const availableColors = product.variants?.map(v => v.color) || product.colors || ['Black'];

    addItem({
      productId: product.id,
      sellerId: sellerId,
      name: product.name || product.title || 'Product',
      price: product.price || product.basePrice || 0,
      image: typeof product.images?.[0] === 'string' ? product.images[0] : product.images?.[0]?.url || '',
      size: availableSizes[0],
      color: availableColors[0],
      quantity: 1,
    });
    toast.success('Added to cart!');
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isItemInWishlist(product.id)) {
      removeFromWishlist(product.id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist({
        id: Date.now().toString(),
        productId: product.id,
        name: product.name || product.title || 'Product',
        price: product.price || product.basePrice || 0,
        image: typeof product.images?.[0] === 'string' ? product.images[0] : product.images?.[0]?.url || '',
      });
      toast.success('Added to wishlist');
    }
  };

  return (
    <div className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
      <div className="relative overflow-hidden rounded-t-2xl bg-gray-100">
        <img
          src={imageError ? 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&crop=center' : getImageUrl()}
          alt={product.name || product.title || 'Product'}
          className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
          onError={handleImageError}
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col space-y-2">
          <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
            NEW
          </span>
        </div>

        {/* Quick Actions - Hide for Sellers */}
        {user?.role?.toUpperCase() !== 'SELLER' && (
          <>
            <div className="absolute top-4 right-4 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={handleWishlistToggle}
                className={`p-2 rounded-full transition-colors ${
                  isItemInWishlist(product.id)
                    ? 'bg-red-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-red-500 hover:text-white'
                }`}
              >
                <Heart className="h-5 w-5" fill={isItemInWishlist(product.id) ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Quick Add to Cart */}
            <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={handleAddToCart}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-full hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>Add to Cart</span>
              </button>
            </div>
          </>
        )}
        
        {/* Seller View Badge */}
        {user?.role?.toUpperCase() === 'SELLER' && (
          <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Link
              to={`/product/${product.id || (product as any)._id}`}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-full hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Eye className="h-4 w-4" />
              <span>View Details</span>
            </Link>
          </div>
        )}
      </div>

      <Link to={`/product/${product.id || (product as any)._id}`} className="block p-6">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
            {product.name || product.title || 'Product'}
          </h3>

          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => {
                const rating = (product as any).ratingAverage || product.rating || 0;
                const fillPercentage = Math.max(0, Math.min(1, rating - i));
                
                return (
                  <div key={i} className="relative">
                    {fillPercentage > 0 && fillPercentage < 1 ? (
                      // Partial star for decimal ratings (e.g., 3.5 stars)
                      <div className="relative h-4 w-4">
                        <Star className="h-4 w-4 text-gray-300 absolute" />
                        <div style={{ width: `${fillPercentage * 100}%`, overflow: 'hidden' }} className="absolute">
                          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        </div>
                      </div>
                    ) : (
                      // Full or empty star
                      <Star
                        className={`h-4 w-4 ${
                          i < Math.floor(rating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <span className="text-sm text-gray-600">
              {(product as any).ratingAverage ? (product as any).ratingAverage.toFixed(1) : '0.0'} ({(product as any).ratingCount || 0})
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-2xl font-bold text-gray-900">
              {formatPrice(product.price || product.basePrice || 0)}
            </span>
            {currency === 'INR' && (
              <span className="text-sm text-gray-500">
                (${(product.price || product.basePrice || 0).toFixed(2)})
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {(product.variants?.map(v => v.color) || product.colors || ['Black']).slice(0, 4).map((color, index) => (
              <div
                key={`${color}-${index}`}
                className={`w-6 h-6 rounded-full border-2 border-gray-300 ${getColorClass(color)}`}
              ></div>
            ))}
          </div>
        </div>
      </Link>
    </div>
  );
};

const getColorClass = (color: string) => {
  const colorLower = color.toLowerCase();
  const colorMap: { [key: string]: string } = {
    // Basic colors
    white: 'bg-white',
    black: 'bg-black',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
    orange: 'bg-orange-500',
    brown: 'bg-amber-700',
    gray: 'bg-gray-500',
    grey: 'bg-gray-500',
    
    // Shades
    navy: 'bg-blue-900',
    'dark-blue': 'bg-blue-800',
    'light-blue': 'bg-blue-300',
    charcoal: 'bg-gray-800',
    beige: 'bg-amber-200',
    cream: 'bg-amber-50',
    maroon: 'bg-red-900',
    olive: 'bg-green-700',
    
    // Patterns/Special
    'floral-blue': 'bg-blue-400',
    'floral-pink': 'bg-pink-400',
    'solid-white': 'bg-white',
  };
  return colorMap[colorLower] || 'bg-gray-400';
};

export default ProductCard;