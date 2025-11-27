"use client";

import React, { useState } from 'react';
import { mockShops, shopPerformanceData } from '@/app/data/adminMock';
import { AdminChart } from '@/app/components/admin/AdminChart';
import { Search, Filter, CheckCircle, XCircle, Store, MoreVertical, Eye, Trash2, Ban, Inbox, ChevronDown, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// Local mock data for 30-day view
const shopPerformanceData30Days = [
    { label: 'Week 1', value: 4200 },
    { label: 'Week 2', value: 4800 },
    { label: 'Week 3', value: 5100 },
    { label: 'Week 4', value: 5900 },
];

export default function AdminShopsPage() {
  const [shops, setShops] = useState(mockShops);
  const [search, setSearch] = useState('');
  
  // Chart State
  const [chartRange, setChartRange] = useState('7');

  // Filter States
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const router = useRouter();

  // Extract unique categories for the filter dropdown
  const categories = Array.from(new Set(mockShops.map(s => s.category)));

  const handleApprove = (id: number) => {
    setShops(prev => prev.map(s => s.id === id ? { ...s, status: 'active' } : s));
  };

  const handleReject = (id: number) => {
    if(confirm('Reject this shop application?')) {
        setShops(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleDelete = (id: number) => {
    if(confirm('Are you sure you want to delete this shop? This cannot be undone.')) {
        setShops(prev => prev.filter(s => s.id !== id));
    }
  };

  const filteredShops = shops.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.owner.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const pendingShops = filteredShops.filter(s => s.status === 'pending');
  const activeShops = filteredShops.filter(s => s.status !== 'pending');

  // Helper to clear filters
  const clearFilters = () => {
      setStatusFilter('all');
      setCategoryFilter('all');
      setSearch('');
      setIsFilterOpen(false);
  };

  const activeFilterCount = (statusFilter !== 'all' ? 1 : 0) + (categoryFilter !== 'all' ? 1 : 0);

  // Determine chart data based on selection
  const currentChartData = chartRange === '7' ? shopPerformanceData : shopPerformanceData30Days;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Shops</h1>
      </div>

      {/* Analysis Graph (Placed at Top) */}
      <AdminChart 
        title="Shop Revenue Trend" 
        data={currentChartData} 
        color="orange" 
        onRangeChange={setChartRange}
      />

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 w-full z-20 relative">
          <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                  type="text" 
                  placeholder="Search shops by name or owner..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm w-full focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
              />
          </div>
          
          <div className="relative">
            <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 ${isFilterOpen ? 'ring-2 ring-orange-500/20 border-orange-500' : ''}`}
            >
                <Filter size={18} />
                <span className="hidden sm:inline">Filters</span>
                {activeFilterCount > 0 && (
                    <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-5">
                        {activeFilterCount}
                    </span>
                )}
                <ChevronDown size={14} className={`transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isFilterOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-30"
                    >
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 block">Status</label>
                                <div className="flex flex-wrap gap-2">
                                    {['all', 'active', 'pending'].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => setStatusFilter(status)}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
                                                statusFilter === status 
                                                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800' 
                                                : 'bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                                            }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 block">Category</label>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setCategoryFilter('all')}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
                                            categoryFilter === 'all' 
                                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800' 
                                            : 'bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                                        }`}
                                    >
                                        All
                                    </button>
                                    {categories.map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setCategoryFilter(cat)}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
                                                categoryFilter === cat 
                                                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800' 
                                                : 'bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                                            }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between">
                                <button 
                                    onClick={clearFilters}
                                    className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline"
                                >
                                    Clear All
                                </button>
                                <button 
                                    onClick={() => setIsFilterOpen(false)}
                                    className="px-4 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold rounded-lg"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
          </div>
      </div>

      {/* NEW REQUESTS SECTION */}
      <div className="space-y-4">
          {/* Only show pending header if we are looking at 'all' or 'pending' status */}
          {(statusFilter === 'all' || statusFilter === 'pending') && (
             <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${pendingShops.length > 0 ? 'bg-orange-500 animate-pulse' : 'bg-gray-300'}`} />
                  New Shop Requests
              </h2>
          )}
          
          {(statusFilter === 'all' || statusFilter === 'pending') && (
            pendingShops.length > 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-orange-200 dark:border-orange-900/30 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-orange-50 dark:bg-orange-900/10 text-orange-800 dark:text-orange-400 uppercase font-medium">
                                <tr>
                                    <th className="px-6 py-4">Shop Name</th>
                                    <th className="px-6 py-4">Owner</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {pendingShops.map((shop) => (
                                    <tr key={shop.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <Link href={`/admin/shops/${shop.id}`} className="flex items-center gap-3 group">
                                                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-500">
                                                    <Store size={20} />
                                                </div>
                                                <span className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                    {shop.name}
                                                </span>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{shop.owner}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-xs font-medium text-gray-600 dark:text-gray-300">
                                                {shop.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                Pending Review
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleApprove(shop.id)} className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors">
                                                    <CheckCircle size={14} /> Approve
                                                </button>
                                                <button onClick={() => handleReject(shop.id)} className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors">
                                                    <XCircle size={14} /> Reject
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* Empty State for Requests */
                <div className="flex flex-col items-center justify-center py-10 bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-3">
                        <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
                    </div>
                    <p className="text-gray-900 dark:text-white font-medium">No Pending Requests</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {statusFilter === 'pending' ? "No pending shops found." : "All shop applications have been processed."}
                    </p>
                </div>
            )
          )}
      </div>

      {/* ACTIVE SHOPS SECTION */}
      <div className="space-y-4">
        {(statusFilter === 'all' || statusFilter === 'active') && (
             <h2 className="text-lg font-bold text-gray-900 dark:text-white">All Active Shops</h2>
        )}
        
        {(statusFilter === 'all' || statusFilter === 'active') && (
             activeShops.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 uppercase font-medium">
                            <tr>
                                <th className="px-6 py-4">Shop Name</th>
                                <th className="px-6 py-4">Owner</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Revenue</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {activeShops.map((shop) => (
                                <tr key={shop.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <Link href={`/admin/shops/${shop.id}`} className="flex items-center gap-3 group">
                                            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600">
                                                <Store size={20} />
                                            </div>
                                            <div>
                                                <span className="font-semibold text-gray-900 dark:text-white block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                    {shop.name}
                                                </span>
                                                <span className="text-xs text-gray-500">{shop.orders} orders</span>
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{shop.owner}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-xs font-medium text-gray-600 dark:text-gray-300">
                                            {shop.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                        {shop.revenue}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                                            shop.status === 'active' 
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                        }`}>
                                            {shop.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/admin/shops/${shop.id}`}>
                                                <button className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors" title="View Details">
                                                    <Eye size={16} />
                                                </button>
                                            </Link>
                                            <button onClick={() => handleDelete(shop.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Delete Shop">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        ) : (
            /* Empty State for Active Shops */
            <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    <Inbox className="text-gray-400 dark:text-gray-500" size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">No Active Shops</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs text-center mt-1">
                    {search ? `No shops match "${search}"` : "There are no active shops on the platform yet."}
                </p>
                {search && (
                    <button 
                        onClick={() => setSearch('')}
                        className="mt-4 text-sm text-indigo-600 hover:underline font-medium"
                    >
                        Clear Search
                    </button>
                )}
            </div>
        ))}
      </div>
    </div>
  );
}