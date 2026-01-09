"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useDeliveryStore } from '@/hooks/useDeliveryStore';
import { DeliveryService, DeliveryProfile } from '@/services/deliveryService';
import {
    User, Bike, CheckCircle, Edit, Save, Camera, Upload, Loader2, FileBadge, FileText
} from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function DeliveryProfilePage() {
    // 1. Get functions and data from the Store
    const { profile, history, fetchProfile, fetchHistory, updateProfile } = useDeliveryStore();

    // UI States
    const [activeTab, setActiveTab] = useState<'details' | 'documents' | 'shopkeeper'>('details');
    const [isEditing, setIsEditing] = useState(false);

    // Refs for hidden file inputs (to trigger click programmatically)
    const fileInputRef = useRef<HTMLInputElement>(null);
    const profileInputRef = useRef<HTMLInputElement>(null);

    // Form State for Text Inputs
    const [formData, setFormData] = useState({
        vehicleName: '',
        vehicleNo: '',
        vehicleOwnerName: '',
        licenseNumber: ''
    });

    // 2. Fetch Data on Mount
    useEffect(() => {
        fetchProfile();
        fetchHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 3. Sync Local State when Profile loads
    useEffect(() => {
        if (profile) {
            setFormData({
                vehicleName: profile.vehicleName || '',
                vehicleNo: profile.vehicleNo || '',
                vehicleOwnerName: profile.vehicleOwnerName || '',
                licenseNumber: profile.licenseNumber || ''
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile?.id]);

    // --- LOGIC 1: UPDATE TEXT DETAILS ---
    const handleSave = async () => {
        await updateProfile(formData);
        setIsEditing(false);
    };

    // --- LOGIC 2: UPDATE DOCUMENTS (License) ---
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !profile) return;

        try {
            const url = await DeliveryService.uploadImage(file);
            const currentImages = profile.licenseImage || [];
            const newImages = [...currentImages, url];
            await updateProfile({ licenseImage: newImages });
        } catch (error) {
            console.error("Document upload failed", error);
        }
    };

    // --- LOGIC 3: UPDATE PROFILE PICTURE ---
    const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const url = await DeliveryService.uploadImage(file);
            // console.log("Profile pic uploaded, updating profile...", url);
            await updateProfile({ avatar: url });
        } catch (error) {
            console.error("Profile pic upload failed", error);
        }
    };

    if (!profile) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-900"><Loader2 className="animate-spin text-green-500" /></div>;
    }

    return (
        <div className="min-h-screen flex items-center justify-center py-8 px-4 bg-linear-to-br from-gray-900 via-gray-950 to-gray-900">
            {/* Main Card Container */}
            <div className="w-full max-w-2xl">
                {/* --- HEADER SECTION --- */}
                <div className="bg-linear-to-tr from-green-900/60 via-gray-800 to-gray-900 p-6 pb-8 rounded-t-3xl shadow-2xl border border-gray-700 border-b-0 relative overflow-hidden">
                    {/* Decorative Gradient Circles */}
                    <div className="absolute -top-16 -left-16 w-56 h-56 bg-green-500/10 rounded-full blur-2xl z-0" />
                    <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-yellow-500/10 rounded-full blur-2xl z-0" />
                    <div className="flex flex-col items-center text-center relative z-10">
                        {/* Profile Picture Clickable Area */}
                        <div
                            className="w-24 h-24 bg-linear-to-tr from-green-700/30 to-gray-700 rounded-full flex items-center justify-center mb-3 ring-4 ring-green-500/20 shadow-lg overflow-hidden relative group cursor-pointer transition-transform hover:scale-105"
                            onClick={() => profileInputRef.current?.click()}
                        >
                            {profile.avatar ? (
                                <Image src={profile.avatar} alt={profile.name || "User"} layout="fill" objectFit="cover" />
                            ) : (
                                <User size={40} className="text-gray-400" />
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="text-white w-8 h-8" />
                            </div>
                        </div>
                        {/* Hidden Input for Profile Pic */}
                        <input
                            type="file"
                            ref={profileInputRef}
                            className="hidden"
                            onChange={handleProfilePicUpload}
                            accept="image/*"
                        />
                        <h1 className="text-2xl font-extrabold text-white drop-shadow-lg tracking-tight">{profile.name || "Delivery Partner"}</h1>
                        <p className="text-gray-300 text-sm mt-1 font-mono">{profile.phone}</p>
                        <div className="flex items-center gap-2 mt-3 bg-linear-to-r from-green-500/20 to-green-700/10 px-3 py-1.5 rounded-full border border-green-500/30 shadow-sm">
                            <Bike size={14} className="text-green-400" />
                            <span className="text-green-400 text-xs font-bold uppercase tracking-wider">Online</span>
                        </div>
                    </div>
                    {/* Navigation Tabs */}
                    <div className="flex justify-center mt-6 gap-3 relative z-10">
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all shadow-md ${activeTab === 'details' ? 'bg-linear-to-r from-yellow-400 to-green-400 text-gray-900 scale-105' : 'text-gray-300 hover:text-white bg-gray-800/60 hover:bg-gray-700/80'} duration-200`}
                        >
                            Details
                        </button>
                        <button
                            onClick={() => setActiveTab('documents')}
                            className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all shadow-md ${activeTab === 'documents' ? 'bg-linear-to-r from-yellow-400 to-green-400 text-gray-900 scale-105' : 'text-gray-300 hover:text-white bg-gray-800/60 hover:bg-gray-700/80'} duration-200`}
                        >
                            Documents
                        </button>
                        <button
                            onClick={() => setActiveTab('shopkeeper')}
                            className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all shadow-md ${activeTab === 'shopkeeper' ? 'bg-linear-to-r from-yellow-400 to-green-400 text-gray-900 scale-105' : 'text-gray-300 hover:text-white bg-gray-800/60 hover:bg-gray-700/80'} duration-200`}
                        >
                            Shopkeeper
                        </button>
                    </div>
                </div>

                <div className="px-6 py-6 bg-linear-to-b from-gray-800 to-gray-900 rounded-b-3xl shadow-2xl border border-gray-700 border-t-0">
                    <AnimatePresence mode="wait">
                        {/* --- DETAILS TAB --- */}
                        {activeTab === 'details' && (
                            <motion.div
                                key="details"
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                className="space-y-5"
                            >
                                {/* Vehicle Details Card */}
                                <div className="bg-linear-to-br from-gray-800 via-gray-900 to-gray-800 rounded-2xl p-5 border border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-extrabold text-white flex items-center gap-2 tracking-tight">
                                            <Bike size={20} className="text-green-400" /> Vehicle Info
                                        </h3>
                                        <button
                                            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                            className={`p-2 rounded-lg transition-colors shadow ${isEditing ? 'bg-green-400 text-gray-900' : 'bg-gray-700 text-gray-300 hover:text-white hover:bg-green-500/20'} duration-150`}
                                        >
                                            {isEditing ? <Save size={18} /> : <Edit size={18} />}
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        {/* Fields */}
                                        {[
                                            { label: 'Vehicle Model', key: 'vehicleName' as keyof typeof formData },
                                            { label: 'Vehicle Number', key: 'vehicleNo' as keyof typeof formData },
                                            { label: 'Owner Name', key: 'vehicleOwnerName' as keyof typeof formData }
                                        ].map((field) => (
                                            <div key={field.key}>
                                                <label className="text-xs text-gray-400 uppercase font-bold block mb-1 tracking-wider">{field.label}</label>
                                                {isEditing ? (
                                                    <input
                                                        value={formData[field.key as keyof typeof formData]}
                                                        onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-green-400 outline-none shadow-sm"
                                                    />
                                                ) : (
                                                    <p className="text-gray-200 font-medium">
                                                        {profile[field.key as keyof DeliveryProfile]}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {/* Stats Overview */}
                                <Link href="/rider/history" className="block">
                                    <div className="bg-linear-to-tr from-green-900/40 via-gray-800 to-gray-900 p-4 rounded-xl border border-green-700/30 hover:shadow-lg transition-all cursor-pointer flex items-center justify-between group">
                                        <div>
                                            <h4 className="text-green-400 text-xs font-bold uppercase tracking-wider">Completed Deliveries</h4>
                                            <p className="text-3xl font-extrabold text-white mt-1 drop-shadow-lg group-hover:text-green-300 transition-colors">{history.length}</p>
                                        </div>
                                        <ArrowRight size={24} className="text-green-400 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </Link>
                            </motion.div>
                        )}
                        {/* --- DOCUMENTS TAB --- */}
                        {activeTab === 'documents' && (
                            <motion.div
                                key="documents"
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                className="space-y-5"
                            >
                                <div className="bg-linear-to-br from-gray-800 via-gray-900 to-gray-800 rounded-2xl p-5 border border-gray-700 shadow-lg">
                                    <h3 className="text-lg font-extrabold text-white flex items-center gap-2 mb-4 tracking-tight">
                                        <FileBadge size={20} className="text-yellow-400" /> Official Docs
                                    </h3>
                                    <div className="space-y-5">
                                        {/* Aadhar (Read Only) */}
                                        <div className="flex items-center justify-between p-4 bg-linear-to-r from-gray-900 via-gray-800 to-gray-900 rounded-xl border border-gray-700 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <FileText className="text-gray-400" size={18} />
                                                <div>
                                                    <p className="text-white font-bold text-sm">Aadhar Card</p>
                                                    <p className="text-xs text-gray-400 font-mono">{profile.aadharNumber}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 text-green-400 text-xs font-bold bg-green-500/10 px-2 py-1 rounded-lg">
                                                <CheckCircle size={12} /> Verified
                                            </div>
                                        </div>
                                        {/* License Images */}
                                        <div>
                                            <div className="flex justify-between items-center mb-3">
                                                <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">Driving License</p>
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="text-xs bg-linear-to-r from-green-700/60 to-yellow-500/40 hover:from-green-600 hover:to-yellow-400 text-white px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 shadow"
                                                >
                                                    <Upload size={12} /> Upload
                                                </button>
                                                {/* Hidden File Input for Documents */}
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    className="hidden"
                                                    onChange={handleFileUpload}
                                                    accept="image/*"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                {profile.licenseImage?.map((img, i) => (
                                                    <div key={i} className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden border border-green-700/30 shadow-md hover:shadow-lg transition-shadow">
                                                        <Image src={img} alt={`License ${i}`} layout="fill" objectFit="cover" />
                                                    </div>
                                                ))}
                                                {(!profile.licenseImage || profile.licenseImage.length === 0) && (
                                                    <div className="col-span-2 py-6 text-center text-gray-500 text-xs border-2 border-dashed border-gray-700 rounded-lg bg-gray-900/60 hover:bg-gray-900/80 transition-colors">
                                                        No license images uploaded
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        {/* ---Shopkeeper Profile */}
                        {activeTab === 'shopkeeper' && (
                            <motion.div
                                key="shopkeeper"
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                className="space-y-5"
                            >
                                <div className="bg-linear-to-br from-gray-800 via-gray-900 to-gray-800 rounded-2xl p-5 border border-gray-700 shadow-lg">
                                    <h3 className="text-lg font-extrabold text-white flex items-center gap-2 mb-4 tracking-tight">
                                        <User size={20} className="text-yellow-400" /> Shop Details
                                    </h3>

                                    {(profile as any)?.shopkeeper ? (
                                        <div className="space-y-5">
                                            {/* Shop Image */}
                                            {(profile as any).shopkeeper.shopImage && (profile as any).shopkeeper.shopImage.length > 0 && (
                                                <div className="relative w-full aspect-video bg-gray-900 rounded-xl overflow-hidden border border-gray-700 shadow-md">
                                                    <Image
                                                        src={(profile as any).shopkeeper.shopImage[0]}
                                                        alt={(profile as any).shopkeeper.shopName || "Shop"}
                                                        layout="fill"
                                                        objectFit="cover"
                                                    />
                                                </div>
                                            )}

                                            {/* Shop Name & Category */}
                                            <div className="bg-linear-to-r from-gray-900 via-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700 shadow-sm">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="text-white font-bold text-lg">{(profile as any).shopkeeper.shopName || 'N/A'}</h4>
                                                        <p className="text-gray-400 text-sm capitalize mt-1">
                                                            {(profile as any).shopkeeper.shopCategory || 'N/A'}
                                                        </p>
                                                    </div>
                                                    <div className="bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/30">
                                                        <p className="text-green-400 text-xs font-bold uppercase">Partner</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Address Details */}
                                            {(profile as any).shopkeeper.address && (
                                                <div className="bg-linear-to-r from-gray-900 via-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700 shadow-sm space-y-3">
                                                    <h5 className="text-yellow-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                                        <FileBadge size={16} /> Shop Address
                                                    </h5>

                                                    <div className="space-y-2 text-sm">
                                                        {/* Contact Person & Phone */}
                                                        <div className="flex items-start gap-2">
                                                            <User size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                                            <div>
                                                                <p className="text-white font-medium">
                                                                    {(profile as any).shopkeeper.address.name}
                                                                </p>
                                                                <p className="text-gray-400 font-mono text-xs">
                                                                    {(profile as any).shopkeeper.address.phone}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Full Address */}
                                                        <div className="flex items-start gap-2">
                                                            <div className="text-gray-400 mt-0.5 flex-shrink-0">📍</div>
                                                            <p className="text-gray-300">
                                                                {(profile as any).shopkeeper.address.line1}
                                                                {(profile as any).shopkeeper.address.line2 && `, ${(profile as any).shopkeeper.address.line2}`}
                                                                {(profile as any).shopkeeper.address.street && `, ${(profile as any).shopkeeper.address.street}`}
                                                                <br />
                                                                {(profile as any).shopkeeper.address.city}, {(profile as any).shopkeeper.address.state}
                                                                <br />
                                                                {(profile as any).shopkeeper.address.country} - {(profile as any).shopkeeper.address.pinCode}
                                                            </p>
                                                        </div>

                                                        {/* Geo Location */}
                                                        {(profile as any).shopkeeper.address.geoLocation && (
                                                            <div className="flex items-start gap-2">
                                                                <div className="text-gray-400 mt-0.5 flex-shrink-0">🗺️</div>
                                                                <p className="text-gray-400 font-mono text-xs">
                                                                    {(profile as any).shopkeeper.address.geoLocation}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Earnings */}

                                        </div>
                                    ) : (
                                        <div className="py-8 text-center">
                                            <p className="text-gray-400 text-sm">No shopkeeper information available</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
