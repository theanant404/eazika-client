"use client";

import React, { use, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store } from "lucide-react";
import { ShopSidebar, menuItems as mobileNavItems } from "@/components/shop";
import { cn } from "@/lib/utils";
import ShopService from "@/services/shopService";
export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [shopStatus, setShopStatus] = React.useState<{
    status?: string;
    isActive?: boolean;
  } | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchShopStatus = async () => {
      try {
        const res = await ShopService.getShopStatus();
        // Support both {data, statusCode, ...} and direct {status, isActive}
        if (res && typeof res === "object") {
          if (res.data && typeof res.data === "object") {
            setShopStatus({ status: res.data.status, isActive: res.data.isActive });
          } else {
            setShopStatus({ status: res.status, isActive: res.isActive });
          }
        }
      } catch (e) {
        setShopStatus(null);
      } finally {
        setLoading(false);
      }
    };
    fetchShopStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-gray-50 dark:bg-gray-900">
        <span className="text-lg text-gray-700 dark:text-gray-200">Loading...</span>
      </div>
    );
  }

  if (!shopStatus || shopStatus.status !== "approved" || !shopStatus.isActive) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          {shopStatus?.status === "pending" && !shopStatus?.isActive && (
            <div>
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Your application is submitted</h2>
              <p className="text-gray-600 dark:text-gray-300">Your shop is not approved or not active yet. Please wait for approval.</p>
              <p className="text-gray-600 dark:text-gray-300">Currently, your shop status is {shopStatus?.status}</p>
            </div>
          )}
          {shopStatus?.status === "rejected" && (
            <div>
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Application Rejected</h2>
              <p className="text-gray-600 dark:text-gray-300">Your shop application has been rejected. Please contact support for more information.</p>
            </div>
          )}
          {shopStatus?.status === "suspended" && shopStatus?.isActive === false && (
            <div>
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Shop Suspended</h2>
              <p className="text-gray-600 dark:text-gray-300">Your shop has been suspended. Please contact support for more information.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
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

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 pb-24 md:pb-8 w-full max-w-[100vw]">
          {children}
        </main>

        <nav className="md:hidden absolute bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-safe-area-inset-bottom">
          <div className="flex justify-around items-center h-16 overflow-x-auto no-scrollbar px-1">
            {mobileNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/shop" && (pathname || "").startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center min-w-[60px] h-full space-y-1 transition-all active:scale-95",
                    isActive
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  )}
                >
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
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
