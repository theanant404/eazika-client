"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  Package,
  ShoppingBag,
  Users,
  ArrowUpRight,
  Clock,
  Share2,
  Store,
} from "lucide-react";
import Link from "next/link";
import { shopService, ShopAnalytics } from "@/services/shopService";
import { shopStore } from "@/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ShopDashboard() {
  const { currentOders, feathCurrentOrders } = shopStore();

  const [analytics, setAnalytics] = useState<ShopAnalytics["metrics"] | null>(
    null
  );

  const [isNewShop, setIsNewShop] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        if (currentOders.orders.length === 0) {
          await feathCurrentOrders();
        }
        // Fetch Analytics and Recent Orders in parallel
        const analyticsData = await shopService
          .getAnalytics("Last 7 Days")
          .catch(() => null);

        // Set Analytics
        if (analyticsData?.metrics) {
          setAnalytics(analyticsData.metrics);
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error("Failed to load dashboard data:", error.message);
          toast.error("Failed to load dashboard data");
        }
      }
    };

    loadDashboardData();
  }, [feathCurrentOrders, currentOders.orders.length]);

  // Helper to construct stat cards
  const stats = [
    {
      title: "Total Sales",
      value: analytics?.revenue || "₹0",
      change: analytics?.revenueTrend || "0%",
      icon: TrendingUp,
      color: isNewShop ? "text-gray-400" : "text-green-600",
      bg: isNewShop
        ? "bg-gray-100 dark:bg-gray-700"
        : "bg-green-100 dark:bg-green-900/30",
    },
    {
      title: "Active Orders",
      value: analytics?.orders || "0",
      change: analytics?.ordersTrend || "No active",
      icon: ShoppingBag,
      color: isNewShop ? "text-gray-400" : "text-blue-600",
      bg: isNewShop
        ? "bg-gray-100 dark:bg-gray-700"
        : "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "Customers",
      value: analytics?.customers || "0",
      change: analytics?.customersTrend || "0 New",
      icon: Users,
      color: isNewShop ? "text-gray-400" : "text-purple-600",
      bg: isNewShop
        ? "bg-gray-100 dark:bg-gray-700"
        : "bg-purple-100 dark:bg-purple-900/30",
    },
    {
      title: "Avg Order Value",
      value: analytics?.aov || "₹0",
      change: analytics?.aovTrend || "0%",
      icon: Package, // Using Package as placeholder for AOV/Products
      color: isNewShop ? "text-yellow-600" : "text-yellow-600",
      bg: "bg-yellow-100 dark:bg-yellow-900/30",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isNewShop
              ? "Welcome to Eazika! Let's get your shop running."
              : "Welcome back! Here's what's happening today."}
          </p>
        </div>
        <div className="flex gap-3"></div>
      </div>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const hasPositiveChange = stat.change.includes("+");

          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md"
            >
              <div className="flex justify-between items-start mb-2">
                <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                  <Icon size={20} />
                </div>
                {stat.change && (
                  <span
                    className={`text-[10px] font-bold flex items-center px-2 py-1 rounded-full ${
                      isNewShop
                        ? "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                        : "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                    }`}
                  >
                    {stat.change}{" "}
                    {!isNewShop && hasPositiveChange && (
                      <ArrowUpRight size={10} className="ml-0.5" />
                    )}
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {stat.title}
              </p>
            </div>
          );
        })}
      </div>
      {/* Recent Orders Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col min-h-[300px]">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center shrink-0">
          <h2 className="font-bold text-lg text-gray-900 dark:text-white">
            Recent Orders
          </h2>
          {currentOders.orders.length > 0 && (
            <Link
              href="/shop/history"
              className="text-sm text-yellow-600 font-medium hover:underline"
            >
              View All
            </Link>
          )}
        </div>
        <div className="flex-1 flex flex-col">
          {currentOders.orders.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {currentOders.orders
                .filter(order => order.status !== 'delivered' && order.status !== 'cancelled')
                .map((order) => (
                <Link
                  href={`shop/order/${order.id}`}
                  key={order.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 text-xs font-bold">
                      {order.customerName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                          {order.customerName}
                        </h4>
                        <span className="text-xs text-gray-400">
                          • #{order.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={12} />{" "}
                        {new Date(order.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                          {order.address}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                        {order.itemCount} items • {order.paymentMethod}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                    <div className="text-right">
                      {/* "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"; */}
                      <span
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-medium uppercase",
                          order.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : order.status === "confirmed"
                            ? "bg-blue-100 text-blue-700"
                            : order.status === "shipped"
                            ? "bg-purple-100 text-purple-700"
                            : order.status === "delivered"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        )}
                      >
                        {order.status === "pending"
                          ? "Pending"
                          : order.status === "confirmed"
                          ? "Confirmed"
                          : order.status === "shipped"
                          ? "Ready for Delivery"
                          : order.status === "delivered"
                          ? "Delivered"
                          : "Cancelled"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                    <div className="text-right">
                      <p className="font-bold text-gray-900 dark:text-white text-sm">
                        ₹{order.totalAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            /* --- EMPTY STATE UI --- */
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center px-4">
              <div className="w-24 h-24 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mb-4 relative">
                <Store className="text-gray-300 dark:text-gray-600 w-10 h-10" />
                <div className="absolute bottom-0 right-0 bg-yellow-500 rounded-full p-1.5 border-4 border-white dark:border-gray-800">
                  <Share2 size={12} className="text-white" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                No orders yet
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-6">
                Your shop is ready! Share your shop link with customers to start
                receiving orders.
              </p>
            </div>
          )}
        </div>
        {/* pagination */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end items-center gap-x-2">
          <button
            disabled={
              (currentOders.pagination?.currentPage || 1) <= 1 ? true : false
            }
            onClick={async () => {
              await feathCurrentOrders(
                (currentOders.pagination?.currentPage || 1) - 1,
                10
              );
            }}
            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 rounded-lg mr-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600/50 transition-all"
          >
            Previous
          </button>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {currentOders.pagination?.currentPage || 1} of{" "}
            {currentOders.pagination?.totalItems || 10} orders
          </p>
          <button
            disabled={
              (currentOders.pagination?.currentPage || 1) >=
              (currentOders.pagination?.totalPages || 1)
                ? true
                : false
            }
            onClick={async () => {
              await feathCurrentOrders();
            }}
            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600/50 transition-all"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
