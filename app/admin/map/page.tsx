"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { AdminService } from "@/services/adminService";
import { 
    Store, 
    Bike, 
    Layers,
    Search,
    Loader2
} from 'lucide-react';
import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS
import { Icon } from 'leaflet';

// Dynamic import for MapContainer to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

// Fix for default marker icons in Next.js
const fixLeafletIcon = () => {
    // We can use custom icons, so we might not need this if we define our own.
};

interface MapData {
    shops: any[];
    riders: any[];
}

export default function LiveMapPage() {
  const [data, setData] = useState<MapData>({ shops: [], riders: [] });
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  
  const [filters, setFilters] = useState({
      shops: true,
      riders: true,
  });

  useEffect(() => {
    setIsClient(true);
    fetchMapData();
    // Poll every 30 seconds
    const interval = setInterval(fetchMapData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchMapData = async () => {
    try {
      const mapData = await AdminService.getLiveMapData();
      setData(mapData);
    } catch (error) {
      console.error("Failed to fetch map data", error);
    } finally {
      setLoading(false);
    }
  };

  // Custom Icons logic would go here. For now, simple logic or default markers.
  // Since we can't easily import L on server side, we define icons inside the component or effect.
  
  // Nagoya/Default Center
  const defaultCenter: [number, number] = [21.1458, 79.0882]; 

  if (!isClient) return <div className="h-screen bg-gray-100 dark:bg-gray-900" />;

  const displayShops = filters.shops ? data.shops : [];
  const displayRiders = filters.riders ? data.riders : [];
  
  // We need to construct icons on client side only to avoid 'window is not defined'
  // But let's rely on React-Leaflet's behavior. We will use simple circle markers or default markers if Icon import works.
  
  // Fallback for custom icons using DivIcon if we want consistent styling
  // For this step, to ensure it works immediately, I will use standard markers but maybe color them if possible, or just standard blue.
  // Ideally, distinct icons for Shops vs Riders.
  
  // Custom Icon Imports (Hack to make them work)
  // const shopIcon = new Icon({
  //   iconUrl: 'https://cdn-icons-png.flaticon.com/512/3514/3514491.png', 
  //   iconSize: [32, 32]
  // });
  // const riderIcon = new Icon({
  //   iconUrl: 'https://cdn-icons-png.flaticon.com/512/3063/3063823.png',
  //   iconSize: [32, 32]
  // });

  return (
    <div className="h-[calc(100vh-4rem)] relative bg-gray-100 dark:bg-gray-900 overflow-hidden flex flex-col">
        
        {/* Toolbar */}
        <div className="absolute top-4 left-16 z-[1000] flex flex-col gap-3"> 
             {/* z-index high to be above Leaflet */}
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
            </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative z-0">
             {loading && (
                 <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                     <Loader2 className="animate-spin text-indigo-600" size={40} />
                 </div>
             )}
             
             <MapContainer 
                center={defaultCenter} 
                zoom={13} 
                style={{ height: '100%', width: '100%' }}
                className="z-0"
             >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {data.shops.length === 0 && data.riders.length === 0 && !loading && (
                     // Suggestion text if map is empty
                     <div className="leaflet-bottom leaflet-right m-4 p-4 bg-white rounded shadow text-sm">
                        No active entities found with location data.
                     </div>
                )}

                {displayShops.map((shop) => (
                    <Marker 
                        key={`shop-${shop.id}`} 
                        position={[shop.lat, shop.lng]}
                        // icon={shopIcon}
                    >
                        <Popup>
                            <div className="p-1">
                                <h3 className="font-bold text-sm">{shop.name}</h3>
                                <p className="text-xs text-gray-500 capitalize">{shop.category}</p>
                                <p className="text-xs">{shop.phone}</p>
                                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active Shop</span>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {displayRiders.map((rider) => (
                    <Marker 
                        key={`rider-${rider.id}`} 
                        position={[rider.lat, rider.lng]}
                        // icon={riderIcon}
                    >
                        <Popup>
                            <div className="p-1">
                                <h3 className="font-bold text-sm">{rider.name}</h3>
                                <p className="text-xs">{rider.phone}</p>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${rider.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {rider.status}
                                </span>
                            </div>
                        </Popup>
                    </Marker>
                ))}

             </MapContainer>
        </div>
    </div>
  );
}