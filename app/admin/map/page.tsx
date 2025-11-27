"use client";

import React, { useState } from 'react';
import { 
    Map, 
    Store, 
    Bike, 
    Navigation, 
    Filter, 
    Layers,
    CheckCircle,
    XCircle,
    Clock,
    Search
} from 'lucide-react';
import { mockShops, mockRiders } from '@/app/data/adminMock';
import { motion, AnimatePresence } from 'framer-motion';

export default function LiveMapPage() {
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
  const [filters, setFilters] = useState({
      shops: true,
      riders: true,
      offline: true
  });

  // Filter logic
  const displayedShops = mockShops.filter(s => 
      filters.shops && (filters.offline || s.status === 'active')
  );
  const displayedRiders = mockRiders.filter(r => 
      filters.riders && (filters.offline || r.status !== 'offline')
  );

  // Entity Card Component
  const EntityPopup = ({ data }: { data: any }) => {
      const isShop = 'category' in data; // Distinguish shop from rider
      return (
        <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0 md:top-6 md:bottom-auto w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 z-50"
        >
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isShop ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                        {isShop ? <Store size={18} /> : <Bike size={18} />}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">{data.name}</h3>
                        <p className="text-xs text-gray-500 capitalize">{isShop ? data.category : 'Delivery Partner'}</p>
                    </div>
                </div>
                <button onClick={() => setSelectedEntity(null)} className="text-gray-400 hover:text-gray-600">
                    <XCircle size={18} />
                </button>
            </div>
            
            <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Status</span>
                    <span className={`font-bold capitalize ${
                        data.status === 'active' || data.status === 'available' ? 'text-green-600' : 
                        data.status === 'busy' ? 'text-orange-500' : 'text-gray-400'
                    }`}>
                        {data.status}
                    </span>
                </div>
                {isShop && (
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Revenue</span>
                        <span className="font-medium text-gray-900 dark:text-white">{data.revenue}</span>
                    </div>
                )}
                {!isShop && (
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Current Order</span>
                        <span className="font-medium text-gray-900 dark:text-white">{data.currentOrder || 'Idle'}</span>
                    </div>
                )}
            </div>

            <button className="w-full py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                View Full Profile
            </button>
        </motion.div>
      );
  };

  return (
    <div className="h-[calc(100vh-4rem)] relative bg-gray-100 dark:bg-gray-900 overflow-hidden flex flex-col">
        
        {/* Toolbar */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-3">
            <div className="bg-white dark:bg-gray-800 p-2 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex gap-2">
                <button 
                    onClick={() => setFilters(prev => ({ ...prev, shops: !prev.shops }))}
                    className={`p-2 rounded-lg transition-colors ${filters.shops ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:bg-gray-100'}`}
                    title="Toggle Shops"
                >
                    <Store size={20} />
                </button>
                <button 
                    onClick={() => setFilters(prev => ({ ...prev, riders: !prev.riders }))}
                    className={`p-2 rounded-lg transition-colors ${filters.riders ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
                    title="Toggle Riders"
                >
                    <Bike size={20} />
                </button>
                <div className="w-px bg-gray-200 dark:bg-gray-700 mx-1" />
                <button 
                    onClick={() => setFilters(prev => ({ ...prev, offline: !prev.offline }))}
                    className={`p-2 rounded-lg transition-colors ${filters.offline ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:bg-gray-100'}`}
                    title="Show Offline/Inactive"
                >
                    <Layers size={20} />
                </button>
            </div>

            {/* Search Map */}
            <div className="bg-white dark:bg-gray-800 p-1 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex items-center w-64">
                <Search size={16} className="text-gray-400 ml-2" />
                <input 
                    type="text" 
                    placeholder="Search location..." 
                    className="w-full bg-transparent border-none outline-none text-sm p-2 text-gray-700 dark:text-white"
                />
            </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative bg-[#e5e7eb] dark:bg-[#1f2937] overflow-hidden cursor-grab active:cursor-grabbing group">
             {/* Grid Pattern to simulate map */}
             <div className="absolute inset-0 opacity-30" 
                  style={{ 
                      backgroundImage: 'radial-gradient(#9ca3af 1px, transparent 1px)', 
                      backgroundSize: '40px 40px' 
                  }} 
             />
             
             {/* --- MARKERS --- */}
             
             {/* Shops */}
             {displayedShops.map(shop => (
                 <motion.div
                    key={`shop-${shop.id}`}
                    className="absolute z-10"
                    style={{ left: `${shop.coordinates.x}%`, top: `${shop.coordinates.y}%` }}
                    whileHover={{ scale: 1.1 }}
                    onClick={() => setSelectedEntity(shop)}
                 >
                     <div className="flex flex-col items-center cursor-pointer group">
                        <div className={`w-10 h-10 rounded-full border-2 border-white dark:border-gray-800 shadow-md flex items-center justify-center transition-colors ${
                            shop.status === 'active' 
                            ? 'bg-orange-500 text-white' 
                            : 'bg-gray-400 text-white'
                        }`}>
                            <Store size={16} />
                        </div>
                        <span className="mt-1 text-[10px] font-bold bg-white/90 dark:bg-gray-800/90 px-2 py-0.5 rounded-full shadow-sm text-gray-800 dark:text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            {shop.name}
                        </span>
                     </div>
                 </motion.div>
             ))}

             {/* Riders */}
             {displayedRiders.map(rider => (
                 <motion.div
                    key={`rider-${rider.id}`}
                    className="absolute z-20"
                    style={{ left: `${rider.coordinates.x}%`, top: `${rider.coordinates.y}%` }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => setSelectedEntity(rider)}
                 >
                     <div className="relative flex flex-col items-center cursor-pointer">
                        {/* Pulsing Effect for Active Riders */}
                        {rider.status === 'available' && (
                            <div className="absolute w-full h-full bg-blue-500 rounded-full animate-ping opacity-20 scale-150" />
                        )}
                        
                        <div className={`w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 shadow-md flex items-center justify-center transition-colors z-10 ${
                            rider.status === 'available' ? 'bg-blue-500 text-white' :
                            rider.status === 'busy' ? 'bg-yellow-500 text-white' :
                            'bg-gray-500 text-white'
                        }`}>
                            <Bike size={14} />
                        </div>
                     </div>
                 </motion.div>
             ))}
        </div>

        {/* Selected Entity Popup */}
        <AnimatePresence>
            {selectedEntity && <EntityPopup data={selectedEntity} />}
        </AnimatePresence>

        {/* Legend */}
        <div className="absolute bottom-6 right-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg text-xs space-y-2">
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500" /> Active Shop
            </div>
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Available Rider
            </div>
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500" /> Busy Rider
            </div>
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-400" /> Offline/Inactive
            </div>
        </div>
    </div>
  );
}