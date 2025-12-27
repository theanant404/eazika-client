"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // Import useRouter
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";
import { useCartStore } from "@/store";
import type { CartItem } from "@/types/products";

type ShopInfo = {
  id?: string | number;
  name?: string;
  address?: {
    geoLocation?: string;
    latitude?: string;
    longitude?: string;
  };
  minOrder?: { minimumValue?: number };
  minimumOrderValue?: number;
  deliveryRates?:
  | { km: number; price: number }[]
  | { rates?: { km: number; price: number }[] };
};

type ItemWithShop = CartItem & { shop?: ShopInfo };

const earthDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371 * c;
};

export default function CartPage() {
  const router = useRouter(); // Initialize router
  const { items, fetchCart } = useCartStore();
  const [selectedItems, setSelectedItems] = useState<Set<string | number>>(new Set());
  const [latitudeInput, setLatitudeInput] = useState("");
  const [longitudeInput, setLongitudeInput] = useState("");
  const [locationError, setLocationError] = useState<string>("");
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (items.length <= 0) fetchCart();
  }, [fetchCart, items.length]);

  const userCoordinates = useMemo(() => {
    const lat = parseFloat(latitudeInput);
    const lng = parseFloat(longitudeInput);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    return null;
  }, [latitudeInput, longitudeInput]);

  const availability = useMemo(() => {
    const shopMap: Record<
      string | number,
      {
        shopId: string | number;
        shopName?: string;
        total: number;
        minOrder: number;
        meetsMin: boolean;
        deliveryFee: number;
        hasCoords: boolean;
        inRange: boolean;
        distanceKm?: number;
      }
    > = {};

    const typedItems = items as ItemWithShop[];

    typedItems.forEach((item) => {
      const shop = item.shop;
      const shopId = shop?.id ?? `shop-${item.id}`;
      const minOrder =
        shop?.minOrder?.minimumValue ??
        (shop as any)?.minOrder?.minimumValue ??
        (shop as any)?.minimumOrder?.minimumValue ??
        shop?.minimumOrderValue ??
        0;

      if (!shopMap[shopId]) {
        shopMap[shopId] = {
          shopId,
          shopName: shop?.name,
          total: 0,
          minOrder,
          meetsMin: true,
          deliveryFee: 0,
          hasCoords: false,
          inRange: false,
          distanceKm: undefined,
        };
      }

      shopMap[shopId].total += item.product.price * item.quantity;
    });

    Object.values(shopMap).forEach((entry) => {
      const shop = (typedItems.find((i) => (i.shop?.id ?? `shop-${i.id}`) === entry.shopId) as ItemWithShop | undefined)?.shop;

      const geoString = shop?.address?.geoLocation;
      const latFromField = shop?.address?.latitude;
      const lngFromField = shop?.address?.longitude;

      const geoParts = geoString?.split(",");
      const shopLat =
        geoParts?.length === 2
          ? parseFloat(geoParts[0].trim())
          : latFromField
            ? parseFloat(latFromField)
            : undefined;
      const shopLng =
        geoParts?.length === 2
          ? parseFloat(geoParts[1].trim())
          : lngFromField
            ? parseFloat(lngFromField)
            : undefined;

      const hasCoords = Number.isFinite(shopLat) && Number.isFinite(shopLng);
      entry.hasCoords = !!hasCoords;

      const minOrder = entry.minOrder;
      entry.meetsMin = minOrder > 0 ? entry.total >= minOrder : true;

      const deliveryRatesRaw = (shop?.deliveryRates as any)?.rates ?? shop?.deliveryRates ?? [];
      const deliveryRates = Array.isArray(deliveryRatesRaw) ? deliveryRatesRaw : [];

      if (userCoordinates && hasCoords) {
        const distance = earthDistanceKm(userCoordinates.lat, userCoordinates.lng, shopLat as number, shopLng as number);
        entry.distanceKm = distance;

        const sortedRates = [...deliveryRates].sort((a, b) => a.km - b.km);
        const matchedRate = sortedRates.find((rate) => distance <= rate.km);

        if (matchedRate) {
          entry.deliveryFee = matchedRate.price;
          entry.inRange = true;
        } else if (sortedRates.length > 0) {
          entry.inRange = false;
        } else {
          entry.deliveryFee = 0;
          entry.inRange = true;
        }
      }
    });

    const byItemId: Record<
      string | number,
      {
        selectable: boolean;
        reason?: string;
        shopId: string | number;
        distanceKm?: number;
        deliveryFee: number;
        minOrder: number;
        meetsMin: boolean;
        inRange: boolean;
        shopName?: string;
      }
    > = {};

    typedItems.forEach((item) => {
      const shopId = item.shop?.id ?? `shop-${item.id}`;
      const entry = shopMap[shopId];

      let reason = "";
      if (!userCoordinates) {
        reason = "Add your location to check availability";
      } else if (!entry.hasCoords) {
        reason = "Shop location unavailable";
      } else if (!entry.inRange) {
        reason = "Not available at your location";
      } else if (entry.minOrder > 0 && !entry.meetsMin) {
        reason = `Minimum order ₹${entry.minOrder.toFixed(0)} required`;
      }

      byItemId[item.id] = {
        selectable: reason === "",
        reason: reason || undefined,
        shopId,
        distanceKm: entry.distanceKm,
        deliveryFee: entry.deliveryFee,
        minOrder: entry.minOrder,
        meetsMin: entry.meetsMin,
        inRange: entry.inRange,
        shopName: entry.shopName,
      };
    });

    return { byItemId, shopMap };
  }, [items, userCoordinates]);

  const effectiveSelected = useMemo(() => {
    return new Set(
      [...selectedItems].filter((id) => availability.byItemId[id]?.selectable)
    );
  }, [availability.byItemId, selectedItems]);

  const selectedTotal = useMemo(() => {
    return items
      .filter((item) => effectiveSelected.has(item.id))
      .reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [items, effectiveSelected]);

  const deliveryTotal = useMemo(() => {
    const shopIds = new Set(
      items
        .filter((item) => effectiveSelected.has(item.id))
        .map((item) => availability.byItemId[item.id]?.shopId)
        .filter((id): id is string | number => Boolean(id))
    );
    let total = 0;
    shopIds.forEach((shopId) => {
      const entry = availability.shopMap[shopId];
      if (entry) total += entry.deliveryFee || 0;
    });
    return total;
  }, [availability.shopMap, availability.byItemId, items, effectiveSelected]);

  const grandTotal = selectedTotal + deliveryTotal;

  // Toggle item selection
  const toggleItemSelection = (itemId: string | number) => {
    if (!availability.byItemId[itemId]?.selectable) return;
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  // Select/Deselect all
  const toggleSelectAll = () => {
    if (!userCoordinates) {
      setLocationError("Enter latitude and longitude to select items");
      return;
    }

    const selectableIds = items
      .filter((item) => availability.byItemId[item.id]?.selectable)
      .map((item) => item.id);

    if (selectableIds.length === effectiveSelected.size) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(selectableIds));
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported in this browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitudeInput(pos.coords.latitude.toFixed(6));
        setLongitudeInput(pos.coords.longitude.toFixed(6));
        setLocationError("");
        setIsLocating(false);
      },
      () => {
        setLocationError("Unable to fetch current location");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const selectableCount = useMemo(
    () => items.filter((item) => availability.byItemId[item.id]?.selectable).length,
    [availability.byItemId, items]
  );

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        {/* Changed from Link to button with router.back() */}
        <button
          onClick={() => router.back()}
          className="md:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Shopping Cart
        </h1>
        <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          ({items.length} items)
        </span>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-[2fr_2fr_auto] items-end bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
        <div>
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 block mb-1">
            Latitude
          </label>
          <input
            type="number"
            value={latitudeInput}
            onChange={(e) => {
              setLatitudeInput(e.target.value);
              if (locationError) setLocationError("");
            }}
            placeholder="e.g. 25.370656"
            className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 block mb-1">
            Longitude
          </label>
          <input
            type="number"
            value={longitudeInput}
            onChange={(e) => {
              setLongitudeInput(e.target.value);
              if (locationError) setLocationError("");
            }}
            placeholder="e.g. 85.163734"
            className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="whitespace-nowrap px-4 py-2 bg-yellow-500 text-white font-semibold rounded-xl hover:bg-yellow-600 transition disabled:opacity-60"
          >
            {isLocating ? "Locating..." : "Use Current Location"}
          </button>
        </div>
        <p className="md:col-span-3 text-xs text-gray-500 dark:text-gray-400">
          Add your latitude and longitude to check delivery range and shop minimum order rules for each product.
        </p>
        {locationError && (
          <p className="md:col-span-3 text-sm text-red-500">{locationError}</p>
        )}
      </div>

      {items.length > 0 ? (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items List */}
          <div className="flex-1 space-y-4">
            {/* Select All Checkbox */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
              <input
                type="checkbox"
                checked={selectableCount > 0 && effectiveSelected.size === selectableCount}
                onChange={toggleSelectAll}
                className="w-5 h-5 rounded cursor-pointer"
                disabled={selectableCount === 0}
              />
              <label className="cursor-pointer text-sm font-semibold text-gray-700 dark:text-gray-300">
                {effectiveSelected.size === selectableCount && selectableCount > 0
                  ? "Deselect All"
                  : "Select All"}
              </label>
            </div>

            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <ItemsList
                  key={item.id}
                  {...item}
                  availability={availability.byItemId[item.id]}
                  isSelected={effectiveSelected.has(item.id)}
                  onToggleSelect={() => toggleItemSelection(item.id)}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div className="lg:w-96">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Order Summary
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Selected Items ({effectiveSelected.size})</span>
                  <span>₹{selectedTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Delivery Fee</span>
                  <span className="font-medium text-gray-900 dark:text-gray-200">₹{deliveryTotal.toFixed(2)}</span>
                </div>
                {/* <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Taxes</span>
                  <span>₹{(selectedTotal * 0.05).toFixed(2)}</span>
                </div> */}
                <div className="h-px bg-gray-100 dark:bg-gray-700 my-4" />
                <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                  <span>Total</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <Link href={selectedItems.size > 0 ? "/checkout" : "#"} className="block w-full">
                <button
                  disabled={effectiveSelected.size === 0 || !userCoordinates}
                  className="w-full bg-yellow-500 text-white font-bold py-4 rounded-xl hover:bg-yellow-600 transition-colors shadow-lg shadow-yellow-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={
                    effectiveSelected.size === 0
                      ? "Please select at least one product"
                      : !userCoordinates
                        ? "Add your location to continue"
                        : ""
                  }
                >
                  Proceed to Checkout <ArrowRight size={20} />
                </button>
              </Link>

              <div className="mt-4 text-center">
                <Link
                  href="/"
                  className="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 underline"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
            <ShoppingBag
              size={48}
              className="text-gray-300 dark:text-gray-600"
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Your cart is empty
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-center max-w-sm">
            Looks like you haven&#39;t added anything to your cart yet. Explore
            our fresh categories!
          </p>
          <Link href="/">
            <button className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold py-3 px-8 rounded-full hover:opacity-90 transition-opacity">
              Start Shopping
            </button>
          </Link>
        </motion.div>
      )}
    </div>
  );
}

type ItemProps = CartItem & {
  isSelected: boolean;
  onToggleSelect: () => void;
  availability?: {
    selectable: boolean;
    reason?: string;
    distanceKm?: number;
    deliveryFee: number;
    minOrder: number;
    meetsMin: boolean;
    inRange: boolean;
    shopName?: string;
  };
};

const ItemsList = (item: ItemProps) => {
  const { removeFromCart, updateQuantity } = useCartStore();
  const availability = item.availability ?? {
    selectable: true,
    deliveryFee: 0,
    minOrder: 0,
    meetsMin: true,
    inRange: true,
  };

  const containerState = availability.selectable && item.isSelected;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`rounded-2xl p-4 shadow-sm border flex gap-4 transition-all ${containerState
        ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700"
        : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700"
        } ${availability.selectable ? "" : "opacity-70"}`}
    >
      {/* Checkbox */}
      <div className="flex items-center justify-center">
        <input
          type="checkbox"
          checked={item.isSelected}
          onChange={item.onToggleSelect}
          className="w-5 h-5 rounded cursor-pointer"
          disabled={!availability.selectable}
        />
      </div>

      {/* Product Image */}
      <div className="relative w-24 h-24 md:w-32 md:h-32 shrink-0 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden">
        {item.product.image ? (
          <Image
            src={item.product.image}
            alt={item.product.name}
            layout="fill"
            objectFit="cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <ShoppingBag size={24} />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mr-2">
                {item.product.name}
              </h3>
              <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400">
                {availability.distanceKm !== undefined && (
                  <span>Distance: {availability.distanceKm.toFixed(1)} km</span>
                )}
                <span>Delivery: ₹{availability.deliveryFee.toFixed(2)}</span>
                {availability.minOrder > 0 && (
                  <span>Min order: ₹{availability.minOrder.toFixed(0)}</span>
                )}
              </div>
              {availability.reason && (
                <p className="text-sm text-red-500">{availability.reason}</p>
              )}
            </div>
            <button
              onClick={() => removeFromCart(item.id)}
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
            >
              <Trash2 size={18} />
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Price: ₹{item.product.price.toFixed(2)}
          </p>
        </div>

        <div className="flex items-center justify-between mt-4">
          {/* Quantity Controls */}
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-full p-1">
            <button
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-gray-700 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              disabled={item.quantity <= 1}
            >
              <Minus size={14} />
            </button>
            <span className="font-semibold w-6 text-center text-gray-900 dark:text-white">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-gray-700 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>

          <span
            className={`text-lg font-bold ${item.isSelected ? "text-yellow-600 dark:text-yellow-400" : "text-gray-900 dark:text-white"
              }`}
          >
            ₹{(item.product.price * item.quantity).toFixed(2)}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
