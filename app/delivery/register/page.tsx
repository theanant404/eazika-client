"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import { Loader2, Upload, CheckCircle, X } from "lucide-react";

interface FormData {
  aadharNumber: string;
  panNumber: string;
  licenseNumber: string;
  vehicleOwnerName: string;
  vehicleName: string;
  vehicleNo: string;
  licenseImages: string[];
}

export default function DeliveryRegistrationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const shopId = searchParams.get("shopId");

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
    if (!shopId) {
      toast.error("Invalid registration link. Shop ID is missing.");
    }
  }, [shopId]);

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
        
        // 1. Get Signed URL
        const { data: signedUrlData } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v2"}/uploads/avatar`, 
          {
            fileName: `delivery-license-${Date.now()}-${file.name}`,
            contentType: file.type,
          },
            { withCredentials: true }
        );

        const { signedUrl, publicUrl } = signedUrlData;

        // 2. Upload File to GCS
        await axios.put(signedUrl, file, {
          headers: { "Content-Type": file.type },
        });

        uploadedUrls.push(publicUrl);
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
    if (!shopId) {
      toast.error("Missing Shop ID");
      return;
    }
    
    if (formData.licenseImages.length === 0) {
        toast.error("Please upload at least one license image.");
        return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v2"}/delivery/create-delivery-profile`,
          {
            ...formData,
            shopkeeperId: parseInt(shopId),
          },
          { withCredentials: true }
      );
      toast.success("Delivery profile created successfully!");
      router.push("/delivery/profile"); // Redirect to profile or dashboard
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!shopId) {
     return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="text-center p-8 bg-white rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Link</h1>
                <p className="text-gray-600">This registration link is invalid or expired. Please contact the shop owner.</p>
            </div>
        </div>
     )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Join Eazika Delivery Partner
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Complete your profile to start delivering orders.
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
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
                    "Register Profile"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
