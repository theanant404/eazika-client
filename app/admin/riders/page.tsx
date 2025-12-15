"use client";

import React, { useEffect, useState } from 'react';
import { mockRiders } from '@/app/data/adminMock';
import { AdminChart } from '@/app/components/admin/AdminChart';
import { 
    Search, 
    Bike, 
    X, 
    MoreHorizontal, 
    Star, 
    Ban, 
    CheckCircle, 
    Phone, 
    MapPin, 
    Calendar, 
    History,
    BarChart3,
    FileText,
    CreditCard,
    ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

// --- Local Mock Data ---

const riderActivityData7Days = [
    { label: 'Mon', value: 12 }, { label: 'Tue', value: 15 }, { label: 'Wed', value: 8 },
    { label: 'Thu', value: 20 }, { label: 'Fri', value: 25 }, { label: 'Sat', value: 30 }, { label: 'Sun', value: 28 },
];

const riderActivityData30Days = [
    { label: 'W1', value: 120 }, { label: 'W2', value: 145 }, 
    { label: 'W3', value: 110 }, { label: 'W4', value: 160 },
];

const riderActivityDataYear = [
    { label: 'Jan', value: 400 }, { label: 'Feb', value: 450 }, { label: 'Mar', value: 500 },
    { label: 'Apr', value: 480 }, { label: 'May', value: 520 }, { label: 'Jun', value: 600 }
];

const mockRiderHistory = [
    { id: '#ORD-9981', date: 'Today, 10:30 AM', amount: '₹450', status: 'Delivered' },
    { id: '#ORD-9972', date: 'Yesterday, 2:15 PM', amount: '₹120', status: 'Delivered' },
    { id: '#ORD-9965', date: 'Yesterday, 11:00 AM', amount: '₹850', status: 'Delivered' },
    { id: '#ORD-9844', date: 'Nov 20, 4:45 PM', amount: '₹320', status: 'Cancelled' },
];

import { AdminService } from "@/services/adminService";

export default function AdminRidersPage() {
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [globalChartRange, setGlobalChartRange] = useState('7'); // For main page chart
  const [selectedRider, setSelectedRider] = useState<any | null>(null);

  useEffect(() => {
    fetchRiders();
  }, []);

  const fetchRiders = async () => {
    try {
        setLoading(true);
        const data = await AdminService.getAllRiders();
        setRiders(data);
    } catch(err) {
        console.error("Failed to fetch riders", err);
    } finally {
        setLoading(false);
    }
  };
  
  // Modal States
  const [modalTab, setModalTab] = useState<'overview' | 'analytics' | 'history' | 'docs'>('overview');
  const [modalChartRange, setModalChartRange] = useState<'7' | '30' | '365'>('7');

  const handleSuspendToggle = (id: number) => {
     // Implement suspend logic if backend supports it. For now just optimistic UI update or alert.
     alert("Suspend feature not yet connected to backend.");
  };

  const openRiderModal = (rider: any) => {
      setSelectedRider(rider);
      setModalTab('overview'); // Reset tab
      setModalChartRange('7'); // Reset chart
  };

  const filteredRiders = riders.filter(r => 
      r.name.toLowerCase().includes(search.toLowerCase()) || 
      r.phone.includes(search)
  );

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'available': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
          case 'busy': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
          case 'offline': return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
          case 'suspended': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
          default: return 'bg-gray-100 text-gray-600';
      }
  };

  // Determine data for modal chart
  const getModalChartData = () => {
      switch(modalChartRange) {
          case '30': return riderActivityData30Days;
          case '365': return riderActivityDataYear;
          default: return riderActivityData7Days;
      }
  };

  return (
    <div className="space-y-6 pb-12">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Riders</h1>
        <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
                type="text" 
                placeholder="Search riders..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm w-full sm:w-64 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
        </div>
      </div>

      {/* Main Page Graph (Global Stats) */}
      <AdminChart 
          title="Fleet Activity" 
          data={globalChartRange === '7' ? riderActivityData7Days : riderActivityData30Days} 
          color="blue" 
          onRangeChange={setGlobalChartRange}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRiders.map((rider) => (
            <motion.div 
                key={rider.id} 
                layout
                onClick={() => openRiderModal(rider)}
                className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col cursor-pointer hover:border-blue-500/50 transition-colors group"
            >
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500">
                            <Bike size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {rider.name}
                            </h3>
                            <p className="text-sm text-gray-500">{rider.phone}</p>
                        </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${getStatusColor(rider.status)}`}>
                        {rider.status}
                    </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4 py-3 border-y border-gray-100 dark:border-gray-700">
                    <div className="text-center border-r border-gray-100 dark:border-gray-700">
                        <p className="text-xs text-gray-500 uppercase font-bold">Deliveries</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{rider.totalDeliveries}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-gray-500 uppercase font-bold">Rating</p>
                        <p className="text-lg font-bold text-yellow-500 flex items-center justify-center gap-1">
                            {rider.rating} <Star size={14} fill="currentColor" />
                        </p>
                    </div>
                </div>

                <div className="mt-auto">
                     <button className="w-full py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2">
                        <MoreHorizontal size={16} /> View Full Profile
                     </button>
                </div>
            </motion.div>
        ))}
      </div>

      {/* --- Rider Details Modal --- */}
      <AnimatePresence>
        {selectedRider && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Modal Header */}
                    <div className="p-6 pb-0 bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600">
                                    <Bike size={32} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedRider.name}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${getStatusColor(selectedRider.status)}`}>
                                            {selectedRider.status}
                                        </span>
                                        <span className="text-gray-400 text-xs">• ID: #{selectedRider.id}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedRider(null)} className="p-2 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 overflow-x-auto">
                            {['overview', 'analytics', 'history', 'docs'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setModalTab(tab as any)}
                                    className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors capitalize ${
                                        modalTab === tab 
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Modal Content */}
                    <div className="p-6 overflow-y-auto min-h-[400px]">
                        {/* TAB: OVERVIEW */}
                        {modalTab === 'overview' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Contact</p>
                                        <div className="flex items-center gap-2 text-gray-800 dark:text-white font-medium">
                                            <Phone size={16} className="text-blue-500" /> {selectedRider.phone}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Zone</p>
                                        <div className="flex items-center gap-2 text-gray-800 dark:text-white font-medium">
                                            <MapPin size={16} className="text-orange-500" /> Civil Lines, Nagpur
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-3">Performance Stats</h3>
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div className="p-3 border border-gray-100 dark:border-gray-700 rounded-lg">
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedRider.totalDeliveries}</p>
                                            <p className="text-xs text-gray-500">Lifetime Orders</p>
                                        </div>
                                        <div className="p-3 border border-gray-100 dark:border-gray-700 rounded-lg">
                                            <p className="text-2xl font-bold text-yellow-500">{selectedRider.rating}</p>
                                            <p className="text-xs text-gray-500">Avg Rating</p>
                                        </div>
                                        <div className="p-3 border border-gray-100 dark:border-gray-700 rounded-lg">
                                            <p className="text-2xl font-bold text-green-500">98%</p>
                                            <p className="text-xs text-gray-500">On-Time Rate</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-3">Account Actions</h3>
                                    {selectedRider.status === 'suspended' ? (
                                        <button 
                                            onClick={() => handleSuspendToggle(selectedRider.id)}
                                            className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={18} /> Activate Account
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => handleSuspendToggle(selectedRider.id)}
                                            className="w-full py-3 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <Ban size={18} /> Suspend Account
                                        </button>
                                    )}
                                    <p className="text-xs text-gray-500 text-center mt-2">
                                        Suspending will prevent the rider from accepting new orders.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* TAB: ANALYTICS */}
                        {modalTab === 'analytics' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <BarChart3 size={18} /> Delivery Performance
                                    </h3>
                                    <select 
                                        value={modalChartRange}
                                        onChange={(e) => setModalChartRange(e.target.value as any)}
                                        className="text-xs bg-gray-100 dark:bg-gray-700 border-none rounded-lg px-2 py-1 text-gray-600 dark:text-gray-300"
                                    >
                                        <option value="7">This Week</option>
                                        <option value="30">This Month</option>
                                        <option value="365">This Year</option>
                                    </select>
                                </div>
                                
                                {/* Reusing AdminChart */}
                                <AdminChart 
                                    title="" // Title handled above
                                    data={getModalChartData()} 
                                    color="green" 
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                        <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase">Avg Delivery Time</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">24m</p>
                                    </div>
                                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                                        <p className="text-xs text-purple-600 dark:text-purple-400 font-bold uppercase">Total Earnings</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">₹12.4k</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB: HISTORY */}
                        {modalTab === 'history' && (
                            <div className="space-y-4">
                                {mockRiderHistory.map((order, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500">
                                                <History size={18} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white text-sm">{order.id}</p>
                                                <p className="text-xs text-gray-500">{order.date}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900 dark:text-white text-sm">{order.amount}</p>
                                            <span className={`text-[10px] font-bold ${order.status === 'Delivered' ? 'text-green-600' : 'text-red-600'}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                <button className="w-full py-2 text-sm text-blue-600 font-medium hover:underline">View All Orders</button>
                            </div>
                        )}

                        {/* TAB: DOCS */}
                        {modalTab === 'docs' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            <CreditCard size={16} /> Driving License
                                        </p>
                                        <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-xl relative overflow-hidden border border-gray-200 dark:border-gray-600">
                                            <Image src="https://placehold.co/600x400?text=License+Front" alt="DL" layout="fill" objectFit="cover" />
                                        </div>
                                        <div className="flex items-center gap-1 text-green-600 text-xs font-bold">
                                            <CheckCircle size={12} /> Verified
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            <FileText size={16} /> Aadhar Card
                                        </p>
                                        <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-xl relative overflow-hidden border border-gray-200 dark:border-gray-600">
                                            <Image src="https://placehold.co/600x400?text=Aadhar" alt="Aadhar" layout="fill" objectFit="cover" />
                                        </div>
                                        <div className="flex items-center gap-1 text-green-600 text-xs font-bold">
                                            <CheckCircle size={12} /> Verified
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            <Bike size={16} /> RC Book
                                        </p>
                                        <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-xl relative overflow-hidden border border-gray-200 dark:border-gray-600">
                                            <Image src="https://placehold.co/600x400?text=RC" alt="RC" layout="fill" objectFit="cover" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}