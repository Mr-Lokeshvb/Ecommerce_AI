import { create } from 'zustand';
import { api } from '../utils/api';

interface Order {
  _id: string;
  customer: {
    name: string;
  };
  items: {
    title: string;
  }[];
  status: string;
  total: number;
  createdAt: string;
}

interface OrderState {
  orders: Order[];
  fetchSellerOrders: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: string) => Promise<void>;
}

export const useOrderStore = create<OrderState>()(
  (set, get) => ({
    orders: [],
    fetchSellerOrders: async () => {
      try {
        const response = await api.getSellerOrders();
        console.log('📦 Seller Orders Response:', response);
        
        if (response.success && response.data) {
          // Ensure data is an array
          const ordersArray = Array.isArray(response.data) ? response.data : [];
          console.log('✅ Setting orders:', ordersArray);
          set({ orders: ordersArray });
        } else {
          console.warn('⚠️ No orders data, setting empty array');
          set({ orders: [] });
        }
      } catch (error) {
        console.error('❌ Error fetching seller orders:', error);
        set({ orders: [] });
      }
    },
    updateOrderStatus: async (orderId, status) => {
      const response = await api.updateOrderStatus(orderId, status);
      if (response.success) {
        get().fetchSellerOrders();
      }
    },
  })
);
