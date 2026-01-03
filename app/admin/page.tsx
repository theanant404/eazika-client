"use client";

import React, { useState, useEffect } from "react";
import { AdminService } from "@/services/adminService";
import Link from "next/link";
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Store,
  AlertCircle,
  ArrowUpRight,
  Check,
  X,
  Download,
} from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalSales: "₹0",
    totalOrders: 0,
    totalUsers: 0,
    totalShops: 0,
    pendingShopApprovals: 0,
    activeOrders: 0,
    revenueTrend: [] as any[],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await AdminService.getStats();
        setStats({
          ...data,
          // Format currency if backend sends raw number
          totalSales:
            typeof data.totalSales === "number"
              ? `₹${data.totalSales}`
              : data.totalSales,
        });
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading)
    return <div className="p-8 text-center">Loading dashboard...</div>;

  return (
    <div className="space-y-6 relative">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard Overview
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Welcome back, here's what's happening today.
          </p>
        </div>
        {/* Export Button Code ... */}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <Link href={"/admin/shops"} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Revenue
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.totalSales}
              </h3>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
          </div>
        </Link>

        {/* Orders */}
        <Link href="/admin/orders">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer h-full">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Orders
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.totalOrders}
                </h3>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                <ShoppingBag size={20} />
              </div>
            </div>
          </div>
        </Link>

        {/* Users */}
        <Link href="/admin/users">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer h-full">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Users
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.totalUsers}
                </h3>
              </div>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg">
                <Users size={20} />
              </div>
            </div>
          </div>
        </Link>

        {/* Shops Pending */}
        <Link href="/admin/shop-approvals">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer h-full">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Pending Shop Approvals
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.pendingShopApprovals}
                </h3>
              </div>
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-lg">
                <AlertCircle size={20} />
              </div>
            </div>
            {stats.pendingShopApprovals > 0 && (
              <div className="mt-4 text-xs text-orange-600 font-medium">
                Requires Action
              </div>
            )}
          </div>
        </Link>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main Chart: Revenue & Orders Trend */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Weekly Performance</h3>

          {/* Simple Bar Chart Implementation */}
          <div className="h-64 flex items-end justify-between gap-2 sm:gap-4">
            {stats.revenueTrend?.map((item: any, i: number) => {
              const maxVal = Math.max(...stats.revenueTrend.map((d: any) => d.value), 100);
              const heightPct = (item.value / maxVal) * 100;

              return (
                <div key={i} className="flex flex-col items-center gap-2 flex-1 group relative">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">
                    ₹{item.value}
                  </div>

                  {/* Bar */}
                  <div
                    className="w-full max-w-[40px] bg-indigo-100 dark:bg-indigo-900/30 rounded-t-lg relative overflow-hidden transition-all duration-500 hover:bg-indigo-200 dark:hover:bg-indigo-800/50"
                    style={{ height: `${heightPct || 1}%` }} // Min height 1% for visual
                  >
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-indigo-500 transition-all duration-1000 ease-out"
                      style={{ height: '100%' }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 font-medium">{item.name}</span>
                </div>
              )
            })}
          </div>

          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-indigo-500 rounded-full"></span> Revenue
            </div>
          </div>
        </div>

        {/* Side Chart: Order Status */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Order Status</h3>
          <div className="space-y-4">
            {(stats as any).orderStatusDistribution?.map((item: any, i: number) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{item.name}</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{item.value}</span>
                </div>
                <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.name === 'delivered' ? 'bg-green-500' :
                      item.name === 'cancelled' ? 'bg-red-500' :
                        item.name === 'shipped' ? 'bg-blue-500' :
                          'bg-orange-500'
                      }`}
                    style={{ width: `${(item.value / stats.totalOrders) * 100}%` }}
                  />
                </div>
              </div>
            ))}

            {(!stats as any).orderStatusDistribution?.length && (
              <div className="text-center py-10 text-gray-400">No order data yet</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
