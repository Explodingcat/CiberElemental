// supabaseClient.js
// Configuración e inicialización del cliente Supabase para Cyber-Elemental

// ⚙️ INSTRUCCIONES: Reemplaza estos valores con las credenciales de tu proyecto de Supabase
// (Disponibles en el Dashboard de Supabase -> Project Settings -> API)
const SUPABASE_CONFIG = {
    url: 'https://eknuyoylmmyalubhnazd.supabase.co',
    anonKey: 'sb_publishable_WMPfDfm-fmNAeq3IZTKI8Q_y5SNDxYH'
};

let supabaseClient = null;

function isSupabaseConfigured() {
    return (
        typeof window.supabase !== 'undefined' &&
        SUPABASE_CONFIG.url &&
        SUPABASE_CONFIG.url !== 'https://TU_PROYECTO.supabase.co' &&
        SUPABASE_CONFIG.anonKey &&
        SUPABASE_CONFIG.anonKey !== 'TU_ANON_PUBLIC_KEY'
    );
}

function initSupabase() {
    if (typeof window.supabase === 'undefined') {
        console.warn('[Supabase] SDK no detectado. Verifica la conexión a Internet.');
        return null;
    }
    
    if (!isSupabaseConfigured()) {
        console.info('[Supabase] Credenciales no configuradas todavía en js/supabaseClient.js.');
        return null;
    }

    try {
        supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        return supabaseClient;
    } catch (err) {
        console.error('[Supabase] Error al inicializar cliente:', err);
        return null;
    }
}

// Inicialización automática
initSupabase();
