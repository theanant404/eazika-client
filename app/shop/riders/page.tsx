"use client";

import React, { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    Users,
    Bike,
    CheckCircle,
    Clock,
    Phone,
    MoreVertical,
    Loader2,
    X,
    Send,
    User,
    Star,
    Ban,
    MapPin,
    FileText,
    Eye,
    XCircle,
    BarChart3,
    History,
    TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ShopService, ShopRider, UserProfile } from '@/services/shopService';
import Image from 'next/image';

export default function RidersPage() {
    const [riders, setRiders] = useState<ShopRider[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Invite Modal State
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [invitePhone, setInvitePhone] = useState('');
    const [foundUser, setFoundUser] = useState<UserProfile | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [inviteSent, setInviteSent] = useState(false);

    // Rider Details Modal State
    const [selectedRider, setSelectedRider] = useState<ShopRider | null>(null);
    const [modalTab, setModalTab] = useState<'overview' | 'analytics' | 'history' | 'docs'>('overview');
    const [riderAnalytics, setRiderAnalytics] = useState<any>(null);
    const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

    useEffect(() => {
        fetchRiders();
    }, []);

    const fetchRiders = async () => {
        try {
            const data = await ShopService.getShopRiders();
            // const analysisData = await ShopService.getRiderAnalyticsById(data[0]?.id);
            // console.log("Rider Analytics Data:", analysisData);
            // console.log("Riders data:", data);
            setRiders(data);
        } catch (error) {
            console.error("Failed to load riders", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Stats Calculation
    const stats = [
        { title: 'Total Riders', value: riders.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
        { title: 'Active Now', value: riders.filter(r => r.status === 'available' || r.status === 'busy' || r.isAvailable).length, icon: Bike, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
        { title: 'Busy', value: riders.filter(r => r.isBusy || r.status === 'busy').length, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
        { title: 'Total Deliveries', value: riders.reduce((acc, r) => acc + (r.totalOrdersDelivered || 0), 0), icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    ];

    const filteredRiders = riders.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.phone.includes(searchQuery)
    );

    // --- Invite Handlers ---

    const handleSearchUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (invitePhone.length < 10) {
            alert("Please enter a valid phone number");
            return;
        }
        setIsSearching(true);
        setFoundUser(null);
        setInviteSent(false);

        try {
            const user = await ShopService.searchUserByPhone(invitePhone);
            setFoundUser(user);
        } catch (error) {
            alert("User not found with this phone number.");
        } finally {
            setIsSearching(false);
        }
    };



    const resetModal = () => {
        setShowInviteModal(false);
        setInvitePhone('');
        setFoundUser(null);
        setInviteSent(false);
    };

    const openRiderModal = async (rider: ShopRider) => {
        setSelectedRider(rider);
        setModalTab('overview');

        // Fetch rider analytics data
        try {
            setIsLoadingAnalytics(true);
            const analysisData = await ShopService.getRiderAnalyticsById(rider.id);
            // console.log("Rider Analytics Data:", analysisData);
            setRiderAnalytics(analysisData);
        } catch (error) {
            console.error("Failed to fetch rider analytics:", error);
            setRiderAnalytics(null);
        } finally {
            setIsLoadingAnalytics(false);
        }
    };

    const handleSuspend = async (riderId: number) => {
        if (!confirm('Are you sure you want to suspend this rider?')) return;
        try {
            // Add suspend API call here
            // console.log('Suspending rider:', riderId);
            await ShopService.riderStatusToggle(riderId, "suspended");
            fetchRiders();
        } catch (error) {
            console.error('Failed to suspend rider', error);
        }
    };

    // Mock data for rider performance chart (last 7 days)
    const getPerformanceData = (rider: ShopRider) => {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const delivered = rider.totalOrdersDelivered || 0;
        const baseValue = Math.floor(delivered / 7);

        return days.map((day, index) => ({
            day,
            deliveries: Math.max(0, baseValue + Math.floor(Math.random() * 3) - 1),
            earnings: Math.floor((baseValue + Math.floor(Math.random() * 3)) * 45)
        }));
    };

    return (
        <div className="space-y-6 pb-24 md:pb-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Delivery Partners</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage your delivery fleet.</p>
                </div>

            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div
                            key={stat.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.bg} ${stat.color}`}>
                                <Icon size={20} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{stat.title}</p>
                        </motion.div>
                    );
                })}
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Search riders by name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-500 outline-none transition-all shadow-sm"
                />
            </div>

            {/* Riders Grid */}
            {isLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-yellow-500" size={32} /></div>
            ) : filteredRiders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence mode="popLayout">
                        {filteredRiders.map((rider) => (
                            <motion.div
                                key={rider.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                                className={`p-6 rounded-2xl border shadow-sm hover:shadow-xl transition-all group cursor-pointer relative overflow-hidden ${rider.status === 'pending'
                                    ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 border-yellow-200 dark:border-yellow-700'
                                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                    }`}
                            >
                                {/* Decorative gradient overlay */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 rounded-full blur-3xl -z-0" />

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-5">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center overflow-hidden ring-2 ring-white dark:ring-gray-800 shadow-md">
                                                    {rider.avatar || rider.image ? (
                                                        <Image src={rider.avatar || rider.image || ''} alt={rider.vehicleOwnerName || rider.name} width={56} height={56} className="object-cover" />
                                                    ) : (
                                                        <User className="text-gray-400" size={24} />
                                                    )}
                                                </div>
                                                <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${rider.isAvailable || rider.status === 'available' ? 'bg-green-500' :
                                                    rider.status === 'busy' ? 'bg-orange-500' :
                                                        rider.status === 'pending' ? 'bg-yellow-500' :
                                                            'bg-gray-400'
                                                    }`} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 dark:text-white text-base mb-0.5">{rider.vehicleOwnerName}</h3>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">{rider.user.phone}</span>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                                                        {rider.isAvailable || rider.status === 'available' ? 'Active' : 'Inactive'}
                                                    </span>
                                                    <span className="text-xs text-gray-500 capitalize font-medium">
                                                        {rider.status === 'pending' ? 'Pending Approval' : rider.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {rider.status !== 'pending' && (
                                            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                                <MoreVertical size={18} />
                                            </button>
                                        )}
                                    </div>

                                    {rider.status === 'pending' ? (
                                        <div className="mt-auto pt-5 grid grid-cols-3 gap-2">
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (!confirm("Reject request?")) return;
                                                    await ShopService.removeRider(rider.id);
                                                    fetchRiders();
                                                }}
                                                className="py-2.5 rounded-xl bg-red-100 text-red-700 font-bold text-xs hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 flex items-center justify-center gap-1 transition-colors"
                                            >
                                                <XCircle size={14} /> Reject
                                            </button>
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    await ShopService.riderStatusToggle(rider.id, "approved");
                                                    fetchRiders();
                                                }}
                                                className="py-2.5 rounded-xl bg-yellow-500 text-white font-bold text-xs hover:bg-yellow-600 shadow-lg shadow-yellow-500/30 flex items-center justify-center gap-1 transition-all"
                                            >
                                                <CheckCircle size={14} /> Accept
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openRiderModal(rider);
                                                }}
                                                className="py-2.5 rounded-xl bg-blue-100 text-blue-700 font-bold text-xs hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 flex items-center justify-center gap-1 transition-colors"
                                            >
                                                <Eye size={14} /> View
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-between py-4 border-y border-gray-100 dark:border-gray-700 mb-4">
                                                <div className="text-center flex-1 border-r border-gray-100 dark:border-gray-700">
                                                    <p className="text-xl font-bold text-gray-900 dark:text-white">{rider.assignedOrdersCount || 0}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wide">Assigned</p>
                                                </div>
                                                <div className="text-center flex-1 border-r border-gray-100 dark:border-gray-700">
                                                    <p className="text-xl font-bold text-gray-900 dark:text-white">{rider.totalOrdersDelivered || 0}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wide">Completed</p>
                                                </div>
                                                {/* <div className="text-center flex-1">
                                                    <p className="text-xl font-bold text-yellow-500 flex items-center justify-center gap-1">
                                                        {rider.rating} <Star size={14} fill="currentColor" />
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wide">Rating</p>
                                                </div> */}
                                                <div className="text-center flex-1 border-r border-gray-100 dark:border-gray-700">
                                                    <p className="text-xl font-bold text-gray-900 dark:text-white">{rider.totalOrdersCancelled || 0}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wide">Cancelled</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSuspend(rider.id);
                                                    }}
                                                    className="py-2.5 rounded-xl bg-red-50 text-red-600 font-bold text-xs hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 flex items-center justify-center gap-1 transition-colors"
                                                >
                                                    <Ban size={14} /> Suspend
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openRiderModal(rider);
                                                    }}
                                                    className="py-2.5 rounded-xl bg-blue-100 text-blue-700 font-bold text-xs hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 flex items-center justify-center gap-1 transition-colors shadow-sm"
                                                >
                                                    <Eye size={14} /> View
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                    <Users size={48} className="text-gray-400 mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">No Riders Found</h3>
                    <p className="text-sm text-gray-500">Add delivery partners to start managing your fleet.</p>
                </div>
            )}

            {/* --- Invite Modal --- */}
            <AnimatePresence>
                {showInviteModal && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl p-6 shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add New Rider</h3>
                                <button onClick={resetModal} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            {!foundUser ? (
                                /* Step 1: Search */
                                <form onSubmit={handleSearchUser} className="space-y-6">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Rider&apos;s Phone Number</label>
                                        <input
                                            type="tel"
                                            placeholder="Enter 10-digit mobile number"
                                            value={invitePhone}
                                            onChange={(e) => setInvitePhone(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-yellow-500 transition-colors"
                                            autoFocus
                                        />
                                        <p className="text-xs text-gray-500 mt-2">
                                            The user must be registered on Eazika to be invited.
                                        </p>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSearching || invitePhone.length < 10}
                                        className="w-full py-3.5 bg-yellow-500 text-white font-bold rounded-xl hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isSearching ? <Loader2 className="animate-spin" /> : "Search User"}
                                    </button>
                                </form>
                            ) : (
                                /* Step 2: Confirm & Invite */
                                <div className="space-y-6 text-center">
                                    <div className="flex flex-col items-center">
                                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3 overflow-hidden">
                                            {foundUser.image ? (
                                                <Image src={foundUser.image} alt={foundUser.name} width={80} height={80} className="object-cover" />
                                            ) : (
                                                <User size={32} className="text-gray-400" />
                                            )}
                                        </div>
                                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">{foundUser.name}</h4>
                                        <p className="text-sm text-gray-500">{foundUser.phone}</p>
                                    </div>

                                    {inviteSent ? (
                                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                                            <p className="text-green-700 dark:text-green-400 font-bold flex items-center justify-center gap-2">
                                                <CheckCircle size={18} /> Invite Sent!
                                            </p>
                                            <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                                                They will receive an SMS to join your shop.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <button
                                                onClick={() => setFoundUser(null)}
                                                className="w-full py-3.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                            >
                                                Search Different Number
                                            </button>
                                        </div>
                                    )}

                                    {inviteSent && (
                                        <button
                                            onClick={resetModal}
                                            className="w-full py-3.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                        >
                                            Done
                                        </button>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- Rider Details Modal --- */}
            <AnimatePresence>
                {selectedRider && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Header */}
                            <div className="p-6 pb-0 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className="w-20 h-20 bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-2xl flex items-center justify-center overflow-hidden ring-4 ring-white dark:ring-gray-800 shadow-lg">
                                                {selectedRider.avatar || selectedRider.image ? (
                                                    <Image src={selectedRider.avatar || selectedRider.image || ''} alt={selectedRider.vehicleOwnerName || selectedRider.name} width={80} height={80} className="object-cover" />
                                                ) : (
                                                    <Bike size={36} className="text-yellow-600" />
                                                )}
                                            </div>
                                            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 ${selectedRider.isAvailable ? 'bg-green-500' : 'bg-gray-400'
                                                }`} />
                                        </div>
                                        <div>
                                            <div className='flex flex-row gap-3 justify-start items-center mb-1'>
                                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedRider.vehicleOwnerName}</h2>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${selectedRider.status === 'available' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                    selectedRider.status === 'busy' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                                        selectedRider.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                            'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {selectedRider.status}
                                                </span>
                                            </div>
                                            <div className='flex flex-row gap-2 items-center justify-start mb-2'>
                                                <Phone size={14} className="text-blue-500" />
                                                <span className="text-sm text-gray-600 dark:text-gray-400">{selectedRider.phone}</span>
                                                <a href={`tel:${selectedRider.phone}`} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium">
                                                    Call Now
                                                </a>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-400 text-xs">ID: #{selectedRider.id}</span>
                                                {selectedRider.isVerified && (
                                                    <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                                                        <CheckCircle size={12} /> Verified
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedRider(null)} className="p-2.5 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Tabs */}
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    <button
                                        onClick={() => setModalTab('overview')}
                                        className={`px-6 py-3 text-sm font-bold rounded-t-xl transition-all ${modalTab === 'overview'
                                            ? 'bg-white dark:bg-gray-800 text-yellow-600 dark:text-yellow-400 shadow-lg'
                                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                            }`}
                                    >
                                        Overview
                                    </button>
                                    {selectedRider.status !== 'pending' && (
                                        <>
                                            <button
                                                onClick={() => setModalTab('analytics')}
                                                className={`px-6 py-3 text-sm font-bold rounded-t-xl transition-all ${modalTab === 'analytics'
                                                    ? 'bg-white dark:bg-gray-800 text-yellow-600 dark:text-yellow-400 shadow-lg'
                                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                                    }`}
                                            >
                                                Analytics
                                            </button>
                                            <button
                                                onClick={() => setModalTab('history')}
                                                className={`px-6 py-3 text-sm font-bold rounded-t-xl transition-all ${modalTab === 'history'
                                                    ? 'bg-white dark:bg-gray-800 text-yellow-600 dark:text-yellow-400 shadow-lg'
                                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                                    }`}
                                            >
                                                History
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => setModalTab('docs')}
                                        className={`px-6 py-3 text-sm font-bold rounded-t-xl transition-all ${modalTab === 'docs'
                                            ? 'bg-white dark:bg-gray-800 text-yellow-600 dark:text-yellow-400 shadow-lg'
                                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                            }`}
                                    >
                                        Documents
                                    </button>
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 overflow-y-auto">
                                {/* TAB: OVERVIEW */}
                                {modalTab === 'overview' && (
                                    <div className="space-y-6">
                                        {selectedRider.status !== 'pending' && riderAnalytics?.metrics && (
                                            <div>
                                                <h3 className="font-bold text-gray-900 dark:text-white mb-3">Performance Stats</h3>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                                    <div className="p-4 border border-gray-100 dark:border-gray-700 rounded-lg">
                                                        <p className="text-2xl font-bold text-green-600">{riderAnalytics.metrics.ordersAccepted || 0}</p>
                                                        <p className="text-xs text-gray-500 mt-1">Orders Accepted</p>
                                                    </div>
                                                    <div className="p-4 border border-gray-100 dark:border-gray-700 rounded-lg">
                                                        <p className="text-2xl font-bold text-blue-600">{riderAnalytics.metrics.deliveredCount || 0}</p>
                                                        <p className="text-xs text-gray-500 mt-1">Delivered</p>
                                                    </div>
                                                    <div className="p-4 border border-gray-100 dark:border-gray-700 rounded-lg">
                                                        <p className="text-2xl font-bold text-red-600">{riderAnalytics.metrics.cancelledCount || 0}</p>
                                                        <p className="text-xs text-gray-500 mt-1">Cancelled</p>
                                                    </div>
                                                    <div className="p-4 border border-gray-100 dark:border-gray-700 rounded-lg">
                                                        <p className="text-2xl font-bold text-yellow-500">{riderAnalytics.metrics.averageRating || 0}</p>
                                                        <p className="text-xs text-gray-500 mt-1">Avg Rating</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                                                <p className="text-xs text-gray-500 uppercase font-bold mb-2">Contact Information</p>
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-gray-800 dark:text-white font-medium">
                                                        <Phone size={16} className="text-blue-500" /> {selectedRider.phone}
                                                    </div>
                                                    <a href={`tel:${selectedRider.phone}`} className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline">
                                                        Call Now
                                                    </a>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                                                <p className="text-xs text-gray-500 uppercase font-bold mb-2">Verification Status</p>
                                                <div className="flex items-center gap-2 text-gray-800 dark:text-white font-medium">
                                                    {selectedRider.isVerified ? (
                                                        <><CheckCircle size={16} className="text-green-500" /> Verified</>
                                                    ) : (
                                                        <><Clock size={16} className="text-orange-500" /> Pending Verification</>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Aadhar Number</p>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedRider.aadharNumber || 'N/A'}</p>
                                            </div>
                                            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">PAN Number</p>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedRider.panNumber || 'N/A'}</p>
                                            </div>
                                            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">License Number</p>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedRider.licenseNumber || 'N/A'}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white mb-3">Vehicle Details</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                                    <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase mb-1">Owner Name</p>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedRider.vehicleOwnerName || 'N/A'}</p>
                                                </div>
                                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                                    <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase mb-1">Vehicle Name</p>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedRider.vehicleName || 'N/A'}</p>
                                                </div>
                                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                                    <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase mb-1">Vehicle Number</p>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedRider.vehicleNo || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>



                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white mb-3">Location & Availability</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                                                    <p className="text-xs text-gray-500 uppercase font-bold mb-2">Current Location</p>
                                                    <div className="flex items-center gap-2 text-gray-800 dark:text-white font-medium">
                                                        <MapPin size={16} className="text-red-500" />
                                                        {selectedRider.currentLat && selectedRider.currentLng ? (
                                                            <span className="text-sm">{selectedRider.currentLat.toFixed(4)}, {selectedRider.currentLng.toFixed(4)}</span>
                                                        ) : (
                                                            <span className="text-sm text-gray-500">Location not available</span>
                                                        )}
                                                    </div>
                                                    {selectedRider.lastLocationUpdate && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Last updated: {new Date(selectedRider.lastLocationUpdate).toLocaleString()}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                                                    <p className="text-xs text-gray-500 uppercase font-bold mb-2">Availability</p>
                                                    <div className="flex items-center gap-2 text-gray-800 dark:text-white font-medium">
                                                        {selectedRider.isAvailable ? (
                                                            <><CheckCircle size={16} className="text-green-500" /> Available</>
                                                        ) : (
                                                            <><XCircle size={16} className="text-red-500" /> Unavailable</>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white mb-3">Account Information</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                                                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Joined Date</p>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                        {new Date(selectedRider.createdAt || '').toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                                                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Last Updated</p>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                        {new Date(selectedRider.updatedAt || '').toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {selectedRider.status !== 'pending' && (
                                            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                                <h3 className="font-bold text-gray-900 dark:text-white mb-3">Account Actions</h3>
                                                <button
                                                    onClick={() => handleSuspend(selectedRider.id)}
                                                    className="w-full py-3 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                                                >
                                                    <Ban size={18} /> Suspend Rider
                                                </button>
                                                <p className="text-xs text-gray-500 text-center mt-2">
                                                    Suspending will prevent the rider from accepting new orders.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* TAB: ANALYTICS */}
                                {modalTab === 'analytics' && selectedRider.status !== 'pending' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <BarChart3 size={20} className="text-yellow-600" />
                                                <h3 className="font-bold text-gray-900 dark:text-white">Delivery Performance</h3>
                                            </div>
                                            {/* <div className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full font-medium">
                                                Last 7 Days
                                            </div> */}
                                        </div>

                                        {/* Performance Chart */}
                                        {isLoadingAnalytics ? (
                                            <div className="h-96 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-800/30 flex items-center justify-center">
                                                <Loader2 className="animate-spin text-blue-500" size={32} />
                                            </div>
                                        ) : riderAnalytics?.graphData?.daily ? (
                                            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-800/30">
                                                <div className="flex items-center justify-between mb-6">
                                                    <div>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total Deliveries</p>
                                                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                                            {riderAnalytics.metrics?.deliveredCount || 0}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-3 py-1.5 rounded-full">
                                                        <TrendingUp size={16} />
                                                        <span className="text-sm font-bold">+{riderAnalytics.metrics?.deliveredCount || 0}</span>
                                                    </div>
                                                </div>

                                                <div className="h-72 w-full bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-800/40 rounded-2xl p-4">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <LineChart data={riderAnalytics.graphData.daily.map((d: any) => ({
                                                            day: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                                                            completed: d.completed,
                                                            cancelled: d.cancelled,
                                                            orderValue: d.orderValue
                                                        }))} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                                            <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                                                            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                                                            <Tooltip
                                                                contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: 12, color: '#e5e7eb' }}
                                                                labelStyle={{ color: '#9ca3af' }}
                                                            />
                                                            <Line type="monotone" dataKey="completed" name="Completed" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                                            <Line type="monotone" dataKey="cancelled" name="Cancelled" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        ) : null}

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.1 }}
                                                className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200 dark:border-green-800/30"
                                            >
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                                                        <CheckCircle size={20} className="text-white" />
                                                    </div>
                                                    <p className="text-xs text-green-700 dark:text-green-400 font-bold uppercase">Accepted</p>
                                                </div>
                                                <p className="text-3xl font-bold text-gray-900 dark:text-white">{riderAnalytics?.metrics?.ordersAccepted || 0}</p>
                                                <p className="text-xs text-gray-500 mt-1">Total orders accepted</p>
                                            </motion.div>

                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.2 }}
                                                className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl border border-blue-200 dark:border-blue-800/30"
                                            >
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                                                        <Bike size={20} className="text-white" />
                                                    </div>
                                                    <p className="text-xs text-blue-700 dark:text-blue-400 font-bold uppercase">Completed</p>
                                                </div>
                                                <p className="text-3xl font-bold text-gray-900 dark:text-white">{riderAnalytics?.metrics?.deliveredCount || 0}</p>
                                                <p className="text-xs text-gray-500 mt-1">Successfully delivered</p>
                                            </motion.div>

                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.3 }}
                                                className="p-5 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-2xl border border-red-200 dark:border-red-800/30"
                                            >
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
                                                        <XCircle size={20} className="text-white" />
                                                    </div>
                                                    <p className="text-xs text-red-700 dark:text-red-400 font-bold uppercase">Cancelled</p>
                                                </div>
                                                <p className="text-3xl font-bold text-gray-900 dark:text-white">{riderAnalytics?.metrics?.cancelledCount || 0}</p>
                                                <p className="text-xs text-gray-500 mt-1">Orders not completed</p>
                                            </motion.div>
                                        </div>

                                        {/* Performance Metrics */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-5 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-2xl border border-purple-200 dark:border-purple-800/30">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <TrendingUp size={18} className="text-purple-600" />
                                                        <p className="text-xs text-purple-700 dark:text-purple-400 font-bold uppercase">Success Rate</p>
                                                    </div>
                                                </div>
                                                <p className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                                                    {selectedRider.totalOrdersAccepted
                                                        ? ((selectedRider.totalOrdersDelivered / selectedRider.totalOrdersAccepted) * 100).toFixed(1)
                                                        : 0}%
                                                </p>
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: selectedRider.totalOrdersAccepted ? `${(selectedRider.totalOrdersDelivered / selectedRider.totalOrdersAccepted) * 100}%` : '0%' }}
                                                        transition={{ duration: 1, delay: 0.5 }}
                                                        className="h-full bg-gradient-to-r from-purple-500 to-violet-600"
                                                    />
                                                </div>
                                            </div>

                                            {/* <div className="p-5 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-2xl border border-yellow-200 dark:border-yellow-800/30">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <Star size={18} className="text-yellow-600" />
                                                        <p className="text-xs text-yellow-700 dark:text-yellow-400 font-bold uppercase">Rating</p>
                                                    </div>
                                                </div>
                                                <p className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{selectedRider.rating}</p>
                                                <div className="flex gap-1">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star
                                                            key={star}
                                                            size={16}
                                                            className={star <= Math.floor(selectedRider.rating) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 dark:text-gray-600'}
                                                        />
                                                    ))}
                                                </div>
                                            </div> */}
                                        </div>

                                        {/* Additional Insights */}
                                        {riderAnalytics?.metrics && riderAnalytics?.earnings && (
                                            <div className="p-5 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-2xl border border-orange-200 dark:border-orange-800/30">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                                                        <TrendingUp size={20} className="text-white" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 dark:text-white">Performance Insights</h4>
                                                        <p className="text-xs text-gray-500">Based on recent activity</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                                                        <p className="text-xs text-gray-500 mb-1">Avg. Time/Delivery</p>
                                                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                                                            {riderAnalytics.metrics.averageDeliveryTimeHours ? (riderAnalytics.metrics.averageDeliveryTimeHours * 60).toFixed(0) : '0'} min
                                                        </p>
                                                    </div>
                                                    <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                                                        <p className="text-xs text-gray-500 mb-1">Total Earnings</p>
                                                        <p className="text-xl font-bold text-gray-900 dark:text-white">₹{(riderAnalytics.earnings.totalEarnings || 0).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* TAB: HISTORY */}
                                {modalTab === 'history' && selectedRider.status !== 'pending' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-4">
                                            <History size={20} className="text-yellow-600" />
                                            <h3 className="font-bold text-gray-900 dark:text-white">Order History ({riderAnalytics?.orderHistory?.count || 0} Orders)</h3>
                                        </div>

                                        {isLoadingAnalytics ? (
                                            <div className="text-center py-12">
                                                <Loader2 className="animate-spin text-yellow-500 mx-auto mb-4" size={32} />
                                                <p className="text-gray-500">Loading orders...</p>
                                            </div>
                                        ) : riderAnalytics?.orderHistory?.orders && riderAnalytics.orderHistory.orders.length > 0 ? (
                                            <div className="space-y-3">
                                                {riderAnalytics.orderHistory.orders.map((order) => (
                                                    <motion.div
                                                        key={order.id}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
                                                    >
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <h4 className="font-bold text-gray-900 dark:text-white">{order.orderNo}</h4>
                                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold capitalize ${order.status === 'delivered' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                                            order.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                                                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                                        }`}>
                                                                        {order.status}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                                                    <span className="font-semibold">₹{order.totalAmount}</span> • {order.itemCount} item(s)
                                                                </p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                    📍 {order.deliveryAddress}
                                                                </p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                    📞 {order.customerPhone}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-xs text-gray-500">
                                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {order.status === 'delivered' && order.deliveredAt && (
                                                            <div className="text-xs text-green-600 dark:text-green-400 pt-2 border-t border-gray-200 dark:border-gray-600">
                                                                ✓ Delivered on {new Date(order.deliveredAt).toLocaleDateString()} at {new Date(order.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 text-gray-500">
                                                <History size={48} className="mx-auto mb-4 opacity-30" />
                                                <p className="text-sm">No orders found for this rider</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* TAB: DOCS */}
                                {modalTab === 'docs' && (
                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex items-center gap-2 mb-4">
                                                <FileText size={20} className="text-yellow-600" />
                                                <h3 className="font-bold text-gray-900 dark:text-white">License / RC Document</h3>
                                            </div>
                                            <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-xl relative overflow-hidden border border-gray-200 dark:border-gray-600">
                                                {isLoadingAnalytics ? (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Loader2 className="animate-spin text-yellow-500" size={32} />
                                                    </div>
                                                ) : riderAnalytics?.documentDetails?.licenseImages && riderAnalytics.documentDetails.licenseImages.length > 0 ? (
                                                    <Image
                                                        src={riderAnalytics.documentDetails.licenseImages[0]}
                                                        alt="License document"
                                                        fill
                                                        className="object-contain"
                                                        sizes="(max-width: 768px) 100vw, 50vw"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                                                        <FileText size={48} className="mb-2 opacity-30" />
                                                        <p className="text-sm">No document uploaded</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between mt-3">
                                                <div className={`flex items-center gap-1 text-xs font-bold ${selectedRider.isVerified ? 'text-green-600' : 'text-orange-600'}`}>
                                                    {selectedRider.isVerified ? (
                                                        <><CheckCircle size={14} /> Verified</>
                                                    ) : (
                                                        <><Clock size={14} /> Pending Verification</>
                                                    )}
                                                </div>
                                                {riderAnalytics?.documentDetails?.licenseImages && riderAnalytics.documentDetails.licenseImages.length > 0 && (
                                                    <a
                                                        href={riderAnalytics.documentDetails.licenseImages[0]}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-blue-600 hover:underline"
                                                    >
                                                        View Full Size
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">License Number</p>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">{riderAnalytics?.documentDetails?.licenseNumber || selectedRider.licenseNumber || 'N/A'}</p>
                                            </div>
                                            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Document Status</p>
                                                <p className={`text-sm font-bold ${selectedRider.isVerified ? 'text-green-600' : 'text-orange-600'}`}>
                                                    {selectedRider.isVerified ? 'Verified' : 'Under Review'}
                                                </p>
                                            </div>
                                        </div>

                                        {riderAnalytics?.documentDetails && (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                                    <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase mb-1">Aadhar Number</p>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{riderAnalytics.documentDetails.aadharNumber || 'N/A'}</p>
                                                </div>
                                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                                    <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase mb-1">PAN Number</p>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{riderAnalytics.documentDetails.panNumber || 'N/A'}</p>
                                                </div>
                                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                                    <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase mb-1">Vehicle Number</p>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{riderAnalytics.documentDetails.vehicleNo || 'N/A'}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {selectedRider && selectedRider.status === "pending" && (
                                    <div className="mt-4 grid grid-cols-2 justify-between gap-2 sm:mt-20">
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (!confirm("Reject request?")) return;
                                                await ShopService.rejectRider(selectedRider.id);
                                                fetchRiders();
                                            }}
                                            className="py-2 rounded-xl bg-red-100 text-red-700 font-bold text-xs hover:bg-red-200 flex items-center justify-center gap-1"
                                        >
                                            <XCircle size={14} /> Reject
                                        </button>
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                await ShopService.riderStatusToggle(selectedRider.id, "approved");
                                                fetchRiders();
                                            }}
                                            className="py-2 rounded-xl bg-yellow-500 text-white font-bold text-xs hover:bg-yellow-600 shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-1"
                                        >
                                            <CheckCircle size={14} /> Accept
                                        </button>

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