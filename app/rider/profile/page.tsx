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
    const [activeTab, setActiveTab] = useState<'details' | 'documents'>('details');
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
    }, [profile]);

    // --- LOGIC 1: UPDATE TEXT DETAILS ---
    const handleSave = async () => {
        // We pass the local formData state to the store action
        await updateProfile(formData);
        setIsEditing(false); // Exit edit mode
    };

    // --- LOGIC 2: UPDATE DOCUMENTS (License) ---
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !profile) return;

        try {
            // Step A: Upload file to server and get the URL
            const url = await DeliveryService.uploadImage(file);
            
            // Step B: Add new URL to existing list
            const currentImages = profile.licenseImage || [];
            const newImages = [...currentImages, url];
            
            // Step C: Update profile with new list
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
            // Step A: Upload image to server
            const url = await DeliveryService.uploadImage(file);
            
            // Step B: Update profile with new image URL
            await updateProfile({ image: url });
        } catch (error) {
            console.error("Profile pic upload failed", error);
        }
    };

    if (!profile) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-900"><Loader2 className="animate-spin text-green-500" /></div>;
    }

    return (
        <div className="pb-24 md:pb-8 bg-gray-900 min-h-full">
            {/* --- HEADER SECTION --- */}
            <div className="bg-gray-800 p-8 pb-8 rounded-b-[2.5rem] shadow-lg border-b border-gray-700 relative overflow-hidden">
                <div className="flex flex-col items-center text-center relative z-10">
                    
                    {/* Profile Picture Clickable Area */}
                    <div 
                        className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-4 ring-4 ring-gray-600 overflow-hidden relative group cursor-pointer"
                        onClick={() => profileInputRef.current?.click()}
                    >
                        {profile.image ? (
                            <Image src={profile.image} alt={profile.name || "User"} layout="fill" objectFit="cover" />
                        ) : (
                            <User size={40} className="text-gray-400" />
                        )}
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
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

                    <h1 className="text-2xl font-bold text-white">{profile.name || "Delivery Partner"}</h1>
                    <p className="text-gray-400 text-sm mt-1">{profile.phone}</p>
                    
                    <div className="flex items-center gap-2 mt-4 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
                        <Bike size={14} className="text-green-500" />
                        <span className="text-green-500 text-xs font-bold uppercase">Online</span>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex justify-center mt-8 gap-4">
                    <button 
                        onClick={() => setActiveTab('details')}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                            activeTab === 'details' ? 'bg-white text-gray-900' : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Details
                    </button>
                    <button 
                        onClick={() => setActiveTab('documents')}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                            activeTab === 'documents' ? 'bg-white text-gray-900' : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Documents
                    </button>
                </div>
            </div>

            <div className="px-4 md:px-8 mt-6">
                <AnimatePresence mode="wait">
                    
                    {/* --- DETAILS TAB --- */}
                    {activeTab === 'details' && (
                        <motion.div 
                            key="details"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {/* Vehicle Details Card */}
                            <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Bike size={20} className="text-green-500" /> Vehicle Info
                                    </h3>
                                    <button 
                                        onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                        className={`p-2 rounded-lg transition-colors ${
                                            isEditing ? 'bg-green-500 text-gray-900' : 'bg-gray-700 text-gray-300 hover:text-white'
                                        }`}
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
                                            <label className="text-xs text-gray-500 uppercase font-bold block mb-1">{field.label}</label>
                                            {isEditing ? (
                                                <input 
                                                    value={formData[field.key as keyof typeof formData]} 
                                                    onChange={e => setFormData({...formData, [field.key]: e.target.value})}
                                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-green-500 outline-none"
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
                            <div className="grid grid-cols-1 gap-4">
                                <Link href="/rider/history" className="block">
                                    <div className="bg-gray-800 p-5 rounded-2xl border border-gray-700 hover:bg-gray-700 transition-colors cursor-pointer flex items-center justify-between">
                                        <div>
                                            <h4 className="text-gray-400 text-xs font-bold uppercase">Completed Deliveries</h4>
                                            <p className="text-3xl font-bold text-white mt-1">{history.length}</p>
                                        </div>
                                        <ArrowRight size={24} className="text-gray-500" />
                                    </div>
                                </Link>
                            </div>
                        </motion.div>
                    )}

                    {/* --- DOCUMENTS TAB --- */}
                    {activeTab === 'documents' && (
                        <motion.div 
                            key="documents"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                                    <FileBadge size={20} className="text-yellow-500" /> Official Docs
                                </h3>

                                <div className="space-y-6">
                                    {/* Aadhar (Read Only) */}
                                    <div className="flex items-center justify-between p-3 bg-gray-900 rounded-xl border border-gray-600">
                                        <div className="flex items-center gap-3">
                                            <FileText className="text-gray-400" />
                                            <div>
                                                <p className="text-white font-medium">Aadhar Card</p>
                                                <p className="text-xs text-gray-500">{profile.aadharNumber}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 text-green-500 text-xs font-bold bg-green-500/10 px-2 py-1 rounded-lg">
                                            <CheckCircle size={12} /> Verified
                                        </div>
                                    </div>

                                    {/* License Images */}
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <p className="text-sm text-gray-400 font-bold uppercase">Driving License</p>
                                            <button 
                                                onClick={() => fileInputRef.current?.click()}
                                                className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                            >
                                                <Upload size={12} /> Upload New
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
                                                <div key={i} className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden border border-gray-700">
                                                    <Image src={img} alt={`License ${i}`} layout="fill" objectFit="cover" />
                                                </div>
                                            ))}
                                            {(!profile.licenseImage || profile.licenseImage.length === 0) && (
                                                <div className="col-span-2 py-8 text-center text-gray-500 text-sm border-2 border-dashed border-gray-700 rounded-xl">
                                                    No license images uploaded
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}