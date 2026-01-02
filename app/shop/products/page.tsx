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
  const inventorySentinelRef = useRef<HTMLDivElement | null>(null);
  const globalSentinelRef = useRef<HTMLDivElement | null>(null);

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
  const inventoryHasMore = inventoryPagination.currentPage < inventoryPagination.totalPages;
  const globalHasMore = globalPagination.currentPage < globalPagination.totalPages;
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
  }, [
    fetchProducts,
    featchGlobalProducts,
    productList.length,
    globalProductList.length,
    inventoryPagination.itemsPerPage,
    globalPagination.itemsPerPage,
  ]);

  const loadMoreInventory = useCallback(async () => {
    if (inventoryLoadingMore || !inventoryHasMore) return;
    setInventoryLoadingMore(true);
    const nextPage = (inventoryPagination.currentPage || 1) + 1;
    await fetchProducts(nextPage, inventoryPagination.itemsPerPage || 10, true);
    setInventoryLoadingMore(false);
  }, [
    fetchProducts,
    inventoryHasMore,
    inventoryLoadingMore,
    inventoryPagination.currentPage,
    inventoryPagination.itemsPerPage,
  ]);

  const loadMoreGlobal = useCallback(async () => {
    if (globalLoadingMore || !globalHasMore) return;
    setGlobalLoadingMore(true);
    const nextPage = (globalPagination.currentPage || 1) + 1;
    await featchGlobalProducts(nextPage, globalPagination.itemsPerPage || 10, true);
    setGlobalLoadingMore(false);
  }, [
    featchGlobalProducts,
    globalHasMore,
    globalLoadingMore,
    globalPagination.currentPage,
    globalPagination.itemsPerPage,
  ]);

  useEffect(() => {
    if (activeTab !== "inventory" && activeTab !== "my_products") return;
    const sentinel = inventorySentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMoreInventory();
      },
      { root: null, rootMargin: "200px", threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activeTab, loadMoreInventory]);

  useEffect(() => {
    if (activeTab !== "global") return;
    const sentinel = globalSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMoreGlobal();
      },
      { root: null, rootMargin: "200px", threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activeTab, loadMoreGlobal]);

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

  const filteredProducts = productList.filter((p) => {
    const name = (p as { name?: string })?.name || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleAddProductFromGlobalProducts = (product: (typeof globalProductList)[number]) => {
    setSelectedGlobalProduct(product);
    setAddModalOpen(true);
  };
  return (
    <div className="space-y-6 pb-24 md:pb-8 w-full max-w-[100vw] overflow-x-hidden px-1 md:px-0">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Products
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your store inventory
          </p>
        </div>
        <button
          onClick={() => attemptNavigate(() => router.push("/shop/products/new"))}
          className="w-full md:w-auto bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-yellow-500/20 transition-transform active:scale-95 flex items-center justify-center gap-2 text-sm"
        >
          <Plus size={20} /> Add New Product
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                attemptNavigate(() => setActiveTab(tab.id));
              }}
              className={`flex flex-col items-start p-5 rounded-2xl border-2 transition-all text-left relative overflow-hidden group ${isActive
                ? "bg-gray-900 dark:bg-white border-gray-900 dark:border-white text-white dark:text-gray-900 shadow-lg"
                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
            >
              <div
                className={`p-3 rounded-xl mb-3 transition-colors ${isActive
                  ? "bg-white/20 text-white dark:bg-gray-900/10 dark:text-gray-900"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  }`}
              >
                <Icon size={24} />
              </div>
              <span
                className={`text-lg font-bold ${isActive
                  ? "text-white dark:text-gray-900"
                  : "text-gray-900 dark:text-white"
                  }`}
              >
                {tab.label}
              </span>
              <span
                className={`text-xs mt-1 ${isActive
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
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          type="text"
          placeholder={`Search in ${activeTab.replace("_", " ")}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-base focus:ring-2 focus:ring-yellow-500 outline-none transition-all shadow-sm"
        />
      </div>
      {activeTab === "inventory" && productList.length > 0 && (
        <table className="w-full text-left mt-8 border-collapse">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="border-b p-4">Product Image</th>
              <th className="border-b p-4">Product Name</th>
              <th className="border-b p-4">Product Category</th>
              <th className="border-b p-4"> Brand </th>
              <th className="border-b p-4">Reating</th>
              <th className="border-b p-4">Is Active</th>
              <th className="border-b p-4">Is Global Product</th>
              <th className="border-b p-4">Pricing</th>
              <th className="border-b p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white m-5 p-6 dark:bg-gray-800 rounded-2xl  md:p-4 border shadow-sm transition-all w-full border-gray-100 dark:border-gray-700">
            {filteredProducts.map((product) => (

              <tr key={product.id}>
                <td className="border-b p-4">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    width={50}
                    height={50}
                    className="rounded-lg"
                  />
                </td>
                <td className="border-b p-4">{product.name}</td>
                <td className="border-b p-4">{product.category}</td>
                <td className="border-b p-4">{product.brand}</td>
                <td className="border-b p-4">{typeof product.rating === "object" ? product.rating?.rate ?? "N/A" : product.rating ?? "N/A"}</td>
                <td className="border-b p-4 "><span className="">{product.isActive ? "Yes" : "No"}</span></td>
                <td className="border-b p-4">
                  {product.isGlobalProduct ? "Yes" : "No"}
                </td>
                <td className="border-b p-4">
                  <table className="mb-2 w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border p-2">Id</th>
                        <th className="border p-2">Price (₹)</th>
                        <th className="border p-2">Discount (%)</th>
                        <th className="border p-2">Weight</th>
                        <th className="border p-2">Unit</th>
                        <th className="border p-2">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(editablePricing[Number(product.id)] ?? (product as any).pricing ?? (product as any).prices ?? []).map(
                        (price, index) => (
                          <tr key={index}>
                            <td className="border p-2">{price.id ?? index + 1}</td>
                            <td className="border p-2">
                              <input
                                type="number"
                                className="w-full bg-transparent outline-none"
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
                            </td>
                            <td className="border p-2">
                              <input
                                type="number"
                                className="w-full bg-transparent outline-none"
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
                            </td>
                            <td className="border p-2">
                              <input
                                type="number"
                                className="w-full bg-transparent outline-none"
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
                            </td>
                            <td className="border p-2">
                              <select
                                className="w-full bg-transparent outline-none"
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
                            </td>
                            <td className="border p-2">
                              <input
                                type="number"
                                className="w-full bg-transparent outline-none"
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
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </td>
                <td className="border-b p-4">
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(product.id)}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg shadow-sm hover:opacity-90 transition"
                    >
                      <Edit />
                    </button>
                    <button
                      type="button"
                      onClick={() => savePricing(Number(product.id))}
                      disabled={!dirtyProductIds.has(Number(product.id))}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-green-600 disabled:bg-gray-400 rounded-lg shadow-sm hover:opacity-90 transition"
                    >
                      <Save />
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
                      className={`inline-flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-full shadow-sm transition border ${product.isActive
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-red-100 text-red-800 border-red-200"
                        }`}
                    >
                      <span>{product.isActive ? "Active" : "Inactive"}</span>
                      <span
                        className={`ml-3 inline-flex h-5 w-10 items-center rounded-full p-0.5 transition ${product.isActive ? "bg-green-500" : "bg-red-500"
                          }`}
                      >
                        <span
                          className={`h-4 w-4 rounded-full bg-white shadow transform transition ${product.isActive ? "translate-x-5" : "translate-x-0"
                            }`}
                        />
                      </span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {(activeTab === "inventory" || activeTab === "my_products") && (
        <div className="flex items-center justify-center py-4">
          {inventoryLoadingMore && <span className="text-sm text-gray-500">Loading more products...</span>}
          {!inventoryHasMore && productList.length > 0 && (
            <span className="text-sm text-gray-500">No more products</span>
          )}
        </div>
      )}
      <div ref={inventorySentinelRef} className="h-2" />
      {activeTab === "global" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {globalProductList.filter((product) => product.isActive !== false).map((product) => {
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
      {activeTab === "global" && (
        <div className="flex items-center justify-center py-4">
          {globalLoadingMore && <span className="text-sm text-gray-500">Loading more products...</span>}
          {!globalHasMore && globalProductList.length > 0 && (
            <span className="text-sm text-gray-500">No more products</span>
          )}
        </div>
      )}
      <div ref={globalSentinelRef} className="h-2" />
      {activeTab === "my_products" &&
        productList.filter((p) => p.isGlobalProduct != true && p.isActive !== false).length >
        0 && (
          <table className="w-full text-left mt-8 border-collapse">
            <thead className="">
              <tr>
                <th className="border-b p-4">Product Image</th>
                <th className="border-b p-4">Product Name</th>
                <th className="border-b p-4">Product Category</th>
                <th className="border-b p-4">Brand </th>
                <th className="border-b p-4">Reating</th>
                <th className="border-b p-4">Is Active</th>

                <th className="border-b p-4">Pricing</th>
                <th className="border-b p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.filter((p) => p.isGlobalProduct != true && p.isActive !== false).map((product) => (
                <tr
                  key={product.id}
                  className="bg-white m-5 p-6 dark:bg-gray-800 rounded-2xl  md:p-4 border shadow-sm transition-all w-full border-gray-100 dark:border-gray-700"
                >
                  <td className="border-b p-4">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      width={50}
                      height={50}
                      className="rounded-lg"
                    />
                  </td>
                  <td className="border-b p-4">{product.name}</td>
                  <td className="border-b p-4">{product.category}</td>
                  <td className="border-b p-4">{product.brand}</td>
                  <td className="border-b p-4">{typeof product.rating === "object" ? product.rating?.rate ?? "N/A" : product.rating ?? "N/A"}</td>
                  <td className="border-b p-4">
                    {product.isActive ? "Yes" : "No"}
                  </td>

                  <td className="border-b p-4">
                    <table className="mb-2 w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="border p-2">Id</th>
                          <th className="border p-2">Price (₹)</th>
                          <th className="border p-2">Discount (%)</th>
                          <th className="border p-2">Weight</th>
                          <th className="border p-2">Unit</th>
                          <th className="border p-2">Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(product as any).pricing?.map((price: any, index: number) => (
                          <tr key={index}>
                            <td className="border p-2">{index + 1}</td>
                            <td className="border p-2">{price.price}</td>
                            <td className="border p-2">
                              {price.discount || 0}
                            </td>
                            <td className="border p-2">{price.weight}</td>
                            <td className="border p-2">{price.unit}</td>
                            <td className="border p-2">{price.stock}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                  <td className="border-b p-4">
                    <button
                      type="button"
                      onClick={() => openEditModal(product.id)}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg shadow-sm hover:opacity-90 transition"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      {exitPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 md:p-6">
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-4 md:p-6 space-y-4">
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 md:p-6">
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
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
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg shadow-sm hover:opacity-90 transition disabled:opacity-70"
              >
                {activityLoading ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                {activityModalProduct.isActive ? "Deactivate" : "Activate"}
              </button>
              <button
                type="button"
                onClick={() => setActivityModalProduct(null)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-sm hover:opacity-90 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 md:p-6">
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
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
              <div className="p-4 md:p-6">
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
