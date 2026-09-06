-- ==========================================
-- SABÍ SUPER-APP - REFERRAL SYSTEM MIGRATION
-- ==========================================
-- Copia y pega este script en el editor SQL de tu panel de Supabase
-- para añadir las columnas necesarias para el sistema de referidos.

-- 1. Agregar columnas para el sistema de referidos a public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_signup_date TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS delivery_credits NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS free_sub_days_granted INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS driver_first_trip_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referrals_list JSONB DEFAULT '[]'::jsonb;

-- 2. Crear un índice en referral_code para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);

-- 3. Generar códigos de referidos automáticos para perfiles existentes que no tengan uno
UPDATE public.profiles
SET referral_code = 'SABI-' || UPPER(SUBSTRING(COALESCE(name, 'SABI') FROM 1 FOR 4)) || '-' || FLOOR(1000 + RANDOM() * 9000)::TEXT
WHERE referral_code IS NULL;
