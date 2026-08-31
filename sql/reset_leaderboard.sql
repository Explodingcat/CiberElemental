-- ============================================================================
-- ⚡ CYBER-ELEMENTAL // SCRIPT PARA BORRAR EL TOP 10 / LEADERBOARD (SUPABASE SQL)
-- ============================================================================
-- Propósito:
-- Eliminar las partidas del Top 10 de Speedrunners en Supabase (public.match_runs).
-- ============================================================================

-- OPCIÓN 1: Borrar EXACTAMENTE las 10 partidas que componen el Top 10 actual
DELETE FROM public.match_runs
WHERE id IN (
    SELECT id FROM public.match_runs
    WHERE won = TRUE
    ORDER BY duration_seconds ASC
    LIMIT 10
);

-- ============================================================================
-- OPCIONES ALTERNATIVAS (Descomenta la que prefieras):
-- ============================================================================

-- OPCIÓN 2: Borrar TODAS las partidas ganadas (vacía completamente el Leaderboard)
-- DELETE FROM public.match_runs
-- WHERE won = TRUE;

-- OPCIÓN 3: Borrar partidas con tiempos sospechosos/tramposos (ej. menos de 60 segundos)
-- DELETE FROM public.match_runs
-- WHERE won = TRUE AND duration_seconds < 60;

-- OPCIÓN 4: Borrar TODO el historial de partidas (ganadas y perdidas)
-- TRUNCATE TABLE public.match_runs;

-- ============================================================================
-- CONSULTA DE COMPROBACIÓN:
-- ============================================================================
SELECT 
    id,
    player_name,
    duration_seconds,
    floor_reached,
    won,
    created_at
FROM public.match_runs
WHERE won = TRUE
ORDER BY duration_seconds ASC
LIMIT 10;
