"use client";

import React, { useState } from 'react';
import { adminStats } from '@/app/data/adminMock';
import Link from 'next/link';
import { 
    TrendingUp, 
    ShoppingBag, 
    Users, 
    Store, 
    AlertCircle,
    ArrowUpRight,
    Check,
    X,
    Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock data for pending actions - Only Shops as Riders are managed by Shopkeepers
const initialPendingActions = [
    { id: 1, type: 'Shop', name: 'Green Grocers', status: 'Pending Approval', time: '2h ago' },
    { id: 3, type: 'Shop', name: 'MediCare Pharmacy', status: 'Pending Approval', time: '1d ago' },
];

export default function AdminDashboard() {
    // Calculate max revenue for chart scaling
    const maxRevenue = Math.max(...adminStats.revenueTrend.map(d => d.value));
    const [pendingItems, setPendingItems] = useState(initialPendingActions);
    
    // Modal State
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        action: 'approve' | 'reject' | null;
        item: typeof initialPendingActions[0] | null;
    }>({ isOpen: false, action: null, item: null });

    const handleActionClick = (item: typeof initialPendingActions[0], action: 'approve' | 'reject') => {
        setModalConfig({ isOpen: true, action, item });
    };

    const confirmAction = () => {
        if (modalConfig.item) {
            // Remove item from list to simulate processing
            setPendingItems(prev => prev.filter(i => i.id !== modalConfig.item!.id));
            // Close modal
            setModalConfig({ isOpen: false, action: null, item: null });
            // In real app: call API here
            alert(`${modalConfig.action === 'approve' ? 'Approved' : 'Rejected'} ${modalConfig.item.type}: ${modalConfig.item.name}`);
        }
    };

    // Export Report Function
    const handleExportReport = () => {
        // 1. Prepare CSV Data
        const headers = ["Metric", "Value"];
        const rows = [
            ["Total Sales", adminStats.totalSales.replace(/,/g, '')], 
            ["Total Orders", adminStats.totalOrders],
            ["Total Users", adminStats.totalUsers],
            ["Total Shops", adminStats.totalShops],
            ["Total Riders", adminStats.totalRiders],
            ["Active Orders", adminStats.activeOrders],
            ["Pending Shop Approvals", adminStats.pendingShopApprovals],
            ["Pending Rider Approvals", adminStats.pendingRiderApprovals],
        ];

        // 2. Convert Array of Arrays to CSV String
        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        // 3. Create Blob and Download Link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `admin_report_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        
        // 4. Trigger Download & Cleanup
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 relative">
            {/* Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back, here's what's happening today.</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleExportReport}
                        className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200 flex items-center gap-2"
                    >
                        <Download size={16} /> Export Report
                    </button>
                </div>
            </div>

            {/* Stats Grid - CLICKABLE CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Revenue -> Orders/Finance */}
                <Link href="/admin/orders">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer h-full">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</p>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{adminStats.totalSales}</h3>
                            </div>
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg">
                                <TrendingUp size={20} />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-xs font-medium text-green-600">
                            <ArrowUpRight size={14} className="mr-1" /> +12.5% from last month
                        </div>
                    </div>
                </Link>

                {/* Active Orders -> Orders */}
                <Link href="/admin/orders">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer h-full">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Orders</p>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{adminStats.activeOrders}</h3>
                            </div>
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                                <ShoppingBag size={20} />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-xs font-medium text-gray-500">
                            {adminStats.totalOrders} total lifetime
                        </div>
                    </div>
                </Link>

                {/* Users -> User Management */}
                <Link href="/admin/users">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer h-full">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</p>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{adminStats.totalUsers}</h3>
                            </div>
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg">
                                <Users size={20} />
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Pending -> Shops Management */}
                <Link href="/admin/shops">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer h-full">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Shop Approvals</p>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {adminStats.pendingShopApprovals}
                                </h3>
                            </div>
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-lg">
                                <AlertCircle size={20} />
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-orange-600 font-medium">
                            Requires Action
                        </div>
                    </div>
                </Link>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-6">Revenue Analytics (This Week)</h3>
                    
                    {/* CSS Bar Chart */}
                    <div className="h-64 flex items-end justify-between gap-4">
                        {adminStats.revenueTrend.map((data, i) => {
                            const heightPercent = (data.value / maxRevenue) * 100;
                            return (
                                <div key={data.name} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-t-md relative h-full overflow-hidden flex flex-col-reverse">
                                        <div 
                                            className="w-full bg-indigo-500 hover:bg-indigo-600 transition-all duration-300 rounded-t-md relative group-hover:shadow-lg"
                                            style={{ height: `${heightPercent}%` }}
                                        >
                                            {/* Tooltip */}
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                                ₹{data.value}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{data.name}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Pending Actions List */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-900 dark:text-white">Action Items</h3>
                        <Link href="/admin/shops" className="text-xs text-indigo-600 hover:underline font-medium">See All</Link>
                    </div>
                    
                    <div className="space-y-4 flex-1 overflow-y-auto">
                        {pendingItems.length > 0 ? pendingItems.map((item) => (
                            <div key={item.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-orange-100 text-orange-600">
                                            <Store size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{item.name}</p>
                                            <p className="text-xs text-gray-500">{item.status} • {item.time}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <button 
                                        onClick={() => handleActionClick(item, 'approve')}
                                        className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-1.5 rounded transition-colors flex items-center justify-center gap-1"
                                    >
                                        <Check size={12} /> Approve
                                    </button>
                                    <button 
                                        onClick={() => handleActionClick(item, 'reject')}
                                        className="flex-1 bg-gray-200 dark:bg-gray-600 hover:bg-red-100 hover:text-red-600 text-gray-700 dark:text-gray-300 text-xs font-bold py-1.5 rounded transition-colors flex items-center justify-center gap-1"
                                    >
                                        <X size={12} /> Reject
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-10 text-gray-400 text-sm">
                                No pending actions.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- Confirmation Modal --- */}
            <AnimatePresence>
                {modalConfig.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-200 dark:border-gray-700"
                        >
                            <div className="text-center">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                                    modalConfig.action === 'approve' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                }`}>
                                    {modalConfig.action === 'approve' ? <Check size={24} /> : <X size={24} />}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 capitalize">
                                    {modalConfig.action} Request?
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                    Are you sure you want to {modalConfig.action} <strong>{modalConfig.item?.name}</strong>? 
                                    {modalConfig.action === 'reject' && " This cannot be undone."}
                                </p>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}
                                        className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={confirmAction}
                                        className={`flex-1 py-2.5 rounded-xl text-white font-bold text-sm transition-colors ${
                                            modalConfig.action === 'approve' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                                        }`}
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}