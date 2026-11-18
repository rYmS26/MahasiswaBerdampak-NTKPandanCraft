-- ==============================================================================
-- MIGRASI INKREMENTAL: MANAJEMEN STOK & CYBERSECURITY RLS HARDENING
-- Jalankan di Supabase SQL Editor untuk menambahkan kolom stock & memperketat RLS
-- ==============================================================================

-- 1. Tambahkan kolom stock (integer, minimal 0) pada tabel products
alter table public.products
  add column if not exists stock integer not null default 20 check (stock >= 0);

-- Sinkronisasi nilai stok awal berdasarkan stock_label yang sudah ada
update public.products
set stock = case
  when lower(stock_label) like '%habis%' then 0
  when stock_label ~ '\d+' then greatest(0, (regexp_match(stock_label, '(\d+)'))[1]::integer)
  else 20
end
where stock = 20;

-- 2. Perketat Row Level Security (RLS)
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.store_settings enable row level security;

revoke all on public.categories, public.products, public.orders, public.order_items, public.store_settings from anon, authenticated;

grant usage on schema public to anon, authenticated, service_role;
grant select on public.categories, public.products, public.store_settings to anon, authenticated;
grant insert on public.orders, public.order_items to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;

drop policy if exists "Public read categories" on public.categories;
create policy "Public read categories" on public.categories
  for select to anon, authenticated using (true);

drop policy if exists "Public read active products" on public.products;
create policy "Public read active products" on public.products
  for select to anon, authenticated using (is_active = true);

drop policy if exists "Public read store_settings" on public.store_settings;
create policy "Public read store_settings" on public.store_settings
  for select to anon, authenticated using (true);

drop policy if exists "Buyers can insert orders" on public.orders;
create policy "Buyers can insert orders" on public.orders
  for insert to anon, authenticated
  with check (status = 'pending_wa' and total_qty > 0 and total_price >= 0);

drop policy if exists "Buyers can insert order_items" on public.order_items;
create policy "Buyers can insert order_items" on public.order_items
  for insert to anon, authenticated
  with check (qty > 0 and unit_price >= 0 and subtotal >= 0);
