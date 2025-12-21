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
    // Generate unique filename
    const fileName = `profile-${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
    const contentType = file.type || 'image/jpeg';

    // 1. Get Signed URL from backend
    const { data } = await axios.post<{ signedUrl: string; publicUrl: string }>('/uploads/avatar', {
      fileName,
      contentType
    });

    // 2. Direct Upload to GCS (bypass axios interceptors)
    const uploadResponse = await fetch(data.signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: file
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.statusText}`);
    }

    return data.publicUrl;
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
    return response.data.data?.address || response.data.data;
  },

  getAddresses: async (): Promise<Address[]> => {
    const response = await axios.get("/users/user/addresses");
    const addresses = response.data.data || response.data || [];
    return Array.isArray(addresses) ? addresses : [];
  },

  updateAddress: async (addressId: number, data: Address) => {
    const response = await axios.patch(
      `/users/user/update-address/${addressId}`,
      data
    );
    return response.data.data?.address || response.data.data;
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
