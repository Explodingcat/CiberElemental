-- ============================================================================
-- ⚡ CYBER-ELEMENTAL // SCRIPT PARA BORRAR EL TOP 10 / LEADERBOARD (SUPABASE SQL)
-- ============================================================================
-- Propósito:
-- Eliminar las partidas del Top 10 de Speedrunners en Supabase (public.match_runs).
-- ============================================================================

-- OPCIÓN 1: Borrar TODAS las partidas ganadas de todas las torres (vacía completamente el Leaderboard)
-- DELETE FROM public.match_runs
-- WHERE won = TRUE;

-- OPCIÓN 2: Borrar el Top 10 de una TORRE ESPECÍFICA:
-- 2A. Borrar Top 10 Torre 1 (Cibernética)
-- DELETE FROM public.match_runs
-- WHERE id IN (
--     SELECT id FROM public.match_runs
--     WHERE won = TRUE AND (tower_id = 1 OR (tower_id IS NULL AND floor_reached <= 10))
--     ORDER BY duration_seconds ASC
--     LIMIT 10
-- );

-- 2B. Borrar Top 10 Torre 2 (Cuántica)
-- DELETE FROM public.match_runs
-- WHERE id IN (
--     SELECT id FROM public.match_runs
--     WHERE won = TRUE AND (tower_id = 2 OR (tower_id IS NULL AND floor_reached BETWEEN 11 AND 20))
--     ORDER BY duration_seconds ASC
--     LIMIT 10
-- );

-- 2C. Borrar Top 10 Torre 3 (Singularidad)
-- DELETE FROM public.match_runs
-- WHERE id IN (
--     SELECT id FROM public.match_runs
--     WHERE won = TRUE AND (tower_id = 3 OR (tower_id IS NULL AND floor_reached > 20))
--     ORDER BY duration_seconds ASC
--     LIMIT 10
-- );

-- ============================================================================
-- OPCIONES ALTERNATIVAS (Descomenta la que prefieras):
-- ============================================================================

-- OPCIÓN 3: Borrar partidas con tiempos sospechosos/tramposos (ej. menos de 30 segundos)
-- DELETE FROM public.match_runs
-- WHERE won = TRUE AND duration_seconds < 30;

-- OPCIÓN 4: Borrar TODO el historial de partidas (ganadas y perdidas de todas las cuentas)
-- TRUNCATE TABLE public.match_runs;

-- ============================================================================
-- CONSULTAS DE COMPROBACIÓN (Revisar Top 10 por torre):
-- ============================================================================
SELECT 
    id,
    tower_id,
    player_name,
    duration_seconds,
    floor_reached,
    won,
    created_at
FROM public.match_runs
WHERE won = TRUE
ORDER BY tower_id ASC, duration_seconds ASC
LIMIT 30;
