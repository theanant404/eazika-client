"use client";

import { useState, useMemo, useEffect, useRef, Suspense } from "react";
import { ArrowRight, Heart, Star, Search, X, Loader2, MapPin, Navigation } from "lucide-react";
import Image from "next/image";
import { BannerCarousel } from "@/app/components/BannerCarousel";
import { motion, Variants, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useWishlistStore } from "@/hooks/useWishlistStore";
import { useCartStore } from "@/store";
import { useLocationStore } from "@/store/locationStore"; // IMPORT STORE
import coustomerService from "@/services/customerService";
import type { ProductType, Category } from "@/types";
import { categories as mockCategories } from "@/app/data/mockData";

// Animation Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
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

const INITIAL_PRODUCT_COUNT = 4;
const LOAD_MORE_COUNT = 4;

export default function HomePage() {
  const [visibleProductCount, setVisibleProductCount] = useState(
    INITIAL_PRODUCT_COUNT
  );
  // Gate UI until client hydration (zustand persist rehydrates after mount)
  const [hydrated, setHydrated] = useState(false);
  const { toggleWishlist, isWishlisted } = useWishlistStore();
  const { isLoading: isCartLoading } = useCartStore();
  const {
    currentCity,
    isLocationVerified,
    supportedCities,
    fetchSupportedCities,
    setLocation,
    setGeoLocation,
  } = useLocationStore(); // GET CITY
  // console.log("Location Store:", { currentCity, isLocationVerified, supportedCities });
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cityInput, setCityInput] = useState("");
  const [detecting, setDetecting] = useState(false);

  const [categories, setCategories] = useState<Category[]>([
    {
      id: 0,
      name: "Loading",
      slug: "loading",
      icon: undefined,
      image: undefined,
    },
  ]);
  const [products, setProducts] = useState<ProductType[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<ProductType[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const observerTarget = useRef(null);

  useEffect(() => {
    setIsClient(true);
    // Mark hydrated so we can rely on persisted store values
    setHydrated(true);
  }, []);

  // Load supported cities once on client
  useEffect(() => {
    if (!isClient) return;
    fetchSupportedCities();
  }, [isClient, fetchSupportedCities]);

  // UPDATED: Fetch data only when city is verified
  useEffect(() => {
    if (!isClient || !isLocationVerified || !currentCity) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [catsData, prodsData] = await Promise.all([
          coustomerService.getCategories(),
          // PASS CITY TO API
          coustomerService.getProducts(1, 20, currentCity),
        ]);

        // Map icons manually since backend doesn't send component references
        const mappedCategories = (catsData?.length ? catsData : mockCategories).map((cat: any) => {
          const match = mockCategories.find(
            (m) =>
              m.name.toLowerCase() === (cat.name ?? "").toLowerCase() ||
              (cat.name ?? "").toLowerCase().includes(m.slug) ||
              m.slug.includes((cat.name ?? "").toLowerCase())
          );
          return {
            ...cat,
            icon: match ? match.icon : cat.icon,
          };
        });

        setCategories(mappedCategories);
        setProducts(prodsData.products);
      } catch (error) {
        console.error("Failed to load home data", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isClient, isLocationVerified, currentCity]);

  // Search Logic with Database Tracking
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchSuggestions([]);
      return;
    }
    const lowerQuery = searchQuery.toLowerCase();
    const matches = products.filter(
      (product) =>
        product.name.toLowerCase().includes(lowerQuery) ||
        product.category.toLowerCase().includes(lowerQuery)
    );
    setSearchSuggestions(matches.slice(0, 5));

    // Track search in database (debounced)
    const trackingTimer = setTimeout(async () => {
      try {
        await coustomerService.trackSearch({
          searchQuery,
          location: currentCity ?? undefined,
          resultsCount: matches.length,
          metadata: {
            hasResults: matches.length > 0,
            productIds: matches.slice(0, 5).map((p) => p.id),
          },
        });
      } catch (error) {
        console.error("Failed to track search:", error);
      }
    }, 10000); // Track after 1 second of inactivity

    return () => clearTimeout(trackingTimer);
  }, [searchQuery, products, currentCity]);

  const visibleProducts = useMemo(() => {
    // console.log("Calculating visible products:", { productsLength: products?.length, visibleProductCount });
    return products?.slice(0, visibleProductCount);
  }, [products, visibleProductCount]);

  const hasMoreProducts = visibleProductCount < products?.length;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreProducts) {
          setVisibleProductCount((prev) => prev + LOAD_MORE_COUNT);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMoreProducts, isLoading]);

  // Handle location selection UI before loading products
  // Avoid showing selection UI until client hydration completes (persisted store ready)
  if (!hydrated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={28} />
      </div>
    );
  }

  if (!isLocationVerified) {
    const normalizedSupported = supportedCities ?? [];

    const handleCitySelect = (city: string) => {
      setCityInput(city);
    };

    const handleSaveCity = () => {
      const city = (cityInput || normalizedSupported[0] || "").trim();
      if (!city) return;
      setLocation(city);
      setGeoLocation(null);
    };

    const handleUseMyLocation = () => {
      setDetecting(true);
      if (!navigator.geolocation) {
        setDetecting(false);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const resp = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await resp.json();
            const detectedCity =
              data.address?.city ||
              data.address?.town ||
              data.address?.village ||
              data.address?.county;
            if (detectedCity) {
              const formatted = detectedCity.trim();
              setLocation(formatted);
              setGeoLocation({ lat: latitude, lng: longitude });
              setCityInput(formatted);
            }
          } catch (error) {
            console.error("Detect location failed", error);
          } finally {
            setDetecting(false);
          }
        },
        (error) => {
          console.error("Geolocation error", error);
          setDetecting(false);
        }
      );
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          {/* Logo/Brand Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg mb-4">
              <MapPin size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome to Eazika</h1>
            <p className="text-gray-600 dark:text-gray-400">Discover local shops near you</p>
          </div>

          {/* City Selection Card */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 p-8 space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Select your city</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Choose your location to see nearby shops and products</p>
            </div>

            {/* Selected City Display */}
            {cityInput && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-4 border-2 border-yellow-300 dark:border-yellow-600"
              >
                <div className="flex items-center justify-center gap-2">
                  <MapPin size={20} className="text-yellow-600 dark:text-yellow-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Selected City:</p>
                  <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{cityInput}</p>
                </div>
              </motion.div>
            )}

            {/* Available Cities */}
            {normalizedSupported.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Available Cities</p>
                <div className="flex flex-wrap gap-2">
                  {normalizedSupported.map((city) => (
                    <motion.button
                      key={city}
                      onClick={() => handleCitySelect(city)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-4 py-2.5 rounded-full text-sm font-medium border-2 transition-all ${cityInput === city
                        ? "border-yellow-500 text-white bg-gradient-to-r from-yellow-500 to-orange-500 shadow-md"
                        : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                        }`}
                    >
                      {city}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Manual City Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <MapPin size={16} className="text-yellow-500" />
                Or enter your city manually
              </label>
              <input
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                placeholder={normalizedSupported[0] || "Enter your city name"}
                className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3.5 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-500/20 transition-all"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 flex-col sm:flex-row pt-2">
              <button
                onClick={handleUseMyLocation}
                disabled={detecting}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-3.5 hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {detecting ? <Loader2 className="animate-spin" size={18} /> : <Navigation size={18} />}
                {detecting ? "Detecting..." : "Use my location"}
              </button>
              <button
                onClick={handleSaveCity}
                disabled={!cityInput.trim()}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-3.5 hover:from-yellow-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MapPin size={18} />
                Save & Continue
              </button>
            </div>

            {/* Help Text */}
            <p className="text-xs text-center text-gray-500 dark:text-gray-400 pt-2">
              We'll show you shops and products available in <span className="font-semibold text-yellow-600 dark:text-yellow-400">{cityInput || "your city"}</span>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen pb-24">
      <motion.div
        className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Search Bar Section */}
        <motion.section variants={itemVariants} className="relative z-20">
          <div className="relative">
            <div className="relative group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                placeholder="Search your product..."
                className="w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-full py-3.5 pl-12 pr-4 text-base text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all shadow-sm"
              />
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-yellow-500 transition-colors pointer-events-none"
                size={20}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <AnimatePresence>
              {isSearchFocused && searchQuery && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden max-h-60 overflow-y-auto z-50"
                >
                  {searchSuggestions.length > 0 ? (
                    <ul>
                      {searchSuggestions.map((product) => (
                        <li key={product.id}>
                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              // Track product click from search
                              try {
                                await coustomerService.trackSearch({
                                  searchQuery,
                                  location: currentCity ?? undefined,
                                  resultsCount: searchSuggestions.length,
                                  selectedProductId: typeof product.id === 'number' ? product.id : Number(product.id),
                                  metadata: {
                                    action: "product_clicked",
                                    resultPosition: searchSuggestions.indexOf(product),
                                  },
                                });
                              } catch (error) {
                                console.error("Failed to track product click:", error);
                              }
                              // Navigate to product
                              window.location.href = `/products/${product.id}`;
                            }}
                            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-0"
                          >
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-700">
                              {product.images && product.images.length > 0 && (
                                <Image
                                  src={product.images[0]}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {product.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {product.category}
                              </p>
                            </div>
                            <div className="text-sm font-bold text-yellow-600 dark:text-yellow-500">
                              ₹
                              {product.prices && product.prices.length > 0
                                ? product.prices[0].price
                                : "N/A"}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No products found for {searchQuery}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.section>

        {/* Banners Carousel */}
        <motion.div variants={itemVariants}>
          <BannerCarousel />
        </motion.div>

        {/* Categories Carousel */}
        <motion.section variants={itemVariants}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Categories
            </h2>
            <Link
              href="/categories"
              className="flex items-center text-yellow-600 dark:text-yellow-500 hover:text-yellow-700 transition-colors"
            >
              <span className="text-sm font-semibold">See All</span>
              <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
          <div className="relative">
            <motion.div
              key={isLoading ? "loading" : "loaded"}
              className="flex space-x-4 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {isLoading
                ? // Loading Skeletons
                [1, 2, 3, 4, 5].map((i) => (
                  <motion.div
                    key={i}
                    variants={itemVariants}
                    className="flex flex-col items-center space-y-2 shrink-0"
                  >
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
                    <div className="w-12 h-3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                  </motion.div>
                ))
                : categories.map((category) => {
                  const Icon = typeof category.icon === "function" ? category.icon : undefined;

                  return (
                    <Link
                      href={`/categories`}
                      key={category.id}
                    >
                      <motion.div
                        className="flex flex-col items-center space-y-2 text-center group cursor-pointer shrink-0"
                        variants={itemVariants}
                        whileTap={{ scale: 0.95 }}
                      >
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center group-hover:border-yellow-500 dark:group-hover:border-yellow-500 transition-colors duration-200 overflow-hidden relative">
                          {category.image ? (
                            <Image
                              src={category.image}
                              alt={category.name}
                              fill
                              className="object-cover"
                            />
                          ) : Icon ? (
                            <Icon
                              size={32}
                              className="text-gray-400 dark:text-gray-500 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors"
                            />
                          ) : (
                            <div className="text-2xl font-bold text-gray-400">
                              {category.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <span className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 w-20 truncate">
                          {category.name}
                        </span>
                      </motion.div>
                    </Link>
                  );
                })}
            </motion.div>
          </div>
        </motion.section>

        {/* Products Section */}
        <motion.section variants={itemVariants}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              All Products
            </h2>
          </div>

          {products.length === 0 && !isLoading ? (
            <div className="col-span-full text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
              <p className="text-gray-500 text-lg">
                No products found in{" "}
                <span className="font-bold text-gray-900 dark:text-white">
                  {currentCity}
                </span>
                .
              </p>
              <p className="text-sm text-gray-400 mt-2">
                We are expanding soon!
              </p>
            </div>
          ) : (
            <motion.div
              key={isLoading ? "products-loading" : "products-loaded"}
              className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <Suspense
                fallback={
                  <>
                    {[1, 2, 3, 4].map((i) => (
                      <motion.div
                        key={i}
                        variants={itemVariants}
                        className="bg-white dark:bg-gray-800 rounded-2xl h-64 animate-pulse border border-gray-100 dark:border-gray-700"
                      />
                    ))}
                  </>
                }
              >
                {visibleProducts.map((item) => {
                  const liked = isClient
                    ? isWishlisted(item.id.toString())
                    : false;
                  return (
                    <ProductCard
                      key={item.id}
                      product={item}
                      liked={liked}
                      toggleWishlist={toggleWishlist}
                      isCartLoading={isCartLoading}
                    />
                  );
                })}
              </Suspense>
            </motion.div>
          )}
        </motion.section>

        {/* Scroll Observer Sentinel */}
        {hasMoreProducts && !isLoading && (
          <div
            ref={observerTarget}
            className="h-10 w-full flex justify-center items-center"
          >
            <Loader2 className="animate-spin text-gray-400" size={24} />
          </div>
        )}
      </motion.div>
    </div>
  );
}

const ProductCard = ({
  product,
  liked,
  toggleWishlist,
  isCartLoading,
}: {
  product: ProductType;
  liked: boolean;
  toggleWishlist: (productId: string) => void;
  isCartLoading: boolean;
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
          {product.images.length > 0 ? (
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
              {product.rating || "4.0"}
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
              disabled={isCartLoading}
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
