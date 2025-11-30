"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Heart, User } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/hooks/useCartStore";
import { useUserStore } from "@/hooks/useUserStore";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  
  // Connect to Stores
  const { cartCount } = useCartStore();
  const { user } = useUserStore();

  useEffect(() => {
    setIsMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Categories", href: "/categories" },
    { name: "Deals", href: "/trending" },
  ];

  // Helper for active state
  const isActive = (path: string) => pathname === path;

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-md border-b border-gray-200/50 dark:border-gray-800/50"
          : "bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border-b border-gray-100/50 dark:border-gray-800/30"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between gap-4">
        {/* --- LEFT SECTION: Logo --- */}
        <div className="flex items-center gap-3 md:gap-6">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:rotate-12 transition-transform">
                E
              </div>
              <span className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                Eazika
              </span>
            </Link>
          </div>
        </div>

        {/* --- CENTER SECTION: Navigation Links (Right Aligned) --- */}
        <nav className="hidden md:flex items-center gap-8 ml-auto mr-4">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`font-medium text-lg transition-colors hover:text-yellow-500 ${
                isActive(link.href)
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* --- RIGHT SECTION: Actions --- */}
        <div className="flex items-center gap-2 md:gap-3">
          
          {/* Wishlist Icon */}
          <Link
            href="/wishlist"
            className={`p-2 rounded-full transition-all hover:scale-105 ${
              isActive("/wishlist")
                ? "text-red-500 bg-red-50 dark:bg-red-900/20" // Active State
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-red-500 dark:hover:text-red-500"
            }`}
          >
            <Heart size={22} strokeWidth={isActive("/wishlist") ? 2.5 : 2} className={isActive("/wishlist") ? "fill-current" : ""} />
          </Link>

          {/* Cart Icon */}
          <Link
            href="/cart"
            className={`p-2 rounded-full transition-all hover:scale-105 relative group ${
              isActive("/cart")
                ? "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20" // Active State
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <ShoppingCart
              size={22}
              strokeWidth={isActive("/cart") ? 2.5 : 2}
              className={!isActive("/cart") ? "group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors" : ""}
            />
            {isMounted && cartCount > 0 && (
              <span className="absolute top-1 right-0.5 h-4 w-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-white dark:ring-gray-900 shadow-sm">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Profile Icon */}
          <Link
            href="/profile"
            className={`flex items-center gap-2 pl-2 pr-1 py-1 rounded-full transition-all border ${
                isActive("/profile")
                ? "border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/10"
                : "border-transparent hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-700"
            }`}
          >
            <div className="w-8 h-8 bg-linear-to-tr from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold shadow-md overflow-hidden relative">
              {isMounted && user ? (
                 user.image ? (
                    <Image src={user.image} alt="Profile" layout="fill" objectFit="cover" />
                 ) : (
                    user.name?.charAt(0).toUpperCase() || "U"
                 )
              ) : (
                 <User size={18} />
              )}
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}