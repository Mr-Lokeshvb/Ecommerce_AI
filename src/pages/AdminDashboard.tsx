import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Package, DollarSign, TrendingUp, ShoppingBag, AlertTriangle,
  Eye, Edit, Trash2, Ban, CheckCircle, Shield, LogOut, Settings,
  BarChart3, Store, Search, Filter, Download, RefreshCw, XCircle,
  CheckCircle2, Clock, Star, MessageSquare, Truck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../utils/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for data
  const [adminData, setAdminData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketStats, setTicketStats] = useState({ open: 0, inProgress: 0, resolved: 0, closed: 0 });
  const [shipments, setShipments] = useState<any[]>([]);
  const [shipmentStats, setShipmentStats] = useState({ pending: 0, 'in-transit': 0, 'out-for-delivery': 0, delivered: 0 });
  
  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const data = localStorage.getItem('adminData');
    
    if (!token || !data) {
      toast.error('Please login as admin');
      navigate('/admin-login');
      return;
    }
    
    setAdminData(JSON.parse(data));
    loadDashboardData();
  }, []);

  // Load dashboard data
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/analytics/dashboard');
      if (response?.success) {
        setStats(response.analytics);
      }
    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Load users
  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/users');
      if (response?.success && response?.data) {
        const allUsers = response.data.users || [];
        setUsers(allUsers);
        console.log(`✅ Loaded ${allUsers.length} users`);
      }
    } catch (error) {
      console.error('Load users error:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Load products
  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/products');
      if (response?.success && response?.data) {
        const allProducts = response.data.products || [];
        setProducts(allProducts);
        console.log(`✅ Loaded ${allProducts.length} products`);
      }
    } catch (error) {
      console.error('Load products error:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Load orders
  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/orders');
      if (response?.success && response?.data) {
        const allOrders = response.data.orders || [];
        setOrders(allOrders);
        console.log(`✅ Loaded ${allOrders.length} orders`);
      }
    } catch (error) {
      console.error('Load orders error:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Load support tickets
  const loadTickets = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/tickets');
      if (response?.success && response?.data) {
        setTickets(response.data.tickets || []);
        setTicketStats(response.data.stats || { open: 0, inProgress: 0, resolved: 0, closed: 0 });
        console.log(`✅ Loaded ${response.data.tickets?.length || 0} tickets`);
      }
    } catch (error) {
      console.error('Load tickets error:', error);
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  // Load shipments
  const loadShipments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/shipments');
      if (response?.success) {
        setShipments(response.shipments || []);
        // Calculate stats
        const stats = {
          pending: response.shipments?.filter((s: any) => s.status === 'pending').length || 0,
          'in-transit': response.shipments?.filter((s: any) => s.status === 'in-transit').length || 0,
          'out-for-delivery': response.shipments?.filter((s: any) => s.status === 'out-for-delivery').length || 0,
          delivered: response.shipments?.filter((s: any) => s.status === 'delivered').length || 0,
        };
        setShipmentStats(stats);
        console.log(`✅ Loaded ${response.shipments?.length || 0} shipments`);
      }
    } catch (error) {
      console.error('Load shipments error:', error);
      toast.error('Failed to load shipments');
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    toast.success('Logged out successfully');
    navigate('/admin-login');
  };

  // Toggle user status
  const toggleUserStatus = async (userId: string, userType: string, currentStatus: boolean) => {
    try {
      await api.patch(`/api/admin/users/${userType}/${userId}/status`, 
        { isActive: !currentStatus }
      );
      
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      loadUsers();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  // Delete user
  const deleteUser = async (userId: string, userType: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await api.delete(`/api/admin/users/${userType}/${userId}`);
      toast.success('User deleted successfully');
      loadUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  // Toggle product active/inactive status
  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      await api.patch(`/api/admin/products/${productId}/status`, 
        { isActive: !currentStatus }
      );
      
      toast.success(`Product ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      loadProducts();
    } catch (error) {
      console.error('Toggle status error:', error);
      toast.error('Failed to update product status');
    }
  };

  // Feature product
  const toggleProductFeature = async (productId: string, currentStatus: boolean) => {
    try {
      await api.patch(`/api/admin/products/${productId}/feature`, 
        { featured: !currentStatus }
      );
      
      toast.success(`Product ${!currentStatus ? 'featured' : 'unfeatured'} successfully`);
      loadProducts();
    } catch (error) {
      console.error('Toggle feature error:', error);
      toast.error('Failed to update product');
    }
  };

  // Delete product
  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await api.delete(`/api/admin/products/${productId}`);
      toast.success('Product deleted successfully');
      loadProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  // View order details (read-only, no status updates allowed)
  const viewOrderDetails = (orderId: string) => {
    // In a real app, this would open a modal or navigate to order details page
    console.log('View order:', orderId);
  };

  // Update ticket status
  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      await api.patch(`/api/admin/tickets/${ticketId}/status`, { status });
      toast.success('Ticket status updated successfully');
      loadTickets();
    } catch (error) {
      console.error('Update ticket status error:', error);
      toast.error('Failed to update ticket status');
    }
  };

  // Update shipment status
  const updateShipmentStatus = async (shipmentId: string, status: string) => {
    try {
      await api.patch(`/api/shipments/${shipmentId}/status`, { status });
      toast.success('Shipment status updated successfully');
      loadShipments();
    } catch (error) {
      console.error('Update shipment status error:', error);
      toast.error('Failed to update shipment status');
    }
  };

  // Tab change handler
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'customers' || tab === 'sellers') loadUsers();
    if (tab === 'products') loadProducts();
    if (tab === 'orders') loadOrders();
    if (tab === 'logistics') loadShipments();
    if (tab === 'support') loadTickets();
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'sellers', label: 'Sellers', icon: Store },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'logistics', label: 'Logistics', icon: Truck },
    { id: 'support', label: 'Support', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  ];

  const getStatusColor = (status: string) => {
    const colors: any = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      open: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'waiting-customer': 'bg-orange-100 text-orange-800',
      inProgress: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
      'picked-up': 'bg-blue-100 text-blue-800',
      'in-transit': 'bg-indigo-100 text-indigo-800',
      'out-for-delivery': 'bg-purple-100 text-purple-800',
      failed: 'bg-red-100 text-red-800',
      returned: 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Admin Control Panel</h1>
                <p className="text-xs text-slate-400">FashionVR Management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{adminData?.name || 'Admin'}</p>
                <p className="text-xs text-slate-400">{adminData?.role || 'ADMIN'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-slate-700">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'overview' && <OverviewTab stats={stats} loading={loading} />}
          {activeTab === 'customers' && <UsersTab users={users.filter((u: any) => u.userType === 'CUSTOMER')} loading={loading} toggleUserStatus={toggleUserStatus} deleteUser={deleteUser} getStatusColor={getStatusColor} />}
          {activeTab === 'sellers' && <UsersTab users={users.filter((u: any) => u.userType === 'SELLER')} loading={loading} toggleUserStatus={toggleUserStatus} deleteUser={deleteUser} getStatusColor={getStatusColor} />}
          {activeTab === 'products' && <ProductsTab products={products} loading={loading} toggleProductStatus={toggleProductStatus} toggleProductFeature={toggleProductFeature} deleteProduct={deleteProduct} getStatusColor={getStatusColor} />}
          {activeTab === 'orders' && <OrdersTab orders={orders} loading={loading} updateOrderStatus={viewOrderDetails} getStatusColor={getStatusColor} />}
          {activeTab === 'logistics' && <LogisticsTab shipments={shipments} stats={shipmentStats} loading={loading} updateShipmentStatus={updateShipmentStatus} getStatusColor={getStatusColor} />}
          {activeTab === 'support' && <SupportTab tickets={tickets} stats={ticketStats} loading={loading} updateTicketStatus={updateTicketStatus} getStatusColor={getStatusColor} />}
          {activeTab === 'analytics' && <OverviewTab stats={stats} loading={loading} />}
        </div>
      </div>
    </div>
  );
};

// Import components
import OverviewTab from '../components/admin/OverviewTab';
import UsersTab from '../components/admin/UsersTab';
import ProductsTab from '../components/admin/ProductsTab';
import OrdersTab from '../components/admin/OrdersTab';
import LogisticsTab from '../components/admin/LogisticsTab';
import SupportTab from '../components/admin/SupportTab';

export default AdminDashboard;
