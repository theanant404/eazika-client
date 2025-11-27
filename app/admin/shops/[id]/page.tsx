"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { mockShops } from '@/app/data/adminMock'; 
import { 
    ArrowLeft, 
    MapPin, 
    Phone, 
    Mail, 
    CheckCircle, 
    XCircle, 
    ShieldCheck, 
    FileText,
    ShoppingBag,
    Store,
    Ban
} from 'lucide-react';
import Link from 'next/link';

type Shop = typeof mockShops[0];

export default function AdminShopDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = Number(params.id);
    const [shop, setShop] = useState<Shop | null>(null);

    useEffect(() => {
        // Simulate fetch
        const found = mockShops.find(s => s.id === id);
        if (found) setShop(found);
    }, [id]);

    if (!shop) {
        return <div className="p-8 text-center text-gray-500">Shop not found...</div>;
    }

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <ArrowLeft size={24} className="text-gray-800 dark:text-white" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {shop.name}
                        {shop.status === 'active' && <CheckCircle size={20} className="text-green-500" />}
                    </h1>
                    <p className="text-sm text-gray-500">ID: #{shop.id} • Joined Jan 2024</p>
                </div>
                <div className="ml-auto flex gap-3">
                    {shop.status === 'pending' ? (
                        <>
                            <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg shadow-sm flex items-center gap-2">
                                <CheckCircle size={16} /> Approve Shop
                            </button>
                            <button className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-sm font-bold rounded-lg transition-colors flex items-center gap-2">
                                <XCircle size={16} /> Reject
                            </button>
                        </>
                    ) : (
                        <button className="px-4 py-2 border border-red-200 dark:border-red-900 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-bold rounded-lg transition-colors flex items-center gap-2">
                            <Ban size={16} /> Suspend Shop
                        </button>
                    )}
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg"><ShoppingBag size={20}/></div>
                        <span className="text-sm font-medium text-gray-500">Total Orders</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{shop.orders}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg"><Store size={20}/></div>
                        <span className="text-sm font-medium text-gray-500">Revenue</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{shop.revenue}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg"><ShieldCheck size={20}/></div>
                        <span className="text-sm font-medium text-gray-500">Compliance</span>
                    </div>
                    <p className="text-sm font-semibold text-green-600">Documents Verified</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 font-bold text-gray-900 dark:text-white">
                            Owner Details
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 font-bold text-lg">
                                    {shop.owner.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white">{shop.owner}</p>
                                    <p className="text-sm text-gray-500">Primary Owner</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                                    <Phone size={18} className="text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Phone</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">+91 98765 43210</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                                    <Mail size={18} className="text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Email</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">shop@eazika.com</p>
                                    </div>
                                </div>
                                <div className="col-span-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                                    <MapPin size={18} className="text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Address</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">Shop No. 4, Market Road, Civil Lines, Nagpur - 440001</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Documents Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 font-bold text-gray-900 dark:text-white">
                            Uploaded Documents
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-4">
                            {['GST Certificate', 'FSSAI License', 'PAN Card', 'Aadhar Card'].map((doc) => (
                                <div key={doc} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                        <FileText className="text-indigo-500" size={20} />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{doc}</span>
                                    </div>
                                    <span className="text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">Verified</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Bank & Meta */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 font-bold text-gray-900 dark:text-white">
                            Bank Details
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <p className="text-xs text-gray-500">Bank Name</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">State Bank of India</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Account Number</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">XXXXXXXX9012</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">IFSC Code</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">SBIN0001234</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}