-- =============================================================================
-- SABI — Tabla lottery_draws para almacenar sorteos scrapeados de lottoaruba.com
-- =============================================================================
-- Migration creada para poblar el histórico de lotería (3+ años).
-- Columnas basadas en el formato de scrape-lotto/index.ts:
--   game           (text, identificador interno: lottodidia, lotto5, etc.)
--   draw_number    (int, número del sorteo)
--   draw_date      (date, fecha del sorteo YYYY-MM-DD)
--   draw_type      (text, "Evening", "Midday", "Morning", o NULL)
--   numbers        (int[], números del sorteo)
--   mega_ball      (int o NULL, sólo minimega)
--   zodiac_sign    (text o NULL, sólo zodiac)
--   multi_x        (text o NULL, "X2", "FP" para big4/catochi)
--   source         (text, marcador de la fuente, ej "lottoaruba_full_v3")
--
-- Combina tuplas (game, draw_number, draw_type) son únicas para soportar
-- Big4, Catochi, Zodiac que tienen 2 draws por día (Morning/Midday/Evening).
-- =============================================================================

create table if not exists public.lottery_draws (
  id            bigserial    primary key,
  game          text         not null,
  draw_number   int          not null,
  draw_date     date         not null,
  draw_type     text         default 'Evening',
  numbers       int[]        not null,
  mega_ball     int,
  zodiac_sign   text,
  multi_x       text,
  source        text         default 'lottoaruba_full_v3',
  created_at    timestamptz  not null default now(),
  updated_at    timestamptz  not null default now(),
  constraint lottery_draws_unique
    unique (game, draw_number, draw_type)
);

create index if not exists lottery_draws_game_idx on public.lottery_draws (game);
create index if not exists lottery_draws_date_idx on public.lottery_draws (draw_date desc);
create index if not exists lottery_draws_game_date_idx on public.lottery_draws (game, draw_date desc);
create index if not exists lottery_draws_gist_numbers on public.lottery_draws using gin (numbers);

-- RLS: lectura pública (anon), escritura sólo service_role (EF)
alter table public.lottery_draws enable row level security;

drop policy if exists "lottery_draws_read_anon" on public.lottery_draws;
create policy "lottery_draws_read_anon"
  on public.lottery_draws
  for select
  to anon, authenticated
  using (true);

drop policy if exists "lottery_draws_write_service" on public.lottery_draws;
create policy "lottery_draws_write_service"
  on public.lottery_draws
  for all
  to service_role
  using (true)
  with check (true);
