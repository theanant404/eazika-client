"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { GoogleMap, Marker, InfoWindow, useJsApiLoader, DirectionsRenderer } from "@react-google-maps/api";
import socket from "@/lib/socketClient";
export type LiveOrderTrackerProps = {
  orderId: string | number;
  customerLocation?: { lat: number; lng: number };
  onRiderLocation?: (loc: { lat: number; lng: number }) => void;
};

type LatLng = { lat: number; lng: number };

const containerStyle = { width: "100%", height: "100%" };
const defaultCenter: LatLng = { lat: 21.1458, lng: 79.0882 };

export default function LiveOrderTracker({ orderId, customerLocation, onRiderLocation }: LiveOrderTrackerProps) {
  const [riderLocation, setRiderLocation] = useState<LatLng | null>(null);
  const [hovered, setHovered] = useState<"rider" | "customer" | null>(null);
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);

  const normalizedOrderId = useMemo(() => (orderId ? String(orderId) : null), [orderId]);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-tracker",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "",
    libraries: ["places"],
  });

  useEffect(() => {
    const handleConnect = () => console.info("customer-socket:connected", { socketId: socket.id });
    const handleDisconnect = () => console.warn("customer-socket:disconnected");
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  const center = useMemo(() => {
    if (riderLocation) return riderLocation;
    if (customerLocation) return customerLocation;
    return defaultCenter;
  }, [riderLocation, customerLocation]);

  useEffect(() => {
    if (!normalizedOrderId) return;

    const fetchInitial = async () => {
      try {
        const res = await fetch(`/api/order-location?orderId=${normalizedOrderId}`, { cache: "no-store" });
        // console.info("customer-fetch:order-location", {
        //   status: res.status,
        //   ok: res.ok,
        //   redirected: res.redirected,
        // });
        if (res.status === 204) return; // waiting for first emit
        if (!res.ok) return;
        const data = await res.json();
        // console.info("customer-fetch:order-location:data", data);
        if (data?.location) {
          setRiderLocation(data.location);
          onRiderLocation?.(data.location);
        }
      } catch (e) {
        console.warn("Failed to fetch initial rider location", e);
        // ignore
      }
    };

    fetchInitial();

    // console.info("customer-socket:join-order", normalizedOrderId);
    socket.emit("join-order", normalizedOrderId);

    const handler = (payload: { orderId: string | number; location: LatLng }) => {
      // console.info("customer-socket:order-location:raw", payload);
      if (String(payload.orderId) === normalizedOrderId && payload.location) {
        setRiderLocation(payload.location);
        onRiderLocation?.(payload.location);
      }
    };

    socket.on("order-location", handler);

    return () => {
      socket.off("order-location", handler);
      socket.emit("leave-order", normalizedOrderId);
    };
  }, [normalizedOrderId, onRiderLocation]);

  useEffect(() => {
    if (!riderLocation) return;
    console.log("rider location", riderLocation)
    console.info("customer-socket:rider-location:state", riderLocation);
  }, [riderLocation]);

  useEffect(() => {
    if (!isLoaded || !riderLocation || !customerLocation || typeof window === "undefined") return;
    const service = new google.maps.DirectionsService();
    const run = async () => {
      try {
        const result = await service.route({
          origin: riderLocation,
          destination: customerLocation,
          travelMode: google.maps.TravelMode.DRIVING,
        });
        setDirectionsResponse(result);
      } catch (e) {
        // ignore routing errors
      }
    };
    run();
  }, [isLoaded, riderLocation, customerLocation]);

  if (!isLoaded) return null;

  return (
    <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={14} options={{ disableDefaultUI: true }}>
      {riderLocation && (
        <Marker
          position={riderLocation}
          icon={{
            url: "https://cdn-icons-png.flaticon.com/512/3755/3755376.png",
            scaledSize: new google.maps.Size(42, 42),
            anchor: new google.maps.Point(21, 21),
          }}
          onMouseOver={() => setHovered("rider")}
          onMouseOut={() => setHovered((p) => (p === "rider" ? null : p))}
        />
      )}

      {customerLocation && (
        <Marker
          position={customerLocation}
          icon={{
            url: "https://cdn-icons-png.flaticon.com/512/535/535137.png",
            scaledSize: new google.maps.Size(38, 38),
            anchor: new google.maps.Point(19, 38),
          }}
          onMouseOver={() => setHovered("customer")}
          onMouseOut={() => setHovered((p) => (p === "customer" ? null : p))}
        />
      )}

      {hovered === "rider" && riderLocation && (
        <InfoWindow position={riderLocation} options={{ pixelOffset: new google.maps.Size(0, -35) }}>
          <div className="text-xs font-semibold text-gray-800">Rider (Live)</div>
        </InfoWindow>
      )}

      {hovered === "customer" && customerLocation && (
        <InfoWindow position={customerLocation} options={{ pixelOffset: new google.maps.Size(0, -35) }}>
          <div className="text-xs font-semibold text-gray-800">Delivery Location</div>
        </InfoWindow>
      )}

      {directionsResponse && (
        <DirectionsRenderer
          options={{
            directions: directionsResponse,
            suppressMarkers: true,
            polylineOptions: { strokeColor: "#22c55e", strokeWeight: 5, strokeOpacity: 0.8 },
          }}
        />
      )}
    </GoogleMap>
  );
}
