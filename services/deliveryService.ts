import axiosInstance from '@/lib/axios';

// --- Types ---

export interface CreateDeliveryProfilePayload {
  shopkeeperId: number;
  aadharNumber: string;
  panNumber: string;
  licenseNumber: string;
  licenseImages: string[];
  vehicleOwnerName: string;
  vehicleName: string;
  vehicleNo: string;
}

export interface UpdateDeliveryProfilePayload {
  panNumber?: string;
  licenseImage?: string[];
  vehicleName?: string;
  vehicleNo?: string;
  vehicleOwnerName?: string;
  licenseNumber?: string;
  image?: string;
}

export interface DeliveryProfile {
  id: number;
  userId: number;
  shopkeeperId: number;
  aadharNumber: string;
  panNumber: string;
  licenseNumber: string;
  licenseImage: string[];
  vehicleOwnerName: string;
  vehicleName: string;
  vehicleNo: string;
  createdAt: string;
  updatedAt: string;
  name?: string;
  phone?: string;
  image?: string;
  totalEarnings?: number;
}

export interface DeliveryOrder {
  id: number;
  userId: number;
  assignedDeliveryBoyId: number;
  totalProducts: number;
  totalAmount: number;
  addressId: number;
  address?: {
    line1?: string;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    geoLocation?: string;
  };
  paymentMethod: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  cancelBy?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
  customerName?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
}

export const DeliveryService = {
  // POST /delivery/create-delivery-profile
  createProfile: async (data: CreateDeliveryProfilePayload) => {
    const response = await axiosInstance.post('/delivery/create-delivery-profile', data);
    return response.data;
  },

  // PUT /delivery/update-delivery-profile
  updateProfile: async (data: UpdateDeliveryProfilePayload) => {
    const response = await axiosInstance.put('/delivery/update-delivery-profile', data);
    return response.data;
  },

  // Assumed Endpoint: GET /delivery/profile
  getProfile: async () => {
    const response = await axiosInstance.get<any>('/delivery/profile');
    return response.data.data;
  },

  // GET /delivery/get-assigned-orders
  getAssignedOrders: async (status?: string): Promise<DeliveryOrder[]> => {
    const params = status ? { status } : {};
    const response = await axiosInstance.get<any>('/delivery/get-assigned-orders', { params });
    return (response.data.data.orders || []) as DeliveryOrder[];
  },

  // PATCH /delivery/update-order-status
  updateOrderStatus: async (orderId: number, status: string) => {
    const response = await axiosInstance.patch(`/delivery/update-order-status`, { orderId, status });
    return response.data;
  },

  // PATCH /delivery/update-location
  updateLocation: async (lat: number, lng: number) => {
    const response = await axiosInstance.patch('/delivery/update-location', { lat, lng });
    return response.data;
  },

  // Endpoint: POST /uploads/avatar -> getSignedUrl
  uploadImage: async (file: File): Promise<string> => {
    try {
      const fileName = `rider-doc-${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
      const contentType = file.type || 'application/octet-stream';

      // 1. Get Signed URL
      // We use /uploads/avatar because it maps to the generic getSignedUrl controller on the server
      const { data } = await axiosInstance.post<{ signedUrl: string, publicUrl: string }>('/uploads/avatar', {
        fileName,
        contentType
      });

      // 2. Direct Upload to GCS (bypass interceptors)
      // We use fetch here to ensure no extra headers are sent
      const uploadResponse = await fetch(data.signedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': contentType,
        },
        body: file
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      return data.publicUrl;
    } catch (error) {
      console.error("Image upload failed", error);
      throw error;
    }
  },

  // Assumed Endpoint: PATCH /delivery/availability
  toggleAvailability: async (status: boolean) => {
    const response = await axiosInstance.patch('/delivery/availability', { isOnline: status });
    return response.data;
  },

  // Get nearby shops for registration
  // Get nearby shops for registration
  getNearbyShops: async (lat?: number, lng?: number, city?: string) => {
    // Assuming an endpoint exists or using a general shop search
    const response = await axiosInstance.get('/delivery/shops/nearby', {
      params: { lat, lng, city }
    });
    // Fix: Extract .data from ApiResponse wrapper
    return response.data.data;
  },

  getAvailableCities: async () => {
    const response = await axiosInstance.get('/delivery/cities/available');
    return response.data.data;
  }
};