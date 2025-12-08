"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShopSidebar } from "@/app/components/ShopSidebar";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  User,
  Menu,
  Store,
  BarChart3,
  Users,
  History,
} from "lucide-react";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const mobileNavItems = [
    { name: "Home", href: "/shop", icon: LayoutDashboard },
    { name: "Analysis", href: "/shop/analysis", icon: BarChart3 },
    { name: "Products", href: "/shop/products", icon: Package },
    // { name: 'Orders', href: '/shop/orders', icon: ShoppingBag },
    { name: "History", href: "/shop/history", icon: History },
    { name: "Riders", href: "/shop/riders", icon: Users },
    { name: "Profile", href: "/shop/detail", icon: User },
  ];

  return (
    // FIX 1: h-screen and overflow-hidden prevents the whole page from scrolling (body scroll)
    // This ensures the header and footer stay fixed while 'main' scrolls independently.
    <div className="h-screen w-full bg-gray-50 dark:bg-gray-900 flex overflow-hidden">
      {/* Desktop Sidebar */}
      <ShopSidebar />

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col h-full w-full md:ml-64 transition-all duration-300 relative">
        {/* FIX 2: Header is a flex child, it won't move when 'main' scrolls */}
        <header className="md:hidden z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center text-white shadow-sm">
              <Store size={18} />
            </div>
            <span className="font-bold text-lg text-gray-900 dark:text-white tracking-tight">
              Seller Hub
            </span>
          </div>
        </header>

        {/* FIX 3: 'flex-1' and 'overflow-y-auto' makes ONLY this section scrollable */}
        {/* FIX 4: 'max-w-[100vw]' and 'overflow-x-hidden' stops horizontal scrolling issues */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 pb-24 md:pb-8 w-full max-w-[100vw]">
          {children}
        </main>

        {/* FIX 5: Bottom Nav is fixed to the screen bottom, outside the scrollable main */}
        <nav className="md:hidden absolute bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-safe-area-inset-bottom">
          <div className="flex justify-around items-center h-16 overflow-x-auto no-scrollbar px-1">
            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/shop" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex flex-col items-center justify-center min-w-[60px] h-full space-y-1 transition-all active:scale-95 ${
                    isActive
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  }`}
                >
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[9px] font-medium truncate max-w-[60px]">
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
