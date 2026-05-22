import React from 'react';
import { Users, Package, ShoppingBag, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';

interface OverviewTabProps {
  stats: any;
  loading: boolean;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-slate-400 py-12">
        <p>Loading dashboard statistics...</p>
      </div>
    );
  }

  const { overview, revenue, recentOrders = [], topProducts = [], recentUsers = [] } = stats;

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Total Users</p>
              <p className="text-3xl font-bold text-white">{overview?.totalUsers || 0}</p>
              <p className="text-xs text-green-400 mt-1">
                +{overview?.userGrowth || 0}% today
              </p>
            </div>
            <Users className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Total Products</p>
              <p className="text-3xl font-bold text-white">{overview?.totalProducts || 0}</p>
              <p className="text-xs text-slate-400 mt-1">
                {overview?.totalSellers || 0} sellers
              </p>
            </div>
            <Package className="h-12 w-12 text-purple-500" />
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Total Orders</p>
              <p className="text-3xl font-bold text-white">{overview?.totalOrders || 0}</p>
              <p className="text-xs text-green-400 mt-1">
                +{overview?.orderGrowth || 0}% today
              </p>
            </div>
            <ShoppingBag className="h-12 w-12 text-cyan-500" />
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Revenue (Month)</p>
              <p className="text-3xl font-bold text-white">
                ${revenue?.month?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                ${revenue?.week?.toLocaleString() || 0} this week
              </p>
            </div>
            <DollarSign className="h-12 w-12 text-green-500" />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-900/30 border border-blue-700/50 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-8 w-8 text-blue-400" />
            <div>
              <p className="text-sm text-blue-300">Today's Users</p>
              <p className="text-2xl font-bold text-white">{overview?.todayUsers || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-900/30 border border-green-700/50 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <ShoppingBag className="h-8 w-8 text-green-400" />
            <div>
              <p className="text-sm text-green-300">Today's Orders</p>
              <p className="text-2xl font-bold text-white">{overview?.todayOrders || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-900/30 border border-purple-700/50 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <Package className="h-8 w-8 text-purple-400" />
            <div>
              <p className="text-sm text-purple-300">Active Sellers</p>
              <p className="text-2xl font-bold text-white">{overview?.totalSellers || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-700">
          <div className="p-6 border-b border-slate-700">
            <h3 className="text-xl font-semibold text-white">Recent Orders</h3>
          </div>
          <div className="p-6">
            {recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.slice(0, 5).map((order: any) => (
                  <div key={order._id} className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">{order.orderNumber}</p>
                      <p className="text-sm text-slate-400">{order.customer?.name || 'Unknown'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">${order.totalAmount}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8">No recent orders</p>
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-700">
          <div className="p-6 border-b border-slate-700">
            <h3 className="text-xl font-semibold text-white">Recent Users</h3>
          </div>
          <div className="p-6">
            {recentUsers.length > 0 ? (
              <div className="space-y-4">
                {recentUsers.slice(0, 5).map((user: any) => (
                  <div key={user._id} className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">{user.name}</p>
                      <p className="text-sm text-slate-400">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8">No recent users</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Products */}
      {topProducts.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-700">
          <div className="p-6 border-b border-slate-700">
            <h3 className="text-xl font-semibold text-white">Top Selling Products</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topProducts.slice(0, 6).map((product: any) => (
                <div key={product._id} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                  <p className="font-semibold text-white truncate">{product.name}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-slate-400">${product.price}</span>
                    <span className="text-sm text-green-400">{product.salesCount || 0} sold</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewTab;
