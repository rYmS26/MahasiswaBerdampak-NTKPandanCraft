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
  fallbackStock = 20,
): ProductVariantOption[] {
  const basePrice = Math.max(0, Number(fallbackPrice) || 0);
  const defaultStock = Math.max(0, Math.floor(Number(fallbackStock) || 0));
  if (!Array.isArray(rawVariants)) return [];

  const result: ProductVariantOption[] = [];
  for (const item of rawVariants) {
    if (typeof item === "string") {
      const trimmed = item.trim();
      if (!trimmed) continue;
      const parts = trimmed.split("::").map((p) => p.trim());
      if (parts.length >= 3) {
        const label = parts.slice(0, parts.length - 2).join(" - ").trim();
        const pricePart = Number(parts[parts.length - 2]);
        const stockPart = Number(parts[parts.length - 1]);
        if (label) {
          result.push({
            label,
            price: Number.isFinite(pricePart) && pricePart > 0 ? Math.round(pricePart) : basePrice,
            stock: Number.isFinite(stockPart) && stockPart >= 0 ? Math.floor(stockPart) : defaultStock,
          });
        }
      } else if (parts.length === 2) {
        const [label, priceRaw] = parts;
        const pricePart = Number(priceRaw);
        if (label) {
          result.push({
            label,
            price: Number.isFinite(pricePart) && pricePart > 0 ? Math.round(pricePart) : basePrice,
            stock: defaultStock,
          });
        }
      } else {
        result.push({ label: trimmed, price: basePrice, stock: defaultStock });
      }
    } else if (item && typeof item === "object" && "label" in item) {
      const obj = item as { label?: unknown; price?: unknown; stock?: unknown };
      const label = String(obj.label || "").trim();
      const priceNum = Number(obj.price);
      const stockNum = Number(obj.stock);
      if (label) {
        result.push({
          label,
          price: Number.isFinite(priceNum) && priceNum > 0 ? Math.round(priceNum) : basePrice,
          stock: Number.isFinite(stockNum) && stockNum >= 0 ? Math.floor(stockNum) : defaultStock,
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
      if (opt.stock !== undefined && Number.isFinite(Number(opt.stock))) {
        const cleanStock = Math.max(0, Math.floor(Number(opt.stock)));
        return `${cleanLabel}::${cleanPrice}::${cleanStock}`;
      }
      return `${cleanLabel}::${cleanPrice}`;
    })
    .filter(Boolean);
}

export function parseProductStock(
  rawStock: unknown,
  stockLabel?: string,
  variantOptions?: ProductVariantOption[],
): number {
  if (rawStock !== undefined && rawStock !== null && rawStock !== "") {
    const num = Number(rawStock);
    if (Number.isFinite(num)) {
      return Math.max(0, Math.floor(num));
    }
  }

  const label = String(stockLabel || "").trim();
  const lower = label.toLowerCase();
  if (lower === "habis" || lower.includes("stok habis") || lower.includes("sold out") || lower.includes("stok kosong")) {
    return 0;
  }

  const match = label.match(/(?:stok|tersisa|sisa)\s*:?\s*(\d+)/i);
  if (match && match[1]) {
    const parsed = parseInt(match[1], 10);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }

  if (Array.isArray(variantOptions) && variantOptions.length > 0) {
    const hasExplicitStock = variantOptions.some((v) => v.stock !== undefined);
    if (hasExplicitStock) {
      return variantOptions.reduce((sum, v) => sum + Math.max(0, v.stock ?? 0), 0);
    }
  }

  return 20;
}

export function formatStockLabelWithCount(stock: number, rawLabel?: string): string {
  const safeStock = Math.max(0, Math.floor(Number(stock) || 0));
  if (safeStock <= 0) {
    return "Habis";
  }

  let base = String(rawLabel || "Tersedia")
    .replace(/\s*\(?\b(?:stok|sisa)\s*:?\s*\d+\s*(?:pcs)?\)?/gi, "")
    .trim();

  if (!base || base.toLowerCase() === "habis" || /^tersisa\s+\d+$/i.test(base)) {
    base = safeStock <= 5 ? `Tersisa ${safeStock}` : "Tersedia";
  }

  if (/^tersisa\s+\d+$/i.test(base)) {
    return `Tersisa ${safeStock}`;
  }

  return `${base} (Stok: ${safeStock})`;
}

export function getProductUnitPrice(product: ProductItem, variantLabel?: string): number {
  const cleanVariant = (variantLabel || "").trim();
  if (!cleanVariant) return product.price;

  const options =
    product.variantPrices && product.variantPrices.length > 0
      ? product.variantPrices
      : parseProductVariants(product.variants, product.price, product.stock);

  const matched = options.find(
    (opt) => opt.label.toLowerCase() === cleanVariant.toLowerCase(),
  );
  if (matched && Number.isFinite(matched.price) && matched.price > 0) {
    return matched.price;
  }
  return product.price;
}

export function getProductAvailableStock(product: ProductItem, variantLabel?: string): number {
  const productStock = Math.max(0, Math.floor(Number(product.stock ?? 0)));
  if (productStock <= 0) return 0;

  const cleanVariant = (variantLabel || "").trim();
  if (!cleanVariant) return productStock;

  const options =
    product.variantPrices && product.variantPrices.length > 0
      ? product.variantPrices
      : parseProductVariants(product.variants, product.price, productStock);

  const matched = options.find(
    (opt) => opt.label.toLowerCase() === cleanVariant.toLowerCase(),
  );
  if (matched && matched.stock !== undefined && Number.isFinite(matched.stock)) {
    return Math.max(0, Math.floor(matched.stock));
  }
  return productStock;
}

export function isProductOutOfStock(product: ProductItem, variantLabel?: string): boolean {
  return getProductAvailableStock(product, variantLabel) <= 0;
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
