-- ============================================================================
-- ⚡ CYBER-ELEMENTAL // TABLA DE PUNTOS DE CONTROL DE TORRE (saved_tower_runs)
-- ============================================================================
-- Permite guardar el estado completo del escuadrón (personajes, niveles, HP, XP,
-- habilidades, armas, ítems y chatarra) al finalizar una torre (Piso 10 o 20),
-- evitando el almacenamiento local y garantizando seguridad en el backend.
-- ============================================================================

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

-- Columna de respaldo en player_profiles
ALTER TABLE public.player_profiles ADD COLUMN IF NOT EXISTS saved_run JSONB;

-- Habilitar Seguridad por Fila (RLS)
ALTER TABLE public.saved_tower_runs ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad RLS
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
