"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Plus, CheckCircle, CreditCard, Loader2, Truck, Crosshair } from "lucide-react";
import { motion } from "framer-motion";
import { useCartStore } from "@/hooks/useCartStore";
import { UserService, Address } from "@/services/userService";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, cartTotal, placeOrder, isLoading: isOrderLoading } = useCartStore();
  
  // State
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [isAddressLoading, setIsAddressLoading] = useState(true);
  const [showAddAddress, setShowAddAddress] = useState(false);
  
  // Location State
  const [isLocating, setIsLocating] = useState(false);
  
  // Form State for New Address
  const [newAddress, setNewAddress] = useState({
    name: "",
    phone: "",
    line1: "",
    street: "",
    city: "",
    state: "",
    country: "India",
    pinCode: ""
  });

  // Fetch Addresses on Mount
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const data = await UserService.getAddresses();
        // Handle case where API might return null or undefined
        const addrList = Array.isArray(data) ? data : [];
        setAddresses(addrList);
        
        // Select first address by default
        if (addrList.length > 0) {
          setSelectedAddressId(addrList[0].id);
        }
      } catch (error) {
        console.warn("Failed to fetch addresses (using empty list)", error);
      } finally {
        setIsAddressLoading(false);
      }
    };
    fetchAddresses();
  }, []);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
            // Use OpenStreetMap Nominatim API for free reverse geocoding
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            const addr = data.address;

            // Map OpenStreetMap fields to our form fields
            setNewAddress(prev => ({
                ...prev,
                line1: addr.house_number || addr.building || "", 
                street: addr.road || addr.suburb || addr.neighbourhood || "",
                city: addr.city || addr.town || addr.village || addr.county || "",
                state: addr.state || "",
                country: "India", // Force India or use addr.country
                pinCode: addr.postcode || ""
            }));
        } catch (error) {
            console.error("Failed to get address details", error);
            alert("Could not fetch address details. Please fill manually.");
        } finally {
            setIsLocating(false);
        }
    }, (error) => {
        console.error("Geolocation error", error);
        setIsLocating(false);
        alert("Unable to retrieve your location. Please enable location services.");
    });
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const added = await UserService.addAddress(newAddress);
      setAddresses([...addresses, added]);
      setSelectedAddressId(added.id);
      setShowAddAddress(false);
      // Reset form
      setNewAddress({ name: "", phone: "", line1: "", street: "", city: "", state: "", country: "India", pinCode: "" });
    } catch (error) {
      console.error("Failed to add address", error);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      alert("Please select a delivery address.");
      return;
    }

    try {
      const order = await placeOrder({
        addressId: selectedAddressId,
        paymentMethod: "cash_on_delivery"
      });
      
      const orderId = order?.id || order?.data?.id; 
      if (orderId) {
          router.push(`/orders/track-order?id=${orderId}`);
      } else {
          router.push('/');
          alert("Order placed successfully!");
      }
    } catch (error) {
      alert("Failed to place order. Please try again.");
    }
  };

  if (items.length === 0 && !isOrderLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Your cart is empty</h2>
        <button onClick={() => router.push('/')} className="text-yellow-600 font-semibold">
          Go Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => router.back()} 
            className="p-2 -ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-800 dark:text-white" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Checkout</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* --- LEFT COLUMN: Address & Payment --- */}
          <div className="flex-1 space-y-6">
            
            {/* 1. Delivery Address Section */}
            <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <MapPin className="text-yellow-500" size={20} />
                  Delivery Address
                </h2>
                {!showAddAddress && (
                    <button 
                        onClick={() => setShowAddAddress(true)}
                        className="text-sm font-semibold text-yellow-600 hover:text-yellow-700 flex items-center gap-1"
                    >
                        <Plus size={16} /> Add New
                    </button>
                )}
              </div>

              {/* Address List */}
              {!showAddAddress ? (
                <div className="space-y-3">
                  {isAddressLoading ? (
                    <div className="flex justify-center py-4"><Loader2 className="animate-spin text-gray-400" /></div>
                  ) : addresses.length > 0 ? (
                    addresses.map((addr) => (
                      <div 
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                          selectedAddressId === addr.id 
                            ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-500/10" 
                            : "border-gray-100 dark:border-gray-700 hover:border-gray-300"
                        }`}
                      >
                        <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedAddressId === addr.id ? "border-yellow-500" : "border-gray-300"
                        }`}>
                            {selectedAddressId === addr.id && <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full" />}
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 dark:text-white">{addr.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{addr.line1}, {addr.street}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{addr.city}, {addr.pinCode}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Phone: {addr.phone}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                        No addresses found. Please add one.
                    </div>
                  )}
                </div>
              ) : (
                /* Add Address Form */
                <form onSubmit={handleAddAddress} className="space-y-4 animate-in fade-in slide-in-from-top-4">
                    
                    {/* Use Current Location Button */}
                    <button 
                        type="button" 
                        onClick={handleUseCurrentLocation}
                        disabled={isLocating}
                        className="w-full py-3 rounded-xl border-2 border-dashed border-yellow-500/50 text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-500/10 font-semibold flex items-center justify-center gap-2 hover:bg-yellow-100 dark:hover:bg-yellow-500/20 transition-colors"
                    >
                        {isLocating ? <Loader2 className="animate-spin" size={18} /> : <Crosshair size={18} />}
                        Use My Current Location
                    </button>

                    <div className="grid grid-cols-2 gap-4">
                        <input required placeholder="Full Name" className="input-field" value={newAddress.name} onChange={e => setNewAddress({...newAddress, name: e.target.value})} />
                        <input required placeholder="Phone Number" className="input-field" value={newAddress.phone} onChange={e => setNewAddress({...newAddress, phone: e.target.value})} />
                    </div>
                    <input required placeholder="Address Line 1 (Flat/House No)" className="input-field" value={newAddress.line1} onChange={e => setNewAddress({...newAddress, line1: e.target.value})} />
                    <input required placeholder="Street / Area" className="input-field" value={newAddress.street} onChange={e => setNewAddress({...newAddress, street: e.target.value})} />
                    <div className="grid grid-cols-2 gap-4">
                        <input required placeholder="City" className="input-field" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} />
                        <input required placeholder="Pincode" className="input-field" value={newAddress.pinCode} onChange={e => setNewAddress({...newAddress, pinCode: e.target.value})} />
                    </div>
                    <div className="flex gap-3 mt-2">
                        <button type="button" onClick={() => setShowAddAddress(false)} className="flex-1 py-3 rounded-xl font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">Cancel</button>
                        <button type="submit" className="flex-1 py-3 rounded-xl font-semibold bg-yellow-500 text-white">Save Address</button>
                    </div>
                </form>
              )}
            </section>

            {/* 2. Payment Method Section */}
            <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
               <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                  <CreditCard className="text-yellow-500" size={20} />
                  Payment Method
                </h2>
                <div className="space-y-3">
                    <div className="p-4 rounded-xl border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-500/10 flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-3">
                            <Truck className="text-yellow-600 dark:text-yellow-400" />
                            <span className="font-bold text-gray-900 dark:text-white">Cash on Delivery</span>
                        </div>
                        <CheckCircle className="text-yellow-500 fill-current" />
                    </div>
                    <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed flex items-center justify-between">
                        <span className="font-medium text-gray-500">Online Payment (Coming Soon)</span>
                    </div>
                </div>
            </section>
          </div>

          {/* --- RIGHT COLUMN: Summary --- */}
          <div className="lg:w-96">
             <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Order Summary</h2>
                <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>Items ({items.length})</span>
                        <span>₹{cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>Delivery</span>
                        <span className="text-green-500 font-medium">Free</span>
                    </div>
                    <div className="h-px bg-gray-100 dark:bg-gray-700 my-4" />
                    <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white">
                        <span>Total</span>
                        <span>₹{cartTotal.toFixed(2)}</span>
                    </div>
                </div>

                <button 
                    onClick={handlePlaceOrder}
                    disabled={isOrderLoading || !selectedAddressId}
                    className="w-full bg-yellow-500 text-white font-bold py-4 rounded-xl hover:bg-yellow-600 transition-colors shadow-lg shadow-yellow-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isOrderLoading ? <Loader2 className="animate-spin" /> : "Place Order"}
                </button>
             </div>
          </div>

        </div>
      </div>

      {/* Tailwind Custom Styles for Inputs */}
      <style jsx>{`
        .input-field {
            width: 100%;
            padding: 0.75rem 1rem;
            border-radius: 0.75rem;
            background-color: var(--bg-color, #F9FAFB);
            border: 1px solid #E5E7EB;
            outline: none;
            transition: border-color 0.2s;
        }
        .input-field:focus {
            border-color: #EAB308;
            ring: 2px solid #EAB308;
        }
        :global(.dark) .input-field {
            background-color: #374151;
            border-color: #4B5563;
            color: white;
        }
      `}</style>
    </div>
  );
}