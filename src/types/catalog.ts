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
  isActive?: boolean;
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

export interface StoreSettings {
  sellerWhatsApp: string;
  sellerWhatsAppDisplay: string;
}

export interface CatalogResponse {
  categories: CategoryItem[];
  products: ProductItem[];
  bundles: ProductItem[];
  settings: StoreSettings;
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

export type OrderStatus = "pending_wa" | "confirmed" | "completed" | "cancelled";

export interface OrderItemRow {
  id: number;
  order_id: number;
  product_id: number | null;
  product_slug: string;
  product_name: string;
  variant: string | null;
  item_note: string | null;
  unit_price: number;
  qty: number;
  subtotal: number;
  image_path: string;
}

export interface OrderRow {
  id: number;
  order_code: string;
  customer_name: string;
  customer_address: string;
  customer_note: string | null;
  total_qty: number;
  total_price: number;
  whatsapp_message: string;
  status: OrderStatus;
  created_at: string;
  order_items?: OrderItemRow[];
}

export interface SalesReportSummary {
  period: "today" | "7days" | "30days" | "all";
  totalRevenue: number;
  confirmedOrdersCount: number;
  totalUnitsSold: number;
  averageOrderValue: number;
  topProducts: {
    slug: string;
    name: string;
    imagePath: string;
    unitsSold: number;
    revenue: number;
  }[];
  orders: OrderRow[];
}

