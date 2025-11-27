"use client";

import React, { useEffect } from 'react';
import { useDeliveryStore } from '@/hooks/useDeliveryStore';
import { MapPin, Package, Navigation, Play, Power } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DeliveryHomePage() {
    const router = useRouter();
    const { 
        orders, 
        activeOrder, 
        isSessionActive, 
        fetchOrders, 
        startSession, 
        isLoading,
        isOnline,      // Use online state
        toggleOnline   // Use toggle action
    } = useDeliveryStore();

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleStart = () => {
        startSession();
        router.push('/delivery/map');
    };

    const handleResume = () => {
        router.push('/delivery/map');
    };

    // Offline View
    if (!isOnline) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6">
                <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center border-4 border-gray-700">
                    <Power size={40} className="text-gray-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">You are Offline</h1>
                    <p className="text-gray-400 mt-2">Go online to start receiving delivery requests and manage your orders.</p>
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
        <div className="p-4 md:p-8 space-y-6 max-w-3xl mx-auto pb-24">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        Duty On <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
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
                                <h2 className="text-white font-bold text-lg">Current Delivery</h2>
                                <p className="text-green-100 text-sm">Order #{activeOrder.id}</p>
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
                                {activeOrder.deliveryAddress}
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
                                    <div key={order.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-gray-200 font-medium text-sm truncate">{order.deliveryAddress}</p>
                                            <p className="text-gray-500 text-xs mt-0.5">#{order.id} • ₹{order.totalAmount}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="text-yellow-500 text-xs font-bold">~2.5 km</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Start Button */}
                            <div className="fixed bottom-20 left-4 right-4 md:static md:mt-6">
                                <button 
                                    onClick={handleStart}
                                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-4 rounded-2xl shadow-xl shadow-yellow-500/20 flex items-center justify-center gap-2 text-lg transition-transform active:scale-95"
                                >
                                    <Play size={22} fill="currentColor" /> Start Delivery Run
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12 bg-gray-800/50 rounded-2xl border border-gray-800 border-dashed">
                            <p className="text-gray-500 text-sm">No orders assigned yet.</p>
                            <p className="text-gray-600 text-xs mt-1">Wait for shopkeeper to assign.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}