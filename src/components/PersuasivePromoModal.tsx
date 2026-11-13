"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Sparkles,
  ShieldCheck,
  HeartHandshake,
  MessageCircle,
  ArrowRight,
  X,
  CheckCircle2,
} from "lucide-react";
import { SELLER_WHATSAPP } from "@/lib/format";

interface PersuasivePromoModalProps {
  onSelectCategory?: (categorySlug: string) => void;
}

export function PersuasivePromoModal({ onSelectCategory }: PersuasivePromoModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if the user has already dismissed this modal in this session
    try {
      const alreadySeen = sessionStorage.getItem("ciamis_pandan_promo_seen");
      if (alreadySeen) return;
    } catch {
      // Ignore storage errors
    }

    // Timer to trigger pop-up after 5 seconds
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 5000);

    // Also trigger on significant scroll if not already opened
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setIsOpen(true);
        window.removeEventListener("scroll", handleScroll);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  function handleDismiss() {
    try {
      sessionStorage.setItem("ciamis_pandan_promo_seen", "true");
    } catch {
      // Ignore storage errors
    }
    setIsOpen(false);
  }

  function handleExploreCatalog() {
    handleDismiss();
    if (onSelectCategory) {
      onSelectCategory("popular");
    }
    const catalogEl = document.getElementById("katalog");
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: "smooth" });
    }
  }

  function handleDirectWhatsApp() {
    handleDismiss();
    const message = encodeURIComponent(
      "Halo Ciamis Pandan Craft, saya tertarik dengan produk kerajinan anyaman pandan. Boleh tanya stok dan konsultasi ukuran/rekomendasi produk terbaik?"
    );
    window.open(`https://wa.me/${SELLER_WHATSAPP}?text=${message}`, "_blank", "noopener,noreferrer");
  }

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="promo-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-300"
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header decoration banner */}
        <div className="relative bg-gradient-to-r from-forest to-forest-light text-white px-6 py-6 sm:py-7">
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Tutup penawaran"
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sand-gold/20 border border-sand-gold/40 text-sand-gold text-xs font-bold tracking-wide uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5 text-sand-gold" />
            <span>Karya Pengrajin Lokal Rajadesa</span>
          </div>

          <h2 id="promo-modal-title" className="text-xl sm:text-2xl font-serif font-bold text-white leading-snug">
            Sentuhan Estetis &amp; Alami untuk Hunian Modern Anda
          </h2>
          <p className="text-white/80 text-xs sm:text-sm mt-1.5 leading-relaxed">
            Miliki anyaman pandan murni berkualitas premium langsung dari tangan pengrajin Ciamis.
          </p>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Key reassurance badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-cream-soft border border-stone-200/80">
              <ShieldCheck className="w-5 h-5 text-forest shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-forest">100% Pandan Pilihan</p>
                <p className="text-[11px] text-stone-600">Alami, awet, dan dilapisi anti-jamur ramah lingkungan.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-cream-soft border border-stone-200/80">
              <HeartHandshake className="w-5 h-5 text-olive shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-forest">Dukung UMKM Desa</p>
                <p className="text-[11px] text-stone-600">Harga langsung tangan pertama tanpa perantara.</p>
              </div>
            </div>
          </div>

          {/* Social Proof / Trust banner */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-emerald-300">
              <Image
                src="/katalog/keranjang_bunga.png"
                alt="Kerajinan Pandan Pilihan"
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
            <div className="text-xs text-emerald-950">
              <div className="flex items-center gap-1 font-bold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Garansi Real-Pic Sebelum Kirim</span>
              </div>
              <p className="text-[11px] text-emerald-800/90 mt-0.5">
                Admin mengirimkan foto asli produk sebelum dikemas &amp; dikirim via ekspedisi.
              </p>
            </div>
          </div>

          {/* Call to actions */}
          <div className="pt-2 space-y-2.5">
            <button
              type="button"
              onClick={handleExploreCatalog}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-forest hover:bg-forest-light text-white text-sm font-bold shadow-md hover:shadow-lg transition-all"
            >
              <span>Belanja Sekarang &amp; Pilih Produk</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleDirectWhatsApp}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-whatsapp hover:bg-whatsapp-dark text-white text-sm font-semibold shadow-sm transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Tanya Pengrajin di WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="w-full py-2 text-center text-xs text-stone-500 hover:text-stone-800 transition-colors"
            >
              Mungkin nanti, saya ingin lihat-lihat dulu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
