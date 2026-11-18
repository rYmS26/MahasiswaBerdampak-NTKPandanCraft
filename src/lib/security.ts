import type { CartItem, CustomerDetails } from "@/types/catalog";

interface RateLimitBucket {
  timestamps: number[];
  lastRequestAt: number;
}

const rateLimitStore = new Map<string, RateLimitBucket>();
const MAX_STORE_KEYS = 5000;

function cleanupRateLimitStore(now: number, maxWindowMs: number) {
  if (rateLimitStore.size <= MAX_STORE_KEYS) return;
  for (const [key, bucket] of rateLimitStore.entries()) {
    if (now - bucket.lastRequestAt > maxWindowMs) {
      rateLimitStore.delete(key);
    }
  }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const realIp =
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-vercel-forwarded-for");
  if (realIp) {
    return realIp.split(",")[0].trim().slice(0, 64);
  }
  return "127.0.0.1";
}

export function checkRateLimit(params: {
  key: string;
  limit: number;
  windowMs: number;
  minIntervalMs?: number;
}): { allowed: boolean; retryAfterSec: number; reason?: string } {
  const { key, limit, windowMs, minIntervalMs = 0 } = params;
  const now = Date.now();

  cleanupRateLimitStore(now, Math.max(windowMs, 15 * 60 * 1000));

  const bucket = rateLimitStore.get(key) || {
    timestamps: [],
    lastRequestAt: 0,
  };

  // Cooldown check (minimum interval between consecutive requests)
  if (minIntervalMs > 0 && bucket.lastRequestAt > 0) {
    const elapsed = now - bucket.lastRequestAt;
    if (elapsed < minIntervalMs) {
      const retryAfterSec = Math.max(1, Math.ceil((minIntervalMs - elapsed) / 1000));
      return {
        allowed: false,
        retryAfterSec,
        reason: `Mohon tunggu ${retryAfterSec} detik sebelum mengirim permintaan lagi.`,
      };
    }
  }

  // Sliding window filter
  const validTimestamps = bucket.timestamps.filter((ts) => now - ts < windowMs);
  if (validTimestamps.length >= limit) {
    const oldest = validTimestamps[0] || now;
    const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
    return {
      allowed: false,
      retryAfterSec,
      reason: `Terlalu banyak permintaan dari perangkat Anda. Silakan coba lagi dalam ${retryAfterSec} detik.`,
    };
  }

  validTimestamps.push(now);
  rateLimitStore.set(key, {
    timestamps: validTimestamps,
    lastRequestAt: now,
  });

  return { allowed: true, retryAfterSec: 0 };
}

/**
 * Sanitizes user-supplied text to prevent XSS, HTML injection, and control character abuse.
 */
export function sanitizePlainText(input: unknown, maxLength = 300): string {
  if (input === null || input === undefined) return "";
  let str = String(input);

  // Strip script/style blocks and all HTML tags
  str = str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]*>/g, "");

  // Strip dangerous URI schemes and inline event handlers
  str = str
    .replace(/\b(?:javascript|vbscript|data)\s*:/gi, "")
    .replace(/\bon[a-z]+\s*=/gi, "");

  // Remove ASCII control characters except newline/tab
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Normalize whitespace and trim
  return str.trim().slice(0, maxLength);
}

export function sanitizeSlug(input: unknown, maxLength = 120): string {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, maxLength);
}

export function sanitizeUrlOrPath(input: unknown, maxLength = 500): string {
  const raw = sanitizePlainText(input, maxLength);
  if (!raw) return "";
  if (raw.startsWith("/")) {
    // Disallow path traversal
    return raw.replace(/\.\./g, "");
  }
  try {
    const parsed = new URL(raw);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.toString().slice(0, maxLength);
    }
  } catch {
    // Invalid URL
  }
  return "";
}

export interface ValidatedOrderInput {
  customer: CustomerDetails;
  items: CartItem[];
  siteOrigin?: string;
}

export function validateCreateOrderPayload(
  rawBody: unknown,
): { ok: true; data: ValidatedOrderInput } | { ok: false; error: string; isBot?: boolean } {
  if (!rawBody || typeof rawBody !== "object") {
    return { ok: false, error: "Format payload pesanan tidak valid." };
  }

  const body = rawBody as Record<string, unknown>;

  // 1. Anti-bot Honeypot check
  if (typeof body.honeypot === "string" && body.honeypot.trim().length > 0) {
    return { ok: false, error: "Permintaan terdeteksi sebagai spam/bot.", isBot: true };
  }

  // 2. Anti-bot Timing check (if formLoadedAt is provided, require at least 600ms human interaction)
  if (typeof body.formLoadedAt === "number" && Number.isFinite(body.formLoadedAt)) {
    const elapsed = Date.now() - body.formLoadedAt;
    if (elapsed >= 0 && elapsed < 600) {
      return { ok: false, error: "Pengiriman terlalu cepat. Mohon periksa kembali data Anda.", isBot: true };
    }
  }

  const rawCustomer =
    body.customer && typeof body.customer === "object"
      ? (body.customer as Record<string, unknown>)
      : {};

  const name = sanitizePlainText(rawCustomer.name, 100);
  const address = sanitizePlainText(rawCustomer.address, 300);
  const note = sanitizePlainText(rawCustomer.note, 400);

  if (name.length < 2) {
    return { ok: false, error: "Nama Pemesan wajib diisi (minimal 2 karakter)." };
  }
  if (address.length < 3) {
    return { ok: false, error: "Alamat / Kota Pengiriman wajib diisi (minimal 3 karakter)." };
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return { ok: false, error: "Keranjang belanja masih kosong." };
  }

  if (body.items.length > 30) {
    return { ok: false, error: "Jumlah jenis barang dalam satu pesanan melebihi batas maksimal (30 jenis)." };
  }

  const sanitizedItems: CartItem[] = [];
  for (const rawItem of body.items) {
    if (!rawItem || typeof rawItem !== "object") {
      return { ok: false, error: "Data item pesanan tidak valid." };
    }
    const itemObj = rawItem as Record<string, unknown>;
    const slug = sanitizeSlug(itemObj.slug, 120);
    const qtyNum = Number(itemObj.qty);

    if (!slug) {
      return { ok: false, error: "Slug produk pada keranjang tidak valid." };
    }
    if (!Number.isFinite(qtyNum) || Math.floor(qtyNum) < 1 || Math.floor(qtyNum) > 999) {
      return { ok: false, error: `Jumlah pembelian untuk "${slug}" harus antara 1 hingga 999 pcs.` };
    }

    const variant = sanitizePlainText(itemObj.variant, 80);
    const itemNote = sanitizePlainText(itemObj.note, 200);

    sanitizedItems.push({
      slug,
      qty: Math.floor(qtyNum),
      variant,
      note: itemNote,
    });
  }

  const siteOrigin =
    typeof body.siteOrigin === "string"
      ? sanitizeUrlOrPath(body.siteOrigin, 200)
      : undefined;

  return {
    ok: true,
    data: {
      customer: { name, address, note },
      items: sanitizedItems,
      siteOrigin,
    },
  };
}
