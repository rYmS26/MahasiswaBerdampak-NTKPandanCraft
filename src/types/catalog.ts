export interface CategoryItem {
  slug: string;
  label: string;
  imagePath: string;
  tintClass: string;
  sortOrder: number;
}

export interface ProductItem {
  id?: number;
  slug: string;
  name: string;
  price: number;
  imagePath: string;
  dimensions: string;
  variants: string[];
  badge: string;
  stockLabel: string;
  rating: string;
  reviewsCount: number;
  categories: string[];
  categoryLabel: string;
  description: string;
  isBundle: boolean;
  sortOrder: number;
}

export interface CartItem {
  slug: string;
  qty: number;
  variant: string;
  note: string;
}

export interface CustomerDetails {
  name: string;
  address: string;
  note: string;
}

export interface CatalogResponse {
  categories: CategoryItem[];
  products: ProductItem[];
  bundles: ProductItem[];
  source: "supabase" | "fallback";
}

export interface CreateOrderRequest {
  customer: CustomerDetails;
  items: CartItem[];
  siteOrigin?: string;
}

export interface CreateOrderResponse {
  ok: boolean;
  orderCode: string;
  persisted: boolean;
  totalQty: number;
  totalPrice: number;
  whatsappMessage: string;
  error?: string;
}
