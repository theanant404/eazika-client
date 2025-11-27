import { create } from 'zustand';
import { CartService, CartItem, AddToCartPayload, OrderPayload } from '@/services/cartService';
import { products as mockProducts } from '@/app/data/mockData'; 

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addToCart: (data: AddToCartPayload) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  // Added placeOrder to interface
  placeOrder: (data: OrderPayload) => Promise<any>; 
  cartCount: number;
  cartTotal: number;
}

// Helper to calculate total
const calculateTotal = (items: CartItem[]) => {
  return items.reduce((total, item) => {
    const price = item.productDetails?.price || 0;
    return total + (price * item.quantity);
  }, 0);
};

// Helper: Merge API cart items (IDs) with Mock Data (Images/Names)
const mapCartItemsWithDetails = (apiItems: CartItem[]) => {
  return apiItems.map(item => {
    const product = mockProducts.find(p => parseInt(p.id.replace('p-', '')) === item.shopProductId);
    if (product) {
      return {
        ...item,
        productDetails: {
          name: product.name,
          image: product.images[0],
          price: product.price
        }
      };
    }
    return item;
  });
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isLoading: false,
  cartCount: 0,
  cartTotal: 0,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const data = await CartService.getCart();
      const itemsWithDetails = mapCartItemsWithDetails(data);
      
      set({ 
        items: itemsWithDetails, 
        cartCount: itemsWithDetails.length,
        cartTotal: calculateTotal(itemsWithDetails)
      });
    } catch (error) {
      console.warn("API Fetch failed (using local state):", error);
    } finally {
      set({ isLoading: false });
    }
  },

  addToCart: async (data) => {
    set({ isLoading: true });
    
    // 1. Prepare Optimistic Item
    const product = mockProducts.find(p => parseInt(p.id.replace('p-', '')) === data.shopProductId);
    const newItem: CartItem = {
        id: Math.random(), // Temp ID
        userId: 1,
        shopProductId: data.shopProductId,
        productPriceId: data.productPriceId,
        quantity: data.quantity,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        productDetails: {
            name: product?.name || 'Item',
            image: product?.images[0] || '',
            price: product?.price || 0
        }
    };

    // 2. Optimistic Update
    const currentItems = get().items;
    const existingIndex = currentItems.findIndex(i => i.shopProductId === data.shopProductId);
    let nextItems = [...currentItems];

    if (existingIndex > -1) {
        nextItems[existingIndex].quantity += data.quantity;
    } else {
        nextItems.push(newItem);
    }

    set({ 
        items: nextItems, 
        cartCount: nextItems.length,
        cartTotal: calculateTotal(nextItems)
    });

    // 3. API Call
    try {
      await CartService.addToCart(data);
    } catch (error) {
      console.warn("API Add failed (Kept optimistic update for dev):", error);
    } finally {
      set({ isLoading: false });
    }
  },

  removeFromCart: async (itemId) => {
    const previousItems = get().items;
    const updatedItems = previousItems.filter((i) => i.id !== itemId);
    
    set({
      items: updatedItems,
      cartCount: updatedItems.length,
      cartTotal: calculateTotal(updatedItems)
    });

    try {
      await CartService.removeCartItem(itemId);
    } catch (error) {
      console.warn("API Remove failed:", error);
    }
  },

  updateQuantity: async (itemId, quantity) => {
    if (quantity < 1) return;
    const previousItems = get().items;
    const updatedItems = previousItems.map((i) => (i.id === itemId ? { ...i, quantity } : i));
    
    set({
      items: updatedItems,
      cartTotal: calculateTotal(updatedItems)
    });

    try {
      await CartService.updateCartItem(itemId, { quantity });
    } catch (error) {
      console.warn("API Update failed:", error);
    }
  },

  clearCart: async () => {
    set({ items: [], cartCount: 0, cartTotal: 0 });
    try {
        await CartService.clearCart();
    } catch (error) {
        console.warn("API Clear failed:", error);
    }
  },

  // Implemented placeOrder action
  placeOrder: async (data) => {
    set({ isLoading: true });
    try {
        const order = await CartService.createOrder(data);
        // Clear cart on success
        set({ items: [], cartCount: 0, cartTotal: 0 });
        return order;
    } catch (error) {
        console.error("Place Order Failed:", error);
        throw error;
    } finally {
        set({ isLoading: false });
    }
  }
}));