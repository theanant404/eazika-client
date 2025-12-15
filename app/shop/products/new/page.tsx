"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  X,
  Loader2,
  CheckCircle,
  Image as ImageIcon,
  Package,
  FileText,
  Tag,
  Box,
} from "lucide-react";
import { shopService } from "@/services/shopService";
import Image from "next/image";

import { uploadMultipleImages } from "@/action/upload";
import { toast } from "sonner";

import type { NewProductFormData } from "@/types/shop";
export default function NewProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [category, srtCategory] = useState<{ id: number; name: string }[]>([
    { id: 0, name: "Loading..." },
  ]);
  const [formData, setFormData] = useState<NewProductFormData>({
    productCategoryId: 4,
    name: "",
    brand: "",
    description: "",
    images: [] as string[],
    pricing: [
      {
        price: 10,
        discount: 0,
        weight: 100,
        stock: 1,
        unit: "grams",
      },
    ],
  });

  useEffect(() => {
    async function fetchCategories() {
      try {
        const categories = await shopService.getCategories();

        srtCategory(categories);
      } catch (error) {
        console.error("Failed to fetch categories", error);
      }
    }
    if (
      category.length === 1 &&
      category[0].id === 0 &&
      category[0].name === "Loading..."
    ) {
      fetchCategories();
    }
  }, [category]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const result = await uploadMultipleImages(files);

      if (result.success) {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, ...(result.urls || "")],
        }));
      } else {
        console.error("Image upload failed");
      }
    } catch (error) {
      console.error("Image upload failed", error);
    } finally {
      setIsUploading(false);
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      setIsSubmitting(true);

      e.preventDefault();
      if (!formData.name || formData.productCategoryId === 0) {
        toast.error("Please fill all required fields.");
        return;
      }
      if (formData.pricing.some((price) => !price.price || !price.stock)) {
        toast.error("Please fill all required fields in prices section.");
        return;
      }
      await shopService.addProduct(formData);

      toast.success("Product added successfully!");
      setInterval(() => router.push("/shop/products"), 1500);
    } catch (error) {
      // console.error("Failed to submit form", error);
      // toast.error("Failed to add product. Please try again.");
      if (error instanceof Error) {
        toast.error(`Failed to add product: ${error.message}`);
      } else {
        toast.error("An unexpected error occurred.");
      }
    }
    {
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
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
          Add New Product
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8"
      >
        {/* --- Left Column: Images (Takes 4/12 columns on Desktop) --- */}
        <div className="md:col-span-4 space-y-6">
          <div className="bg-white dark:bg-gray-800 p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 md:sticky md:top-24">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white">
                Images
              </h3>
              <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                {formData.images.length}/4
              </span>
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
                <div
                  key={idx}
                  className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group bg-gray-50 dark:bg-gray-900"
                >
                  <Image
                    src={img}
                    alt={`Product ${idx}`}
                    layout="fill"
                    objectFit="cover"
                  />
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
                  disabled={isUploading}
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center hover:border-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/10 transition-colors text-gray-400 hover:text-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Upload size={18} />
                  )}
                </button>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
              accept="image/*"
              multiple // Allow selecting multiple files
            />
            <p className="text-[10px] text-gray-400 mt-2 text-center">
              Upload up to 4 images. Max 5MB each.
            </p>
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
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Package
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
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
              {/* Brand and Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                    Brand
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                      ®
                    </span>
                    <input
                      name="brand"
                      type="text"
                      value={formData.brand}
                      onChange={handleInputChange}
                      className="w-full pl-8 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-yellow-500 dark:text-white transition-colors text-sm md:text-base"
                      placeholder="e.g. Fresh Farms"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Tag
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <select
                      name="category"
                      value={formData.productCategoryId}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          productCategoryId: parseInt(e.target.value),
                        }))
                      }
                      className="w-full pl-10 pr-8 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-yellow-500 dark:text-white transition-colors appearance-none text-sm md:text-base"
                    >
                      <option value="" disabled>
                        Select Category
                      </option>
                      {category.length > 0 &&
                        category.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
              {/* Price, Stock,  weight and unit */}
              {formData.pricing.map((price, index) => (
                <div
                  className="grid grid-cols-2 sm:grid-cols-5 gap-5"
                  key={index}
                >
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                      Price <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                        ₹
                      </span>
                      <input
                        name="price"
                        type="number"
                        value={price.price}
                        onChange={(e) =>
                          setFormData((prev) => {
                            const updatedPrices = [...prev.pricing];
                            updatedPrices[index].price = parseFloat(
                              e.target.value
                            );
                            return { ...prev, prices: updatedPrices };
                          })
                        }
                        className="w-full pl-8 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-yellow-500 dark:text-white transition-colors text-sm md:text-base"
                        placeholder="e.g. 100"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                      Weight
                    </label>
                    <div className="relative">
                      <input
                        name="weight"
                        type="number"
                        value={price.weight}
                        onChange={(e) =>
                          setFormData((prev) => {
                            const updatedPrices = [...prev.pricing];
                            updatedPrices[index].weight = parseFloat(
                              e.target.value
                            );
                            return { ...prev, prices: updatedPrices };
                          })
                        }
                        className="w-full pl-4 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-yellow-500 dark:text-white transition-colors text-sm md:text-base"
                        placeholder="e.g. 500"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                      Unit
                    </label>
                    <div className="relative">
                      <select
                        name="unit"
                        value={price.unit}
                        onChange={(e) =>
                          setFormData((prev) => {
                            const updatedPrices = [...prev.pricing];
                            updatedPrices[index].unit = e.target.value as
                              | "grams"
                              | "kg"
                              | "ml"
                              | "litre"
                              | "piece";
                            return { ...prev, prices: updatedPrices };
                          })
                        }
                        className="w-full pl-4 pr-8 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-yellow-500 dark:text-white transition-colors appearance-none text-sm md:text-base"
                      >
                        <option value="grams">grams</option>
                        <option value="kg">kg</option>
                        <option value="ml">ml</option>
                        <option value="litre">litre</option>
                        <option value="piece">piece</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                      Stock <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Box
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                      <input
                        name="stock"
                        type="number"
                        value={price.stock}
                        onChange={(e) =>
                          setFormData((prev) => {
                            const updatedPrices = [...prev.pricing];
                            updatedPrices[index].stock =
                              parseInt(e.target.value) || 0;
                            return { ...prev, prices: updatedPrices };
                          })
                        }
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-yellow-500 dark:text-white transition-colors text-sm md:text-base"
                        placeholder="e.g. 50"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                      &nbsp;
                    </label>

                    {/* add and remove button */}
                    {index == 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            prices: [
                              ...prev.pricing,
                              {
                                price: 50,
                                discount: 0,
                                weight: 100,
                                stock: 1,
                                unit: "grams",
                              },
                            ],
                          }));
                        }}
                        className="w-full py-3 bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-400 hover:text-yellow-600 hover:border-yellow-500 transition-colors text-sm md:text-base"
                      >
                        + Add
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            prices: prev.pricing.filter((_, i) => i !== index),
                          }))
                        }
                        className="w-full py-3 bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-400 hover:text-red-500 hover:border-red-500 transition-colors text-sm md:text-base"
                      >
                        - Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                Description
              </label>
              <div className="relative">
                <FileText
                  className="absolute left-3 top-3 text-gray-400"
                  size={18}
                />
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
              {isSubmitting ? (
                <Loader2 className="animate-spin" />
              ) : (
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
