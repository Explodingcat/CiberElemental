-- ============================================================================
-- ⚡ CYBER-ELEMENTAL // MIGRACIÓN: PERFIL DE USUARIO Y LOGROS
-- ============================================================================
-- Este script amplía la tabla `player_profiles` para soportar:
-- 1. Nombre de usuario único (sensible y validado).
-- 2. Icono de perfil / Avatar seleccionado (robots elementales).
-- 3. Contadores de victorias por torre (Torres 1, 2 y 3).
-- 4. Registro de logros desbloqueados por usuario.
-- ============================================================================

-- 1. Nuevas columnas en player_profiles
ALTER TABLE public.player_profiles 
    ADD COLUMN IF NOT EXISTS username TEXT,
    ADD COLUMN IF NOT EXISTS avatar_icon TEXT DEFAULT 'DEFAULT',
    ADD COLUMN IF NOT EXISTS tower_completions JSONB DEFAULT '{"1": 0, "2": 0, "3": 0}'::jsonb,
    ADD COLUMN IF NOT EXISTS achievements JSONB DEFAULT '[]'::jsonb;

-- 2. Índice único e insensible a mayúsculas/minúsculas para el nombre de usuario
-- Evita duplicados como "Comandante" y "comandante" entre distintos usuarios
CREATE UNIQUE INDEX IF NOT EXISTS idx_player_profiles_username_lower 
    ON public.player_profiles (LOWER(username))
    WHERE username IS NOT NULL AND username <> '';

-- 3. Habilitar RLS en caso de que no estuviera activa
ALTER TABLE public.player_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Permitir lectura pública de perfiles (para comprobar unicidad de nombre de usuario en tiempo real y Leaderboard)
DROP POLICY IF EXISTS "Users can read their own profile" ON public.player_profiles;
DROP POLICY IF EXISTS "Allow public read of player profiles" ON public.player_profiles;
CREATE POLICY "Allow public read of player profiles"
    ON public.player_profiles FOR SELECT
    USING (true);

-- 5. Asegurar que los usuarios solo puedan modificar su propio perfil
DROP POLICY IF EXISTS "Users can update their own profile" ON public.player_profiles;
CREATE POLICY "Users can update their own profile"
    ON public.player_profiles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.player_profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.player_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);
