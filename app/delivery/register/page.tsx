"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import { Loader2, Upload, CheckCircle, X, MapPin, Store, ArrowRight, Search } from "lucide-react";
import { DeliveryService } from "@/services/deliveryService";

interface FormData {
  aadharNumber: string;
  panNumber: string;
  licenseNumber: string;
  vehicleOwnerName: string;
  vehicleName: string;
  vehicleNo: string;
  licenseImages: string[];
}

interface Shop {
  id: number;
  name: string;
  address: string;
  image?: string;
  distance?: number;
}

export default function DeliveryRegistrationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlShopId = searchParams.get("shopId");

  const [step, setStep] = useState<"select-shop" | "details">("select-shop");
  const [selectedShopId, setSelectedShopId] = useState<number | null>(urlShopId ? parseInt(urlShopId) : null);
  
  // Shop Selection State
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingShops, setIsLoadingShops] = useState(false);
  const [nearbyShops, setNearbyShops] = useState<Shop[]>([]);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState<FormData>({
    aadharNumber: "",
    panNumber: "",
    licenseNumber: "",
    vehicleOwnerName: "",
    vehicleName: "",
    vehicleNo: "",
    licenseImages: [],
  });
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (urlShopId) {
        setSelectedShopId(parseInt(urlShopId));
        setStep("details");
    }
  }, [urlShopId]);

  // --- Step 1: Shop Selection Logic ---

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
        setLocationError("Geolocation is not supported by your browser");
        return;
    }

    setIsLoadingShops(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            setLocationPermission(true);
            try {
                // Fetch nearby shops using the service
                // const data = await DeliveryService.getNearbyShops(latitude, longitude);
                // Mocking response for now if backend isn't ready, or replace with actual call
                 const data = await DeliveryService.getNearbyShops(latitude, longitude).catch(() => []);
                 
                 // If data is empty, maybe mock some for demo if needed
                 if (!data || data.length === 0) {
                     // Fallback/Demo Data
                     /* 
                     setNearbyShops([
                         { id: 1, name: "Fresh Mart", address: "123 Main St, Mumbai", distance: 1.2 },
                         { id: 2, name: "Daily Grocers", address: "456 Side Ave, Mumbai", distance: 2.5 }
                     ]);
                     */
                    setNearbyShops([]);
                    if (!data) toast.info("No shops found nearby.");
                 } else {
                     setNearbyShops(data);
                 }

            } catch (error) {
                console.error("Failed to fetch shops", error);
                toast.error("Failed to find nearby shops.");
            } finally {
                setIsLoadingShops(false);
            }
        },
        (error) => {
            setIsLoadingShops(false);
            setLocationError("Unable to retrieve your location. Please allow location access.");
        }
    );
  };

  const handleSelectShop = (shopId: number) => {
      setSelectedShopId(shopId);
      setStep("details");
      window.scrollTo(0, 0);
  };

  // --- Step 2: Form Logic ---

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Use DeliveryService to upload
        const url = await DeliveryService.uploadImage(file);
        uploadedUrls.push(url);
      }
      
      setFormData((prev) => ({
        ...prev,
        licenseImages: [...prev.licenseImages, ...uploadedUrls],
      }));
      toast.success("Images uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload images");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      licenseImages: prev.licenseImages.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShopId) {
      toast.error("No shop selected. Please go back and select a shop.");
      return;
    }
    
    if (formData.licenseImages.length === 0) {
        toast.error("Please upload at least one license image.");
        return;
    }

    setIsSubmitting(true);
    try {
      // Use DeliveryService to create profile
      await DeliveryService.createProfile({
          ...formData,
          shopkeeperId: selectedShopId
      });

      // Update cookie to 'delivery_boy' manually so they can access dashboard immediately
      // The backend updates the role in DB, but client-side cookie needs update for Middleware to pass
      document.cookie = `userRole=delivery_boy; path=/; max-age=${7 * 24 * 60 * 60}`;
      
      toast.success("Delivery profile created successfully!");
      router.push("/delivery"); // Redirect to dashboard
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Helper Components ---

  const ShopCard = ({ shop }: { shop: Shop }) => (
      <div 
          onClick={() => handleSelectShop(shop.id)}
          className="border border-gray-200 rounded-xl p-4 hover:border-green-500 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group bg-white"
      >
          <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                  <Store size={24} />
              </div>
              <div>
                  <h3 className="font-bold text-gray-900 group-hover:text-green-600 transition-colors">{shop.name}</h3>
                  <p className="text-sm text-gray-500">{shop.address}</p>
                  {shop.distance && <p className="text-xs text-green-600 mt-1">{shop.distance.toFixed(1)} km away</p>}
              </div>
          </div>
          <ArrowRight className="text-gray-300 group-hover:text-green-500" />
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Join Eazika Delivery Partner
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 'select-shop' 
                ? "Find a shop near you to start delivering." 
                : "Complete your profile details."}
          </p>
        </div>

        {/* Step 1: Shop Selection */}
        {step === 'select-shop' && (
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100 min-h-[400px]">
                <div className="flex flex-col items-center justify-center space-y-6">
                    {!locationPermission && nearbyShops.length === 0 ? (
                        <div className="text-center py-10">
                            <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MapPin className="text-blue-500 h-10 w-10" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Enable Location</h3>
                            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                                We need your location to find shops available for delivery partnerships in your area.
                            </p>
                            <button
                                onClick={handleGetLocation}
                                disabled={isLoadingShops}
                                className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold hover:bg-blue-700 transition flex items-center gap-2 mx-auto disabled:opacity-70"
                            >
                                {isLoadingShops ? <Loader2 className="animate-spin" /> : <MapPin size={18} />}
                                {isLoadingShops ? "Finding Shops..." : "Find Nearby Shops"}
                            </button>
                            {locationError && (
                                <p className="text-red-500 text-sm mt-4">{locationError}</p>
                            )}
                        </div>
                    ) : (
                        <div className="w-full">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-lg text-gray-900">Available Shops</h3>
                                <button 
                                    onClick={handleGetLocation}
                                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                    <MapPin size={14} /> Refresh Location
                                </button>
                            </div>

                            {isLoadingShops ? (
                                <div className="flex justify-center py-20">
                                    <Loader2 className="animate-spin text-blue-500" size={32} />
                                </div>
                            ) : nearbyShops.length > 0 ? (
                                <div className="space-y-3">
                                    {nearbyShops.map(shop => (
                                        <ShopCard key={shop.id} shop={shop} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                    <Store className="mx-auto text-gray-400 mb-3" size={40} />
                                    <h4 className="font-bold text-gray-900">No Shops Found</h4>
                                    <p className="text-sm text-gray-500 mt-1">
                                        We couldn't find any shops looking for riders in your current location.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Step 2: Registration Form */}
        {step === 'details' && (
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100 relative">
                {!urlShopId && (
                    <button 
                        onClick={() => setStep('select-shop')}
                        className="absolute top-8 left-8 text-gray-400 hover:text-gray-600 text-sm font-medium flex items-center gap-1"
                    >
                        &larr; Change Shop
                    </button>
                )}

                <div className="mb-6 pt-6 border-b pb-4">
                    <p className="text-sm text-gray-500">Registering for:</p>
                    <p className="text-lg font-bold text-green-600 flex items-center gap-2">
                        <Store size={18} /> Shop #{selectedShopId}
                        {/* Ideally fetch and show shop name here if possible, but ID is sufficient for logic */}
                    </p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    
                    {/* Personal Details */}
                    <div>
                    <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4 border-b pb-2">
                        Personal Identification
                    </h3>
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                        <div>
                        <label htmlFor="aadharNumber" className="block text-sm font-medium text-gray-700">
                            Aadhar Number <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1">
                            <input
                            id="aadharNumber"
                            name="aadharNumber"
                            type="text"
                            required
                            value={formData.aadharNumber}
                            onChange={handleChange}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            />
                        </div>
                        </div>

                        <div>
                        <label htmlFor="panNumber" className="block text-sm font-medium text-gray-700">
                            PAN Number
                        </label>
                        <div className="mt-1">
                            <input
                            id="panNumber"
                            name="panNumber"
                            type="text"
                            value={formData.panNumber}
                            onChange={handleChange}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            />
                        </div>
                        </div>

                        <div>
                        <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700">
                            Driving License Number <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1">
                            <input
                            id="licenseNumber"
                            name="licenseNumber"
                            type="text"
                            required
                            value={formData.licenseNumber}
                            onChange={handleChange}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            />
                        </div>
                        </div>
                    </div>
                    </div>

                    {/* License Images */}
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Driving License Images <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center justify-center w-full">
                        <label htmlFor="licenseImages" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                {isUploading ? (
                                    <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                                ) : (
                                    <>
                                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                        <p className="text-sm text-gray-500"><span className="font-semibold">Click to upload</span> license front & back</p>
                                    </>
                                )}
                            </div>
                            <input 
                                id="licenseImages" 
                                type="file" 
                                className="hidden" 
                                multiple 
                                accept="image/*"
                                onChange={handleFileUpload}
                                disabled={isUploading}
                            />
                        </label>
                    </div>
                    
                    {/* Image Previews */}
                    {formData.licenseImages.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                            {formData.licenseImages.map((url, index) => (
                                <div key={index} className="relative group aspect-video bg-gray-100 rounded-lg overflow-hidden border">
                                    <img src={url} alt={`License ${index + 1}`} className="object-cover w-full h-full" />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveImage(index)}
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    </div>

                    {/* Vehicle Details */}
                    <div>
                    <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4 border-b pb-2">
                        Vehicle Details
                    </h3>
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                        <div>
                        <label htmlFor="vehicleOwnerName" className="block text-sm font-medium text-gray-700">
                            Vehicle Owner Name <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1">
                            <input
                            id="vehicleOwnerName"
                            name="vehicleOwnerName"
                            type="text"
                            required
                            value={formData.vehicleOwnerName}
                            onChange={handleChange}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            />
                        </div>
                        </div>

                        <div>
                        <label htmlFor="vehicleName" className="block text-sm font-medium text-gray-700">
                            Vehicle Model Name
                        </label>
                        <div className="mt-1">
                            <input
                            id="vehicleName"
                            name="vehicleName"
                            type="text"
                            placeholder="e.g. Honda Activa"
                            value={formData.vehicleName}
                            onChange={handleChange}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            />
                        </div>
                        </div>

                        <div>
                        <label htmlFor="vehicleNo" className="block text-sm font-medium text-gray-700">
                            Vehicle Registration Number <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1">
                            <input
                            id="vehicleNo"
                            name="vehicleNo"
                            type="text"
                            required
                            placeholder="MH 31 AB 1234"
                            value={formData.vehicleNo}
                            onChange={handleChange}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            />
                        </div>
                        </div>
                    </div>
                    </div>

                    <div className="pt-5">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                Submitting...
                            </>
                        ) : (
                            "Register Profile & Join Shop"
                        )}
                    </button>
                    </div>
                </form>
            </div>
        )}
      </div>
    </div>
  );
}
