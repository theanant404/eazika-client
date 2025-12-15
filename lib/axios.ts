import axios, { isAxiosError } from "axios";
// import { useUserStore } from "@/hooks/useUserStore";

const SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL || "https://server.eazika.com";
const BASE_URL = `${SERVER_URL}/api/v2`;

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

async function getToken(tokenName: string): Promise<string | null> {
  // 1. Try reading from cookieStore (Modern Browsers)
  try {
    if (typeof cookieStore !== 'undefined') {
        const cookie = await cookieStore.get(tokenName);
        if (cookie?.value) return cookie.value;
    }
  } catch (e) {
    // Ignore error, proceed to next method
  }

  // 2. Try reading from document.cookie (Fallback)
  try {
      if (typeof document !== 'undefined') {
          const match = document.cookie.match(new RegExp('(^| )' + tokenName + '=([^;]+)'));
          if (match) return match[2];
      }
  } catch (e) {
      // Ignore
  }

  // 3. Try reading from localStorage (Fallback)
  try {
      if (typeof localStorage !== 'undefined') {
          return localStorage.getItem(tokenName);
      }
  } catch (e) {
      // Ignore
  }
  
  return null;
}
// --- REQUEST INTERCEPTOR ---
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await getToken("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// --- RESPONSE INTERCEPTOR ---
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // if (isAxiosError(error) && error.response) {
    //   const { status } = error.response;

    //   // Handle 401 Unauthorized globally
    //   if (status === 401) {
    //     // Optionally, you can clear user data or redirect to login
    //     // const userStore = useUserStore();
    //     // userStore.clearUserData();
    //     console.warn("Unauthorized! Please log in again.");
    //   }
    // }
    return Promise.reject(error);
  }
);

export default axiosInstance;
export { isAxiosError, getToken };
