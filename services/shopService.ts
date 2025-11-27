import axiosInstance from '@/lib/axios';

// ==========================================
//              INTERFACES
// ==========================================

// --- 1. Common & Shop ---

export interface BankDetail {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  bankPassbookImage: string;
}

export interface ShopDocuments {
  aadharImage: string;
  electricityBillImage: string;
  businessCertificateImage: string;
  panImage: string;
}

export interface CreateShopPayload {
  shopName: string;
  shopCategory: string;
  shopImage: string[];
  fssaiNumber: string;
  gstNumber: string;
  bankDetail: BankDetail;
  documents: ShopDocuments;
}

export interface ShopProfile extends CreateShopPayload {
  id: number;
  userId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// --- 2. Products ---

export interface ProductPrice {
  id?: number;
  price: number;
  discount: number;
  weight: number;
  unit: string;
  currency: string;
}

export interface AddProductPayload {
  productCategoryId: number;
  globalProductId: number; // 0 if custom
  isGlobalProduct: boolean;
  name: string;
  description: string;
  images: string[];
  stock: number;
  prices: ProductPrice[];
}

export interface UpdateProductPayload {
  name?: string;
  description?: string;
  images?: string[];
  isActive?: boolean;
}

export interface ShopProduct {
  id: number;
  name: string;
  description: string;
  images: string[];
  stock: number;
  isActive: boolean;
  isGlobal: boolean;
  category: string;
  price: number; 
  prices?: ProductPrice[]; 
}

// --- 3. Orders ---

export interface ShopOrder {
  id: number;
  customerName: string;
  totalAmount: number;
  status: 'pending' | 'preparing' | 'ready' | 'shipped' | 'delivered' | 'cancelled';
  itemCount: number;
  createdAt: string;
  paymentMethod: string;
}

export interface ShopOrderDetail extends ShopOrder {
  customerId: number;
  customerPhone: string;
  address: string;
  products: {
    id: number;
    name: string;
    quantity: number;
    price: number;
    image: string;
  }[];
  driver?: {
    id: number;
    name: string;
    phone: string;
  };
}

// --- 4. Riders ---

export interface ShopRider {
  id: number;
  name: string;
  phone: string;
  status: 'available' | 'busy' | 'offline';
  activeOrders: number;
  image?: string;
  totalDeliveries?: number;
  rating?: number;
}

export interface UserProfile {
  id: number;
  name: string;
  phone: string;
  email: string;
  image: string;
  role: string;
}

// --- 5. Analytics (EXPORTED HERE) ---

export interface ShopAnalytics {
  revenueChart: { label: string; value: number }[];
  ordersChart: { label: string; value: number }[];
  metrics: {
    revenue: string;
    orders: string;
    customers: string;
    aov: string;
    revenueTrend?: string;
    ordersTrend?: string;
    customersTrend?: string;
    aovTrend?: string;
  };
  products: {
    name: string;
    sales: number;
    revenue: string;
  }[];
}

// ==========================================
//              SERVICE IMPLEMENTATION
// ==========================================

export const ShopService = {
  
  // --- SHOP MANAGEMENT ---

  createShop: async (data: CreateShopPayload) => {
    const response = await axiosInstance.post('/shops/create-shop', data);
    return response.data;
  },

  updateShop: async (data: Partial<CreateShopPayload>) => {
    const response = await axiosInstance.put('/shops/update-shop', data);
    return response.data;
  },

  getShopProfile: async () => {
    const response = await axiosInstance.get<ShopProfile>('/shops/profile');
    return response.data;
  },

  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosInstance.post<{ url: string }>('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.url;
  },

  // --- PRODUCT MANAGEMENT ---

  getInventory: async () => {
    const response = await axiosInstance.get<ShopProduct[]>('/shops/products');
    return response.data;
  },

  getGlobalCatalog: async () => {
    const response = await axiosInstance.get<ShopProduct[]>('/products/global');
    return response.data;
  },

  addProduct: async (data: any) => {
    const payload: AddProductPayload = {
        productCategoryId: data.productCategoryId || 1,
        globalProductId: data.globalProductId || 0,
        isGlobalProduct: data.isGlobalProduct || false,
        name: data.name,
        description: data.description,
        images: data.images,
        stock: Number(data.stock),
        prices: [{
            price: Number(data.price),
            discount: 0,
            weight: 1,
            unit: 'kg',
            currency: 'INR'
        }]
    };
    const response = await axiosInstance.post('/shops/add-shop-product', payload);
    return response.data;
  },

  updateStock: async (productId: number, stock: number) => {
    const response = await axiosInstance.put(`/shops/update-shop-product-stock/${productId}`, { stock });
    return response.data;
  },

  updateProductDetails: async (productId: number, data: Partial<UpdateProductPayload>) => {
    const response = await axiosInstance.put(`/shops/update-shop-product/${productId}`, data);
    return response.data;
  },

  deleteProduct: async (productId: number) => {
    const response = await axiosInstance.delete(`/shops/products/${productId}`);
    return response.data;
  },

  // --- ORDER MANAGEMENT ---
  
  getShopOrders: async (status?: string) => {
    const params = status && status !== 'all' ? { status } : {};
    const response = await axiosInstance.get<ShopOrder[]>('/shops/orders', { params });
    return response.data;
  },

  getShopOrderById: async (id: number) => {
    const response = await axiosInstance.get<ShopOrderDetail>(`/shops/orders/${id}`);
    return response.data;
  },

  updateOrderStatus: async (id: number, status: string) => {
    const response = await axiosInstance.put(`/shops/orders/${id}/status`, { status });
    return response.data;
  },

  // --- RIDER MANAGEMENT ---

  getShopRiders: async () => {
    const response = await axiosInstance.get<ShopRider[]>('/shops/riders');
    return response.data;
  },

  searchUserByPhone: async (phone: string) => {
    const response = await axiosInstance.get<UserProfile>('/shops/get-user', { params: { phone } });
    return response.data;
  },

  sendRiderInvite: async (userId: number) => {
    const response = await axiosInstance.patch('/shops/send-invite-to-delivery', { userId });
    return response.data;
  },

  assignRider: async (orderId: number, riderId: number) => {
    const response = await axiosInstance.post(`/shops/orders/${orderId}/assign`, { riderId });
    return response.data;
  },

  removeRider: async (riderId: number) => {
    const response = await axiosInstance.delete(`/shops/riders/${riderId}`);
    return response.data;
  },

  // --- ANALYTICS ---

  getAnalytics: async (range: string) => {
    const response = await axiosInstance.get<ShopAnalytics>('/shops/analytics', { params: { range } });
    return response.data;
  }
};