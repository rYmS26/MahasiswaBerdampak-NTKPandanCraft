import type {
  CartItem,
  CustomerDetails,
  ProductItem,
  ProductVariantOption,
} from "@/types/catalog";

export const DEFAULT_HERO_IMAGE = "/recomended.png";

export const SELLER_WHATSAPP = (
  process.env.NEXT_PUBLIC_SELLER_WHATSAPP?.trim() || "628815838516"
).replace(/\D/g, "");

export function parseProductVariants(
  rawVariants: unknown,
  fallbackPrice: number,
): ProductVariantOption[] {
  const basePrice = Math.max(0, Number(fallbackPrice) || 0);
  if (!Array.isArray(rawVariants)) return [];

  const result: ProductVariantOption[] = [];
  for (const item of rawVariants) {
    if (typeof item === "string") {
      const trimmed = item.trim();
      if (!trimmed) continue;
      const sepIdx = trimmed.lastIndexOf("::");
      if (sepIdx > 0) {
        const label = trimmed.slice(0, sepIdx).trim();
        const pricePart = Number(trimmed.slice(sepIdx + 2).trim());
        if (label) {
          result.push({
            label,
            price: Number.isFinite(pricePart) && pricePart > 0 ? Math.round(pricePart) : basePrice,
          });
        }
      } else {
        result.push({ label: trimmed, price: basePrice });
      }
    } else if (item && typeof item === "object" && "label" in item) {
      const obj = item as { label?: unknown; price?: unknown };
      const label = String(obj.label || "").trim();
      const priceNum = Number(obj.price);
      if (label) {
        result.push({
          label,
          price: Number.isFinite(priceNum) && priceNum > 0 ? Math.round(priceNum) : basePrice,
        });
      }
    }
  }
  return result;
}

export function serializeProductVariants(options: ProductVariantOption[]): string[] {
  if (!Array.isArray(options)) return [];
  return options
    .map((opt) => {
      const cleanLabel = String(opt.label || "").replace(/::/g, "-").trim();
      const cleanPrice = Math.max(0, Math.round(Number(opt.price) || 0));
      if (!cleanLabel) return "";
      return `${cleanLabel}::${cleanPrice}`;
    })
    .filter(Boolean);
}

export function getProductUnitPrice(product: ProductItem, variantLabel?: string): number {
  const cleanVariant = (variantLabel || "").trim();
  if (!cleanVariant) return product.price;

  const options =
    product.variantPrices && product.variantPrices.length > 0
      ? product.variantPrices
      : parseProductVariants(product.variants, product.price);

  const matched = options.find(
    (opt) => opt.label.toLowerCase() === cleanVariant.toLowerCase(),
  );
  if (matched && Number.isFinite(matched.price) && matched.price > 0) {
    return matched.price;
  }
  return product.price;
}

export function normalizeWhatsAppNumber(input: string): string {
  let digits = (input || "").replace(/\D/g, "");
  if (digits.startsWith("0")) {
    digits = "62" + digits.slice(1);
  } else if (digits.startsWith("8")) {
    digits = "62" + digits;
  }
  return digits;
}

export function formatWhatsAppDisplay(waNumber: string): string {
  const digits = normalizeWhatsAppNumber(waNumber);
  if (digits.startsWith("62") && digits.length >= 10) {
    const local = digits.slice(2);
    return `+62 ${local.slice(0, 3)}-${local.slice(3, 7)}-${local.slice(7)}`;
  }
  return digits ? `+${digits}` : "+62 881-5838-516";
}

export const SELLER_WHATSAPP_DISPLAY = formatWhatsAppDisplay(SELLER_WHATSAPP);

export const DEFAULT_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  "https://sriayuwandini.github.io/MahasiswaBerdampak-NTKPandanCraft";

export function formatRupiah(amount: number): string {
  return `Rp${new Intl.NumberFormat("id-ID").format(Number(amount) || 0)}`;
}

export function getPublicAssetUrl(relativePath: string, siteOrigin?: string): string {
  if (relativePath.startsWith("http://") || relativePath.startsWith("https://")) {
    return relativePath;
  }
  const cleanPath = relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
  const origin = (siteOrigin || "").replace(/\/$/, "");
  const isPublicHttp =
    origin.startsWith("http://") || origin.startsWith("https://");

  if (isPublicHttp && !origin.includes("localhost") && !origin.includes("127.0.0.1")) {
    return `${origin}${cleanPath}`;
  }

  return `${DEFAULT_SITE_URL.replace(/\/$/, "")}${cleanPath}`;
}

export function generateOrderCode(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `NTK-${y}${m}${d}-${rand}`;
}

export function buildWhatsAppMessage(params: {
  orderCode?: string;
  items: CartItem[];
  productMap: Map<string, ProductItem>;
  customer: CustomerDetails;
  siteOrigin?: string;
}): string {
  const { orderCode, items, productMap, customer, siteOrigin } = params;

  let totalQty = 0;
  let totalPrice = 0;

  const itemLines = items
    .map((entry, idx) => {
      const product = productMap.get(entry.slug);
      if (!product) return "";
      const qty = Math.max(1, entry.qty);
      const unitPrice = getProductUnitPrice(product, entry.variant);
      const subtotal = unitPrice * qty;
      totalQty += qty;
      totalPrice += subtotal;

      const variantTxt = entry.variant ? ` (Ukuran: ${entry.variant})` : "";
      const noteTxt = entry.note ? `\n   - Catatan item: ${entry.note}` : "";
      const photoUrl = getPublicAssetUrl(product.imagePath, siteOrigin);

      return (
        `${idx + 1}. *${product.name}${variantTxt}*\n` +
        `   - Jumlah: ${qty} pcs × ${formatRupiah(unitPrice)} = *${formatRupiah(subtotal)}*` +
        `${noteTxt}\n` +
        `   - Foto: ${photoUrl}`
      );
    })
    .filter(Boolean)
    .join("\n\n");

  const headerLine = orderCode
    ? `Halo NTK Pandan Craft, saya ingin memesan produk berikut (*Kode: ${orderCode}*):\n\n`
    : `Halo NTK Pandan Craft, saya ingin memesan produk berikut:\n\n`;

  let msg =
    headerLine +
    `*DETAIL PESANAN:*\n${itemLines}\n\n` +
    `--------------------------------\n` +
    `*Total Barang:* ${totalQty} pcs\n` +
    `*Total Harga:* ${formatRupiah(totalPrice)}\n` +
    `--------------------------------\n\n` +
    `*Data Pemesan:*\n` +
    `- Nama: ${customer.name.trim()}\n` +
    `- Alamat: ${customer.address.trim()}`;

  if (customer.note.trim()) {
    msg += `\n- Catatan: ${customer.note.trim()}`;
  }

  msg += `\n\nMohon konfirmasi ketersediaan & total ongkos kirimnya. Terima kasih!`;
  return msg;
}
