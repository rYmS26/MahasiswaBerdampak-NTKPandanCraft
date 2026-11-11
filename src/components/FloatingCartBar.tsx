"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import type { CartItem, ProductItem } from "@/types/catalog";

interface FloatingCartBarProps {
  cart: CartItem[];
  productMap: Map<string, ProductItem>;
  totalQty: number;
  totalPrice: number;
  hidden: boolean;
  onOpenCart: () => void;
}

export function FloatingCartBar({
  cart,
  productMap,
  totalQty,
  totalPrice,
  hidden,
  onOpenCart,
}: FloatingCartBarProps) {
  if (hidden || totalQty === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-1.5rem)] max-w-lg">
      <button
        type="button"
        onClick={onOpenCart}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-forest text-white shadow-[0_14px_34px_rgba(20,38,28,0.28)] hover:bg-forest/95 transition-all border border-white/10"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex -space-x-2 flex-shrink-0">
            {cart.slice(0, 3).map((entry, idx) => {
              const product = productMap.get(entry.slug);
              if (!product) return null;
              return (
                <div
                  key={`${entry.slug}-${idx}`}
                  className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-forest"
                >
                  <Image
                    src={product.imagePath}
                    alt={product.name}
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                </div>
              );
            })}
          </div>
          <div className="text-left min-w-0">
            <p className="text-xs text-stone-300 font-medium">
              {totalQty} barang di keranjang
            </p>
            <p className="text-sm sm:text-base font-bold tabular-nums truncate">
              {formatRupiah(totalPrice)}
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-whatsapp text-white text-xs sm:text-sm font-semibold flex-shrink-0">
          <span>Lihat Keranjang</span>
          <ArrowRight className="w-4 h-4" />
        </span>
      </button>
    </div>
  );
}
