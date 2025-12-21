import { create } from 'zustand';
import { DeliveryService, DeliveryOrder, DeliveryProfile, UpdateDeliveryProfilePayload } from '@/services/deliveryService';

interface DeliveryState {
  orders: DeliveryOrder[];
  history: DeliveryOrder[];
  activeOrder: DeliveryOrder | null;
  queue: DeliveryOrder[];
  profile: DeliveryProfile | null;
  isSessionActive: boolean;
  isLoading: boolean;
  isOnline: boolean; // New State
  
  fetchOrders: () => Promise<void>;
  fetchHistory: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: UpdateDeliveryProfilePayload) => Promise<void>;
  startSession: () => void;
  completeCurrentOrder: (otp: string) => Promise<boolean>;
  toggleOnline: () => Promise<void>; // New Action
}

export const useDeliveryStore = create<DeliveryState>((set, get) => ({
  orders: [],
  history: [],
  activeOrder: null,
  queue: [],
  profile: null,
  isSessionActive: false,
  isLoading: false,
  isOnline: true, // Default to online

  fetchOrders: async () => {
    set({ isLoading: true });
    try {
      const data = await DeliveryService.getAssignedOrders();
      const pending = data.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
      set({ orders: pending });
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchHistory: async () => {
    set({ isLoading: true });
    try {
        // Fetch delivered orders
        const data = await DeliveryService.getAssignedOrders('delivered');
        
        // Also fetch cancelled orders
        let cancelledData: DeliveryOrder[] = [];
        try {
            cancelledData = await DeliveryService.getAssignedOrders('cancelled');
        } catch (e) {
            // Ignore if cancelled fetch fails
        }
        
        // Combine both statuses
        const allCompleted = [...data, ...cancelledData];
        set({ history: allCompleted });
    } catch (error) {
        console.error("Failed to fetch history", error);
    } finally {
        set({ isLoading: false });
    }
  },

  fetchProfile: async () => {
    set({ isLoading: true });
    try {
        const data = await DeliveryService.getProfile();
        set({ profile: data });
    } catch (error) {
        console.error("Failed to fetch profile", error);
    } finally {
        set({ isLoading: false });
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true });
    try {
        const updated = await DeliveryService.updateProfile(data);
        const currentProfile = get().profile;
        if (currentProfile) {
            set({ profile: { ...currentProfile, ...data, ...updated } });
        }
    } catch (error) {
        console.warn("Update Profile Failed (Network), keeping optimistic state if any");
    } finally {
        set({ isLoading: false });
    }
  },

  startSession: () => {
    const { orders } = get();
    if (orders.length === 0) return;

    const sortedQueue = [...orders].sort((a, b) => a.id - b.id); 

    set({
        isSessionActive: true,
        queue: sortedQueue,
        activeOrder: sortedQueue[0] 
    });
  },

  completeCurrentOrder: async (otp) => {
    if (otp !== '1234') return false;

    const { activeOrder, queue, history } = get();
    if (!activeOrder) return false;

    try {
        await DeliveryService.updateOrderStatus(activeOrder.id, 'delivered');
    } catch (e) {
        console.warn("API failed, proceeding optimistically");
    }

    const remainingQueue = queue.filter(o => o.id !== activeOrder.id);
    const completedOrder = { ...activeOrder, status: 'delivered' } as DeliveryOrder;

    if (remainingQueue.length > 0) {
        set({
            activeOrder: remainingQueue[0],
            queue: remainingQueue,
            history: [completedOrder, ...history]
        });
        return true; 
    } else {
        set({
            activeOrder: null,
            queue: [],
            isSessionActive: false,
            orders: [],
            history: [completedOrder, ...history]
        });
        return true; 
    }
  },

  toggleOnline: async () => {
    const currentStatus = get().isOnline;
    // Optimistic Update
    set({ isOnline: !currentStatus });
    try {
        await DeliveryService.toggleAvailability(!currentStatus);
    } catch (error) {
        console.error("Failed to toggle availability", error);
        set({ isOnline: currentStatus }); // Revert
    }
  }
}));