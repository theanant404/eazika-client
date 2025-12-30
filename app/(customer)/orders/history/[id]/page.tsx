"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  CheckCircle,
  Package,
  HelpCircle,
  Truck,
  Printer,
} from "lucide-react";
import { cartMethods } from "@/services/customerService";
import Image from "next/image";

export interface Order {
  id: number;
  userId: number;
  assignedDeliveryBoyId?: number;
  totalProducts: number;
  totalAmount: number;
  addressId: number;
  paymentMethod: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  cancelBy?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
  orderItems: OrderItem[];
  address?: OrderAddress;
  deliveryBoy?: DeliveryBoy;
}

export interface OrderAddress {
  id: number;
  userId: number;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  street?: string;
  country?: string;
  state?: string;
  city?: string;
  pinCode?: string;
}

export interface GlobalProduct {
  id: number;
  productCategoryId: number;
  brand?: string | null;
  name?: string | null;
  description?: string | null;
  images: string[];
  isActive: boolean;
}

export interface ProductCategory {
  id: number;
  name: string;
  description?: string;
}

export interface Product {
  id: number;
  shopkeeperId: number;
  productCategoryId: number;
  globalProductId: number;
  isGlobalProduct: boolean;
  brand: string | null;
  name: string | null;
  description: string | null;
  images: string[];
  priceIds: number[];
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  globalProduct?: GlobalProduct;
  productCategories?: ProductCategory;
}

export interface PriceDetails {
  id: number;
  price: number;
  discount?: number;
  weight: number;
  stock: number;
  unit: string;
  currency: string;
  globalProductId?: number | null;
  shopProductId?: number;
}

export interface OrderItem {
  id: number;
  productId: number;
  priceId: number;
  price: number;
  weight: number;
  unit: string;
  quantity: number;
  orderId: number;
  shopProductId?: number;
  product?: Product;
  priceDetails?: PriceDetails;
}

export interface DeliveryBoy {
  id: number;
  userId: number;
  shopkeeperId: number;
  aadharNumber?: string;
  panNumber?: string;
  licenseNumber?: string;
  licenseImage?: string[];
  vehicleOwnerName?: string;
  vehicleName?: string;
  vehicleNo?: string;
  currentLat?: number;
  currentLng?: number;
  isAvailable?: boolean;
  isVerified?: boolean;
  lastLocationUpdate?: string;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id: number;
    name: string;
    phone: string;
    email?: string | null;
    image?: string | null;
  };
}
export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Number(params?.id);

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Ref for the printable content
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrderDetails = async () => {
      try {
        const data = await cartMethods.getOrderById(orderId);
        setOrder(data as Order);
      } catch (error) {
        console.error("Failed to fetch order details", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const handleDownloadInvoice = () => {
    window.print();
  };
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 space-y-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          Order not found
        </h2>
        <button
          onClick={() => router.back()}
          className="text-yellow-600 font-semibold"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 print:bg-white print:pb-0">
      {/* Header - Hidden during print */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 py-4 flex items-center gap-3 print:hidden">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-800 dark:text-white" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Order Details
        </h1>
      </div>

      {/* Printable Content Wrapper */}
      <div
        ref={invoiceRef}
        className="max-w-3xl mx-auto p-4 space-y-6 print:p-0 print:max-w-none"
      >
        {/* Invoice Header - Visible only in Print */}
        <div className="hidden print:block mb-8 border-b pb-4">
          <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
          <p className="text-gray-500">Order #{order.id}</p>
          <p className="text-gray-500">
            Date: {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center space-y-3 print:shadow-none print:border-none print:items-start print:text-left print:p-0">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 print:hidden">
            <CheckCircle size={32} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white capitalize print:text-xl">
              Order {order.status}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              On {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium bg-gray-100 dark:bg-gray-700/50 px-3 py-1.5 rounded-full text-gray-600 dark:text-gray-300 print:hidden">
            <Truck size={12} /> Order ID: #{order.id}
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden print:shadow-none print:border print:border-gray-300 print:rounded-none">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2 print:bg-gray-50">
            <Package size={18} className="text-yellow-500 print:hidden" />
            <h3 className="font-bold text-gray-900 dark:text-white">
              Items ({order.totalProducts})
            </h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {order.orderItems.map((item) => {
              const product = item.product;
              const globalProduct = product?.globalProduct;
              const displayName =
                product?.name || globalProduct?.name || globalProduct?.brand ||
                `Product #${item.productId}`;
              const displayImage =
                product?.images?.[0] || globalProduct?.images?.[0] || "";
              const displayUnit = item.unit || item.priceDetails?.unit;
              const displayWeight = item.weight || item.priceDetails?.weight;
              const displayPrice = item.priceDetails?.price ?? item.price ?? 0;

              return (
                <div key={item.id} className="p-4 flex gap-4">
                  <div className="relative w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-xl shrink-0 overflow-hidden print:hidden">
                    {displayImage ? (
                      <Image
                        src={displayImage}
                        alt={displayName || "Product"}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        N/A
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                      {displayName}
                    </h4>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 space-y-1">
                      <p>
                        Qty: {item.quantity}
                        {displayWeight && displayUnit
                          ? ` • ${displayWeight}${displayUnit}`
                          : ""}
                      </p>
                      {globalProduct?.brand ? (
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">
                          Brand: {globalProduct.brand}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      ₹{(displayPrice * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-8">
          {/* Shipping Address */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 print:shadow-none print:border print:border-gray-300 print:rounded-none">
            <div className="flex items-center gap-2 mb-3 text-gray-500 dark:text-gray-400 text-sm font-medium">
              <MapPin size={16} className="print:hidden" /> Shipping Address
            </div>
            <div className="space-y-1 text-sm text-gray-900 dark:text-white font-medium">
              <p>
                {order.address?.name || "Customer"}
                {order.address?.phone ? ` • ${order.address.phone}` : ""}
              </p>
              <p className="text-gray-700 dark:text-gray-200 font-normal leading-relaxed">
                {[order.address?.line1, order.address?.line2, order.address?.street]
                  .filter(Boolean)
                  .join(", ") || "Address unavailable"}
              </p>
              <p className="text-gray-700 dark:text-gray-200 font-normal leading-relaxed">
                {[order.address?.city, order.address?.state, order.address?.country]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              {order.address?.pinCode ? (
                <p className="text-gray-700 dark:text-gray-200 font-normal">PIN: {order.address.pinCode}</p>
              ) : null}
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 print:shadow-none print:border print:border-gray-300 print:rounded-none">
            <div className="flex items-center gap-2 mb-3 text-gray-500 dark:text-gray-400 text-sm font-medium">
              <CreditCard size={16} className="print:hidden" /> Payment Details
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Method</span>
                <span className="font-medium text-gray-900 dark:text-white capitalize">
                  {order.paymentMethod.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Status</span>
                <span className="font-medium text-gray-900 dark:text-white capitalize">
                  {order.status}
                </span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t dark:border-gray-700">
                <span className="text-gray-800 dark:text-gray-200 font-bold">
                  Total Amount
                </span>
                <span className="font-bold text-green-600 dark:text-green-400 text-lg">
                  ₹{order.totalAmount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Partner */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 print:shadow-none print:border print:border-gray-300 print:rounded-none">
          <div className="flex items-center gap-2 mb-3 text-gray-500 dark:text-gray-400 text-sm font-medium">
            <Truck size={16} className="print:hidden" /> Delivery Partner
          </div>
          {order.deliveryBoy ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Name</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {order.deliveryBoy.user?.name?.trim() || "Assigned Rider"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Phone</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {order.deliveryBoy.user?.phone || "N/A"}
                </span>
              </div>
              {order.deliveryBoy.vehicleNo ? (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Vehicle</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {order.deliveryBoy.vehicleName || ""}
                    {order.deliveryBoy.vehicleNo
                      ? ` • ${order.deliveryBoy.vehicleNo}`
                      : ""}
                  </span>
                </div>
              ) : null}
              {order.deliveryBoy.lastLocationUpdate ? (
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Last update</span>
                  <span>
                    {new Date(order.deliveryBoy.lastLocationUpdate).toLocaleString()}
                  </span>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">Rider not assigned yet.</p>
          )}
        </div>

        {/* Footer Message - Print Only */}
        <div className="hidden print:block text-center text-xs text-gray-500 mt-8 pt-8 border-t">
          <p>Thank you for shopping with Eazika!</p>
          <p>For support, visit eazika.com/support</p>
        </div>

        {/* Actions - Hidden during print */}
        <div className="space-y-3 pt-4 print:hidden">
          <button
            onClick={handleDownloadInvoice}
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Printer size={18} /> Print / Download Invoice
          </button>
          <button className="w-full text-gray-500 dark:text-gray-400 py-2 text-sm flex items-center justify-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
            <HelpCircle size={14} /> Need help with this order?
          </button>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 20mm;
          }
          body {
            background: white;
            color: black;
          }
          /* Hide global layout elements */
          nav,
          header,
          footer,
          .fixed,
          .sticky {
            display: none !important;
          }
          /* Reset text colors for print */
          * {
            color: black !important;
            text-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
