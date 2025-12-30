import axios from "@/lib/axios";

export interface PushSubscriptionPayload {
    endpoint: string;
    expirationTime?: number | null;
    keys: {
        p256dh: string;
        auth: string;
    };
}

export interface SendNotificationPayload {
    title: string;
    body: string;
    icon?: string;
    url?: string;
    data?: Record<string, any>;
}
type VapidKeyResponse = {
    publicKey: string;
};

export const notificationService = {
    /** Fetch the VAPID public key for the client to register a push subscription. */
    getVapidPublicKey: async (): Promise<VapidKeyResponse> => {
        const response = await axios.post<{ data?: string; key?: string; publicKey?: string }>(
            "/notifications/push/vapid-public-key"
        );
        const publicKey =
            response.data?.data ||
            response.data?.publicKey ||
            response.data?.key ||
            "";
        return { publicKey };
    },

    /** Register a push subscription for the current user. */
    subscribe: async (subscription: PushSubscriptionPayload) => {
        console.log("Subscribing with payload:", subscription);
        const response = await axios.post("/notifications/push/subscribe", subscription);
        console.log("Subscription response:", response);
        return response.data;
    },

    /** Send a notification to a specific user. */
    sendToUser: async (userId: number | string, payload: SendNotificationPayload) => {
        const response = await axios.post(`/notifications/push/send/user/${userId}`, payload);
        return response.data;
    },

    /** Broadcast a notification to all subscribers. */
    sendToAll: async (payload: SendNotificationPayload) => {
        const response = await axios.post("/notifications/push/send/all", payload);
        return response.data;
    },
    getNotifications: async (): Promise<any[]> => {
        const response = await axios.get("/notifications/all");
        return response.data.data;
    },
    markNotificationRead: async (notificationId: number): Promise<void> => {
        const response = await axios.patch(`/notifications/mark-read/${notificationId}/read`);
        return response.data;
    },
};

export default notificationService;
