-- ============================================================================
-- ⚡ CYBER-ELEMENTAL // SCRIPT DE REINICIO DE META-PROGRESIÓN (SUPABASE SQL)
-- ============================================================================
-- Propósito:
-- Reiniciar la chatarra global a 0 y vaciar el árbol de habilidades pasivas
-- desbloqueadas para todas las cuentas de jugadores en la base de datos.
-- ============================================================================

-- 1. Reiniciar TODAS las cuentas a 0 Chatarra Global y 0 Pasivas Desbloqueadas:
UPDATE public.player_profiles
SET 
    global_scrap = 0,
    unlocked_skills = '[]'::jsonb,
    updated_at = NOW();

-- 2. (Opcional) Consultar el estado resultante de las cuentas:
SELECT 
    p.user_id,
    u.email,
    p.global_scrap,
    p.unlocked_skills,
    p.updated_at
FROM public.player_profiles p
LEFT JOIN auth.users u ON p.user_id = u.id
ORDER BY p.updated_at DESC;
