"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { userStore } from "@/store/userStore";
import ShopService, { shopService } from "@/services/shopService";
import type { Address } from "@/types/user";
import Image from "next/image";
import { Delete } from "lucide-react";

type WeeklySlot = {
    day: string;
    isOpen: boolean;
    open: string;
    close: string;
};

type DeliveryBandInput = {
    km: string;
    price: string;
};

type ShopProfile = {
    id?: number;
    name?: string;
    category?: string;
    images?: string[];
    coverPhoto?: string;
    phone?: string;
    ownerName?: string;
    address?: {
        name?: string;
        phone?: string;
        line1?: string;
        line2?: string | null;
        street?: string;
        country?: string;
        state?: string;
        city?: string;
        pinCode?: string;
    } | null;
};

const DEFAULT_ADDRESS: Address = {
    id: 0,
    name: "",
    phone: "",
    line1: "",
    street: "",
    country: "India",
    state: "Maharashtra",
    city: "",
    pinCode: "",
    geoLocation: "",
};

const DEFAULT_SLOTS: WeeklySlot[] = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
].map((day) => ({ day, isOpen: true, open: "09:00", close: "21:00" }));

const DEFAULT_RADII: DeliveryBandInput[] = [
    { km: "1", price: "0" },
];

export default function ShopSettingsPage() {
    const { user, fetchUser } = userStore();
    const [addressForm, setAddressForm] = useState<Address>(DEFAULT_ADDRESS);
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [loadingGeo, setLoadingGeo] = useState(false);
    const [onlineDelivery, setOnlineDelivery] = useState(true);
    const [slots, setSlots] = useState<WeeklySlot[]>(DEFAULT_SLOTS);
    const [deliveryBands, setDeliveryBands] = useState<DeliveryBandInput[]>(DEFAULT_RADII);
    const [minOrderValue, setMinOrderValue] = useState(0);
    const [shopProfile, setShopProfile] = useState<ShopProfile | null>(null);
    const [primaryAddress, setPrimaryAddress] = useState<Address | null>(null);
    const [addressLoading, setAddressLoading] = useState<boolean>(true);
    const [schedulesLoading, setSchedulesLoading] = useState(true);
    const [deliveryBandsLoading, setDeliveryBandsLoading] = useState(true);
    const [minOrderLoading, setMinOrderLoading] = useState(true);
    const [scheduleDirty, setScheduleDirty] = useState(false);
    const [deliveryBandsDirty, setDeliveryBandsDirty] = useState(false);
    const [minOrderDirty, setMinOrderDirty] = useState(false);
    const [savingSchedule, setSavingSchedule] = useState(false);
    const [savingPricing, setSavingPricing] = useState(false);
    const [savingMinOrder, setSavingMinOrder] = useState(false);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const addr = (await ShopService.getShopAddress()) as Address | { data?: Address } | null;
                if (!mounted) return;
                // Some APIs return wrapper objects; normalize if needed
                const normalized: Address | null = addr && "data" in (addr as { data?: Address })
                    ? ((addr as { data?: Address }).data ?? null)
                    : ((addr as Address) ?? null);
                setPrimaryAddress(normalized);
            } catch (err) {
                console.warn("Failed to fetch shop address", err);
                setPrimaryAddress(null);
            } finally {
                if (mounted) setAddressLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);
    useEffect(() => {
        (async () => {
            if (user && user.id) {
                try {
                    const shopDetails = await ShopService.getShopProfile();
                    // console.log(shopDetails);
                    const data = (shopDetails as { data?: ShopProfile } | ShopProfile | null) || null;
                    const normalized: ShopProfile | null =
                        data && typeof data === "object" && "data" in data
                            ? (data as { data?: ShopProfile }).data ?? null
                            : (data as ShopProfile | null);
                    setShopProfile(normalized);
                } catch (err) {
                    console.warn("Failed to fetch shop address by user ID", err);
                }
            }
        })();
    }, [user]);
    // Prefill delivery slots from backend; fall back to defaults if unavailable
    useEffect(() => {
        (async () => {
            try {
                const slotsResponse = await ShopService.getShopDeliverySlots();
                const weekly = slotsResponse?.data?.weeklySlots;
                // console.log(weekly)
                if (Array.isArray(weekly) && weekly.length > 0) {
                    setSlots(weekly);
                    const online = slotsResponse.data.isOnlineDelivery;
                    if (typeof online === "boolean") {
                        setOnlineDelivery(online);
                    }
                } else {
                    setSlots(DEFAULT_SLOTS);
                }
            } catch (err) {
                console.warn("Using default delivery slots", err);
                setSlots(DEFAULT_SLOTS);
            } finally {
                setSchedulesLoading(false);
                setScheduleDirty(false);
            }
        })();
    }, []);

    // Prefill minimum order value from backend; fall back to default if unavailable
    useEffect(() => {
        (async () => {
            try {
                const minOrderResponse = await ShopService.getShopMinimumOrder();
                // console.log(minOrderResponse)
                const minimumOrderValue = minOrderResponse?.data?.minimumValue;
                if (typeof minimumOrderValue === "number" && minimumOrderValue >= 0) {
                    setMinOrderValue(minimumOrderValue);
                } else {
                    setMinOrderValue(0);
                }
            } catch (err) {
                console.warn("Using default minimum order value", err);
                setMinOrderValue(0);
            } finally {
                setMinOrderLoading(false);
                setMinOrderDirty(false);
            }
        })();
    }, []);

    // Prefill delivery rates from backend; fall back to defaults if unavailable
    useEffect(() => {
        (async () => {
            try {
                const DeliverySlotsResponse = await ShopService.getShopDeliveryRates();
                const rates = DeliverySlotsResponse?.data?.rates;
                if (Array.isArray(rates) && rates.length > 0) {
                    setDeliveryBands(
                        rates.map((r: { km?: number; price?: number }) => ({
                            km: r?.km !== undefined ? String(r.km) : "",
                            price: r?.price !== undefined ? String(r.price) : "",
                        }))
                    );
                } else {
                    setDeliveryBands(DEFAULT_RADII);
                }
            } catch (err) {
                console.warn("Using default delivery rates", err);
                setDeliveryBands(DEFAULT_RADII);
            } finally {
                setDeliveryBandsLoading(false);
                setDeliveryBandsDirty(false);
            }
        })();
    }, []);

    useEffect(() => {
        if (!user && !primaryAddress) return;
        // Only refill form from primaryAddress when not editing
        if (!isEditingAddress && primaryAddress) {
            setAddressForm(primaryAddress);
        }
        // Prefill from user if available
        if (user) {
            setAddressForm((prev) => ({
                ...prev,
                name: user.name || prev.name,
                phone: user.phone || prev.phone,
            }));
        }
    }, [primaryAddress, user, isEditingAddress]);

    const handleGeoLocate = () => {
        if (!navigator?.geolocation) {
            toast.error("Geolocation not supported on this device.");
            return;
        }
        setLoadingGeo(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setAddressForm((prev) => ({
                    ...prev,
                    geoLocation: `${latitude},${longitude}`,
                }));
                toast.success(`Location captured: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
                setLoadingGeo(false);
            },
            (err) => {
                console.error("Geolocation error", err);
                setLoadingGeo(false);

                // Handle different error types
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        toast.error("Location permission denied. Please enable location access in your browser settings.");
                        break;
                    case err.POSITION_UNAVAILABLE:
                        toast.error("Location information is unavailable. Please check your device settings.");
                        break;
                    case err.TIMEOUT:
                        toast.error("Location request timed out. Please try again.");
                        break;
                    default:
                        toast.error("An unknown error occurred while getting location. Please try again.");
                        break;
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 30000, // Increased to 30 seconds
                maximumAge: 60000 // Allow cached position up to 1 minute old
            }
        );
    };

    const upsertAddress = async () => {
        // Validate all required fields
        const emptyFields = [];

        if (!addressForm.name?.trim()) emptyFields.push("Contact Name");
        if (!addressForm.phone?.trim() || addressForm.phone.length !== 10) emptyFields.push("Phone (must be 10 digits)");
        if (!addressForm.line1?.trim()) emptyFields.push("Address Line");
        if (!addressForm.street?.trim()) emptyFields.push("Street");
        if (!addressForm.city?.trim()) emptyFields.push("City");
        if (!addressForm.state?.trim()) emptyFields.push("State");
        if (!addressForm.country?.trim()) emptyFields.push("Country");
        if (!addressForm.pinCode?.trim() || addressForm.pinCode.length !== 6) emptyFields.push("Pin Code (must be 6 digits)");
        if (!addressForm.geoLocation?.trim()) emptyFields.push("Geo Location");

        if (emptyFields.length > 0) {
            toast.error(`Please fill all required fields:\n${emptyFields.join(", ")}`);
            return;
        }

        try {
            const addressPayload = {
                name: addressForm.name,
                phone: addressForm.phone,
                line1: addressForm.line1,
                line2: ((addressForm as Address & { line2?: string }).line2) || "",
                street: addressForm.street || "",
                city: addressForm.city,
                state: addressForm.state,
                pinCode: addressForm.pinCode,
                country: addressForm.country,
                geoLocation: addressForm.geoLocation,
            };

            await shopService.updateShopAddress(addressPayload);
            toast.success("Address saved successfully");
            setIsEditingAddress(false);
        } catch (error) {
            console.error("Failed to save address", error);
            toast.error("Could not save address");
        }
    };

    const handleSlotChange = (idx: number, key: keyof WeeklySlot, value: string | boolean) => {
        setSlots((prev) => prev.map((slot, i) => (i === idx ? { ...slot, [key]: value } : slot)));
        setScheduleDirty(true);
    };

    const saveSchedule = async () => {
        const schedulePayload = {
            isOnlineDelivery: onlineDelivery,
            weeklySlots: slots.map((s) => ({
                day: s.day,
                isOpen: s.isOpen,
                open: s.open,
                close: s.close,
            })),
        };
        setSavingSchedule(true);
        try {
            await ShopService.shopDeliverySlots(schedulePayload)
            toast.success("Schedule saved");
            setScheduleDirty(false);
        } catch (error) {
            console.error("Failed to save schedule", error);
            toast.error("Could not save schedule");
        } finally {
            setSavingSchedule(false);
        }
    };
    const saveDeliveryBands = async () => {
        const pricingPayload = {
            rates: deliveryBands.map((b) => ({
                km: parseFloat(b.km) || 0,
                price: parseFloat(b.price) || 0,
            })),
        };
        setSavingPricing(true);
        try {
            await ShopService.shopDeliveryRates(pricingPayload)
            toast.success("Delivery radius pricing saved");
            setDeliveryBandsDirty(false);
        } catch (error) {
            console.error("Failed to save delivery pricing", error);
            toast.error("Could not save delivery pricing");
        } finally {
            setSavingPricing(false);
        }
    };


    const saveMinOrder = async () => {
        const payload = { minimumOrderValue: minOrderValue };
        setSavingMinOrder(true);
        try {
            await ShopService.shopMinimumOrder(payload)
            toast.success("Minimum order updated");
            setMinOrderDirty(false);
        } catch (error) {
            console.error("Failed to save minimum order", error);
            toast.error("Could not save minimum order");
        } finally {
            setSavingMinOrder(false);
        }
    };


    const renderAddressView = () => {
        // Show loading skeleton while fetching
        if (addressLoading) {
            return (
                <div className="space-y-3">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-48" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-32" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-full" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-40" />
                </div>
            );
        }

        // Show form if no address or editing
        if (!primaryAddress || isEditingAddress) return null;

        // Show address view
        return (
            <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{primaryAddress.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{primaryAddress.phone}</p>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                    {primaryAddress.line1}
                    {primaryAddress.street ? `, ${primaryAddress.street}` : ""}
                    {primaryAddress.city ? `, ${primaryAddress.city}` : ""}
                </p>
                <p className="text-sm text-gray-500">{primaryAddress.state}, {primaryAddress.country} - {primaryAddress.pinCode}</p>
                {primaryAddress.geoLocation && (
                    <p className="text-xs text-gray-500">Geo: {primaryAddress.geoLocation}</p>
                )}
                <button
                    type="button"
                    onClick={() => setIsEditingAddress(true)}
                    className="mt-2 inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                >
                    Edit
                </button>
            </div>
        );
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-16 px-2 md:px-0">
            <div className="sm:flex sm:flex-row flex-col-reverse">
                <div>
                    {shopProfile && (
                        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm space-y-3">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    {shopProfile.coverPhoto ? (
                                        <Image
                                            src={shopProfile.coverPhoto || ""}
                                            width={200}
                                            height={200}
                                            alt={shopProfile.name || "Shop cover"}
                                            className="h-16 w-16 rounded-xl object-cover border border-gray-200 dark:border-gray-700"
                                        />
                                    ) : (
                                        <div className="h-16 w-16 rounded-xl bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-sm font-semibold text-gray-500">
                                            Logo
                                        </div>
                                    )}
                                    <div>
                                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{shopProfile.name || "Shop"}</h1>
                                        <p className="text-sm text-gray-500">{shopProfile.category || "Category"}</p>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-700 dark:text-gray-200 space-y-1">
                                    {shopProfile.phone && <p className="font-semibold">📞 {shopProfile.phone}</p>}
                                    {shopProfile.ownerName && <p>Owner: {shopProfile.ownerName}</p>}
                                    {shopProfile.address && (
                                        <p className="text-gray-600 dark:text-gray-300">
                                            {[shopProfile.address.line1, shopProfile.address.street, shopProfile.address.city]
                                                .filter(Boolean)
                                                .join(", ")}
                                            {shopProfile.address.state ? `, ${shopProfile.address.state}` : ""}
                                            {shopProfile.address.country ? `, ${shopProfile.address.country}` : ""}
                                            {shopProfile.address.pinCode ? ` - ${shopProfile.address.pinCode}` : ""}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </section>
                    )}
                </div>

            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shop Settings</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage your location, schedule, delivery fees, and minimum order.</p>
                </div>
            </div>

            <div className="grid gap-4 md:gap-6">
                {/* Location and address */}
                <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-3 md:p-5 space-y-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Shop Location</h2>
                            <p className="text-sm text-gray-500">Enable location or add address manually.</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleGeoLocate}
                            disabled={loadingGeo}
                            className="px-4 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold shadow-sm disabled:opacity-70 w-full sm:w-auto"
                        >
                            {loadingGeo ? "Detecting..." : "Use current location"}
                        </button>
                    </div>

                    {renderAddressView()}

                    {!addressLoading && (isEditingAddress || !primaryAddress) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase">Contact Name <span className="text-red-500">*</span></label>
                                <input
                                    required
                                    maxLength={100}
                                    value={addressForm.name}
                                    onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-sm"
                                    placeholder="Shop owner"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase">Phone</label>
                                <input
                                    type="tel"
                                    value={addressForm.phone}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                        setAddressForm({ ...addressForm, phone: value });
                                    }}
                                    maxLength={10}
                                    minLength={10}
                                    pattern="[0-9]{10}"
                                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-sm"
                                    placeholder="10-digit phone"
                                />
                                <p className="text-[10px] text-gray-400">Indian standard: 10 digits</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase">Address line <span className="text-red-500">*</span></label>
                                <input
                                    required
                                    maxLength={100}
                                    value={addressForm.line1}
                                    onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
                                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-sm"
                                    placeholder="House / building"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase">Street <span className="text-red-500">*</span></label>
                                <input
                                    required
                                    maxLength={100}
                                    value={addressForm.street || ""}
                                    onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-sm"
                                    placeholder="Street / area"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase">City <span className="text-red-500">*</span></label>
                                <input
                                    required
                                    maxLength={50}
                                    value={addressForm.city}
                                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-sm"
                                    placeholder="City"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase">State <span className="text-red-500">*</span></label>
                                <select
                                    required
                                    value={addressForm.state}
                                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-sm appearance-none"
                                >
                                    <option value="">Select state</option>
                                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                                    <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                                    <option value="Assam">Assam</option>
                                    <option value="Bihar">Bihar</option>
                                    <option value="Chhattisgarh">Chhattisgarh</option>
                                    <option value="Goa">Goa</option>
                                    <option value="Gujarat">Gujarat</option>
                                    <option value="Haryana">Haryana</option>
                                    <option value="Himachal Pradesh">Himachal Pradesh</option>
                                    <option value="Jharkhand">Jharkhand</option>
                                    <option value="Karnataka">Karnataka</option>
                                    <option value="Kerala">Kerala</option>
                                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                                    <option value="Maharashtra">Maharashtra</option>
                                    <option value="Manipur">Manipur</option>
                                    <option value="Meghalaya">Meghalaya</option>
                                    <option value="Mizoram">Mizoram</option>
                                    <option value="Nagaland">Nagaland</option>
                                    <option value="Odisha">Odisha</option>
                                    <option value="Punjab">Punjab</option>
                                    <option value="Rajasthan">Rajasthan</option>
                                    <option value="Sikkim">Sikkim</option>
                                    <option value="Tamil Nadu">Tamil Nadu</option>
                                    <option value="Telangana">Telangana</option>
                                    <option value="Tripura">Tripura</option>
                                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                                    <option value="Uttarakhand">Uttarakhand</option>
                                    <option value="West Bengal">West Bengal</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase">Country <span className="text-red-500">*</span></label>
                                <input
                                    required
                                    maxLength={50}
                                    value={addressForm.country}
                                    onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-sm"
                                    placeholder="Country"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase">Pin code</label>
                                <input
                                    type="text"
                                    value={addressForm.pinCode}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                        setAddressForm({ ...addressForm, pinCode: value });
                                    }}
                                    maxLength={6}
                                    minLength={6}
                                    pattern="[0-9]{6}"
                                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-sm"
                                    placeholder="Postal code"
                                />
                                <p className="text-[10px] text-gray-400">Indian standard: 6 digits</p>
                            </div>
                            <div className="space-y-1 md:col-span-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase">Geo location (lat,lng) <span className="text-red-500">*</span></label>
                                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                                    <input
                                        required
                                        value={addressForm.geoLocation || ""}
                                        onChange={(e) => setAddressForm({ ...addressForm, geoLocation: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-sm"
                                        placeholder="19.12345,72.12345"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleGeoLocate}
                                        disabled={loadingGeo}
                                        className="shrink-0 px-4 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold shadow-sm disabled:opacity-70 w-full sm:w-auto"
                                    >
                                        {loadingGeo ? "Locating..." : "Use GPS"}
                                    </button>
                                </div>
                            </div>
                            <div className="md:col-span-2 flex flex-col sm:flex-row sm:justify-end gap-3 items-stretch sm:items-center">
                                {primaryAddress && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAddressForm(primaryAddress);
                                            setIsEditingAddress(false);
                                        }}
                                        className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-200 w-full sm:w-auto"
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={upsertAddress}
                                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-yellow-500 text-white w-full sm:w-auto"
                                >
                                    {primaryAddress ? "Update address" : "Add address"}
                                </button>
                            </div>
                        </div>
                    )}
                </section>

                {/* Delivery toggle and schedule */}
                <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-3 md:p-5 space-y-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Online delivery</h2>
                            <p className="text-sm text-gray-500">Toggle availability and set timings.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only"
                                checked={onlineDelivery}
                                onChange={(e) => {
                                    setOnlineDelivery(e.target.checked);
                                    setScheduleDirty(true);
                                }}
                            />
                            <span className={`w-11 h-6 rounded-full transition ${onlineDelivery ? "bg-green-500" : "bg-gray-300"}`}>
                                <span
                                    className={`block h-5 w-5 bg-white rounded-full shadow transform transition ${onlineDelivery ? "translate-x-5" : "translate-x-1"}`}
                                />
                            </span>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {schedulesLoading ? (
                            <div className="col-span-full space-y-3">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : (
                            slots.map((slot, idx) => (
                                <div key={slot.day} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-gray-100 dark:border-gray-700 rounded-xl px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={slot.isOpen}
                                            onChange={(e) => {
                                                handleSlotChange(idx, "isOpen", e.target.checked);
                                            }}
                                            className="h-4 w-4"
                                        />
                                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{slot.day}</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm w-full sm:w-auto">
                                        <input
                                            type="time"
                                            value={slot.open}
                                            onChange={(e) => {
                                                handleSlotChange(idx, "open", e.target.value);
                                            }}
                                            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-2 py-1"
                                            disabled={!slot.isOpen}
                                        />
                                        <span className="text-gray-500">to</span>
                                        <input
                                            type="time"
                                            value={slot.close}
                                            onChange={(e) => {
                                                handleSlotChange(idx, "close", e.target.value);
                                            }}
                                            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-2 py-1"
                                            disabled={!slot.isOpen}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={saveSchedule}
                            disabled={!scheduleDirty || savingSchedule || schedulesLoading}
                            className="px-4 py-2 rounded-xl text-sm font-semibold bg-yellow-500 text-white disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                        >
                            {savingSchedule ? "Saving..." : "Save schedule"}
                        </button>
                    </div>
                </section>

                {/* Delivery radius pricing */}
                <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-3 md:p-5 space-y-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Delivery radius pricing</h2>
                            <p className="text-sm text-gray-500">Set fee per distance band.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setDeliveryBands((prev) => [
                                    ...prev,
                                    { km: String(prev.length + 1), price: "0" },
                                ]);
                                setDeliveryBandsDirty(true);
                            }}
                            className="px-3 py-2 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 w-full sm:w-auto"
                        >
                            Add band
                        </button>
                    </div>

                    <div className="space-y-3">
                        {deliveryBandsLoading ? (
                            <div className="space-y-3">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : (
                            deliveryBands.map((band, idx) => (
                                <div key={`band-${idx}`} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center justify-center">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Distance (km)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="1000"
                                            step="0.1"
                                            value={band.km}
                                            onChange={(e) => {
                                                const km = Math.min(1000, Math.max(0, parseFloat(e.target.value) || 0)).toString();
                                                setDeliveryBands((prev) => prev.map((b, i) => (i === idx ? { ...b, km } : b)));
                                                setDeliveryBandsDirty(true);
                                            }}
                                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm"
                                        />
                                        <p className="text-[10px] text-gray-400">Max 50 km</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Fee (₹)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="1000"
                                            step="0.01"
                                            value={band.price}
                                            onChange={(e) => {
                                                const price = Math.min(1000, Math.max(0, parseFloat(e.target.value) || 0)).toString();
                                                setDeliveryBands((prev) => prev.map((b, i) => (i === idx ? { ...b, price } : b)));
                                                setDeliveryBandsDirty(true);
                                            }}
                                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm"
                                        />
                                        <p className="text-[10px] text-gray-400">Max ₹1000</p>
                                    </div>
                                    <div className="flex justify-start sm:justify-start">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDeliveryBands((prev) => prev.filter((_, i) => i !== idx));
                                                setDeliveryBandsDirty(true);
                                            }}
                                            className="px-3 py-2 rounded-xl text-sm font-semibold bg-red-100 text-red-700 w-full sm:w-auto"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={saveDeliveryBands}
                            disabled={!deliveryBandsDirty || savingPricing || deliveryBandsLoading}
                            className="px-4 py-2 rounded-xl text-sm font-semibold bg-yellow-500 text-white disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                        >
                            {savingPricing ? "Saving..." : "Save pricing"}
                        </button>
                    </div>
                </section>

                {/* Minimum order value */}
                <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-3 shadow-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Minimum order value</h2>
                            <p className="text-sm text-gray-500">Orders below this amount will be blocked.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-center">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Amount (₹)</label>
                            {minOrderLoading ? (
                                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
                            ) : (
                                <>
                                    <input
                                        min="0"
                                        max="100000"
                                        step="1"
                                        value={minOrderValue}
                                        onChange={(e) => {
                                            const value = Math.min(100000, Math.max(0, parseFloat(e.target.value) || 0));
                                            setMinOrderValue(value);
                                            setMinOrderDirty(true);
                                        }}
                                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-sm"
                                    />
                                    <p className="text-[10px] text-gray-400">Max ₹1,00,000</p>
                                </>
                            )}
                        </div>
                        <div className="sm:col-span-2 flex flex-col sm:flex-row sm:justify-end gap-3 items-stretch sm:items-center">
                            <button
                                type="button"
                                onClick={saveMinOrder}
                                disabled={!minOrderDirty || savingMinOrder || minOrderLoading}
                                className="px-4 py-2 rounded-xl text-sm font-semibold bg-yellow-500 text-white disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                            >
                                {savingMinOrder ? "Saving..." : "Save minimum order"}
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}