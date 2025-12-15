import axios from "@/lib/axios";
import type {
  User,
  Address,
  RegisterPayload,
  VerifyOtpPayload,
  NewAddressPayload,
} from "@/types/user";

export const userService = {
  // --- AUTHENTICATION ---

  registerUser: async (data: RegisterPayload) => {
    const response = await axios.post("/users/register", data);
    return response.data;
  },

  verifyRegistration: async (data: VerifyOtpPayload) => {
    const response = await axios.post("/users/register/verify", data);
    return response.data;
  },

  resendRegistrationOtp: async (data: RegisterPayload) => {
    const response = await axios.post("/users/register/resend", data);
    return response.data;
  },

  loginUser: async (phone: string) => {
    const response = await axios.post("/users/login", { phone });
    return response.data;
  },

  verifyLogin: async (data: VerifyOtpPayload) => {
    const response = await axios.post("/users/login/verify", data);
    return response.data;
  },

  resendLoginOtp: async (phone: string, requestId: string) => {
    const response = await axios.post("/users/login/resend", {
      phone,
      requestId,
    });
    return response.data;
  },

  logout: async () => {
    const response = await axios.post("/users/logout");
    return response.data;
  },

  refresh: async (refreshToken?: string) => {
    const response = await axios.post("/users/refresh", {
      refreshToken,
    });
    return response.data;
  },

  /* ================= PROFILE ================= */

  getMe: async (): Promise<User> => {
    const response = await axios.get("/users/user");
    return response.data.data.user;
  },

  updateProfile: async (data: User): Promise<User> => {
    const response = await axios.patch("/users/user/update-user", data);
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

  updateProfilePicture: async (imageUrl: string) => {
    const response = await axios.patch("/users/user/update-profile-picture", {
      imageUrl: imageUrl,
    });
    return response.data;
  },

  /* ================= ADDRESSES ================= */

  addAddress: async (data: NewAddressPayload): Promise<Address> => {
    const response = await axios.post("/users/user/add-new-address", data);
    return response.data;
  },

  getAddresses: async (): Promise<Address[]> => {
    const response = await axios.get("/users/user/addresses");
    return response.data;
  },
  updateAddress: async (addressId: number, data: Address) => {
    const response = await axios.patch(
      `/users/user/update-address/${addressId}`,
      data
    );
    return response.data;
  },

  deleteAddress: async (addressId: number) => {
    const response = await axios.delete(
      `/users/user/delete-address/${addressId}`
    );
    return response.data;
  },

  // // --- ADDED: NOTIFICATIONS ---
  getNotifications: async () => {
    const response = await axios.get("/users/notifications");
    return response.data;
  },

  markNotificationRead: async (id: number) => {
    const response = await axios.patch(`/users/notifications/${id}/read`);
    return response.data;
  },
};
