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
    Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

    useEffect(() => {
        fetchRiders();
    }, []);

    const fetchRiders = async () => {
        try {
            const data = await ShopService.getShopRiders();
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
        { title: 'Active Now', value: riders.filter(r => r.status !== 'offline').length, icon: Bike, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
        { title: 'Busy', value: riders.filter(r => r.status === 'busy').length, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
        { title: 'Total Deliveries', value: riders.reduce((acc, r) => acc + (r.totalDeliveries || 0), 0), icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
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

    const handleSendInvite = async () => {
        if (!foundUser) return;
        setIsSending(true);
        try {
            await ShopService.sendRiderInvite(foundUser.id);
            setInviteSent(true);
        } catch (error) {
            alert("Failed to send invite.");
        } finally {
            setIsSending(false);
        }
    };

    const resetModal = () => {
        setShowInviteModal(false);
        setInvitePhone('');
        setFoundUser(null);
        setInviteSent(false);
    };

    return (
        <div className="space-y-6 pb-24 md:pb-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Delivery Partners</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage your delivery fleet.</p>
                </div>
                <button 
                    onClick={() => setShowInviteModal(true)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-yellow-500/20 transition-transform active:scale-95 flex items-center justify-center gap-2 text-sm"
                >
                    <Plus size={20} /> Add New Rider
                </button>
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
                                className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                                            {rider.image ? (
                                                <Image src={rider.image} alt={rider.name} width={48} height={48} className="object-cover" />
                                            ) : (
                                                <User className="text-gray-400" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white">{rider.name}</h3>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className={`w-2 h-2 rounded-full ${
                                                    rider.status === 'available' ? 'bg-green-500' : 
                                                    rider.status === 'busy' ? 'bg-orange-500' : 
                                                    'bg-gray-400'
                                                }`} />
                                                <span className="text-xs text-gray-500 capitalize">{rider.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <MoreVertical size={18} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-gray-700">
                                    <div className="text-center flex-1 border-r border-gray-100 dark:border-gray-700">
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">{rider.activeOrders}</p>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">Active</p>
                                    </div>
                                    <div className="text-center flex-1 border-r border-gray-100 dark:border-gray-700">
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">{rider.totalDeliveries}</p>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">Total</p>
                                    </div>
                                    <div className="text-center flex-1">
                                        <p className="text-lg font-bold text-yellow-500 flex items-center justify-center gap-1">
                                            {rider.rating} <Star size={12} fill="currentColor" />
                                        </p>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">Rating</p>
                                    </div>
                                </div>
                                
                                <a href={`tel:${rider.phone}`} className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                    <Phone size={16} /> Call Rider
                                </a>
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
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Rider's Phone Number</label>
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
                                                onClick={handleSendInvite}
                                                disabled={isSending}
                                                className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                                            >
                                                {isSending ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Send Invite</>}
                                            </button>
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
        </div>
    );
}