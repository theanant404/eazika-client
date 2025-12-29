"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useDeliveryStore } from "@/hooks/useDeliveryStore";
import {
  GoogleMap,
  useJsApiLoader,
  DirectionsRenderer,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import {
  ArrowLeft,
  Navigation,
  Phone,
  CheckCircle,
  MapPin,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DeliveryService } from "@/services/deliveryService";
import socket from "@/lib/socketClient";

// --- 1. DARK MODE MAP STYLE (Blinkit/Uber Style) ---
const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
];

const containerStyle = {
  width: "100%",
  height: "100vh",
};

const defaultCenter = {
  lat: 21.1458, // Nagpur
  lng: 79.0882,
};

const parseGeo = (geo?: string | null): { lat: number; lng: number } | null => {
  if (!geo || typeof geo !== "string") return null;
  const parts = geo.split(",");
  if (parts.length !== 2) return null;
  const lat = parseFloat(parts[0].trim());
  const lng = parseFloat(parts[1].trim());
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
};

const STOP_DISTANCE_METERS = 30;

const distanceMeters = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371000; // meters
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const aHarv = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(aHarv), Math.sqrt(1 - aHarv));
  return R * c;
};

export default function DeliveryMapPage() {
  const router = useRouter();
  const { queue, activeOrder, completeCurrentOrder, isSessionActive } =
    useDeliveryStore();

  // console.log(activeOrder);
  const [currentLocation, setCurrentLocation] =
    useState<google.maps.LatLngLiteral | null>(null);
  const [directionsResponse, setDirectionsResponse] =
    useState<google.maps.DirectionsResult | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [hoveredMarker, setHoveredMarker] = useState<"rider" | "destination" | null>(null);

  const stopSharingRef = useRef(false);

  // Use a Ref to control the map programmatically (for Auto-Zoom)
  const mapRef = useRef<google.maps.Map | null>(null);

  // UI States
  const [isArrived, setIsArrived] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const destinationLocation = useMemo(() => {
    return parseGeo((activeOrder as any)?.address?.geoLocation) || null;
  }, [activeOrder]);

  const firstQueueGeo = useMemo(() => {
    return parseGeo((queue?.[0] as any)?.address?.geoLocation) || null;
  }, [queue]);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "",
    libraries: ["places"],
  });

  useEffect(() => {
    stopSharingRef.current = false;
  }, [activeOrder]);

  // Redirect if no active session
  useEffect(() => {
    if (!isSessionActive || !activeOrder) {
      // Optional: Comment this out during testing if you want to stay on the page
      // toast.info("No active session.");
      // router.push('/delivery');
    }
  }, [isSessionActive, activeOrder, router]);



  // Track Location & Sync to Backend
  useEffect(() => {
    let watchId: number;
    let intervalId: NodeJS.Timeout;

    if (navigator.geolocation) {
      // 1. Watch Position for UI updates
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => console.warn("Location permission denied"),
        { enableHighAccuracy: true }
      );

      // 2. Sync to Backend every 10 seconds
      intervalId = setInterval(() => {
        navigator.geolocation.getCurrentPosition((pos) => {
          DeliveryService.updateLocation(pos.coords.latitude, pos.coords.longitude)
            .catch((err: any) => console.error("Location sync failed", err));
        });
      }, 10000);

      return () => {
        navigator.geolocation.clearWatch(watchId);
        clearInterval(intervalId);
      };
    }
  }, []);

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported on this device");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const location = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setCurrentLocation(location);
        if (mapRef.current) {
          mapRef.current.panTo(location);
          mapRef.current.setZoom(15);
        }
        toast.success("Location locked");
        setIsLocating(false);
      },
      (err) => {
        console.error("Locate error", err);
        toast.error("Unable to get location. Please allow location access.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Get initial fix if missing
  useEffect(() => {
    if (currentLocation) return;

    // Defer to next tick to avoid synchronous state updates inside the effect
    const timeoutId = window.setTimeout(() => {
      handleLocate();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [currentLocation, handleLocate]);

  // --- 2. AUTO-ZOOM LOGIC (The "Smart" Camera) ---
  useEffect(() => {
    if (mapRef.current && currentLocation && directionsResponse) {
      const bounds = new window.google.maps.LatLngBounds();

      // Add Driver
      bounds.extend(currentLocation);

      // Add Destination (End of route)
      const route = directionsResponse.routes[0];
      if (route && route.legs.length > 0) {
        const lastLeg = route.legs[route.legs.length - 1];
        if (lastLeg.end_location) {
          bounds.extend(lastLeg.end_location);
        }
      }

      // Fit the map to these bounds (with some padding)
      mapRef.current.fitBounds(bounds, {
        top: 100,
        bottom: 300,
        left: 50,
        right: 50,
      });
    }
  }, [currentLocation, directionsResponse]);

  // Join order room for sockets and stream rider location periodically
  useEffect(() => {
    const orderId = (activeOrder as any)?.id || (activeOrder as any)?._id || (activeOrder as any)?.orderId;
    // console.info("rider-socket:init", {
    //   orderId,
    //   connected: socket.connected,
    // });
    const handleConnect = () => console.info("rider-socket:connected", { orderId, socketId: socket.id });
    const handleDisconnect = () => console.warn("rider-socket:disconnected", { orderId });
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    if (!orderId) return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };

    socket.emit("join-order", orderId);

    return () => {
      socket.emit("leave-order", orderId);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [activeOrder]);

  useEffect(() => {
    const orderId = (activeOrder as any)?.id || (activeOrder as any)?._id || (activeOrder as any)?.orderId;
    if (!orderId || !currentLocation) return;
    let intervalId: number | undefined;

    const send = () => {
      if (stopSharingRef.current) return;

      if (destinationLocation) {
        const distance = distanceMeters(currentLocation, destinationLocation);
        if (distance <= STOP_DISTANCE_METERS) {
          // console.info("rider-socket:stop-sharing:arrived", {
          //   orderId,
          //   distance,
          // });
          stopSharingRef.current = true;
          if (intervalId) window.clearInterval(intervalId);
          return;
        }
      }

      // console.info("rider-socket:emit-location", {
      //   orderId,
      //   lat: currentLocation.lat,
      //   lng: currentLocation.lng,
      // });
      socket.emit("rider-location", {
        orderId,
        location: { lat: currentLocation.lat, lng: currentLocation.lng },
      });
    };

    send();
    intervalId = window.setInterval(send, 5000);
    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [activeOrder, currentLocation, destinationLocation]);

  const calculateRoute = useCallback(async () => {
    if (!currentLocation || !window.google) return;

    const directionsService = new window.google.maps.DirectionsService();

    // Prefer shortest path using explicit destination coordinates when available
    if (destinationLocation) {
      try {
        const results = await directionsService.route({
          origin: currentLocation,
          destination: destinationLocation,
          travelMode: google.maps.TravelMode.DRIVING,
        });
        setDirectionsResponse(results);
      } catch (error) {
        console.error("Route Error:", error);
      }
      return;
    }

    if (queue.length === 0) return;

    let destinationAddress = "";
    let waypoints: google.maps.DirectionsWaypoint[] = [];

    if (queue.length === 1) {
      destinationAddress = queue[0].deliveryAddress || "";
    } else {
      // Optimize: Last order is destination, others are waypoints
      const lastOrder = queue[queue.length - 1];
      destinationAddress = lastOrder.deliveryAddress || "";
      const intermediateOrders = queue.slice(0, queue.length - 1);
      waypoints = intermediateOrders.map((order) => ({
        location: order.deliveryAddress,
        stopover: true,
      }));
    }

    try {
      const results = await directionsService.route({
        origin: currentLocation,
        destination: destinationAddress,
        waypoints,
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING,
      });
      setDirectionsResponse(results);
    } catch (error) {
      console.error("Route Error:", error);
    }
  }, [currentLocation, destinationLocation, queue]);

  useEffect(() => {
    if (!isLoaded || !currentLocation) return;
    if (!destinationLocation && queue.length === 0) return;

    // Defer route calculation to avoid synchronous state updates inside the effect body
    const timeoutId = window.setTimeout(() => {
      void calculateRoute();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isLoaded, currentLocation, destinationLocation, queue, calculateRoute]);

  const handleOpenMapsApp = () => {
    const destination = destinationLocation
      ? `${destinationLocation.lat},${destinationLocation.lng}`
      : firstQueueGeo
        ? `${firstQueueGeo.lat},${firstQueueGeo.lng}`
        : activeOrder?.deliveryAddress || queue[0]?.deliveryAddress || "";

    if (!destination) {
      toast.error("No destination available for navigation");
      return;
    }

    const origin = currentLocation
      ? `${currentLocation.lat},${currentLocation.lng}`
      : undefined;

    const url = new URL("https://www.google.com/maps/dir/");
    url.searchParams.set("api", "1");
    url.searchParams.set("destination", destination);
    if (origin) url.searchParams.set("origin", origin);

    window.open(url.toString(), "_blank");
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 3) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleCompleteOrder = async () => {
    const code = otp.join("");
    if (code.length !== 4) {
      toast.error("Enter valid 4-digit OTP");
      return;
    }
    setIsSubmitting(true);
    const success = await completeCurrentOrder(code);
    setIsSubmitting(false);

    if (success) {
      toast.success("Delivery Completed!");
      setOtp(["", "", "", ""]);
      setIsArrived(false);
      router.push("/rider");
    } else {
      toast.error("Invalid OTP");
    }
  };

  if (!isLoaded || !activeOrder)
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center text-green-500 font-bold animate-pulse">
        Locating Satellites...
      </div>
    );

  return (
    <div className="h-full w-full relative bg-gray-900">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={currentLocation || destinationLocation || defaultCenter}
        zoom={15}
        onLoad={(map) => {
          mapRef.current = map;
        }} // Capture map instance
        options={{
          disableDefaultUI: true,
          styles: darkMapStyle, // Apply Dark Mode
        }}
      >
        {/* --- 3. CUSTOM MARKERS --- */}

        {/* RIDER MARKER (Bike Icon) */}
        {currentLocation && (
          <Marker
            position={currentLocation}
            icon={{
              url: "https://cdn-icons-png.flaticon.com/512/3755/3755376.png", // 3D Delivery Bike Icon
              scaledSize: new window.google.maps.Size(50, 50),
              anchor: new window.google.maps.Point(25, 25),
            }}
            onMouseOver={() => setHoveredMarker("rider")}
            onMouseOut={() => setHoveredMarker((prev) => (prev === "rider" ? null : prev))}
          />
        )}

        {hoveredMarker === "rider" && currentLocation && (
          <InfoWindow position={currentLocation} options={{ pixelOffset: new window.google.maps.Size(0, -40) }}>
            <div className="text-xs font-semibold text-gray-800">
              Rider (You)
            </div>
          </InfoWindow>
        )}

        {/* DESTINATION MARKER (Customer) */}
        {destinationLocation && (
          <Marker
            position={destinationLocation}
            icon={{
              url: "https://cdn-icons-png.flaticon.com/512/535/535137.png", // pin icon
              scaledSize: new window.google.maps.Size(44, 44),
              anchor: new window.google.maps.Point(22, 44),
            }}
            onMouseOver={() => setHoveredMarker("destination")}
            onMouseOut={() => setHoveredMarker((prev) => (prev === "destination" ? null : prev))}
          />
        )}

        {hoveredMarker === "destination" && destinationLocation && (
          <InfoWindow position={destinationLocation} options={{ pixelOffset: new window.google.maps.Size(0, -40) }}>
            <div className="text-xs font-semibold text-gray-800">
              Delivery Destination
            </div>
          </InfoWindow>
        )}

        {/* CUSTOMER MARKER (House/Pin) - We infer this from the route end location if available, or rely on DirectionsRenderer default */}
        {/* Note: DirectionsRenderer puts generic markers A, B, C. 
            To hide them and put custom ones, set suppressMarkers: true in options below, 
            then manually map over 'queue' to place <Marker /> components. 
        */}

        {directionsResponse && (
          <DirectionsRenderer
            options={{
              directions: directionsResponse,
              suppressMarkers: false, // Keep default letter markers for multi-stop logic
              polylineOptions: {
                strokeColor: "#22c55e", // Blinkit Green
                strokeWeight: 6,
                strokeOpacity: 0.8,
              },
            }}
          />
        )}
      </GoogleMap>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-safe-top z-10 pointer-events-none">
        <div className="flex justify-between items-start pointer-events-auto">
          <button
            onClick={() => router.back()}
            className="bg-gray-900/90 backdrop-blur-md p-3 rounded-full text-white shadow-lg border border-gray-700"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLocate}
              className="bg-gray-900/90 backdrop-blur-md p-3 rounded-full text-white shadow-lg border border-gray-700 active:scale-95 transition-transform"
              aria-label="Locate me"
            >
              {isLocating ? (
                <span className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full inline-block animate-spin" />
              ) : (
                <Navigation size={18} className="text-green-400" />
              )}
            </button>
            <div className="bg-gray-900/90 backdrop-blur-md px-4 py-2 rounded-full text-white font-bold text-sm shadow-lg flex items-center gap-2 border border-gray-700">
              <Navigation size={14} className="text-green-500" />
              {queue.length} Stops
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Panel */}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-900 rounded-t-3xl p-6 z-20 border-t border-gray-800 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="w-12 h-1.5 bg-gray-700 rounded-full mx-auto mb-6" />

        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-green-500 text-gray-900 text-[10px] font-extrabold px-2 py-0.5 rounded-sm tracking-wider">
                LIVE ORDER
              </span>
            </div>
            <h2 className="text-white font-bold text-2xl">
              {activeOrder.customerName || "Customer"}
            </h2>
            <div className="flex items-center gap-1 mt-1 text-gray-400">
              <MapPin size={14} />
              <p className="text-sm truncate max-w-[250px]">
                {activeOrder.deliveryAddress}
              </p>
            </div>
          </div>
          <button className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center text-green-500 border border-gray-700 shadow-lg active:scale-95 transition-transform">
            <Phone size={24} />
          </button>
        </div>

        {!isArrived ? (
          <div className="grid grid-cols-5 gap-3">
            <button
              onClick={handleOpenMapsApp}
              disabled={
                !destinationLocation &&
                !firstQueueGeo &&
                !activeOrder?.deliveryAddress &&
                !queue[0]?.deliveryAddress
              }
              className="col-span-1 bg-gray-800 border border-gray-700 text-white font-bold rounded-xl flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Open navigation in Google Maps"
            >
              <Navigation size={22} className="text-blue-400" />
            </button>
            <button
              onClick={() => setIsArrived(true)}
              className="col-span-4 bg-green-500 text-gray-900 font-bold py-4 rounded-xl shadow-lg shadow-green-500/20 active:scale-95 transition-transform text-lg"
            >
              Slide to Arrive &nbsp; &rarr;
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="text-center">
              <p className="text-gray-400 text-sm font-medium mb-4 uppercase tracking-widest">
                Enter Delivery OTP
              </p>
              <div className="flex justify-center gap-4">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="tel"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    className="w-14 h-16 bg-gray-800 border-2 border-gray-700 rounded-2xl text-center text-3xl font-bold text-white focus:border-green-500 focus:outline-none focus:ring-4 focus:ring-green-500/20 transition-all shadow-inner"
                  />
                ))}
              </div>
            </div>
            <button
              onClick={handleCompleteOrder}
              disabled={isSubmitting}
              className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-gray-900 font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-green-500/20 active:scale-95 transition-transform"
            >
              {isSubmitting ? (
                <span className="animate-spin">⌛</span>
              ) : (
                <CheckCircle size={22} />
              )}
              <span className="text-lg">Complete Delivery</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
