import { NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  FALLBACK_BUNDLES,
  FALLBACK_CATEGORIES,
  FALLBACK_PRODUCTS,
} from "@/data/fallback-catalog";
import {
  formatStockLabelWithCount,
  serializeProductVariants,
} from "@/lib/format";
import { sanitizePlainText, sanitizeSlug } from "@/lib/security";

function getFallbackDbProducts() {
  return [...FALLBACK_PRODUCTS, ...FALLBACK_BUNDLES].map((p, idx) => ({
    id: idx + 1,
    slug: p.slug,
    name: p.name,
    price: p.price,
    stock: p.stock,
    image_path: p.imagePath,
    dimensions: p.dimensions,
    variants:
      p.variantPrices && p.variantPrices.length > 0
        ? serializeProductVariants(p.variantPrices)
        : p.variants,
    badge: p.badge,
    stock_label: p.stockLabel,
    rating: Number(p.rating) || 5.0,
    reviews_count: p.reviewsCount,
    categories: p.categories,
    category_label: p.categoryLabel,
    description: p.description,
    is_bundle: p.isBundle,
    is_active: true,
    sort_order: p.sortOrder,
  }));
}

export async function GET() {
  const isAuth = await isAuthenticatedAdmin();
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Akses ditolak. Silakan login." }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json({
      ok: true,
      products: getFallbackDbProducts(),
      categories: FALLBACK_CATEGORIES,
      source: "fallback",
    });
  }

  try {
    const [productsRes, categoriesRes] = await Promise.all([
      supabase
        .from("products")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true }),
      supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true }),
    ]);

    if (productsRes.error) {
      if (productsRes.error.code === "PGRST205" || productsRes.error.code === "42P01") {
        return NextResponse.json({
          ok: true,
          products: getFallbackDbProducts(),
          categories: FALLBACK_CATEGORIES,
          source: "fallback",
          needsTableSetup: true,
        });
      }
      throw productsRes.error;
    }

    return NextResponse.json({
      ok: true,
      products: productsRes.data || [],
      categories: categoriesRes.data || FALLBACK_CATEGORIES,
      source: "supabase",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memuat produk";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const isAuth = await isAuthenticatedAdmin();
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Akses ditolak. Silakan login." }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Koneksi database admin Supabase belum dikonfigurasi." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const name = sanitizePlainText(body.name, 120);
    let slug = sanitizeSlug(body.slug || name, 120);
    const price = Math.max(0, parseInt(body.price, 10) || 0);
    const stock =
      body.stock !== undefined
        ? Math.max(0, parseInt(String(body.stock), 10) || 0)
        : 20;

    if (!name || price <= 0) {
      return NextResponse.json(
        { ok: false, error: "Nama produk dan harga wajib diisi." },
        { status: 400 }
      );
    }

    if (!slug) {
      slug = sanitizeSlug(name, 120);
    }

    const rawStockLabel = sanitizePlainText(body.stock_label || "Tersedia", 60);
    const syncedStockLabel = formatStockLabelWithCount(stock, rawStockLabel);

    const baseProduct = {
      name,
      slug,
      price,
      image_path: sanitizePlainText(body.image_path, 400) || "/katalog/keranjang_bunga.png",
      dimensions: sanitizePlainText(body.dimensions, 150) || "Standar",
      variants: Array.isArray(body.variants)
        ? body.variants.map((v: unknown) => sanitizePlainText(v, 150)).filter(Boolean)
        : [],
      badge: sanitizePlainText(body.badge, 60) || "Produk Pilihan",
      stock_label: syncedStockLabel,
      rating: Math.min(5, Math.max(1, parseFloat(body.rating) || 5.0)),
      reviews_count: Math.max(0, parseInt(body.reviews_count, 10) || 10),
      categories:
        Array.isArray(body.categories) && body.categories.length > 0
          ? body.categories.map((c: unknown) => sanitizeSlug(c, 50)).filter(Boolean)
          : ["popular"],
      category_label: sanitizePlainText(body.category_label, 80) || "Kerajinan Pandan",
      description:
        sanitizePlainText(body.description, 1000) ||
        "Kerajinan anyaman daun pandan berkualitas asli pengrajin Ciamis.",
      is_bundle: Boolean(body.is_bundle),
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
      sort_order: Math.max(1, parseInt(body.sort_order, 10) || 99),
    };

    let { data, error } = await supabase
      .from("products")
      .insert({ ...baseProduct, stock })
      .select()
      .single();

    // Fallback jika kolom `stock` belum ditambahkan di tabel products
    if (error && error.message?.toLowerCase().includes("stock")) {
      const retry = await supabase
        .from("products")
        .insert(baseProduct)
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, product: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menambah produk";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
