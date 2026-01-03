"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import { Search, ArrowLeft, Loader2, ArrowRight, Heart, Star } from "lucide-react";
import { ShopService, Category, shopService } from "@/services/shopService";
import { categories as mockCategories } from "@/app/data/mockData";
import Image from "next/image";
import coustomerServices from "@/services/customerService";
import { useWishlistStore } from "@/hooks/useWishlistStore";
import Link from "next/link";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100 },
  },
};

export default function CategoriesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [products, setProducts] = useState<any[]>([]); // Replace any with your Product type if available
  const { toggleWishlist, isWishlisted } = useWishlistStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        const data = await coustomerServices.getCategories();
        // console.log("Fetched categories:", data);
        const list = Array.isArray(data) && data.length > 0 ? data : mockCategories;
        const mapped = list.map((cat: any) => {
          const icon = typeof cat.icon === "function" ? cat.icon : undefined;
          return { ...cat, icon };
        });
        setCategories(mapped as Category[]);
      } catch (error) {
        console.error("Failed to load categories", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Fetch all products or by category
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        let data;
        if (activeTab === "all") {
          data = await coustomerServices.filterProducts("");
          setProducts(data.products || []);
        } else {
          // You may need to implement getProductsByCategory in your ShopService
          data = await coustomerServices.filterProducts(activeTab);
          // console.log("Fetched products for category", activeTab, data);
          setProducts(data.products || []);
        }
      } catch (error) {
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [activeTab]);
  // console.log(activeTab, "active tabs")

  // Tabs: All + each category
  const tabs = useMemo(() => [
    { id: "all", name: "All" },
    ...categories.map((cat) => ({ id: cat.id.toString(), name: cat.name, icon: cat.icon })),
  ], [categories]);

  // Filtered products by search
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    return products.filter((p) =>
      p.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header & Search */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="md:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Categories
          </h1>
        </div>

        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-yellow-500/50 outline-none transition-all shadow-sm"
          />
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
        </div>
      </div>

      {/* Tabs and Products Grid */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Vertical Tabs for large screens */}
        <div className="md:w-56 flex md:flex-col gap-2 md:gap-0 md:space-y-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap shrink-0 md:w-full md:justify-start md:text-left ${activeTab === tab.id
                ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
            >
              {/* {tab.icon && typeof tab.icon === "function" && (
                <span className="w-5 h-5 flex items-center justify-center">
                  <tab.icon size={18} />
                </span>
              )} */}
              {tab.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-yellow-500" size={32} />
            </div>
          ) : filteredProducts.length > 0 ? (
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredProducts.map((product) => {
                const liked = isClient ? isWishlisted(product.id.toString()) : false;
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    liked={liked}
                    toggleWishlist={toggleWishlist}
                  />
                );
              })}
            </motion.div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No products found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const ProductCard = ({
  product,
  liked,
  toggleWishlist,
}: {
  product: any;
  liked: boolean;
  toggleWishlist: (productId: string) => void;
}) => {
  return (
    <Link href={`/products/${product.id}`}>
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden group h-full flex flex-col"
        variants={itemVariants}
        layout
        whileHover={{ y: -5 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <div className="relative w-full aspect-square bg-gray-100 dark:bg-gray-700">
          {product.images && product.images.length > 0 ? (
            <Image
              src={product.images[0]}
              height={400}
              width={400}
              alt={product.name}
              className="group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
              No Image
            </div>
          )}

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(product.id.toString());
            }}
            className={`absolute top-2 right-2 p-2 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm transition-all shadow-sm z-10 ${liked ? "text-red-500" : "text-gray-400 hover:text-red-500"
              }`}
          >
            <Heart size={18} className={`${liked ? "fill-current" : ""}`} />
          </button>
        </div>

        <div className="p-3 md:p-4 flex flex-col grow">
          <div className="flex items-center space-x-1 mb-1">
            <Star size={12} className="text-yellow-400 fill-current" />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {product.rating?.average || "0.0"}
            </span>
          </div>
          <h3 className="text-sm md:text-base font-medium text-gray-800 dark:text-gray-200 line-clamp-2 mb-2">
            {product.name}
          </h3>
          <div className="mt-auto flex items-center justify-between">
            <p className="text-base md:text-lg font-bold text-gray-900 dark:text-white">
              ₹
              {product.prices && product.prices.length > 0
                ? product.prices[0].price
                : "N/A"}
            </p>
            <button
              className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 group-hover:bg-yellow-500 group-hover:text-white transition-colors"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};
