interface CreateShopPayload {
  shopName: string;
  shopCategory: string;
  shopImages: string[];
  fssaiNumber: string;
  gstNumber?: string;
  documents: {
    aadharImage: string;
    electricityBillImage: string;
    businessCertificateImage: string;
    panImage: string;
  };
  bankDetail?: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branchName: string;
    bankPassbookImage: string;
  };
}

interface ProductPriceType {
  stock: number;
  price: number;
  discount?: number;
  weight: number;
  unit: "grams" | "kg" | "ml" | "litre" | "piece";
  currency?: string;
}
interface NewProductFormData {
  productCategoryId: number;
  name: string;
  brand: string;
  description: string;
  images: string[];
  pricing: ProductPriceType[];
}

interface Pagination {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}
type ShopProduct =
  | {
      isGlobalProduct: false;
      id: number | string;
      category: string;
      name: string;
      brand: string;
      description?: string;
      images: string[];
      rating: number;
      pricing: ProductPriceType[];
      isActive: boolean;
    }
  | {
      isGlobalProduct: true;
      id: number | string;
      globalProductId: number | string;
      category: string;
      name: string;
      brand: string;
      description?: string;
      images: string[];
      rating: number;
      pricing: ProductPriceType[];
      isActive: boolean;
    };

interface GlobalProduct {
  id: number | string;
  category: string;
  name: string;
  brand: string;
  description: string;
  images: string[];
  rating: number;
  pricing: ProductPriceType[];
}
type ShopProductListType = {
  products: ShopProduct[];
  pagination: Pagination;
};

type GlobalProductListType = {
  products: GlobalProduct[];
  pagination: Pagination;
};

type OrderItem = {
  id: number | string;
  productId: number | string;
  quantity: number;
  image: string;
  name: string;
  price: number;
  weight: number;
  unit: "grams" | "kg" | "ml" | "litre" | "piece";
};

type OrderDetail = {
  id: number | string;
  customerName: string;
  customerPhone: string;
  address: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  totalAmount: number;
  itemCount: number;
  paymentMethod: string;
  createdAt: string;
  orderItems: OrderItem[];
  driver?: { id: number | string; name: string; phone: string };
  driverList: { id: number | string; name: string; phone: string }[];
};

interface CurrentOrderListType {
  orders: {
    id: number;
    customerName: string;
    createdAt: string;
    address: string;
    itemCount: number;
    paymentMethod: string;
    status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
    totalAmount: number;
  }[];
  pagination: Pagination;
}

export {
  CreateShopPayload,
  ProductPriceType,
  NewProductFormData,
  ShopProductListType,
  GlobalProductListType,
  OrderDetail,
  CurrentOrderListType,
};
