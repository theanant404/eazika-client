"use client";

import { useEffect, useState, useMemo } from "react";
import { useDeliveryStore } from "@/hooks/useDeliveryStore";
import { MapPin, Package, Navigation, Play, Power, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Parse geo location string "lat,lng" to {lat, lng}
const parseGeo = (geo?: string | null): { lat: number; lng: number } | null => {
  if (!geo || typeof geo !== 'string') return null;
  const parts = geo.split(',');
  if (parts.length !== 2) return null;
  const lat = parseFloat(parts[0].trim());
  const lng = parseFloat(parts[1].trim());
  if (isNaN(lat) || isNaN(lng)) return null;
  return { lat, lng };
};

// Haversine formula to calculate distance in km
const haversineKm = (
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
};

export default function DeliveryHomePage() {
  const router = useRouter();
  const {
    orders,
    activeOrder,
    isSessionActive,
    fetchOrders,
    startSession,
    isOnline, // Use online state
    toggleOnline, // Use toggle action
  } = useDeliveryStore();

  const [riderLocation, setRiderLocation] = useState<{ lat: number; lng: number } | null>(() => {
    // Initialize from localStorage on mount
    if (typeof window !== 'undefined') {
      const storedLocation = localStorage.getItem('riderLocation');
      if (storedLocation) {
        try {
          const parsed = JSON.parse(storedLocation);
          if (parsed.lat && parsed.lng) {
            return parsed;
          }
        } catch (error) {
          console.error('Failed to parse stored rider location', error);
        }
      }
    }
    return null;
  });
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);

  // Calculate distances using useMemo to avoid cascading renders
  const orderDistances = useMemo(() => {
    if (!riderLocation || orders.length === 0) return {};

    const distances: Record<number, number> = {};
    orders.forEach(order => {
      const orderGeo = parseGeo(order.address?.geoLocation);
      if (orderGeo) {
        distances[order.id] = Number(haversineKm(riderLocation, orderGeo).toFixed(2));
      }
    });
    return distances;
  }, [riderLocation, orders]);

  useEffect(() => {
    (async () => {
      if (!activeOrder) await fetchOrders();
    })();
  }, [activeOrder, fetchOrders]);

  const getRiderCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location = { lat: latitude, lng: longitude };
        setRiderLocation(location);
        localStorage.setItem('riderLocation', JSON.stringify(location));
        toast.success("Location captured successfully!");
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error("Unable to get your location. Please enable location access.");
        setIsLoadingLocation(false);
      }
    );
  };

  const handleStart = () => {
    if (!riderLocation) {
      toast.error("Please enable location access first by clicking 'Check Distance'");
      return;
    }
    setShowStartModal(true);
  };

  const handleResume = () => {
    router.push("/rider/map");
  };

  const confirmStart = () => {
    startSession();
    setShowStartModal(false);
    router.push("/rider/map");
  };
  // console.log(orders)
  // Offline View
  if (!isOnline) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6">
        <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center border-4 border-gray-700">
          <Power size={40} className="text-gray-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">You are Offline</h1>
          <p className="text-gray-400 mt-2">
            Go online to start receiving delivery requests and manage your
            orders.
          </p>
        </div>
        <button
          onClick={toggleOnline}
          className="bg-green-500 hover:bg-green-600 text-gray-900 font-bold py-3 px-8 rounded-xl shadow-lg shadow-green-500/20 transition-transform active:scale-95"
        >
          Go Online Now
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 md:p-8 space-y-6 max-w-3xl mx-auto pb-24">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              Duty On
              <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {isSessionActive
                ? "You are currently in a delivery run."
                : "Waiting for shop assignments..."}
            </p>
          </div>
        </div>

        {/* Active Session Card */}
        {isSessionActive && activeOrder && (
          <div className="bg-green-600 rounded-2xl p-6 shadow-lg shadow-green-900/20 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <div className="absolute right-0 top-0 p-4 opacity-10">
              <Navigation size={100} className="text-white" />
            </div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-white font-bold text-lg">
                    Current Delivery
                  </h2>
                  <p className="text-green-100 text-sm">
                    Order #{activeOrder.id} • {activeOrder.totalProducts} {activeOrder.totalProducts === 1 ? "item" : "items"}
                  </p>
                </div>
                <div className="bg-white/20 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm font-bold animate-pulse">
                  Live
                </div>
              </div>
              <div className="mb-6">
                <div className="flex items-center gap-2 text-green-50 text-sm mb-1">
                  <MapPin size={16} /> Drop Location:
                </div>
                <p className="text-white font-medium text-lg leading-snug">
                  {activeOrder.address?.line1 || activeOrder.address?.street || "Unknown Address"}
                </p>
                <p className="text-green-100 text-sm mt-2">
                  Total Amount: ₹{activeOrder.totalAmount}
                </p>
              </div>
              <button
                onClick={handleResume}
                className="w-full bg-white text-green-700 font-bold py-3.5 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                Resume Navigation <Navigation size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Pending Orders List */}
        {!isSessionActive && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold flex items-center gap-2">
                <Package className="text-yellow-500" size={20} />
                Assigned Orders ({orders.length})
              </h2>
            </div>

            {orders.length > 0 ? (
              <>
                <div className="space-y-3">
                  {orders.map((order, index) => (
                    <div
                      key={order.id}
                      className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex items-center gap-4"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <p className="text-gray-200 font-semibold text-sm truncate">
                          {order.address?.name || "Unnamed Location"}
                        </p>
                        <p className="text-gray-400 text-[11px] truncate">
                          Order #{order.id}
                        </p>
                        <p className="text-gray-300 text-xs truncate">
                          Deliver to: {order.address?.line1 || order.address?.street || "Unknown Address"}
                        </p>
                        {(order.address?.city || order.address?.pincode) && (
                          <p className="text-gray-400 text-[11px] truncate">
                            {order.address?.city}
                            {order.address?.city && order.address?.pincode ? ", " : ""}
                            {order.address?.pincode}
                          </p>
                        )}
                        {order.address?.phone && (
                          <p className="text-gray-500 text-[11px] truncate">
                            Contact: {order.address.phone}
                          </p>
                        )}
                        <p className="text-gray-300 text-xs truncate">
                          Items: {order.totalProducts} {order.totalProducts === 1 ? "item" : "items"}
                        </p>
                        <p className="text-gray-100 text-sm font-bold">
                          ₹{order.totalAmount}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {orderDistances[order.id] !== undefined ? (
                          <div className="text-yellow-500 text-sm font-bold">
                            {orderDistances[order.id]} km
                          </div>
                        ) : (
                          <button
                            onClick={getRiderCurrentLocation}
                            disabled={isLoadingLocation}
                            className="text-yellow-500 text-xs font-bold hover:text-yellow-400 transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            {isLoadingLocation ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              "Check Distance"
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Start Button */}
                <div className="fixed bottom-20 left-4 right-4 md:static md:mt-6">
                  <button
                    onClick={handleStart}
                    disabled={!riderLocation}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-4 rounded-2xl shadow-xl shadow-yellow-500/20 flex items-center justify-center gap-2 text-lg transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play size={22} fill="currentColor" /> Start Delivery Run
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-12 bg-gray-800/50 rounded-2xl border border-gray-800 border-dashed">
                <p className="text-gray-500 text-sm">No orders assigned yet.</p>
                <p className="text-gray-600 text-xs mt-1">
                  Wait for shopkeeper to assign.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {showStartModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white text-gray-900 w-full max-w-sm rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold">Start Delivery Run</h3>
            <p className="text-sm text-gray-600">Resume navigation to the rider map?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowStartModal(false)}
                className="w-1/2 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmStart}
                className="w-1/2 py-3 rounded-xl font-bold text-white bg-green-500 hover:bg-green-600 transition-colors"
              >
                Resume Navigation
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
