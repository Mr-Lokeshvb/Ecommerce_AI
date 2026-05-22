import React from 'react';
import { Star, Trash2, Eye, Edit } from 'lucide-react';
import { useCurrencyStore } from '../../store/currencyStore';

interface ProductsTabProps {
  products: any[];
  loading: boolean;
  toggleProductStatus: (productId: string, currentStatus: boolean) => void;
  toggleProductFeature: (productId: string, currentStatus: boolean) => void;
  deleteProduct: (productId: string) => void;
  getStatusColor: (status: string) => string;
}

const ProductsTab: React.FC<ProductsTabProps> = ({ 
  products, 
  loading, 
  toggleProductStatus,
  toggleProductFeature, 
  deleteProduct,
  getStatusColor 
}) => {
  const { formatPrice } = useCurrencyStore();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Product Management</h2>
          <p className="text-slate-400 mt-1">Manage all products across sellers</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Export Products
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Total Products</p>
          <p className="text-2xl font-bold text-white">{products.length}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Active</p>
          <p className="text-2xl font-bold text-white">
            {products.filter(p => p.isActive).length}
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Featured</p>
          <p className="text-2xl font-bold text-white">
            {products.filter(p => p.isFeatured).length}
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Out of Stock</p>
          <p className="text-2xl font-bold text-white">
            {products.filter(p => {
              const stock = p.totalStock || p.variants?.reduce((sum: number, v: any) => sum + v.stock, 0) || 0;
              return stock === 0;
            }).length}
          </p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.length > 0 ? (
          products.map((product) => (
            <div key={product._id} className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-slate-700">
              {/* Product Image */}
              <div className="relative h-48 bg-slate-900">
                {product.images && product.images[0]?.url ? (
                  <img
                    src={product.images[0].url}
                    alt={product.title || product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    No Image
                  </div>
                )}
                {product.isFeatured && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold flex items-center">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                <h3 className="font-semibold text-white truncate">{product.title || product.name}</h3>
                <p className="text-sm text-slate-400 mt-1">
                  by {product.seller?.storeName || product.seller?.name || 'Unknown Seller'}
                </p>
                
                <div className="flex items-center justify-between mt-3">
                  <span className="text-lg font-bold text-white">{formatPrice(product.basePrice || product.price)}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-2 text-sm">
                  <span className="text-slate-400">
                    Stock: {product.totalStock || product.variants?.reduce((sum: number, v: any) => sum + v.stock, 0) || 0}
                  </span>
                  <span className="text-slate-400">Category: {product.category}</span>
                </div>

                {/* Actions */}
                <div className="flex flex-col space-y-2 mt-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => toggleProductStatus(product._id, product.isActive)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        product.isActive
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-slate-600 hover:bg-slate-700 text-white'
                      }`}
                    >
                      {product.isActive ? 'Active' : 'Inactive'}
                    </button>
                    
                    <button
                      onClick={() => toggleProductFeature(product._id, product.isFeatured)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        product.isFeatured
                          ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                          : 'bg-slate-700 hover:bg-slate-600 text-white'
                      }`}
                    >
                      <Star className="h-4 w-4 inline mr-1" />
                      {product.isFeatured ? 'Featured' : 'Feature'}
                    </button>
                  </div>
                  
                  <button
                    onClick={() => deleteProduct(product._id)}
                    className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 text-center text-slate-400 py-12">
            No products found
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsTab;
