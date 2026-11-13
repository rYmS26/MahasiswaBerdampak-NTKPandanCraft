import { NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { FALLBACK_CATEGORIES, FALLBACK_PRODUCTS } from "@/data/fallback-catalog";

export async function GET() {
  const isAuth = await isAuthenticatedAdmin();
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Akses ditolak. Silakan login." }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    // If Supabase not connected, return fallback products
    return NextResponse.json({
      ok: true,
      products: FALLBACK_PRODUCTS,
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
    const name = String(body.name || "").trim();
    let slug = String(body.slug || "").trim().toLowerCase();
    const price = Math.max(0, parseInt(body.price, 10) || 0);

    if (!name || price <= 0) {
      return NextResponse.json(
        { ok: false, error: "Nama produk dan harga wajib diisi." },
        { status: 400 }
      );
    }

    if (!slug) {
      slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
    }

    const newProduct = {
      name,
      slug,
      price,
      image_path: body.image_path?.trim() || "/katalog/keranjang_bunga.png",
      dimensions: body.dimensions?.trim() || "Standar",
      variants: Array.isArray(body.variants) ? body.variants : [],
      badge: body.badge?.trim() || "Produk Pilihan",
      stock_label: body.stock_label?.trim() || "Tersedia",
      rating: parseFloat(body.rating) || 5.0,
      reviews_count: parseInt(body.reviews_count, 10) || 10,
      categories: Array.isArray(body.categories) && body.categories.length > 0 ? body.categories : ["popular"],
      category_label: body.category_label?.trim() || "Kerajinan Pandan",
      description: body.description?.trim() || "Kerajinan anyaman daun pandan berkualitas asli pengrajin Ciamis.",
      is_bundle: Boolean(body.is_bundle),
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
      sort_order: parseInt(body.sort_order, 10) || 99,
    };

    const { data, error } = await supabase
      .from("products")
      .insert(newProduct)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, product: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menambah produk";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
