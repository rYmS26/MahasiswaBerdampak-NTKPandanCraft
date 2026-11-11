import Image from "next/image";
import {
  ArrowRight,
  Hand,
  Leaf,
  MessageCircle,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";

const PARTNER_LOGOS = [
  { src: "/logo/tutwuri.png", alt: "Logo Tut Wuri Handayani" },
  { src: "/logo/dikti.png", alt: "Logo Dikti" },
  { src: "/logo/mb.png", alt: "Logo Mahasiswa Berdampak" },
  { src: "/logo/unigal.png", alt: "Logo Universitas Galuh" },
  { src: "/logo/pamb.png", alt: "Logo PAMB" },
];

const BENEFITS = [
  {
    icon: Hand,
    title: "100% Handmade",
    desc: "Anyaman pengrajin asli Ciamis",
  },
  {
    icon: ShieldCheck,
    title: "Lapisan Anti-Jamur",
    desc: "Diperiksa rapi sebelum kirim",
  },
  {
    icon: ShoppingBag,
    title: "Hitung Otomatis",
    desc: "Jumlah & harga tersusun di keranjang",
  },
  {
    icon: MessageCircle,
    title: "Pesan Langsung WA",
    desc: "Format pesan & foto siap kirim",
  },
];

export function HeroSection() {
  return (
    <>
      <section id="beranda" className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-5 pb-6">
        <div className="relative overflow-hidden rounded-3xl bg-cream border border-cream-border px-6 py-8 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
          <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-olive/10 blur-3xl" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            <div className="lg:col-span-6 flex flex-col items-start gap-5 relative z-10">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-stone-200/80 text-[11px] font-semibold tracking-wider uppercase text-olive">
                <span className="w-2 h-2 rounded-full bg-olive" />
                Kerajinan Pandan Asli Ciamis
              </span>

              <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-bold text-forest leading-[1.15] tracking-tight">
                Temukan Kerajinan Pandan Terbaik untuk Hunian Anda
              </h1>

              <p className="text-sm sm:text-base text-forest-muted leading-relaxed max-w-xl">
                Jelajahi katalog produk anyaman tangan pengrajin Rajadesa, Ciamis.
                Klik produk untuk melihat detail ukuran, masukkan ke keranjang, dan
                kirim pesanan otomatis ke WhatsApp penjual.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href="#katalog"
                  className="inline-flex items-center gap-2 bg-olive hover:bg-olive-dark text-white px-6 py-3 rounded-lg text-sm font-semibold shadow-sm transition-all"
                >
                  <span>Belanja Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="#penawaran"
                  className="inline-flex items-center gap-2 bg-white hover:bg-stone-50 text-forest px-6 py-3 rounded-lg text-sm font-semibold border border-stone-200 transition-all"
                >
                  <span>Lihat Paket Hemat</span>
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className="flex -space-x-2">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-white">
                    <Image
                      src="/pp.jpg"
                      alt="Pelanggan NTK Pandan Craft"
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  </div>
                  <span className="w-8 h-8 rounded-full bg-olive text-white text-[11px] font-bold flex items-center justify-center ring-2 ring-white">
                    SN
                  </span>
                  <span className="w-8 h-8 rounded-full bg-forest text-white text-[11px] font-bold flex items-center justify-center ring-2 ring-white">
                    DK
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-forest-muted">
                  Dipercaya <strong className="text-forest">1.000+</strong> Pelanggan •{" "}
                  <strong className="text-forest">8.000+</strong> Produk Terkirim •{" "}
                  <span className="text-amber-500 font-semibold">4.9 ★</span>
                </p>
              </div>
            </div>

            <div className="lg:col-span-6 relative">
              <div className="relative rounded-2xl overflow-hidden bg-white p-2.5 shadow-[0_18px_40px_-15px_rgba(20,38,28,0.14)] border border-stone-200/70">
                <div className="relative aspect-[4/3] sm:aspect-[16/11] rounded-xl overflow-hidden bg-cream-soft">
                  <Image
                    src="/profil.jpeg"
                    alt="Koleksi kerajinan anyaman pandan NTK Pandan Craft"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                    priority
                  />
                  <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full border border-stone-200 flex items-center gap-1.5 shadow-sm">
                    <Leaf className="w-4 h-4 text-olive" />
                    <span className="text-xs font-semibold text-forest">
                      100% Daun Pandan Alami • Anti-Jamur
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-between gap-4 px-4 py-3 rounded-2xl bg-cream-soft border border-stone-200/70">
          <span className="text-xs font-medium text-stone-500">
            Inisiatif Pemberdayaan Pengrajin • Mahasiswa Berdampak Universitas Galuh
          </span>
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center">
            {PARTNER_LOGOS.map((logo) => (
              <div key={logo.src} className="relative h-8 w-8">
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  fill
                  sizes="32px"
                  className="object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 sm:p-5 rounded-2xl border border-stone-200/80 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          {BENEFITS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-olive-light text-olive flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-forest">{item.title}</h2>
                  <p className="text-xs text-stone-500">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
