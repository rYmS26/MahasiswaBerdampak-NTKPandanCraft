"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Leaf, Lock, MapPin } from "lucide-react";
import { useStoreSettings } from "@/components/StoreSettingsContext";

const SOCIAL_LINKS = [
  {
    name: "Shopee",
    handle: "Pandan Craft Ciamis",
    href: "https://id.shp.ee/Yrwjo29V",
    badgeClass: "bg-[#ee4d2d]/10 text-[#ee4d2d] border-[#ee4d2d]/25 hover:bg-[#ee4d2d] hover:text-white",
    icon: (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M19.5 7h-3.05a4.45 4.45 0 0 0-8.9 0H4.5A1.5 1.5 0 0 0 3 8.5v10A3.5 3.5 0 0 0 6.5 22h11a3.5 3.5 0 0 0 3.5-3.5v-10A1.5 1.5 0 0 0 19.5 7ZM12 4.25a2.75 2.75 0 0 1 2.72 2.75H9.28A2.75 2.75 0 0 1 12 4.25Zm.1 14.3c-1.88 0-3.32-.85-3.65-2.15l1.55-.45c.22.75 1.02 1.2 2.1 1.2 1.03 0 1.72-.42 1.72-1.08 0-.62-.54-.92-1.88-1.26-1.76-.43-2.98-1.05-2.98-2.55 0-1.48 1.28-2.52 3.12-2.52 1.66 0 2.95.75 3.35 1.96l-1.52.48c-.24-.64-.9-1.06-1.84-1.06-.92 0-1.52.4-1.52.98 0 .56.52.84 1.85 1.18 1.82.46 3.02 1.08 3.02 2.63 0 1.6-1.34 2.64-3.32 2.64Z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    handle: "@ciamispandancraft",
    href: "https://www.instagram.com/ciamispandancraft?psln=NDRrdXJld29rNGMw",
    badgeClass: "bg-[#E1306C]/10 text-[#E1306C] border-[#E1306C]/25 hover:bg-[#E1306C] hover:text-white",
    icon: (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85 0 3.2-.01 3.58-.07 4.85-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07-3.2 0-3.58-.01-4.85-.07-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.64-.07-4.85 0-3.2.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23c1.27-.06 1.65-.07 4.85-.07ZM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.7.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98 1.28.06 1.69.07 4.95.07s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.35-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0Zm0 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84ZM12 16a4 4 0 1 1 4-4 4 4 0 0 1-4 4Zm6.4-11.85a1.44 1.44 0 1 0 1.44 1.44 1.44 1.44 0 0 0-1.44-1.44Z" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    handle: "Ciamis Pandan Craft",
    href: "https://www.facebook.com/share/1HQYjv5tHC/",
    badgeClass: "bg-[#1877F2]/10 text-[#1877F2] border-[#1877F2]/25 hover:bg-[#1877F2] hover:text-white",
    icon: (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.89v2.26h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07Z" />
      </svg>
    ),
  },
  {
    name: "TikTok",
    handle: "@saung.enteka",
    href: "https://www.tiktok.com/@saung.enteka?_r=1&_t=ZS-9BS2fZ8ZARO",
    badgeClass: "bg-stone-900/10 text-stone-900 border-stone-900/25 hover:bg-stone-900 hover:text-white",
    icon: (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1Z" />
      </svg>
    ),
  },
];

export function Footer() {
  const { sellerWhatsApp, sellerWhatsAppDisplay } = useStoreSettings();
  const [question, setQuestion] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = question.trim();
    const msg = q
      ? `Halo Ciamis Pandan Craft, saya ingin bertanya: ${q}`
      : "Halo Ciamis Pandan Craft, saya ingin berkonsultasi mengenai produk anyaman pandan.";
    window.open(
      `https://wa.me/${sellerWhatsApp}?text=${encodeURIComponent(msg)}`,
      "_blank",
      "noopener,noreferrer",
    );
    setQuestion("");
  }

  return (
    <footer id="informasi" className="bg-cream-soft border-t border-stone-200 mt-6">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="relative h-8 w-8 rounded-lg overflow-hidden border border-stone-200">
                <Image
                  src="/logo.jpg"
                  alt="Logo Ciamis Pandan Craft"
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              </div>
              <span className="font-serif text-xl font-semibold text-forest">
                Ciamis Pandan Craft
              </span>
            </div>
            <p className="text-sm text-stone-600 leading-relaxed max-w-sm">
              Bagian dari inisiatif Mahasiswa Berdampak Universitas Galuh dalam
              mendukung pengembangan kerajinan anyaman pandan, pelestarian budaya
              lokal, serta pemasaran digital UMKM Ciamis.
            </p>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-olive">
              <Leaf className="w-4 h-4" />
              <span>Melestarikan Budaya &amp; Kerajinan Lokal</span>
            </div>

            {/* Social Media & Shopee Quick Pills */}
            <div className="pt-2">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2">
                Marketplace &amp; Media Sosial Resmi:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {SOCIAL_LINKS.map((soc) => (
                  <a
                    key={soc.name}
                    href={soc.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`${soc.name}: ${soc.handle}`}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-2xs ${soc.badgeClass}`}
                  >
                    {soc.icon}
                    <span>{soc.name}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-forest">
              Navigasi
            </h3>
            <div className="flex flex-col gap-2 text-sm text-stone-600">
              <a href="#beranda" className="hover:text-olive transition-colors">
                Beranda
              </a>
              <a href="#kategori" className="hover:text-olive transition-colors">
                Kategori
              </a>
              <a href="#katalog" className="hover:text-olive transition-colors">
                Katalog Produk
              </a>
              <a href="#penawaran" className="hover:text-olive transition-colors">
                Paket Hemat
              </a>
              <a href="#testimoni" className="hover:text-olive transition-colors">
                Ulasan &amp; FAQ
              </a>
            </div>
          </div>

          <div className="lg:col-span-3 flex flex-col gap-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-forest">
              Lokasi Pengrajin
            </h3>
            <address className="not-italic text-sm text-stone-600 leading-relaxed">
              <strong className="block text-forest font-medium">
                NTK Pandan Craft
              </strong>
              Dusun Citapen Landeuh, Desa Sukajaya,
              <br />
              Kecamatan Rajadesa, Ciamis, Jawa Barat
            </address>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Dusun+Citapen+Landeuh%2C+Desa+Sukajaya%2C+Rajadesa%2C+Ciamis%2C+Jawa+Barat"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-olive hover:text-olive-dark transition-colors mt-1"
            >
              <MapPin className="w-4 h-4" />
              <span>Buka di Google Maps</span>
            </a>
          </div>

          <div className="lg:col-span-3 flex flex-col gap-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-forest">
              Konsultasi WhatsApp
            </h3>
            <p className="text-sm text-stone-600">
              Tulis pertanyaan singkat untuk langsung terhubung dengan pengrajin kami.
            </p>
            <form onSubmit={handleSubmit} className="flex gap-2 mt-1">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Tanya stok / custom..."
                className="flex-1 min-w-0 px-3.5 py-2 rounded-lg border border-stone-200 bg-white text-sm text-forest focus:outline-none focus:border-olive"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-olive hover:bg-olive-dark text-white text-sm font-semibold transition-colors flex-shrink-0"
              >
                Kirim
              </button>
            </form>
            <span className="text-xs text-stone-500">
              WhatsApp Resmi: {sellerWhatsAppDisplay}
            </span>
          </div>
        </div>

        {/* Official Marketplace & Social Media Banner */}
        <div className="mt-8 pt-6 border-t border-stone-200/80">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {SOCIAL_LINKS.map((soc) => (
              <a
                key={soc.name}
                href={soc.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-stone-200/80 hover:border-olive/50 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${soc.badgeClass}`}
                  >
                    {soc.icon}
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-400">
                      {soc.name}
                    </span>
                    <span className="block text-xs sm:text-sm font-bold text-forest group-hover:text-olive truncate transition-colors">
                      {soc.handle}
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-stone-400 group-hover:text-olive shrink-0 transition-colors" />
              </a>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
          <p>© 2026 Ciamis Pandan Craft. Hak cipta dilindungi.</p>
          <div className="flex items-center gap-4">
            <span>Pelestarian Budaya Lokal</span>
            <span>Kerajinan Berkelanjutan</span>
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1 text-stone-400 hover:text-forest transition-colors"
            >
              <Lock className="w-3 h-3" />
              <span>Login Admin</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
