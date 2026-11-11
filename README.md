# NTK Pandan Craft — Katalog Digital & Checkout WhatsApp

Website katalog digital UMKM kerajinan anyaman pandan Ciamis yang dibangun dengan **Next.js (App Router + TypeScript)**, **Tailwind CSS**, dan **Supabase PostgreSQL**, siap di-deploy ke **Vercel**.

## Fitur Utama
- **Katalog Digital dari Supabase Postgres**: Mengambil kategori, 12 produk satuan, dan 2 paket hemat secara parallel di Server Component (dengan fallback lokal aman jika environment variable belum terisi).
- **Popup Detail Produk**: Menampilkan foto besar, ukuran/dimensi, deskripsi penuh, pemilih varian ukuran (`Topi Pantai`), pengatur jumlah (`-`/`+`), subtotal live, dan catatan per item.
- **Keranjang Belanja Persisten**: Menghitung jumlah barang, subtotal per item, total barang, dan total harga otomatis (tersimpan di `localStorage`).
- **Checkout Otomatis ke WhatsApp + Foto Produk**:
  - Endpoint `POST /api/orders` memvalidasi harga asli produk di server, menghasilkan kode pesanan unik (`NTK-YYYYMMDD-XXXX`), dan menyimpan riwayat pesanan ke tabel `orders` & `order_items` di Supabase Postgres.
  - Menyusun pesan WhatsApp siap kirim berisi kode pesanan, daftar barang, varian, jumlah, harga satuan, subtotal, total bayar, data pemesan, dan tautan URL foto setiap produk.
  - Menyediakan **Struk Gambar Pesanan (PNG Canvas)** berisi foto barang, rincian jumlah, dan harga yang bisa disalin atau diunduh pelanggan.

## Struktur Folder
- `src/app/` — Next.js App Router (`page.tsx`, `layout.tsx`, `globals.css`, dan API routes `api/products`, `api/orders`, `api/health`)
- `src/components/` — Komponen UI modular (`StorefrontApp`, `CatalogSection`, `ProductDetailModal`, `CartDrawer`, dll.)
- `src/lib/supabase/` — Client browser (`@supabase/ssr`), server SSR/public reader, dan server-only admin client
- `supabase/migrations/` — File migrasi SQL PostgreSQL (`001` skema + indeks + RLS, `002` seed data katalog)
- `public/` — Seluruh aset foto produk (`katalog/`) dan logo mitra (`logo/`)

## Cara Setup Lokal & Upload ke Vercel

### 1. Setup Database Supabase PostgreSQL
1. Buat project baru di [Supabase](https://supabase.com/dashboard) (atau hubungkan via Vercel Marketplace).
2. Buka **SQL Editor** di dashboard Supabase, lalu jalankan isi file migrasi secara berurutan:
   - `supabase/migrations/202611110001_init_catalog_and_orders.sql`
   - `supabase/migrations/202611110002_seed_catalog.sql`
3. Ambil kunci API di **Settings → API Keys**:
   - Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
   - Publishable Key (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)
   - Secret Key (`SUPABASE_SECRET_KEY`) — *hanya disimpan di server / Vercel Environment Variables*

### 2. Jalankan Lokal
```bash
cp .env.example .env.local
# Isi kredensial Supabase di .env.local
npm install
npm run dev
```

### 3. Upload / Deploy ke Vercel
1. Push repository ini ke GitHub.
2. Buka [Vercel Dashboard](https://vercel.com/new) → Import repository `MahasiswaBerdampak-NTKPandanCraft`.
3. Tambahkan Environment Variables berikut di Vercel Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY`
   - `NEXT_PUBLIC_SELLER_WHATSAPP` (opsional, default `628815838516`)
   - `NEXT_PUBLIC_SITE_URL` (isi dengan domain Vercel Anda, mis. `https://ntk-pandan-craft.vercel.app`)
4. Klik **Deploy**. Setelah live, cek endpoint `/api/health` untuk memastikan koneksi database `dbReachable: true`.
