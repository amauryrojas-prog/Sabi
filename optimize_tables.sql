-- =======================================================
-- MIGRACIÓN DE OPTIMIZACIÓN - SABÍ SUPER-APP
-- =======================================================
-- Copia y ejecuta este código SQL en el panel de control de tu Supabase
-- (Sección "SQL Editor" -> "+ New Query" -> Ejecutar)

-- 0. Añadir columna group_name a sports_standings si no existe
ALTER TABLE public.sports_standings ADD COLUMN IF NOT EXISTS group_name TEXT;

-- 1. Optimizar live_sports_matches (Evitar duplicados)
-- Eliminar duplicados manteniendo solo el registro más reciente
DELETE FROM public.live_sports_matches a
USING public.live_sports_matches b
WHERE a.id < b.id
  AND a.sport = b.sport
  AND a.league = b.league
  AND a.home_team = b.home_team
  AND a.away_team = b.away_team;

-- Añadir restricción única si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'live_sports_matches_sport_league_home_away_key'
    ) THEN
        ALTER TABLE public.live_sports_matches 
        ADD CONSTRAINT live_sports_matches_sport_league_home_away_key 
        UNIQUE (sport, league, home_team, away_team);
    END IF;
END $$;


-- 2. Optimizar flight_arrivals (Evitar duplicados)
-- Eliminar duplicados
DELETE FROM public.flight_arrivals a
USING public.flight_arrivals b
WHERE a.id < b.id
  AND a.flight_number = b.flight_number
  AND a.scheduled_time = b.scheduled_time;

-- Añadir restricción única si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'flight_arrivals_flight_number_sched_time_key'
    ) THEN
        ALTER TABLE public.flight_arrivals 
        ADD CONSTRAINT flight_arrivals_flight_number_sched_time_key 
        UNIQUE (flight_number, scheduled_time);
    END IF;
END $$;
