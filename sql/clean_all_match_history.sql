-- ============================================================================
-- ⚡ CYBER-ELEMENTAL // BORRAR TODO EL HISTORIAL Y TOP DE JUGADORES
-- ============================================================================
-- Instrucciones:
-- 1. Ve a tu panel de Supabase: https://supabase.com/dashboard
-- 2. Entra en tu proyecto.
-- 3. En el menú de la izquierda, entra a "SQL Editor".
-- 4. Haz clic en "New query", pega este script y pulsa "Run" (o presiona Ctrl + Enter).
-- ============================================================================

-- OPICIÓN 1: Borrado total e instantáneo de todas las partidas (ganadas y perdidas)
-- Esto resetea completamente el Top 10 y el historial de partidas de todos los usuarios.
TRUNCATE TABLE public.match_runs;

-- ============================================================================
-- CONSULTA DE VERIFICACIÓN (Debe arrojar 0 registros):
-- ============================================================================
SELECT COUNT(*) AS total_partidas_restantes FROM public.match_runs;
