"use client";

import React, { useEffect } from 'react';
import { useDeliveryStore } from '@/hooks/useDeliveryStore';
import { ArrowLeft, Package, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DeliveryHistoryPage() {
    const router = useRouter();
    const { history, fetchHistory, isLoading } = useDeliveryStore();

    useEffect(() => {
        fetchHistory();
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 pb-8">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 px-4 py-4 pt-safe-top">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.back()}
                        className="p-2 rounded-full bg-gray-800 text-white hover:bg-gray-700"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-lg font-bold text-white">Order History</h1>
                </div>
            </div>

            {/* List */}
            <div className="p-4 space-y-4">
                {isLoading ? (
                    <div className="text-center text-gray-500 py-10">Loading history...</div>
                ) : history.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package size={32} className="text-gray-600" />
                        </div>
                        <p className="text-gray-400">No completed orders yet.</p>
                    </div>
                ) : (
                    history.map((order) => (
                        <div key={order.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-white font-bold">Order #{order.id}</p>
                                    <p className="text-gray-400 text-xs mt-1">{order.deliveryAddress}</p>
                                </div>
                                <div className={`px-2 py-1 rounded-md text-xs font-bold uppercase flex items-center gap-1 ${
                                    order.status === 'delivered' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                }`}>
                                    {order.status === 'delivered' ? <CheckCircle size={12}/> : <XCircle size={12}/>}
                                    {order.status}
                                </div>
                            </div>
                            
                            <div className="h-px bg-gray-700 w-full" />
                            
                            <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-4 text-gray-400">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar size={14} /> 
                                        {new Date(order.updatedAt).toLocaleDateString()}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Clock size={14} /> 
                                        {new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <span className="text-white font-bold">₹{order.totalAmount}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}