import axiosInstance from "@/lib/axios";

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
}

export const AdminService = {
  
  getStats: async () => {
    const response = await axiosInstance.get("/admin/stats");
    return response.data.data;
  },

  getLiveMapData: async () => {
    const response = await axiosInstance.get("/admin/map/live-data");
    return response.data.data;
  },

  
  getAllUsers: async (page = 1, limit = 10) => {
    const response = await axiosInstance.get(`/admin/users/get-all-users`, {
      params: { page, limit },
    });
    return response.data.data;
  },

  
  getAllShops: async (status = "all") => {
    const response = await axiosInstance.get(`/admin/shops/get-all`, {
      params: { status },
    });
    return response.data.data;
  },

  verifyShop: async (shopId: number, status: "active" | "rejected") => {
    const response = await axiosInstance.patch(
      `/admin/shops/${shopId}/verify`,
      {
        status,
      }
    );
    return response.data.data;
  },

  getAllRiders: async () => {
    const response = await axiosInstance.get(`/admin/riders/get-all`);
    return response.data.data;
  },

  getAllOrders: async () => {
    const response = await axiosInstance.get(`/admin/orders/get-all`);
    return response.data.data;
  },

  
  getAllCategories: async () => {
    const response = await axiosInstance.get("/admin/products/get-categories");
    return response.data.data.categories;
  },

  createCategory: async (name: string, description: string) => {
    const response = await axiosInstance.post(
      "/admin/products/create-category",
      { name, description }
    );
    return response.data.data;
  },

  createGlobalProduct: async (data: any) => {
    const response = await axiosInstance.post(
      "/admin/products/add-global",
      data
    );
    return response.data.data;
  },

  createGlobalProductsBulk: async (products: any[]) => {
    const response = await axiosInstance.post(
      "/admin/products/add-global-in-bluk",
      { products }
    );
    return response.data.data;
  },
};
