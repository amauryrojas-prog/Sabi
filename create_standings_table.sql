-- =======================================================
-- TABLA DE POSICIONES DEPORTIVAS REALES - SABÍ SUPER-APP
-- =======================================================
-- Copia y ejecuta este código SQL en el panel de control de tu Supabase
-- (Sección "SQL Editor" -> "+ New Query" -> Ejecutar)

CREATE TABLE IF NOT EXISTS public.sports_standings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sport TEXT NOT NULL,          -- 'futbol', 'beisbol', 'baloncesto'
    league TEXT NOT NULL,         -- 'esp.1' (La Liga), 'eng.1' (Premier League), 'nba', 'mlb'
    team TEXT NOT NULL,           -- Nombre del equipo
    rank INT NOT NULL,            -- Posición/Rango
    played INT NOT NULL,          -- Partidos Jugados
    won INT NOT NULL,             -- Partidos Ganados
    drawn INT NOT NULL DEFAULT 0, -- Partidos Empatados (sólo fútbol)
    lost INT NOT NULL,            -- Partidos Perdidos
    points INT NOT NULL DEFAULT 0,-- Puntos (sólo fútbol/hockey)
    pct TEXT,                     -- Porcentaje (béisbol/básquetbol, ej: ".580")
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (sport, league, team)
);

-- Habilitar seguridad RLS
ALTER TABLE public.sports_standings ENABLE ROW LEVEL SECURITY;

-- Crear política de lectura pública
DROP POLICY IF EXISTS "Cualquiera puede leer posiciones" ON public.sports_standings;
CREATE POLICY "Cualquiera puede leer posiciones" ON public.sports_standings FOR SELECT USING (true);
