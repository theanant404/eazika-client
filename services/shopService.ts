import axiosInstance from "@/lib/axios";
import axios from "@/lib/axios";

import type {
  CreateShopPayload,
  NewProductFormData,
  ProductPriceType,
  ShopProductListType,
  GlobalProductListType,
  OrderDetail,
} from "@/types/shop";

export interface ShopProfile extends CreateShopPayload {
  id: number;
  userId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

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
  globalProductId: number;
  isGlobalProduct: boolean;
  name: string;
  description: string;
  images: string[];
  stock: number;
  prices: ProductPrice[];
}
export interface AddProductFromGlobalProduct {
  // productCategoryId: number;
  globalProductId: number;
  pricing: Array<
    ProductPriceType & {
      globalProductId?: number;
      shopProductId?: number;
    }
  >;
}

export interface UpdateProductPayload extends Partial<NewProductFormData> {
  isActive?: boolean;
  prices?: ProductPriceType[];
  stock?: number;
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
  rating?: number;
  isTrending?: boolean;
}

export interface ShopOrder {
  id: number;
  customerName: string;
  totalAmount: number;
  name: string;
  geoLocation?: string;
  status:
  | "pending"
  | "preparing"
  | "ready"
  | "shipped"
  | "delivered"
  | "cancelled";
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

export interface ShopRider {
  id: number;
  name: string;
  phone: string;
  status: "available" | "busy" | "offline" | "pending";
  activeOrders: number;
  image?: string;
  totalDeliveries?: number;
  rating?: number;
  isVerified?: boolean;
}

export interface UserProfile {
  id: number;
  name: string;
  phone: string;
  email: string;
  image: string;
  role: string;
}

export interface Category {
  id: number | string;
  name: string;
  slug: string;
  image?: string;
  icon?: string;
  itemCount?: number;
}

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

// --- Service Implementation ---

export const ShopService = {
  // --- SHOP MANAGEMENT ---
  createShop: async (data: CreateShopPayload) => {
    const response = await axios.post("/shops/create-shop", data);
    return response.data;
  },

  updateShop: async (data: Partial<CreateShopPayload>) => {
    const response = await axios.put("/shops/update-shop", data);
    return response.data;
  },

  getShopProfile: async () => {
    const response = await axios.get<ShopProfile>("/shops/profile");
    return response.data;
  },

  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await axios.post<{ url: string }>("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.url;
  },
  getShopAddress: async () => {
    const response = await axios.get("/shops/get-shop-address");
    return response.data;
  },

  getShopGeoLocation: async (): Promise<string | undefined> => {
    const response = await axios.get("/shops/get-shop-address");
    // console.log("Shop address response:", response);
    return response.data?.geoLocation;
  },
  updateShopAddress: async (data: {
    name?: string;
    phone?: string;
    line1: string;
    line2?: string;
    street?: string;
    city: string;
    state: string;
    pinCode: string | number;
    country?: string;
    geoLocation?: string;
  }) => {
    const response = await axios.put("/shops/update-shop-address", data);
    return response.data;
  },
  // API calls for shop configuration
  shopDeliverySlots: async (data: {
    isOnlineDelivery: boolean;
    weeklySlots: Array<{
      day: string;
      isOpen: boolean;
      open: string;
      close: string;
    }>;
  }) => {
    try {
      const response = await axiosInstance.post(
        "/shops/schedule",
        data
      );
      return response.data;
    } catch (error) {
      console.error("Error updating delivery slots:", error);
      throw error;
    }
  },

  getShopDeliverySlots: async () => {
    try {
      const response = await axiosInstance.get(
        `/shops/schedule`
      );
      // console.log("Fetched delivery slots:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching delivery slots:", error);
      throw error;
    }
  },

  shopMinimumOrder: async (data: {
    minimumOrderValue: number;
  }) => {
    try {
      const response = await axiosInstance.post(
        "/shops/min-order",
        data
      );
      return response.data;
    } catch (error) {
      console.error("Error updating minimum order:", error);
      throw error;
    }
  },

  getShopMinimumOrder: async () => {
    try {
      const response = await axiosInstance.get(
        `/shops/min-order`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching minimum order:", error);
      throw error;
    }
  },

  shopDeliveryRates: async (data: {
    rates: Array<{
      km: number;
      price: number;
    }>;
  }) => {
    try {
      const response = await axiosInstance.post(
        "/shops/delivery-rates",
        data
      );
      return response.data;
    } catch (error) {
      console.error("Error updating delivery rates:", error);
      throw error;
    }
  },

  getShopDeliveryRates: async () => {
    try {
      const response = await axiosInstance.get(
        `/shops/delivery-rates`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching delivery rates:", error);
      throw error;
    }
  },

  // --- PRODUCT MANAGEMENT ---

  getInventory: async () => {
    try {
      const response = await axios.get<ShopProduct[]>("/shops/products");
      return response.data;
    } catch (error) {
      console.warn(
        "Access denied or Endpoint Missing (Inventory). Returning Empty.",
        error
      );
      return [];
    }
  },

  getProductById: async (id: number) => {
    try {
      const response = await axios.get<ShopProduct>(
        `/customers/products/${id}`
      );
      return response.data;
    } catch (error) {
      console.warn(`Product ${id} not found. Returning placeholder.`, error);

      return {
        id: id,
        name: "Product Not Found",
        description: "This product details could not be loaded.",
        price: 0,
        stock: 0,
        isActive: false,
        isGlobal: false,
        category: "Unknown",
        images: [],
      } as ShopProduct;
    }
  },

  getTrendingProducts: async () => {
    const response = await axios.get<ShopProduct[]>("/products/trending");
    return response.data;
  },

  getGlobalCatalog: async (): Promise<ShopProduct[]> => {
    try {
      const response = await axios.get(
        "/shops/products/get-all-global-product"
      );
      // Cast explicitly if needed or rely on inference
      const globalData = response.data.data as GlobalProductListType;

      return globalData.products.map((gp) => ({
        id: Number(gp.id), // Ensure numeric ID
        name: gp.name,
        description: gp.description,
        images: gp.images,
        stock: 100, // Default stock for catalog
        isActive: true,
        isGlobal: true,
        category: gp.category,
        price: gp.pricing?.[0]?.price || 0,
        prices:
          gp.pricing?.map((p, index) => ({
            id: index + 1,
            price: p.price,
            discount: p.discount || 0,
            weight: p.weight,
            unit: p.unit,
            currency: p.currency || "INR",
          })) || [],
        rating: gp.rating || 0,
      }));
    } catch (error) {
      console.warn("getGlobalCatalog failed", error);
      return [];
    }
  },

  // --- Additional Product Management Methods ---

  getCategories: async () => {
    const response = await axios.get("/shops/products/get-all-categories");
    return response.data.data;
  },
  getCategoriesForPbulic: async () => {
    const response = await axios.get("/shops/get-all-categories");
    return response.data.data;
  },

  getShopProducts: async (
    page: number | string = 1,
    limit: number | string = 10
  ): Promise<ShopProductListType> => {
    const params = new URLSearchParams();
    params.append("pagination[currentPage]", String(page));
    params.append("pagination[itemsPerPage]", String(limit));
    params.append("currentPage", String(page));
    params.append("itemsPerPage", String(limit));
    params.append("page", String(page));
    params.append("limit", String(limit));
    const response = await axios.get(
      `/shops/products/get-all-product?${params.toString()}`
    );
    return response.data.data;
  },

  getGlobalProducts: async (
    page: number | string = 1,
    limit: number | string = 10
  ): Promise<GlobalProductListType> => {
    const params = new URLSearchParams();
    params.append("pagination[currentPage]", String(page));
    params.append("pagination[itemsPerPage]", String(limit));
    params.append("currentPage", String(page));
    params.append("itemsPerPage", String(limit));
    params.append("page", String(page));
    params.append("limit", String(limit));
    const response = await axios.get(
      `/shops/products/get-all-global-product?${params.toString()}`
    );
    // console.log(response)
    return response.data.data;
  },

  addProduct: async (data: NewProductFormData) => {
    const response = await axios.post("/shops/products/add-shop-product", data);
    return response.data.data;
  },
  addProductFromGlobalCatalog: async (data: AddProductFromGlobalProduct) => {
    // console.log("selected data for add product from globel", data)
    const response = await axios.post(
      "/shops/products/add-shop-product-from-global-catalog",
      data
    );
    return response.data.data;
  },
  updateStock: async (data: UpdateProductPayload) => {
    // console.log("Updating stock with data:", data);
    const response = await axiosInstance.put(
      `/shops/products/update-shop-product-stock-and-price`,
      data
    );
    return response.data.data;
  },
  updateProductActivity: async (productId: number, isActive: boolean) => {
    // console.log("Updating product activity:", productId, isActive);
    const response = await axiosInstance.patch(
      `/shops/products/update-product-status`, { productId, isActive }
    );
    return response.data;
  },
  updateProductDetails: async (
    productId: number,
    data: Partial<UpdateProductPayload>
  ) => {
    // console.log("Updating product:", productId, data);
    const response = await axiosInstance.put(
      `/shops/products/update-shop-product/${productId}`,
      data
    );
    return response.data;
  },

  deleteProduct: async (productId: number) => {
    const response = await axiosInstance.delete(
      `/shops/products/delete-shop-product/${productId}`
    );
    return response.data.data;
  },

  // --- ORDER MANAGEMENT ---
  getShopOrders: async (
    pageOrStatus: number | string = 1,
    limit: number | string = 10
  ) => {
    const response = await axios.get(
      `/shops/orders/get-current-orders?page=${pageOrStatus}&limit=${limit}`
    );
    console.log("Fetched shop orders:", response);
    return response.data.data;
  },

  getShopOrderById: async (id: number | string): Promise<OrderDetail> => {
    const response = await axios.get(`/shops/orders/order/${id}`);
    // console.log("Fetched order details:", response);
    return response.data.data.order;
  },

  updateOrderStatus: async (
    orderId: OrderDetail["id"],
    status: OrderDetail["status"],
    riderId: number | string | null = null
  ) => {
    const response = await axios.put(`/shops/orders/order/status/${orderId}`, {
      status,
      riderId,
    });
    return response.data.data;
  },

  // --- RIDER MANAGEMENT ---
  getShopRiders: async (status: "all" | "pending" | "verified" = "all") => {
    const response = await axiosInstance.get<any>("/shops/get-riders", {
      params: { status },
    });
    return response.data.data.map((r: any) => ({
      id: r.id,
      name: r.user.name || "Unknown",
      phone: r.user.phone,
      status: !r.isVerified
        ? "pending"
        : r.isAvailable
          ? "available"
          : "offline",
      activeOrders: 0,
      totalDeliveries: 0,
      rating: 4.5,
      image: r.user.image,
      isVerified: r.isVerified,
    }));
  },

  approveRider: async (riderId: number) => {
    const response = await axiosInstance.patch("/shops/approve-rider", {
      riderId,
    });
    return response.data.data;
  },

  rejectRider: async (riderId: number) => {
    // Axios delete with body requires 'data' property in config
    const response = await axiosInstance.delete("/shops/reject-rider", {
      data: { riderId },
    });
    return response.data.data;
  },

  searchUserByPhone: async (phone: string) => {
    const response = await axiosInstance.get<UserProfile>("/shops/get-user", {
      params: { phone },
    });
    return response.data;
  },

  sendRiderInvite: async (userId: number) => {
    const response = await axiosInstance.patch(
      "/shops/send-invite-to-delivery",
      { userId }
    );
    return response.data;
  },

  assignRider: async (orderId: number | string, riderId: number | string) => {
    const response = await axiosInstance.post(`/shops/assign-order`, {
      orderId,
      deliveryBoyId: riderId,
    });
    return response.data.data;
  },

  removeRider: async (riderId: number) => {
    const response = await axiosInstance.delete(`/shops/riders/${riderId}`);
    return response.data;
  },

  // --- ANALYTICS ---
  getAnalytics: async (range: string) => {
    const response = await axiosInstance.get<ShopAnalytics>(
      "/shops/analytics",
      { params: { range } }
    );
    return response.data;
  },

  toggleProductStatus: async (productId: number, isActive: boolean) => {
    const response = await axiosInstance.patch(`/shops/products/toggle-status/${productId}`, { isActive });
    return response.data.data;
  },
};

export default ShopService;
export { ShopService as shopService };
