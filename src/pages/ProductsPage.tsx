import React, { useState, useEffect } from 'react';
import { Filter, Grid, List } from 'lucide-react';
import { useProductStore } from '../store/productStore';
import { useCurrencyStore } from '../store/currencyStore';
import ProductCard from '../components/product/ProductCard';
import ProductFilters from '../components/product/ProductFilters';

const ProductsPage = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const { allProducts, searchQuery, filters, fetchAllProducts } = useProductStore();
  const { formatPrice, currency } = useCurrencyStore();

  // Fetch all products when component mounts
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      await fetchAllProducts();
      setLoading(false);
    };
    loadProducts();
  }, [fetchAllProducts]);

  // Apply filters to products
  const filteredProducts = allProducts.filter((product) => {
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        (product.name || product.title || '').toLowerCase().includes(query) ||
        (product.description || '').toLowerCase().includes(query) ||
        (product.category || '').toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Category filter
    if (filters.category && product.category !== filters.category) {
      return false;
    }

    // Price range filter
    const productPrice = product.price || product.basePrice || 0;
    if (productPrice < filters.priceRange[0] || productPrice > filters.priceRange[1]) {
      return false;
    }

    // Size filter
    if (filters.sizes.length > 0) {
      const productSizes = product.variants?.map(v => v.size) || product.sizes || [];
      const hasMatchingSize = filters.sizes.some(size => productSizes.includes(size));
      if (!hasMatchingSize) return false;
    }

    // Color filter
    if (filters.colors.length > 0) {
      const productColors = product.variants?.map(v => v.color.toLowerCase()) || 
                           (product.colors || []).map(c => c.toLowerCase());
      const hasMatchingColor = filters.colors.some(color => 
        productColors.includes(color.toLowerCase())
      );
      if (!hasMatchingColor) return false;
    }

    // Rating filter
    if (filters.rating > 0) {
      const productRating = product.rating || 0;
      if (productRating < filters.rating) return false;
    }

    return true;
  });

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {searchQuery ? `Search Results for "${searchQuery}"` : 'All Products'}
          </h1>
          <p className="text-gray-600">{filteredProducts.length} products found</p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </button>
          
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
              }`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
              }`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Filters Sidebar */}
        <div className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-80 flex-shrink-0`}>
          <ProductFilters />
        </div>

        {/* Products Grid/List */}
        <div className="flex-1">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow p-6">
                  <div className="flex gap-6">
                    <img
                      src={(() => {
                        // Find primary image
                        const primaryImage = product.images?.find((img: any) => 
                          typeof img === 'object' && img.isPrimary
                        );
                        if (primaryImage) {
                          return typeof primaryImage === 'string' ? primaryImage : primaryImage.url;
                        }
                        // Fallback to first image
                        const firstImage = product.images?.[0];
                        return typeof firstImage === 'string' ? firstImage : firstImage?.url || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400';
                      })()}
                      alt={product.name}
                      className="w-32 h-32 object-cover rounded-lg"
                      onError={(e) => {
                        console.error('Failed to load image for product:', product.name);
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400';
                      }}
                      loading="lazy"
                    />
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{product.name || product.title}</h3>
                      <p className="text-gray-600 mb-3">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-bold text-gray-900">
                            {formatPrice(product.price || product.basePrice || 0)}
                          </span>
                          {currency === 'INR' && (
                            <span className="text-sm text-gray-500 ml-2">
                              (${(product.price || product.basePrice || 0).toFixed(2)})
                            </span>
                          )}
                        </div>
                        <button className="bg-purple-600 text-white px-6 py-2 rounded-full hover:bg-purple-700 transition-colors">
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-16">
              <p className="text-xl text-gray-600">No products found matching your criteria.</p>
              <p className="text-gray-500 mt-2">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
