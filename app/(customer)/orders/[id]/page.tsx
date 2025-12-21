"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  CheckCircle,
  RefreshCw,
  XCircle,
  Package,
  MapPin,
  CreditCard,
  HelpCircle,
  Copy,
  Loader2,
  Clock,
  Truck,
} from "lucide-react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { useParams, useRouter } from "next/navigation";
import { CartService, Order, TrackingDetails } from "@/services/cartService";
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from "@react-google-maps/api";

// Helper to get Status Icon & Color based on API status
const getStatusInfo = (status: string) => {
  switch (status) {
    case "pending":
    case "confirmed":
    case "preparing":
    case "ready":
      return {
        icon: Package,
        color: "text-blue-500",
        bg: "bg-blue-100 dark:bg-blue-900/30",
        animate: false,
        label: "Processing",
      };
    case "shipped":
      return {
        icon: Truck,
        color: "text-purple-500",
        bg: "bg-purple-100 dark:bg-purple-900/30",
        animate: true,
        label: "On the way",
      };
    case "delivered":
      return {
        icon: CheckCircle,
        color: "text-green-500",
        bg: "bg-green-100 dark:bg-green-900/30",
        animate: false,
        label: "Delivered",
      };
    case "cancelled":
      return {
        icon: XCircle,
        color: "text-red-500",
        bg: "bg-red-100 dark:bg-red-900/30",
        animate: false,
        label: "Cancelled",
      };
    default:
      return {
        icon: Clock,
        color: "text-gray-500",
        bg: "bg-gray-100 dark:bg-gray-800",
        animate: false,
        label: status,
      };
  }
};

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  // Handle potential array or string from params
  const idParam = params?.id;
  const orderId = Array.isArray(idParam) ? idParam[0] : idParam;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trackingData, setTrackingData] = useState<TrackingDetails | null>(
    null
  );
  // State for route polyline
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "",
    libraries: ["places"],
  });

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        const data = await CartService.getOrderById(Number(orderId));
        setOrder(data);
      } catch (error) {
        console.error("Failed to load order", error);
        toast.error("Failed to load order details");
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  // Polling Effect for Live Tracking
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (order?.status === "shipped") {
      const fetchLocation = async () => {
        try {
          const response: any = await CartService.trackOrder(order.id);
          // Adjust based on actual API response structure
          if (response) {
             setTrackingData(response);
          }
        } catch (e) {
          console.error("Tracking Error:", e);
        }
      }
      fetchLocation();
      interval = setInterval(fetchLocation, 10000); // Poll every 10s
    }
    return () => clearInterval(interval);
  }, [order?.status, order?.id]);

  // Calculate route from rider to delivery address
  const calculateRoute = useCallback(async () => {
    if (!isLoaded || !window.google) return;
    if (!trackingData?.deliveryBoy?.currentLat || !trackingData?.deliveryBoy?.currentLng) return;
    if (!order?.address) return;

    const destinationAddress = `${order.address.line1}, ${order.address.city}, ${order.address.state} ${order.address.pinCode}`;
    const directionsService = new window.google.maps.DirectionsService();

    try {
      const results = await directionsService.route({
        origin: {
          lat: trackingData.deliveryBoy.currentLat,
          lng: trackingData.deliveryBoy.currentLng,
        },
        destination: destinationAddress,
        travelMode: google.maps.TravelMode.DRIVING,
      });
      setDirectionsResponse(results);
    } catch (error) {
      // Route calculation failed, map will still show rider location
    }
  }, [isLoaded, trackingData, order?.address]);

  // Recalculate route when tracking data updates
  useEffect(() => {
    calculateRoute();
  }, [calculateRoute]);

  const handleCopyOrderId = () => {
    if (!order) return;
    navigator.clipboard.writeText(String(order.id));
    toast.success("Order ID copied!");
  };

  const handleReorder = async () => {
    // Reorder logic placeholder
    toast.success("Re-order feature coming soon!");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="animate-spin text-yellow-500" size={32} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="w-full max-w-5xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
        <header className="px-4 md:px-6 py-4 flex items-center space-x-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
          <button onClick={() => router.back()}>
            <ArrowLeft className="w-6 h-6 text-gray-800 dark:text-white" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Order Not Found
          </h1>
        </header>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
          <Package className="w-16 h-16 text-gray-300 dark:text-gray-700 mb-4" />
          <p className="text-gray-500">We couldn't find the order details.</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 text-yellow-600 font-bold"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);

  return (
    <div className="w-full max-w-5xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen pb-20">
      <Toaster position="bottom-center" />

      {/* Header */}
      <header className="px-4 md:px-6 py-4 flex items-center space-x-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
        <button onClick={() => router.back()} aria-label="Go back">
          <ArrowLeft className="w-6 h-6 text-gray-800 dark:text-white" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Order Details
        </h1>
      </header>

      <main className="grow overflow-y-auto p-4 md:p-6 space-y-6 max-w-lg mx-auto">
        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-full ${statusInfo.bg} flex items-center justify-center shrink-0`}
            >
              <statusInfo.icon
                className={`w-7 h-7 ${statusInfo.color} ${
                  statusInfo.animate ? "animate-spin" : ""
                }`}
              />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${statusInfo.color} capitalize`}>
                {statusInfo.label}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Clock size={12} />{" "}
                {new Date(order.createdAt).toLocaleDateString()} at{" "}
                {new Date(order.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t dark:border-gray-700">
            <h3 className="font-bold text-gray-800 dark:text-white">
              Order #{order.id}
            </h3>
            <div className="flex items-center justify-between mt-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Items: {order.totalProducts}
              </p>
              <button
                onClick={handleCopyOrderId}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1 text-xs"
              >
                <Copy className="w-3 h-3" /> Copy ID
              </button>
            </div>
          </div>
        </motion.div>

        {/* --- LIVE TRACKING MAP --- */}
        {isLoaded &&
          trackingData?.deliveryBoy?.currentLat &&
          trackingData?.deliveryBoy?.currentLng && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-100 dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden h-72 relative z-0"
            >
              <GoogleMap
                mapContainerStyle={{ width: "100%", height: "100%" }}
                center={{
                  lat: trackingData.deliveryBoy.currentLat,
                  lng: trackingData.deliveryBoy.currentLng,
                }}
                zoom={14}
                options={{ 
                  disableDefaultUI: true,
                  styles: [
                    { featureType: "poi", stylers: [{ visibility: "off" }] },
                    { featureType: "transit", stylers: [{ visibility: "off" }] },
                  ]
                }}
              >
                {/* Rider Marker */}
                <Marker
                  position={{
                    lat: trackingData.deliveryBoy.currentLat,
                    lng: trackingData.deliveryBoy.currentLng,
                  }}
                  icon={{
                    url: "https://cdn-icons-png.flaticon.com/512/3755/3755376.png",
                    scaledSize: new window.google.maps.Size(45, 45),
                    anchor: new window.google.maps.Point(22, 22),
                  }}
                />
                
                {/* Route Polyline */}
                {directionsResponse && (
                  <DirectionsRenderer
                    options={{
                      directions: directionsResponse,
                      suppressMarkers: true, // We use custom markers
                      polylineOptions: {
                        strokeColor: "#22c55e", // Green-500
                        strokeWeight: 5,
                        strokeOpacity: 0.8,
                      },
                    }}
                  />
                )}
              </GoogleMap>
              
              {/* Live Tracker Badge */}
              <div className="absolute top-3 left-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-bold shadow-md text-gray-800 dark:text-white flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Live Tracker
              </div>
              
              {/* ETA Badge */}
              {directionsResponse?.routes[0]?.legs[0] && (
                <div className="absolute bottom-3 left-3 right-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold">Estimated Arrival</p>
                      <p className="text-sm font-bold text-gray-800 dark:text-white">
                        {directionsResponse.routes[0].legs[0].duration?.text}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold">Distance</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-white">
                      {directionsResponse.routes[0].legs[0].distance?.text}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

        {/* Items List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 border border-gray-100 dark:border-gray-700"
        >
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Items
          </h2>
          <ul className="space-y-3">
            {order.orderItems.map((item, index) => (
              <li
                key={index}
                className="flex justify-between items-center text-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 dark:bg-gray-700 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-gray-500">
                    x{item.quantity}
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {item.productDetails?.name ||
                      `Product #${item.shopProductId}`}
                  </span>
                </div>
                <span className="font-bold text-gray-800 dark:text-white">
                  ₹{((item.productDetails?.price || 0) * item.quantity).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 pt-4 border-t dark:border-gray-700 flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              Total
            </span>
            <span className="text-xl font-bold text-green-600 dark:text-green-400">
              ₹{order.totalAmount}
            </span>
          </div>
        </motion.div>

        {/* Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 border border-gray-100 dark:border-gray-700 space-y-4"
        >
          <div>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
              Payment
            </h2>
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                {order.paymentMethod.replace("_", " ")}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t dark:border-gray-700">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
              Delivery Address
            </h2>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {/* Assuming address details fetched via different call or context if not in Order object */}
                Address ID: {order.addressId}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
          className="space-y-3 pt-2"
        >
          {order.status === "delivered" && (
            <button
              onClick={handleReorder}
              className="w-full flex items-center justify-center gap-2 py-3.5 font-bold bg-yellow-400 text-black rounded-xl hover:bg-yellow-500 transition-colors shadow-sm active:scale-95"
            >
              <RefreshCw className="w-4 h-4" /> Re-order
            </button>
          )}
          <a
            href="/support"
            className="w-full flex items-center justify-center gap-2 py-3.5 font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <HelpCircle className="w-4 h-4" /> Need Help?
          </a>
        </motion.div>
      </main>
    </div>
  );
}