"use client";

import React, { useState } from 'react';
import { useDeliveryStore } from '@/hooks/useDeliveryStore';
import { ArrowLeft, Phone, MapPin, Navigation, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function DeliveryMapPage() {
    const router = useRouter();
    const { activeOrder, queue, completeCurrentOrder } = useDeliveryStore();
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '']);
    
    // FIX: Handle "No Active Order" state with UI instead of redirecting during render
    if (!activeOrder) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-900 text-white p-6 text-center">
                <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6 border-4 border-gray-700">
                    <Navigation size={40} className="text-gray-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2">No Active Delivery</h2>
                <p className="text-gray-400 mb-8 max-w-xs">
                    You don't have an active delivery session running. Please start a run from the dashboard.
                </p>
                <button 
                    onClick={() => router.push('/delivery')}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-green-500/20 transition-transform active:scale-95"
                >
                    Go to Dashboard
                </button>
            </div>
        );
    }

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < 3) {
            document.getElementById(`otp-${index + 1}`)?.focus();
        }
    };

    const verifyOtp = async () => {
        const code = otp.join('');
        const success = await completeCurrentOrder(code);
        
        if (success) {
            setShowOtpModal(false);
            setOtp(['', '', '', '']);
            // If there are still items in queue (check store logic), it auto-updates activeOrder
            // If queue is empty, store sets activeOrder to null, we redirect
            if (useDeliveryStore.getState().activeOrder) {
                alert("Order Completed! Starting next delivery...");
            } else {
                alert("All deliveries completed! Good job.");
                router.push('/delivery');
            }
        } else {
            alert("Invalid OTP. Try 1234");
        }
    };

    return (
        <div className="h-full w-full relative bg-gray-900">
            {/* Map Background */}
            <div className="absolute inset-0 z-0 bg-gray-800">
                <div className="w-full h-full flex items-center justify-center text-gray-600 bg-[radial-gradient(#374151_1px,transparent_1px)] bg-size-[20px_20px]">
                    <div className="text-center">
                        <MapPin size={48} className="mx-auto text-green-500 animate-bounce" />
                        <p className="mt-2 font-bold">Navigating to...</p>
                        <p className="text-sm text-gray-400 mt-1">{activeOrder.deliveryAddress}</p>
                    </div>
                </div>
            </div>

            {/* Top Info Overlay */}
            <div className="absolute top-0 left-0 right-0 p-4 pt-safe-top flex flex-col gap-2 z-10 pointer-events-none">
                <div className="flex justify-between items-start">
                    <button onClick={() => router.back()} className="bg-gray-900/90 p-3 rounded-full text-white backdrop-blur-md shadow-lg pointer-events-auto">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="bg-gray-900/90 px-4 py-2 rounded-full text-white font-bold text-sm backdrop-blur-md shadow-lg flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
                        {queue.length} Remaining
                    </div>
                </div>
            </div>

            {/* Bottom Panel */}
            <div className="absolute bottom-0 left-0 right-0 bg-gray-900 rounded-t-3xl p-6 pb-safe-bottom z-20 border-t border-gray-800 shadow-2xl">
                <div className="w-12 h-1.5 bg-gray-700 rounded-full mx-auto mb-6" />

                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center font-bold text-white text-lg border border-gray-700">
                            {activeOrder.customerName?.charAt(0)}
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg">{activeOrder.customerName}</h3>
                            <p className="text-gray-400 text-sm">Collect: <span className="text-white font-bold">₹{activeOrder.totalAmount}</span></p>
                        </div>
                    </div>
                    <button className="p-3 bg-green-500/20 text-green-500 rounded-full hover:bg-green-500/30 transition-colors">
                        <Phone size={24} />
                    </button>
                </div>

                <div className="bg-gray-800 p-4 rounded-xl mb-6 flex gap-3">
                    <MapPin className="text-yellow-500 shrink-0 mt-1" size={20} />
                    <p className="text-gray-300 text-sm font-medium leading-relaxed">{activeOrder.deliveryAddress}</p>
                </div>

                <button 
                    onClick={() => setShowOtpModal(true)}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl text-lg shadow-lg shadow-green-900/20 transition-colors active:scale-95"
                >
                    Arrived & Collect OTP
                </button>
            </div>

            {/* OTP Modal */}
            <AnimatePresence>
                {showOtpModal && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-gray-900 w-full max-w-sm rounded-3xl p-8 border border-gray-800 shadow-2xl"
                        >
                            <h3 className="text-xl font-bold text-white text-center mb-2">Delivery Confirmation</h3>
                            <p className="text-gray-400 text-center text-sm mb-8">Enter customer's 4-digit PIN</p>

                            <div className="flex justify-center gap-4 mb-8">
                                {otp.map((digit, i) => (
                                    <input
                                        key={i}
                                        id={`otp-${i}`}
                                        type="tel"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(i, e.target.value)}
                                        className="w-14 h-14 bg-gray-800 border border-gray-700 rounded-xl text-center text-2xl font-bold text-white focus:border-green-500 outline-none transition-colors"
                                    />
                                ))}
                            </div>

                            <button onClick={verifyOtp} className="w-full bg-green-500 text-white font-bold py-4 rounded-xl mb-4">
                                Complete Order
                            </button>
                            <button onClick={() => setShowOtpModal(false)} className="w-full text-gray-500 font-medium py-2">
                                Cancel
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}