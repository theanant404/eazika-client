"use client";
import { isAxiosError } from "@/lib/axios";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Plus,
  CheckCircle,
  CreditCard,
  Loader2,
  Truck,
  AlertCircle,
} from "lucide-react";
import { useCartStore, userStore } from "@/store";
import { AddAddressFrom, AddressList } from "@/components/customer/checkout";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CheckoutPage() {
  const { items, fetchCart, cartTotalAmount, placeOrder } = useCartStore();
  const { addresses, fetchUser } = userStore();

  const router = useRouter();

  // isLoading: isOrderLoading,
  const [isLoading, setIsLoading] = useState(true);
  const [isShowingAddAddress, setIsShowingAddAddress] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null
  );
  const [isOrderLoading, setIsOrderLoading] = useState(false);

  // Helper function to calculate distance between two coordinates
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Validate delivery availability for all cart items
  const deliveryValidation = useMemo(() => {
    if (!selectedAddressId) {
      return { isValid: false, unavailableItems: [], reasons: [] };
    }

    const selectedAddress = addresses.find(
      (addr) => Number(addr.id) === selectedAddressId
    );

    if (!selectedAddress || !selectedAddress.geoLocation) {
      return { 
        isValid: false, 
        unavailableItems: [], 
        reasons: ["Selected address doesn't have geo location"] 
      };
    }

    const [userLat, userLng] = selectedAddress.geoLocation
      .split(",")
      .map((coord) => parseFloat(coord.trim()));

    if (!Number.isFinite(userLat) || !Number.isFinite(userLng)) {
      return { 
        isValid: false, 
        unavailableItems: [], 
        reasons: ["Invalid geo location format"] 
      };
    }

    const unavailableItems: Array<{
      productName: string;
      shopName: string;
      reason: string;
      distance?: number;
    }> = [];

    items.forEach((item) => {
      const shop = (item as any).shop;
      if (!shop) {
        unavailableItems.push({
          productName: item.product.name,
          shopName: "Unknown Shop",
          reason: "Shop information not available",
        });
        return;
      }

      // Get shop coordinates
      let shopLat: number | undefined;
      let shopLng: number | undefined;

      if (shop.address?.geoLocation) {
        const coords = shop.address.geoLocation.split(",").map((c: string) => parseFloat(c.trim()));
        shopLat = coords[0];
        shopLng = coords[1];
      } else if (shop.address?.latitude && shop.address?.longitude) {
        shopLat = parseFloat(shop.address.latitude);
        shopLng = parseFloat(shop.address.longitude);
      }

      if (!Number.isFinite(shopLat) || !Number.isFinite(shopLng)) {
        unavailableItems.push({
          productName: item.product.name,
          shopName: shop.name || "Unknown Shop",
          reason: "Shop location not available",
        });
        return;
      }

      // Calculate distance
      const distance = calculateDistance(userLat, userLng, shopLat!, shopLng!);

      // Check delivery rates
      const deliveryRates = (shop.deliveryRates?.rates || shop.deliveryRates || []) as Array<{
        km: number;
        price: number;
      }>;

      if (!Array.isArray(deliveryRates) || deliveryRates.length === 0) {
        // No delivery rates means free delivery everywhere
        return;
      }

      // Find if delivery is available for this distance
      const sortedRates = [...deliveryRates].sort((a, b) => a.km - b.km);
      const matchedRate = sortedRates.find((rate) => distance <= rate.km);

      if (!matchedRate) {
        unavailableItems.push({
          productName: item.product.name,
          shopName: shop.name || "Unknown Shop",
          reason: `Outside delivery range (${distance.toFixed(1)} km away, max delivery: ${sortedRates[sortedRates.length - 1]?.km || 0} km)`,
          distance,
        });
      }
    });

    return {
      isValid: unavailableItems.length === 0,
      unavailableItems,
      reasons: unavailableItems.map((item) => item.reason),
    };
  }, [selectedAddressId, addresses, items]);

  // Location State

  useEffect(() => {
    (async () => {
      if (addresses.length <= 0) {
        await fetchUser();
      }
      if (items.length === 0) {
        await fetchCart();
        // selectedAddressId(Number(addresses[0]?.id));
      }
      setIsLoading(false);
    })();
  }, [fetchCart, fetchUser, addresses.length, items.length]);

  const handlePlaceOrder = async () => {
    setIsOrderLoading(true);
    if (!selectedAddressId) {
      toast.error("Please select a delivery address");
      setIsOrderLoading(false);
      return;
    }

    if (!deliveryValidation.isValid) {
      toast.error("Some items cannot be delivered to your address");
      setIsOrderLoading(false);
      return;
    }

    try {
      await placeOrder({
        addressId: selectedAddressId,
        paymentMethod: "cash_on_delivery",
        orderItems: items.map((item) => ({
          productId: item.productId,
          priceId: item.priceId,
          quantity: item.quantity,
        })),
      });

      toast.success("Order placed successfully!");
      setTimeout(() => router.push("/orders"), 1500);
    } catch (error) {
      if (isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ||
          "Failed to place order. Please try again."
        );
      } else if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsOrderLoading(false);
    }
  };

  if (items.length === 0) {
    if (isLoading) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
          <Loader2 className="animate-spin text-gray-800 dark:text-white" />
        </div>
      );
    }
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Your cart is empty
        </h2>
        <button
          onClick={() => router.push("/")}
          className="text-yellow-600 font-semibold"
        >
          Go Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-800 dark:text-white" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Checkout
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* --- LEFT COLUMN: Address & Payment --- */}
          <div className="flex-1 space-y-6">
            {/* 1.a Delivery Address Section */}
            <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <MapPin className="text-yellow-500" size={20} />
                  Delivery Address
                </h2>
                {isShowingAddAddress && (
                  <button
                    onClick={() => setIsShowingAddAddress(false)}
                    className="text-sm font-semibold text-yellow-600 hover:text-yellow-700 flex items-center gap-1"
                  >
                    <Plus size={16} /> Add New
                  </button>
                )}
              </div>

              {/* Address List */}

              {isShowingAddAddress ? (
                <AddressList
                  selectedAddressId={selectedAddressId}
                  setSelectedAddressId={setSelectedAddressId}
                />
              ) : (
                <AddAddressFrom
                  setIsShowingAddAddress={setIsShowingAddAddress}
                  setSelectedAddressId={setSelectedAddressId}
                />
              )}
            </section>

            {/* Delivery Validation Message */}
            {selectedAddressId && !deliveryValidation.isValid && (
              <section className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl shadow-sm border-2 border-red-200 dark:border-red-700">
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" size={24} />
                  <div>
                    <h3 className="text-lg font-bold text-red-900 dark:text-red-100">
                      Delivery Not Available
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      Some items in your cart cannot be delivered to your selected address
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {deliveryValidation.unavailableItems.map((item, index) => (
                    <div
                      key={index}
                      className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-red-200 dark:border-red-700"
                    >
                      <p className="font-semibold text-gray-900 dark:text-white mb-1">
                        {item.productName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        from {item.shopName}
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                        ⚠️ {item.reason}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-700">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    💡 <strong>Suggestion:</strong> Try selecting a different delivery address or remove unavailable items from your cart.
                  </p>
                </div>
              </section>
            )}

            {/* 2. Payment Method Section */}
            <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <CreditCard className="text-yellow-500" size={20} />
                Payment Method
              </h2>
              <div className="space-y-3">
                <div className="p-4 rounded-xl border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-500/10 flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Truck className="text-yellow-600 dark:text-yellow-400" />
                    <span className="font-bold text-gray-900 dark:text-white">
                      Cash on Delivery
                    </span>
                  </div>
                  <CheckCircle className="text-yellow-500 fill-current" />
                </div>
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed flex items-center justify-between">
                  <span className="font-medium text-gray-500">
                    Online Payment (Coming Soon)
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* --- RIGHT COLUMN: Summary --- */}
          <div className="lg:w-96">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Order Summary
              </h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Items ({items.length})</span>
                  <span>₹{cartTotalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Delivery</span>
                  <span className="text-green-500 font-medium">Free</span>
                </div>
                <div className="h-px bg-gray-100 dark:bg-gray-700 my-4" />
                <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white">
                  <span>Total</span>
                  <span>₹{cartTotalAmount.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={isOrderLoading || !selectedAddressId || !deliveryValidation.isValid}
                className={cn(
                  "w-full bg-yellow-500 text-white font-bold py-4 rounded-xl hover:bg-yellow-600 transition-colors shadow-lg shadow-yellow-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
                  isOrderLoading || !selectedAddressId || !deliveryValidation.isValid
                    ? "cursor-not-allowed"
                    : "cursor-pointer"
                )}
                title={
                  !selectedAddressId
                    ? "Please select a delivery address"
                    : !deliveryValidation.isValid
                    ? "Some items cannot be delivered to your address"
                    : ""
                }
              >
                {isOrderLoading ? (
                  <span className="flex justify-center items-center gap-1.5">
                    <Loader2 className="animate-spin" size={20} />
                    {"Placing Order..."}
                  </span>
                ) : (
                  "Place Order"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
