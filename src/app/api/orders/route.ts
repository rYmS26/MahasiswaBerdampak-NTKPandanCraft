import { NextResponse } from "next/server";
import { getCatalogData } from "@/lib/catalog";
import { buildWhatsAppMessage, generateOrderCode } from "@/lib/format";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createPublicCatalogClient } from "@/lib/supabase/server";
import type { CreateOrderRequest, ProductItem } from "@/types/catalog";

export async function POST(request: Request) {
  let body: CreateOrderRequest;
  try {
    body = (await request.json()) as CreateOrderRequest;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Format payload pesanan tidak valid." },
      { status: 400 },
    );
  }

  const name = body.customer?.name?.trim() || "";
  const address = body.customer?.address?.trim() || "";
  const note = body.customer?.note?.trim() || "";
  const rawItems = Array.isArray(body.items) ? body.items : [];

  if (name.length < 2 || address.length < 3) {
    return NextResponse.json(
      {
        ok: false,
        error: "Mohon lengkapi Nama Pemesan dan Alamat / Kota Pengiriman.",
      },
      { status: 400 },
    );
  }

  if (rawItems.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Keranjang belanja masih kosong." },
      { status: 400 },
    );
  }

  // Start fetching authoritative catalog immediately
  const catalogPromise = getCatalogData();
  const dbClient = createAdminSupabaseClient() || createPublicCatalogClient();
  const catalog = await catalogPromise;

  const productMap = new Map<string, ProductItem>(
    [...catalog.products, ...catalog.bundles].map((item) => [item.slug, item]),
  );

  const normalizedItems = [];
  let totalQty = 0;
  let totalPrice = 0;

  for (const entry of rawItems) {
    const product = productMap.get(entry.slug);
    if (!product) {
      return NextResponse.json(
        { ok: false, error: `Produk "${entry.slug}" tidak ditemukan.` },
        { status: 400 },
      );
    }

    const qty = Math.min(999, Math.max(1, Math.floor(Number(entry.qty) || 1)));
    const subtotal = product.price * qty;
    totalQty += qty;
    totalPrice += subtotal;

    normalizedItems.push({
      product,
      cartItem: {
        slug: product.slug,
        qty,
        variant: (entry.variant || "").trim(),
        note: (entry.note || "").trim(),
      },
      subtotal,
    });
  }

  const orderCode = generateOrderCode();
  const whatsappMessage = buildWhatsAppMessage({
    orderCode,
    items: normalizedItems.map((n) => n.cartItem),
    productMap,
    customer: { name, address, note },
    siteOrigin: body.siteOrigin,
  });

  let persisted = false;

  if (dbClient) {
    try {
      const { data: orderRow, error: orderError } = await dbClient
        .from("orders")
        .insert({
          order_code: orderCode,
          customer_name: name,
          customer_address: address,
          customer_note: note || null,
          total_qty: totalQty,
          total_price: totalPrice,
          whatsapp_message: whatsappMessage,
          status: "pending_wa",
        })
        .select("id")
        .single();

      if (!orderError && orderRow?.id) {
        const lineRows = normalizedItems.map(({ product, cartItem, subtotal }) => ({
          order_id: orderRow.id,
          product_id: product.id ?? null,
          product_slug: product.slug,
          product_name: product.name,
          variant: cartItem.variant || null,
          item_note: cartItem.note || null,
          unit_price: product.price,
          qty: cartItem.qty,
          subtotal,
          image_path: product.imagePath,
        }));

        const { error: itemsError } = await dbClient
          .from("order_items")
          .insert(lineRows);

        if (itemsError) {
          await dbClient.from("orders").delete().eq("id", orderRow.id);
        } else {
          persisted = true;
        }
      }
    } catch {
      persisted = false;
    }
  }

  return NextResponse.json({
    ok: true,
    orderCode,
    persisted,
    totalQty,
    totalPrice,
    whatsappMessage,
  });
}
