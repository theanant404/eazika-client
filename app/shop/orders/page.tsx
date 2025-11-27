"use client";

import React, { useState, useEffect } from 'react';
import { 
    Search, 
    Filter, 
    Clock, 
    CheckCircle, 
    Package, 
    Truck, 
    XCircle,
    ChevronRight,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import { ShopService, ShopOrder } from '@/services/shopService';

const TABS = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'preparing', label: 'Preparing' },
    { id: 'ready', label: 'Ready' },
    { id: 'delivered', label: 'Completed' },
];

const getStatusColor = (status: string) => {
    switch (status) {
        case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
        case 'preparing': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
        case 'ready': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
        case 'shipped': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
        case 'delivered': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
        case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
        default: return 'bg-gray-100 text-gray-700';
    }
};

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'pending': return <Clock size={14} />;
        case 'preparing': return <Package size={14} />;
        case 'ready': return <CheckCircle size={14} />;
        case 'shipped': return <Truck size={14} />;
        case 'delivered': return <CheckCircle size={14} />;
        case 'cancelled': return <XCircle size={14} />;
        default: return <Clock size={14} />;
    }
};

export default function ShopOrdersPage() {
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [orders, setOrders] = useState<ShopOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadOrders = async () => {
            setIsLoading(true);
            try {
                // In real app, pass activeTab to API if backend filters
                const data = await ShopService.getShopOrders(activeTab === 'all' ? undefined : activeTab);
                setOrders(data);
            } catch (error) {
                console.error("Failed to load orders", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadOrders();
    }, [activeTab]);

    const filteredOrders = orders.filter(order => 
        order.id.toString().includes(searchQuery) || 
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 w-full max-w-full overflow-x-hidden pb-20">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage and track customer orders.</p>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                {/* Tabs */}
                <div className="flex p-1 bg-gray-100 dark:bg-gray-700/50 rounded-xl overflow-x-auto no-scrollbar w-full md:w-auto">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
                                activeTab === tab.id 
                                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' 
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search Order ID or Name..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-yellow-500 outline-none transition-all"
                    />
                </div>
            </div>

            {/* Orders List */}
            <div className="space-y-3">
                {isLoading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-yellow-500" size={32} /></div>
                ) : filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                        <Link href={`/shop/orders/${order.id}`} key={order.id}>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:border-yellow-500/50 transition-all group cursor-pointer">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-500 text-sm">
                                            {order.customerName.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white text-sm">{order.customerName}</h3>
                                            <p className="text-xs text-gray-500">#{order.id} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                                        {getStatusIcon(order.status)} {order.status}
                                    </span>
                                </div>
                                <div className="flex justify-between items-end mt-3 border-t border-gray-100 dark:border-gray-700 pt-3">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-0.5">{order.itemCount} Items</p>
                                        <p className="font-bold text-gray-900 dark:text-white">₹{order.totalAmount}</p>
                                    </div>
                                    <div className="text-gray-400 group-hover:text-yellow-600 dark:group-hover:text-yellow-500 transition-colors">
                                        <ChevronRight size={20} />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="text-center py-20 text-gray-400">No orders found</div>
                )}
            </div>
        </div>
    );
}