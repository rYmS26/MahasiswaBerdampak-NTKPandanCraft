import {
  FALLBACK_BUNDLES,
  FALLBACK_CATEGORIES,
  FALLBACK_PRODUCTS,
} from "@/data/fallback-catalog";
import {
  SELLER_WHATSAPP,
  SELLER_WHATSAPP_DISPLAY,
  formatWhatsAppDisplay,
  normalizeWhatsAppNumber,
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
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    price: Number(row.price),
    imagePath: row.image_path,
    dimensions: row.dimensions,
    variants: Array.isArray(row.variants) ? row.variants : [],
    badge: row.badge,
    stockLabel: row.stock_label,
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
        .select(
          "id, slug, name, price, image_path, dimensions, variants, badge, stock_label, rating, reviews_count, categories, category_label, description, is_bundle, sort_order",
        )
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("store_settings")
        .select("key, value")
        .eq("key", "seller_whatsapp")
        .maybeSingle(),
    ]);

    let resolvedSettings = defaultSettings;
    if (settingsRes.data?.value) {
      const cleanWa = normalizeWhatsAppNumber(settingsRes.data.value);
      if (cleanWa.length >= 10) {
        resolvedSettings = {
          sellerWhatsApp: cleanWa,
          sellerWhatsAppDisplay: formatWhatsAppDisplay(cleanWa),
        };
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
