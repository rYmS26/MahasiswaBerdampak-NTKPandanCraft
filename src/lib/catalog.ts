import {
  FALLBACK_BUNDLES,
  FALLBACK_CATEGORIES,
  FALLBACK_PRODUCTS,
} from "@/data/fallback-catalog";
import {
  DEFAULT_HERO_IMAGE,
  SELLER_WHATSAPP,
  SELLER_WHATSAPP_DISPLAY,
  formatWhatsAppDisplay,
  normalizeWhatsAppNumber,
  parseProductStock,
  parseProductVariants,
} from "@/lib/format";
import { createPublicCatalogClient } from "@/lib/supabase/server";
import type { CatalogResponse, CategoryItem, ProductItem, StoreSettings } from "@/types/catalog";

interface DbCategoryRow {
  slug: string;
  label: string;
  image_path: string;
  tint_class: string;
  sort_order: number;
}

interface DbProductRow {
  id: number;
  slug: string;
  name: string;
  price: number;
  stock?: number | null;
  image_path: string;
  dimensions: string;
  variants: string[] | null;
  badge: string;
  stock_label: string;
  rating: number | string;
  reviews_count: number;
  categories: string[] | null;
  category_label: string;
  description: string;
  is_bundle: boolean;
  sort_order: number;
}

function mapCategory(row: DbCategoryRow): CategoryItem {
  return {
    slug: row.slug,
    label: row.label,
    imagePath: row.image_path,
    tintClass: row.tint_class,
    sortOrder: row.sort_order,
  };
}

function mapProduct(row: DbProductRow): ProductItem {
  const basePrice = Number(row.price);
  const initialStock = parseProductStock(row.stock, row.stock_label);
  const parsedVariants = parseProductVariants(row.variants, basePrice, initialStock);
  const resolvedStock = parseProductStock(row.stock, row.stock_label, parsedVariants);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    price: basePrice,
    stock: resolvedStock,
    imagePath: row.image_path,
    dimensions: row.dimensions,
    variants: parsedVariants.map((v) => v.label),
    variantPrices: parsedVariants,
    badge: row.badge,
    stockLabel: resolvedStock <= 0 ? "Habis" : row.stock_label,
    rating: Number(row.rating).toFixed(1),
    reviewsCount: row.reviews_count,
    categories: Array.isArray(row.categories) ? row.categories : [],
    categoryLabel: row.category_label,
    description: row.description,
    isBundle: Boolean(row.is_bundle),
    sortOrder: row.sort_order,
  };
}

/**
 * Fetches categories & active catalog items in parallel from Supabase Postgres,
 * falling back cleanly to local seed data when Supabase env vars are not set yet.
 */
export async function getCatalogData(): Promise<CatalogResponse> {
  const supabase = createPublicCatalogClient();

  const defaultSettings: StoreSettings = {
    sellerWhatsApp: SELLER_WHATSAPP,
    sellerWhatsAppDisplay: SELLER_WHATSAPP_DISPLAY,
    heroImageUrl: DEFAULT_HERO_IMAGE,
  };

  if (!supabase) {
    return {
      categories: FALLBACK_CATEGORIES,
      products: FALLBACK_PRODUCTS,
      bundles: FALLBACK_BUNDLES,
      settings: defaultSettings,
      source: "fallback",
    };
  }

  try {
    const [categoriesRes, productsRes, settingsRes] = await Promise.all([
      supabase
        .from("categories")
        .select("slug, label, image_path, tint_class, sort_order")
        .order("sort_order", { ascending: true }),
      supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("store_settings")
        .select("key, value")
        .in("key", ["seller_whatsapp", "hero_image_url"]),
    ]);

    const resolvedSettings: StoreSettings = { ...defaultSettings };
    if (Array.isArray(settingsRes.data)) {
      for (const row of settingsRes.data) {
        if (row.key === "seller_whatsapp" && row.value) {
          const cleanWa = normalizeWhatsAppNumber(row.value);
          if (cleanWa.length >= 10) {
            resolvedSettings.sellerWhatsApp = cleanWa;
            resolvedSettings.sellerWhatsAppDisplay = formatWhatsAppDisplay(cleanWa);
          }
        } else if (row.key === "hero_image_url" && row.value?.trim()) {
          resolvedSettings.heroImageUrl = row.value.trim();
        }
      }
    }

    if (categoriesRes.error || productsRes.error || !productsRes.data?.length) {
      return {
        categories: FALLBACK_CATEGORIES,
        products: FALLBACK_PRODUCTS,
        bundles: FALLBACK_BUNDLES,
        settings: resolvedSettings,
        source: "fallback",
      };
    }

    const categories =
      categoriesRes.data && categoriesRes.data.length > 0
        ? (categoriesRes.data as DbCategoryRow[]).map(mapCategory)
        : FALLBACK_CATEGORIES;

    const allMapped = (productsRes.data as DbProductRow[]).map(mapProduct);
    return {
      categories,
      products: allMapped.filter((item) => !item.isBundle),
      bundles: allMapped.filter((item) => item.isBundle),
      settings: resolvedSettings,
      source: "supabase",
    };
  } catch {
    return {
      categories: FALLBACK_CATEGORIES,
      products: FALLBACK_PRODUCTS,
      bundles: FALLBACK_BUNDLES,
      settings: defaultSettings,
      source: "fallback",
    };
  }
}
