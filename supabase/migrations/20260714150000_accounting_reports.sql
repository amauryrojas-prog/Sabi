-- =============================================================================
-- SABI — Módulo de Contabilidad: tabla accounting_reports
-- =============================================================================
-- Esta tabla guarda los snapshots de cierre contable generados por las EF:
--   - accounting-daily   (00:00 diario)
--   - accounting-weekly  (00:00 domingo)
--   - accounting-monthly (00:00 día 1)
--   - accounting-annual  (00:00 1 enero)
-- Los registros los inserta exclusivamente la EF con service_role.
-- RLS: lecturas solo para usuarios con rol 'admin' (Amaury por ahora).
-- =============================================================================

create table if not exists public.accounting_reports (
  id            uuid primary key default gen_random_uuid(),
  report_type   text not null check (report_type in ('daily', 'weekly', 'monthly', 'annual')),
  period_start  timestamptz not null,
  period_end    timestamptz not null,
  generated_at  timestamptz not null default now(),
  status        text not null default 'closed' check (status in ('closed', 'final', 'void')),
  totals        jsonb not null,
  breakdown     jsonb not null,
  summary_text  text,
  pdf_url       text,
  created_by    text default 'accounting-close-ef',
  constraint accounting_reports_period_chk check (period_end > period_start)
);

create index if not exists accounting_reports_type_start_idx
  on public.accounting_reports (report_type, period_start desc);

create index if not exists accounting_reports_generated_idx
  on public.accounting_reports (generated_at desc);

-- =============================================================================
-- RLS: solo admins pueden leer
-- =============================================================================
alter table public.accounting_reports enable row level security;

-- Política: lectura solo si auth.jwt() ->> 'role' = 'admin' o service_role
drop policy if exists "accounting_reports_select_admin_only" on public.accounting_reports;

create policy "accounting_reports_select_admin_only"
  on public.accounting_reports
  for select
  to authenticated, anon
  using (
    -- service_role pasa siempre
    coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role'
    or
    -- Admin role desde el JWT
    coalesce(current_setting('request.jwt.claim.user_role', true), '') = 'admin'
    or
    -- Fallback: Amaury siempre admin
    (auth.jwt() ->> 'email') = 'amaurymaduro@gmail.com'
  );

-- La EF inserta con service_role, bypaseando RLS. Si el admin escribe
-- desde la app, se requiere el mismo check.
drop policy if exists "accounting_reports_insert_admin_only" on public.accounting_reports;

create policy "accounting_reports_insert_admin_only"
  on public.accounting_reports
  for insert
  to authenticated
  with check (
    (auth.jwt() ->> 'email') = 'amaurymaduro@gmail.com'
    or coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role'
  );

-- No se permite update/delete público (la EF tampoco lo hace)
drop policy if exists "accounting_reports_no_update" on public.accounting_reports;
create policy "accounting_reports_no_update"
  on public.accounting_reports
  for update
  using (false);

drop policy if exists "accounting_reports_no_delete" on public.accounting_reports;
create policy "accounting_reports_no_delete"
  on public.accounting_reports
  for delete
  using (false);
