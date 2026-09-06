-- ==========================================
-- SABÍ SUPER-APP - SUPABASE DATABASE SCHEMA
-- ==========================================
-- Copia y pega este script en el editor SQL de tu panel de Supabase
-- para crear todas las tablas, relaciones y seguridad en segundos.

-- 1. Tabla de Perfiles de Usuario (User Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    wallet_balance NUMERIC(10, 2) DEFAULT 250.00,
    driver_status TEXT DEFAULT 'unregistered', -- 'unregistered', 'pending', 'approved'
    driver_active BOOLEAN DEFAULT FALSE,
    driver_wallet NUMERIC(10, 2) DEFAULT 0.00,
    driver_info JSONB DEFAULT NULL, -- Guarda {id, vehicleType, licenseUrl, taxNumber}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar Row Level Security (RLS) para proteger los perfiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Los usuarios pueden ver todos los perfiles" ON public.profiles;
CREATE POLICY "Los usuarios pueden ver todos los perfiles" 
    ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON public.profiles;
CREATE POLICY "Los usuarios pueden actualizar su propio perfil" 
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger para crear automáticamente el perfil en Supabase al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, phone)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'name', 'Nuevo Usuario'),
        new.email,
        new.raw_user_meta_data->>'phone'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. Tabla de Clasificados del Marketplace
CREATE TABLE IF NOT EXISTS public.marketplace_ads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    desc_text TEXT NOT NULL,
    contact TEXT NOT NULL,
    image_url TEXT,
    delivery_enabled BOOLEAN DEFAULT TRUE,
    sponsored BOOLEAN DEFAULT FALSE,
    cpc_bid NUMERIC(10, 2) DEFAULT 0.00,
    clicks INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.marketplace_ads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cualquiera puede ver los anuncios" ON public.marketplace_ads;
CREATE POLICY "Cualquiera puede ver los anuncios" 
    ON public.marketplace_ads FOR SELECT USING (true);

DROP POLICY IF EXISTS "Los usuarios pueden crear anuncios" ON public.marketplace_ads;
CREATE POLICY "Los usuarios pueden crear anuncios" 
    ON public.marketplace_ads FOR INSERT WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Los vendedores pueden actualizar sus propios anuncios" ON public.marketplace_ads;
CREATE POLICY "Los vendedores pueden actualizar sus propios anuncios" 
    ON public.marketplace_ads FOR UPDATE USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Los vendedores pueden eliminar sus propios anuncios" ON public.marketplace_ads;
CREATE POLICY "Los vendedores pueden eliminar sus propios anuncios" 
    ON public.marketplace_ads FOR DELETE USING (auth.uid() = seller_id);


-- 3. Tabla de Pedidos de Delivery Personalizados
CREATE TABLE IF NOT EXISTS public.custom_deliveries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    desc_text TEXT NOT NULL,
    pickup_address TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    gps_coords TEXT DEFAULT 'No compartida',
    price NUMERIC(10, 2) NOT NULL,
    status TEXT DEFAULT 'searching', -- 'searching', 'assigned', 'transit', 'delivered'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.custom_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Los usuarios autenticados pueden ver los deliveries" ON public.custom_deliveries;
CREATE POLICY "Los usuarios autenticados pueden ver los deliveries" 
    ON public.custom_deliveries FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Los usuarios pueden crear solicitudes de delivery" ON public.custom_deliveries;
CREATE POLICY "Los usuarios pueden crear solicitudes de delivery" 
    ON public.custom_deliveries FOR INSERT WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Los usuarios o choferes implicados pueden actualizar el estado" ON public.custom_deliveries;
CREATE POLICY "Los usuarios o choferes implicados pueden actualizar el estado" 
    ON public.custom_deliveries FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = driver_id OR driver_id IS NULL);


-- 4. Tabla de Transmisiones en Vivo (Live Streams)
CREATE TABLE IF NOT EXISTS public.live_streams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    streamer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    video_url TEXT NOT NULL,
    linked_ad_id UUID REFERENCES public.marketplace_ads(id) ON DELETE SET NULL,
    viewers INT DEFAULT 0,
    status TEXT DEFAULT 'live', -- 'live', 'ended'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cualquiera puede ver las transmisiones en vivo" ON public.live_streams;
CREATE POLICY "Cualquiera puede ver las transmisiones en vivo" 
    ON public.live_streams FOR SELECT USING (true);

DROP POLICY IF EXISTS "Los vendedores aprobados pueden iniciar streams" ON public.live_streams;
CREATE POLICY "Los vendedores aprobados pueden iniciar streams" 
    ON public.live_streams FOR INSERT WITH CHECK (auth.uid() = streamer_id);

DROP POLICY IF EXISTS "El streamer puede apagar el stream" ON public.live_streams;
CREATE POLICY "El streamer puede apagar el stream" 
    ON public.live_streams FOR UPDATE USING (auth.uid() = streamer_id);


-- 5. Tabla de Comentarios en Vivo (Real-Time Comments)
CREATE TABLE IF NOT EXISTS public.live_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stream_id UUID REFERENCES public.live_streams(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    user_name TEXT NOT NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.live_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cualquiera puede ver los comentarios del live" ON public.live_comments;
CREATE POLICY "Cualquiera puede ver los comentarios del live" 
    ON public.live_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Los usuarios pueden escribir comentarios" ON public.live_comments;
CREATE POLICY "Los usuarios pueden escribir comentarios" 
    ON public.live_comments FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 6. Tabla para Sorteos Oficiales de Lotería
CREATE TABLE IF NOT EXISTS public.lottery_draws (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game TEXT NOT NULL, -- 'lottodidia', 'zodiac', 'catochi', 'big4', 'lotto5', 'landsloterie', 'minimega'
    draw_number INT NOT NULL,
    draw_date DATE NOT NULL,
    draw_type TEXT DEFAULT 'Evening', -- 'Midday', 'Evening'
    numbers TEXT NOT NULL, -- Números ganadores separados por guion (ej: "04-12-18-22")
    zodiac_sign TEXT, -- Específico para Zodiac
    mega_ball INT, -- Específico para Mini Mega
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (game, draw_number, draw_type)
);

ALTER TABLE public.lottery_draws ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Cualquiera puede leer sorteos" ON public.lottery_draws;
CREATE POLICY "Cualquiera puede leer sorteos" ON public.lottery_draws FOR SELECT USING (true);


-- 7. Tabla para Partidos Deportivos en Vivo y Predicciones
CREATE TABLE IF NOT EXISTS public.live_sports_matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sport TEXT NOT NULL, -- 'futbol', 'beisbol', 'baloncesto', 'nfl', 'nhl', 'local'
    league TEXT NOT NULL, -- Ej: "Aruba Division di Honor", "La Liga", "NBA"
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    home_score INT DEFAULT 0,
    away_score INT DEFAULT 0,
    minute INT DEFAULT 0,
    status TEXT DEFAULT 'scheduled', -- 'scheduled', 'live', 'finished'
    prediction_h2h TEXT, -- Predicción de IA (ej: "45% - 30% - 25%")
    odds_home NUMERIC(5,2),
    odds_draw NUMERIC(5,2),
    odds_away NUMERIC(5,2),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.live_sports_matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Cualquiera puede leer deportes" ON public.live_sports_matches;
CREATE POLICY "Cualquiera puede leer deportes" ON public.live_sports_matches FOR SELECT USING (true);


-- 8. Tabla para Proyecciones y Llegadas (Aeropuerto y Cruceros)
CREATE TABLE IF NOT EXISTS public.flight_arrivals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    flight_number TEXT NOT NULL,
    airline TEXT NOT NULL,
    origin TEXT NOT NULL,
    scheduled_time TIME NOT NULL,
    estimated_time TIME,
    status TEXT NOT NULL, -- 'scheduled', 'delayed', 'landed'
    gate TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.flight_arrivals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Cualquiera puede leer vuelos" ON public.flight_arrivals;
CREATE POLICY "Cualquiera puede leer vuelos" ON public.flight_arrivals FOR SELECT USING (true);


-- 9. Tabla para Clima Actualizado de Aruba
CREATE TABLE IF NOT EXISTS public.weather_data (
    id INT PRIMARY KEY DEFAULT 1, -- Fijo para mantener solo el clima actual
    temperature NUMERIC(4,1) NOT NULL,
    description TEXT NOT NULL,
    humidity INT NOT NULL,
    wind_speed NUMERIC(4,1) NOT NULL,
    icon TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.weather_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Cualquiera puede leer clima" ON public.weather_data;
CREATE POLICY "Cualquiera puede leer clima" ON public.weather_data FOR SELECT USING (true);


-- ==========================================
-- 10. Tabla de Transacciones Ledger para Billetera (wallet_transactions)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    persoonnummer TEXT,
    monto NUMERIC(12, 2) NOT NULL,
    tipo TEXT NOT NULL, -- 'recarga', 'compra_escrow', 'liberacion_venta', 'comision_logistica', 'retiro'
    status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'completed', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad RLS
DROP POLICY IF EXISTS "Los usuarios pueden ver sus propias transacciones" ON public.wallet_transactions;
CREATE POLICY "Los usuarios pueden ver sus propias transacciones"
    ON public.wallet_transactions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Los usuarios pueden insertar sus propias transacciones" ON public.wallet_transactions;
CREATE POLICY "Los usuarios pueden insertar sus propias transacciones"
    ON public.wallet_transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Función del servidor para recalcular saldo en base a transacciones completadas
-- Función del servidor para recalcular saldo en base a transacciones completadas
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

-- Función de seguridad para evitar que el cliente altere saldos directamente en profiles
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

-- Asegurar nuevos campos fiscales y bancarios en profiles si no existen
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS persoonnummer TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_account TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_connect_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS persoonnummer_doc TEXT;

-- Asegurar campos para el sistema de referidos si no existen
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_signup_date TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS delivery_credits NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS free_sub_days_granted INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS driver_first_trip_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referrals_list JSONB DEFAULT '[]'::jsonb;
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);

-- ==========================================
-- 11. Módulo Colombia: Pre-Órdenes Híbridas (colombia_suppliers & sabi_products)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.colombia_suppliers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    whatsapp_phone TEXT NOT NULL, -- WhatsApp con código de país (ej. "57315...")
    bank_account_info TEXT, -- Datos de transferencia (Bancolombia, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.sabi_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_id UUID REFERENCES public.colombia_suppliers(id) ON DELETE SET NULL,
    category TEXT NOT NULL, -- 'fajas', 'jeans', 'calzado'
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price_costo_cop NUMERIC(12, 2) NOT NULL,
    price_venta_awg NUMERIC(10, 2) NOT NULL, -- Calculado automáticamente
    image_emoji TEXT, -- O URL de imagen
    status_disponibilidad BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.colombia_preorders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.sabi_products(id) ON DELETE SET NULL,
    size TEXT NOT NULL,
    quantity INT DEFAULT 1 NOT NULL,
    total_awg NUMERIC(10, 2) NOT NULL,
    status TEXT DEFAULT 'esperando_confirmacion_fab' NOT NULL, -- 'esperando_confirmacion_fab', 'confirmada_por_fabricante', 'pendiente_envio_domestico', 'en_transito_maritimo', 'entregado'
    stripe_hold_id TEXT, -- ID del Payment Intent pre-autorizado en Stripe
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS para seguridad
ALTER TABLE public.colombia_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sabi_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colombia_preorders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cualquiera puede leer productos de importación" 
    ON public.sabi_products FOR SELECT USING (true);

CREATE POLICY "Los usuarios pueden ver sus pre-órdenes" 
    ON public.colombia_preorders FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Los administradores pueden ver todos los proveedores" 
    ON public.colombia_suppliers FOR SELECT USING (true);


-- 13. Tabla de Logs de Búsqueda para Demanda Latente (search_logs)
CREATE TABLE IF NOT EXISTS public.search_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    keyword TEXT NOT NULL,
    conversion_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cualquiera puede insertar logs de búsqueda" 
    ON public.search_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Solo administradores pueden ver logs de búsqueda" 
    ON public.search_logs FOR SELECT USING (true);


-- 14. Procedimiento Almacenado de Métricas Avanzadas de Negocio
CREATE OR REPLACE FUNCTION get_sabi_advanced_metrics()
RETURNS JSON SECURITY DEFINER AS $$
DECLARE
  v_latent_demand JSON;
  v_supplier_scores JSON;
  v_container_cbm NUMERIC;
BEGIN
  -- 1. Cálculo de Demanda Latente (Top búsquedas sin conversión en Aruba)
  SELECT json_agg(t) INTO v_latent_demand FROM (
    SELECT keyword, COUNT(*) as total_searches 
    FROM search_logs 
    WHERE conversion_status = false 
    GROUP BY keyword ORDER BY total_searches DESC LIMIT 5
  ) t;

  -- 2. Score de Confiabilidad de Fabricantes en Colombia
  SELECT json_agg(s) INTO v_supplier_scores FROM (
    SELECT brand_name, gmv_cop,
           ROUND((confirmed_orders::numeric / NULLIF(total_orders, 0)) * 100, 1) as reliability_score
    FROM colombia_suppliers ORDER BY gmv_cop DESC
  ) s;

  -- 3. Métricas de volumen para el corte del barco (CBM Tracker)
  SELECT COALESCE(SUM(p.volume_cbm * o.quantity), 0) INTO v_container_cbm
  FROM order_items o
  JOIN sabi_products p ON o.product_id = p.id
  WHERE o.status = 'ready_for_local_consolidation';

  RETURN json_build_object(
    'latent_demand', v_latent_demand,
    'supplier_scores', v_supplier_scores,
    'current_container_cbm_pct', LEAST(ROUND((v_container_cbm / 60.0) * 100, 1), 100.0) -- Basado en contenedor de 40ft (60 CBM)
  );
END;
$$ LANGUAGE plpgsql;


-- ==========================================
-- 15. Módulo Inmobiliario & Referral Hub (Sabí Real Estate & Scouts)
-- ==========================================

-- Tabla de Propiedades Inmobiliarias (Real Estate Listings)
CREATE TABLE IF NOT EXISTS public.real_estate_listings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    seller_type TEXT DEFAULT 'agent' NOT NULL, -- 'agent', 'direct_owner'
    agency_name TEXT, -- Ej: "Remax Aruba", "Coldwell Banker", "Propietario Directo"
    title TEXT NOT NULL,
    property_type TEXT NOT NULL, -- 'house', 'condo', 'villa', 'land', 'commercial'
    price_usd NUMERIC(12, 2) NOT NULL,
    bedrooms INT DEFAULT 0,
    bathrooms NUMERIC(3, 1) DEFAULT 0,
    area_sqm NUMERIC(10, 2),
    location TEXT NOT NULL, -- 'Noord', 'Oranjestad', 'Palm Beach', 'San Nicolas', 'Santa Cruz', 'Malmok'
    desc_text TEXT NOT NULL,
    image_url TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    agent_commission_pct NUMERIC(5, 2) DEFAULT 4.00,
    sabi_referral_fee_type TEXT DEFAULT 'pct_of_commission' NOT NULL, -- 'pct_of_commission', 'pct_of_price', 'flat_fee'
    sabi_referral_fee_value NUMERIC(10, 2) DEFAULT 15.00 NOT NULL, -- Ej: 15% de comisión, 1.5% del precio, o $2500 flat
    status TEXT DEFAULT 'available' NOT NULL, -- 'available', 'under_contract', 'sold'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.real_estate_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cualquiera puede ver las propiedades inmobiliarias" ON public.real_estate_listings;
CREATE POLICY "Cualquiera puede ver las propiedades inmobiliarias" 
    ON public.real_estate_listings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Los vendedores pueden crear propiedades" ON public.real_estate_listings;
CREATE POLICY "Los vendedores pueden crear propiedades" 
    ON public.real_estate_listings FOR INSERT WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Los vendedores pueden actualizar sus propiedades" ON public.real_estate_listings;
CREATE POLICY "Los vendedores pueden actualizar sus propiedades" 
    ON public.real_estate_listings FOR UPDATE USING (auth.uid() = seller_id);


-- Tabla de Referencias e Ingresos por Conexión (Real Estate Referrals & Escrow)
CREATE TABLE IF NOT EXISTS public.real_estate_referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    listing_id UUID REFERENCES public.real_estate_listings(id) ON DELETE CASCADE NOT NULL,
    seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    affiliate_referrer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Embajador local (amigo de la playa/taxi) si vino por su QR
    buyer_name TEXT NOT NULL,
    buyer_phone TEXT NOT NULL,
    buyer_email TEXT,
    total_referral_fee NUMERIC(12, 2) NOT NULL, -- Monto total acordado que paga el vendedor a Sabí
    sabi_platform_cut NUMERIC(12, 2) NOT NULL, -- Corte que le queda a Sabí Super-App (ej. 100% o 50%)
    affiliate_payout NUMERIC(12, 2) DEFAULT 0.00, -- Pago que va a la Sabí Wallet del embajador local (ej. 50%)
    status TEXT DEFAULT 'lead_registered' NOT NULL, -- 'lead_registered', 'accepted_by_seller', 'showing_scheduled', 'under_contract', 'deal_closed', 'payout_completed', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.real_estate_referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Los usuarios involucrados pueden ver sus referencias" ON public.real_estate_referrals;
CREATE POLICY "Los usuarios involucrados pueden ver sus referencias" 
    ON public.real_estate_referrals FOR SELECT 
    USING (auth.uid() = seller_id OR auth.uid() = buyer_id OR auth.uid() = affiliate_referrer_id);

DROP POLICY IF EXISTS "Cualquier usuario puede registrar un lead de referencia" ON public.real_estate_referrals;
CREATE POLICY "Cualquier usuario puede registrar un lead de referencia" 
    ON public.real_estate_referrals FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Vendedores y administradores pueden actualizar el estado del trato" ON public.real_estate_referrals;
CREATE POLICY "Vendedores y administradores pueden actualizar el estado del trato" 
    ON public.real_estate_referrals FOR UPDATE 
    USING (auth.uid() = seller_id OR auth.uid() = affiliate_referrer_id);


-- ==========================================
-- 21. TABLAS PARA SABÍ STAYS (RENTAS VACACIONALES Y SUBSIDIO COMUNITARIO)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.vacation_rentals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    property_type TEXT NOT NULL, -- 'annex_studio', 'entire_home', 'apartment', 'room'
    description TEXT NOT NULL,
    address TEXT NOT NULL,
    district TEXT NOT NULL, -- 'Noord', 'Oranjestad', 'San Nicolas', 'Santa Cruz', 'Paradera', 'Savaneta'
    nightly_rate_usd NUMERIC(10, 2) NOT NULL,
    local_staycation_discount_pct NUMERIC(5, 2) DEFAULT 25.00,
    max_guests INT DEFAULT 2,
    bedrooms INT DEFAULT 1,
    bathrooms NUMERIC(3, 1) DEFAULT 1.0,
    images JSONB DEFAULT '[]'::jsonb,
    ical_feed_url TEXT,
    auto_cleaning_service BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.vacation_rentals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cualquiera puede ver alquileres vacacionales" ON public.vacation_rentals FOR SELECT USING (true);
CREATE POLICY "Los propietarios pueden crear alquileres" ON public.vacation_rentals FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Los propietarios pueden actualizar sus alquileres" ON public.vacation_rentals FOR UPDATE USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS public.rental_bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rental_id UUID REFERENCES public.vacation_rentals(id) ON DELETE CASCADE NOT NULL,
    guest_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    is_local_resident BOOLEAN DEFAULT FALSE,
    total_price NUMERIC(10, 2) NOT NULL,
    platform_fee NUMERIC(10, 2) NOT NULL, -- 6%
    social_fund_contribution NUMERIC(10, 2) NOT NULL, -- 2.5%
    status TEXT DEFAULT 'confirmed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.rental_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios pueden ver sus reservas" ON public.rental_bookings FOR SELECT USING (auth.uid() = guest_id);
CREATE POLICY "Usuarios pueden crear reservas" ON public.rental_bookings FOR INSERT WITH CHECK (auth.uid() = guest_id);

CREATE TABLE IF NOT EXISTS public.social_subsidy_fund (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID REFERENCES public.rental_bookings(id) ON DELETE SET NULL,
    amount_awg NUMERIC(10, 2) NOT NULL,
    distributed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.social_subsidy_fund ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cualquiera puede leer el estado del fondo social" ON public.social_subsidy_fund FOR SELECT USING (true);


