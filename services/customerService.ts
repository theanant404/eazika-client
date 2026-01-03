import type {
  CartItem,
  AddToCartPayload,
  OrderPayload,
} from "@/types/products";
import type { ProductDetailType, ProductListType } from "@/types";
import axios from "@/lib/axios";

const allCartMethods = {
  getCart: async (): Promise<CartItem[]> => {
    const response = await axios.get("/customers/carts/get-cart");
    return response.data.data.items;
  },

  addToCart: async (data: AddToCartPayload): Promise<void> => {
    const response = await axios.post("/customers/carts/add-to-cart", data);
    return response.data;
  },

  updateCartItem: async (
    itemId: number,
    data: { quantity: number }
  ): Promise<void> => {
    const response = await axios.put(
      `/customers/update-cart-item/${itemId}`,
      data
    );
    return response.data;
  },

  removeCartItem: async (itemId: number): Promise<void> => {
    const response = await axios.delete(
      `/customers/carts/remove-cart-item/${itemId}`
    );
    return response.data;
  },

  clearCart: async (): Promise<void> => {
    const response = await axios.delete("/customers/carts/clear-cart");
    return response.data;
  },

  createOrder: async (data: OrderPayload): Promise<void> => {
    const response = await axios.post(
      "/customers/create-order",
      JSON.stringify(data)
    );
    return response.data;
  },

  getOrderById: async (orderId: number): Promise<any> => {
    const response = await axios.get(`/customers/get-order/${orderId}`);
    return response.data.data;
  },
  trackOrder: async (orderId: number): Promise<any> => {
    const response = await axios.get(`/customers/track-order/${orderId}`);
    return response.data.data;
  },
};

const coustomerServices = {
  getProducts: async (
    page = 1,
    limit = 10,
    city?: string
  ): Promise<ProductListType> => {
    let url = `/customers/products?page=${page}&limit=${limit}`;
    if (city) {
      url += `&city=${encodeURIComponent(city)}`;
    }
    const response = await axios.get(url);
    return response.data.data;
  },

  getProductById: async (productId: number): Promise<ProductDetailType> => {
    const response = await axios.get(`/customers/products/${productId}`);
    // console.log("Product details response:", response.data.data);
    return response.data.data.product;
  },

  getAvailableCities: async (): Promise<string[]> => {
    try {
      const response = await axios.get("/customers/cities");
      return response.data.data;
    } catch (error) {
      console.warn("Failed to fetch cities from backend");
      return [];
    }
  },

  getCategories: async (): Promise<any[]> => {
    try {
      const response = await axios.get("/customers/products/categories");
      return response.data.data;
    } catch (error) {
      console.warn("Failed to fetch categories");
      return [];
    }
  },

  getEligibleForRating: async (productId: number): Promise<{ eligible: boolean; hasReviewed: boolean; message: string }> => {
    const response = await axios.get(`/customers/products/${productId}/rating-eligibility`);
    return response.data.data;
  },

  submitRating: async (productId: number, data: { rating: number; review: string }): Promise<void> => {
    const response = await axios.post(`/customers/products/${productId}/rating`, data);
    // console.log(response.data);
    return response.data;
  },
  filterProducts: async (filter: string): Promise<ProductListType> => {
    const response = await axios.get(`/customers/products/filter?filter=${filter}`);
    return response.data.data;
  },
  cartMethods: allCartMethods,
};

export default coustomerServices;
export const { getProducts, getProductById, getAvailableCities, getCategories, cartMethods, getEligibleForRating, submitRating } =
  coustomerServices;
