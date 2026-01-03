"use client";

import React, { useEffect, useState } from 'react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    CartesianGrid,
    XAxis,
    Tooltip,
    Legend,
} from 'recharts';
import {
    Search,
    Bike,
    X,
    MoreHorizontal,
    Star,
    Ban,
    CheckCircle,
    Phone,
    MapPin,
    History,
    BarChart3,
    FileText,
    CreditCard,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { AdminService } from "@/services/adminService";

export default function AdminRidersPage() {
    const [riders, setRiders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedRider, setSelectedRider] = useState<any | null>(null);
    const [modalTab, setModalTab] = useState<'overview' | 'analytics' | 'history' | 'docs'>('overview');
    const [analyticsFilter, setAnalyticsFilter] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
    const [analyticsTrend, setAnalyticsTrend] = useState<any[]>([]);
    const [analyticsMetrics, setAnalyticsMetrics] = useState<{ totalDeliveredOrders: number; totalDeliveredAmount: number }>({ totalDeliveredOrders: 0, totalDeliveredAmount: 0 });
    const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(false);
    const [riderAnalyticsFilter, setRiderAnalyticsFilter] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
    const [riderAnalyticsTrend, setRiderAnalyticsTrend] = useState<any[]>([]);
    const [riderAnalyticsMetrics, setRiderAnalyticsMetrics] = useState<{ totalDeliveredOrders: number; totalDeliveredAmount: number }>({ totalDeliveredOrders: 0, totalDeliveredAmount: 0 });
    const [riderAnalyticsLoading, setRiderAnalyticsLoading] = useState<boolean>(false);
    const [riderHistory, setRiderHistory] = useState<any[]>([]);
    const [riderHistoryLoading, setRiderHistoryLoading] = useState<boolean>(false);

    useEffect(() => {
        fetchRiders();
    }, []);

    useEffect(() => {
        fetchAnalytics(analyticsFilter);
    }, [analyticsFilter]);

    useEffect(() => {
        if (modalTab === 'analytics' && selectedRider) {
            fetchRiderAnalytics(selectedRider.id, riderAnalyticsFilter);
        }
    }, [modalTab, riderAnalyticsFilter, selectedRider]);

    useEffect(() => {
        if (modalTab === 'history' && selectedRider) {
            fetchRiderHistory(selectedRider.id);
        }
    }, [modalTab, selectedRider]);

    const fetchRiders = async () => {
        try {
            setLoading(true);
            const data = await AdminService.getAllRiders();

            const normalized = Array.isArray(data) ? data.map((r: any) => {
                const user = r.user || {};
                const shopAddress = r.shopkeeper?.address || r.address || {};
                const name = r.name || user.name || r.vehicleOwnerName || `Rider #${r.id}`;
                const phone = r.phone || user.phone || '';
                const status = r.status || (r.isAvailable ? 'available' : 'offline');
                const totalDeliveries = r.totalDeliveries ?? r._count?.orders ?? 0;
                const rating = r.rating ?? 4.8;
                const addressText = shopAddress.line1
                    ? `${shopAddress.line1}${shopAddress.city ? ", " + shopAddress.city : ''}`
                    : shopAddress.city || 'Address not set';

                return {
                    ...r,
                    name,
                    phone,
                    status,
                    totalDeliveries,
                    rating,
                    addressText,
                };
            }) : [];

            setRiders(normalized);
        } catch (err) {
            console.error("Failed to fetch riders", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAnalytics = async (filter: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
        try {
            setAnalyticsLoading(true);
            const resp = await AdminService.getOrderDeliveryAnalytics(filter);
            const trend = Array.isArray(resp?.trend) ? resp.trend : [];
            setAnalyticsTrend(trend);
            setAnalyticsMetrics({
                totalDeliveredOrders: resp?.metrics?.totalDeliveredOrders || 0,
                totalDeliveredAmount: resp?.metrics?.totalDeliveredAmount || 0,
            });
        } catch (err) {
            console.error('Failed to fetch delivery analytics', err);
            setAnalyticsTrend([]);
            setAnalyticsMetrics({ totalDeliveredOrders: 0, totalDeliveredAmount: 0 });
        } finally {
            setAnalyticsLoading(false);
        }
    };

    const fetchRiderAnalytics = async (riderId: number, filter: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
        try {
            setRiderAnalyticsLoading(true);
            const resp = await AdminService.getRiderAnalytics(riderId, filter);
            const trend = Array.isArray(resp?.trend) ? resp.trend : [];
            setRiderAnalyticsTrend(trend);
            setRiderAnalyticsMetrics({
                totalDeliveredOrders: resp?.metrics?.totalDeliveredOrders || 0,
                totalDeliveredAmount: resp?.metrics?.totalDeliveredAmount || 0,
            });
        } catch (err) {
            console.error('Failed to fetch rider analytics', err);
            setRiderAnalyticsTrend([]);
            setRiderAnalyticsMetrics({ totalDeliveredOrders: 0, totalDeliveredAmount: 0 });
        } finally {
            setRiderAnalyticsLoading(false);
        }
    };

    const fetchRiderHistory = async (riderId: number) => {
        try {
            setRiderHistoryLoading(true);
            const data = await AdminService.getRiderOrderHistory(riderId);
            const orders = data?.orders || [];
            setRiderHistory(Array.isArray(orders) ? orders : []);
        } catch (err) {
            console.error('Failed to fetch rider history', err);
            setRiderHistory([]);
        } finally {
            setRiderHistoryLoading(false);
        }
    };

    const handleSuspendToggle = (id: number) => {
        // Implement suspend logic if backend supports it. For now just optimistic UI update or alert.
        alert("Suspend feature not yet connected to backend.");
    };

    const openRiderModal = (rider: any) => {
        // console.log("Opening Rider Modal for:", rider);
        setSelectedRider(rider);
        setModalTab('overview'); // Reset tab
    };

    const filteredRiders = riders.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.phone.includes(search) ||
        (r.addressText || '').toLowerCase().includes(search.toLowerCase())
    );
    // console.log("Filtered Riders:", filteredRiders);
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'busy': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
            case 'offline': return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
            case 'suspended': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    return (
        <div className="space-y-6 pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Riders</h1>
                <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search riders..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm w-full sm:w-64 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                </div>
            </div>

            {/* Delivery Analytics Chart */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white"> Orders Analytics</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Total Delivered: {analyticsMetrics.totalDeliveredOrders} · Amount: ₹{analyticsMetrics.totalDeliveredAmount}</p>
                    </div>
                    <div className="flex gap-2">
                        {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setAnalyticsFilter(f)}
                                className={`px-3 py-2 rounded-lg text-sm font-bold capitalize border transition-colors ${analyticsFilter === f
                                    ? 'bg-blue-500 text-white border-blue-500'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-72">
                    {analyticsLoading ? (
                        <div className="h-full flex items-center justify-center text-gray-500">Loading...</div>
                    ) : analyticsTrend.length ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analyticsTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="delivOrders" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="delivAmount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                                <Tooltip
                                    formatter={(value: any, key) => {
                                        if (key === 'deliveredAmount') return [value, 'Amount'];
                                        return [value, 'Delivered Orders'];
                                    }}
                                />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="deliveredOrders"
                                    stroke="#3B82F6"
                                    fill="url(#delivOrders)"
                                    strokeWidth={2}
                                    dot={{ r: 3, strokeWidth: 1.5, fill: '#3B82F6' }}
                                    activeDot={{ r: 5 }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="deliveredAmount"
                                    stroke="#10B981"
                                    fill="url(#delivAmount)"
                                    strokeWidth={2}
                                    dot={{ r: 3, strokeWidth: 1.5, fill: '#10B981' }}
                                    activeDot={{ r: 5 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-500">No analytics data</div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRiders.map((rider) => (
                    <motion.div
                        key={rider.id}
                        layout
                        onClick={() => openRiderModal(rider)}
                        className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col cursor-pointer hover:border-blue-500/50 transition-colors group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500">
                                    <Bike size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {rider.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                        <Phone size={14} className="text-blue-500" /> {rider.phone || 'N/A'}
                                    </p>
                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                        <MapPin size={12} className="text-orange-500" /> {rider.addressText || 'Address not set'}
                                    </p>
                                </div>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${getStatusColor(rider.status)}`}>
                                {rider.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4 py-3 border-y border-gray-100 dark:border-gray-700">
                            <div className="text-center border-r border-gray-100 dark:border-gray-700">
                                <p className="text-xs text-gray-500 uppercase font-bold">Deliveries</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">{rider.totalDeliveries}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-gray-500 uppercase font-bold">Shop</p>
                                <p className="text-lg font-bold text-yellow-500 flex items-center justify-center gap-1">
                                    {rider.shopName}
                                </p>
                            </div>
                        </div>

                        <div className="mt-auto">
                            <button className="w-full py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2">
                                <MoreHorizontal size={16} /> View Full Profile
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* --- Rider Details Modal --- */}
            <AnimatePresence>
                {selectedRider && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Header */}
                            <div className="p-6 pb-0 bg-gray-50 dark:bg-gray-800/50">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600">
                                            <Bike size={32} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedRider.name}</h2>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${getStatusColor(selectedRider.status)}`}>
                                                    {selectedRider.status}
                                                </span>
                                                <span className="text-gray-400 text-xs">• ID: #{selectedRider.id}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedRider(null)} className="p-2 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Tabs */}
                                <div className="flex gap-1 overflow-x-auto">
                                    {['overview', 'analytics', 'history', 'docs'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setModalTab(tab as any)}
                                            className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors capitalize ${modalTab === tab
                                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                                }`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 overflow-y-auto min-h-[400px]">
                                {/* TAB: OVERVIEW */}
                                {modalTab === 'overview' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Contact</p>
                                                <div className="flex items-center gap-2 text-gray-800 dark:text-white font-medium">
                                                    <Phone size={16} className="text-blue-500" /> {selectedRider.phone}
                                                </div>
                                            </div>
                                            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Zone</p>
                                                <div className="flex items-center gap-2 text-gray-800 dark:text-white font-medium">
                                                    <MapPin size={16} className="text-orange-500" /> {selectedRider.address.city || 'N/A'} {selectedRider.address.line1 ? `- ${selectedRider.address.line1}` : ''}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white mb-3">Performance Stats</h3>
                                            <div className="grid grid-cols-2 gap-4 text-center">
                                                <div className="p-3 border border-gray-100 dark:border-gray-700 rounded-lg">
                                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedRider.totalDeliveries}</p>
                                                    <p className="text-xs text-gray-500">Lifetime Orders</p>
                                                </div>
                                                <div className="p-3 border border-gray-100 dark:border-gray-700 rounded-lg">
                                                    <p className="text-2xl font-bold text-yellow-500">{selectedRider.shopName}</p>
                                                    <p className="text-xs text-gray-500">Shop</p>
                                                </div>

                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                            <h3 className="font-bold text-gray-900 dark:text-white mb-3">Account Actions</h3>
                                            {selectedRider.status === 'suspended' ? (
                                                <button
                                                    onClick={() => handleSuspendToggle(selectedRider.id)}
                                                    className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                                                >
                                                    <CheckCircle size={18} /> Activate Account
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleSuspendToggle(selectedRider.id)}
                                                    className="w-full py-3 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                                                >
                                                    <Ban size={18} /> Suspend Account
                                                </button>
                                            )}
                                            <p className="text-xs text-gray-500 text-center mt-2">
                                                Suspending will prevent the rider from accepting new orders.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* TAB: ANALYTICS */}
                                {modalTab === 'analytics' && (
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                    <BarChart3 size={18} /> Delivery Performance
                                                </h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Delivered: {riderAnalyticsMetrics.totalDeliveredOrders} · Amount: ₹{riderAnalyticsMetrics.totalDeliveredAmount}</p>
                                            </div>
                                            <select
                                                value={riderAnalyticsFilter}
                                                onChange={(e) => setRiderAnalyticsFilter(e.target.value as any)}
                                                className="text-xs bg-gray-100 dark:bg-gray-700 border-none rounded-lg px-2 py-1 text-gray-600 dark:text-gray-300"
                                            >
                                                <option value="daily">Daily</option>
                                                <option value="weekly">Weekly</option>
                                                <option value="monthly">Monthly</option>
                                                <option value="yearly">Yearly</option>
                                            </select>
                                        </div>

                                        <div className="h-64">
                                            {riderAnalyticsLoading ? (
                                                <div className="h-full flex items-center justify-center text-gray-500">Loading...</div>
                                            ) : riderAnalyticsTrend.length ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={riderAnalyticsTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                                        <defs>
                                                            <linearGradient id="riderDelivOrders" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                                                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                                            </linearGradient>
                                                            <linearGradient id="riderDelivAmount" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                                                                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                                                        <Tooltip
                                                            formatter={(value: any, key) => {
                                                                if (key === 'deliveredAmount') return [value, 'Amount'];
                                                                return [value, 'Delivered Orders'];
                                                            }}
                                                        />
                                                        <Legend />
                                                        <Area
                                                            type="monotone"
                                                            dataKey="deliveredOrders"
                                                            stroke="#3B82F6"
                                                            fill="url(#riderDelivOrders)"
                                                            strokeWidth={2}
                                                            dot={{ r: 3, strokeWidth: 1.5, fill: '#3B82F6' }}
                                                            activeDot={{ r: 5 }}
                                                        />
                                                        <Area
                                                            type="monotone"
                                                            dataKey="deliveredAmount"
                                                            stroke="#10B981"
                                                            fill="url(#riderDelivAmount)"
                                                            strokeWidth={2}
                                                            dot={{ r: 3, strokeWidth: 1.5, fill: '#10B981' }}
                                                            activeDot={{ r: 5 }}
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="h-full flex items-center justify-center text-gray-500">No analytics data</div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* TAB: HISTORY */}
                                {modalTab === 'history' && (
                                    <div className="space-y-4">
                                        {riderHistoryLoading ? (
                                            <div className="h-64 flex items-center justify-center text-gray-500">Loading history...</div>
                                        ) : riderHistory.length > 0 ? (
                                            <>
                                                {riderHistory.map((order) => (
                                                    <div key={order.orderId} className="p-4 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500">
                                                                    <History size={18} />
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-gray-900 dark:text-white text-sm">Order #{order.orderId}</p>
                                                                    <p className="text-xs text-gray-500">{new Date(order.dateTime).toLocaleString()}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-bold text-gray-900 dark:text-white text-sm">₹{order.amount || 0}</p>
                                                                <span className={`text-[10px] font-bold capitalize ${order.status === 'delivered' ? 'text-green-600' :
                                                                    order.status === 'cancelled' ? 'text-red-600' : 'text-orange-600'
                                                                    }`}>
                                                                    {order.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="pl-13 space-y-1">
                                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                                <span className="font-semibold">Customer:</span> {order.customer?.name || order.customer?.phone || 'N/A'}
                                                            </p>
                                                            <p className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1">
                                                                <MapPin size={12} className="text-orange-500 mt-0.5" />
                                                                <span>{order.deliveryAddress || 'N/A'}</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </>
                                        ) : (
                                            <div className="h-64 flex items-center justify-center text-gray-500">No order history</div>
                                        )}
                                    </div>
                                )}

                                {/* TAB: DOCS */}
                                {modalTab === 'docs' && (
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <p className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                <FileText size={16} /> License / RC Document
                                            </p>
                                            <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-xl relative overflow-hidden border border-gray-200 dark:border-gray-600">
                                                {selectedRider.licenseImage?.[0] ? (
                                                    <Image
                                                        src={selectedRider.licenseImage[0]}
                                                        alt="Rider document"
                                                        fill
                                                        className="object-cover"
                                                        sizes="(max-width: 768px) 100vw, 50vw"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                                                        No document uploaded
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 text-green-600 text-xs font-bold">
                                                <CheckCircle size={12} />
                                                {selectedRider.isVerified ? 'Verified' : 'Pending verification'}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}