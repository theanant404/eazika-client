"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { CreateShopPayload } from "@/types/shop";
import {
  ArrowLeft,
  Store,
  Upload,
  FileText,
  CheckCircle,
  ChevronRight,
  ArrowRight,
  Loader2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { shopService } from "@/services/shopService";

import { toast } from "sonner";
import { uploadImage } from "@/action/upload";

const STEPS = [
  { id: 1, title: "Info", icon: Store },
  { id: 2, title: "Docs", icon: FileText },
  { id: 3, title: "Done", icon: CheckCircle },
];

export default function ShopRegistrationPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateShopPayload>({
    shopName: "",
    shopCategory: "",
    shopImages: [],
    fssaiNumber: "",
    gstNumber: "",
    documents: {
      aadharImage: "",
      electricityBillImage: "",
      businessCertificateImage: "",
      panImage: "",
    },
  });

  const updateForm = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateNestedForm = (
    section: "documents",
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  // --- Validation Logic ---
  const validateStep = (step: number) => {
    switch (step) {
      case 1: // Basic Info Step
        if (
          !formData.shopName ||
          !formData.fssaiNumber ||
          formData.shopImages.length === 0
        ) {
          toast.error("Please fill Shop Name, FSSAI and upload a cover image.");
          return false;
        }
        return true;
      case 2: // Documents Step
        const {
          aadharImage,
          panImage,
          electricityBillImage,
          businessCertificateImage,
        } = formData.documents;

        if (
          !aadharImage ||
          !panImage ||
          !electricityBillImage ||
          !businessCertificateImage
        ) {
          toast.error("Please upload all 4 required documents.");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) setCurrentStep((curr) => curr + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((curr) => curr - 1);
    else router.back();
  };

  // Reusable Image Uploader Component with optional Number Input
  const ImageUploader = ({
    label,
    value,
    onUpload,
  }: {
    label: string;
    value: string | string[];
    onUpload: (url: string) => void;
  }) => {
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      try {
        const result = await uploadImage(file);

        if (result.success) {
          onUpload(result.url);
        } else {
          toast.error(result.error || "Upload failed");
        }
        toast.success("Image uploaded successfully!");
      } catch (err) {
        console.error("Upload error", err);
        toast.error("An unexpected error occurred during upload.");
      } finally {
        setUploading(false);
      }
    };

    const displayValue = Array.isArray(value) ? value[0] : value;

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {label} <span className="text-red-500">*</span>
          </label>
          {displayValue ? (
            <span className="text-[10px] font-bold text-green-600 flex items-center gap-1">
              <CheckCircle size={10} /> Uploaded
            </span>
          ) : (
            <span className="text-[10px] font-bold text-red-400">Required</span>
          )}
        </div>

        {/* Image Box */}
        <div
          onClick={() => inputRef.current?.click()}
          className={`border border-dashed rounded-xl p-2 flex flex-col items-center justify-center cursor-pointer transition-all h-24 relative overflow-hidden group ${
            displayValue
              ? "border-green-500/30 bg-green-50/10"
              : "border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-900/50 hover:border-yellow-500"
          }`}
        >
          {displayValue ? (
            <>
              <Image
                src={displayValue}
                alt="Uploaded"
                layout="fill"
                objectFit="cover"
                className="rounded-lg opacity-90"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpload("");
                }}
                className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full z-10 shadow-md hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
              >
                <X size={12} />
              </button>
            </>
          ) : (
            <>
              {uploading ? (
                <Loader2 className="animate-spin text-yellow-500" size={16} />
              ) : (
                <Upload className="text-gray-400 mb-1" size={16} />
              )}
              <span className="text-[10px] text-gray-500 font-medium">
                Upload
              </span>
            </>
          )}
          <input
            type="file"
            ref={inputRef}
            className="hidden"
            onChange={handleFile}
            accept="image/*"
          />
        </div>
      </div>
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await shopService.createShop(formData);
      // update user role cokie/session here if needed
      document.cookie = `userRole=shopkeeper; path=/; max-age=${
        7 * 24 * 60 * 60
      }`; // 7 days
      toast.success("Application Submitted! We will review your details.");
      setInterval(() => router.push("/shop"), 1500); // Redirect after 1.5s
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message || "Failed to submit. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden w-full border border-gray-100 dark:border-gray-700 flex flex-col h-[600px] md:h-[650px]">
      {/* Header */}

      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shrink-0">
        <button
          onClick={handleBack}
          className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-700 dark:text-white" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
            Register Shop
          </h1>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">
            Step {currentStep} of 4
          </p>
        </div>
      </div>
      {/* Progress Bar */}
      <div className="px-8 pt-4 pb-1 shrink-0">
        <div className="flex justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-100 dark:bg-gray-700 z-0 -translate-y-1/2 rounded-full" />
          <motion.div
            className="absolute top-1/2 left-0 h-0.5 bg-yellow-500 z-0 -translate-y-1/2 origin-left rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${((currentStep - 1) / 2) * 100}%` }}
            transition={{ duration: 0.3 }}
          />

          {STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = step.id <= currentStep;
            return (
              <div
                key={step.id}
                className="relative z-10 flex flex-col items-center gap-1"
              >
                <motion.div
                  className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isActive
                      ? "bg-yellow-500 border-yellow-500 text-white shadow-sm"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-300 dark:text-gray-600"
                  }`}
                  animate={{ scale: step.id === currentStep ? 1.5 : 1 }}
                >
                  <Icon size={12} />
                </motion.div>
                <span
                  className={`text-[9px] font-bold ${
                    isActive
                      ? "text-yellow-600 dark:text-yellow-500"
                      : "text-transparent"
                  }`}
                >
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {/* Scrollable Form Area */}
      <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
        <AnimatePresence mode="wait">
          {/* STEP 1: Basic Info */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Shop Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.shopName}
                    onChange={(e) => updateForm("shopName", e.target.value)}
                    className="input-field"
                    placeholder="e.g. Fresh Mart"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={formData.shopCategory}
                      onChange={(e) =>
                        updateForm("shopCategory", e.target.value)
                      }
                      className="input-field appearance-none"
                    >
                      <option disabled>Select Category</option>
                      <option value="grocery">Grocery</option>
                      <option value="electronics">Electronics</option>
                      <option value="furniture">Furniture</option>
                      <option value="clothing">Clothing</option>
                      <option value="bakery">Bakery</option>
                      <option value="homeAppliances">Home Appliances</option>
                      <option value="others">Others</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                      <ChevronRight className="rotate-90 w-4 h-4" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      GST No{" "}
                      <span className="text-gray-400 text-[9px] font-normal">
                        (Optional)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={formData.gstNumber}
                      onChange={(e) => updateForm("gstNumber", e.target.value)}
                      className="input-field uppercase"
                      placeholder="22AAAAA..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      FSSAI <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fssaiNumber}
                      onChange={(e) =>
                        updateForm("fssaiNumber", e.target.value)
                      }
                      className="input-field"
                      placeholder="123456..."
                    />
                  </div>
                </div>
              </div>
              <ImageUploader
                label="Cover Image"
                value={formData.shopImages[0] || ""}
                onUpload={(url) => updateForm("shopImages", [url])}
              />
            </motion.div>
          )}

          {/* STEP 2: Documents (Images + Numbers) */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-2 gap-4"
            >
              {/* Aadhar: Image + Number Input */}
              <ImageUploader
                label="Aadhar Card"
                value={formData.documents.aadharImage}
                onUpload={(url) =>
                  updateNestedForm("documents", "aadharImage", url)
                }
              />

              {/* PAN: Image + Number Input */}
              <ImageUploader
                label="PAN Card"
                value={formData.documents.panImage}
                onUpload={(url) =>
                  updateNestedForm("documents", "panImage", url)
                }
              />

              {/* Bill: Image Only */}
              <ImageUploader
                label="Electricity Bill"
                value={formData.documents.electricityBillImage}
                onUpload={(url) =>
                  updateNestedForm("documents", "electricityBillImage", url)
                }
              />

              {/* Certificate: Image Only */}
              <ImageUploader
                label="Business Cert."
                value={formData.documents.businessCertificateImage}
                onUpload={(url) =>
                  updateNestedForm("documents", "businessCertificateImage", url)
                }
              />
            </motion.div>
          )}

          {/* STEP 4: Review */}
          {currentStep === 3 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 text-center py-4"
            >
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto animate-in zoom-in duration-300">
                <CheckCircle className="text-green-600 dark:text-green-400 w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Ready to Submit?
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                  By submitting, you agree to Eazika&#39;s Partner Terms &
                  Conditions.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl text-left border border-gray-100 dark:border-gray-700 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Shop</span>{" "}
                  <span className="font-bold dark:text-white">
                    {formData.shopName || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">GST</span>{" "}
                  <span className="font-bold dark:text-white">
                    {formData.gstNumber || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">FSSAI</span>{" "}
                  <span className="font-bold dark:text-white">
                    {formData.fssaiNumber || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Category</span>{" "}
                  <span className="font-bold dark:text-white capitalize">
                    {formData.shopCategory}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Documents</span>{" "}
                  <span className="font-bold text-green-600">4 Uploaded</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-700 shrink-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        {currentStep === 3 ? (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full px-6 py-3 rounded-xl font-bold text-sm bg-green-500 text-white hover:bg-green-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-500/30 disabled:opacity-70"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin w-4 h-4" />
            ) : (
              <>
                <CheckCircle className="w-4 h-4" /> Submit Application
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="w-full px-6 py-3 rounded-xl font-bold text-sm bg-yellow-500 text-white hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/30"
          >
            Next Step <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
      <style jsx global>{`
        .input-field {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          background-color: var(--bg-color, #f9fafb);
          border: 1px solid #e5e7eb;
          outline: none;
          transition: all 0.2s;
          font-size: 0.875rem;
        }
        .input-field:focus {
          border-color: #eab308;
          box-shadow: 0 0 0 2px rgba(234, 179, 8, 0.2);
        }
        :global(.dark) .input-field {
          background-color: #111827;
          border-color: #374151;
          color: white;
        }
        :global(.dark) .input-field:focus {
          border-color: #eab308;
        }
      `}</style>
    </div>
  );
}
