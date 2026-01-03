"use client";

import React, { useState, useEffect } from "react";
import { AdminService } from "@/services/adminService";
import { shopService } from "@/services/shopService";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  DollarSign,
  Package,
  Loader2,
  Edit,
  X,
  Search
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";

interface ProductCategory {
  id: number;
  name: string;
  description: string;
}

interface GlobalProduct {
  id: number;
  name: string;
  brand?: string;
  description?: string;
  category?: string;
  images: string[];
  productCategoryId?: number;
  isActive?: boolean;
}

// interface PriceOption {
//   price: number;
//   discount: number;
//   weight: number;
//   unit: string;
//   stock: number;
// }

export default function GlobalProductPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [globalProducts, setGlobalProducts] = useState<GlobalProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State for Adding New Product
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [images, setImages] = useState<string[]>([""]);
  const [isActive, setIsActive] = useState(true);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<GlobalProduct | null>(null);
  const [editName, setEditName] = useState("");
  const [editBrand, setEditBrand] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategoryId, setEditCategoryId] = useState<number | "">("");
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editIsActive, setEditIsActive] = useState(true);
  const [editLoading, setEditLoading] = useState(false);

  // Discontinue Modal State
  const [isDiscontinueModalOpen, setIsDiscontinueModalOpen] = useState(false);
  const [productToDiscontinue, setProductToDiscontinue] = useState<GlobalProduct | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchGlobalProducts();
  }, [currentPage]);

  const fetchCategories = async () => {
    try {
      const cats = await AdminService.getAllCategories();
      setCategories(cats);
    } catch (error) {
      console.error("Failed to fetch product categories", error);
    }
  };

  const fetchGlobalProducts = async () => {
    try {
      setIsLoading(true);
      const response = await AdminService.getAllGlobalProducts(currentPage, 20);
      // console.log("Fetched global products:", response);
      // Align with API shape: some endpoints return `globalProducts`
      setGlobalProducts((response as any).globalProducts || response.products || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Failed to fetch global products", error);
      toast.error("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Handlers ---

  // const handleImageChange = (index: number, value: string) => {
  //   const newImages = [...images];
  //   newImages[index] = value;
  //   setImages(newImages);
  // };

  // const addImageField = () => {
  //   setImages([...images, ""]);
  // };

  // const removeImageField = (index: number) => {
  //   const newImages = images.filter((_, i) => i !== index);
  //   setImages(newImages.length ? newImages : [""]);
  // };

  // const handlePriceChange = (index: number, field: keyof PriceOption, value: any) => {
  //   const newPricing = [...pricing];
  //   newPricing[index] = { ...newPricing[index], [field]: value };
  //   setPricing(newPricing);
  // };

  // const addPriceOption = () => {
  //   setPricing([...pricing, { price: 0, discount: 0, weight: 0, unit: "grams", stock: 0 }]);
  // };

  // const removePriceOption = (index: number) => {
  //   const newPricing = pricing.filter((_, i) => i !== index);
  //   setPricing(newPricing.length ? newPricing : [{ price: 0, discount: 0, weight: 0, unit: "grams", stock: 0 }]);
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      toast.error("Please select a category");
      return;
    }

    // Filter out empty images
    const validImages = images.filter(img => img.trim() !== "");
    if (validImages.length === 0) {
      toast.error("Please add at least one image URL");
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
        isActive,
      };

      await AdminService.createGlobalProduct(payload);
      toast.success("Product created successfully!");
      // Reset form
      setName("");
      setBrand("");
      setDescription("");
      setCategoryId("");
      setImages([""]);
      setIsActive(true);
      fetchGlobalProducts();
    } catch (error) {
      console.error("Failed to create product", error);
      toast.error("Failed to create product");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (product: GlobalProduct) => {
    setEditingProduct(product);
    setEditName(product.name);
    setEditBrand(product.brand || "");
    setEditDescription(product.description || "");
    setEditCategoryId(product.productCategoryId || "");
    setEditImages(product.images || []);
    setEditIsActive(product.isActive ?? true);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setEditLoading(true);
    try {
      const validImages = editImages.filter(img => img.trim() !== "");
      const payload = {
        productCategoryId: Number(editCategoryId),
        name: editName,
        brand: editBrand || undefined,
        description: editDescription || undefined,
        images: validImages,
        isActive: editIsActive,
      };

      // You'll need to add this method to AdminService
      await AdminService.updateProductDetails(editingProduct.id, payload);
      toast.success("Product updated successfully!");
      setIsEditModalOpen(false);
      fetchGlobalProducts();
    } catch (error) {
      console.error("Failed to update product", error);
      toast.error("Failed to update product");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDiscontinueClick = (product: GlobalProduct) => {
    setProductToDiscontinue(product);
    setIsDiscontinueModalOpen(true);
  };

  const handleDiscontinueConfirm = async () => {
    if (!productToDiscontinue) return;

    try {
      // Toggle the product active status
      const newStatus = !productToDiscontinue.isActive;
      await AdminService.toggleProductStatus(productToDiscontinue.id, newStatus);
      toast.success(newStatus ? "Product continued successfully!" : "Product discontinued successfully!");
      setIsDiscontinueModalOpen(false);
      fetchGlobalProducts();
    } catch (error) {
      console.error("Failed to toggle product status", error);
      toast.error("Failed to update product status");
    }
  };

  const filteredProducts = globalProducts.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.brand?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-white dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-600 dark:text-gray-300" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Global Products</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage global product catalog</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">Add new products to the global catalog.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm((open) => !open)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow transition-colors"
        >
          {showAddForm ? "Close Form" : "Add Product"}
        </button>
      </div>

      {showAddForm && (
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
                  className="w-full px-4 py-2 h-10 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="" className="text-gray-500">Select Category</option>
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

              <div className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-700 px-4 py-3 border border-gray-200 dark:border-gray-600">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Toggle to control whether the product is visible to shops.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive((prev) => !prev)}
                  className={`w-14 h-8 rounded-full flex items-center px-1 transition-colors ${isActive ? "bg-green-500" : "bg-gray-400"}`}
                  aria-pressed={isActive}
                >
                  <span
                    className={`h-6 w-6 rounded-full bg-white shadow transform transition-transform ${isActive ? "translate-x-6" : "translate-x-0"}`}
                  />
                </button>
              </div>
            </div>

            {/* --- Detailed Pricing --- */}
            {/* <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
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
          </div> */}
          </div>

          {/* --- Right Column: Images & Publish --- */}
          <div className="space-y-6">

            {/* Image Upload */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-4">Product Images</h3>
              <div className="space-y-4">

                {/* Upload Button */}
                <div>
                  <label htmlFor="image-upload" className="cursor-pointer w-full py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex flex-col items-center justify-center gap-2">
                    <Upload size={32} className="text-gray-400" />
                    <span className="text-sm font-medium">Click to upload images</span>
                  </label>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={async (e) => {
                      if (!e.target.files?.length) return;
                      const files = Array.from(e.target.files);

                      try {
                        setIsLoading(true);

                        // 1. Get Signed URLs using defined axiosInstance
                        const { data: { files: signedData } } = await import("@/lib/axios").then(m => m.default.post("/uploads/product", {
                          files: files.map(f => ({ fileName: f.name, contentType: f.type }))
                        }));

                        // 2. Upload to GCS
                        await Promise.all(signedData.map(async (fileData: any, i: number) => {
                          await fetch(fileData.signedUrl, {
                            method: 'PUT',
                            body: files[i],
                            headers: { 'Content-Type': files[i].type }
                          });
                        }));

                        // 3. Update State with Public URLs
                        const newUrls = signedData.map((d: any) => d.publicUrl);
                        setImages(prev => [...prev.filter(url => url.trim() !== ""), ...newUrls]);

                      } catch (error) {
                        console.error("Upload failed", error);
                        alert("Failed to upload images");
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                  />
                </div>

                {/* Preview Grid */}
                {images.filter(i => i).length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {images.filter(i => i).map((img, i) => (
                      <div key={i} className="aspect-square rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden relative border border-gray-200 dark:border-gray-600 group">
                        <Image height={100} width={100} src={img} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = images.filter(url => url !== img);
                            setImages(newImages.length ? newImages : [""]);
                          }}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-base focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
        />
      </div>

      {/* Global Products Grid */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Global Products ({globalProducts.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all"
              >
                <div className="flex gap-3 mb-3">
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                    <Image
                      src={product.images?.[0] || "/placeholder.png"}
                      alt={product.name}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {product.name}
                    </h3>
                    {product.brand && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {product.brand}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1 truncate">
                      {product.category || "Uncategorized"}
                    </p>
                    <div className="mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${product.isActive
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                        {product.isActive ? 'Active' : 'Discontinued'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditClick(product)}
                    className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Edit size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDiscontinueClick(product)}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors ${product.isActive
                      ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
                      : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
                      }`}
                  >
                    {product.isActive ? 'Discontinue' : 'Continue'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No products found
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="absolute right-3 top-3 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 z-10"
            >
              <X size={20} />
            </button>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Global Product</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Product Name *</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Brand Name</label>
                  <input
                    type="text"
                    value={editBrand}
                    onChange={(e) => setEditBrand(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category *</label>
                <select
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(Number(e.target.value))}
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
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-700 px-4 py-3 border border-gray-200 dark:border-gray-600">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Toggle to control whether the product remains available.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditIsActive((prev) => !prev)}
                  className={`w-14 h-8 rounded-full flex items-center px-1 transition-colors ${editIsActive ? "bg-green-500" : "bg-gray-400"}`}
                  aria-pressed={editIsActive}
                >
                  <span
                    className={`h-6 w-6 rounded-full bg-white shadow transform transition-transform ${editIsActive ? "translate-x-6" : "translate-x-0"}`}
                  />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Product Images</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                  onChange={async (e) => {
                    if (!e.target.files?.length) return;
                    const files = Array.from(e.target.files);

                    try {
                      setEditLoading(true);
                      const { data: { files: signedData } } = await import("@/lib/axios").then(m => m.default.post("/uploads/product", {
                        files: files.map(f => ({ fileName: f.name, contentType: f.type }))
                      }));

                      await Promise.all(signedData.map(async (fileData: any, i: number) => {
                        await fetch(fileData.signedUrl, {
                          method: 'PUT',
                          body: files[i],
                          headers: { 'Content-Type': files[i].type }
                        });
                      }));

                      const newUrls = signedData.map((d: any) => d.publicUrl);
                      setEditImages(prev => [...prev.filter(url => url.trim() !== ""), ...newUrls]);
                    } catch (error) {
                      console.error("Upload failed", error);
                      toast.error("Failed to upload images");
                    } finally {
                      setEditLoading(false);
                    }
                  }}
                />

                {editImages.filter(i => i).length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {editImages.filter(i => i).map((img, i) => (
                      <div key={i} className="aspect-square rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden relative border border-gray-200 dark:border-gray-600 group">
                        <Image height={100} width={100} src={img} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = editImages.filter(url => url !== img);
                            setEditImages(newImages.length ? newImages : []);
                          }}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {editLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  Update Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discontinue Confirmation Modal */}
      {isDiscontinueModalOpen && productToDiscontinue && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {productToDiscontinue.isActive ? 'Discontinue Product?' : 'Continue Product?'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {productToDiscontinue.isActive
                ? `Are you sure you want to discontinue "${productToDiscontinue.name}"? This will make it unavailable for shops to add.`
                : `Are you sure you want to continue "${productToDiscontinue.name}"? This will make it available again for shops.`
              }
            </p>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsDiscontinueModalOpen(false)}
                className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDiscontinueConfirm}
                className={`flex-1 py-3 font-bold rounded-xl transition-colors ${productToDiscontinue.isActive
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
              >
                {productToDiscontinue.isActive ? 'Yes, Discontinue' : 'Yes, Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
