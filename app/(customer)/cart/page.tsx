"use client";

import { useEffect, useState, useMemo } from "react";
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

export default function CartPage() {
  const router = useRouter(); // Initialize router
  const { items, fetchCart } = useCartStore();
  const [selectedItems, setSelectedItems] = useState<Set<string | number>>(new Set());

  console.log("Cart Items:", items);
  useEffect(() => {
    if (items.length <= 0) fetchCart();
  }, [fetchCart, items.length]);

  // Calculate total for selected items
  const selectedTotal = useMemo(() => {
    return items
      .filter((item) => selectedItems.has(item.id))
      .reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [items, selectedItems]);

  // Toggle item selection
  const toggleItemSelection = (itemId: string | number) => {
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
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map((item) => item.id)));
    }
  };

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

      {items.length > 0 ? (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items List */}
          <div className="flex-1 space-y-4">
            {/* Select All Checkbox */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
              <input
                type="checkbox"
                checked={selectedItems.size === items.length && items.length > 0}
                onChange={toggleSelectAll}
                className="w-5 h-5 rounded cursor-pointer"
              />
              <label className="cursor-pointer text-sm font-semibold text-gray-700 dark:text-gray-300">
                {selectedItems.size === items.length && items.length > 0
                  ? "Deselect All"
                  : "Select All"}
              </label>
            </div>

            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <ItemsList
                  key={item.id}
                  {...item}
                  isSelected={selectedItems.has(item.id)}
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
                  <span>Selected Items ({selectedItems.size})</span>
                  <span>₹{selectedTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Delivery Fee</span>
                  <span className="text-green-500 font-medium">Free</span>
                </div>
                {/* <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Taxes</span>
                  <span>₹{(selectedTotal * 0.05).toFixed(2)}</span>
                </div> */}
                <div className="h-px bg-gray-100 dark:bg-gray-700 my-4" />
                <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                  <span>Total</span>
                  <span>₹{selectedTotal.toFixed(2)}</span>
                </div>
              </div>

              <Link href={selectedItems.size > 0 ? "/checkout" : "#"} className="block w-full">
                <button
                  disabled={selectedItems.size === 0}
                  className="w-full bg-yellow-500 text-white font-bold py-4 rounded-xl hover:bg-yellow-600 transition-colors shadow-lg shadow-yellow-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={selectedItems.size === 0 ? "Please select at least one product" : ""}
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

const ItemsList = (item: CartItem & { isSelected: boolean; onToggleSelect: () => void }) => {
  const { removeFromCart, updateQuantity } = useCartStore();
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`rounded-2xl p-4 shadow-sm border flex gap-4 transition-all ${item.isSelected
          ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700"
          : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700"
        }`}
    >
      {/* Checkbox */}
      <div className="flex items-center justify-center">
        <input
          type="checkbox"
          checked={item.isSelected}
          onChange={item.onToggleSelect}
          className="w-5 h-5 rounded cursor-pointer"
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
            <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mr-2">
              {item.product.name}
            </h3>
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

          <span className={`text-lg font-bold ${item.isSelected ? "text-yellow-600 dark:text-yellow-400" : "text-gray-900 dark:text-white"}`}>
            ₹{(item.product.price * item.quantity).toFixed(2)}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
