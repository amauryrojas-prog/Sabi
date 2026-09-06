-- ==========================================================================
-- SABÍ - LOTTERY CRON JOBS
-- ==========================================================================
-- Ejecuta fetch-lottery automáticamente después de cada sorteo
-- ==========================================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ==========================================================================
-- CRON JOBS
-- ==========================================================================

-- 2:30 PM diario - Sorteos del mediodía (Catochi, Big 4, 1-OFF, Zodiac, Lucky 3)
SELECT cron.schedule(
  'fetch-lottery-midday',
  '30 14 * * *',
  $$
  SELECT net.http_post(
    url := 'https://bfbqiocegzjqbogvjlux.supabase.co/functions/v1/fetch-lottery',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer sb_publishable_EIvJY4hLqsnZbgC-AVs76Q_yey2GIAE'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- 7:00 PM diario - Sorteos de la noche (Catochi, Big 4, 1-OFF, Zodiac, Lucky 3)
SELECT cron.schedule(
  'fetch-lottery-evening-1',
  '0 19 * * *',
  $$
  SELECT net.http_post(
    url := 'https://bfbqiocegzjqbogvjlux.supabase.co/functions/v1/fetch-lottery',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer sb_publishable_EIvJY4hLqsnZbgC-AVs76Q_yey2GIAE'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- 7:50 PM diario - Lotto di Dia, Mini Mega, Lotto 5
SELECT cron.schedule(
  'fetch-lottery-evening-2',
  '50 19 * * *',
  $$
  SELECT net.http_post(
    url := 'https://bfbqiocegzjqbogvjlux.supabase.co/functions/v1/fetch-lottery',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer sb_publishable_EIvJY4hLqsnZbgC-AVs76Q_yey2GIAE'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- 9:05 PM diario - Wega di number Korsou
SELECT cron.schedule(
  'fetch-lottery-korsou',
  '5 21 * * *',
  $$
  SELECT net.http_post(
    url := 'https://bfbqiocegzjqbogvjlux.supabase.co/functions/v1/fetch-lottery',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer sb_publishable_EIvJY4hLqsnZbgC-AVs76Q_yey2GIAE'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- 2:05 PM domingo - Sorteo único del domingo (Lotto di Dia 2:00 PM)
SELECT cron.schedule(
  'fetch-lottery-sunday',
  '5 14 * * 0',
  $$
  SELECT net.http_post(
    url := 'https://bfbqiocegzjqbogvjlux.supabase.co/functions/v1/fetch-lottery',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer sb_publishable_EIvJY4hLqsnZbgC-AVs76Q_yey2GIAE'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Verificar cron jobs creados
SELECT jobname, schedule, active FROM cron.job ORDER BY jobname;