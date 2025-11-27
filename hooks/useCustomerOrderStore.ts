import { create } from 'zustand';

interface CustomerState {
  activeOrderId: string | null;
  deliveryOtp: string;
  orderStatus: 'preparing' | 'on_way' | 'delivered' | 'cancelled' | null;
  
  // Actions
  setActiveOrder: (id: string) => void;
  cancelOrder: () => void;
}

export const useCustomerOrderStore = create<CustomerState>((set) => ({
  activeOrderId: 'ORD-999', // Simulating an active order for demo
  deliveryOtp: '4582',      // The OTP the customer sees
  orderStatus: 'on_way',

  setActiveOrder: (id) => set({ activeOrderId: id }),
  
  cancelOrder: () => set({ 
    activeOrderId: null, 
    orderStatus: 'cancelled', 
    deliveryOtp: '' 
  }),
}));