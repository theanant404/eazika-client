"use client";

import React, { useState, useEffect } from "react";
import { AdminService } from "@/services/adminService";
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Upload, 
  Image as ImageIcon,
  DollarSign,
  Package,
  Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";

interface ProductCategory {
  id: number;
  name: string;
  description: string;
}

interface PriceOption {
  price: number;
  discount: number;
  weight: number;
  unit: string;
  stock: number;
}

export default function AddGlobalProductPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  
  // Form State
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  
  const [images, setImages] = useState<string[]>([""]);
  const [pricing, setPricing] = useState<PriceOption[]>([
    { price: 0, discount: 0, weight: 0, unit: "grams", stock: 0 }
  ]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const cats = await AdminService.getAllCategories();
      setCategories(cats);
    } catch (error) {
      console.error("Failed to fetch product categories", error);
    }
  };

  // --- Handlers ---

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...images];
    newImages[index] = value;
    setImages(newImages);
  };

  const addImageField = () => {
    setImages([...images, ""]);
  };

  const removeImageField = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages.length ? newImages : [""]);
  };

  const handlePriceChange = (index: number, field: keyof PriceOption, value: any) => {
    const newPricing = [...pricing];
    newPricing[index] = { ...newPricing[index], [field]: value };
    setPricing(newPricing);
  };

  const addPriceOption = () => {
    setPricing([...pricing, { price: 0, discount: 0, weight: 0, unit: "grams", stock: 0 }]);
  };

  const removePriceOption = (index: number) => {
    const newPricing = pricing.filter((_, i) => i !== index);
    setPricing(newPricing.length ? newPricing : [{ price: 0, discount: 0, weight: 0, unit: "grams", stock: 0 }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      alert("Please select a category");
      return;
    }
    
    // Filter out empty images
    const validImages = images.filter(img => img.trim() !== "");
    if (validImages.length === 0) {
      alert("Please add at least one image URL");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        productCategoryId: Number(categoryId),
        name,
        brand: brand || undefined,
        description: description || undefined,
        images: validImages,
        pricing: pricing.map(p => ({
            ...p,
            price: Number(p.price),
            discount: Number(p.discount),
            weight: Number(p.weight),
            stock: Number(p.stock),
        }))
      };

      await AdminService.createGlobalProduct(payload);
      alert("Product created successfully!");
      // Reset form or redirect
      router.push("/admin"); 
    } catch (error) {
      console.error("Failed to create product", error);
      alert("Failed to create product. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-white dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-600 dark:text-gray-300"/>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add Global Product</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Add a new product to the global catalog</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- Left Column: Basic Details --- */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
            <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-4">Product Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Product Name *</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required
                  className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Basmati Rice"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Brand Name</label>
                <input 
                  type="text" 
                  value={brand} 
                  onChange={(e) => setBrand(e.target.value)} 
                  className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. India Gate"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category *</label>
              <select 
                value={categoryId} 
                onChange={(e) => setCategoryId(Number(e.target.value))}
                required 
                className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Detailed description of the product..."
              />
            </div>
          </div>

          {/* --- Detailed Pricing --- */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg text-gray-800 dark:text-white">Pricing & Variants</h3>
              <button type="button" onClick={addPriceOption} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                <Plus size={16} /> Add Variant
              </button>
            </div>

            <div className="space-y-4">
              {pricing.map((option, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 relative">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">Price (₹)</label>
                      <input 
                        type="number" 
                        min="0"
                        value={option.price}
                        onChange={(e) => handlePriceChange(index, "price", e.target.value)}
                        className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-sm"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">Discount (%)</label>
                      <input 
                        type="number" 
                        min="0" max="100"
                        value={option.discount}
                        onChange={(e) => handlePriceChange(index, "discount", e.target.value)}
                        className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">Weight</label>
                      <input 
                        type="number" 
                        min="0"
                        value={option.weight}
                        onChange={(e) => handlePriceChange(index, "weight", e.target.value)}
                        className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">Unit</label>
                      <select 
                        value={option.unit}
                        onChange={(e) => handlePriceChange(index, "unit", e.target.value)}
                        className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-sm"
                      >
                         {['grams', 'kg', 'ml', 'litre', 'piece'].map(u => (
                             <option key={u} value={u}>{u}</option>
                         ))}
                      </select>
                    </div>

                    <div className="space-y-1 relative">
                       <label className="text-xs font-medium text-gray-500">Stock</label>
                       <div className="flex items-center gap-2">
                            <input 
                                type="number" 
                                min="0"
                                value={option.stock}
                                onChange={(e) => handlePriceChange(index, "stock", e.target.value)}
                                className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-sm"
                            />
                            {pricing.length > 1 && (
                                <button 
                                    type="button" 
                                    onClick={() => removePriceOption(index)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                       </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* --- Right Column: Images & Publish --- */}
        <div className="space-y-6">
            
          {/* Image Upload */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
             <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-4">Product Images</h3>
             <div className="space-y-3">
                {images.map((img, idx) => (
                    <div key={idx} className="flex gap-2">
                        <div className="flex-1 space-y-1">
                            <input 
                                type="text"
                                placeholder="Paste image URL..."
                                value={img}
                                onChange={(e) => handleImageChange(idx, e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                         <button 
                            type="button" 
                            onClick={() => removeImageField(idx)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            disabled={images.length === 1 && idx === 0}
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
                
                <button 
                  type="button"
                  onClick={addImageField} 
                  className="w-full py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                    <Plus size={16} /> Add Another Image
                </button>
             </div>

             {/* Preview Grid */}
             <div className="mt-4 grid grid-cols-3 gap-2">
                {images.filter(i => i).map((img, i) => (
                    <div key={i} className="aspect-square rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden relative border border-gray-200 dark:border-gray-600">
                        <img src={img} alt={`Preview ${i}`} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')}/>
                    </div>
                ))}
             </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-4 sticky top-6">
              <h3 className="font-semibold text-gray-800 dark:text-white">Publish Action</h3>
              <p className="text-xs text-gray-500">Ensure all details are correct before publishing to the global catalog.</p>
              
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  Publish Product
              </button>
          </div>

        </div>

      </form>
    </div>
  );
}
