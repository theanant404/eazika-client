"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Save,
  Loader2,
  Camera,
} from "lucide-react";
import { userStore } from "@/store";
import { userService } from "@/services/userService";
import toast, { Toaster } from "react-hot-toast";

export default function EditProfilePage() {
  const router = useRouter();
  const {
    user,
    updateUser,
    fetchUser,
    isLoading: isStoreLoading,
  } = userStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: user?.name,
    email: user?.email,
    phone: user?.phone,
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) await fetchUser();
      if (user)
        setFormData((prev) => ({
          ...prev,
          name: user?.name || prev.name,
          email: user?.email || prev.email,
          phone: user?.phone || prev.phone,
        }));
    })();
  }, [user, fetchUser]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Create local preview URL
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      // 1. Handle Image Upload if a new file was selected
      if (imageFile) {
        toast.loading("Uploading image...", { id: "profile-update" });
        const imageUrl = await userService.uploadImage(imageFile);
        await userService.updateProfilePicture(imageUrl);
      }

      // 2. Update Text Profile Data
      if (user) {
        toast.loading("Saving profile...", { id: "profile-update" });
        await updateUser({
          ...user,
          name: formData.name || "",
          email: formData.email || undefined,
        });
      }

      // 3. Refresh local data to ensure sync
      await fetchUser("fresh");
      
      toast.success("Profile updated successfully!", { id: "profile-update" });
      setTimeout(() => router.back(), 500);
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile", { id: "profile-update" });
    } finally {
      setIsUploading(false);
    }
  };

  const isLoading = isStoreLoading || isUploading;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <Toaster position="bottom-center" />
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-800 dark:text-white" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Edit Profile
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
            {/* Avatar Upload Section */}
            <div className="flex flex-col items-center justify-center">
              <div
                className="relative group cursor-pointer"
                onClick={handleImageClick}
              >
                <div className="w-28 h-28 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden border-4 border-white dark:border-gray-600 shadow-sm relative">
                  {imagePreview ? (
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      layout="fill"
                      objectFit="cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
                {/* Overlay with Camera Icon */}
                <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="text-white w-8 h-8" />
                </div>
                {/* Edit Badge */}
                <div className="absolute bottom-1 right-1 bg-yellow-500 p-2 rounded-full text-white border-2 border-white dark:border-gray-800 shadow-sm">
                  <Camera size={16} />
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                Tap to change photo
              </p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
            </div>

            <div className="h-px bg-gray-100 dark:bg-gray-700 w-full" />

            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name
              </label>
              <div className="relative">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none transition-all"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            {/* Phone (Read Only) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone Number
              </label>
              <div className="relative opacity-60">
                <Phone
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="tel"
                  value={formData.phone}
                  readOnly
                  className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-400 ml-1">
                Phone number cannot be changed
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-yellow-500 text-white font-bold py-4 rounded-xl hover:bg-yellow-600 transition-colors shadow-lg shadow-yellow-500/30 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <Save size={20} />
                Save Changes
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
