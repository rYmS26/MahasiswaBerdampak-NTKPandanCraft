"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { CategoryItem } from "@/types/catalog";

interface CategoryCirclesProps {
  categories: CategoryItem[];
  activeCategory: string;
  onSelectCategory: (slug: string, scrollToCatalog: boolean) => void;
  onResetFilters: () => void;
}

export function CategoryCircles({
  categories,
  activeCategory,
  onSelectCategory,
  onResetFilters,
}: CategoryCirclesProps) {
  return (
    <section id="kategori" className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-forest tracking-tight">
            Belanja Berdasarkan Kategori
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Pilih kategori untuk langsung menyaring katalog produk pandan
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            onResetFilters();
            document.getElementById("katalog")?.scrollIntoView({ behavior: "smooth" });
          }}
          className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-olive hover:text-olive-dark transition-colors flex-shrink-0"
        >
          <span>Lihat Semua</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 sm:gap-6">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.slug;
          return (
            <button
              key={cat.slug}
              type="button"
              onClick={() => onSelectCategory(cat.slug, true)}
              className="group flex flex-col items-center gap-2.5 text-center focus:outline-none"
            >
              <div
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full ${cat.tintClass} p-2.5 border-2 transition-all shadow-sm overflow-hidden flex items-center justify-center ${
                  isActive
                    ? "border-olive ring-4 ring-olive/15"
                    : "border-transparent group-hover:border-olive/50"
                }`}
              >
                <div className="relative w-full h-full rounded-full overflow-hidden">
                  <Image
                    src={cat.imagePath}
                    alt={cat.label}
                    fill
                    sizes="96px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>
              <span
                className={`text-xs sm:text-sm transition-colors ${
                  isActive ? "text-olive font-semibold" : "text-forest font-medium"
                }`}
              >
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
