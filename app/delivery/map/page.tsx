"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useDeliveryStore } from "@/hooks/useDeliveryStore";
import {
  GoogleMap,
  useJsApiLoader,
  DirectionsRenderer,
  Marker
} from "@react-google-maps/api";
import { ArrowLeft, Navigation, MapPin, Phone, CheckCircle, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // Assuming you have sonner or use alert

const containerStyle = {
  width: "100%",
  height: "100vh",
};

const defaultCenter = {
  lat: 28.6139,
  lng: 77.2090, // New Delhi
};

export default function DeliveryMapPage() {
  const router = useRouter();
  const { queue, activeOrder, completeCurrentOrder, isSessionActive } = useDeliveryStore();

  const [currentLocation, setCurrentLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  
  // Interaction States
  const [isArrived, setIsArrived] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "", // Use Env Variable
    libraries: ["places"],
  });

  // 1. Redirect if no session
  useEffect(() => {
    if (!isSessionActive || !activeOrder) {
        toast.info("No active session. Redirecting to home.");
        router.push('/delivery');
    }
  }, [isSessionActive, activeOrder, router]);

  // 2. Get Location
  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => console.warn("Loc permit denied"),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // 3. Calculate Route
  const calculateRoute = useCallback(async () => {
    if (!currentLocation || !window.google || !activeOrder) return;

    const directionsService = new window.google.maps.DirectionsService();

    try {
      const results = await directionsService.route({
        origin: currentLocation,
        destination: activeOrder.deliveryAddress || "", // Ensure address exists
        travelMode: google.maps.TravelMode.DRIVING,
      });
      setDirectionsResponse(results);
    } catch (error) {
      console.error("Route Error:", error);
    }
  }, [currentLocation, activeOrder]);

  useEffect(() => {
    if (isLoaded && currentLocation && activeOrder) {
      calculateRoute();
    }
  }, [isLoaded, currentLocation, activeOrder, calculateRoute]);

  // 4. Handlers
  const handleOpenMapsApp = () => {
    if (!activeOrder) return;
    const query = encodeURIComponent(activeOrder.deliveryAddress || "");
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}`, '_blank');
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleCompleteOrder = async () => {
    const code = otp.join("");
    if (code.length !== 4) {
        toast.error("Please enter the 4-digit OTP");
        return;
    }

    setIsSubmitting(true);
    const success = await completeCurrentOrder(code);
    setIsSubmitting(false);

    if (success) {
        toast.success("Order Delivered Successfully!");
        setOtp(["", "", "", ""]);
        setIsArrived(false);
        // If queue empty, store handles 'isSessionActive: false' and we redirect in useEffect
    } else {
        toast.error("Invalid OTP. Try '1234'");
    }
  };

  if (!isLoaded || !activeOrder) return <div className="h-screen bg-gray-900 text-white flex items-center justify-center">Loading Mission Control...</div>;

  return (
    <div className="h-full w-full relative bg-gray-900">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={currentLocation || defaultCenter}
        zoom={15}
        options={{ disableDefaultUI: true, styles: [/* Add dark styles here if needed */] }}
      >
        {currentLocation && <Marker position={currentLocation} icon={{ url: "https://cdn-icons-png.flaticon.com/512/3082/3082383.png", scaledSize: new window.google.maps.Size(40, 40) }} />}
        {directionsResponse && (
          <DirectionsRenderer options={{ directions: directionsResponse, polylineOptions: { strokeColor: "#22c55e", strokeWeight: 6 } }} />
        )}
      </GoogleMap>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-safe-top z-10">
        <button onClick={() => router.back()} className="bg-gray-900/90 p-3 rounded-full text-white shadow-lg">
          <ArrowLeft size={20} />
        </button>
      </div>

      {/* Bottom Panel */}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-900 rounded-t-3xl p-6 z-20 border-t border-gray-800 shadow-2xl">
        <div className="w-12 h-1.5 bg-gray-700 rounded-full mx-auto mb-6" />

        {/* Header Info */}
        <div className="flex justify-between items-start mb-6">
            <div>
                <h2 className="text-white font-bold text-xl">{activeOrder.customerName || "Customer"}</h2>
                <p className="text-gray-400 text-sm mt-1 max-w-[200px] truncate">{activeOrder.deliveryAddress}</p>
            </div>
            <div className="flex gap-3">
                <button className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-green-500 hover:bg-gray-700">
                    <Phone size={20} />
                </button>
            </div>
        </div>

        {/* Order Items Summary (Optional) */}
        <div className="bg-gray-800/50 p-4 rounded-xl mb-6 flex items-center gap-3">
            <Package className="text-yellow-500" size={24} />
            <div>
                <p className="text-gray-200 text-sm font-medium">Order #{activeOrder.id}</p>
                <p className="text-gray-500 text-xs">{activeOrder.totalProducts || 1} items • ₹{activeOrder.totalAmount}</p>
            </div>
        </div>

        {/* Action Buttons */}
        {!isArrived ? (
            <div className="grid grid-cols-4 gap-3">
                 <button 
                    onClick={handleOpenMapsApp}
                    className="col-span-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-4 rounded-xl flex items-center justify-center"
                >
                    <Navigation size={20} />
                </button>
                <button 
                    onClick={() => setIsArrived(true)}
                    className="col-span-3 bg-green-500 hover:bg-green-600 text-gray-900 font-bold py-4 rounded-xl shadow-lg shadow-green-500/20"
                >
                    I've Arrived at Location
                </button>
            </div>
        ) : (
            <div className="space-y-4 animate-in slide-in-from-bottom-4">
                <div className="text-center mb-2">
                    <p className="text-white font-bold mb-4">Ask Customer for OTP</p>
                    <div className="flex justify-center gap-3">
                        {otp.map((digit, i) => (
                            <input
                                key={i}
                                id={`otp-${i}`}
                                type="number" // or tel
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleOtpChange(i, e.target.value)}
                                className="w-14 h-14 bg-gray-800 border-2 border-gray-700 rounded-xl text-center text-2xl font-bold text-white focus:border-green-500 focus:outline-none transition-colors"
                            />
                        ))}
                    </div>
                </div>
                <button 
                    onClick={handleCompleteOrder}
                    disabled={isSubmitting}
                    className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-gray-900 font-bold py-4 rounded-xl flex items-center justify-center gap-2"
                >
                    {isSubmitting ? <span className="animate-spin">⌛</span> : <CheckCircle size={20} />}
                    Verify & Complete Delivery
                </button>
                <button 
                    onClick={() => setIsArrived(false)}
                    className="w-full text-gray-500 text-xs font-medium py-2"
                >
                    Wait, I haven't arrived yet
                </button>
            </div>
        )}
      </div>
    </div>
  );
}