-- ============================================================================
-- ⚡ CYBER-ELEMENTAL // ESQUEMA DE BASE DE DATOS (SUPABASE / POSTGRESQL)
-- ============================================================================
-- Este script crea la estructura completa de base de datos para Cyber-Elemental,
-- incluyendo la tabla de partidas, índices de rendimiento y políticas RLS
-- para historial personal y el Top 10 Speedrunners.
-- ============================================================================

-- 1. Tabla de Registro de Incursiones y Partidas
CREATE TABLE IF NOT EXISTS public.match_runs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL DEFAULT auth.uid(),
    player_name TEXT,
    won BOOLEAN NOT NULL DEFAULT FALSE,
    tower_id INT NOT NULL DEFAULT 1,
    floor_reached INT NOT NULL,
    duration_seconds INT NOT NULL,
    scrap_collected INT DEFAULT 0,
    squad JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asegurar columnas si la tabla ya existía
ALTER TABLE public.match_runs ADD COLUMN IF NOT EXISTS player_name TEXT;
ALTER TABLE public.match_runs ADD COLUMN IF NOT EXISTS tower_id INT NOT NULL DEFAULT 1;

-- 2. Habilitar Seguridad por Fila (Row Level Security - RLS)
ALTER TABLE public.match_runs ENABLE ROW LEVEL SECURITY;

-- 3. Índices para optimizar la velocidad del Leaderboard por torre y consultas
CREATE INDEX IF NOT EXISTS idx_match_runs_speedrun_tower 
    ON public.match_runs (tower_id, won, duration_seconds ASC) 
    WHERE won = TRUE;

CREATE INDEX IF NOT EXISTS idx_match_runs_user 
    ON public.match_runs (user_id, created_at DESC);

-- 4. Políticas de Seguridad (RLS)

-- A. Permitir que cada usuario consulte todo su historial personal
DROP POLICY IF EXISTS "Users can read their own runs" ON public.match_runs;
CREATE POLICY "Users can read their own runs"
    ON public.match_runs FOR SELECT
    USING (auth.uid() = user_id);

-- B. Permitir lectura pública de partidas ganadas para la Clasificación (Top 10)
DROP POLICY IF EXISTS "Allow public read for winning runs leaderboard" ON public.match_runs;
CREATE POLICY "Allow public read for winning runs leaderboard"
    ON public.match_runs FOR SELECT
    USING (won = TRUE);

-- C. Permitir que los usuarios autenticados guarden sus propias partidas
DROP POLICY IF EXISTS "Users can insert their own runs" ON public.match_runs;
CREATE POLICY "Users can insert their own runs"
    ON public.match_runs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 5. Tabla de Perfil de Jugador y Meta-Progresión (Chatarra Global y Habilidades Desbloqueadas)
CREATE TABLE IF NOT EXISTS public.player_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    global_scrap INT NOT NULL DEFAULT 0,
    unlocked_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asegurar columnas si la tabla ya existía
ALTER TABLE public.player_profiles ADD COLUMN IF NOT EXISTS global_scrap INT DEFAULT 0;
ALTER TABLE public.player_profiles ADD COLUMN IF NOT EXISTS unlocked_skills JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.player_profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.player_profiles ADD COLUMN IF NOT EXISTS avatar_icon TEXT DEFAULT 'DEFAULT';
ALTER TABLE public.player_profiles ADD COLUMN IF NOT EXISTS tower_completions JSONB DEFAULT '{"1": 0, "2": 0, "3": 0}'::jsonb;
ALTER TABLE public.player_profiles ADD COLUMN IF NOT EXISTS achievements JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.player_profiles ADD COLUMN IF NOT EXISTS saved_run JSONB;
ALTER TABLE public.player_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Índice único e insensible a mayúsculas para username
CREATE UNIQUE INDEX IF NOT EXISTS idx_player_profiles_username_lower 
    ON public.player_profiles (LOWER(username))
    WHERE username IS NOT NULL AND username <> '';

-- Habilitar RLS en player_profiles
ALTER TABLE public.player_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad para player_profiles:
DROP POLICY IF EXISTS "Users can read their own profile" ON public.player_profiles;
DROP POLICY IF EXISTS "Allow public read of player profiles" ON public.player_profiles;
CREATE POLICY "Allow public read of player profiles"
    ON public.player_profiles FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.player_profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.player_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.player_profiles;
CREATE POLICY "Users can update their own profile"
    ON public.player_profiles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 6. Tabla de Cosméticos (Auras y Partículas) Adquiridos y Equipados
CREATE TABLE IF NOT EXISTS public.player_cosmetics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
    cosmetic_type TEXT NOT NULL CHECK (cosmetic_type IN ('AURA', 'PARTICLES')),
    cosmetic_id TEXT NOT NULL,
    is_equipped BOOLEAN NOT NULL DEFAULT FALSE,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_cosmetic UNIQUE (user_id, cosmetic_type, cosmetic_id)
);

CREATE INDEX IF NOT EXISTS idx_player_cosmetics_user 
    ON public.player_cosmetics (user_id, cosmetic_type);

ALTER TABLE public.player_cosmetics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own cosmetics" ON public.player_cosmetics;
CREATE POLICY "Users can read their own cosmetics"
    ON public.player_cosmetics FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own cosmetics" ON public.player_cosmetics;
CREATE POLICY "Users can insert their own cosmetics"
    ON public.player_cosmetics FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own cosmetics" ON public.player_cosmetics;
CREATE POLICY "Users can update their own cosmetics"
    ON public.player_cosmetics FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 7. Tabla de Puntos de Control de Incursión por Torre (saved_tower_runs)
CREATE TABLE IF NOT EXISTS public.saved_tower_runs (
    user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    tower_completed INT NOT NULL, -- 1 o 2
    current_tower INT NOT NULL,   -- 2 o 3
    floor INT NOT NULL,           -- 11 o 21
    scrap INT NOT NULL DEFAULT 0,
    squad JSONB NOT NULL,         -- Robots con HP, maxHp, nivel, XP, skills (chips), arma
    inventory JSONB NOT NULL,     -- Weapons e items recolectados
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.saved_tower_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own saved run" ON public.saved_tower_runs;
CREATE POLICY "Users can read their own saved run"
    ON public.saved_tower_runs FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own saved run" ON public.saved_tower_runs;
CREATE POLICY "Users can insert their own saved run"
    ON public.saved_tower_runs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own saved run" ON public.saved_tower_runs;
CREATE POLICY "Users can update their own saved run"
    ON public.saved_tower_runs FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own saved run" ON public.saved_tower_runs;
CREATE POLICY "Users can delete their own saved run"
    ON public.saved_tower_runs FOR DELETE
    USING (auth.uid() = user_id);


