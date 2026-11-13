import { NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { OrderRow, SalesReportSummary } from "@/types/catalog";

export async function GET(request: Request) {
  const isAuth = await isAuthenticatedAdmin();
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Akses ditolak. Silakan login." }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    const emptySummary: SalesReportSummary = {
      period: "all",
      totalRevenue: 0,
      confirmedOrdersCount: 0,
      totalUnitsSold: 0,
      averageOrderValue: 0,
      topProducts: [],
      orders: [],
    };
    return NextResponse.json({ ok: true, summary: emptySummary });
  }

  const { searchParams } = new URL(request.url);
  const period = (searchParams.get("period") || "all") as "today" | "7days" | "30days" | "all";

  try {
    let query = supabase
      .from("orders")
      .select("*, order_items(*)")
      .in("status", ["confirmed", "completed"])
      .order("created_at", { ascending: false });

    // Date filtering
    const now = new Date();
    if (period === "today") {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      query = query.gte("created_at", startOfDay);
    } else if (period === "7days") {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte("created_at", sevenDaysAgo);
    } else if (period === "30days") {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte("created_at", thirtyDaysAgo);
    }

    const { data: rawOrders, error } = await query;
    if (error) throw error;

    const orders = (rawOrders || []) as OrderRow[];

    let totalRevenue = 0;
    let totalUnitsSold = 0;
    const productStats = new Map<
      string,
      { slug: string; name: string; imagePath: string; unitsSold: number; revenue: number }
    >();

    for (const order of orders) {
      totalRevenue += order.total_price;
      totalUnitsSold += order.total_qty;

      if (Array.isArray(order.order_items)) {
        for (const item of order.order_items) {
          const existing = productStats.get(item.product_slug) || {
            slug: item.product_slug,
            name: item.product_name,
            imagePath: item.image_path,
            unitsSold: 0,
            revenue: 0,
          };
          existing.unitsSold += item.qty;
          existing.revenue += item.subtotal;
          productStats.set(item.product_slug, existing);
        }
      }
    }

    const topProducts = Array.from(productStats.values()).sort(
      (a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue
    );

    const confirmedOrdersCount = orders.length;
    const averageOrderValue = confirmedOrdersCount > 0 ? Math.round(totalRevenue / confirmedOrdersCount) : 0;

    const summary: SalesReportSummary = {
      period,
      totalRevenue,
      confirmedOrdersCount,
      totalUnitsSold,
      averageOrderValue,
      topProducts,
      orders,
    };

    return NextResponse.json({ ok: true, summary });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memuat laporan penjualan";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
