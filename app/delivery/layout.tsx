"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, List, User, Bike, Power } from 'lucide-react';
import { useDeliveryStore } from "@/hooks/useDeliveryStore";

export default function DeliveryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isOnline, toggleOnline } = useDeliveryStore();

  const navItems = [
    { name: 'Orders', href: '/delivery', icon: List },
    { name: 'Map', href: '/delivery/map', icon: MapPin },
    { name: 'Profile', href: '/delivery/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* --- Desktop Sidebar (Hidden on Mobile) --- */}
      <aside className="hidden md:flex w-64 flex-col fixed left-0 top-0 bottom-0 bg-gray-900 border-r border-gray-800 z-30">
        <div className="p-6 flex items-center gap-3 border-b border-gray-800">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-gray-900 shadow-lg shadow-green-500/20">
                <Bike size={24} />
            </div>
            <div>
                <h1 className="font-bold text-lg text-white leading-none">Eazika</h1>
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Delivery Partner</span>
            </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all ${
                            isActive 
                            ? 'bg-gray-800 text-white shadow-sm' 
                            : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                        }`}
                    >
                        <Icon size={20} className={isActive ? 'text-green-500' : 'text-gray-500'} />
                        {item.name}
                    </Link>
                );
            })}
        </nav>
        {/* Desktop Toggle */}
        <div className="p-4 border-t border-gray-800">
            <button 
                onClick={toggleOnline}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${
                    isOnline 
                    ? 'bg-green-500 text-gray-900 hover:bg-green-400' 
                    : 'bg-red-500 text-white hover:bg-red-400'
                }`}
            >
                <Power size={18} />
                {isOnline ? 'You are Online' : 'You are Offline'}
            </button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <div className="flex-1 flex flex-col md:ml-64 h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-gray-900 border-b border-gray-800 px-4 py-4 flex items-center justify-between shrink-0 z-20">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-gray-900 font-bold shadow-sm">
                    <Bike size={18} />
                </div>
                <span className="font-bold text-lg text-white tracking-tight">Partner App</span>
            </div>
            <button 
                onClick={toggleOnline}
                className={`px-3 py-1.5 rounded-full border flex items-center gap-1.5 transition-all ${
                    isOnline 
                    ? 'bg-green-500/10 border-green-500 text-green-500' 
                    : 'bg-red-500/10 border-red-500 text-red-500'
                }`}
            >
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs font-bold">{isOnline ? 'ON' : 'OFF'}</span>
            </button>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-900 pb-20 md:pb-0 relative">
            {children}
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-gray-900 border-t border-gray-800 pb-safe-area-inset-bottom">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                                isActive ? 'text-green-500' : 'text-gray-500'
                            }`}
                        >
                            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
      </div>
    </div>
  );
}