import React from 'react';
import { Package, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';

interface OrdersTabProps {
  orders: any[];
  loading: boolean;
  updateOrderStatus: (orderId: string, newStatus: string) => void;
  getStatusColor: (status: string) => string;
}

const OrdersTab: React.FC<OrdersTabProps> = ({ 
  orders, 
  loading, 
  updateOrderStatus,
  getStatusColor 
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Order Management</h2>
          <p className="text-slate-400 mt-1">View and monitor all orders (read-only)</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Export Orders
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Total Orders</p>
          <p className="text-2xl font-bold text-white">{orders.length}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Pending</p>
          <p className="text-2xl font-bold text-yellow-400">
            {orders.filter(o => o.status === 'pending').length}
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Processing</p>
          <p className="text-2xl font-bold text-blue-400">
            {orders.filter(o => o.status === 'processing').length}
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Shipped</p>
          <p className="text-2xl font-bold text-indigo-400">
            {orders.filter(o => o.status === 'shipped').length}
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Delivered</p>
          <p className="text-2xl font-bold text-green-400">
            {orders.filter(o => o.status === 'delivered').length}
          </p>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-900/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {order.orderNumber || `#${order._id.slice(-6)}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">
                          {order.customer?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-slate-400">
                          {order.customer?.email || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {order.items?.length || 0} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-white">
                        ${order.totalAmount?.toFixed(2) || '0.00'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-400 italic">
                        View Only
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrdersTab;
