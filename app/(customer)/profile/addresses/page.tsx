"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Edit,
  Trash2,
  Home,
  Briefcase,
  AlertTriangle,
  Plus,
  ArrowLeft,
  Loader2,
  Crosshair,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
// import { UserService, Address, AddressPayload } from '@/services/userService';
import { userService as UserService } from "@/services/userService";
import { Address, NewAddressPayload as AddressPayload } from "@/types/user";
import { userStore } from "@/store";
import toast, { Toaster } from "react-hot-toast";

// --- Confirmation Modal ---
const DeleteConfirmationModal = ({
  onConfirm,
  onCancel,
  isDeleting,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
    onClick={onCancel}
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      onClick={(e) => e.stopPropagation()}
      className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm shadow-xl p-6 text-center border border-gray-100 dark:border-gray-700"
    >
      <div className="mx-auto h-12 w-12 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="h-6 w-6 text-red-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
        Delete Address?
      </h2>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Are you sure you want to delete this address? This action cannot be
        undone.
      </p>
      <div className="flex gap-3 mt-6">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isDeleting}
          className="flex-1 py-2.5 rounded-xl font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors text-sm flex items-center justify-center"
        >
          {isDeleting ? <Loader2 className="animate-spin w-4 h-4" /> : "Delete"}
        </button>
      </div>
    </motion.div>
  </motion.div>
);

// --- Address Form Component ---
const AddressForm = ({
  initialData,
  onSave,
  onCancel,
  isSaving,
}: {
  initialData: Partial<Address>;
  onSave: (data: AddressPayload) => void;
  onCancel: () => void;
  isSaving: boolean;
}) => {
  const [formData, setFormData] = useState<AddressPayload>({
    name: initialData.name || "Home",
    phone: initialData.phone || "",
    line1: initialData.line1 || "",
    line2: initialData.line2 || "",
    street: initialData.street || "",
    city: initialData.city || "",
    state: initialData.state || "",
    country: initialData.country || "India",
    pinCode: initialData.pinCode || "",
  });

  const [isLocating, setIsLocating] = useState(false);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const addr = data.address;

          setFormData((prev) => ({
            ...prev,
            line1: addr.house_number || addr.building || "",
            street: addr.road || addr.suburb || addr.neighbourhood || "",
            city: addr.city || addr.town || addr.village || addr.county || "",
            state: addr.state || "",
            country: "India",
            pinCode: addr.postcode || "",
          }));
        } catch (error) {
          console.warn("Failed to get address details", error);
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        alert("Unable to retrieve location");
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const isEditing = !!initialData.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
    >
      <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
        {isEditing ? "Edit Address" : "Add New Address"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tag Selection */}
        <div>
          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">
            Label
          </label>
          <div className="flex gap-3">
            {["Home", "Work", "Other"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData({ ...formData, name: type })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                  formData.name === type
                    ? "bg-yellow-50 border-yellow-500 text-yellow-700 dark:bg-yellow-900/30 dark:border-yellow-500 dark:text-yellow-400"
                    : "bg-gray-50 border-transparent text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Location Button */}
        {!isEditing && (
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="w-full py-3 rounded-xl border-2 border-dashed border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10 font-semibold flex items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors"
          >
            {isLocating ? (
              <Loader2 className="animate-spin w-4 h-4" />
            ) : (
              <Crosshair className="w-4 h-4" />
            )}
            Use Current Location
          </button>
        )}

        <div className="grid grid-cols-1 gap-4">
          <input
            placeholder="Phone Number"
            className="input-field"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            required
          />
          <input
            placeholder="Flat / House No / Building"
            className="input-field"
            value={formData.line1}
            onChange={(e) =>
              setFormData({ ...formData, line1: e.target.value })
            }
            required
          />
          <input
            placeholder="Street / Area / Colony"
            className="input-field"
            value={formData.street}
            onChange={(e) =>
              setFormData({ ...formData, street: e.target.value })
            }
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              placeholder="City"
              className="input-field"
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
              required
            />
            <input
              placeholder="Pincode"
              className="input-field"
              value={formData.pinCode}
              onChange={(e) =>
                setFormData({ ...formData, pinCode: e.target.value })
              }
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input
              placeholder="State"
              className="input-field"
              value={formData.state}
              onChange={(e) =>
                setFormData({ ...formData, state: e.target.value })
              }
              required
            />
            <input
              placeholder="Country"
              className="input-field"
              value={formData.country}
              onChange={(e) =>
                setFormData({ ...formData, country: e.target.value })
              }
              required
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-xl font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 py-3.5 rounded-xl font-bold bg-yellow-500 text-white hover:bg-yellow-600 transition-colors flex items-center justify-center"
          >
            {isSaving ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              "Save Address"
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

// --- Main Page Component ---
export default function AddressesPage() {
  const router = useRouter();
  const { addresses: addr } = userStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI State
  const [viewState, setViewState] = useState<"list" | "form">("list");
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deletingAddress, setDeletingAddress] = useState<Address | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Load Addresses
  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const data = await UserService.getAddresses();
      // const data = await addr
      const addrList = Array.isArray(data) ? data : [];
      setAddresses(addrList);
    } catch (error) {
      console.warn("Failed to load addresses", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (data: AddressPayload) => {
    setIsActionLoading(true);
    try {
      if (editingAddress) {
        // Update existing
        toast.loading("Updating address...", { id: "address-action" });
        const updated = await UserService.updateAddress(
          editingAddress.id as number,
          { ...data, id: editingAddress.id }
        );
        setAddresses((prev) =>
          prev.map((a) => (a.id === updated.id ? updated : a))
        );
        toast.success("Address updated!", { id: "address-action" });
      } else {
        // Add new
        toast.loading("Adding address...", { id: "address-action" });
        const added = await UserService.addAddress(data);
        setAddresses((prev) => [...prev, added]);
        toast.success("Address added!", { id: "address-action" });
      }
      // Return to list view
      setViewState("list");
      setEditingAddress(null);
    } catch (error: any) {
      console.error("Failed to save address", error);
      toast.error(error.message || "Failed to save address", { id: "address-action" });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAddress) return;
    setIsActionLoading(true);
    try {
      toast.loading("Deleting address...", { id: "address-action" });
      await UserService.deleteAddress(deletingAddress.id as number);
      setAddresses((prev) => prev.filter((a) => a.id !== deletingAddress.id));
      setDeletingAddress(null);
      toast.success("Address deleted!", { id: "address-action" });
    } catch (error: any) {
      console.error("Failed to delete address", error);
      toast.error(error.message || "Failed to delete address", { id: "address-action" });
    } finally {
      setIsActionLoading(false);
    }
  };

  const openAddForm = () => {
    setEditingAddress(null);
    setViewState("form");
  };

  const openEditForm = (addr: Address) => {
    setEditingAddress(addr);
    setViewState("form");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="animate-spin text-yellow-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <Toaster position="bottom-center" />
      {/* Header - Cleaned up: removed solid backgrounds for a cleaner look */}
      <header className="sticky top-0 z-10 px-4 py-4 flex items-center gap-3 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-md">
        <button
          onClick={() =>
            viewState === "form" ? setViewState("list") : router.back()
          }
          className="p-2 -ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-800 dark:text-white" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {viewState === "form"
            ? editingAddress
              ? "Edit Address"
              : "New Address"
            : "My Addresses"}
        </h1>
      </header>

      <main className="max-w-xl mx-auto p-4">
        <AnimatePresence mode="wait">
          {viewState === "form" ? (
            <AddressForm
              key="form"
              initialData={editingAddress || {}}
              onSave={handleSave}
              onCancel={() => setViewState("list")}
              isSaving={isActionLoading}
            />
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {addresses.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-gray-400" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    No addresses yet
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-6">
                    Add an address to speed up checkout.
                  </p>
                  <button
                    onClick={openAddForm}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 text-white font-bold rounded-full hover:bg-yellow-600 transition-colors shadow-lg shadow-yellow-500/20"
                  >
                    <Plus size={20} /> Add First Address
                  </button>
                </div>
              ) : (
                <>
                  {addresses.map((address) => (
                    <motion.div
                      key={address.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 group"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex gap-4">
                          <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center shrink-0">
                            {address.name.toLowerCase() === "work" ? (
                              <Briefcase size={18} />
                            ) : (
                              <Home size={18} />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-gray-900 dark:text-white">
                                {address.name}
                              </h3>
                              {/* You could add logic to show a 'Default' badge if your API supports it */}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                              {address.line1}, {address.street} <br />
                              {address.city} - {address.pinCode}
                            </p>
                            <p className="text-xs text-gray-500 mt-2 font-medium">
                              Phone: {address.phone}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-1 -mr-2">
                          <button
                            onClick={() => openEditForm(address)}
                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => setDeletingAddress(address)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  <button
                    onClick={openAddForm}
                    className="w-full py-3.5 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl text-gray-500 dark:text-gray-400 font-semibold flex items-center justify-center gap-2 hover:border-yellow-500 hover:text-yellow-600 dark:hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/10 transition-all"
                  >
                    <Plus size={20} /> Add New Address
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Delete Modal */}
      <AnimatePresence>
        {deletingAddress && (
          <DeleteConfirmationModal
            onConfirm={handleDelete}
            onCancel={() => setDeletingAddress(null)}
            isDeleting={isActionLoading}
          />
        )}
      </AnimatePresence>

      {/* Shared Styles for Inputs */}
      <style jsx global>{`
        .input-field {
          width: 100%;
          padding: 0.875rem 1rem;
          border-radius: 0.75rem;
          background-color: var(--bg-color, #f9fafb);
          border: 1px solid #e5e7eb;
          outline: none;
          transition: all 0.2s;
          font-size: 0.95rem;
        }
        .input-field:focus {
          border-color: #eab308;
          box-shadow: 0 0 0 2px rgba(234, 179, 8, 0.2);
        }
        :global(.dark) .input-field {
          background-color: #1f2937;
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
