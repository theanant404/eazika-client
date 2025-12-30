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

export const notificationService = {
    /** Fetch the VAPID public key for the client to register a push subscription. */
    getVapidPublicKey: async (): Promise<string> => {
        const response = await axios.post<{ data?: string; key?: string; vapidPublicKey?: string }>(
            "/notifications/push/vapid-public-key"
        );
        return (
            response.data?.data || response.data?.key || response.data?.vapidPublicKey || ""
        );
    },

    /** Register a push subscription for the current user. */
    subscribe: async (subscription: PushSubscriptionPayload) => {
        const response = await axios.post("/notifications/push/subscribe", subscription);
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
    }

};

export default notificationService;
