"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
    ArrowLeft, 
    Phone, 
    MapPin, 
    Clock, 
    CheckCircle, 
    Package, 
    Truck,
    Loader2,
    Printer,
    User,
    X
} from 'lucide-react';
import Image from 'next/image';
import { ShopService, ShopOrderDetail, ShopRider } from '@/services/shopService';
import { motion, AnimatePresence } from 'framer-motion';

export default function ShopOrderDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const orderId = Number(params.id);

    const [order, setOrder] = useState<ShopOrderDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    // Rider Selection State
    const [showRiderModal, setShowRiderModal] = useState(false);
    const [riders, setRiders] = useState<ShopRider[]>([]);
    const [isLoadingRiders, setIsLoadingRiders] = useState(false);
    const [selectedRider, setSelectedRider] = useState<number | null>(null);

    useEffect(() => {
        if (!orderId) return;
        const fetchDetails = async () => {
            try {
                const data = await ShopService.getShopOrderById(orderId);
                setOrder(data);
            } catch (error) {
                console.error("Failed to load order", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetails();
    }, [orderId]);

    // Fetch riders when modal opens
    useEffect(() => {
        if (showRiderModal && riders.length === 0) {
            setIsLoadingRiders(true);
            ShopService.getShopRiders()
                .then(setRiders)
                .catch(err => console.error(err))
                .finally(() => setIsLoadingRiders(false));
        }
    }, [showRiderModal]);

    const handleStatusUpdate = async (newStatus: string) => {
        // If marking ready, open modal first
        if (newStatus === 'ready' && !order?.driver) {
            setShowRiderModal(true);
            return;
        }

        if (!order) return;
        setIsUpdating(true);
        try {
            await ShopService.updateOrderStatus(order.id, newStatus);
            setOrder({ ...order, status: newStatus as any });
        } catch (error) {
            console.error("Update failed", error);
        } finally {
            setIsUpdating(false);
        }
    };

    // ADDED: Handle Reject Order Logic
    const handleRejectOrder = async () => {
        if (!order) return;
        // Optional: Add confirmation dialog here
        if (!confirm("Are you sure you want to reject this order?")) return;

        setIsUpdating(true);
        try {
            await ShopService.updateOrderStatus(order.id, 'cancelled');
            setOrder({ ...order, status: 'cancelled' });
        } catch (error) {
            console.error("Reject failed", error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleAssignRider = async () => {
        if (!selectedRider || !order) return;
        setIsUpdating(true);
        try {
            // Assign Rider
            await ShopService.assignRider(order.id, selectedRider);
            // Update Status to Ready
            await ShopService.updateOrderStatus(order.id, 'ready');
            
            // Update local state
            const riderDetails = riders.find(r => r.id === selectedRider);
            setOrder({ 
                ...order, 
                status: 'ready',
                driver: riderDetails ? { id: riderDetails.id, name: riderDetails.name, phone: riderDetails.phone } : undefined
            });
            setShowRiderModal(false);
        } catch (error) {
            console.error("Failed to assign rider", error);
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-yellow-500" size={32} /></div>;
    }

    if (!order) {
        return <div className="p-8 text-center">Order not found</div>;
    }

    return (
        <div className="max-w-4xl mx-auto pb-24 md:pb-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                    <ArrowLeft size={24} className="text-gray-800 dark:text-white" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order #{order.id}</h1>
                <button className="ml-auto p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
                    <Printer size={20} />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Details */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Customer Card */}
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Customer Details</h3>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white text-lg">{order.customerName}</p>
                                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                    <Phone size={14} /> {order.customerPhone}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                    {order.paymentMethod}
                                </span >
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-start gap-3">
                            <MapPin className="text-gray-400 shrink-0 mt-0.5" size={18} />
                            <p className="text-sm text-gray-600 dark:text-gray-300">{order.address}</p>
                        </div>
                    </div>

                    {/* Items List */}
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Order Items</h3>
                        <div className="space-y-4">
                            {order.products.map((item) => (
                                <div key={item.id} className="flex gap-4">
                                    <div className="relative w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden shrink-0">
                                        <Image src={item.image} alt={item.name} layout="fill" objectFit="cover" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-900 dark:text-white text-sm">{item.name}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
                                    </div>
                                    <p className="font-bold text-gray-900 dark:text-white">₹{item.price * item.quantity}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <span className="text-gray-500 font-medium">Total Amount</span>
                            <span className="text-xl font-bold text-gray-900 dark:text-white">₹{order.totalAmount}</span>
                        </div>
                    </div>
                </div>

                {/* Right Column: Actions */}
                <div className="space-y-6">
                    {/* Status Control */}
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Order Status</h3>
                        
                        {order.status === 'pending' && (
                            <div className="space-y-3">
                                <button 
                                    onClick={() => handleStatusUpdate('preparing')}
                                    disabled={isUpdating}
                                    className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    {isUpdating ? <Loader2 className="animate-spin" /> : 'Accept Order'}
                                </button>
                                {/* UPDATED: Connected Reject Button */}
                                <button 
                                    onClick={handleRejectOrder}
                                    disabled={isUpdating}
                                    className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition-colors disabled:opacity-50"
                                >
                                    Reject Order
                                </button>
                            </div>
                        )}

                        {order.status === 'preparing' && (
                            <button 
                                onClick={() => handleStatusUpdate('ready')}
                                disabled={isUpdating}
                                className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                {isUpdating ? <Loader2 className="animate-spin" /> : 'Mark as Ready & Assign'}
                            </button>
                        )}

                        {order.status === 'ready' && (
                            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-900">
                                <p className="text-green-700 dark:text-green-400 font-bold mb-2">Ready for Pickup</p>
                                <p className="text-xs text-gray-500">Waiting for delivery partner...</p>
                            </div>
                        )}

                        {/* NEW: Cancelled State */}
                        {order.status === 'cancelled' && (
                            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900">
                                <p className="text-red-700 dark:text-red-400 font-bold mb-2">Order Cancelled</p>
                                <p className="text-xs text-gray-500">This order has been rejected/cancelled.</p>
                            </div>
                        )}

                         {/* Status Steps Visualization */}
                         <div className="mt-6 relative pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-6">
                            {['pending', 'preparing', 'ready', 'delivered'].map((step, i) => {
                                const stepsOrder = ['pending', 'preparing', 'ready', 'shipped', 'delivered'];
                                const currentIdx = stepsOrder.indexOf(order.status);
                                const stepIdx = stepsOrder.indexOf(step);
                                const isCompleted = currentIdx >= stepIdx;

                                return (
                                    <div key={step} className="relative">
                                        <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full ring-4 ring-white dark:ring-gray-800 ${isCompleted ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                                        <p className={`text-sm capitalize ${isCompleted ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                                            {step}
                                        </p>
                                    </div>
                                )
                            })}
                         </div>
                    </div>

                    {/* Driver Info (if assigned) */}
                    {order.driver && (
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Delivery Partner</h3>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                                    {order.driver.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white">{order.driver.name}</p>
                                    <p className="text-xs text-gray-500">{order.driver.phone}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Rider Selection Modal */}
            <AnimatePresence>
                {showRiderModal && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl p-6 shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Select Delivery Partner</h3>
                                <button onClick={() => setShowRiderModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            {isLoadingRiders ? (
                                <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-yellow-500" /></div>
                            ) : riders.length > 0 ? (
                                <div className="space-y-3 max-h-80 overflow-y-auto no-scrollbar mb-6">
                                    {riders.map((rider) => (
                                        <div 
                                            key={rider.id}
                                            onClick={() => setSelectedRider(rider.id)}
                                            className={`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                                                selectedRider === rider.id 
                                                ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-500/10' 
                                                : 'border-gray-100 dark:border-gray-700 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                                    <User size={20} className="text-gray-500" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white">{rider.name}</p>
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className={`px-2 py-0.5 rounded-full capitalize ${
                                                            rider.status === 'available' ? 'bg-green-100 text-green-700' : 
                                                            rider.status === 'busy' ? 'bg-orange-100 text-orange-700' : 
                                                            'bg-gray-100 text-gray-600'
                                                        }`}>
                                                            {rider.status}
                                                        </span>
                                                        <span className="text-gray-400">• {rider.activeOrders} Active Orders</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {selectedRider === rider.id && <CheckCircle size={20} className="text-yellow-500 fill-current" />}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">No riders found</div>
                            )}

                            <button 
                                onClick={handleAssignRider}
                                disabled={!selectedRider || isUpdating}
                                className="w-full py-3.5 bg-yellow-500 text-white font-bold rounded-xl hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isUpdating ? <Loader2 className="animate-spin" /> : "Assign & Mark Ready"}
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}