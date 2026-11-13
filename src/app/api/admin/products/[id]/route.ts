import { NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/admin-auth";
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

    if (body.name !== undefined) updateData.name = String(body.name).trim();
    if (body.slug !== undefined) updateData.slug = String(body.slug).trim().toLowerCase();
    if (body.price !== undefined) updateData.price = Math.max(0, parseInt(body.price, 10) || 0);
    if (body.image_path !== undefined) updateData.image_path = String(body.image_path).trim();
    if (body.dimensions !== undefined) updateData.dimensions = String(body.dimensions).trim();
    if (body.badge !== undefined) updateData.badge = String(body.badge).trim();
    if (body.stock_label !== undefined) updateData.stock_label = String(body.stock_label).trim();
    if (body.rating !== undefined) updateData.rating = parseFloat(body.rating) || 5.0;
    if (body.reviews_count !== undefined) updateData.reviews_count = parseInt(body.reviews_count, 10) || 0;
    if (body.category_label !== undefined) updateData.category_label = String(body.category_label).trim();
    if (body.description !== undefined) updateData.description = String(body.description).trim();
    if (body.is_bundle !== undefined) updateData.is_bundle = Boolean(body.is_bundle);
    if (body.is_active !== undefined) updateData.is_active = Boolean(body.is_active);
    if (body.sort_order !== undefined) updateData.sort_order = parseInt(body.sort_order, 10) || 0;
    if (Array.isArray(body.variants)) updateData.variants = body.variants;
    if (Array.isArray(body.categories)) updateData.categories = body.categories;

    const { data, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", productId)
      .select()
      .single();

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
