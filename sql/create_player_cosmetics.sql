-- ============================================================================
-- ⚡ CYBER-ELEMENTAL // TABLA DE COSMÉTICOS (SUPABASE / POSTGRESQL)
-- ============================================================================
-- Esta tabla almacena como ÚNICA FUENTE DE LA VERDAD los cosméticos
-- (Auras y Partículas) adquiridos y equipados por cada usuario.
-- Ejecutar en: Supabase Dashboard -> SQL Editor
-- ============================================================================

-- 1. Crear tabla player_cosmetics
CREATE TABLE IF NOT EXISTS public.player_cosmetics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
    cosmetic_type TEXT NOT NULL CHECK (cosmetic_type IN ('AURA', 'PARTICLES')),
    cosmetic_id TEXT NOT NULL,
    is_equipped BOOLEAN NOT NULL DEFAULT FALSE,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_cosmetic UNIQUE (user_id, cosmetic_type, cosmetic_id)
);

-- 2. Índices para acelerar consultas por usuario
CREATE INDEX IF NOT EXISTS idx_player_cosmetics_user 
    ON public.player_cosmetics (user_id, cosmetic_type);

-- 3. Habilitar Seguridad por Fila (Row Level Security - RLS)
ALTER TABLE public.player_cosmetics ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Seguridad (RLS)

-- A. Permitir a cada usuario ver sus propios cosméticos adquiridos y equipados
DROP POLICY IF EXISTS "Users can read their own cosmetics" ON public.player_cosmetics;
CREATE POLICY "Users can read their own cosmetics"
    ON public.player_cosmetics FOR SELECT
    USING (auth.uid() = user_id);

-- B. Permitir a cada usuario registrar nuevos cosméticos comprados
DROP POLICY IF EXISTS "Users can insert their own cosmetics" ON public.player_cosmetics;
CREATE POLICY "Users can insert their own cosmetics"
    ON public.player_cosmetics FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- C. Permitir a cada usuario actualizar el estado (equipar/desequipar)
DROP POLICY IF EXISTS "Users can update their own cosmetics" ON public.player_cosmetics;
CREATE POLICY "Users can update their own cosmetics"
    ON public.player_cosmetics FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
