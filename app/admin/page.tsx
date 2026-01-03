"use client";

import React, { useState, useEffect, use } from "react";
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
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  Tooltip,
  Legend,
} from "recharts";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalShops: 0,
    pendingShopApprovals: 0,
    activeOrders: 0,
    ridersTotal: 0,
    ridersActive: 0,
    topCities: [] as any[],
    revenueTrend: [] as any[],
    ordersTrend: [] as any[],
    orderStatusDistribution: [] as any[],
  });

  const [loading, setLoading] = useState(true);

  const formatCurrency = (value: number | string) => {
    const num = typeof value === "string" ? Number(value) : value;
    const safeNum = Number.isFinite(num) ? num : 0;
    return `₹${safeNum.toLocaleString()}`;
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await AdminService.getStats();
        // console.log("Fetched dashboard stats:", data);
        setStats({
          totalSales: Number(data.totalSales) || 0,
          totalOrders: Number(data.totalOrders) || 0,
          totalUsers: Number(data.totalUsers) || 0,
          totalShops: Number(data.totalShops) || 0,
          pendingShopApprovals: Number(data.pendingShopApprovals) || 0,
          activeOrders: Number(data.activeOrders) || 0,
          ridersTotal: Number(data?.riders?.total) || 0,
          ridersActive: Number(data?.riders?.active) || 0,
          topCities: Array.isArray(data.topCities) ? data.topCities : [],
          revenueTrend: Array.isArray(data.revenueTrend) ? data.revenueTrend : [],
          ordersTrend: Array.isArray((data as any).ordersTrend) ? (data as any).ordersTrend : [],
          orderStatusDistribution: Array.isArray((data as any).orderStatusDistribution)
            ? (data as any).orderStatusDistribution
            : [],
        });
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);
  // useEffect(() => {
  //   const uploadProducts = async () => {
  //     try {
  //       const response = await AdminService.addGlobalProduct();
  //       console.log("Upload products response:", response);
  //     } catch (error) {
  //       console.error("Failed to upload global products", error);
  //     }
  //   };
  //   // uploadProducts();
  // }, []);
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
                {formatCurrency(stats.totalSales)}
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

        {/* Main Chart: Revenue & Orders Area Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Weekly Performance</h3>

          <div className="h-80 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-100 dark:border-gray-700 px-4 py-4">
            {stats.revenueTrend.length || stats.ordersTrend.length ? (
              (() => {
                const labels = Array.from(
                  new Set([
                    ...stats.revenueTrend.map((d: any) => d.name),
                    ...stats.ordersTrend.map((d: any) => d.name),
                  ])
                );

                const chartData = labels.map((label) => {
                  const rev = stats.revenueTrend.find((d: any) => d.name === label)?.value || 0;
                  const ord = stats.ordersTrend.find((d: any) => d.name === label)?.value || 0;
                  return { name: label, revenue: rev, orders: ord };
                });

                return (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="ordFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                      <Tooltip
                        contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                        formatter={(value: any, key) => {
                          if (key === "revenue") return [formatCurrency(value), "Revenue"];
                          return [value, "Orders"];
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#6366F1"
                        fill="url(#revFill)"
                        strokeWidth={2}
                        dot={{ r: 3, strokeWidth: 1.5, fill: "#6366F1" }}
                        activeDot={{ r: 5 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="orders"
                        stroke="#3B82F6"
                        fill="url(#ordFill)"
                        strokeWidth={2}
                        dot={{ r: 3, strokeWidth: 1.5, fill: "#3B82F6" }}
                        activeDot={{ r: 5 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                );
              })()
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">No trend data</div>
            )}
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
                    style={{ width: `${stats.totalOrders ? (item.value / stats.totalOrders) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}

            {!(stats as any).orderStatusDistribution?.length && (
              <div className="text-center py-10 text-gray-400">No order data yet</div>
            )}
          </div>
        </div>

      </div>

      {/* Riders & Top Cities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Riders</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.ridersTotal}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.ridersActive}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Top Cities</h3>
          {stats.topCities.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 uppercase text-xs font-bold">
                  <tr>
                    <th className="px-4 py-3">City</th>
                    <th className="px-4 py-3">Orders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {stats.topCities.map((c: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{c.city}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{c.orderCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-gray-500 text-sm">No city data</div>
          )}
        </div>
      </div>
    </div>
  );
}
