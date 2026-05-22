import React from 'react';
import { Truck, Package, MapPin, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface Shipment {
  _id: string;
  trackingNumber: string;
  order: {
    _id: string;
    orderNumber: string;
  };
  customer: {
    name: string;
    email: string;
  };
  status: 'pending' | 'picked-up' | 'in-transit' | 'out-for-delivery' | 'delivered' | 'failed' | 'returned';
  carrier: string;
  estimatedDelivery: string;
  actualDelivery?: string;
  origin: string;
  destination: string;
  createdAt: string;
}

interface LogisticsTabProps {
  shipments: Shipment[];
  stats: {
    pending: number;
    'in-transit': number;
    'out-for-delivery': number;
    delivered: number;
  };
  loading: boolean;
  updateShipmentStatus: (shipmentId: string, status: string) => void;
  getStatusColor: (status: string) => string;
}

const LogisticsTab: React.FC<LogisticsTabProps> = ({ 
  shipments, 
  stats,
  loading, 
  updateShipmentStatus,
  getStatusColor 
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'picked-up':
      case 'in-transit':
        return <Truck className="h-5 w-5 text-blue-500" />;
      case 'out-for-delivery':
        return <MapPin className="h-5 w-5 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
      case 'returned':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Logistics & Shipping</h2>
          <p className="text-slate-400 mt-1">Manage shipments and track deliveries</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Export Shipments
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Pending</p>
              <p className="text-2xl font-bold text-white">{stats.pending || 0}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">In Transit</p>
              <p className="text-2xl font-bold text-white">{stats['in-transit'] || 0}</p>
            </div>
            <Truck className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Out for Delivery</p>
              <p className="text-2xl font-bold text-white">{stats['out-for-delivery'] || 0}</p>
            </div>
            <MapPin className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Delivered</p>
              <p className="text-2xl font-bold text-white">{stats.delivered || 0}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Shipments Table */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-slate-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Tracking #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Carrier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Route
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  ETA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {shipments && shipments.length > 0 ? (
                shipments.map((shipment) => (
                  <tr key={shipment._id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(shipment.status)}
                        <span className="ml-2 text-sm font-medium text-white">
                          {shipment.trackingNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-300">
                        {shipment.order?.orderNumber || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">
                          {shipment.customer?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-slate-400">
                          {shipment.customer?.email || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-300">
                        {shipment.carrier || 'Standard'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="text-slate-400">From: {shipment.origin || 'N/A'}</div>
                        <div className="text-slate-400">To: {shipment.destination || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={shipment.status}
                        onChange={(e) => updateShipmentStatus(shipment._id, e.target.value)}
                        className={`text-sm rounded-lg px-3 py-1 border-0 ${getStatusColor(shipment.status)}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="picked-up">Picked Up</option>
                        <option value="in-transit">In Transit</option>
                        <option value="out-for-delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="failed">Failed</option>
                        <option value="returned">Returned</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {shipment.estimatedDelivery ? new Date(shipment.estimatedDelivery).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button className="text-blue-400 hover:text-blue-300 transition-colors">
                        Track
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    No shipments found
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

export default LogisticsTab;
