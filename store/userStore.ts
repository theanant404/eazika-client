import { create } from "zustand";
import type { User, Address, NewAddressPayload } from "@/types/user";
import { userService } from "@/services/userService";

interface UserState {
  user: User | null;
  addresses: Address[];
  isAuthenticated: boolean;
  isLoading: boolean;

  // // Actions
  fetchUser: (fresh?: "fresh" | null) => Promise<void>;
  updateUser: (data: User) => Promise<void>;
  addNewAddress: (address: NewAddressPayload) => Promise<Address>;
  logout: () => Promise<void>;
}

export const userStore = create<UserState>((set, get) => ({
  user: null,
  addresses: [],
  isAuthenticated: false,
  isLoading: false,

  fetchUser: (fresh = null) => fetchUserData(set, fresh),
  updateUser: (data: User) => updateUserData(data, set),
  addNewAddress: (address: NewAddressPayload) =>
    addNewAddressData(address, get),
  logout: async () => logoutUser(set),
}));

/* ============================ Type Aliases ============================ */
type Get = () => UserState;
type Set = (
  state: Partial<UserState> | ((state: UserState) => Partial<UserState>)
) => void;
/* ============================ Actions ============================ */

const fetchUserData = async (set: Set, fresh: "fresh" | null) => {
  set({ isLoading: true });
  try {
    const storedData = localStorage.getItem("eazika-user-data");
    if (storedData && fresh !== "fresh") {
      const data = JSON.parse(storedData) as User;
      set({
        user: data,
        isAuthenticated: true,
        addresses: data.addresses || [],
      });
    } else {
      const data = await userService.getMe();
      set({
        user: data,
        isAuthenticated: true,
        addresses: data.addresses || [],
      });
      localStorage.setItem("eazika-user-data", JSON.stringify(data));
    }
  } finally {
    set({ isLoading: false });
  }
};

const updateUserData = async (data: User, set: Set) => {
  set({ isLoading: true });
  try {
    const updatedUser = await userService.updateProfile(data);
    set({ user: updatedUser });
  } finally {
    set({ isLoading: false });
  }
};

const addNewAddressData = async (
  address: NewAddressPayload,
  get: Get
): Promise<Address> => {
  const addr = await userService.addAddress(address);
  await get().fetchUser("fresh");
  return addr;
};

const logoutUser = async (set: Set) => {
  set({ isLoading: true });
  try {
    // await userService.logout();
    // clear local storage and cookies
    await localStorage.clear();
    await document.cookie
      .split(";")
      .forEach(
        (c) =>
          (document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`))
      );
    set({ user: null, isAuthenticated: false });
  } finally {
    set({ isLoading: false });
  }
};
