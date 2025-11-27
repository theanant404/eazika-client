import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistState {
  wishlistIds: string[];
  toggleWishlist: (id: string) => void;
  isWishlisted: (id: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      wishlistIds: [],
      toggleWishlist: (id) => {
        const { wishlistIds } = get();
        const isInWishlist = wishlistIds.includes(id);
        set({
          wishlistIds: isInWishlist
            ? wishlistIds.filter((itemId) => itemId !== id)
            : [...wishlistIds, id],
        });
      },
      isWishlisted: (id) => get().wishlistIds.includes(id),
    }),
    {
      name: 'wishlist-storage',
    }
  )
);