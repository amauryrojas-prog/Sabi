-- Migration: schedule china-catalog-cache refresh
-- Security pattern: cron calls the EF with a shared secret stored in `app.cron_secret`.
-- Owner of the DB is configured by the dashboard operator.
select cron.schedule(
  'refresh-china-catalog-cache',
  '17 */6 * * *',
  $$
    select net.http_post(
      url := 'https://bfbqiocegzjqbogvjlux.supabase.co/functions/v1/china-catalog-cache',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Cron-Secret', coalesce(current_setting('app.cron_secret', true), 'unset')
      ),
      body := '{"action":"refresh-all"}'::jsonb
    );
  $$
);

do $$
declare
  k text;
begin
  k := current_setting('app.cron_secret', true);
  if k is null or k = '' then
    alter database postgres set "app.cron_secret" = 'ct5bpLbQB0bifs_ealtNSHodlCeciNk66ZdMiZechzwsc0lvbvckZRsZDjIEcd70';
  raise notice 'app.cron_secret set by this migration';
  else
    raise notice 'app.cron_secret is configured';
  end if;
end $$;
