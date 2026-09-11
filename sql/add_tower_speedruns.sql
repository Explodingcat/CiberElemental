-- ============================================================================
-- ⚡ CYBER-ELEMENTAL // MIGRACIÓN: TOP 10 SPEEDRUN POR TORRE (SUPABASE SQL)
-- ============================================================================
-- Propósito:
-- Separar el Top 10 Speedrun en 3 clasificaciones independientes:
--   1. Torre 1: Torre Cibernética (Pisos 1 - 10) // Jefe: TITAN-X
--   2. Torre 2: Torre Cuántica (Pisos 11 - 20)   // Jefe: TITAN-OMEGA
--   3. Torre 3: Torre de Singularidad (Pisos 21 - 30) // Jefe: SINGULARIDAD-ZERO
--
-- Instrucciones:
-- 1. Abre tu Dashboard en https://supabase.com/dashboard
-- 2. Entra a tu proyecto -> SQL Editor.
-- 3. Pega este script completo y pulsa "Run" (Ctrl + Enter).
-- ============================================================================

-- 1. Agregar columna tower_id a la tabla match_runs (por defecto Torre 1)
ALTER TABLE public.match_runs 
ADD COLUMN IF NOT EXISTS tower_id INT NOT NULL DEFAULT 1;

-- 2. Backfill retroactivo para clasificar partidas históricas según el piso alcanzado
UPDATE public.match_runs 
SET tower_id = CASE 
    WHEN floor_reached > 20 THEN 3
    WHEN floor_reached > 10 THEN 2
    ELSE 1
END
WHERE tower_id IS NULL OR tower_id = 1;

-- Asegurar que partidas de pisos 11-20 sean Torre 2 y pisos 21-30 sean Torre 3
UPDATE public.match_runs
SET tower_id = 2
WHERE floor_reached BETWEEN 11 AND 20 AND tower_id = 1;

UPDATE public.match_runs
SET tower_id = 3
WHERE floor_reached > 20 AND tower_id = 1;

-- 3. Crear índice optimizado compuesto por torre para acelerar el Top 10 de cada sector
CREATE INDEX IF NOT EXISTS idx_match_runs_speedrun_tower 
    ON public.match_runs (tower_id, won, duration_seconds ASC) 
    WHERE won = TRUE;

-- 4. Reafirmar política de lectura pública para las victorias en el Leaderboard
DROP POLICY IF EXISTS "Allow public read for winning runs leaderboard" ON public.match_runs;
CREATE POLICY "Allow public read for winning runs leaderboard"
    ON public.match_runs FOR SELECT
    USING (won = TRUE);

-- ============================================================================
-- CONSULTAS DE VERIFICACIÓN (Comprueba el Top de cada Torre):
-- ============================================================================

-- Top 10 Torre 1 (Cibernética)
SELECT 
    'Torre 1' AS torre,
    player_name,
    duration_seconds,
    floor_reached,
    created_at
FROM public.match_runs
WHERE won = TRUE AND tower_id = 1
ORDER BY duration_seconds ASC
LIMIT 10;

-- Top 10 Torre 2 (Cuántica)
SELECT 
    'Torre 2' AS torre,
    player_name,
    duration_seconds,
    floor_reached,
    created_at
FROM public.match_runs
WHERE won = TRUE AND tower_id = 2
ORDER BY duration_seconds ASC
LIMIT 10;

-- Top 10 Torre 3 (Singularidad)
SELECT 
    'Torre 3' AS torre,
    player_name,
    duration_seconds,
    floor_reached,
    created_at
FROM public.match_runs
WHERE won = TRUE AND tower_id = 3
ORDER BY duration_seconds ASC
LIMIT 10;
