import { NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { OrderStatus } from "@/types/catalog";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const ALLOWED_STATUSES: OrderStatus[] = ["pending_wa", "confirmed", "completed", "cancelled"];

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
