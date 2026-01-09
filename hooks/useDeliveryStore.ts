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
  isOnline: boolean; // Online status from backend

  fetchOrders: () => Promise<void>;
  fetchHistory: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: UpdateDeliveryProfilePayload) => Promise<void>;
  startSession: (ordersOverride?: DeliveryOrder[]) => void;
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
  isOnline: false, // Will be set from backend profile

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
      // Normalize possible backend flags
      // console.log("fetched data", data)
      const onlineFlag = (data as any)?.isOnline ?? (data as any)?.is_online ?? (data as any)?.online ?? (data as any)?.isAvailable ?? false;
      // console.log(onlineFlag)
      set({ profile: data, isOnline: !!onlineFlag });
      // console.log("Delivery profile fetched", data);
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

  startSession: (ordersOverride) => {
    const { orders } = get();
    const list = ordersOverride && ordersOverride.length > 0 ? ordersOverride : orders;
    if (list.length === 0) return;

    const sortedQueue = [...list].sort((a, b) => a.id - b.id);

    set({
      isSessionActive: true,
      queue: sortedQueue,
      activeOrder: sortedQueue[0]
    });
  },

  completeCurrentOrder: async (otp) => {

    const { activeOrder, queue, history } = get();
    if (!activeOrder) return false;

    try {
      const status = 'delivered'
      const result = await DeliveryService.updateOrderStatus(activeOrder.id, status, parseInt(otp));

      // The DeliveryService returns result.data, so the structure is:
      // result = { statusCode: 200, message: "...", data: {...}, success: true }
      const apiSuccess = result?.success ?? false;
      const apiMessage = result?.message ?? "Order status updated";
      const statusCode = result?.statusCode ?? 200;

      // console.log("Order status update result:", {
      //   success: apiSuccess,
      //   message: apiMessage,
      //   statusCode: statusCode
      // });

      // If API call succeeded
      if (apiSuccess === true) {
        const remainingQueue = queue.filter(o => o.id !== activeOrder.id);
        const completedOrder = { ...activeOrder, status: 'delivered' } as DeliveryOrder;

        if (remainingQueue.length > 0) {
          set({
            activeOrder: remainingQueue[0],
            queue: remainingQueue,
            history: [completedOrder, ...history]
          });
        } else {
          set({
            activeOrder: null,
            queue: [],
            isSessionActive: false,
            orders: [],
            history: [completedOrder, ...history]
          });
        }
        return true;
      } else {
        // API returned failure response
        console.error("OTP verification failed - invalid OTP", {
          message: apiMessage,
          statusCode: statusCode
        });
        return false;
      }

    } catch (e: any) {
      const errorMessage = e?.response?.data?.message || e?.message || "Failed to verify OTP";
      console.error("API call failed during OTP verification:", {
        error: errorMessage,
        status: e?.response?.status,
        statusCode: e?.response?.data?.statusCode
      });
      return false;
    }
  },

  toggleOnline: async () => {
    const currentStatus = get().isOnline;
    // Optimistic Update
    set({ isOnline: !currentStatus });
    try {
      const resp = await DeliveryService.toggleAvailability(!currentStatus);
      const onlineFlag = (resp as any)?.isOnline ?? (resp as any)?.is_online ?? (resp as any)?.online ?? (resp as any)?.isAvailable ?? !currentStatus;
      set({ isOnline: !!onlineFlag });
    } catch (error) {
      console.error("Failed to toggle availability", error);
      set({ isOnline: currentStatus }); // Revert
    }
  }
}));