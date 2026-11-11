import Image from "next/image";
import { ChevronDown, MessageCircle, Quote } from "lucide-react";
import { SELLER_WHATSAPP } from "@/lib/format";

const FAQS = [
  {
    q: "Bagaimana cara memesan produk di katalog digital ini?",
    a: "Klik produk yang disukai untuk melihat detail dan memilih ukuran/jumlah, lalu tambahkan ke Keranjang. Di dalam Keranjang, isi nama dan alamat pengiriman, lalu klik Bayar ke WhatsApp. Sistem akan otomatis menyusun pesan berisi daftar barang, link foto produk, jumlah, serta total harga agar Anda tinggal klik kirim di WhatsApp.",
    defaultOpen: true,
  },
  {
    q: "Bagaimana cara merawat produk anyaman pandan agar awet?",
    a: "Bersihkan debu menggunakan kain kering atau sikat berbulu lembut. Hindari menyimpan produk di tempat yang terlalu lembap. Jika terkena air, keringkan di tempat teduh dengan sirkulasi udara baik sebelum disimpan.",
  },
  {
    q: "Apakah bisa memesan ukuran atau desain khusus (custom)?",
    a: "Bisa. Anda dapat menuliskan detail ukuran pada kolom catatan di keranjang atau menghubungi pengrajin langsung melalui WhatsApp untuk konfirmasi estimasi pengerjaan dan biaya tambahan.",
  },
  {
    q: "Apa yang harus dilakukan jika produk rusak saat diterima?",
    a: "Ambil foto kondisi produk beserta kemasannya saat unboxing, lalu hubungi pengrajin melalui WhatsApp agar tim kami dapat membantu langkah penanganan yang sesuai.",
  },
];

export function TestimonialsAndFaq() {
  const askWaHref = `https://wa.me/${SELLER_WHATSAPP}?text=${encodeURIComponent(
    "Halo NTK Pandan Craft, saya ingin bertanya tentang produk anyaman pandan.",
  )}`;

  return (
    <section id="testimoni" className="max-w-[1280px] mx-auto px-4 sm:px-6 py-10">
      <div className="text-center max-w-xl mx-auto mb-8">
        <span className="text-xs font-semibold uppercase tracking-wider text-olive">
          Ulasan Terverifikasi
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold text-forest tracking-tight mt-1">
          Apa Kata Pelanggan Kami
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-stone-200/80 bg-cream-soft p-6 flex flex-col justify-between gap-4">
          <div className="flex flex-col gap-3">
            <Quote className="w-7 h-7 text-olive" />
            <p className="text-sm text-forest-muted leading-relaxed">
              “Sentuhan anyaman pandan Ciamis ini memberikan kesan alami dan estetika yang
              tinggi pada ruangan klien saya. Anyamannya rapat dan rapi.”
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2 border-t border-stone-200/70">
            <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
              <Image
                src="/pp.jpg"
                alt="Rian Pratama"
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-forest">Rian Pratama</p>
              <p className="text-xs text-stone-500">Desainer Interior • ★★★★★</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200/80 bg-cream-soft p-6 flex flex-col justify-between gap-4">
          <div className="flex flex-col gap-3">
            <Quote className="w-7 h-7 text-olive" />
            <p className="text-sm text-forest-muted leading-relaxed">
              “Pesan Sandal Hotel dan Tempat Tisu untuk homestay langsung lewat katalog
              digital ini gampang sekali, total harga dan daftar fotonya otomatis masuk ke
              WhatsApp.”
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2 border-t border-stone-200/70">
            <div className="w-10 h-10 rounded-full bg-olive text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
              SN
            </div>
            <div>
              <p className="text-sm font-semibold text-forest">Siti Nurhaliza</p>
              <p className="text-xs text-stone-500">Pemilik Homestay • ★★★★★</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200/80 bg-cream-soft p-6 flex flex-col justify-between gap-4">
          <div className="flex flex-col gap-3">
            <Quote className="w-7 h-7 text-olive" />
            <p className="text-sm text-forest-muted leading-relaxed">
              “Tas Kantor dan Keranjang Bunganya kokoh, bebas bau kimia, dan ada lapisan
              anti-jamur. Pengrajin juga ramah saat konsultasi ukuran.”
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2 border-t border-stone-200/70">
            <div className="w-10 h-10 rounded-full bg-forest text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
              DK
            </div>
            <div>
              <p className="text-sm font-semibold text-forest">Dina Kartika</p>
              <p className="text-xs text-stone-500">Pelanggan Bandung • ★★★★★</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-olive">
              Bantuan &amp; Informasi
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-forest tracking-tight">
              Pertanyaan Umum Seputar Pemesanan &amp; Perawatan
            </h3>
            <p className="text-sm text-stone-500 leading-relaxed">
              Masih bingung memilih ukuran atau ingin pesan desain custom? Hubungi
              pengrajin kami langsung melalui WhatsApp.
            </p>
            <a
              href={askWaHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 w-fit inline-flex items-center gap-2 bg-whatsapp hover:bg-whatsapp-dark text-white px-4 py-2.5 rounded-full text-sm font-semibold shadow-sm transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Tanya Pengrajin via WA</span>
            </a>
          </div>

          <div className="lg:col-span-8 divide-y divide-stone-200">
            {FAQS.map((faq) => (
              <details key={faq.q} className="group py-3.5" open={faq.defaultOpen}>
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-semibold text-sm sm:text-base text-forest">
                  <span>{faq.q}</span>
                  <ChevronDown className="w-5 h-5 text-stone-500 group-open:rotate-180 transition-transform flex-shrink-0" />
                </summary>
                <p className="mt-2 text-sm text-stone-600 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
