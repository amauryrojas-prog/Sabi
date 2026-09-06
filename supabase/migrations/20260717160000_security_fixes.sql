-- =============================================================================
-- MIGRACIÓN DE SEGURIDAD: processed_stripe_events, is_admin(), RLS y acreditar_wallet()
-- =============================================================================

-- 1. Tabla de idempotencia para Stripe Webhooks
CREATE TABLE IF NOT EXISTS public.processed_stripe_events (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Habilitar RLS en processed_stripe_events (solo accesible por rol de servicio)
ALTER TABLE public.processed_stripe_events ENABLE ROW LEVEL SECURITY;

-- 2. Asegurar restricción del rol en profiles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin'));

-- 3. Función auxiliar is_admin() para políticas
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    );
$$;

-- 4. Actualizar trigger proteger_wallet_balance para proteger la columna 'role'
CREATE OR REPLACE FUNCTION public.proteger_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Si la actualización no proviene de un flujo interno del Ledger, restauramos el saldo anterior
    IF current_setting('my.internal_update', true) IS DISTINCT FROM 'true' THEN
        NEW.wallet_balance := OLD.wallet_balance;
        NEW.driver_wallet := OLD.driver_wallet;
    END IF;

    -- El rol solo puede ser modificado por la service_role o por un admin
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        IF COALESCE(current_setting('request.jwt.claim.role', true), '') <> 'service_role' 
           AND NOT EXISTS (
               SELECT 1 FROM public.profiles 
               WHERE id = auth.uid() AND role = 'admin'
           ) THEN
            NEW.role := OLD.role;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Actualizar políticas de RLS en accounting_reports
ALTER TABLE public.accounting_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "accounting_reports_select_admin_only" ON public.accounting_reports;
DROP POLICY IF EXISTS "only admins read accounting" ON public.accounting_reports;

CREATE POLICY "only admins read accounting"
    ON public.accounting_reports
    FOR SELECT
    TO authenticated, anon
    USING (
        COALESCE(current_setting('request.jwt.claim.role', true), '') = 'service_role'
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "accounting_reports_insert_admin_only" ON public.accounting_reports;
DROP POLICY IF EXISTS "only admins insert accounting" ON public.accounting_reports;

CREATE POLICY "only admins insert accounting"
    ON public.accounting_reports
    FOR INSERT
    TO authenticated
    WITH CHECK (
        COALESCE(current_setting('request.jwt.claim.role', true), '') = 'service_role'
        OR public.is_admin()
    );

-- 6. Función segura acreditar_wallet
CREATE OR REPLACE FUNCTION public.acreditar_wallet(p_user_id UUID, p_amount NUMERIC)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.wallet_transactions (user_id, monto, tipo, status)
    VALUES (p_user_id, p_amount, 'recarga', 'completed');
    RETURN jsonb_build_object('success', true);
END;
$$;
