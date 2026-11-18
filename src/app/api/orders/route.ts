import { NextResponse } from "next/server";
import { getCatalogData } from "@/lib/catalog";
import {
  buildWhatsAppMessage,
  generateOrderCode,
  getProductAvailableStock,
  getProductUnitPrice,
} from "@/lib/format";
import {
  checkRateLimit,
  getClientIp,
  validateCreateOrderPayload,
} from "@/lib/security";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createPublicCatalogClient } from "@/lib/supabase/server";
import type { ProductItem } from "@/types/catalog";

export async function POST(request: Request) {
  // 1. Mitigasi DDoS & Anti-Spam Rate Limiting per IP
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit({
    key: `create_order:${clientIp}`,
    limit: 6,
    windowMs: 10 * 60 * 1000, // Maksimal 6 pesanan per 10 menit per IP
    minIntervalMs: 10 * 1000, // Cooldown 10 detik antar pengiriman pesanan
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error:
          rateLimit.reason ||
          "Terlalu banyak pengiriman pesanan dalam waktu singkat. Silakan tunggu beberapa saat.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSec) },
      },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Format payload pesanan tidak valid." },
      { status: 400 },
    );
  }

  // 2. Validasi Skema Input, Sanitasi XSS, & Pengecekan Honeypot Anti-Bot
  const validation = validateCreateOrderPayload(rawBody);
  if (!validation.ok) {
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: validation.isBot ? 422 : 400 },
    );
  }

  const { customer, items: rawItems, siteOrigin } = validation.data;
  const { name, address, note } = customer;

  // 3. Ambil Katalog & Harga/Stok Asli Langsung dari Database Server (Anti-Tampering)
  const catalogPromise = getCatalogData();
  const dbClient = createAdminSupabaseClient() || createPublicCatalogClient();
  const catalog = await catalogPromise;

  const productMap = new Map<string, ProductItem>(
    [...catalog.products, ...catalog.bundles].map((item) => [item.slug, item]),
  );

  // Hitung akumulasi jumlah beli per produk & variasi untuk validasi Multibuy Limit
  const requestedByVariantKey = new Map<string, number>();
  const requestedByProductSlug = new Map<string, number>();

  for (const entry of rawItems) {
    const product = productMap.get(entry.slug);
    if (!product) {
      return NextResponse.json(
        { ok: false, error: `Produk "${entry.slug}" tidak ditemukan di katalog.` },
        { status: 400 },
      );
    }

    const variant = (entry.variant || "").trim();
    const variantKey = `${product.slug}::${variant.toLowerCase()}`;
    const nextVariantQty = (requestedByVariantKey.get(variantKey) ?? 0) + entry.qty;
    const nextProductQty = (requestedByProductSlug.get(product.slug) ?? 0) + entry.qty;

    requestedByVariantKey.set(variantKey, nextVariantQty);
    requestedByProductSlug.set(product.slug, nextProductQty);

    const availableVariantStock = getProductAvailableStock(product, variant);
    const availableTotalStock = Math.max(0, product.stock ?? 0);

    if (availableVariantStock <= 0 || availableTotalStock <= 0) {
      const varLabel = variant ? ` (Ukuran: ${variant})` : "";
      return NextResponse.json(
        {
          ok: false,
          error: `Maaf, stok untuk produk "${product.name}${varLabel}" sedang habis (Sold Out) dan tidak dapat dipesan.`,
        },
        { status: 400 },
      );
    }

    if (nextVariantQty > availableVariantStock) {
      const varLabel = variant ? ` ukuran ${variant}` : "";
      return NextResponse.json(
        {
          ok: false,
          error: `Jumlah pembelian untuk "${product.name}"${varLabel} (${nextVariantQty} pcs) melebihi sisa stok yang tersedia (${availableVariantStock} pcs).`,
        },
        { status: 400 },
      );
    }

    if (nextProductQty > availableTotalStock) {
      return NextResponse.json(
        {
          ok: false,
          error: `Total pembelian untuk "${product.name}" (${nextProductQty} pcs) melebihi total stok tersedia (${availableTotalStock} pcs).`,
        },
        { status: 400 },
      );
    }
  }

  const normalizedItems = [];
  let totalQty = 0;
  let totalPrice = 0;

  for (const entry of rawItems) {
    const product = productMap.get(entry.slug)!;
    const qty = entry.qty;
    const variant = (entry.variant || "").trim();
    // Harga diambil murni dari database server (mengabaikan input harga dari client)
    const unitPrice = getProductUnitPrice(product, variant);
    const subtotal = unitPrice * qty;
    totalQty += qty;
    totalPrice += subtotal;

    normalizedItems.push({
      product,
      cartItem: {
        slug: product.slug,
        qty,
        variant,
        note: (entry.note || "").trim(),
      },
      unitPrice,
      subtotal,
    });
  }

  const orderCode = generateOrderCode();
  const whatsappMessage = buildWhatsAppMessage({
    orderCode,
    items: normalizedItems.map((n) => n.cartItem),
    productMap,
    customer: { name, address, note },
    siteOrigin,
  });

  let persisted = false;

  // Catatan Penting: Saat checkout, pesanan disimpan sebagai "pending_wa"
  // dan stok BELUM dikurangi sampai Admin mengonfirmasi pesanan di Dashboard Admin.
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
        const lineRows = normalizedItems.map(
          ({ product, cartItem, unitPrice, subtotal }) => ({
            order_id: orderRow.id,
            product_id: product.id ?? null,
            product_slug: product.slug,
            product_name: product.name,
            variant: cartItem.variant || null,
            item_note: cartItem.note || null,
            unit_price: unitPrice,
            qty: cartItem.qty,
            subtotal,
            image_path: product.imagePath,
          }),
        );

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
