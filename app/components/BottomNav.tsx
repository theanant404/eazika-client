"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid, User } from "lucide-react";
import clsx from "clsx";

export function BottomNav() {
  const pathname = usePathname();

  // HIDE NAV LOGIC:
  // We hide the bottom navigation on Product pages, Cart, and Checkout
  // to prevent overlapping with their specific sticky bottom bars.
  const shouldHideNav = 
    pathname?.startsWith("/products/") || 
    pathname === "/cart" || 
    pathname === "/checkout";

  if (shouldHideNav) {
    return null;
  }

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Category", href: "/categories", icon: Grid },
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-safe-area-inset-bottom">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          
          // FIX: Specific logic for Home vs other routes
          const isActive = item.href === "/" 
            ? pathname === "/" 
            : pathname.startsWith(item.href);
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200",
                isActive
                  ? "text-yellow-500 dark:text-yellow-400"
                  : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              )}
            >
              {/* Icon with conditional sizing/stroke based on active state */}
              <Icon 
                size={24} 
                strokeWidth={isActive ? 2.5 : 2} 
                className={isActive ? "fill-yellow-500/10" : ""}
              />
              <span className={clsx(
                "text-[10px] font-medium",
                isActive ? "font-bold" : ""
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}