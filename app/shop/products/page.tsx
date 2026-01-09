"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, Plus, Package, Globe, Box, Check, Loader2, X, Save, Edit2, Edit, Ban } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { shopStore } from "@/store";
import { ProductForm } from "@/components/shop/ProductForm";
import { shopService, type UpdateProductPayload } from "@/services/shopService";
import type { ShopProduct } from "@/types/shop";
import { toast } from "sonner";
import type { NewProductFormData, ProductPriceType } from "@/types/shop";
import PriceForm from "../../components/priceForm";

interface Tab {
  id: "inventory" | "global" | "my_products";
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  description: string;
}

const TABS: Tab[] = [
  {
    id: "inventory",
    label: "Inventory",
    icon: Box,
    description: "Manage stock & visibility",
  },
  {
    id: "global",
    label: "Global Catalog",
    icon: Globe,
    description: "Import verified products",
  },
  {
    id: "my_products",
    label: "My Products",
    icon: Package,
    description: "Your custom items",
  },
];

export default function ProductsPage() {
  const { products, globalProducts, fetchProducts, featchGlobalProducts } = shopStore();
  // console.log('Global Products line 45', globalProducts)
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "inventory" | "global" | "my_products"
  >("inventory");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    inventory: ShopProduct[];
    global: ShopProduct[];
    myProducts: ShopProduct[];
  }>({
    inventory: [],
    global: [],
    myProducts: [],
  });
  const [hasSearched, setHasSearched] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editInitialData, setEditInitialData] = useState<
    (NewProductFormData & { categoryName?: string }) | null
  >(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingIsGlobal, setEditingIsGlobal] = useState<boolean>(false);
  const [editablePricing, setEditablePricing] = useState<Record<number, ProductPriceType[]>>({});
  const [originalPricing, setOriginalPricing] = useState<Record<number, ProductPriceType[]>>({});
  const [dirtyProductIds, setDirtyProductIds] = useState<Set<number>>(new Set());
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [exitPromptOpen, setExitPromptOpen] = useState(false);
  const [pendingNav, setPendingNav] = useState<(() => void) | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedGlobalProduct, setSelectedGlobalProduct] = useState<null | (typeof globalProductList)[number]>(null);
  const [inventoryLoadingMore, setInventoryLoadingMore] = useState(false);
  const [globalLoadingMore, setGlobalLoadingMore] = useState(false);
  const [activityModalProduct, setActivityModalProduct] = useState<null | { id: number; name: string; isActive: boolean }>(null);
  const [activityLoading, setActivityLoading] = useState(false);

  const FALLBACK_PRICE: ProductPriceType = {
    price: 0,
    discount: 0,
    weight: 0,
    stock: 0,
    unit: "grams",
  };

  const productList: ShopProduct[] = (products?.products as ShopProduct[]) ?? [];
  const globalProductList: ShopProduct[] = (globalProducts?.products as ShopProduct[]) ?? [];
  const inventoryPagination = products?.pagination ?? {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0,
  };
  const globalPagination = globalProducts?.pagination ?? {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0,
  };
  const normalizePageNumber = (value: number | string | undefined, fallback = 1) => {
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return fallback;
    return parsed;
  };
  const inventoryCurrentPage = normalizePageNumber(inventoryPagination.currentPage);
  const globalCurrentPage = normalizePageNumber(globalPagination.currentPage);
  const inventoryTotalPages = normalizePageNumber(inventoryPagination.totalPages, 0);
  const globalTotalPages = normalizePageNumber(globalPagination.totalPages, 0);
  const inventoryHasMore = inventoryTotalPages === 0 ? true : inventoryCurrentPage < inventoryTotalPages;
  const globalHasMore = globalTotalPages === 0 ? true : globalCurrentPage < globalTotalPages;
  // console.log("Global Products in component:", globalProducts);

  const normalizePricing = (value: unknown): ProductPriceType[] => {
    if (!value || typeof value !== "object") return [{ ...FALLBACK_PRICE }];
    const source = value as { pricing?: unknown; prices?: unknown };

    const fromPricing = Array.isArray(source.pricing)
      ? source.pricing
      : undefined;
    const fromPrices = Array.isArray(source.prices) ? source.prices : undefined;

    const list = (fromPricing ?? fromPrices) as
      | Array<Partial<ProductPriceType>>
      | undefined;

    if (!list || list.length === 0) return [{ ...FALLBACK_PRICE }];

    return list.map((p) => ({
      id: (p as { id?: number }).id,
      price: p.price ?? 0,
      discount: p.discount ?? 0,
      weight: p.weight ?? 0,
      stock: p.stock ?? 0,
      unit: p.unit ?? "grams",
    }));
  };

  // initialize editable pricing when products change
  useEffect(() => {
    const map: Record<number, ProductPriceType[]> = {};
    const originals: Record<number, ProductPriceType[]> = {};
    productList.forEach((p) => {
      const pricing = normalizePricing(p);
      if (p.id !== undefined && p.id !== null) {
        map[Number(p.id)] = pricing;
        originals[Number(p.id)] = pricing;
      }
    });
    setEditablePricing(map);
    setOriginalPricing(originals);
    // reset dirty flags when list refreshes
    setDirtyProductIds(new Set());
    setUnsavedChanges(false);
  }, [productList]);

  // warn on browser/tab close when there are unsaved inline edits
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!unsavedChanges) return;
      e.preventDefault();
      e.returnValue = "You have unsaved changes.";
    };
    if (unsavedChanges) {
      window.addEventListener("beforeunload", handler);
    }
    return () => window.removeEventListener("beforeunload", handler);
  }, [unsavedChanges]);

  useEffect(() => {
    (async () => {
      if (productList.length === 0)
        await fetchProducts(1, inventoryPagination.itemsPerPage || 10, false);
      if (globalProductList.length === 0)
        await featchGlobalProducts(1, globalPagination.itemsPerPage || 10, false);
    })();
  }, []);

  // Debounced search effect
  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      if (searchQuery.trim() === "") {
        setSearchResults({ inventory: [], global: [], myProducts: [] });
        setHasSearched(false);
        return;
      }

      try {
        setSearchLoading(true);
        setHasSearched(true);

        // Make API calls for all tabs
        const [inventoryRes, globalRes] = await Promise.all([
          shopService.searchShopProducts(searchQuery, 1, 50),
          shopService.searchGlobalProducts(searchQuery, 1, 50),
        ]);

        // Filter my products from inventory results
        const myProducts = inventoryRes.products?.filter(
          (p: ShopProduct) => p.isGlobalProduct !== true && p.isActive !== false
        ) || [];

        setSearchResults({
          inventory: inventoryRes.products || [],
          global: globalRes.products || [],
          myProducts: myProducts,
        });
      } catch (error) {
        console.error("Search failed:", error);
        toast.error("Search failed. Please try again.");
        setSearchResults({ inventory: [], global: [], myProducts: [] });
      } finally {
        setSearchLoading(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const loadInventoryPage = useCallback(async (page: number) => {
    setInventoryLoadingMore(true);
    try {
      await fetchProducts(page, inventoryPagination.itemsPerPage || 10, false);
    } finally {
      setInventoryLoadingMore(false);
    }
  }, [fetchProducts, inventoryPagination.itemsPerPage]);

  const loadGlobalPage = useCallback(async (page: number) => {
    setGlobalLoadingMore(true);
    try {
      await featchGlobalProducts(page, globalPagination.itemsPerPage || 10, false);
    } finally {
      setGlobalLoadingMore(false);
    }
  }, [featchGlobalProducts, globalPagination.itemsPerPage]);

  const openEditModal = async (id: number | string) => {
    const numericId = Number(id);
    if (!numericId) return;

    setIsEditOpen(true);
    setEditLoading(true);
    setEditingId(numericId);

    const productFromStore = productList.find((p) => Number(p.id) === numericId);
    if (productFromStore) {
      setEditingIsGlobal(((productFromStore as any).isGlobalProduct === true) || ((productFromStore as any).isGlobal === true));
      const pricing = normalizePricing(productFromStore);

      setEditInitialData({
        productCategoryId:
          (productFromStore as { productCategoryId?: number }).productCategoryId ?? 0,
        categoryName: (productFromStore as { category?: string }).category,
        name: productFromStore.name ?? "",
        brand: (productFromStore as { brand?: string }).brand ?? "",
        description: productFromStore.description ?? "",
        images: productFromStore.images ?? [],
        pricing,
      });
      setEditLoading(false);
      return;
    }

    try {
      const product = await shopService.getProductById(numericId);
      setEditingIsGlobal(((product as any).isGlobalProduct === true) || ((product as any).isGlobal === true));

      const pricing = normalizePricing(product);

      setEditInitialData({
        productCategoryId: (product as { productCategoryId?: number }).productCategoryId ?? 0,
        categoryName: (product as { category?: string }).category,
        name: product?.name ?? "",
        brand: (product as { brand?: string }).brand ?? "",
        description: product?.description ?? "",
        images: product?.images ?? [],
        pricing,
      });
    } catch (error) {
      console.error("Failed to load product", error);
      toast.error("Failed to load product");
      setIsEditOpen(false);
    } finally {
      setEditLoading(false);
    }
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    setEditInitialData(null);
    setEditingId(null);
    setEditingIsGlobal(false);
  };

  const handlePricingChange = <K extends keyof ProductPriceType>(
    productId: number,
    index: number,
    key: K,
    value: ProductPriceType[K]
  ) => {
    setEditablePricing((prev) => {
      const current = prev[productId] ?? [];
      const updated = current.map((row, i) => (i === index ? { ...row, [key]: value } : row));
      return { ...prev, [productId]: updated };
    });
    setDirtyProductIds((prev) => new Set(prev).add(productId));
    setUnsavedChanges(true);
  };

  const savePricing = async (productId: number) => {
    const pricing = editablePricing[productId];
    const original = originalPricing[productId] ?? [];
    if (!pricing) return;

    const isSameRow = (a: ProductPriceType, b: ProductPriceType) =>
      a.price === b.price &&
      (a.discount ?? 0) === (b.discount ?? 0) &&
      a.weight === b.weight &&
      a.unit === b.unit &&
      a.stock === b.stock;

    const findOriginalFor = (row: ProductPriceType, index: number) => {
      if (row.id !== undefined) {
        return original.find((o) => o.id === row.id) ?? original[index];
      }
      return original[index];
    };

    const changedPrices = pricing.filter((row, index) => {
      const base = findOriginalFor(row, index);
      if (!base) return true;
      return !isSameRow(row, base);
    });

    const stockChanged = pricing[0]?.stock !== original[0]?.stock;

    if (changedPrices.length === 0 && !stockChanged) {
      setDirtyProductIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        setUnsavedChanges(next.size > 0);
        return next;
      });
      return;
    }

    try {
      const payload: Partial<UpdateProductPayload> = {};
      if (changedPrices.length > 0) payload.prices = changedPrices;
      if (stockChanged) payload.stock = pricing[0]?.stock ?? 0;

      await shopService.updateStock(payload);
      await fetchProducts();
      setDirtyProductIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        setUnsavedChanges(next.size > 0);
        return next;
      });
      toast.success("Pricing updated");
    } catch (error) {
      console.error("Failed to update pricing", error);
      toast.error("Failed to update pricing");
    }
  };

  const handleExitDecision = async (decision: "save" | "discard" | "cancel") => {
    if (decision === "cancel") {
      setExitPromptOpen(false);
      setPendingNav(null);
      return;
    }

    if (decision === "discard") {
      setDirtyProductIds(new Set());
      setUnsavedChanges(false);
      setExitPromptOpen(false);
      const action = pendingNav;
      setPendingNav(null);
      action?.();
      return;
    }

    const ids = Array.from(dirtyProductIds);
    for (const id of ids) {
      // Save sequentially to keep toast order predictable
      await savePricing(id);
    }
    setExitPromptOpen(false);
    const action = pendingNav;
    setPendingNav(null);
    action?.();
  };

  const attemptNavigate = (action: () => void) => {
    if (!unsavedChanges) {
      action();
      return;
    }
    setPendingNav(() => action);
    setExitPromptOpen(true);
  };

  // Filter products based on active tab and search query
  // Use API search results if search is active, otherwise use local filtering
  const filteredInventoryProducts = hasSearched
    ? searchResults.inventory
    : productList.filter((p) => {
      const name = (p as { name?: string })?.name || "";
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

  const filteredGlobalProducts = hasSearched
    ? searchResults.global
    : globalProductList.filter((p) => {
      const name = (p as { name?: string })?.name || "";
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

  const filteredMyProducts = hasSearched
    ? searchResults.myProducts
    : productList
      .filter((p) => p.isGlobalProduct !== true && p.isActive !== false)
      .filter((p) => {
        const name = (p as { name?: string })?.name || "";
        return name.toLowerCase().includes(searchQuery.toLowerCase());
      });

  // Use the appropriate filtered list based on active tab
  const filteredProducts =
    activeTab === "inventory"
      ? filteredInventoryProducts
      : activeTab === "global"
        ? filteredGlobalProducts
        : filteredMyProducts;

  const handleAddProductFromGlobalProducts = (product: (typeof globalProductList)[number]) => {
    setSelectedGlobalProduct(product);
    setAddModalOpen(true);
  };
  return (
    <div className="space-y-6 pb-24 md:pb-8 w-full overflow-x-hidden px-3 sm:px-4 md:px-6  md:pt-0">
      <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate">
            Products
          </h1>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your store inventory
          </p>
        </div>
        <button
          onClick={() => attemptNavigate(() => router.push("/shop/products/new"))}
          className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 text-white px-4 sm:px-6 py-3 sm:py-3.5 rounded-xl font-bold shadow-lg shadow-yellow-500/20 transition-transform active:scale-95 flex items-center justify-center gap-2 text-sm whitespace-nowrap"
        >
          <Plus size={18} /> Add New Product
        </button>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-1 sm:gap-4">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                attemptNavigate(() => {
                  setActiveTab(tab.id);
                  setSearchQuery(""); // Clear search when switching tabs
                });
              }}
              className={`flex flex-col items-center sm:items-start p-1.5 sm:p-5 rounded-lg sm:rounded-2xl border-2 transition-all text-center sm:text-left relative overflow-hidden group min-h-[80px] sm:min-h-[140px] ${isActive
                ? "bg-gray-900 dark:bg-white border-gray-900 dark:border-white text-white dark:text-gray-900 shadow-lg"
                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
            >
              <div
                className={`p-1 sm:p-3 rounded-lg sm:rounded-xl mb-0.5 sm:mb-3 transition-colors ${isActive
                  ? "bg-white/20 text-white dark:bg-gray-900/10 dark:text-gray-900"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  }`}
              >
                <Icon size={14} className="sm:block hidden sm:w-5 sm:h-5" />
                <Icon size={12} className="block sm:hidden" />
              </div>
              <span
                className={`text-xs sm:text-lg font-bold line-clamp-1 ${isActive
                  ? "text-white dark:text-gray-900"
                  : "text-gray-900 dark:text-white"
                  }`}
              >
                {tab.label}
              </span>
              <span
                className={`text-[10px] sm:text-xs mt-0 sm:mt-1 line-clamp-1 sm:line-clamp-2 hidden sm:block ${isActive
                  ? "text-gray-300 dark:text-gray-500"
                  : "text-gray-500"
                  }`}
              >
                {tab.description}
              </span>
            </button>
          );
        })}
      </div>
      <div className="relative w-full">
        <Search
          className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
        />
        {searchLoading && (
          <Loader2
            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 animate-spin"
            size={18}
          />
        )}
        <input
          type="text"
          placeholder={`Search in ${activeTab.replace("_", " ")}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 sm:pl-12 pr-10 sm:pr-4 py-3 sm:py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm sm:text-base focus:ring-2 focus:ring-yellow-500 outline-none transition-all shadow-sm"
        />
      </div>
      {activeTab === "inventory" && productList.length > 0 && (
        <>
          {hasSearched && filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No products found for "{searchQuery}"
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6">
              <table className="w-full text-left mt-8 border-collapse text-xs sm:text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="border-b p-2 sm:p-4">Image</th>
                    <th className="border-b p-2 sm:p-4">Name</th>
                    <th className="border-b p-2 sm:p-4 hidden sm:table-cell">Category</th>
                    <th className="border-b p-2 sm:p-4 hidden md:table-cell">Brand</th>
                    <th className="border-b p-2 sm:p-4 hidden lg:table-cell">Rating</th>
                    <th className="border-b p-2 sm:p-4 hidden sm:table-cell">Active</th>
                    <th className="border-b p-2 sm:p-4 hidden lg:table-cell">Global</th>
                    <th className="border-b p-2 sm:p-4">Pricing</th>
                    <th className="border-b p-2 sm:p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 rounded-2xl border shadow-sm transition-all border-gray-100 dark:border-gray-700">
                  {filteredProducts.map((product) => (

                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="border-b p-2 sm:p-4">
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="rounded-lg w-10 h-10 sm:w-12 sm:h-12"
                        />
                      </td>
                      <td className="border-b p-2 sm:p-4">
                        <div className="font-medium text-gray-900 dark:text-white truncate max-w-xs">{product.name}</div>
                      </td>
                      <td className="border-b p-2 sm:p-4 hidden sm:table-cell text-gray-600 dark:text-gray-400">{product.category}</td>
                      <td className="border-b p-2 sm:p-4 hidden md:table-cell text-gray-600 dark:text-gray-400">{product.brand}</td>
                      <td className="border-b p-2 sm:p-4 hidden lg:table-cell">{typeof product.rating === "object" ? product.rating?.rate ?? "N/A" : product.rating ?? "N/A"}</td>
                      <td className="border-b p-2 sm:p-4 hidden sm:table-cell">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${product.isActive ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"}`}>
                          {product.isActive ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="border-b p-2 sm:p-4 hidden lg:table-cell">
                        {product.isGlobalProduct ? "Yes" : "No"}
                      </td>
                      <td className="border-b p-2 sm:p-4">
                        <div className="space-y-2 min-w-[280px]">
                          {(editablePricing[Number(product.id)] ?? (product as any).pricing ?? (product as any).prices ?? []).map(
                            (price, index) => (
                              <div key={index} className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                                <div>
                                  <label className="block text-gray-600 dark:text-gray-400 font-medium mb-1">Price (₹)</label>
                                  <input
                                    type="number"
                                    className="w-full bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded px-2 py-1 text-xs outline-none"
                                    value={price.price}
                                    onChange={(e) =>
                                      handlePricingChange(
                                        Number(product.id),
                                        index,
                                        "price",
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-600 dark:text-gray-400 font-medium mb-1">Discount (%)</label>
                                  <input
                                    type="number"
                                    className="w-full bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded px-2 py-1 text-xs outline-none"
                                    value={price.discount || 0}
                                    onChange={(e) =>
                                      handlePricingChange(
                                        Number(product.id),
                                        index,
                                        "discount",
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-600 dark:text-gray-400 font-medium mb-1">Stock</label>
                                  <input
                                    type="number"
                                    className="w-full bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded px-2 py-1 text-xs outline-none"
                                    value={price.stock}
                                    onChange={(e) =>
                                      handlePricingChange(
                                        Number(product.id),
                                        index,
                                        "stock",
                                        parseInt(e.target.value, 10) || 0
                                      )
                                    }
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-600 dark:text-gray-400 font-medium mb-1">Weight</label>
                                  <input
                                    type="number"
                                    className="w-full bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded px-2 py-1 text-xs outline-none"
                                    value={price.weight}
                                    onChange={(e) =>
                                      handlePricingChange(
                                        Number(product.id),
                                        index,
                                        "weight",
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                  />
                                </div>
                                <div className="col-span-2">
                                  <label className="block text-gray-600 dark:text-gray-400 font-medium mb-1">Unit</label>
                                  <select
                                    className="w-full bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded px-2 py-1 text-xs outline-none"
                                    value={price.unit}
                                    onChange={(e) =>
                                      handlePricingChange(
                                        Number(product.id),
                                        index,
                                        "unit",
                                        e.target.value as ProductPriceType["unit"]
                                      )
                                    }
                                  >
                                    <option value="grams">grams</option>
                                    <option value="kg">kg</option>
                                    <option value="ml">ml</option>
                                    <option value="litre">litre</option>
                                    <option value="piece">piece</option>
                                  </select>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </td>
                      <td className="border-b p-2 sm:p-4">
                        <div className="flex flex-col gap-1.5 sm:gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(product.id)}
                            className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg shadow-sm hover:opacity-90 transition min-h-[36px]"
                          >
                            <Edit size={16} /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => savePricing(Number(product.id))}
                            disabled={!dirtyProductIds.has(Number(product.id))}
                            className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-green-600 disabled:bg-gray-400 rounded-lg shadow-sm hover:opacity-90 transition min-h-[36px]"
                          >
                            <Save size={16} /> Save
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setActivityModalProduct({
                                id: Number(product.id),
                                name: product.name,
                                isActive: Boolean(product.isActive),
                              })
                            }
                            className={`inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-semibold rounded-full shadow-sm transition border min-h-[36px] ${product.isActive
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-red-100 text-red-800 border-red-200"
                              }`}
                          >
                            <span className="hidden sm:inline">{product.isActive ? "Active" : "Inactive"}</span>
                            <span className="sm:hidden">{product.isActive ? "✓" : "✕"}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {(activeTab === "inventory" || activeTab === "my_products") && (
        <div className=" bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-3 sm:py-4 px-3 sm:px-8 z-40">
          <div className="max-w-7xl mx-auto flex flex-col items-center justify-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => loadInventoryPage(inventoryCurrentPage - 1)}
                disabled={inventoryCurrentPage <= 1 || inventoryLoadingMore}
                className="inline-flex items-center justify-center px-3 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition min-h-[40px] sm:min-h-[44px]"
              >
                <span className="hidden sm:inline">← Previous</span>
                <span className="sm:hidden">←</span>
              </button>
              <button
                onClick={() => loadInventoryPage(inventoryCurrentPage + 1)}
                disabled={!inventoryHasMore || inventoryLoadingMore}
                className="inline-flex items-center justify-center px-3 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition min-h-[40px] sm:min-h-[44px]"
              >
                <span className="hidden sm:inline">Next →</span>
                <span className="sm:hidden">→</span>
              </button>
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center">
              {inventoryLoadingMore ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={16} />
                  Loading...
                </span>
              ) : (
                <span>
                  Page {inventoryCurrentPage} of {inventoryTotalPages}
                  <span className="ml-1 sm:ml-2 text-xs sm:text-xs">({inventoryPagination.totalItems} total)</span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
      {activeTab === "global" && (
        <>
          {hasSearched && filteredGlobalProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No products found for &nbsp;{searchQuery}&#34;
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredGlobalProducts.filter((product) => product.isActive !== false).map((product) => {
                  const alreadyAdded = productList.some((p) => p.globalProductId === product.id);
                  // console.log(alreadyAdded)
                  const firstImage = product.images?.[0] || "/placeholder.png";
                  return (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white dark:bg-gray-800 rounded-2xl p-3 md:p-4 border shadow-sm transition-all w-full border-gray-100 dark:border-gray-700"
                    >
                      <div className="flex gap-3 md:gap-4 ">
                        <div className="relative w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden shrink-0 self-start">
                          <Image
                            src={firstImage}
                            alt={product.name}
                            layout="fill"
                            objectFit="cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                          <div>
                            <div className="flex justify-between items-start mb-1">
                              <h3
                                className="font-bold text-gray-900 dark:text-white text-sm md:text-base line-clamp-2 leading-tight mr-6"
                                title={product.name}
                              >
                                {product.name}
                              </h3>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {product.category}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-end justify-start gap-y-2">
                        <div className="flex items-center gap-2"></div>
                        {alreadyAdded ? (
                          <button
                            disabled
                            className="bg-green-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-default"
                          >
                            <Check size={14} /> Added
                          </button>
                        ) : (
                          <button onClick={() => handleAddProductFromGlobalProducts(product)} className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 active:scale-95">
                            <Plus size={14} /> Add
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {globalProductList.length === 0 && (
                <div className="col-span-full text-center text-sm text-gray-500 dark:text-gray-400 py-6">
                  No global products available.
                </div>
              )}
            </div>
          )}
        </>
      )}
      {activeTab === "global" && (
        <div className=" bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-3 sm:py-4 px-3 sm:px-8 z-40">
          <div className="max-w-7xl mx-auto flex flex-col items-center justify-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => loadGlobalPage(globalCurrentPage - 1)}
                disabled={globalCurrentPage <= 1 || globalLoadingMore}
                className="inline-flex items-center justify-center px-3 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition min-h-[40px] sm:min-h-[44px]"
              >
                <span className="hidden sm:inline">← Previous</span>
                <span className="sm:hidden">←</span>
              </button>
              <button
                onClick={() => loadGlobalPage(globalCurrentPage + 1)}
                disabled={!globalHasMore || globalLoadingMore}
                className="inline-flex items-center justify-center px-3 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition min-h-[40px] sm:min-h-[44px]"
              >
                <span className="hidden sm:inline">Next →</span>
                <span className="sm:hidden">→</span>
              </button>
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center">
              {globalLoadingMore ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={16} />
                  Loading...
                </span>
              ) : (
                <span>
                  Page {globalCurrentPage} of {globalTotalPages}
                  <span className="ml-1 sm:ml-2 text-xs sm:text-xs">({globalPagination.totalItems} total)</span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
      {activeTab === "my_products" && (
        <>
          {hasSearched && filteredMyProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No products found for "{searchQuery}"
              </p>
            </div>
          ) : filteredMyProducts.length > 0 ? (
            <div className="w-full overflow-x-auto -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6">
              <table className="w-full text-left mt-8 border-collapse text-xs sm:text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="border-b p-2 sm:p-4">Image</th>
                    <th className="border-b p-2 sm:p-4">Name</th>
                    <th className="border-b p-2 sm:p-4 hidden sm:table-cell">Category</th>
                    <th className="border-b p-2 sm:p-4 hidden md:table-cell">Brand</th>
                    <th className="border-b p-2 sm:p-4 hidden lg:table-cell">Rating</th>
                    <th className="border-b p-2 sm:p-4 hidden sm:table-cell">Active</th>
                    <th className="border-b p-2 sm:p-4">Pricing</th>
                    <th className="border-b p-2 sm:p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 rounded-2xl border shadow-sm transition-all border-gray-100 dark:border-gray-700">
                  {filteredMyProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="border-b p-2 sm:p-4">
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="rounded-lg w-10 h-10 sm:w-12 sm:h-12"
                        />
                      </td>
                      <td className="border-b p-2 sm:p-4">
                        <div className="font-medium text-gray-900 dark:text-white truncate max-w-xs">{product.name}</div>
                      </td>
                      <td className="border-b p-2 sm:p-4 hidden sm:table-cell text-gray-600 dark:text-gray-400">{product.category}</td>
                      <td className="border-b p-2 sm:p-4 hidden md:table-cell text-gray-600 dark:text-gray-400">{product.brand}</td>
                      <td className="border-b p-2 sm:p-4 hidden lg:table-cell">{typeof product.rating === "object" ? product.rating?.rate ?? "N/A" : product.rating ?? "N/A"}</td>
                      <td className="border-b p-2 sm:p-4 hidden sm:table-cell">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${product.isActive ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"}`}>
                          {product.isActive ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="border-b p-2 sm:p-4">
                        <div className="space-y-2 min-w-[280px]">
                          {(product as any).pricing?.map((price: any, index: number) => (
                            <div key={index} className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                              <div>
                                <label className="block text-gray-600 dark:text-gray-400 font-medium mb-1">Price (₹)</label>
                                <div className="text-gray-900 dark:text-white font-medium">{price.price}</div>
                              </div>
                              <div>
                                <label className="block text-gray-600 dark:text-gray-400 font-medium mb-1">Discount (%)</label>
                                <div className="text-gray-900 dark:text-white font-medium">{price.discount || 0}</div>
                              </div>
                              <div>
                                <label className="block text-gray-600 dark:text-gray-400 font-medium mb-1">Stock</label>
                                <div className="text-gray-900 dark:text-white font-medium">{price.stock}</div>
                              </div>
                              <div>
                                <label className="block text-gray-600 dark:text-gray-400 font-medium mb-1">Weight</label>
                                <div className="text-gray-900 dark:text-white font-medium">{price.weight}</div>
                              </div>
                              <div className="col-span-2">
                                <label className="block text-gray-600 dark:text-gray-400 font-medium mb-1">Unit</label>
                                <div className="text-gray-900 dark:text-white font-medium">{price.unit}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="border-b p-2 sm:p-4">
                        <button
                          type="button"
                          onClick={() => openEditModal(product.id)}
                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg shadow-sm hover:opacity-90 transition min-h-[36px]"
                        >
                          <Edit size={16} /> Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No custom products yet. Create your first product!
              </p>
            </div>
          )}
        </>
      )}

      {exitPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-sm w-full p-4 sm:p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-yellow-100 text-yellow-700">!</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Unsaved changes</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You have unsaved pricing edits. Save before leaving or discard them to continue.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleExitDecision("save")}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg shadow-sm hover:opacity-90 transition"
              >
                Save & Continue
              </button>
              <button
                type="button"
                onClick={() => handleExitDecision("discard")}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg shadow-sm hover:opacity-90 transition"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={() => handleExitDecision("cancel")}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-sm hover:opacity-90 transition"
              >
                Stay
              </button>
            </div>
          </div>
        </div>
      )}

      {addModalOpen && selectedGlobalProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="absolute right-3 top-3 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
            >
              <X size={18} />
            </button>

            <div className="flex items-start gap-3">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                <Image src={selectedGlobalProduct.images?.[0] || "/placeholder.png"} alt={selectedGlobalProduct.name} fill style={{ objectFit: "cover" }} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedGlobalProduct.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedGlobalProduct.category}</p>
              </div>
            </div>

            <PriceForm
              initialPricing={normalizePricing(selectedGlobalProduct)}
              submitLabel="Add Product"
              onCancel={() => setAddModalOpen(false)}
              onSubmit={async (pricing) => {
                const data = {
                  // productCategoryId: Number(selectedGlobalProduct.id || selectedGlobalProduct.categoryId || selectedGlobalProduct.category?.id || 0),
                  globalProductId: Number(selectedGlobalProduct.id),
                  pricing: pricing.map((p) => ({
                    ...p,
                    globalProductId: Number(selectedGlobalProduct.id),
                  })),
                };
                await shopService.addProductFromGlobalCatalog(data);
                setAddModalOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {activityModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-4 sm:p-6 space-y-4">
            <button
              type="button"
              onClick={() => setActivityModalProduct(null)}
              className="absolute right-3 top-3 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
            >
              <X size={18} />
            </button>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {activityModalProduct.isActive ? "Deactivate product?" : "Activate product?"}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {activityModalProduct.isActive
                  ? "This will hide the product from customers until you activate it again."
                  : "This will make the product available to customers."}
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{activityModalProduct.name}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                disabled={activityLoading}
                onClick={async () => {
                  if (!activityModalProduct) return;
                  try {
                    setActivityLoading(true);
                    await shopService.updateProductActivity(
                      activityModalProduct.id,
                      !activityModalProduct.isActive
                    );
                    await fetchProducts();
                    toast.success(
                      activityModalProduct.isActive ? "Product deactivated" : "Product activated"
                    );
                  } catch (error) {
                    console.error("Failed to update product activity", error);
                    toast.error("Could not update product availability");
                  } finally {
                    setActivityLoading(false);
                    setActivityModalProduct(null);
                  }
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg shadow-sm hover:opacity-90 transition disabled:opacity-70 min-h-[40px]"
              >
                {activityLoading ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                {activityModalProduct.isActive ? "Deactivate" : "Activate"}
              </button>
              <button
                type="button"
                onClick={() => setActivityModalProduct(null)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-sm hover:opacity-90 transition min-h-[40px]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
            <button
              type="button"
              onClick={closeEditModal}
              className="absolute right-3 top-3 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
            >
              <X size={18} />
            </button>

            {editLoading && (
              <div className="flex items-center justify-center py-20 text-gray-500 gap-2">
                <Loader2 className="animate-spin" size={20} />
                <span>Loading product...</span>
              </div>
            )}

            {!editLoading && editInitialData && editingId && (
              <div className="p-4 sm:p-6">
                <ProductForm
                  mode="edit"
                  initialData={editInitialData}
                  hideBackButton
                  onBack={closeEditModal}
                  onCancel={closeEditModal}
                  readOnlyCoreFields={editingIsGlobal}
                  onSubmit={async (data) => {
                    const payload = {
                      ...data,
                      stock: data.pricing?.[0]?.stock ?? 0,
                    };

                    try {
                      await shopService.updateProductDetails(editingId, payload);
                      await fetchProducts();
                      toast.success("Product updated");
                      closeEditModal();
                    } catch (error) {
                      console.error("Failed to update product", error);
                      toast.error("Failed to update product");
                    }
                  }}
                  onSuccess={closeEditModal}
                  successMessage="Product updated successfully!"
                  submitLabel="Update Product"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
