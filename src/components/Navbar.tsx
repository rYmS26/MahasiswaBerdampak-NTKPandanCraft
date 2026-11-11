"use client";

import { useState } from "react";
import Image from "next/image";
import { Menu, Search, ShoppingCart, X } from "lucide-react";

interface NavbarProps {
  totalQty: number;
  activeSection: string;
  onOpenCart: () => void;
  onFocusSearch: () => void;
}

const NAV_ITEMS = [
  { href: "#beranda", id: "beranda", label: "Beranda" },
  { href: "#kategori", id: "kategori", label: "Kategori" },
  { href: "#katalog", id: "katalog", label: "Katalog" },
  { href: "#penawaran", id: "penawaran", label: "Paket Hemat" },
  { href: "#testimoni", id: "testimoni", label: "Ulasan & FAQ" },
  { href: "#informasi", id: "informasi", label: "Kontak" },
];

export function Navbar({
  totalQty,
  activeSection,
  onOpenCart,
  onFocusSearch,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 sm:h-[72px] flex items-center justify-between gap-3">
        <a href="#beranda" className="flex items-center gap-2.5 min-w-0">
          <div className="relative h-9 w-9 rounded-lg overflow-hidden border border-stone-200 flex-shrink-0">
            <Image
              src="/logo.jpg"
              alt="Logo Ciamis Pandan Craft"
              fill
              sizes="36px"
              className="object-cover"
              priority
            />
          </div>
          <div className="min-w-0">
            <span className="block font-serif text-lg sm:text-xl font-semibold text-forest tracking-tight truncate">
              Ciamis Pandan Craft
            </span>
            <span className="hidden sm:block text-[11px] text-stone-500 -mt-0.5">
              Katalog Digital • NTK Pandan Craft
            </span>
          </div>
        </a>

        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-stone-600">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                className={`transition-colors hover:text-olive ${
                  isActive ? "text-olive font-semibold" : ""
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onFocusSearch}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-stone-200 text-xs font-medium text-stone-600 hover:border-olive hover:text-olive transition-colors"
            title="Cari produk di katalog"
          >
            <Search className="w-4 h-4" />
            <span className="hidden md:inline">Cari Produk</span>
          </button>

          <button
            type="button"
            onClick={onOpenCart}
            className="relative inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-olive hover:bg-olive-dark text-white text-sm font-semibold shadow-sm transition-all"
            aria-label="Buka keranjang belanja"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Keranjang</span>
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-white text-olive text-xs font-bold tabular-nums">
              {totalQty}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="lg:hidden w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center text-forest"
            aria-label="Buka menu navigasi"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <nav className="lg:hidden bg-white border-t border-stone-100 px-4 py-3 flex flex-col gap-1 text-sm font-medium text-stone-700">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-cream-soft"
            >
              {item.label}
            </a>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
