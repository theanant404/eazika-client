"use client";

import React, { useState, useEffect } from 'react';
import { mockOrders, orderVolumeData } from '@/app/data/adminMock';
import { AdminChart } from '@/app/components/admin/AdminChart';
import { 
    Search, 
    Eye, 
    MapPin, 
    Filter, 
    Calendar, 
    X, 
    User, 
    Store, 
    Bike, 
    Package, 
    CreditCard,
    CheckCircle,
    Clock,
    Truck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Helper to get Status Colors
const getStatusColor = (status: string) => {
    switch(status) {
        case 'delivered': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
        case 'shipped': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
        case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
        case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
        default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
};

import { AdminService } from "@/services/adminService";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    fetchOrders();
  },[]);

  const fetchOrders = async () => {
    try {
        setLoading(true);
        const data = await AdminService.getAllOrders();
        setOrders(data);
    } catch(err) {
        console.error("Failed to fetch orders", err);
    } finally {
        setLoading(false);
    }
  };

  // Filter Logic
  const filteredOrders = orders.filter(order => {
      const matchesSearch = 
          order.id.toLowerCase().includes(search.toLowerCase()) || 
          order.customer.toLowerCase().includes(search.toLowerCase()) ||
          order.shop.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
      // Date filtering (Basic string match for YYYY-MM-DD)
      const matchesDate = !dateFilter || order.date === dateFilter;

      return matchesSearch && matchesStatus && matchesDate;
  });

  // Mock Items Generator for Details Modal
  const getMockItems = () => [
      { name: "Chicken Burger", qty: 2, price: "₹150" },
      { name: "French Fries", qty: 1, price: "₹80" },
      { name: "Coke (500ml)", qty: 2, price: "₹40" }
  ];

  return (
    <div className="space-y-6 pb-12">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Orders</h1>
      
      {/* Analysis Graph */}
      <AdminChart title="Order Volume (Hourly)" data={orderVolumeData} color="green" />

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
         {/* Search */}
         <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
                type="text" 
                placeholder="Search ID, Customer, Shop..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm w-full focus:ring-2 focus:ring-green-500 outline-none transition-all dark:text-white"
            />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none cursor-pointer dark:text-white appearance-none min-w-[140px]"
                >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input 
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none cursor-pointer dark:text-white"
                />
            </div>

            {/* Clear Filter Button (only shows if filters active) */}
            {(statusFilter !== 'all' || dateFilter || search) && (
                <button 
                    onClick={() => { setStatusFilter('all'); setDateFilter(''); setSearch(''); }}
                    className="px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium"
                >
                    Clear
                </button>
            )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 font-medium">
                    <tr>
                        <th className="px-6 py-4">Order ID</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Shop</th>
                        <th className="px-6 py-4">Rider</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">View</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredOrders.length > 0 ? (
                        filteredOrders.map((order) => (
                            <tr 
                                key={order.id} 
                                onClick={() => setSelectedOrder(order)}
                                className="hover:bg-gray-50 dark:hover:bg-gray-700/20 cursor-pointer transition-colors"
                            >
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{order.id}</td>
                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{order.customer}</td>
                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{order.shop}</td>
                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{order.rider || '-'}</td>
                                <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{order.amount}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                                        className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg"
                                    >
                                        <Eye size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                No orders match your filters.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* --- Order Details Modal --- */}
      <AnimatePresence>
        {selectedOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]"
                >
                    {/* Modal Header */}
                    <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-full">
                                <Package size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedOrder.id}</h2>
                                <p className="text-sm text-gray-500 flex items-center gap-2">
                                    {selectedOrder.date} • 
                                    <span className={`capitalize px-2 py-0.5 rounded text-[10px] font-bold ${getStatusColor(selectedOrder.status)}`}>
                                        {selectedOrder.status}
                                    </span>
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setSelectedOrder(null)}
                            className="p-2 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Modal Body */}
                    <div className="p-6 overflow-y-auto space-y-6">
                        
                        {/* Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700">
                                <p className="text-xs text-gray-500 uppercase font-bold mb-2 flex items-center gap-1">
                                    <User size={12} /> Customer
                                </p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedOrder.customer}</p>
                                <p className="text-xs text-gray-500 mt-1">+91 98765 43210</p>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700">
                                <p className="text-xs text-gray-500 uppercase font-bold mb-2 flex items-center gap-1">
                                    <Store size={12} /> Shop
                                </p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedOrder.shop}</p>
                                <p className="text-xs text-gray-500 mt-1">Civil Lines, Nagpur</p>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700">
                                <p className="text-xs text-gray-500 uppercase font-bold mb-2 flex items-center gap-1">
                                    <Bike size={12} /> Rider
                                </p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedOrder.rider || 'Unassigned'}</p>
                                <p className="text-xs text-gray-500 mt-1">{selectedOrder.rider ? 'On the way' : 'Waiting'}</p>
                            </div>
                        </div>

                        {/* Items List */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase mb-3">Order Items</h3>
                            <div className="border rounded-xl border-gray-100 dark:border-gray-700 overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 font-medium">
                                        <tr>
                                            <th className="px-4 py-2">Item</th>
                                            <th className="px-4 py-2 text-center">Qty</th>
                                            <th className="px-4 py-2 text-right">Price</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {selectedOrder.items?.map((item: any, idx: number) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{item.name}</td>
                                                <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">{item.qty}</td>
                                                <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">{item.price}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        {/* Payment Summary */}
                        <div className="flex justify-end">
                            <div className="w-full md:w-1/2 space-y-2">
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>Subtotal</span>
                                    <span>{selectedOrder.amount}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>Delivery Fee</span>
                                    <span>₹40</span>
                                </div>
                                <div className="flex justify-between text-base font-bold text-gray-900 dark:text-white pt-2 border-t dark:border-gray-700">
                                    <span>Total Paid</span>
                                    <span>{selectedOrder.amount}</span>
                                </div>
                                <div className="flex justify-end pt-1">
                                    <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/20 px-2 py-0.5 rounded flex items-center gap-1">
                                        <CreditCard size={10} /> Paid via UPI
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-right">
                        <button 
                            onClick={() => setSelectedOrder(null)}
                            className="px-6 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-white"
                        >
                            Close
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}