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
import { formatRupiah } from "@/lib/format";
import type { ProductItem } from "@/types/catalog";

interface ProductDetailModalProps {
  product: ProductItem;
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
  onClose,
  onAdd,
}: ProductDetailModalProps) {
  const [qty, setQty] = useState(1);
  const [variant, setVariant] = useState(
    product.variants.length > 0 ? product.variants[1] ?? product.variants[0] : "",
  );
  const [note, setNote] = useState("");

  const subtotal = product.price * qty;

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
              <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-forest text-white text-[11px] font-semibold uppercase tracking-wider">
                {product.badge}
              </span>
              <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/95 text-olive text-[11px] font-semibold border border-stone-200">
                {product.stockLabel}
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

              <p className="text-2xl font-bold text-forest tabular-nums mt-3">
                {formatRupiah(product.price)}
              </p>

              <p className="text-sm text-stone-600 leading-relaxed mt-3">
                {product.description}
              </p>

              {product.variants.length > 0 ? (
                <div className="mt-4">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-2">
                    Pilih Ukuran
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v) => {
                      const active = variant === v;
                      return (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setVariant(v)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                            active
                              ? "bg-olive text-white border-olive shadow-sm"
                              : "bg-cream-soft text-forest border-stone-200 hover:border-olive"
                          }`}
                        >
                          {v}
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
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Jumlah:
                  </span>
                  <div className="inline-flex items-center rounded-full border border-stone-200 bg-cream-soft">
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="w-9 h-9 flex items-center justify-center text-forest hover:bg-stone-200/70 rounded-l-full"
                      aria-label="Kurangi jumlah"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-9 text-center text-sm font-bold tabular-nums text-forest">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty((q) => q + 1)}
                      className="w-9 h-9 flex items-center justify-center text-forest hover:bg-stone-200/70 rounded-r-full"
                      aria-label="Tambah jumlah"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <span className="block text-[11px] text-stone-500">Subtotal</span>
                  <span className="text-base font-bold text-olive tabular-nums">
                    {formatRupiah(subtotal)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => onAdd(product, qty, variant, note.trim(), false)}
                  className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-olive hover:bg-olive-dark text-white text-sm font-semibold shadow-sm transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Tambah ke Keranjang</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAdd(product, qty, variant, note.trim(), true)}
                  className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-olive text-olive hover:bg-olive-light text-sm font-semibold transition-colors"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Beli &amp; Buka Keranjang</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
