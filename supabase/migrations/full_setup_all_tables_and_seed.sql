-- ==============================================================================
-- CIAMIS PANDAN CRAFT / NTK PANDAN CRAFT
-- MASTER DATABASE INITIALIZATION SCRIPT (FULL SCHEMA + SEED DATA)
-- Jalankan skrip ini di SQL Editor pada proyek Supabase baru Anda (1x Run).
-- ==============================================================================

-- 1. Tabel Kategori Produk
create table if not exists public.categories (
  slug text primary key,
  label text not null,
  image_path text not null,
  tint_class text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- 2. Tabel Produk & Paket Bundling
create table if not exists public.products (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  price integer not null check (price >= 0),
  image_path text not null,
  dimensions text not null default 'Standar',
  variants text[] not null default '{}',
  badge text not null default 'Produk Pilihan',
  stock_label text not null default 'Tersedia',
  rating numeric(2, 1) not null default 5.0,
  reviews_count integer not null default 25,
  categories text[] not null default array['popular'],
  category_label text not null default 'Dekorasi & Keranjang',
  description text not null,
  is_bundle boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_slug_idx on public.products (slug);
create index if not exists products_is_active_idx on public.products (is_active);
create index if not exists products_sort_order_idx on public.products (sort_order);

-- 3. Tabel Pesanan (Orders)
create table if not exists public.orders (
  id bigint generated always as identity primary key,
  order_code text not null unique,
  customer_name text not null,
  customer_address text not null,
  customer_note text,
  total_qty integer not null check (total_qty > 0),
  total_price integer not null check (total_price >= 0),
  whatsapp_message text not null,
  status text not null default 'pending_wa'
    check (status in ('pending_wa', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);

-- 4. Tabel Rincian Pesanan (Order Items)
create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  product_id bigint references public.products(id) on delete set null,
  product_slug text not null,
  product_name text not null,
  variant text,
  item_note text,
  unit_price integer not null check (unit_price >= 0),
  qty integer not null check (qty > 0),
  subtotal integer not null check (subtotal >= 0),
  image_path text not null
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_product_id_idx on public.order_items (product_id);

-- 5. Tabel Pengaturan Toko Dinamis (Store Settings)
create table if not exists public.store_settings (
  key text primary key,
  value text not null,
  description text,
  updated_at timestamptz not null default now()
);

-- ==============================================================================
-- HAK AKSES & ROW LEVEL SECURITY (RLS)
-- ==============================================================================
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.store_settings enable row level security;

grant usage on schema public to anon, authenticated, service_role;
grant select on public.categories, public.products, public.store_settings to anon, authenticated;
grant insert on public.orders, public.order_items to anon, authenticated;
grant all on all tables in schema public to service_role;

-- Kebijakan baca publik (katalog)
drop policy if exists "Public read categories" on public.categories;
create policy "Public read categories" on public.categories for select to anon, authenticated using (true);

drop policy if exists "Public read active products" on public.products;
create policy "Public read active products" on public.products for select to anon, authenticated using (is_active = true);

drop policy if exists "Public read store_settings" on public.store_settings;
create policy "Public read store_settings" on public.store_settings for select to anon, authenticated using (true);

-- Kebijakan simpan pesanan pembeli (anon/authenticated)
drop policy if exists "Buyers can insert orders" on public.orders;
create policy "Buyers can insert orders" on public.orders for insert to anon, authenticated with check (true);

drop policy if exists "Buyers can insert order_items" on public.order_items;
create policy "Buyers can insert order_items" on public.order_items for insert to anon, authenticated with check (true);

-- ==============================================================================
-- DATA AWAL (SEED DATA: KATEGORI, PRODUK BROSUR RESMI, & PENGATURAN WA)
-- ==============================================================================

-- Kategori
insert into public.categories (slug, label, image_path, tint_class, sort_order)
values
  ('all', 'Semua Produk', '/profil.jpeg', 'bg-[#eef2e5]', 1),
  ('popular', 'Terlaris', '/katalog/keranjang_bunga.png', 'bg-[#f5ede4]', 2),
  ('decor', 'Dekorasi', '/katalog/vas_bunga.png', 'bg-[#e9f1eb]', 3),
  ('box', 'Penyimpanan', '/katalog/tempat_majalah.png', 'bg-[#f3ece8]', 4),
  ('accessories', 'Tas & Gaya', '/katalog/tas_kantor.png', 'bg-[#ebf0f4]', 5),
  ('lamp', 'Lampu Hias', '/katalog/lampu_berdiri.png', 'bg-[#f5f0e2]', 6)
on conflict (slug) do update set
  label = excluded.label,
  image_path = excluded.image_path,
  tint_class = excluded.tint_class,
  sort_order = excluded.sort_order;

-- Pengaturan Nomor WhatsApp Penjual
insert into public.store_settings (key, value, description)
values ('seller_whatsapp', '628815838516', 'Nomor WhatsApp resmi Ciamis Pandan Craft untuk menerima pesanan')
on conflict (key) do nothing;

-- 12 Produk Resmi Sesuai Brosur + 2 Paket Hemat
insert into public.products (
  slug, name, price, image_path, dimensions, variants, badge, stock_label,
  rating, reviews_count, categories, category_label, description, is_bundle, is_active, sort_order
)
values
  ('keranjang-bunga', 'Keranjang Bunga', 75000, '/katalog/keranjang_bunga.png', 'Tinggi: 20cm | Lingkaran: 90cm', '{}', 'Terlaris', 'Tersedia', 5.0, 128, array['popular', 'decor', 'box'], 'Dekorasi & Keranjang', 'Keranjang bunga anyaman pandan yang indah dan menarik untuk diletakkan di ruang tamu, teras, maupun sudut favorit di rumah Anda.', false, true, 1),
  ('tas-kantor', 'Tas Kantor', 100000, '/katalog/tas_kantor.png', 'T: 26cm | P: 39cm | L: 17cm', '{}', 'Best Seller', 'Tersedia', 4.9, 94, array['popular', 'accessories'], 'Tas & Aksesoris', 'Tas jinjing anyaman pandan elegan yang dirancang khusus untuk kebutuhan kerja, kuat membawa dokumen dan perlengkapan.', false, true, 2),
  ('tempat-majalah', 'Tempat Majalah', 100000, '/katalog/tempat_majalah.png', 'T: 23cm | P: 26cm | L: 10cm', '{}', 'Wadah Penyimpanan', 'Tersedia', 5.0, 182, array['box'], 'Wadah Penyimpanan', 'Tempat majalah anyaman pandan yang elegan dan fungsional, cocok untuk ruang tamu maupun ruang kerja.', false, true, 3),
  ('tas-belanja', 'Tas Belanja', 150000, '/katalog/tas_belanja.png', 'T: 32cm | P: 47cm | L: 18cm', '{}', 'Tas Belanja', 'Tersisa 4', 4.8, 76, array['accessories'], 'Tas & Aksesoris', 'Cocok untuk membawa kebutuhan sehari-hari dengan gaya natural, kuat, dan ramah lingkungan.', false, true, 4),
  ('tong-sampah', 'Tong Sampah', 75000, '/katalog/tong_sampah.png', 'Tinggi: 27cm | Lebar: 21cm', '{}', 'Rumah Tangga', 'Tersedia', 4.9, 140, array['box'], 'Wadah Penyimpanan', 'Cocok untuk menjaga kerapian rumah dan ruangan dengan sentuhan anyaman alami.', false, true, 5),
  ('vas-bunga', 'Vas Bunga', 100000, '/katalog/vas_bunga.png', 'Tinggi: 42cm | Lingkaran: 95cm', '{}', 'Dekorasi', 'Tersedia', 4.9, 62, array['decor'], 'Dekorasi Rumah', 'Vas memberikan sentuhan alami dan estetis untuk mempercantik interior rumah.', false, true, 6),
  ('lampu-hias-berdiri', 'Lampu Hias Model Tinggi', 200000, '/katalog/lampu_berdiri.png', 'Tinggi: 94cm | Lingkaran: 38cm', '{}', 'Best Seller', 'Tersedia', 4.8, 89, array['decor', 'popular', 'lamp'], 'Lampu Hias', 'Lampu hias anyaman pandan dengan bentuk ramping dan elegan.', false, true, 7),
  ('sandal-hotel', 'Sandal Hotel', 25000, '/katalog/sandal_hotel.png', 'T: 8cm | L: 26cm | P: 28cm', '{}', 'Homestay', 'Tersedia', 4.9, 115, array['accessories'], 'Perlengkapan Homestay', 'Cocok untuk kebutuhan hotel, homestay, maupun spa.', false, true, 8),
  ('lampu-hias-lengkung', 'Lampu Hias Lengkung', 350000, '/katalog/lampu_hias_lengkung.png', 'Tinggi: 117cm', '{}', 'Dekorasi', 'Tersedia', 4.8, 89, array['decor', 'lamp'], 'Lampu Hias', 'Lampu dekoratif dengan bentuk lengkung yang unik.', false, true, 9),
  ('lampu-hias', 'Lampu Hias', 350000, '/katalog/lampu_hias.png', 'Tinggi: 105cm | Lingkaran: 30cm', '{}', 'Dekorasi', 'Tersedia', 4.8, 89, array['decor', 'lamp'], 'Lampu Hias', 'Menghadirkan suasana hangat dan natural untuk ruang tamu maupun kamar tidur.', false, true, 10),
  ('topi-pantai', 'Topi Pantai', 50000, '/katalog/topi_pantai.png', 'Lingkaran: 16cm, 17cm, 19cm, 20cm', array['Lingkar 16 cm', 'Lingkar 17 cm', 'Lingkar 19 cm', 'Lingkar 20 cm'], 'Best Seller', 'Tersedia', 4.8, 100, array['accessories', 'popular'], 'Tas & Aksesoris', 'Cocok digunakan saat beraktivitas di pantai maupun kegiatan luar ruangan.', false, true, 11),
  ('kotak-tisu', 'Kotak Tisu', 35000, '/katalog/kotak_tisu.jpeg', 'P: 24cm | L: 13cm | T: 8cm', '{}', 'Wadah Penyimpanan', 'Tersedia', 4.8, 50, array['box', 'popular'], 'Wadah Penyimpanan', 'Cocok untuk melengkapi dekorasi meja ruang tamu maupun kamar tidur.', false, true, 12),
  ('paket-pemula-esensial', 'Paket Pemula Esensial (2 Produk)', 68000, '/recomended.png', 'Keranjang Mini + Tempat Tisu', '{}', 'Pilihan Terlaris', 'Tersedia', 4.9, 64, array['bundle'], 'Paket Hemat', 'Produk anyaman fungsional yang mudah ditata dan tidak memerlukan perawatan rumit. Sangat cocok bagi Anda yang baru pertama kali menghias rumah dengan dekorasi pandan alami.', true, true, 13),
  ('paket-oasis-ramah-lingkungan', 'Paket Oasis Ramah Lingkungan', 72000, '/recomended2.png', 'Set Anyaman 100% Pandan Alami', '{}', '100% Bahan Alami', 'Tersedia', 4.9, 58, array['bundle'], 'Paket Hemat', 'Dibuat dari daun pandan asli berkualitas tinggi tanpa pewarna kimia berbahaya. Permukaan halus dan serat alami yang kuat membuatnya aman ditempatkan di mana saja, termasuk di dekat anak-anak.', true, true, 14)
on conflict (slug) do update set
  name = excluded.name,
  price = excluded.price,
  image_path = excluded.image_path,
  dimensions = excluded.dimensions,
  variants = excluded.variants,
  badge = excluded.badge,
  stock_label = excluded.stock_label,
  rating = excluded.rating,
  reviews_count = excluded.reviews_count,
  categories = excluded.categories,
  category_label = excluded.category_label,
  description = excluded.description,
  is_bundle = excluded.is_bundle,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;
