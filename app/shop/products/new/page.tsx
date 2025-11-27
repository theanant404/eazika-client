"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
    ArrowLeft, 
    Upload, 
    X, 
    Loader2, 
    CheckCircle, 
    Image as ImageIcon,
    Package,
    DollarSign,
    FileText,
    Tag,
    Box
} from 'lucide-react';
import { ShopService } from '@/services/shopService';
import Image from 'next/image';

// Mock Categories
const CATEGORIES = ['Grocery', 'Vegetables', 'Fruits', 'Dairy', 'Bakery', 'Snacks', 'Beverages', 'Household'];

export default function NewProductPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'Grocery',
        price: '',
        stock: '',
        images: [] as string[],
        isGlobalProduct: false
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const url = await ShopService.uploadImage(file);
            setFormData(prev => ({ ...prev, images: [...prev.images, url] }));
        } catch (error) {
            console.error("Image upload failed", error);
        }
    };

    const removeImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.price || formData.images.length === 0) {
            alert("Please fill required fields and upload at least one image.");
            return;
        }

        setIsSubmitting(true);
        try {
            await ShopService.addProduct({
                ...formData,
                price: parseFloat(formData.price),
                stock: parseInt(formData.stock) || 0,
                productCategoryId: 1,
                globalProductId: 0,
                isActive: true
            });
            router.push('/shop/products');
        } catch (error) {
            console.error("Failed to add product", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto pb-20 w-full overflow-x-hidden">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6 md:mb-8">
                <button 
                    onClick={() => router.back()} 
                    className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    <ArrowLeft size={24} className="text-gray-800 dark:text-white" />
                </button>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Add New Product</h1>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
                
                {/* --- Left Column: Images (Takes 4/12 columns on Desktop) --- */}
                <div className="md:col-span-4 space-y-6">
                    {/* CHANGED: Removed 'sticky top-24' from mobile view, added 'md:sticky md:top-24' */}
                    <div className="bg-white dark:bg-gray-800 p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 md:sticky md:top-24">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-900 dark:text-white">Images</h3>
                            <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">{formData.images.length}/4</span>
                        </div>
                        
                        {/* Main Image Preview */}
                        <div className="aspect-square bg-gray-50 dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center relative overflow-hidden group mb-4">
                            {formData.images.length > 0 ? (
                                <Image 
                                    src={formData.images[0]} 
                                    alt="Main" 
                                    layout="fill" 
                                    objectFit="cover" 
                                    className="rounded-lg"
                                />
                            ) : (
                                <div className="text-center p-4">
                                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <ImageIcon className="text-gray-400" size={24} />
                                    </div>
                                    <p className="text-xs text-gray-500">Main Image</p>
                                </div>
                            )}
                        </div>

                        {/* Thumbnails Grid */}
                        <div className="grid grid-cols-4 gap-2">
                            {formData.images.map((img, idx) => (
                                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group bg-gray-50 dark:bg-gray-900">
                                    <Image src={img} alt={`Product ${idx}`} layout="fill" objectFit="cover" />
                                    <button 
                                        type="button"
                                        onClick={() => removeImage(idx)}
                                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={16} className="text-white" />
                                    </button>
                                </div>
                            ))}
                            
                            {/* Add Button */}
                            {formData.images.length < 4 && (
                                <button 
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="aspect-square rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center hover:border-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/10 transition-colors text-gray-400 hover:text-yellow-600"
                                >
                                    <Upload size={18} />
                                </button>
                            )}
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleImageUpload} 
                            className="hidden" 
                            accept="image/*"
                        />
                    </div>
                </div>

                {/* --- Right Column: Details (Takes 8/12 columns on Desktop) --- */}
                <div className="md:col-span-8 space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
                        <h3 className="font-bold text-gray-900 dark:text-white border-b dark:border-gray-700 pb-4">
                            Product Details
                        </h3>

                        <div className="space-y-5">
                            {/* Name */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Product Name <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input 
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-yellow-500 dark:text-white transition-colors text-sm md:text-base"
                                        placeholder="e.g. Fresh Farm Tomatoes"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {/* Category */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Category</label>
                                    <div className="relative">
                                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <select 
                                            name="category"
                                            value={formData.category}
                                            onChange={handleInputChange}
                                            className="w-full pl-10 pr-8 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-yellow-500 dark:text-white transition-colors appearance-none text-sm md:text-base"
                                        >
                                            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Price (₹) <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                                        <input 
                                            name="price"
                                            type="number"
                                            value={formData.price}
                                            onChange={handleInputChange}
                                            className="w-full pl-8 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-yellow-500 dark:text-white transition-colors text-sm md:text-base"
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Stock */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Initial Stock</label>
                                <div className="relative">
                                    <Box className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input 
                                        name="stock"
                                        type="number"
                                        value={formData.stock}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-yellow-500 dark:text-white transition-colors text-sm md:text-base"
                                        placeholder="e.g. 50"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Description</label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <textarea 
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows={4}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-yellow-500 dark:text-white transition-colors resize-none text-sm md:text-base"
                                        placeholder="Enter product details..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col-reverse sm:flex-row gap-4">
                        <button 
                            type="button"
                            onClick={() => router.back()}
                            className="flex-1 py-3.5 rounded-xl font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm md:text-base"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-3.5 rounded-xl font-bold text-white bg-yellow-500 hover:bg-yellow-600 transition-colors shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 disabled:opacity-70 text-sm md:text-base"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : (
                                <>
                                    <CheckCircle size={18} /> Save Product
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}