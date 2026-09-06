-- ==========================================================================
-- SABÍ SUPER-APP - SECURE LEDGER & DATA PRIVACY MIGRATION
-- ==========================================================================

-- 1. Asegurar columnas fiscales, bancarias y de referidos en profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(10, 2) DEFAULT 250.00;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS driver_wallet NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS persoonnummer TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_account TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_connect_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS persoonnummer_doc TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS identity_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS identity_doc TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_signup_date TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS delivery_credits NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS free_sub_days_granted INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS driver_first_trip_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referrals_list JSONB DEFAULT '[]'::jsonb;

-- 2. Crear la tabla de transacciones de billetera (wallet_transactions)
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    persoonnummer TEXT,
    monto NUMERIC(12, 2) NOT NULL,
    tipo TEXT NOT NULL, -- 'recarga', 'compra_escrow', 'liberacion_venta', 'comision_logistica', 'retiro'
    status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'completed', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS en wallet_transactions
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas RLS para wallet_transactions
DROP POLICY IF EXISTS "Los usuarios pueden ver sus propias transacciones" ON public.wallet_transactions;
CREATE POLICY "Los usuarios pueden ver sus propias transacciones"
    ON public.wallet_transactions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Los usuarios pueden insertar sus propias transacciones" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Los usuarios pueden insertar sus propias transacciones pendientes" ON public.wallet_transactions;
CREATE POLICY "Los usuarios pueden insertar sus propias transacciones pendientes"
    ON public.wallet_transactions FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND 
        status = 'pending'
    );

-- 4. Triggers para actualizar el saldo en Profiles de forma automática y protegerlo
-- A. Función para recalcular saldo en base a transacciones completadas
CREATE OR REPLACE FUNCTION public.actualizar_saldo_usuario()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' THEN
        -- Permitir temporalmente la actualización interna del balance
        PERFORM set_config('my.internal_update', 'true', true);
        
        IF NEW.tipo = 'comision_logistica' THEN
            UPDATE public.profiles
            SET driver_wallet = COALESCE(driver_wallet, 0) + NEW.monto
            WHERE id = NEW.user_id;
        ELSE
            UPDATE public.profiles
            SET wallet_balance = COALESCE(wallet_balance, 0) + NEW.monto
            WHERE id = NEW.user_id;
        END IF;
        
        -- Restablecer el estado
        PERFORM set_config('my.internal_update', 'false', true);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para automatizar el cálculo de saldo al insertar/actualizar transacciones
DROP TRIGGER IF EXISTS trigger_completar_transaccion ON public.wallet_transactions;
CREATE TRIGGER trigger_completar_transaccion
    AFTER INSERT OR UPDATE OF status ON public.wallet_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.actualizar_saldo_usuario();

-- B. Función de seguridad para evitar que el cliente altere saldos directamente en profiles
CREATE OR REPLACE FUNCTION public.proteger_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Si la actualización no proviene de un flujo interno del Ledger, restauramos el saldo anterior
    IF current_setting('my.internal_update', true) IS DISTINCT FROM 'true' THEN
        NEW.wallet_balance := OLD.wallet_balance;
        NEW.driver_wallet := OLD.driver_wallet;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger de protección en la tabla profiles
DROP TRIGGER IF EXISTS trigger_proteger_wallet ON public.profiles;
CREATE TRIGGER trigger_proteger_wallet
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.proteger_wallet_balance();


-- 5. Proteger la privacidad de los perfiles de usuario
-- Evita que cualquiera descargue saldos, cuentas bancarias e información fiscal ajena,
-- excepto el propietario de la cuenta o los administradores de la plataforma.
DROP POLICY IF EXISTS "Los usuarios pueden ver todos los perfiles" ON public.profiles;
DROP POLICY IF EXISTS "Los usuarios pueden ver su propio perfil completo" ON public.profiles;
DROP POLICY IF EXISTS "Los usuarios y administradores pueden ver los perfiles correspondientes" ON public.profiles;

CREATE POLICY "Los usuarios y administradores pueden ver los perfiles correspondientes"
    ON public.profiles FOR SELECT
    USING (
        auth.uid() = id 
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND (role = 'admin' OR email = 'amaury@sabi.aw')
        )
    );

-- 6. Crear una vista pública segura de perfiles para el Marketplace y Delivery
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
    id, 
    name, 
    driver_status, 
    driver_active, 
    referral_code,
    created_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO authenticated, anon;


-- ==========================================================================
-- FUNCIONES DE BASE DE DATOS SEGURAS (SECURITY DEFINER)
-- ==========================================================================

-- A. Función para realizar recargas simuladas de prueba de forma segura
CREATE OR REPLACE FUNCTION public.realizar_recarga_simulada(p_amount numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'El monto debe ser mayor a cero';
  END IF;

  IF p_amount > 5000 THEN
    RAISE EXCEPTION 'El monto de recarga simulada excede el límite permitido de Afl. 5000';
  END IF;

  -- Insertar transacción completada
  INSERT INTO public.wallet_transactions (user_id, monto, tipo, status)
  VALUES (v_user_id, p_amount, 'recarga', 'completed');

  RETURN jsonb_build_object('success', true, 'amount', p_amount);
END;
$$;

-- B. Función para procesar retiros de billetera de forma segura
CREATE OR REPLACE FUNCTION public.procesar_retiro_wallet(p_amount numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_current_balance numeric;
  v_bank_name text;
  v_bank_account text;
  v_name_titular text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'El monto debe ser mayor a cero';
  END IF;

  -- Validar saldo actual y obtener datos bancarios/titular en profiles
  SELECT wallet_balance, bank_name, bank_account, name 
  INTO v_current_balance, v_bank_name, v_bank_account, v_name_titular 
  FROM public.profiles 
  WHERE id = v_user_id;

  IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Saldo insuficiente para completar el retiro';
  END IF;

  IF v_bank_name IS NULL OR v_bank_account IS NULL THEN
    RAISE EXCEPTION 'Debes vincular una cuenta bancaria antes de poder realizar un retiro';
  END IF;

  -- Insertar transacción de retiro (monto negativo) en el ledger
  INSERT INTO public.wallet_transactions (user_id, monto, tipo, status)
  VALUES (v_user_id, -p_amount, 'retiro', 'completed');

  -- Insertar la solicitud de retiro para el proceso consolidado de Wise/pg_cron
  INSERT INTO public.solicitudes_retiro (user_id, monto, estado, banco_nombre, cuenta_numero, nombre_titular)
  VALUES (v_user_id, p_amount, 'pendiente', v_bank_name, v_bank_account, COALESCE(v_name_titular, 'Usuario Sabí'));

  RETURN jsonb_build_object('success', true, 'amount', p_amount);
END;
$$;

-- C. Función para realizar compras en depósito en garantía (Escrow) de forma segura
CREATE OR REPLACE FUNCTION public.realizar_compra_escrow(p_ad_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_price numeric;
  v_seller_id uuid;
  v_current_balance numeric;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Obtener detalles del anuncio
  SELECT price, seller_id INTO v_price, v_seller_id FROM public.marketplace_ads WHERE id = p_ad_id;
  IF v_price IS NULL THEN
    RAISE EXCEPTION 'El anuncio de marketplace no existe';
  END IF;

  IF v_seller_id = v_user_id THEN
    RAISE EXCEPTION 'No puedes comprar tu propio anuncio';
  END IF;

  -- Validar saldo
  SELECT wallet_balance INTO v_current_balance FROM public.profiles WHERE id = v_user_id;
  IF v_current_balance IS NULL OR v_current_balance < v_price THEN
    RAISE EXCEPTION 'Saldo insuficiente para realizar esta compra';
  END IF;

  -- Insertar débito de compra en garantía
  INSERT INTO public.wallet_transactions (user_id, monto, tipo, status)
  VALUES (v_user_id, -v_price, 'compra_escrow', 'completed');

  RETURN jsonb_build_object('success', true, 'amount', v_price, 'seller_id', v_seller_id);
END;
$$;

-- D. Función para completar entregas y liberar dinero retenido (Escrow) de forma segura
CREATE OR REPLACE FUNCTION public.completar_entrega_reparto(
  p_delivery_id uuid,
  p_ad_id uuid,
  p_escrow_amount numeric,
  p_seller_id uuid,
  p_delivery_price numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_driver_earnings numeric;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Si existe un delivery_id válido y la tabla custom_deliveries tiene la fila, la actualizamos.
  IF p_delivery_id IS NOT NULL THEN
    UPDATE public.custom_deliveries 
    SET status = 'delivered' 
    WHERE id = p_delivery_id AND driver_id = v_user_id;
  END IF;

  -- Calcular ganancias del repartidor (85% del precio del delivery)
  v_driver_earnings := p_delivery_price * 0.85;

  -- Insertar cobro de comisión de logística para el chofer
  INSERT INTO public.wallet_transactions (user_id, monto, tipo, status)
  VALUES (v_user_id, v_driver_earnings, 'comision_logistica', 'completed');

  -- Si hay fondos retenidos y un vendedor válido, liberarlos
  IF p_seller_id IS NOT NULL AND p_escrow_amount > 0 THEN
    INSERT INTO public.wallet_transactions (user_id, monto, tipo, status)
    VALUES (p_seller_id, p_escrow_amount, 'liberacion_venta', 'completed');
  END IF;

  RETURN jsonb_build_object(
    'success', true, 
    'driver_earnings', v_driver_earnings,
    'escrow_released', p_escrow_amount
  );
END;
$$;

-- E. Función para procesar recompensas de referidos de forma segura en el servidor
CREATE OR REPLACE FUNCTION public.procesar_referido_nuevo()
RETURNS TRIGGER AS $$
DECLARE
  v_referrer_id uuid;
  v_referrals_list jsonb;
  v_referred_count int;
  v_delivery_credits numeric;
  v_free_sub_days int;
  v_new_referral jsonb;
BEGIN
  -- Si el perfil no indica referido_por o ya estaba establecido, no hacemos nada
  IF NEW.referred_by IS NULL OR (OLD.referred_by IS NOT NULL AND OLD.referred_by = NEW.referred_by) THEN
    RETURN NEW;
  END IF;

  v_referrer_id := NEW.referred_by;

  -- Bloquear fila del referrer para evitar condiciones de carrera
  SELECT referrals_list, delivery_credits, free_sub_days_granted 
  INTO v_referrals_list, v_delivery_credits, v_free_sub_days
  FROM public.profiles 
  WHERE id = v_referrer_id
  FOR UPDATE;

  IF FOUND THEN
    -- Inicializar la lista si está vacía
    IF v_referrals_list IS NULL THEN
      v_referrals_list := '[]'::jsonb;
    END IF;

    -- Registrar el nuevo referido
    v_new_referral := jsonb_build_object(
      'userId', NEW.id,
      'date', NOW(),
      'type', 'user',
      'active', true
    );
    v_referrals_list := v_referrals_list || v_new_referral;

    -- Contar referidos activos de los últimos 30 días
    SELECT COUNT(*) INTO v_referred_count
    FROM jsonb_to_recordset(v_referrals_list) AS x(active boolean, type text, date text)
    WHERE x.active = true 
      AND x.type = 'user' 
      AND (x.date::timestamp with time zone) >= (NOW() - INTERVAL '30 days');

    -- Aplicar lógica de recompensas (15 y 30 referidos)
    IF v_referred_count = 15 THEN
      v_delivery_credits := COALESCE(v_delivery_credits, 0) + 15.00;
    ELSIF v_referred_count = 30 THEN
      v_free_sub_days := COALESCE(v_free_sub_days, 0) + 30;
    END IF;

    -- Actualizar perfiles
    UPDATE public.profiles
    SET 
      referred_users_count = COALESCE(referred_users_count, 0) + 1,
      referred_active_subscribers = COALESCE(referred_active_subscribers, 0) + 1,
      referrals_list = v_referrals_list,
      delivery_credits = v_delivery_credits,
      free_sub_days_granted = v_free_sub_days
    WHERE id = v_referrer_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger para automatizar el procesamiento de referidos tras actualizar el campo referred_by
DROP TRIGGER IF EXISTS trigger_nuevo_referido ON public.profiles;
CREATE TRIGGER trigger_nuevo_referido
    AFTER UPDATE OF referred_by ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.procesar_referido_nuevo();
