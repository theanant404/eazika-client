"use client";

import React, { useState, useRef, useEffect } from "react";

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
    MapPinned,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { shopService } from "@/services/shopService";

import { toast } from "sonner";
import { uploadImage } from "@/action/upload";
import { userStore } from "@/store";
import { cn } from "@/lib/utils";

const STEPS = [
    { id: 1, title: "Info", icon: Store },
    { id: 2, title: "Address", icon: MapPinned },
    { id: 3, title: "Docs", icon: FileText },
    { id: 4, title: "Done", icon: CheckCircle },
];

const DEFAULT_ADDRESS: NonNullable<CreateShopPayload["address"]> = {
    name: "",
    phone: "",
    line1: "",
    line2: "",
    street: "",
    country: "India",
    state: "Maharashtra",
    city: "",
    pinCode: "",
    geoLocation: "",
};

const DEFAULT_DOCUMENTS: CreateShopPayload["documents"] = {
    aadharImage: "",
    electricityBillImage: "",
    businessCertificateImage: "",
    panImage: "",
};

const EMPTY_FORM: CreateShopPayload = {
    shopName: "",
    shopCategory: "",
    shopImages: [],
    fssaiNumber: "",
    gstNumber: "",
    address: DEFAULT_ADDRESS,
    documents: DEFAULT_DOCUMENTS,
};

export default function ShopRegistrationContent() {
    const router = useRouter();
    const user = userStore((state) => state.user);
    const fetchUser = userStore((state) => state.fetchUser);
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState<CreateShopPayload>(EMPTY_FORM);
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasRequestedLocation = useRef(false);

    const normalizeAddress = (
        address?: Partial<NonNullable<CreateShopPayload["address"]>>
    ): NonNullable<CreateShopPayload["address"]> => ({
        name: address?.name ?? DEFAULT_ADDRESS.name,
        phone: address?.phone ?? DEFAULT_ADDRESS.phone,
        line1: address?.line1 ?? DEFAULT_ADDRESS.line1,
        line2: address?.line2 ?? DEFAULT_ADDRESS.line2,
        street: address?.street ?? DEFAULT_ADDRESS.street,
        country: address?.country ?? DEFAULT_ADDRESS.country,
        state: address?.state ?? DEFAULT_ADDRESS.state,
        city: address?.city ?? DEFAULT_ADDRESS.city,
        pinCode: address?.pinCode ?? DEFAULT_ADDRESS.pinCode,
        geoLocation: address?.geoLocation ?? DEFAULT_ADDRESS.geoLocation,
    });

    const normalizeDocuments = (
        docs?: Partial<CreateShopPayload["documents"]>
    ): CreateShopPayload["documents"] => ({
        aadharImage: docs?.aadharImage ?? DEFAULT_DOCUMENTS.aadharImage,
        electricityBillImage:
            docs?.electricityBillImage ?? DEFAULT_DOCUMENTS.electricityBillImage,
        businessCertificateImage:
            docs?.businessCertificateImage ?? DEFAULT_DOCUMENTS.businessCertificateImage,
        panImage: docs?.panImage ?? DEFAULT_DOCUMENTS.panImage,
    });

    useEffect(() => {
        // Load saved data from localStorage if available
        const savedData = typeof window !== "undefined" ? localStorage.getItem("shopRegData") : null;

        if (savedData) {
            try {
                const parsed: CreateShopPayload = JSON.parse(savedData);

                setFormData((prev) => {
                    const mergedAddress = normalizeAddress({
                        ...prev.address,
                        ...parsed.address,
                    });

                    const mergedDocuments = normalizeDocuments({
                        ...prev.documents,
                        ...parsed.documents,
                    });

                    return {
                        ...EMPTY_FORM,
                        ...prev,
                        ...parsed,
                        address: mergedAddress,
                        documents: mergedDocuments,
                    };
                });
            } catch (error) {
                console.warn("Corrupt shopRegData in storage", error);
                localStorage.removeItem("shopRegData");
            }
        }

        if (!user) fetchUser();
    }, [fetchUser, user]);

    // Ask for location permission early on step 1
    useEffect(() => {
        if (typeof window === "undefined") return;
        if (currentStep === 1 && !hasRequestedLocation.current) {
            hasRequestedLocation.current = true;
            handleUseCurrentLocation();
        }
    }, [currentStep]);

    // When user info arrives, prefill and lock phone
    useEffect(() => {
        if (user?.phone) {
            setFormData((prev) => {
                const normalized = normalizeAddress(prev.address);

                return {
                    ...prev,
                    address: {
                        ...normalized,
                        name: normalized.name || user.name || "",
                        phone: user.phone,
                    },
                };
            });
        }
    }, [user?.phone, user?.name]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        if (saveTimer.current) {
            clearTimeout(saveTimer.current);
        }

        saveTimer.current = setTimeout(() => {
            localStorage.setItem("shopRegData", JSON.stringify(formData));
        }, 300);

        return () => {
            if (saveTimer.current) clearTimeout(saveTimer.current);
        };
    }, [formData]);

    const updateForm = (field: keyof CreateShopPayload, value: string | string[]) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    type NestedSection = "address" | "documents";
    type NestedKey<S extends NestedSection> = keyof NonNullable<CreateShopPayload[S]>;

    const updateNestedForm = <S extends NestedSection>(
        section: S,
        field: NestedKey<S>,
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
            case 2: // Address Step
                const { name, phone, line1, city, state, country, pinCode } =
                    formData.address!;
                if (!name || !phone || !city || !state || !country || !pinCode) {
                    toast.error("Please fill all required address fields.");
                    return false;
                } else if (line1.length < 5) {
                    toast.error("Address Line 1 seems too short.");
                    return false;
                }

                return true;
            case 3: // Documents Step
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
        if (!validateStep(currentStep)) return;

        if (currentStep < 4) {
            setCurrentStep((curr) => curr + 1);
            if (currentStep === 2 && formData.address?.geoLocation === "") {
                handleUseCurrentLocation();
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep((curr) => curr - 1);
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
                    className={`border border-dashed rounded-xl p-2 flex flex-col items-center justify-center cursor-pointer transition-all h-24 relative overflow-hidden group ${displayValue
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

    // STEP 3: Use Current Location Button Handler
    const handleUseCurrentLocation = () => {
        if (typeof navigator === "undefined" || !navigator.geolocation) {
            toast.error("Geolocation is not available on this device.");
            return;
        }
        setIsLoading(true);
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;

            try {
                const response = await fetch(url);

                if (response.ok) {
                    const data = await response.json();
                    setFormData((prev) => ({
                        ...prev,
                        address: {
                            ...prev.address!,
                            line1: data.address.road || "",
                            street:
                                (data.address.suburb ? data.address.suburb + ", " : "") +
                                (data.address.city_district
                                    ? data.address.city_district + ", "
                                    : "") +
                                (data.address.city || ""),

                            city: data.address.city || "",
                            state: data.address.state || "",
                            country: data.address.country || "",
                            pinCode: data.address.postcode || "",
                            geoLocation: `${latitude},${longitude}`,
                        },
                    }));
                } else {
                    setFormData((prev) => ({
                        ...prev,
                        address: {
                            ...prev.address!,
                            geoLocation: `${latitude},${longitude}`,
                        },
                    }));
                }
            } catch (error) {
                console.error("Failed to get address details", error);
                toast.error(
                    "Unable to retrieve address from your location. Please try again."
                );
            } finally {
                setIsLoading(false);
            }
        });
    };

    // STEP 4: Submit Application
    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await shopService.createShop(formData);
            // update user role cokie/session here if needed
            document.cookie = `userRole=shopkeeper; path=/; max-age=${7 * 24 * 60 * 60
                }`; // 7 days
            toast.success("Application Submitted! We will review your details.");
            localStorage.removeItem("shopRegData"); // Clear saved data
            setTimeout(() => router.push("/shop"), 1500); // Redirect after 1.5s
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden w-full border border-gray-100 dark:border-gray-700 flex flex-col">
            {/* Header */}

            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-center relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shrink-0">
                <button
                    onClick={handleBack}
                    className="absolute left-6 p-1.5 -ml-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                    <ArrowLeft size={20} className="text-gray-700 dark:text-white" />
                </button>
                <div className="text-center">
                    <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                        Register Shop
                    </h1>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                        Step {currentStep} of 4
                    </p>
                </div>
            </div>
            {/* Progress Bar */}
            <div className="w-full px-8 py-6">
                <div className="relative flex items-center justify-between w-full">

                    {/* Background Track (Grey Line) */}
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 dark:bg-gray-800 -translate-y-1/2 z-0" />

                    {/* Animated Active Track (Yellow Line) */}
                    <motion.div
                        className="absolute top-1/2 left-0 h-0.5 bg-yellow-500 z-0 -translate-y-1/2 origin-left"
                        initial={{ width: "0%" }}
                        animate={{ width: `${(currentStep - 1) / (STEPS.length - 1) * 100}%` }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                    />

                    {/* Step Nodes */}
                    {STEPS.map((step) => {
                        const isCompleted = step.id < currentStep;
                        const isActive = step.id === currentStep;

                        return (
                            <div key={step.id} className="relative z-10 flex flex-col items-center">
                                {/* Icon Circle */}
                                <motion.div
                                    initial={false}
                                    animate={{
                                        scale: isActive ? 1.2 : 1,
                                        backgroundColor: isActive || isCompleted ? "#eab308" : "#ffffff",
                                        borderColor: isActive || isCompleted ? "#eab308" : "#d1d5db",
                                    }}
                                    className={cn(
                                        "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm",
                                        isActive ? "ring-4 ring-yellow-500/20" : ""
                                    )}
                                >
                                    <step.icon
                                        size={18}
                                        className={cn(
                                            "transition-colors",
                                            isActive || isCompleted ? "text-white" : "text-gray-400"
                                        )}
                                    />
                                </motion.div>

                                {/* Label - Fixed Positioning to prevent shifting */}
                                <div className="absolute top-10 flex flex-col items-center w-max">
                                    <span
                                        className={cn(
                                            "text-[10px] uppercase tracking-wider font-black transition-colors duration-300",
                                            isActive || isCompleted ? "text-yellow-600 dark:text-yellow-500" : "text-gray-400"
                                        )}
                                    >
                                        {step.title}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            {/* Scrollable Form Area */}
            <section className="flex-1 overflow-y-auto p-6 no-scrollbar">
                <AnimatePresence mode="wait">
                    {currentStep === 1 ? (
                        // STEP 1: Basic Info
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
                                            <option disabled value="">
                                                Select Category
                                            </option>
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
                    ) : currentStep === 2 ? (
                        // STEP 2: Address Details
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            {isLoading && (
                                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center gap-3">
                                    <Loader2 className="animate-spin text-yellow-500" />
                                    <span className="text-yellow-700 dark:text-yellow-300 text-sm">
                                        Fetching your current location...
                                    </span>
                                </div>
                            )}
                            <div
                                className={cn(
                                    isLoading ? "opacity-50 pointer-events-none" : "space-y-4"
                                )}
                            >
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                            Name<span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.address?.name}
                                            className="input-field uppercase"
                                            placeholder="Full Name"
                                            onChange={(e) =>
                                                updateNestedForm("address", "name", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                            Phone (from login) <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            required
                                            value={formData.address?.phone || ""}
                                            className="input-field appearance-none bg-gray-100 dark:bg-gray-900 cursor-not-allowed"
                                            placeholder="Phone Number"
                                            disabled
                                        />
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                            This uses your login mobile number and cannot be edited here.
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                        Address Line 1 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Flat/House No, Building"
                                        className="input-field"
                                        value={formData.address?.line1}
                                        onChange={(e) =>
                                            updateNestedForm("address", "line1", e.target.value)
                                        }
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                        Street / Area <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Street / Area"
                                        className="input-field"
                                        value={formData.address?.street}
                                        onChange={(e) =>
                                            updateNestedForm("address", "street", e.target.value)
                                        }
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                            City <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            required
                                            placeholder="City"
                                            className="input-field"
                                            value={formData.address?.city}
                                            onChange={(e) =>
                                                updateNestedForm("address", "city", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                            Pincode <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            required
                                            placeholder="Pincode"
                                            className="input-field"
                                            value={formData.address?.pinCode}
                                            onChange={(e) =>
                                                updateNestedForm("address", "pinCode", e.target.value)
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : currentStep === 3 ? (
                        // STEP 3: Documents (Images + Numbers)
                        <motion.div
                            key="step3"
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
                    ) : (
                        currentStep === 4 && (
                            // STEP 4: Review
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
                                        By submitting, you agree to Eazika&apos;s Partner Terms &
                                        Conditions.
                                    </p>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl text-left border border-gray-100 dark:border-gray-700 text-xs space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Shop</span>{" "}
                                        <span className="font-bold dark:text-white">
                                            {formData.shopName}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">GST</span>{" "}
                                        <span className="font-bold dark:text-white">
                                            {formData.gstNumber}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">FSSAI</span>{" "}
                                        <span className="font-bold dark:text-white">
                                            {formData.fssaiNumber}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Category</span>{" "}
                                        <span className="font-bold dark:text-white capitalize">
                                            {formData.shopCategory}
                                        </span>
                                    </div>
                                    {/* Address */}
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Address</span>{" "}
                                        <span className="font-bold text-green-600">
                                            {formData.address?.line1}, {formData.address?.street},{" "}
                                            {formData.address?.city} - {formData.address?.pinCode}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Documents</span>{" "}
                                        <span className="font-bold text-green-600">4 Uploaded</span>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    )}
                </AnimatePresence>
            </section>
            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 shrink-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                {currentStep === 4 ? (
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
        </main>
    );
}