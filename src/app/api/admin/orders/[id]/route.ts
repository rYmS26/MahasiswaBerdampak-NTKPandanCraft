import { NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/admin-auth";
import {
  formatStockLabelWithCount,
  parseProductStock,
  parseProductVariants,
  serializeProductVariants,
} from "@/lib/format";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { OrderItemRow, OrderStatus } from "@/types/catalog";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface DbProductRecord {
  id: number;
  slug: string;
  name: string;
  price: number;
  stock?: number | null;
  stock_label: string;
  variants: string[] | null;
}

const ALLOWED_STATUSES: OrderStatus[] = ["pending_wa", "confirmed", "completed", "cancelled"];

async function updateProductStockInDb(
  supabase: NonNullable<ReturnType<typeof createAdminSupabaseClient>>,
  productId: number,
  newStock: number,
  newStockLabel: string,
  newVariants: string[],
) {
  const payloadWithStock = {
    stock: newStock,
    stock_label: newStockLabel,
    variants: newVariants,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("products")
    .update(payloadWithStock)
    .eq("id", productId);

  // Fallback jika kolom `stock` belum di-ALTER di tabel products
  if (error && error.message?.toLowerCase().includes("stock")) {
    const { error: fallbackError } = await supabase
      .from("products")
      .update({
        stock_label: newStockLabel,
        variants: newVariants,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);
    if (fallbackError) throw fallbackError;
    return;
  }

  if (error) throw error;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const isAuth = await isAuthenticatedAdmin();
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Akses ditolak. Silakan login." }, { status: 401 });
  }

  const { id } = await params;
  const orderId = parseInt(id, 10);
  if (!orderId || isNaN(orderId)) {
    return NextResponse.json({ ok: false, error: "ID pesanan tidak valid." }, { status: 400 });
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
    const status = body.status as OrderStatus;

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { ok: false, error: `Status tidak valid. Harus salah satu dari: ${ALLOWED_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    // 1. Ambil data pesanan saat ini beserta daftar barangnya
    const { data: existingOrder, error: fetchOrderError } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();

    if (fetchOrderError || !existingOrder) {
      return NextResponse.json(
        { ok: false, error: fetchOrderError?.message || "Pesanan tidak ditemukan." },
        { status: 404 }
      );
    }

    const previousStatus = existingOrder.status as OrderStatus;
    const wasDeducted = previousStatus === "confirmed" || previousStatus === "completed";
    const willBeDeducted = status === "confirmed" || status === "completed";
    const orderItems = (existingOrder.order_items || []) as OrderItemRow[];

    // 2. Jika transisi dari Pending/Cancelled -> Confirmed/Completed: Validasi & Kurangi Stok
    if (!wasDeducted && willBeDeducted && orderItems.length > 0) {
      const slugs = Array.from(new Set(orderItems.map((it) => it.product_slug)));
      const { data: dbProducts, error: prodError } = await supabase
        .from("products")
        .select("*")
        .in("slug", slugs);

      if (prodError) {
        return NextResponse.json(
          { ok: false, error: `Gagal memeriksa stok produk: ${prodError.message}` },
          { status: 500 }
        );
      }

      const productBySlug = new Map<string, DbProductRecord>();
      for (const p of (dbProducts || []) as DbProductRecord[]) {
        productBySlug.set(p.slug, p);
      }

      // Simulasikan dan validasi pengurangan stok seluruh item terlebih dahulu
      const plannedUpdates = new Map<
        number,
        {
          productId: number;
          stock: number;
          stockLabel: string;
          variants: string[];
        }
      >();

      // Clone state per product agar jika ada beberapa baris item dengan produk yang sama tetap akurat
      const workingState = new Map<
        string,
        {
          record: DbProductRecord;
          stock: number;
          variants: ReturnType<typeof parseProductVariants>;
        }
      >();

      for (const p of productBySlug.values()) {
        const baseStock = parseProductStock(p.stock, p.stock_label);
        const parsedVars = parseProductVariants(p.variants, Number(p.price), baseStock);
        const resolvedStock = parseProductStock(p.stock, p.stock_label, parsedVars);
        workingState.set(p.slug, {
          record: p,
          stock: resolvedStock,
          variants: parsedVars,
        });
      }

      for (const item of orderItems) {
        const state = workingState.get(item.product_slug);
        if (!state) continue;

        const qtyToDeduct = Math.max(1, Number(item.qty) || 1);
        const variantName = (item.variant || "").trim();

        if (variantName && state.variants.length > 0) {
          const vIdx = state.variants.findIndex(
            (v) => v.label.toLowerCase() === variantName.toLowerCase()
          );
          if (vIdx !== -1) {
            const currentVarStock = state.variants[vIdx].stock ?? state.stock;
            if (qtyToDeduct > currentVarStock) {
              return NextResponse.json(
                {
                  ok: false,
                  error: `Gagal mengonfirmasi pesanan: Stok "${state.record.name}" ukuran "${variantName}" tidak mencukupi (Sisa stok: ${currentVarStock} pcs, Jumlah dipesan: ${qtyToDeduct} pcs).`,
                },
                { status: 400 }
              );
            }
            state.variants[vIdx].stock = Math.max(0, currentVarStock - qtyToDeduct);
          }
        }

        if (qtyToDeduct > state.stock) {
          return NextResponse.json(
            {
              ok: false,
              error: `Gagal mengonfirmasi pesanan: Stok "${state.record.name}" tidak mencukupi (Sisa stok saat ini: ${state.stock} pcs, Jumlah dipesan: ${qtyToDeduct} pcs).`,
            },
            { status: 400 }
          );
        }

        if (state.variants.length > 0 && state.variants.some((v) => v.stock !== undefined)) {
          state.stock = state.variants.reduce((sum, v) => sum + Math.max(0, v.stock ?? 0), 0);
        } else {
          state.stock = Math.max(0, state.stock - qtyToDeduct);
        }

        const updatedLabel = formatStockLabelWithCount(state.stock, state.record.stock_label);
        plannedUpdates.set(state.record.id, {
          productId: state.record.id,
          stock: state.stock,
          stockLabel: updatedLabel,
          variants: serializeProductVariants(state.variants),
        });
      }

      // Eksekusi pengurangan stok ke tabel products
      for (const upd of plannedUpdates.values()) {
        await updateProductStockInDb(
          supabase,
          upd.productId,
          upd.stock,
          upd.stockLabel,
          upd.variants
        );
      }
    }

    // 3. Jika sebelumnya sudah Confirmed lalu Dibatalkan (Cancelled): Kembalikan (Restock) stok barang
    if (wasDeducted && !willBeDeducted && orderItems.length > 0) {
      const slugs = Array.from(new Set(orderItems.map((it) => it.product_slug)));
      const { data: dbProducts } = await supabase
        .from("products")
        .select("*")
        .in("slug", slugs);

      const workingState = new Map<
        string,
        {
          record: DbProductRecord;
          stock: number;
          variants: ReturnType<typeof parseProductVariants>;
        }
      >();

      for (const p of (dbProducts || []) as DbProductRecord[]) {
        const baseStock = parseProductStock(p.stock, p.stock_label);
        const parsedVars = parseProductVariants(p.variants, Number(p.price), baseStock);
        const resolvedStock = parseProductStock(p.stock, p.stock_label, parsedVars);
        workingState.set(p.slug, {
          record: p,
          stock: resolvedStock,
          variants: parsedVars,
        });
      }

      for (const item of orderItems) {
        const state = workingState.get(item.product_slug);
        if (!state) continue;

        const qtyToRestore = Math.max(1, Number(item.qty) || 1);
        const variantName = (item.variant || "").trim();

        if (variantName && state.variants.length > 0) {
          const vIdx = state.variants.findIndex(
            (v) => v.label.toLowerCase() === variantName.toLowerCase()
          );
          if (vIdx !== -1) {
            const currentVarStock = state.variants[vIdx].stock ?? state.stock;
            state.variants[vIdx].stock = currentVarStock + qtyToRestore;
          }
        }

        if (state.variants.length > 0 && state.variants.some((v) => v.stock !== undefined)) {
          state.stock = state.variants.reduce((sum, v) => sum + Math.max(0, v.stock ?? 0), 0);
        } else {
          state.stock = state.stock + qtyToRestore;
        }

        const updatedLabel = formatStockLabelWithCount(state.stock, state.record.stock_label);
        await updateProductStockInDb(
          supabase,
          state.record.id,
          state.stock,
          updatedLabel,
          serializeProductVariants(state.variants)
        );
      }
    }

    // 4. Perbarui status pesanan
    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId)
      .select("*, order_items(*)")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, order: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memperbarui status pesanan";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
