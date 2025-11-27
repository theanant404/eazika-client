"use client";

import React, { useState, useEffect } from 'react';
import { 
    Search, 
    Plus, 
    MoreVertical, 
    Package, 
    Globe, 
    Box, 
    Loader2,
    Trash2,
    Edit,
    EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useShopProductStore } from '@/hooks/useShopProductStore';

const TABS = [
    { id: 'inventory', label: 'Inventory', icon: Box },
    { id: 'global', label: 'Global Catalog', icon: Globe },
    { id: 'my_products', label: 'My Products', icon: Package },
];

export default function ProductsPage() {
    const { 
        products, 
        isLoading, 
        activeTab, 
        setTab, 
        fetchProducts, 
        updateStock, 
        toggleVisibility,
        deleteProduct,
        addProductFromGlobal
    } = useShopProductStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = () => setMenuOpenId(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        // Ensure full width but no overflow
        <div className="space-y-4 md:space-y-6 w-full max-w-full">
            {/* --- Header Section --- */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage inventory & catalog</p>
                </div>
                <Link href="/shop/products/new" className="w-full md:w-auto">
                    <button className="w-full md:w-auto bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-yellow-500/20 transition-transform active:scale-95 flex items-center justify-center gap-2 text-sm">
                        <Plus size={20} /> Add New Product
                    </button>
                </Link>
            </div>

            {/* --- Controls Section (Search & Tabs) --- */}
            <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col gap-3 md:flex-row-reverse md:items-center w-full">
                
                {/* Search Bar */}
                <div className="relative w-full md:flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search products..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-yellow-500 outline-none transition-all"
                    />
                </div>

                {/* Tabs */}
                <div className="w-full md:w-auto max-w-full overflow-x-auto no-scrollbar">
                    <div className="flex gap-2 pb-1 md:pb-0 min-w-max">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap border ${
                                        isActive 
                                        ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900' 
                                        : 'bg-gray-50 text-gray-500 border-gray-100 dark:bg-gray-700/30 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-100'
                                    }`}
                                >
                                    <Icon size={16} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* --- Product Grid --- */}
            <div className="min-h-[300px]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Loader2 className="animate-spin text-yellow-500" size={32} />
                        <p className="text-sm text-gray-400">Loading your inventory...</p>
                    </div>
                ) : filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <AnimatePresence mode='popLayout'>
                            {filteredProducts.map((product) => (
                                <motion.div
                                    key={product.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={`bg-white dark:bg-gray-800 rounded-2xl p-3 md:p-4 border shadow-sm transition-all w-full ${
                                        !product.isActive && activeTab === 'inventory' 
                                        ? 'border-red-200 dark:border-red-900/30 opacity-80' 
                                        : 'border-gray-100 dark:border-gray-700'
                                    }`}
                                >
                                    <div className="flex gap-3 md:gap-4">
                                        {/* Product Image */}
                                        <div className="relative w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden shrink-0 self-start">
                                            <Image src={product.images[0]} alt={product.name} layout="fill" objectFit="cover" />
                                            {activeTab === 'inventory' && (product.stock === 0 || !product.isActive) && (
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[1px]">
                                                    <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded">
                                                        {!product.isActive ? "OFFLINE" : "OOS"}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Details Column */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                            <div>
                                                <div className="flex justify-between items-start mb-1">
                                                    <h3 className="font-bold text-gray-900 dark:text-white text-sm md:text-base line-clamp-2 leading-tight mr-6" title={product.name}>
                                                        {product.name}
                                                    </h3>
                                                    
                                                    {/* 3-Dots Menu */}
                                                    <div className="relative">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setMenuOpenId(menuOpenId === product.id ? null : product.id);
                                                            }}
                                                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 -mt-1.5 -mr-1.5 rounded-full active:bg-gray-100 dark:active:bg-gray-700"
                                                        >
                                                            <MoreVertical size={18} />
                                                        </button>

                                                        {/* Dropdown */}
                                                        {menuOpenId === product.id && (
                                                            <div className="absolute right-0 top-6 bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-100 dark:border-gray-700 py-1 z-20 w-36 animate-in fade-in zoom-in-95 duration-150 origin-top-right">
                                                                <button className="w-full text-left px-4 py-3 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                                                                    <Edit size={14} /> Edit Product
                                                                </button>
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        toggleVisibility(product.id);
                                                                        setMenuOpenId(null);
                                                                    }}
                                                                    className="w-full text-left px-4 py-3 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                                                                >
                                                                    <EyeOff size={14} /> {product.isActive ? 'Mark Offline' : 'Mark Online'}
                                                                </button>
                                                                <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        deleteProduct(product.id);
                                                                        setMenuOpenId(null);
                                                                    }}
                                                                    className="w-full text-left px-4 py-3 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                                                >
                                                                    <Trash2 size={14} /> Delete
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{product.category}</p>
                                            </div>
                                            
                                            <div className="mt-3 flex flex-wrap items-end justify-between gap-y-2">
                                                <span className="font-bold text-gray-900 dark:text-white text-base md:text-lg">₹{product.price}</span>
                                                
                                                {activeTab === 'inventory' || activeTab === 'my_products' ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 h-8">
                                                            <button 
                                                                onClick={() => updateStock(product.id, product.stock - 1)}
                                                                className="w-8 h-full hover:bg-gray-200 dark:hover:bg-gray-700 rounded-l-lg text-gray-600 dark:text-gray-400 flex items-center justify-center active:bg-gray-300"
                                                            >
                                                                -
                                                            </button>
                                                            <span className="px-1 text-xs font-bold min-w-6 text-center">{product.stock}</span>
                                                            <button 
                                                                onClick={() => updateStock(product.id, product.stock + 1)}
                                                                className="w-8 h-full hover:bg-gray-200 dark:hover:bg-gray-700 rounded-r-lg text-gray-600 dark:text-gray-400 flex items-center justify-center active:bg-gray-300"
                                                            >
                                                                +
                                                            </button>
                                                        </div>

                                                        <button 
                                                            onClick={() => toggleVisibility(product.id)}
                                                            className={`h-8 w-10 rounded-lg flex items-center justify-center transition-colors ${
                                                                product.isActive 
                                                                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                                                                : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                                            }`}
                                                        >
                                                            <EyeOff size={16} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={() => addProductFromGlobal(product)}
                                                        className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 active:scale-95"
                                                    >
                                                        <Plus size={14} /> Add
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <Package size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">No Products Found</h3>
                        <p className="text-sm text-gray-500 max-w-xs mx-auto mt-2">Try searching for something else or add a new product to your inventory.</p>
                    </div>
                )}
            </div>
        </div>
    );
}