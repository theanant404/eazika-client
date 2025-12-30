"use client";
import { useEffect } from "react";
import { toast } from "sonner";
import { getToken } from "@/lib/axios";
import notificationService from "@/services/notificationService";

function PushNotificationProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    (async () => {
      if (typeof window === "undefined") return;

      const token = await getToken("accessToken");
      if (!token) return; // only attempt after login

      await ensurePermissionAndSubscribe();
    })();
  }, []);

  async function urlBase64ToUint8Array(base64String: string | undefined | null) {
    if (typeof base64String !== "string") {
      console.error("VAPID public key is not a string:", base64String);
      throw new Error("VAPID public key must be a string");
    }
    // Remove any whitespace and line breaks
    base64String = base64String.replace(/\s/g, "");
    // Add padding if needed
    const padLength = (4 - (base64String.length % 4)) % 4;
    if (padLength) base64String += "=".repeat(padLength);
    // Replace URL-safe chars
    const base64 = base64String.replace(/-/g, "+").replace(/_/g, "/");
    try {
      const rawData = atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    } catch (e) {
      console.error("Invalid VAPID public key for push subscription", base64String, e);
      throw e;
    }
  }

  async function ensurePermissionAndSubscribe() {
    try {
      if (!("Notification" in window)) return;
      // 1) Register service worker
      if (!("serviceWorker" in navigator))
        throw new Error("Service workers not supported");
      await navigator.serviceWorker.register("/sw.js");

      // 2) Ensure Notification permission
      const existingPermission = Notification.permission;
      if (existingPermission === "denied") {
        toast.info("Enable notifications in your browser to get order updates.");
        return;
      }

      const permission =
        existingPermission === "default"
          ? await Notification.requestPermission()
          : existingPermission;
      if (permission !== "granted") return;
      // 3) Fetch public VAPID key from server
      const publicKeyResponse = await notificationService.getVapidPublicKey();
      let publicKey: string | undefined = undefined;
      if (typeof publicKeyResponse === "string") {
        publicKey = publicKeyResponse;
      } else if (publicKeyResponse && typeof publicKeyResponse === "object" && typeof publicKeyResponse.publicKey === "string") {
        publicKey = publicKeyResponse.publicKey;
      }
      if (!publicKey || !publicKey.trim()) {
        toast.error("Push notification setup failed: VAPID public key missing from server.");
        console.error("VAPID public key missing or invalid:", publicKeyResponse);
        return;
      }

      // 4) Get service worker registration and subscribe
      const registration = await navigator.serviceWorker.ready;
      const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: await urlBase64ToUint8Array(publicKey),
      };
      console.log("Subscribe Options:", subscribeOptions);
      const existingSubscription = await registration.pushManager.getSubscription();
      const pushSubscription =
        existingSubscription ||
        (await registration.pushManager.subscribe(subscribeOptions));

      // 5) Send subscription to server
      const subscriptionJSON = pushSubscription.toJSON();
      if (!subscriptionJSON || typeof subscriptionJSON !== "object" || !subscriptionJSON.endpoint) {
        throw new Error("Push subscription endpoint is missing or subscription is invalid.");
      }
      // Defensive: ensure keys object exists
      const keys = subscriptionJSON.keys && typeof subscriptionJSON.keys === "object"
        ? subscriptionJSON.keys
        : { p256dh: "", auth: "" };
      // Optionally, add userDevice info (e.g., user agent string)
      const userDevice = typeof navigator !== "undefined" && navigator.userAgent ? navigator.userAgent : undefined;
      await notificationService.subscribe({
        endpoint: subscriptionJSON.endpoint,
        expirationTime:
          typeof subscriptionJSON.expirationTime === "number"
            ? subscriptionJSON.expirationTime
            : null,
        keys: {
          p256dh: keys.p256dh ?? "",
          auth: keys.auth ?? "",
        },
        ...(userDevice ? { userDevice } : {}),
      });
    } catch (err) {
      console.error(err);
    }
  }

  return <>{children}</>;
}

export default PushNotificationProvider;
