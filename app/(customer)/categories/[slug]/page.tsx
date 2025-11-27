"use client";

import React, { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Heart, Star, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { categories, products } from "@/app/data/mockData";
import { useWishlistStore } from "@/hooks/useWishlistStore";

export default function SingleCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const { toggleWishlist, isWishlisted } = useWishlistStore();
  
  // Get the slug from URL
  const slug = params.slug as string;

  // Find current category info
  const currentCategory = categories.find((c) => c.slug === slug);

  // Filter products belonging to this category
  // Note: In a real app, you'd likely fetch by ID or slug directly. 
  // Here we match mockData names (e.g. 'Fresh Fruits' vs 'fresh-fruits')
  const categoryProducts = useMemo(() => {
    if (!currentCategory) return [];
    return products.filter((p) => p.category === currentCategory.name);
  }, [currentCategory]);

  if (!currentCategory) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
            <h2 className="text-xl font-bold">Category not found</h2>
            <button onClick={() => router.back()} className="text-blue-500 underline">Go Back</button>
        </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
            onClick={() => router.back()} 
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
            <ArrowLeft size={24} className="text-gray-700 dark:text-gray-200" />
        </button>
        <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{currentCategory.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{categoryProducts.length} Products available</p>
        </div>
      </div>

      {/* Products Grid */}
      <motion.div 
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {categoryProducts.map((product) => {
            const isLiked = isWishlisted(product.id);
            return (
                <Link href={`/products/${product.id}`} key={product.id}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow group h-full flex flex-col relative">
                        
                        {/* Wishlist Button */}
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                toggleWishlist(product.id);
                            }}
                            className="absolute top-3 right-3 z-10 p-1.5 bg-white/60 dark:bg-black/20 backdrop-blur-sm rounded-full"
                        >
                            <Heart 
                                size={18} 
                                className={isLiked ? "fill-red-500 text-red-500" : "text-gray-500 dark:text-gray-300"} 
                            />
                        </button>

                        {/* Image */}
                        <div className="relative w-full aspect-square mb-3 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-700">
                            <Image 
                                src={product.images[0]} 
                                alt={product.name}
                                layout="fill"
                                objectFit="cover"
                                className="group-hover:scale-105 transition-transform duration-300"
                            />
                        </div>

                        {/* Info */}
                        <div className="flex-1 flex flex-col">
                            <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100 line-clamp-2 mb-1">
                                {product.name}
                            </h3>
                            <div className="flex items-center gap-1 mb-2">
                                <Star size={12} className="text-yellow-400 fill-current" />
                                <span className="text-xs text-gray-500">{product.rating}</span>
                            </div>
                            
                            <div className="mt-auto flex items-center justify-between">
                                <span className="text-base font-bold text-gray-900 dark:text-white">
                                    ₹{product.price}
                                </span>
                                <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300">
                                    <Plus size={16} />
                                </div>
                            </div>
                        </div>
                    </div>
                </Link>
            )
        })}
      </motion.div>

      {categoryProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 opacity-60">
            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <currentCategory.icon size={40} className="text-gray-400" />
            </div>
            <p className="text-lg text-gray-500">No products found in this category yet.</p>
        </div>
      )}
    </div>
  );
}