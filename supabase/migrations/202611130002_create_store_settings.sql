-- Store settings table for dynamic store configuration (e.g. WhatsApp seller number)
create table if not exists public.store_settings (
  key text primary key,
  value text not null,
  description text,
  updated_at timestamptz not null default now()
);

-- Seed default WhatsApp number if not exists
insert into public.store_settings (key, value, description)
values ('seller_whatsapp', '628815838516', 'Nomor WhatsApp resmi Ciamis Pandan Craft untuk menerima pesanan')
on conflict (key) do nothing;

-- RLS & Grants
alter table public.store_settings enable row level security;
grant usage on schema public to anon, authenticated, service_role;
grant select on public.store_settings to anon, authenticated;

drop policy if exists "Public read store_settings" on public.store_settings;
create policy "Public read store_settings"
  on public.store_settings
  for select
  to anon, authenticated
  using (true);
