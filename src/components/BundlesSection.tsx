"use client";

import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import type { ProductItem } from "@/types/catalog";

interface BundlesSectionProps {
  bundles: ProductItem[];
  onOpenProduct: (bundle: ProductItem) => void;
  onQuickAdd: (bundle: ProductItem) => void;
}

export function BundlesSection({
  bundles,
  onOpenProduct,
  onQuickAdd,
}: BundlesSectionProps) {
  if (bundles.length === 0) return null;

  return (
    <section id="penawaran" className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8">
      <div className="rounded-3xl bg-cream border border-cream-border p-6 sm:p-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-7">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-olive">
              Penawaran Spesial
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-forest tracking-tight mt-1">
              Paket Hemat Koleksi Pilihan
            </h2>
            <p className="text-sm text-forest-muted mt-1 max-w-2xl">
              Kombinasi anyaman pandan pilihan untuk dekorasi awal rumah Anda. Dapat
              digabungkan ke keranjang bersama produk satuan lainnya.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {bundles.map((bundle) => {
            const availableStock = Math.max(0, bundle.stock ?? 0);
            const isSoldOut = availableStock <= 0;

            return (
              <div
                key={bundle.slug}
                onClick={() => onOpenProduct(bundle)}
                className={`cursor-pointer rounded-2xl bg-white border p-5 flex flex-col sm:flex-row items-center gap-5 shadow-sm transition-all group ${
                  isSoldOut
                    ? "border-stone-200 opacity-85"
                    : "border-stone-200/80 hover:shadow-md hover:border-olive/40"
                }`}
              >
                <div className="relative w-full sm:w-44 h-44 rounded-2xl overflow-hidden bg-cream-soft flex-shrink-0">
                  <Image
                    src={bundle.imagePath}
                    alt={bundle.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 176px"
                    className={`object-cover transition-transform duration-500 ${
                      isSoldOut ? "grayscale-[35%]" : "group-hover:scale-105"
                    }`}
                  />
                </div>

                <div className="flex-1 flex flex-col justify-between gap-3 w-full">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          isSoldOut
                            ? "bg-red-100 text-red-700"
                            : "bg-olive-light text-olive"
                        }`}
                      >
                        {isSoldOut ? "Stok Habis" : bundle.badge}
                      </span>
                      <span
                        className={`text-[11px] font-semibold ${
                          isSoldOut ? "text-red-600" : "text-olive"
                        }`}
                      >
                        {isSoldOut ? "Sold Out" : `Stok: ${availableStock} paket`}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-forest mt-1.5 group-hover:text-olive transition-colors">
                      {bundle.name}
                    </h3>
                    <p className="text-xs text-stone-500 mt-1 leading-relaxed line-clamp-2">
                      {bundle.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100">
                    <span className="text-lg font-bold text-forest tabular-nums">
                      {formatRupiah(bundle.price)}
                    </span>
                    <button
                      type="button"
                      disabled={isSoldOut}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isSoldOut) {
                          onQuickAdd(bundle);
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        isSoldOut
                          ? "bg-stone-200 text-stone-500 cursor-not-allowed"
                          : "bg-olive hover:bg-olive-dark text-white"
                      }`}
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>{isSoldOut ? "Stok Habis" : "Tambah ke Keranjang"}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
