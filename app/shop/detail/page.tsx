"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Store,
  MapPin,
  CreditCard,
  FileText,
  Edit,
  Save,
  Camera,
  Upload,
  Loader2,
  CheckCircle,
  FileBadge,
  User,
  LogOut,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ShopService, ShopProfile } from "@/services/shopService";
import { useRouter } from "next/navigation";
import { userStore as useUserStore } from "@/store";

export default function ShopProfilePage() {
  const router = useRouter();
  const { logout } = useUserStore();
  const [profile, setProfile] = useState<ShopProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [activeTab, setActiveTab] = useState<"details" | "bank" | "documents">(
    "details"
  );
  const [isEditing, setIsEditing] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<ShopProfile>>({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await ShopService.getShopProfile();
      setProfile(data);
      setFormData(data); // Initialize form
    } catch (error) {
      console.error("Failed to load profile", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await ShopService.updateShop(formData as any);
      setProfile((prev) => ({ ...prev, ...formData } as ShopProfile));
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Update failed", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateNestedField = (
    section: "bankDetail",
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section]!, [field]: value },
    }));
  };

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-yellow-500" size={32} />
      </div>
    );
  if (!profile) return <div className="p-8 text-center">Profile not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header Profile Card */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-24 bg-linear-to-r from-yellow-400 to-orange-500 opacity-20" />

        <div className="relative flex flex-col md:flex-row items-center gap-6 mt-4">
          <div className="w-24 h-24 bg-white dark:bg-gray-700 rounded-2xl border-4 border-white dark:border-gray-800 shadow-md overflow-hidden relative shrink-0">
            <Image
              src={profile.shopImage[0]}
              alt={profile.shopName}
              layout="fill"
              objectFit="cover"
            />
            <button className="absolute bottom-1 right-1 bg-black/50 p-1.5 rounded-full text-white hover:bg-black/70 transition-colors">
              <Camera size={14} />
            </button>
          </div>

          <div className="text-center md:text-left flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {profile.shopName}
            </h1>
            <p className="text-sm text-gray-500 capitalize flex items-center justify-center md:justify-start gap-2 mt-1">
              <Store size={14} /> {profile.shopCategory} Shop
            </p>
            <div className="flex items-center justify-center md:justify-start gap-2 mt-3">
              <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold rounded-full uppercase">
                {profile.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mt-8 border-b border-gray-100 dark:border-gray-700 overflow-x-auto no-scrollbar">
          {[
            { id: "details", label: "Shop Details", icon: Store },
            { id: "bank", label: "Bank Info", icon: CreditCard },
            { id: "documents", label: "Documents", icon: FileBadge },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-yellow-500 text-yellow-600 dark:text-yellow-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <Icon size={18} /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm min-h-[400px]">
        <AnimatePresence mode="wait">
          {/* --- DETAILS TAB --- */}
          {activeTab === "details" && (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                  Business Information
                </h3>
                <button
                  onClick={() =>
                    isEditing ? handleSave() : setIsEditing(true)
                  }
                  disabled={isSaving}
                  className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors ${
                    isEditing
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                  }`}
                >
                  {isSaving ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : isEditing ? (
                    <Save size={16} />
                  ) : (
                    <Edit size={16} />
                  )}
                  {isEditing ? "Save Changes" : "Edit Info"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Shop Name
                  </label>
                  <input
                    disabled={!isEditing}
                    value={formData.shopName}
                    onChange={(e) => updateField("shopName", e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed outline-none focus:border-yellow-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Category
                  </label>
                  <select
                    disabled={!isEditing}
                    value={formData.shopCategory}
                    onChange={(e) =>
                      updateField("shopCategory", e.target.value)
                    }
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed outline-none focus:border-yellow-500 appearance-none"
                  >
                    <option value="grocery">Grocery</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="bakery">Bakery</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    GST Number
                  </label>
                  <input
                    disabled={!isEditing}
                    value={formData.gstNumber}
                    onChange={(e) => updateField("gstNumber", e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed outline-none focus:border-yellow-500 uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    FSSAI License
                  </label>
                  <input
                    disabled={!isEditing}
                    value={formData.fssaiNumber}
                    onChange={(e) => updateField("fssaiNumber", e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed outline-none focus:border-yellow-500"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* --- BANK TAB --- */}
          {activeTab === "bank" && (
            <motion.div
              key="bank"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                  Bank Details
                </h3>
                <button
                  onClick={() =>
                    isEditing ? handleSave() : setIsEditing(true)
                  }
                  className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors ${
                    isEditing
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {isEditing ? "Save Changes" : "Edit Bank Info"}
                </button>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-xl border border-yellow-100 dark:border-yellow-900/30 flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-yellow-600 dark:text-yellow-500 shrink-0">
                  <CreditCard size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    Secure Payouts
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Payments are processed to this account every Wednesday.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Account Holder
                  </label>
                  <input
                    disabled={!isEditing}
                    value={formData.bankDetail?.accountHolderName}
                    onChange={(e) =>
                      updateNestedField(
                        "bankDetail",
                        "accountHolderName",
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed outline-none focus:border-yellow-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Account Number
                  </label>
                  <input
                    disabled={!isEditing}
                    type="password" // Mask for security, show on edit? Or text.
                    value={formData.bankDetail?.accountNumber}
                    onChange={(e) =>
                      updateNestedField(
                        "bankDetail",
                        "accountNumber",
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed outline-none focus:border-yellow-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    IFSC Code
                  </label>
                  <input
                    disabled={!isEditing}
                    value={formData.bankDetail?.ifscCode}
                    onChange={(e) =>
                      updateNestedField(
                        "bankDetail",
                        "ifscCode",
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed outline-none focus:border-yellow-500 uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Bank Name
                  </label>
                  <input
                    disabled={!isEditing}
                    value={formData.bankDetail?.bankName}
                    onChange={(e) =>
                      updateNestedField(
                        "bankDetail",
                        "bankName",
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed outline-none focus:border-yellow-500"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* --- DOCUMENTS TAB --- */}
          {activeTab === "documents" && (
            <motion.div
              key="documents"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
                Uploaded Documents
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {profile.documents &&
                  Object.entries(profile.documents).map(([key, url]) => (
                    <div
                      key={key}
                      className="relative aspect-3/4 bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden group border border-gray-200 dark:border-gray-700"
                    >
                      <Image
                        src={url}
                        alt={key}
                        layout="fill"
                        objectFit="cover"
                        className="group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs font-bold mb-2 uppercase">
                          {key.replace("Image", "")}
                        </span>
                        <button className="bg-white text-gray-900 p-1.5 rounded-lg hover:bg-gray-100">
                          <Edit size={14} />
                        </button>
                      </div>
                      <div className="absolute bottom-2 right-2">
                        <div className="bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                          <CheckCircle size={10} /> Verified
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
