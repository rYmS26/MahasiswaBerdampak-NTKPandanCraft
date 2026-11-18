"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Minus,
  Plus,
  Ruler,
  ShoppingBag,
  ShoppingCart,
  Star,
  X,
} from "lucide-react";
import {
  formatRupiah,
  getProductAvailableStock,
  getProductUnitPrice,
  parseProductVariants,
} from "@/lib/format";
import type { CartItem, ProductItem } from "@/types/catalog";

interface ProductDetailModalProps {
  product: ProductItem;
  cart?: CartItem[];
  onClose: () => void;
  onAdd: (
    product: ProductItem,
    qty: number,
    variant: string,
    note: string,
    openCartAfter: boolean,
  ) => void;
}

export function ProductDetailModal({
  product,
  cart = [],
  onClose,
  onAdd,
}: ProductDetailModalProps) {
  const variantOptions =
    product.variantPrices && product.variantPrices.length > 0
      ? product.variantPrices
      : parseProductVariants(product.variants, product.price, product.stock);

  const firstAvailableVariant =
    variantOptions.find((v) => (v.stock ?? product.stock) > 0)?.label ||
    variantOptions[0]?.label ||
    product.variants[0] ||
    "";

  const [variant, setVariant] = useState(firstAvailableVariant);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");

  const availableStock = getProductAvailableStock(product, variant);
  const alreadyInCartQty = cart
    .filter(
      (c) =>
        c.slug === product.slug &&
        (c.variant || "").toLowerCase() === (variant || "").toLowerCase(),
    )
    .reduce((sum, c) => sum + c.qty, 0);

  const maxAddableQty = Math.max(0, availableStock - alreadyInCartQty);
  const effectiveMaxQty = maxAddableQty > 0 ? maxAddableQty : Math.max(1, availableStock);
  const isOutOfStock = availableStock <= 0;
  const isCartMaxed = !isOutOfStock && maxAddableQty <= 0;

  const safeQty = Math.min(Math.max(1, qty), effectiveMaxQty);
  const unitPrice = getProductUnitPrice(product, variant);
  const subtotal = unitPrice * safeQty;
  const hasMultiplePrices =
    variantOptions.length > 1 &&
    new Set(variantOptions.map((o) => o.price)).size > 1;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/55 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-title"
    >
      <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-stone-200">
        <div className="grid grid-cols-1 md:grid-cols-12">
          <div className="md:col-span-6 bg-cream-soft p-4 sm:p-6 flex flex-col justify-between">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-white border border-stone-200/80">
              <Image
                src={product.imagePath}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 400px"
                className="object-cover"
              />
              <span
                className={`absolute top-3 left-3 px-3 py-1 rounded-full text-white text-[11px] font-semibold uppercase tracking-wider ${
                  isOutOfStock ? "bg-red-600" : "bg-forest"
                }`}
              >
                {isOutOfStock ? "Stok Habis" : product.badge}
              </span>
              <span
                className={`absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/95 text-[11px] font-semibold border ${
                  isOutOfStock
                    ? "text-red-600 border-red-200"
                    : "text-olive border-stone-200"
                }`}
              >
                {isOutOfStock
                  ? "Sold Out (0 pcs)"
                  : `Sisa Stok: ${availableStock} pcs`}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs text-stone-600 bg-white px-3 py-2 rounded-xl border border-stone-200/80">
              <Ruler className="w-4 h-4 text-olive flex-shrink-0" />
              <span className="font-medium">{product.dimensions}</span>
            </div>
          </div>

          <div className="md:col-span-6 p-5 sm:p-6 flex flex-col justify-between gap-5">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-olive">
                    {product.categoryLabel}
                  </span>
                  <h3
                    id="detail-title"
                    className="text-xl sm:text-2xl font-bold text-forest mt-0.5"
                  >
                    {product.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 flex-shrink-0"
                  aria-label="Tutup detail produk"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-3 mt-2">
                <div className="inline-flex items-center gap-1 text-xs font-medium text-stone-600">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-forest">{product.rating}</span>
                  <span className="text-stone-500">({product.reviewsCount} ulasan)</span>
                </div>
                <span className="text-stone-300">•</span>
                <span className="text-xs font-medium text-olive">
                  Anti-Jamur &amp; Handmade
                </span>
              </div>

              <div className="flex flex-wrap items-baseline gap-2.5 mt-3">
                <p className="text-2xl font-bold text-forest tabular-nums">
                  {formatRupiah(unitPrice)}
                </p>
                {variant ? (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-olive/10 text-olive border border-olive/20">
                    Ukuran: {variant}
                  </span>
                ) : null}
              </div>

              <p className="text-sm text-stone-600 leading-relaxed mt-3">
                {product.description}
              </p>

              {variantOptions.length > 0 ? (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600">
                      Pilih Ukuran
                    </label>
                    {hasMultiplePrices ? (
                      <span className="text-[11px] text-olive font-medium">
                        Harga menyesuaikan ukuran
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {variantOptions.map((opt) => {
                      const active = variant === opt.label;
                      const optStock = opt.stock !== undefined ? opt.stock : product.stock;
                      const optSoldOut = optStock <= 0;
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => {
                            setVariant(opt.label);
                            setQty(1);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                            active
                              ? "bg-olive text-white border-olive shadow-sm ring-2 ring-olive/25"
                              : optSoldOut
                              ? "bg-stone-100 text-stone-400 border-stone-200 line-through"
                              : "bg-cream-soft text-forest border-stone-200 hover:border-olive"
                          }`}
                        >
                          <span>{opt.label}</span>
                          {hasMultiplePrices ? (
                            <span
                              className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
                                active
                                  ? "bg-white/20 text-white"
                                  : "bg-white text-olive border border-stone-200/80"
                              }`}
                            >
                              {formatRupiah(opt.price)}
                            </span>
                          ) : null}
                          <span
                            className={`text-[10px] ${
                              active
                                ? "text-white/90"
                                : optSoldOut
                                ? "text-red-500 font-bold"
                                : "text-stone-500"
                            }`}
                          >
                            ({optSoldOut ? "Habis" : `Stok ${optStock}`})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="mt-4">
                <label
                  htmlFor="detail-item-note"
                  className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5"
                >
                  Catatan Produk (Opsional)
                </label>
                <input
                  id="detail-item-note"
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Contoh: warna natural, bungkus rapi"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm text-forest focus:outline-none focus:border-olive"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-stone-200 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                      Jumlah:
                    </span>
                    <div className="inline-flex items-center rounded-full border border-stone-200 bg-cream-soft">
                      <button
                        type="button"
                        disabled={isOutOfStock || safeQty <= 1}
                        onClick={() => setQty((q) => Math.max(1, Math.min(effectiveMaxQty, q) - 1))}
                        className="w-9 h-9 flex items-center justify-center text-forest hover:bg-stone-200/70 disabled:opacity-40 disabled:cursor-not-allowed rounded-l-full"
                        aria-label="Kurangi jumlah"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        disabled={isOutOfStock || isCartMaxed}
                        value={isOutOfStock ? 0 : safeQty}
                        onChange={(e) => {
                          const raw = parseInt(e.target.value.replace(/\D/g, ""), 10);
                          if (isNaN(raw) || raw < 1) {
                            setQty(1);
                          } else {
                            setQty(Math.min(effectiveMaxQty, raw));
                          }
                        }}
                        aria-label="Jumlah beli"
                        className="w-11 text-center text-sm font-bold tabular-nums text-forest bg-transparent focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={isOutOfStock || isCartMaxed || safeQty >= effectiveMaxQty}
                        onClick={() => setQty((q) => Math.min(effectiveMaxQty, q + 1))}
                        className="w-9 h-9 flex items-center justify-center text-forest hover:bg-stone-200/70 disabled:opacity-40 disabled:cursor-not-allowed rounded-r-full"
                        aria-label="Tambah jumlah"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <span className="text-[11px] text-stone-500">
                    {isOutOfStock
                      ? "Stok produk ini sedang habis"
                      : isCartMaxed
                      ? `Seluruh stok (${availableStock} pcs) sudah ada di keranjang Anda`
                      : `Maks. beli: ${maxAddableQty} pcs (Sisa stok: ${availableStock} pcs)`}
                  </span>
                </div>

                <div className="text-right">
                  <span className="block text-[11px] text-stone-500">Subtotal</span>
                  <span className="text-base font-bold text-olive tabular-nums">
                    {formatRupiah(isOutOfStock ? 0 : subtotal)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={isOutOfStock || isCartMaxed}
                  onClick={() => onAdd(product, safeQty, variant, note.trim(), false)}
                  className={`inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold shadow-sm transition-colors ${
                    isOutOfStock || isCartMaxed
                      ? "bg-stone-200 text-stone-500 cursor-not-allowed"
                      : "bg-olive hover:bg-olive-dark text-white"
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>
                    {isOutOfStock
                      ? "Stok Habis (Sold Out)"
                      : isCartMaxed
                      ? "Batas Stok Tercapai"
                      : "Tambah ke Keranjang"}
                  </span>
                </button>
                <button
                  type="button"
                  disabled={isOutOfStock || isCartMaxed}
                  onClick={() => onAdd(product, safeQty, variant, note.trim(), true)}
                  className={`inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-semibold transition-colors ${
                    isOutOfStock || isCartMaxed
                      ? "border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed"
                      : "border-olive text-olive hover:bg-olive-light"
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    {isOutOfStock ? "Tidak Dapat Dipesan" : "Beli & Buka Keranjang"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
