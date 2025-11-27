"use client";

import React, { useState, useMemo, useEffect } from "react";
import { ArrowRight, Heart, ChevronRight, Star, Search, X } from "lucide-react";
import Image from "next/image";
import { BannerCarousel } from "@/app/components/BannerCarousel";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { categories, products as allProducts } from "@/app/data/mockData";
import Link from "next/link";
import { useWishlistStore } from "@/hooks/useWishlistStore";

// Animation Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
    },
  },
};

const INITIAL_PRODUCT_COUNT = 4;
const LOAD_MORE_COUNT = 4;

export default function HomePage() {
  const [visibleProductCount, setVisibleProductCount] = useState(INITIAL_PRODUCT_COUNT);
  const { toggleWishlist, isWishlisted } = useWishlistStore();
  const [isClient, setIsClient] = useState(false);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<typeof allProducts>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Search Logic
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchSuggestions([]);
      return;
    }
    const lowerQuery = searchQuery.toLowerCase();
    const matches = allProducts.filter(product => 
      product.name.toLowerCase().includes(lowerQuery) || 
      product.category.toLowerCase().includes(lowerQuery)
    );
    setSearchSuggestions(matches.slice(0, 5)); // Limit to 5 suggestions
  }, [searchQuery]);

  const handleLoadMore = () => {
    setVisibleProductCount(prevCount => prevCount + LOAD_MORE_COUNT);
  };

  const visibleProducts = useMemo(() => {
    return allProducts.slice(0, visibleProductCount);
  }, [visibleProductCount]);

  const hasMoreProducts = visibleProductCount < allProducts.length;

  return (
    <div className="min-h-screen overflow-hidden">
      <motion.div
        className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >


        {/* Banners Carousel */}
        <motion.div variants={itemVariants}>
            <BannerCarousel />
        </motion.div>

        {/* Categories Carousel */}
        <motion.section variants={itemVariants}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Categories</h2>
            <Link href="/categories" className="flex items-center text-yellow-600 dark:text-yellow-500 hover:text-yellow-700 transition-colors">
              <span className="text-sm font-semibold">See All</span>
              <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
          <div className="relative">
            <motion.div
              className="flex space-x-4 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar"
              variants={containerVariants}
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <Link href={`/categories/${category.slug}`} key={category.id}>
                    <motion.div
                      className="flex flex-col items-center space-y-2 text-center group cursor-pointer shrink-0"
                      variants={itemVariants}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center group-hover:border-yellow-500 dark:group-hover:border-yellow-500 transition-colors duration-200">
                        <Icon size={28} className="text-gray-700 dark:text-gray-300 group-hover:text-yellow-600 dark:group-hover:text-yellow-500 transition-colors" />
                      </div>
                      <span className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 w-20 truncate">{category.name}</span>
                    </motion.div>
                  </Link>
                );
              })}
            </motion.div>
          </div>
        </motion.section>

        {/* Search Bar Section */}
        <motion.section variants={itemVariants} className="relative z-20">
          <div className="relative">
            <div className="relative group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)} // Delay to allow click
                placeholder="Search your product..."
                className="w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-full py-3.5 pl-12 pr-4 text-base text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all shadow-sm"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-yellow-500 transition-colors" size={20} />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Search Suggestions Dropdown */}
            <AnimatePresence>
              {isSearchFocused && searchQuery && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden max-h-60 overflow-y-auto"
                >
                  {searchSuggestions.length > 0 ? (
                    <ul>
                      {searchSuggestions.map((product) => (
                        <li key={product.id}>
                          <Link 
                            href={`/products/${product.id}`}
                            className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-0"
                          >
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-700">
                              <Image src={product.images[0]} alt={product.name} layout="fill" objectFit="cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{product.category}</p>
                            </div>
                            <div className="text-sm font-bold text-yellow-600 dark:text-yellow-500">
                              ₹{product.price}
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No products found for "{searchQuery}"
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.section>

        {/* Products Section */}
        <motion.section variants={itemVariants}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Fresh Arrivals</h2>
             <Link href="/trending" className="flex items-center text-yellow-600 dark:text-yellow-500 hover:text-yellow-700 transition-colors">
                           <span className="text-sm font-semibold">See All</span>
              <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
            variants={containerVariants}
          >
            {visibleProducts.map((item) => {
              const liked = isClient ? isWishlisted(item.id) : item.liked; 
              return (
                <Link href={`/products/${item.id}`} key={item.id}>
                  <motion.div
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden group h-full flex flex-col"
                    variants={itemVariants}
                    layout
                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {/* Image Container */}
                    <div className="relative w-full aspect-square bg-gray-100 dark:bg-gray-700">
                      <Image 
                        src={item.images[0]} 
                        layout="fill" 
                        objectFit="cover" 
                        alt={item.name} 
                        className="group-hover:scale-105 transition-transform duration-500"
                      />
                      
                      {/* REMOVED: Trending Badge */}

                      <button 
                        onClick={(e) => {
                          e.preventDefault(); 
                          e.stopPropagation();
                          toggleWishlist(item.id);
                        }}
                        className={`absolute top-2 right-2 p-2 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm transition-all shadow-sm z-10 ${ 
                          liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                        }`}
                      >
                        <Heart size={18} className={`${liked ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                    
                    {/* Product Details */}
                    <div className="p-3 md:p-4 flex flex-col grow">
                        <div className="flex items-center space-x-1 mb-1">
                            <Star size={12} className="text-yellow-400 fill-current" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">{item.rating}</span>
                        </div>
                        <h3 className="text-sm md:text-base font-medium text-gray-800 dark:text-gray-200 line-clamp-2 mb-2">{item.name}</h3>
                        <div className="mt-auto flex items-center justify-between">
                             {/* Price Formatted */}
                             <p className="text-base md:text-lg font-bold text-gray-900 dark:text-white">
                                ₹{item.price.toFixed(2)}
                             </p>
                             <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 group-hover:bg-yellow-500 group-hover:text-white transition-colors">
                                 <ArrowRight size={16} />
                             </div>
                        </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </motion.div>
        </motion.section>

        {/* Load More Button */}
        {hasMoreProducts && (
          <motion.div variants={itemVariants} className="pt-4 pb-8">
              <button 
                onClick={handleLoadMore}
                className="w-full max-w-xs mx-auto bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold py-3 rounded-full hover:opacity-90 transition-opacity duration-300 flex items-center justify-center shadow-lg"
              >
                  Load More
                  <ChevronRight size={20} className="ml-2" />
              </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}