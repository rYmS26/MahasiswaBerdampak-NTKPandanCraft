import { NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const isAuth = await isAuthenticatedAdmin();
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Akses ditolak. Silakan login." }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json({
      ok: true,
      orders: [],
      counts: { all: 0, pending_wa: 0, confirmed: 0, completed: 0, cancelled: 0 },
    });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");
  const search = searchParams.get("search")?.trim().toLowerCase();

  try {
    let query = supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });

    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data: orders, error } = await query;
    if (error) throw error;

    // Fetch status counts for dashboard pills
    const { data: allOrders, error: countsError } = await supabase
      .from("orders")
      .select("status");

    if (countsError) throw countsError;

    const counts = {
      all: allOrders?.length || 0,
      pending_wa: allOrders?.filter((o) => o.status === "pending_wa").length || 0,
      confirmed: allOrders?.filter((o) => o.status === "confirmed").length || 0,
      completed: allOrders?.filter((o) => o.status === "completed").length || 0,
      cancelled: allOrders?.filter((o) => o.status === "cancelled").length || 0,
    };

    let filteredOrders = orders || [];
    if (search) {
      filteredOrders = filteredOrders.filter(
        (o) =>
          o.order_code?.toLowerCase().includes(search) ||
          o.customer_name?.toLowerCase().includes(search) ||
          o.customer_address?.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      ok: true,
      orders: filteredOrders,
      counts,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memuat daftar pesanan";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
