"use client";
import { isAxiosError } from "@/lib/axios";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Plus,
  CheckCircle,
  CreditCard,
  Loader2,
  Truck,
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
                disabled={isOrderLoading || !selectedAddressId}
                className={cn(
                  "w-full bg-yellow-500 text-white font-bold py-4 rounded-xl hover:bg-yellow-600 transition-colors shadow-lg shadow-yellow-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
                  isOrderLoading || !selectedAddressId
                    ? "cursor-not-allowed"
                    : "cursor-pointer"
                )}
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
