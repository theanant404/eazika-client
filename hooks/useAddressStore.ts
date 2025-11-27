import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Address {
  id: string; // Unique ID for each address
  fullName: string;
  email: string;
  phone: string;
  address: string;
  zipCode: string;
  city: string;
  country: string;
}

interface AddressState {
  savedAddresses: Address[];
  addAddress: (address: Omit<Address, 'id'>) => void;
  removeAddress: (addressId: string) => void;
  // We can add functions later to select/edit addresses
}

export const useAddressStore = create<AddressState>()(
  persist(
    (set) => ({
      savedAddresses: [], // Start with an empty list
      
      addAddress: (newAddress) =>
        set((state) => {
          // Check if an address with the same details already exists (optional)
          const exists = state.savedAddresses.some(
              addr => addr.fullName === newAddress.fullName && 
                      addr.address === newAddress.address &&
                      addr.zipCode === newAddress.zipCode
          );
          if (exists) {
              return state; // Avoid adding duplicates
          }
          
          const addressWithId: Address = {
            ...newAddress,
            id: crypto.randomUUID(), // Generate a simple unique ID
          };
          return { savedAddresses: [...state.savedAddresses, addressWithId] };
        }),
        
      removeAddress: (addressId) =>
        set((state) => ({
          savedAddresses: state.savedAddresses.filter((addr) => addr.id !== addressId),
        })),
    }),
    {
      name: 'eazika-address-storage', // Name for localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
);
