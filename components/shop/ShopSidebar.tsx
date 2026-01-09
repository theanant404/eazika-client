"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  Users,
  User,
  Store,
  History,
  Settings,
  Menu,
  X,
} from "lucide-react";

import LogoutButton from "@/components/LogoutButton";

export const menuItems = [
  // { name: "Orders", href: "/shop/orders", icon: ShoppingBag },
  // { name: "Analysis", href: "/shop/analysis", icon: BarChart3 },
  { name: "Dashboard", href: "/shop", icon: LayoutDashboard },
  { name: "Products", href: "/shop/products", icon: Package },
  { name: "History", href: "/shop/history", icon: History },
  { name: "Riders", href: "/shop/riders", icon: Users },
  { name: "Shop Settings", href: "/shop/settings", icon: Settings },
];
export function ShopSidebar() {
  const pathname = usePathname() || "";
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  const closeMobileSheet = () => setIsMobileSheetOpen(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen fixed left-0 top-0 hidden md:flex flex-col z-30">
        {/* Logo / Brand */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <Link href="/shop" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-yellow-500/20">
              <Store size={20} />
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-900 dark:text-white leading-none">
                Eazika
              </h1>
              <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                Seller Hub
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/shop"
                ? pathname === "/shop"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                  ? "bg-yellow-50 dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
              >
                <Icon
                  size={20}
                  className={
                    isActive
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                  }
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer / User */}
        <footer className="p-4 border-t border-gray-100 dark:border-gray-800">
          <LogoutButton />
        </footer>
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileSheetOpen(!isMobileSheetOpen)}
        className="md:hidden fixed top-2 right-4 z-40 p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        title="Toggle menu"
      >
        <Menu size={24} className="text-gray-700 dark:text-gray-200" />
      </button>

      {/* Mobile Sheet Overlay */}
      {isMobileSheetOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={closeMobileSheet}
        />
      )}

      {/* Mobile Side Sheet */}
      <aside
        className={`md:hidden fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-50 flex flex-col transition-transform duration-300 ease-in-out ${isMobileSheetOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* Header with Close Button */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <Link href="/shop" className="flex items-center gap-3 flex-1" onClick={closeMobileSheet}>
            <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-yellow-500/20">
              <Store size={20} />
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-900 dark:text-white leading-none">
                Eazika
              </h1>
              <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                Seller Hub
              </span>
            </div>
          </Link>
          <button
            onClick={closeMobileSheet}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-700 dark:text-gray-200" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/shop"
                ? pathname === "/shop"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileSheet}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                  ? "bg-yellow-50 dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
              >
                <Icon
                  size={20}
                  className={
                    isActive
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                  }
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer / User */}
        <footer className="p-4 border-t border-gray-100 dark:border-gray-800">
          <LogoutButton />
        </footer>
      </aside>
    </>
  );
}
