"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Leaf, Lock, MapPin } from "lucide-react";
import { SELLER_WHATSAPP, SELLER_WHATSAPP_DISPLAY } from "@/lib/format";

export function Footer() {
  const [question, setQuestion] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = question.trim();
    const msg = q
      ? `Halo NTK Pandan Craft, saya ingin bertanya: ${q}`
      : "Halo NTK Pandan Craft, saya ingin berkonsultasi mengenai produk anyaman pandan.";
    window.open(
      `https://wa.me/${SELLER_WHATSAPP}?text=${encodeURIComponent(msg)}`,
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
                  alt="Logo NTK Pandan Craft"
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              </div>
              <span className="font-serif text-xl font-semibold text-forest">
                NTK Pandan Craft
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
              WhatsApp Resmi: {SELLER_WHATSAPP_DISPLAY}
            </span>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
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
