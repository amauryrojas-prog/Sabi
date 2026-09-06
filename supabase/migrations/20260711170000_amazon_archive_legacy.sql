-- Backup table for legacy Amazon products removed from the catalog on 2026-07-11.
-- Amaury confirmed those 6 were sample data (K&N, OBD2, Chromecast v2020, ASUS, Snorkel, Kayak)
-- and asked that only products he explicitly sends via Excel be kept.
-- This table preserves them for later reuse if needed; no business logic reads from it.

create table if not exists public.amazon_archive_legacy (
  asin text primary key,
  category text not null,
  original_slot text,
  title text,
  price_usd numeric(10,2),
  weight_lbs numeric(8,2),
  amazon_url text,
  archived_at timestamptz not null default now(),
  reason text default 'Legacy 2025 catalog removed per Amaury on 2026-07-11'
);

alter table public.amazon_archive_legacy enable row level security;

drop policy if exists amazon_archive_legacy_anon_select on public.amazon_archive_legacy;
create policy amazon_archive_legacy_anon_select on public.amazon_archive_legacy
  for select to anon, authenticated using (true);

insert into public.amazon_archive_legacy
  (asin, category, original_slot, title, price_usd, weight_lbs, amazon_url)
values
  ('B000C3XDGI', 'auto_parts', 'AUT-01', 'Filtro de Aceite K&N (HP-1008)',        14.99, 0.80, 'https://www.amazon.com/dp/B000C3XDGI?tag=sabafiliados-20'),
  ('B07D1164YT', 'tools',      'TLS-02', 'Escáner OBD2 Launch Creader 3001',        25.99, 0.60, 'https://www.amazon.com/dp/B07D1164YT?tag=sabafiliados-20'),
  ('B08KRV7S63', 'electronics','ELC-03', 'Chromecast con Google TV 4K (2020)',      49.99, 0.70, 'https://www.amazon.com/dp/B08KRV7S63?tag=sabafiliados-20'),
  ('B0BYMXF49H', 'computers',  'CMP-02', 'Laptop ASUS Vivobook Go 15',            229.99, 5.20, 'https://www.amazon.com/dp/B0BYMXF49H?tag=sabafiliados-20'),
  ('B01GDVS20A', 'sports',     'SPT-01', 'Máscara de Snorkel Wildhorn Seaview V3', 39.99, 1.50, 'https://www.amazon.com/dp/B01GDVS20A?tag=sabafiliados-20'),
  ('B00177J4JS', 'sports',     'SPT-02', 'Kayak Intex Explorer K2',                89.99, 27.20, 'https://www.amazon.com/dp/B00177J4JS?tag=sabafiliados-20')
on conflict (asin) do nothing;
