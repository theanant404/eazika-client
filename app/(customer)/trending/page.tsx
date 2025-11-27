"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, Star, Plus, Flame, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { products } from "@/app/data/mockData";
import { useWishlistStore } from "@/hooks/useWishlistStore";

export default function TrendingPage() {
  const router = useRouter();
  const { toggleWishlist, isWishlisted } = useWishlistStore();

  // Filter for trending items
  const trendingProducts = useMemo(() => {
    return products.filter((p) => p.isTrending);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 pb-24">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => router.back()} 
                    className="md:hidden p-2 -ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                >
                    <ArrowLeft size={24} className="text-gray-800 dark:text-white" />
                </button>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        Trending Deals <Flame className="text-orange-500 fill-orange-500 animate-pulse" />
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Hottest picks of the week
                    </p>
                </div>
            </div>
        </div>

        {/* Products Grid */}
        {trendingProducts.length > 0 ? (
            <motion.div 
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6"
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: { opacity: 0 },
                    visible: {
                        opacity: 1,
                        transition: { staggerChildren: 0.1 }
                    }
                }}
            >
                {trendingProducts.map((product) => {
                    const isLiked = isWishlisted(product.id);
                    
                    return (
                        <motion.div
                            key={product.id}
                            variants={{
                                hidden: { y: 20, opacity: 0 },
                                visible: { y: 0, opacity: 1 }
                            }}
                        >
                            <Link href={`/products/${product.id}`} className="group block h-full">
                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:border-yellow-500/30 dark:hover:border-yellow-500/30 transition-all duration-300 h-full flex flex-col relative overflow-hidden">
                                    
                                    {/* Deal Badge */}
                                    <div className="absolute top-0 left-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-br-xl z-10 flex items-center gap-1">
                                        <TrendingUp size={12} /> HOT
                                    </div>

                                    {/* Wishlist Button */}
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            toggleWishlist(product.id);
                                        }}
                                        className="absolute top-3 right-3 z-10 p-2 bg-white/80 dark:bg-black/40 backdrop-blur-sm rounded-full hover:scale-110 transition-transform"
                                    >
                                        <Heart 
                                            size={18} 
                                            className={isLiked ? "fill-red-500 text-red-500" : "text-gray-500 dark:text-gray-300"} 
                                        />
                                    </button>

                                    {/* Image */}
                                    <div className="relative w-full aspect-square mb-3 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
                                        <Image 
                                            src={product.images[0]} 
                                            alt={product.name}
                                            layout="fill"
                                            objectFit="cover"
                                            className="group-hover:scale-110 transition-transform duration-500"
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 flex flex-col">
                                        <div className="flex items-center gap-1 mb-1">
                                            <Star size={12} className="text-yellow-400 fill-current" />
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{product.rating}</span>
                                        </div>
                                        
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2 group-hover:text-yellow-600 dark:group-hover:text-yellow-500 transition-colors">
                                            {product.name}
                                        </h3>
                                        
                                        <div className="mt-auto flex items-center justify-between">
                                            <div>
                                                <span className="text-base font-bold text-gray-900 dark:text-white">
                                                    ₹{product.price}
                                                </span>
                                                {/* Fake Discount Logic for "Deals" feel */}
                                                <span className="text-xs text-gray-400 line-through ml-2">
                                                    ₹{(product.price * 1.2).toFixed(0)}
                                                </span>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 group-hover:bg-yellow-500 group-hover:text-white transition-colors shadow-sm">
                                                <Plus size={18} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    )
                })}
            </motion.div>
        ) : (
            <div className="flex flex-col items-center justify-center py-20 opacity-60">
                <Flame size={48} className="text-gray-300 mb-4" />
                <p className="text-lg text-gray-500">No trending deals at the moment.</p>
            </div>
        )}
      </div>
    </div>
  );
}