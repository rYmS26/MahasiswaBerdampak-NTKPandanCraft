-- Migration: Initial schema for NTK Pandan Craft digital catalog & WhatsApp orders
-- Follows Supabase Postgres best practices: identity PKs, indexed FKs, strict RLS, locked search_path

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1. Product categories (circular filters & category tabs)
create table if not exists public.categories (
  id bigint generated always as identity primary key,
  slug text not null unique,
  label text not null,
  image_path text not null,
  tint_class text not null default 'bg-[#eef2e5]',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists categories_sort_order_idx
  on public.categories (sort_order asc);

-- 2. Catalog products & bundles
create table if not exists public.products (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  price integer not null check (price >= 0),
  image_path text not null,
  dimensions text not null,
  variants text[] not null default '{}',
  badge text not null,
  stock_label text not null default 'Tersedia',
  rating numeric(2,1) not null default 5.0 check (rating >= 0 and rating <= 5),
  reviews_count integer not null default 0 check (reviews_count >= 0),
  categories text[] not null default '{}',
  category_label text not null,
  description text not null,
  is_bundle boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_active_sort_idx
  on public.products (is_bundle, sort_order asc)
  where is_active = true;

create index if not exists products_categories_gin_idx
  on public.products using gin (categories);

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
  before update on public.products
  for each row
  execute function public.set_updated_at();

-- 3. Customer WhatsApp checkout orders (server-written only; no public PII read)
create table if not exists public.orders (
  id bigint generated always as identity primary key,
  order_code text not null unique,
  customer_name text not null check (char_length(trim(customer_name)) >= 2),
  customer_address text not null check (char_length(trim(customer_address)) >= 3),
  customer_note text,
  total_qty integer not null check (total_qty > 0),
  total_price integer not null check (total_price >= 0),
  whatsapp_message text not null,
  status text not null default 'pending_wa'
    check (status in ('pending_wa', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx
  on public.orders (created_at desc);

-- 4. Order line items
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

create index if not exists order_items_order_id_idx
  on public.order_items (order_id);

create index if not exists order_items_product_id_idx
  on public.order_items (product_id);

-- 5. Row Level Security & explicit privileges
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.categories, public.products to anon, authenticated;

drop policy if exists "Public read categories" on public.categories;
create policy "Public read categories"
  on public.categories
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Public read active products" on public.products;
create policy "Public read active products"
  on public.products
  for select
  to anon, authenticated
  using (is_active = true);
