import { create } from "zustand";
import { shopService } from "@/services/shopService";
import {
  ShopProductListType,
  GlobalProductListType,
  ProductPriceType,
  CurrentOrderListType,
} from "@/types/shop";

interface ShopState {
  products: ShopProductListType;
  globalProducts: GlobalProductListType;
  currentOders: CurrentOrderListType;
  isLoading: boolean;

  // Actions
  fetchProducts: () => Promise<void>;
  featchGlobalProducts: () => Promise<void>;
  feathCurrentOrders: (
    page?: number | string,
    limit?: number | string
  ) => Promise<void>;

  updateStock: (productId: number, pricing: ProductPriceType) => Promise<void>;
  deleteProduct: (productId: number) => Promise<void>;
}

const pagination = {
  currentPage: 1,
  itemsPerPage: 10,
  totalItems: 0,
  totalPages: 0,
};

export const shopStore = create<ShopState>((set, get) => ({
  products: {
    products: [],
    pagination: pagination,
  },
  globalProducts: {
    products: [],
    pagination: pagination,
  },
  currentOders: {
    orders: [],
    pagination: pagination,
  },

  isLoading: false,

  fetchProducts: async () => fetchProductsData(set),
  featchGlobalProducts: async () => fetchGlobalProductsData(set),
  feathCurrentOrders: async (page = 1, limit = 10) =>
    fetchCurrentOrdersData(page, limit, set, get),

  updateStock: async (productId: number, pricing: ProductPriceType) =>
    updateStockData(productId, pricing, set),

  deleteProduct: async (productId: number) => deleteProductData(productId, set),
}));
type Get = () => ShopState;
type Set = (
  state: Partial<ShopState> | ((state: ShopState) => Partial<ShopState>)
) => void;

// ============================ Actions ============================ //
const fetchProductsData = async (set: Set) => {
  set({ isLoading: true });
  try {
    const data = await shopService.getShopProducts();
    set({ products: data });
  } finally {
    set({ isLoading: false });
  }
};

const fetchGlobalProductsData = async (set: Set) => {
  set({ isLoading: true });
  try {
    const data = await shopService.getGlobalProducts();
    set({ globalProducts: data });
  } finally {
    set({ isLoading: false });
  }
};

const fetchCurrentOrdersData = async (
  page: number | string,
  limit: number | string,
  set: Set,
  get: Get
) => {
  set({ isLoading: true });
  try {
    const response = await shopService.getShopOrders(page, limit);

    if (Number(limit) == 1) {
      set({
        currentOders: {
          orders: response.orders,
          pagination: response.pagination,
        },
      });
    } else {
      const existingOrders = get().currentOders.orders;
      set({
        currentOders: {
          orders: [...existingOrders, ...response.orders],
          pagination: response.pagination,
        },
      });
    }
  } finally {
    set({ isLoading: false });
  }
};

const updateStockData = async (
  productId: number,
  pricing: ProductPriceType,
  set: Set
) => {
  // Optimistic Update
  set((state) => ({
    products: {
      ...state.products,
      products: state.products.products.map((p) =>
        p.id === productId ? { ...p, stock: pricing } : p
      ),
    },
  }));

  try {
    await shopService.updateStock(productId, pricing);
  } catch (error) {
    console.error("Stock update failed", error);
  }
};

const deleteProductData = async (productId: number, set: Set) => {
  set((state) => ({
    products: {
      ...state.products,
      products: state.products.products.filter((p) => p.id !== productId),
    },
  }));

  try {
    await shopService.deleteProduct(productId);
  } catch (error) {
    console.error("Delete failed", error);
  }
};
