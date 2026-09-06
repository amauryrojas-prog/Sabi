-- Amazon USA catalog cache (PA-API 5, sorted by rating + Amazon's Choice + Prime)
-- Mirrors the pattern of china_catalog_cache for symmetry.
create table if not exists public.amazon_usa_catalog (
  category_id text not null,
  asin text not null,
  rank smallint not null,
  payload jsonb not null,
  refreshed_at timestamptz not null default now(),
  constraint amazon_usa_catalog_pkey primary key (category_id, asin)
);

create index if not exists amazon_usa_catalog_rank_idx
  on public.amazon_usa_catalog (category_id, rank asc);

alter table public.amazon_usa_catalog enable row level security;

drop policy if exists amazon_usa_catalog_anon_select on public.amazon_usa_catalog;
create policy amazon_usa_catalog_anon_select on public.amazon_usa_catalog
  for select to anon, authenticated using (true);
