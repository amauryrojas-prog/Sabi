-- =============================================================================
-- SABI — pg_cron jobs para los 4 cierres contables
-- =============================================================================
-- Daily   a las 00:00 cada día        — cierra el día anterior
-- Weekly  a las 00:00 cada domingo    — cierra la semana anterior (lun-dom)
-- Monthly a las 00:00 día 1 de mes    — cierra el mes anterior
-- Annual  a las 00:00 1 de enero      — cierra el año anterior
-- =============================================================================
-- Requiere extensión pg_cron (la activa Supabase por defecto en proyectos nuevos)
-- =============================================================================

-- Configurar el secret que las EFs wrapper esperan (cron secret)
-- (Esto se debe crear con: supabase secrets set SABI_CRON_SECRET=<random>)
-- Aquí se inserta directamente en la config de Supabase si tienes acceso al dashboard.

-- Si pg_cron no está habilitado, descomentar:
-- create extension if not exists pg_cron;

-- Helper: una sola función que llama a la EF wrapper con el secret
-- (Para que las policies de RLS no se quejen, los cron jobs corren como postgres)

select cron.schedule(
  'sabi-accounting-daily',
  '0 0 * * *',
  $cron$
    select net.http_post(
      url := current_setting('app.functions_url', true) || '/accounting-daily',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Cron-Secret', current_setting('app.sabi_cron_secret', true)
      ),
      body := '{}'::jsonb
    ) as request_id;
  $cron$
);
