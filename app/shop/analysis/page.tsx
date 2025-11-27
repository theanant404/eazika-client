"use client";

import React, { useState, useEffect } from 'react';
import { 
    TrendingUp, 
    DollarSign, 
    ShoppingBag, 
    Users, 
    ArrowUpRight, 
    ArrowDownRight,
    Filter,
    Check,
    ChevronDown,
    Loader2,
    BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShopService, ShopAnalytics } from '@/services/shopService';

const timeRanges = ['Today', 'Last 7 Days', 'Last 30 Days', 'This Year'];
const metricsOptions = [
    { id: 'revenue', label: 'Revenue', color: 'bg-green-500' },
    { id: 'orders', label: 'Orders', color: 'bg-blue-500' }
];

export default function AnalysisPage() {
    const [selectedRange, setSelectedRange] = useState('Last 7 Days');
    const [activeMetric, setActiveMetric] = useState<'revenue' | 'orders'>('revenue');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    
    const [data, setData] = useState<ShopAnalytics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const analyticsData = await ShopService.getAnalytics(selectedRange);
                setData(analyticsData);
            } catch (err) {
                console.error("Failed to fetch analytics", err);
                setError("Failed to load data.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [selectedRange]);

    const chartData = data ? (activeMetric === 'revenue' ? data.revenueChart : data.ordersChart) : [];
    const chartColor = activeMetric === 'revenue' ? 'bg-green-500 group-hover:bg-green-400' : 'bg-blue-500 group-hover:bg-blue-400';

    // Metric Card Helper
    const getMetricConfig = (key: string) => {
        switch(key) {
            case 'revenue': return { icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', title: 'Total Revenue' };
            case 'orders': return { icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', title: 'Total Orders' };
            case 'customers': return { icon: Users, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30', title: 'New Customers' };
            case 'aov': return { icon: TrendingUp, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30', title: 'Avg. Order Value' };
            default: return { icon: BarChart3, color: 'text-gray-600', bg: 'bg-gray-100', title: key };
        }
    };

    if (isLoading) {
        return (
            <div className="h-96 flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-yellow-500" size={40} />
                <p className="text-gray-500 text-sm animate-pulse">Crunching the numbers...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="h-96 flex flex-col items-center justify-center gap-4 text-center px-4">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-500">
                    <BarChart3 size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Unable to load analytics</h3>
                <p className="text-sm text-gray-500">{error || "No data available for this period."}</p>
                <button 
                    onClick={() => setSelectedRange(selectedRange)} // Retry
                    className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-bold hover:opacity-90"
                >
                    Retry
                </button>
            </div>
        );
    }

    const metricsDisplay = [
        { key: 'revenue', value: data.metrics.revenue, change: data.metrics.revenueTrend || '+0%' },
        { key: 'orders', value: data.metrics.orders, change: data.metrics.ordersTrend || '+0%' },
        { key: 'customers', value: data.metrics.customers, change: data.metrics.customersTrend || '+0%' },
        { key: 'aov', value: data.metrics.aov, change: data.metrics.aovTrend || '+0%' },
    ];

    return (
        <div className="space-y-6 pb-20">
            {/* Header & Filter */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Track your shop's performance.</p>
                </div>
                
                {/* Time Range Selector */}
                <div className="flex items-center bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-x-auto no-scrollbar">
                    {timeRanges.map((range) => (
                        <button
                            key={range}
                            onClick={() => setSelectedRange(range)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                                selectedRange === range 
                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm' 
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {metricsDisplay.map((m, index) => {
                    const config = getMetricConfig(m.key);
                    const Icon = config.icon;
                    const isUp = m.change.startsWith('+');
                    
                    return (
                        <motion.div 
                            key={m.key}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white dark:bg-gray-800 p-3 md:p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
                        >
                            <div className="flex justify-between items-start mb-2 md:mb-4">
                                <div className={`p-2 md:p-3 rounded-xl ${config.bg} ${config.color}`}>
                                    <Icon size={16} className="md:w-5 md:h-5" />
                                </div>
                                <span className={`flex items-center text-[10px] md:text-xs font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded-full ${
                                    isUp ? 'bg-green-50 text-green-600 dark:bg-green-900/20' : 'bg-red-50 text-red-600 dark:bg-red-900/20'
                                }`}>
                                    {m.change} 
                                    {isUp ? <ArrowUpRight size={10} className="ml-0.5 md:ml-1" /> : <ArrowDownRight size={10} className="ml-0.5 md:ml-1" />}
                                </span>
                            </div>
                            <h3 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white truncate">{m.value}</h3>
                            <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium truncate">{config.title}</p>
                        </motion.div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="font-bold text-lg text-gray-900 dark:text-white">
                                {activeMetric === 'revenue' ? 'Revenue Overview' : 'Orders Overview'}
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Showing data for {selectedRange}</p>
                        </div>
                        
                        {/* Functional Filter Dropdown */}
                        <div className="relative">
                            <button 
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${
                                    isFilterOpen 
                                    ? 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white' 
                                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                            >
                                <Filter size={16} />
                                <span>Filter</span>
                                <ChevronDown size={14} className={`transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {isFilterOpen && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-20"
                                    >
                                        {metricsOptions.map((option) => (
                                            <button
                                                key={option.id}
                                                onClick={() => {
                                                    setActiveMetric(option.id as 'revenue' | 'orders');
                                                    setIsFilterOpen(false);
                                                }}
                                                className="w-full flex items-center justify-between px-4 py-3 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <span className={activeMetric === option.id ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}>
                                                    {option.label}
                                                </span>
                                                {activeMetric === option.id && <Check size={14} className="text-green-500" />}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                    
                    {/* Bar Chart */}
                    <div className="w-full overflow-x-auto no-scrollbar pb-2">
                         <div className="h-64 flex items-end justify-between gap-2 md:gap-4">
                            {chartData.map((d, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                                    <div className="w-3 md:w-8 bg-gray-100 dark:bg-gray-700 rounded-t-lg relative h-full overflow-hidden max-h-full flex flex-col-reverse">
                                        <motion.div 
                                            key={activeMetric}
                                            className={`w-full rounded-t-lg transition-colors relative ${chartColor}`}
                                            initial={{ height: 0 }}
                                            animate={{ height: `${d.value}%` }}
                                            transition={{ type: 'spring', stiffness: 60, damping: 15, delay: i * 0.05 }}
                                        >
                                            {/* Tooltip */}
                                            <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-lg transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                                {activeMetric === 'revenue' ? '₹' : ''}{d.value}{activeMetric === 'revenue' ? 'k' : ''}
                                            </div>
                                        </motion.div>
                                    </div>
                                    <span className="text-[10px] md:text-xs font-medium text-gray-500 dark:text-gray-400 truncate w-full text-center">
                                        {d.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-6">Top Products</h2>
                    <div className="space-y-6">
                        <AnimatePresence mode='wait'>
                            {data.products.map((product, i) => (
                                <motion.div 
                                    key={product.name} 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-center justify-between group cursor-default"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 text-xs font-bold">
                                            #{i + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-500 transition-colors line-clamp-1">
                                                {product.name}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{product.sales} sold</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">{product.revenue}</span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                    <button className="w-full mt-8 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        View Full Report
                    </button>
                </div>
            </div>
        </div>
    );
}