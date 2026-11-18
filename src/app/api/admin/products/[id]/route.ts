import { NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/admin-auth";
import { formatStockLabelWithCount } from "@/lib/format";
import { sanitizePlainText, sanitizeSlug } from "@/lib/security";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  const isAuth = await isAuthenticatedAdmin();
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Akses ditolak. Silakan login." }, { status: 401 });
  }

  const { id } = await params;
  const productId = parseInt(id, 10);
  if (!productId || isNaN(productId)) {
    return NextResponse.json({ ok: false, error: "ID produk tidak valid." }, { status: 400 });
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
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = sanitizePlainText(body.name, 120);
    if (body.slug !== undefined) updateData.slug = sanitizeSlug(body.slug, 120);
    if (body.price !== undefined) updateData.price = Math.max(0, parseInt(body.price, 10) || 0);
    if (body.image_path !== undefined) updateData.image_path = sanitizePlainText(body.image_path, 400);
    if (body.dimensions !== undefined) updateData.dimensions = sanitizePlainText(body.dimensions, 150);
    if (body.badge !== undefined) updateData.badge = sanitizePlainText(body.badge, 60);
    if (body.stock_label !== undefined) updateData.stock_label = sanitizePlainText(body.stock_label, 60);
    if (body.stock !== undefined) {
      const safeStock = Math.max(0, parseInt(String(body.stock), 10) || 0);
      updateData.stock = safeStock;
      updateData.stock_label = formatStockLabelWithCount(
        safeStock,
        typeof body.stock_label === "string" ? body.stock_label : "Tersedia",
      );
    }
    if (body.rating !== undefined) updateData.rating = Math.min(5, Math.max(1, parseFloat(body.rating) || 5.0));
    if (body.reviews_count !== undefined) updateData.reviews_count = Math.max(0, parseInt(body.reviews_count, 10) || 0);
    if (body.category_label !== undefined) updateData.category_label = sanitizePlainText(body.category_label, 80);
    if (body.description !== undefined) updateData.description = sanitizePlainText(body.description, 1000);
    if (body.is_bundle !== undefined) updateData.is_bundle = Boolean(body.is_bundle);
    if (body.is_active !== undefined) updateData.is_active = Boolean(body.is_active);
    if (body.sort_order !== undefined) updateData.sort_order = Math.max(1, parseInt(body.sort_order, 10) || 1);
    if (Array.isArray(body.variants)) {
      updateData.variants = body.variants
        .map((v: unknown) => sanitizePlainText(v, 150))
        .filter(Boolean);
    }
    if (Array.isArray(body.categories)) {
      updateData.categories = body.categories
        .map((c: unknown) => sanitizeSlug(c, 50))
        .filter(Boolean);
    }

    let { data, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", productId)
      .select()
      .single();

    // Fallback jika kolom `stock` belum ditambahkan di tabel products
    if (error && error.message?.toLowerCase().includes("stock") && "stock" in updateData) {
      const fallbackData = { ...updateData };
      delete fallbackData.stock;
      const retry = await supabase
        .from("products")
        .update(fallbackData)
        .eq("id", productId)
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
    const message = err instanceof Error ? err.message : "Gagal memperbarui produk";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const isAuth = await isAuthenticatedAdmin();
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Akses ditolak. Silakan login." }, { status: 401 });
  }

  const { id } = await params;
  const productId = parseInt(id, 10);
  if (!productId || isNaN(productId)) {
    return NextResponse.json({ ok: false, error: "ID produk tidak valid." }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Koneksi database admin Supabase belum dikonfigurasi." },
      { status: 500 }
    );
  }

  try {
    const { error } = await supabase.from("products").delete().eq("id", productId);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, message: "Produk berhasil dihapus." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menghapus produk";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
