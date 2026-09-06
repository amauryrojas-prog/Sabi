-- Sabí user-curated Amazon catalog (manual SiteStripe links, no PA-API).
-- Owner can CRUD via service-role; anon can read for the storefront.
create table if not exists public.amazon_user_products (
  asin text primary key,
  category text not null,
  rank smallint not null,
  amazon_url text not null,
  affiliate_tag text not null default 'sabafiliados-20',
  title text,
  description text,
  image_emoji text default '📦',
  price_usd numeric(10,2),
  weight_lbs numeric(8,2) default 1.0,
  has_direct_shipping boolean default false,
  rating numeric(3,2),
  review_count integer,
  added_by text,
  added_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint amazon_user_products_tag_check check (affiliate_tag = 'sabafiliados-20')
);

create index if not exists amazon_user_products_category_rank_idx
  on public.amazon_user_products (category, rank);

alter table public.amazon_user_products enable row level security;

drop policy if exists amazon_user_products_anon_select on public.amazon_user_products;
create policy amazon_user_products_anon_select on public.amazon_user_products
  for select to anon, authenticated using (true);

-- Service role bypasses RLS anyway, but we add an authenticated_write policy
-- so admin clients logged in as a sabí staff member can also mutate.
drop policy if exists amazon_user_products_authenticated_write on public.amazon_user_products;
create policy amazon_user_products_authenticated_write on public.amazon_user_products
  for all to authenticated
  using (true) with check (true);
