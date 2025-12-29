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
  fetchProducts: (
    page?: number | string,
    limit?: number | string,
    append?: boolean
  ) => Promise<void>;
  featchGlobalProducts: (
    page?: number | string,
    limit?: number | string,
    append?: boolean
  ) => Promise<void>;
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

  fetchProducts: async (page = 1, limit = 10, append = false) =>
    fetchProductsData(page, limit, append, set),
  featchGlobalProducts: async (page = 1, limit = 10, append = false) =>
    fetchGlobalProductsData(page, limit, append, set),
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

const dedupeById = <T extends { id?: number | string }>(items: T[]): T[] => {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const key = String(item.id ?? "");
    if (key && !seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
};

// ============================ Actions ============================ //
const fetchProductsData = async (
  page: number | string,
  limit: number | string,
  append: boolean,
  set: Set
) => {
  set({ isLoading: true });
  try {
    const data = await shopService.getShopProducts(page, limit);
    const normalized: ShopProductListType = {
      products: data.products || [],
      pagination:
        data.pagination || {
          currentPage: 1,
          itemsPerPage: 10,
          totalItems: 0,
          totalPages: 0,
        },
    };

    if (append && Number(page) > 1) {
      set((state) => ({
        products: {
          products: dedupeById([...(state.products?.products ?? []), ...normalized.products]),
          pagination: normalized.pagination,
        },
      }));
    } else {
      set({ products: normalized });
    }
  } finally {
    set({ isLoading: false });
  }
};

const fetchGlobalProductsData = async (
  page: number | string,
  limit: number | string,
  append: boolean,
  set: Set
) => {
  set({ isLoading: true });
  try {
    const raw = await shopService.getGlobalProducts(page, limit);
    // API sometimes returns { globalProducts: [...] } instead of { products: [...] }
    const normalized: GlobalProductListType = {
      products: (raw as any)?.products ?? (raw as any)?.globalProducts ?? [],
      pagination: (raw as any)?.pagination ?? {
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 0,
        totalPages: 0,
      },
    };

    if (append && Number(page) > 1) {
      set((state) => ({
        globalProducts: {
          products: dedupeById([...(state.globalProducts?.products ?? []), ...normalized.products]),
          pagination: normalized.pagination,
        },
      }));
    } else {
      set({ globalProducts: normalized });
    }
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
    // console.log("Updating stock for product:", productId, pricing);
    await shopService.updateStock(pricing);
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
