import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Package, Heart, Eye, User, MapPin, CreditCard, Clock, Star, ShoppingBag, MessageCircle, RotateCcw, Truck, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useWishlistStore } from '../store/wishlistStore';
import { useCartStore } from '../store/cartStore';
import { ChatDashboard } from '../components/chat/ChatDashboard';
import { FloatingChatButton } from '../components/chat/FloatingChatButton';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const CustomerDashboard = () => {
  const { user } = useAuthStore();
  const { items: wishlistItems, removeItem } = useWishlistStore();
  const { items: cartItems } = useCartStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [realOrders, setRealOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Update URL when tab changes
  const handleTabChange = (tabId: string) => {
    console.log('Changing tab to:', tabId);
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  // Fetch real orders only on mount
  useEffect(() => {
    fetchRealOrders();
  }, []);

  const fetchRealOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('📦 Overview Orders Response:', response.data);
      
      if (response.data.success && response.data.data) {
        // The API returns data: { orders: [...], pagination: {...} }
        const ordersArray = Array.isArray(response.data.data.orders) 
          ? response.data.data.orders 
          : (Array.isArray(response.data.data) ? response.data.data : []);
        console.log('✅ Setting overview orders:', ordersArray);
        setRealOrders(ordersArray);
      } else {
        setRealOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setRealOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Update tab when URL changes
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    console.log('CustomerDashboard - URL tab parameter:', tabFromUrl, 'Current active tab:', activeTab);
    if (tabFromUrl && tabFromUrl !== activeTab) {
      console.log('CustomerDashboard - Updating tab from URL to:', tabFromUrl);
      setActiveTab(tabFromUrl);
    }
  }, [searchParams, activeTab]);

  // Debug: Log when component mounts
  useEffect(() => {
    console.log('CustomerDashboard mounted. User:', user?.name, 'Role:', user?.role);
    console.log('Initial tab:', activeTab);
    console.log('Wishlist items:', wishlistItems.length);
  }, []);

  // Helper function to get the correct image URL
  const getImageUrl = (item: any) => {
    if (item.images && item.images.length > 0) {
      return typeof item.images[0] === 'string' ? item.images[0] : item.images[0]?.url;
    }
    return item.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&crop=center';
  };

  // Helper to get order item image
  const getOrderItemImage = (order: any) => {
    if (order.items && order.items.length > 0 && order.items[0].image) {
      return order.items[0].image;
    }
    return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&crop=center';
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ShoppingBag },
    { id: 'orders', label: 'My Orders', icon: Package },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'shipping': return 'text-blue-600 bg-blue-100';
      case 'packing': return 'text-purple-600 bg-purple-100';
      case 'confirmed': return 'text-indigo-600 bg-indigo-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'returned': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.name}! 👋
              </h1>
              <p className="text-gray-600">Ready to discover amazing fashion?</p>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{realOrders.length}</div>
                <div className="text-sm text-gray-600">Orders</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-600">{wishlistItems.length}</div>
                <div className="text-sm text-gray-600">Wishlist</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{cartItems.length}</div>
                <div className="text-sm text-gray-600">Cart Items</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-2xl">
                    {user?.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
                <p className="text-gray-600">{user?.email}</p>
                <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium mt-2">
                  Customer
                </span>
              </div>

              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Quick Actions */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">

                  <Link
                    to="/products"
                    className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors text-center block"
                  >
                    Browse Products
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h2>
                  
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100">Total Orders</p>
                          <p className="text-3xl font-bold">{realOrders.length}</p>
                        </div>
                        <Package className="h-8 w-8 text-blue-200" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-pink-100">Wishlist Items</p>
                          <p className="text-3xl font-bold">{wishlistItems.length}</p>
                        </div>
                        <Heart className="h-8 w-8 text-pink-200" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-100">Cart Items</p>
                          <p className="text-3xl font-bold">{cartItems.length}</p>
                        </div>
                        <ShoppingBag className="h-8 w-8 text-purple-200" />
                      </div>
                    </div>
                  </div>

                  {/* Recent Orders */}
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">Recent Orders</h3>
                      <button
                        onClick={() => handleTabChange('orders')}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View All
                      </button>
                    </div>
                    {ordersLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-600 mt-2">Loading orders...</p>
                      </div>
                    ) : realOrders.length === 0 ? (
                      <div className="text-center py-8 border border-gray-200 rounded-lg">
                        <Package className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-600">No orders yet</p>
                        <Link
                          to="/products"
                          className="text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
                        >
                          Start Shopping
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {realOrders.slice(0, 3).map((order) => (
                          <div key={order._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <img
                                  src={getOrderItemImage(order)}
                                  alt="Order"
                                  className="w-12 h-12 object-cover rounded-lg"
                                />
                                <div>
                                  <h4 className="font-semibold text-gray-900">Order #{order.orderNumber || order._id?.slice(-8)}</h4>
                                  <p className="text-sm text-gray-600">
                                    {new Date(order.createdAt).toLocaleDateString()} • {order.items?.length || 0} items
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                  {order.status}
                                </span>
                                <p className="text-lg font-bold text-gray-900 mt-1">${order.total?.toFixed(2)}</p>
                              </div>
                            </div>
                            {order.trackingNumber && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-xs text-gray-600">
                                  <span className="font-medium">Tracking:</span> {order.trackingNumber}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === 'orders' && <CustomerOrdersTab onOrderUpdate={fetchRealOrders} />}

              {/* Wishlist Tab */}
              {activeTab === 'wishlist' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900">My Wishlist</h2>
                    <button
                      onClick={() => handleTabChange('overview')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      <span>Back to Dashboard</span>
                    </button>
                  </div>
                  {wishlistItems.length === 0 ? (
                    <div className="text-center py-16">
                      <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Your wishlist is empty</h3>
                      <p className="text-gray-600 mb-6">Save items you love to your wishlist</p>
                      <Link
                        to="/products"
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Browse Products
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {wishlistItems.map((item) => (
                        <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                          <img
                            src={getImageUrl(item)}
                            alt={item.name}
                            className="w-full h-48 object-cover"
                          />
                          <div className="p-4">
                            <h4 className="font-semibold text-gray-900 mb-2">{item.name}</h4>
                            <p className="text-blue-600 font-bold mb-4">${item.price}</p>
                            <div className="flex space-x-2">
                              <Link
                                to={`/product/${item.productId}`}
                                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center"
                              >
                                View
                              </Link>
                              <button
                                onClick={() => removeItem(item.productId)}
                                className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Messages Tab */}
              {activeTab === 'messages' && (
                <div>
                  <ChatDashboard />
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">Profile Settings</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                          <Link
                            to="/profile"
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Edit
                          </Link>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <p className="text-gray-900">{user?.name}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <p className="text-gray-900">{user?.email}</p>
                          </div>
                        </div>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">Addresses</h3>
                          <button className="text-blue-600 hover:text-blue-700 font-medium">
                            Manage
                          </button>
                        </div>
                        <div className="flex items-center space-x-3 text-gray-600">
                          <MapPin className="h-5 w-5" />
                          <span>No addresses saved</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">Payment Methods</h3>
                          <button className="text-blue-600 hover:text-blue-700 font-medium">
                            Add
                          </button>
                        </div>
                        <div className="flex items-center space-x-3 text-gray-600">
                          <CreditCard className="h-5 w-5" />
                          <span>No payment methods saved</span>
                        </div>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h3>
                        <div className="space-y-3">
                          <label className="flex items-center">
                            <input type="checkbox" className="rounded mr-3" defaultChecked />
                            <span className="text-gray-700">Email notifications</span>
                          </label>
                          <label className="flex items-center">
                            <input type="checkbox" className="rounded mr-3" defaultChecked />
                            <span className="text-gray-700">SMS notifications</span>
                          </label>
                          <label className="flex items-center">
                            <input type="checkbox" className="rounded mr-3" />
                            <span className="text-gray-700">Marketing emails</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Chat Button */}
      <FloatingChatButton />
    </div>
  );
};

// Customer Orders Tab Component
const CustomerOrdersTab: React.FC<{ onOrderUpdate?: () => void }> = ({ onOrderUpdate }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [returnReason, setReturnReason] = useState('');
  
  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      // Only show loading on initial fetch
      if (orders.length === 0) {
        setLoading(true);
      }
      
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('📦 Customer Orders Response:', response.data);
      
      if (response.data.success && response.data.data) {
        // The API returns data: { orders: [...], pagination: {...} }
        const ordersArray = Array.isArray(response.data.data.orders) 
          ? response.data.data.orders 
          : (Array.isArray(response.data.data) ? response.data.data : []);
        console.log('✅ Setting customer orders:', ordersArray);
        setOrders(ordersArray);
        
        // Notify parent component of update
        if (onOrderUpdate) {
          onOrderUpdate();
        }
      } else {
        console.warn('⚠️ No customer orders data, setting empty array');
        setOrders([]);
      }
    } catch (error: any) {
      console.error('❌ Error fetching customer orders:', error);
      if (orders.length === 0) {
        toast.error('Failed to load orders');
      }
      setOrders([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReturn = async () => {
    if (!returnReason.trim()) {
      toast.error('Please provide a reason for return');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/orders/${selectedOrder._id}/return`,
        { returnReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Return request submitted successfully');
      setShowReturnModal(false);
      setSelectedOrder(null);
      setReturnReason('');
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to request return');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'shipping': return 'text-blue-600 bg-blue-100';
      case 'packing': return 'text-purple-600 bg-purple-100';
      case 'confirmed': return 'text-indigo-600 bg-indigo-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'returned': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const canRequestReturn = (order: any) => {
    if (order.status !== 'delivered') return false;
    if (order.returnRequested) return false;
    
    // Check if within 30 days
    const deliveredDate = new Date(order.deliveredAt);
    const currentDate = new Date();
    const daysSinceDelivery = Math.floor((currentDate.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysSinceDelivery <= 30;
  };

  const handleSubmitReview = async () => {
    if (!reviewTitle.trim() || reviewTitle.length < 5) {
      toast.error('Review title must be at least 5 characters');
      return;
    }
    
    if (!reviewComment.trim() || reviewComment.length < 10) {
      toast.error('Review comment must be at least 10 characters');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Extract the correct product ID from the order item
      const productId = selectedProduct.productId?._id || selectedProduct.productId || selectedProduct._id;
      
      const reviewData = {
        productId: productId,
        orderId: selectedOrder._id,
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment
      };
      
      console.log('📝 Submitting review:', reviewData);
      console.log('📦 Selected product:', selectedProduct);
      
      const response = await axios.post(
        'http://localhost:5000/api/reviews',
        reviewData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('✅ Review submitted:', response.data);
      toast.success('Review submitted successfully!');
      setShowReviewModal(false);
      setSelectedProduct(null);
      setSelectedOrder(null);
      setReviewRating(5);
      setReviewTitle('');
      setReviewComment('');
      fetchOrders();
    } catch (error: any) {
      console.error('❌ Review submission error:', error.response?.data);
      const errorMsg = error.response?.data?.errors 
        ? error.response.data.errors.map((e: any) => e.msg).join(', ')
        : error.response?.data?.message || 'Failed to submit review';
      toast.error(errorMsg);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading orders...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">My Orders</h2>
      
      {orders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
          <Link
            to="/products"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {(Array.isArray(orders) ? orders : []).map((order) => (
            <div key={order._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Order #{order.orderNumber || order._id?.slice(-8)}
                  </h3>
                  <p className="text-gray-600">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  {order.returnRequested && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-600">
                      {order.returnApproved ? 'Return Approved' : 'Return Pending'}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-3">
                    <div>
                      <p className="text-gray-500">Items</p>
                      <p className="font-medium text-gray-900">{order.items?.length || 0} products</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total</p>
                      <p className="font-medium text-gray-900">${order.total}</p>
                    </div>
                    {order.trackingNumber && (
                      <div>
                        <p className="text-gray-500">Tracking</p>
                        <p className="font-medium text-blue-600">{order.trackingNumber}</p>
                      </div>
                    )}
                  </div>

                  {/* Order Items */}
                  <div className="flex flex-wrap gap-2">
                    {order.items?.map((item: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-xs bg-gray-100 px-3 py-1 rounded-full">
                        <span>{item.title} x{item.quantity}</span>
                        {order.status === 'delivered' && (
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setSelectedProduct(item);
                              setShowReviewModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-700"
                            title="Write a review"
                          >
                            <Star className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2 lg:w-48">
                  {order.status === 'delivered' && (
                    <button
                      onClick={() => {
                        if (order.items && order.items.length > 0) {
                          setSelectedOrder(order);
                          setSelectedProduct(order.items[0]);
                          setShowReviewModal(true);
                        }
                      }}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      <Star className="h-4 w-4" />
                      Write Review
                    </button>
                  )}
                  
                  {canRequestReturn(order) && (
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowReturnModal(true);
                      }}
                      className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Request Return
                    </button>
                  )}
                  
                  {order.status === 'delivered' && !canRequestReturn(order) && !order.returnRequested && (
                    <div className="text-xs text-gray-500 text-center">
                      Return window expired
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Return Request Modal */}
      {showReturnModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Request Return
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Order: #{selectedOrder.orderNumber || selectedOrder._id?.slice(-8)}</p>
                <p className="text-sm text-gray-600 mb-4">Total: ${selectedOrder.total}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Return *
                </label>
                <textarea
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="Please describe why you want to return this order..."
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Returns are accepted within 30 days of delivery
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleRequestReturn}
                  className="flex-1 bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Submit Request
                </button>
                <button
                  onClick={() => {
                    setShowReturnModal(false);
                    setSelectedOrder(null);
                    setReturnReason('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedOrder && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Write a Review
            </h3>
            
            <div className="space-y-4">
              {/* Product Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Product</p>
                <p className="font-semibold text-gray-900">{selectedProduct.title}</p>
                <p className="text-sm text-gray-600 mt-1">Order: #{selectedOrder.orderNumber || selectedOrder._id?.slice(-8)}</p>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="transition-colors"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= reviewRating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-gray-600 font-medium">{reviewRating} out of 5</span>
                </div>
              </div>

              {/* Review Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Title *
                </label>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="Summarize your experience (min 5 characters)"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {reviewTitle.length}/100 characters
                </p>
              </div>

              {/* Review Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Review *
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your thoughts about this product (min 10 characters)..."
                  rows={5}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {reviewComment.length}/1000 characters
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleSubmitReview}
                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Star className="h-5 w-5" />
                  Submit Review
                </button>
                <button
                  onClick={() => {
                    setShowReviewModal(false);
                    setSelectedProduct(null);
                    setSelectedOrder(null);
                    setReviewRating(5);
                    setReviewTitle('');
                    setReviewComment('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;