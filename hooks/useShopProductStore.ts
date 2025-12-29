import { create } from 'zustand';
import { ShopService, ShopProduct } from '@/services/shopService';
import { ProductPriceType } from '@/types/shop';

interface ShopProductState {
  products: ShopProduct[];
  isLoading: boolean;
  activeTab: string;

  // Actions
  setTab: (tab: string) => void;
  fetchProducts: () => Promise<void>;
  updateStock: (id: number, newStock: number) => Promise<void>;
  toggleVisibility: (id: number) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  addProductFromGlobal: (product: ShopProduct) => Promise<void>;
}

export const useShopProductStore = create<ShopProductState>((set, get) => ({
  products: [],
  isLoading: false,
  activeTab: 'inventory',

  setTab: (tab) => {
    set({ activeTab: tab });
    get().fetchProducts(); // Auto-fetch when tab changes
  },

  fetchProducts: async () => {
    const { activeTab } = get();
    set({ isLoading: true });
    try {
      let data: ShopProduct[] = [];
      if (activeTab === 'inventory') {
        data = await ShopService.getInventory();
      } else if (activeTab === 'global') {
        data = await ShopService.getGlobalCatalog();
      } else if (activeTab === 'my_products') {
        // In a real app, this might be a separate endpoint. 
        // Here we filter inventory for custom items (assuming isGlobal=false means custom)
        const inventory = await ShopService.getInventory();
        data = inventory.filter(p => !p.isGlobal);
      }
      set({ products: data });
    } catch (error) {
      console.warn("Failed to fetch products", error);
    } finally {
      set({ isLoading: false });
    }
  },

  updateStock: async (id, newStock) => {
    const product = get().products.find(p => p.id === id);
    if (!product) return;

    // Optimistic Update
    set(state => ({
      products: state.products.map(p =>
        p.id === id ? { ...p, stock: newStock } : p
      )
    }));

    try {
      // Find the price variant to update (assuming first one)
      const priceVariant = product.prices?.[0];

      if (priceVariant) {
        const pricePayload: ProductPriceType = {
          id: priceVariant.id,
          price: priceVariant.price,
          discount: priceVariant.discount ?? 0,
          weight: priceVariant.weight,
          unit: (priceVariant.unit as ProductPriceType['unit']) ?? 'grams',
          currency: priceVariant.currency,
          stock: newStock,
        };

        await ShopService.updateStock({
          stock: newStock,
          prices: [pricePayload],
        });
      } else {
        console.warn("No price variant found to update stock for product", id);
      }
    } catch (error) {
      console.error("Stock update failed", error);
      // Revert logic could go here
    }
  },

  toggleVisibility: async (id) => {
    const product = get().products.find(p => p.id === id);
    if (!product) return;

    const newStatus = !product.isActive;

    // Optimistic Update
    set(state => ({
      products: state.products.map(p =>
        p.id === id ? { ...p, isActive: newStatus } : p
      )
    }));

    try {
      await ShopService.updateProductDetails(id, { isActive: newStatus });
    } catch (error) {
      console.error("Visibility toggle failed", error);
    }
  },

  deleteProduct: async (id) => {
    // Optimistic Remove
    set(state => ({
      products: state.products.filter(p => p.id !== id)
    }));

    try {
      // Assuming ShopService has a delete method (we'll add it)
      await ShopService.deleteProduct(id);
    } catch (error) {
      console.error("Delete failed", error);
    }
  },

  addProductFromGlobal: async (product) => {
    // Mock adding to inventory
    // console.log("Adding global product", product.name);
    // In real app: await ShopService.addProduct({ ...product, isGlobal: true });
  }
}));