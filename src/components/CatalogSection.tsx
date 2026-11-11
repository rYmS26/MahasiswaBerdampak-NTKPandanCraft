"use client";

import Image from "next/image";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  Ruler,
  Search,
  SearchX,
  ShoppingCart,
  Star,
  X,
} from "lucide-react";
import { formatRupiah } from "@/lib/format";
import type { CategoryItem, ProductItem } from "@/types/catalog";

const INITIAL_VISIBLE_COUNT = 8;

interface CatalogSectionProps {
  categories: CategoryItem[];
  products: ProductItem[];
  activeCategory: string;
  searchQuery: string;
  catalogExpanded: boolean;
  cartQtyBySlug: Map<string, number>;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  onSelectCategory: (slug: string) => void;
  onSearchChange: (value: string) => void;
  onToggleExpand: () => void;
  onResetFilters: () => void;
  onOpenProduct: (product: ProductItem) => void;
  onQuickAdd: (product: ProductItem) => void;
}

export function CatalogSection({
  categories,
  products,
  activeCategory,
  searchQuery,
  catalogExpanded,
  cartQtyBySlug,
  searchInputRef,
  onSelectCategory,
  onSearchChange,
  onToggleExpand,
  onResetFilters,
  onOpenProduct,
  onQuickAdd,
}: CatalogSectionProps) {
  const q = searchQuery.trim().toLowerCase();
  const filtered = products.filter((p) => {
    const matchCat =
      activeCategory === "all" || p.categories.includes(activeCategory);
    const matchQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.dimensions.toLowerCase().includes(q) ||
      p.categoryLabel.toLowerCase().includes(q);
    return matchCat && matchQuery;
  });

  const isDefaultView = activeCategory === "all" && !q;
  const shouldLimit = isDefaultView && !catalogExpanded;
  const visibleProducts = shouldLimit
    ? filtered.slice(0, INITIAL_VISIBLE_COUNT)
    : filtered;
  const remainingCount = filtered.length - INITIAL_VISIBLE_COUNT;

  return (
    <section id="katalog" className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-stone-200">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-olive">
            Katalog Digital NTK Pandan Craft
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-forest tracking-tight mt-0.5">
            Produk Pilihan Kami
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            {filtered.length === 0
              ? "Tidak ada produk yang cocok dengan pencarian"
              : `Menampilkan ${visibleProducts.length} dari ${filtered.length} produk • Klik kartu untuk detail lengkap`}
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari keranjang, tas, lampu..."
            className="w-full pl-9 pr-8 py-2 rounded-full border border-stone-200 bg-cream-soft text-sm text-forest placeholder:text-stone-400 focus:outline-none focus:border-olive focus:bg-white transition-colors"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-forest"
              aria-label="Hapus pencarian"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-4">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.slug;
          return (
            <button
              key={cat.slug}
              type="button"
              onClick={() => onSelectCategory(cat.slug)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                isActive
                  ? "bg-olive text-white shadow-sm"
                  : "bg-cream-soft text-stone-600 border border-stone-200 hover:border-olive/50 hover:text-forest"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="py-14 text-center rounded-2xl border border-dashed border-stone-200 bg-cream-soft mt-4">
          <SearchX className="w-10 h-10 text-stone-400 mx-auto" />
          <p className="mt-2 text-base font-semibold text-forest">
            Produk tidak ditemukan
          </p>
          <p className="text-sm text-stone-500 mt-1">
            Coba kata kunci lain atau tampilkan semua kategori produk.
          </p>
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-olive text-white text-sm font-semibold hover:bg-olive-dark transition-colors"
          >
            Tampilkan Semua Produk
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-1">
          {visibleProducts.map((product) => {
            const qtyInCart = cartQtyBySlug.get(product.slug) ?? 0;
            return (
              <article
                key={product.slug}
                onClick={() => onOpenProduct(product)}
                className="group cursor-pointer rounded-2xl border border-stone-200/80 bg-white p-3.5 flex flex-col justify-between shadow-[0_4px_20px_-8px_rgba(20,38,28,0.08)] hover:shadow-[0_12px_28px_-10px_rgba(20,38,28,0.16)] hover:border-olive/40 transition-all"
              >
                <div>
                  <div className="relative aspect-[4/3] sm:aspect-square rounded-xl overflow-hidden bg-cream-soft mb-3">
                    <Image
                      src={product.imagePath}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-forest/90 text-white text-[10px] font-semibold uppercase tracking-wider">
                      {product.badge}
                    </span>
                    <span
                      className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 text-forest flex items-center justify-center opacity-90 group-hover:opacity-100 shadow-sm"
                      title="Lihat detail produk"
                    >
                      <Eye className="w-4 h-4" />
                    </span>
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1 text-[11px] font-medium text-forest truncate">
                      <Ruler className="w-3.5 h-3.5 text-olive flex-shrink-0" />
                      <span className="truncate">{product.dimensions}</span>
                    </div>
                  </div>

                  <div className="px-1 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1 text-stone-600 font-medium">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <strong className="text-forest">{product.rating}</strong>
                        <span>({product.reviewsCount})</span>
                      </span>
                      <span className="text-[11px] font-semibold text-olive">
                        {product.stockLabel}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-forest group-hover:text-olive transition-colors pt-0.5">
                      {product.name}
                    </h3>

                    <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-stone-100 px-1 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-forest tabular-nums">
                      {formatRupiah(product.price)}
                    </span>
                    {qtyInCart > 0 ? (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-olive-light text-olive">
                        {qtyInCart} di keranjang
                      </span>
                    ) : (
                      <span className="text-[11px] text-stone-400">
                        Klik untuk detail
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickAdd(product);
                    }}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-olive hover:bg-olive-dark text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Tambah ke Keranjang</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {isDefaultView && filtered.length > INITIAL_VISIBLE_COUNT ? (
        <div className="flex justify-center pt-8">
          <button
            type="button"
            onClick={onToggleExpand}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-olive text-olive hover:bg-olive hover:text-white text-sm font-semibold transition-all shadow-sm"
          >
            <span>
              {catalogExpanded
                ? "Lihat Lebih Sedikit"
                : `Lihat Selengkapnya (${remainingCount} produk lainnya)`}
            </span>
            {catalogExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      ) : null}
    </section>
  );
}
