"use client";

import React, { useState, useEffect } from "react";
import { AdminService } from "@/services/adminService";
import {
    Search,
    Store,
    X,
    CheckCircle,
    XCircle,
    Phone,
    MapPin,
    FileText,
    CreditCard,
    Ban,
    Eye,
    Package,
    Star,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { toast } from "sonner";

export default function AdminShopsPage() {
    const [shops, setShops] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedShop, setSelectedShop] = useState<any | null>(null);
    const [modalTab, setModalTab] = useState<'overview' | 'address' | 'documents' | 'bank'>('overview');

    const fetchShops = async () => {
        try {
            setLoading(true);
            const data = await AdminService.getAllShops(
                statusFilter === "all" ? undefined : statusFilter
            );
            console.log(data);
            setShops(data);
        } catch (error) {
            console.error("Failed to fetch shops", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShops();
    }, [statusFilter]);

    const handleApprove = async (shopId: number) => {
        if (!confirm("Are you sure you want to approve this shop?")) return;
        try {
            await AdminService.verifyShop(shopId, "active");
            toast.success("Shop approved successfully!");
            fetchShops();
            setSelectedShop(null);
        } catch (error) {
            toast.error("Failed to approve shop");
        }
    };

    const handleReject = async (shopId: number) => {
        if (!confirm("Are you sure you want to reject this shop?")) return;
        try {
            await AdminService.verifyShop(shopId, "rejected");
            toast.success("Shop rejected");
            fetchShops();
            setSelectedShop(null);
        } catch (error) {
            toast.error("Failed to reject shop");
        }
    };

    const handleSuspend = async (shopId: number) => {
        if (!confirm("Are you sure you want to suspend this shop?")) return;
        try {
            await AdminService.toggleShopStatus(shopId, false);
            toast.success("Shop suspended");
            fetchShops();
        } catch (error) {
            toast.error("Failed to suspend shop");
        }
    };

    const openShopModal = (shop: any) => {
        setSelectedShop(shop);
        setModalTab('overview');
    };

    const filteredShops = shops.filter(
        (s) =>
            s.shopName.toLowerCase().includes(search.toLowerCase()) ||
            s.user.name.toLowerCase().includes(search.toLowerCase()) ||
            s.user.phone.includes(search)
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'pending': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
            case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            case 'suspended': return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    return (
        <div className="space-y-6 pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Manage Shops
                </h1>
                <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search shops..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm w-full sm:w-64 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                {['all', 'pending', 'active', 'rejected'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-4 py-2 text-sm font-bold capitalize border-b-2 transition-colors ${statusFilter === status
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* Shop Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredShops.map((shop) => (
                    <motion.div
                        key={shop.id}
                        layout
                        className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col hover:border-blue-500/50 transition-colors group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-lg relative overflow-hidden">
                                    {shop.shopImages?.[0] ? (
                                        <Image
                                            src={shop.shopImages[0]}
                                            alt={shop.shopName}
                                            fill
                                            className="object-cover"
                                            sizes="48px"
                                        />
                                    ) : (
                                        <Store size={24} />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {shop.shopName}
                                    </h3>
                                    <p className="text-xs text-gray-500 capitalize">{shop.shopCategory}</p>
                                </div>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${getStatusColor(shop.status)}`}>
                                {shop.status}
                            </span>
                        </div>

                        <div className="space-y-2 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                <Phone size={14} className="text-blue-500" />
                                <span>{shop.user.phone}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                <MapPin size={14} className="text-orange-500" />
                                <span className="line-clamp-1">
                                    {shop.address ? `${shop.address.city}, ${shop.address.state}` : 'Address not available'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                <CreditCard size={14} className="text-green-500" />
                                <span>FSSAI: {shop.fssaiNumber}</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-auto space-y-2">
                            {shop.status === 'pending' ? (
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => handleReject(shop.id)}
                                        className="py-2 px-3 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                                    >
                                        <XCircle size={14} /> Reject
                                    </button>
                                    <button
                                        onClick={() => handleApprove(shop.id)}
                                        className="py-2 px-3 bg-green-500 text-white hover:bg-green-600 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                                    >
                                        <CheckCircle size={14} /> Accept
                                    </button>
                                    <button
                                        onClick={() => openShopModal(shop)}
                                        className="py-2 px-3 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                                    >
                                        <Eye size={14} /> View
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => handleSuspend(shop.id)}
                                        className="py-2 px-3 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                                    >
                                        <Ban size={14} /> Suspend
                                    </button>
                                    <button
                                        onClick={() => openShopModal(shop)}
                                        className="py-2 px-3 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                                    >
                                        <Eye size={14} /> View
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            {filteredShops.length === 0 && !loading && (
                <div className="text-center py-12 text-gray-500">
                    <Store size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No shops found</p>
                </div>
            )}

            {/* --- Shop Details Modal --- */}
            <AnimatePresence>
                {selectedShop && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Header */}
                            <div className="p-6 pb-0 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg relative overflow-hidden">
                                            {selectedShop.shopImages?.[0] ? (
                                                <Image
                                                    src={selectedShop.shopImages[0]}
                                                    alt={selectedShop.shopName}
                                                    fill
                                                    className="object-cover"
                                                    sizes="64px"
                                                />
                                            ) : (
                                                <Store size={32} />
                                            )}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                                {selectedShop.shopName}
                                            </h2>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${getStatusColor(selectedShop.status)}`}>
                                                    {selectedShop.status}
                                                </span>
                                                <span className="text-gray-400 text-xs">• ID: #{selectedShop.id}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedShop(null)}
                                        className="p-2 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Tabs */}
                                <div className="flex gap-1 overflow-x-auto">
                                    {['overview', 'address', 'documents', 'bank'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setModalTab(tab as any)}
                                            className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors capitalize ${modalTab === tab
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
                            <div className="p-6 overflow-y-auto flex-1">
                                {/* TAB: OVERVIEW */}
                                {modalTab === 'overview' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800">
                                                <p className="text-xs text-blue-600 dark:text-blue-400 uppercase font-bold mb-1">Shop Category</p>
                                                <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">{selectedShop.shopCategory}</p>
                                            </div>
                                            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-800">
                                                <p className="text-xs text-green-600 dark:text-green-400 uppercase font-bold mb-1">FSSAI Number</p>
                                                <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedShop.fssaiNumber}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">GST Number</p>
                                                <p className="font-bold text-gray-900 dark:text-white">{selectedShop.gstNumber || 'Not provided'}</p>
                                            </div>
                                            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Owner Name</p>
                                                <p className="font-bold text-gray-900 dark:text-white">{selectedShop.user.name || 'Not available'}</p>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                                            <p className="text-xs text-gray-500 uppercase font-bold mb-2">Contact Information</p>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Phone size={16} className="text-blue-500" />
                                                    <span className="text-gray-900 dark:text-white font-medium">{selectedShop.user.phone}</span>
                                                </div>
                                                {selectedShop.user.email && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-600 dark:text-gray-400">{selectedShop.user.email}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {selectedShop.status === 'pending' && (
                                            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                                <h3 className="font-bold text-gray-900 dark:text-white mb-3">Approval Actions</h3>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <button
                                                        onClick={() => handleReject(selectedShop.id)}
                                                        className="py-3 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                                                    >
                                                        <XCircle size={18} /> Reject Application
                                                    </button>
                                                    <button
                                                        onClick={() => handleApprove(selectedShop.id)}
                                                        className="py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                                                    >
                                                        <CheckCircle size={18} /> Approve Shop
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* TAB: ADDRESS */}
                                {modalTab === 'address' && (
                                    <div className="space-y-4">
                                        {selectedShop.address ? (
                                            <>
                                                <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl border border-orange-200 dark:border-orange-800">
                                                    <div className="flex items-start gap-3">
                                                        <MapPin className="text-orange-600 dark:text-orange-400 mt-1" size={20} />
                                                        <div className="flex-1">
                                                            <p className="text-xs text-orange-600 dark:text-orange-400 uppercase font-bold mb-2">Full Address</p>
                                                            <p className="text-gray-900 dark:text-white font-medium leading-relaxed">
                                                                {selectedShop.address.line1}
                                                                {selectedShop.address.line2 && `, ${selectedShop.address.line2}`}
                                                                {selectedShop.address.street && `, ${selectedShop.address.street}`}
                                                                <br />
                                                                {selectedShop.address.city}, {selectedShop.address.state} - {selectedShop.address.pinCode}
                                                                <br />
                                                                {selectedShop.address.country}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                                                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Contact Name</p>
                                                        <p className="font-bold text-gray-900 dark:text-white">{selectedShop.address.name}</p>
                                                    </div>
                                                    <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                                                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Phone</p>
                                                        <p className="font-bold text-gray-900 dark:text-white">{selectedShop.address.phone}</p>
                                                    </div>
                                                </div>

                                                {selectedShop.address.geoLocation && (
                                                    <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                                                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Geo Location</p>
                                                        <p className="font-mono text-sm text-gray-900 dark:text-white">{selectedShop.address.geoLocation}</p>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="text-center py-8 text-gray-500">
                                                <MapPin size={48} className="mx-auto mb-4 opacity-50" />
                                                <p>No address information available</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* TAB: DOCUMENTS */}
                                {modalTab === 'documents' && (
                                    <div className="space-y-6">
                                        {selectedShop.document ? (
                                            <div className="grid grid-cols-2 gap-4">
                                                {/* Aadhar Card */}
                                                <div className="space-y-2">
                                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                        <FileText size={16} className="text-blue-500" /> Aadhar Card
                                                    </p>
                                                    <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-xl relative overflow-hidden border border-gray-200 dark:border-gray-600">
                                                        {selectedShop.document.aadharImage ? (
                                                            <Image
                                                                src={selectedShop.document.aadharImage}
                                                                alt="Aadhar"
                                                                fill
                                                                className="object-cover"
                                                                sizes="(max-width: 768px) 100vw, 50vw"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                                                                Not uploaded
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* PAN Card */}
                                                <div className="space-y-2">
                                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                        <CreditCard size={16} className="text-green-500" /> PAN Card
                                                    </p>
                                                    <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-xl relative overflow-hidden border border-gray-200 dark:border-gray-600">
                                                        {selectedShop.document.panImage ? (
                                                            <Image
                                                                src={selectedShop.document.panImage}
                                                                alt="PAN"
                                                                fill
                                                                className="object-cover"
                                                                sizes="(max-width: 768px) 100vw, 50vw"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                                                                Not uploaded
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Electricity Bill */}
                                                <div className="space-y-2">
                                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                        <FileText size={16} className="text-yellow-500" /> Electricity Bill
                                                    </p>
                                                    <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-xl relative overflow-hidden border border-gray-200 dark:border-gray-600">
                                                        {selectedShop.document.electricityBillImage ? (
                                                            <Image
                                                                src={selectedShop.document.electricityBillImage}
                                                                alt="Electricity Bill"
                                                                fill
                                                                className="object-cover"
                                                                sizes="(max-width: 768px) 100vw, 50vw"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                                                                Not uploaded
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Business Certificate */}
                                                <div className="space-y-2">
                                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                        <FileText size={16} className="text-purple-500" /> Business Certificate
                                                    </p>
                                                    <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-xl relative overflow-hidden border border-gray-200 dark:border-gray-600">
                                                        {selectedShop.document.businessCertificateImage ? (
                                                            <Image
                                                                src={selectedShop.document.businessCertificateImage}
                                                                alt="Business Certificate"
                                                                fill
                                                                className="object-cover"
                                                                sizes="(max-width: 768px) 100vw, 50vw"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                                                                Not uploaded
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-gray-500">
                                                <FileText size={48} className="mx-auto mb-4 opacity-50" />
                                                <p>No documents available</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* TAB: BANK */}
                                {modalTab === 'bank' && (
                                    <div className="space-y-4">
                                        {selectedShop.bankDetail ? (
                                            <>
                                                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border border-purple-200 dark:border-purple-800">
                                                    <p className="text-xs text-purple-600 dark:text-purple-400 uppercase font-bold mb-1">Account Holder</p>
                                                    <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedShop.bankDetail.accountHolderName}</p>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                                                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Account Number</p>
                                                        <p className="font-mono text-lg font-bold text-gray-900 dark:text-white">{selectedShop.bankDetail.accountNumber}</p>
                                                    </div>
                                                    <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                                                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">IFSC Code</p>
                                                        <p className="font-mono text-lg font-bold text-gray-900 dark:text-white">{selectedShop.bankDetail.ifscCode}</p>
                                                    </div>
                                                </div>

                                                <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                                                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Bank Name</p>
                                                    <p className="font-bold text-gray-900 dark:text-white">{selectedShop.bankDetail.bankName}</p>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center py-8 text-gray-500">
                                                <CreditCard size={48} className="mx-auto mb-4 opacity-50" />
                                                <p>No bank details available</p>
                                            </div>
                                        )}
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
