// js/profileManager.js
// Gestor de Perfil de Usuario, Identidad, Validación de Nombre Único, Avatares, Contadores de Torre y Logros

const PROFILE_AVATARS = {
    DEFAULT: {
        id: 'DEFAULT',
        name: 'Robot Cibernético',
        sub: 'Estándar Táctico',
        element: 'NEUTRO',
        emoji: '🤖',
        filter: 'grayscale(1) brightness(0.2) drop-shadow(0 0 5px rgba(255,255,255,0.5))',
        badge: '⚙️ NEUTRAL'
    },
    IGNIS: {
        id: 'IGNIS',
        name: 'Ignis',
        sub: 'Guerrero Ígneo',
        element: 'FUEGO',
        emoji: '🤖',
        elemClass: 'elem-FUEGO',
        badge: '🔥 FUEGO'
    },
    AQUA: {
        id: 'AQUA',
        name: 'Aqua',
        sub: 'Soporte Glacial',
        element: 'AGUA',
        emoji: '🤖',
        elemClass: 'elem-AGUA',
        badge: '💧 AGUA'
    },
    TERRA: {
        id: 'TERRA',
        name: 'Terra',
        sub: 'Coloso Pétreo',
        element: 'TIERRA',
        emoji: '🤖',
        elemClass: 'elem-TIERRA',
        badge: '🪨 TIERRA'
    },
    ZEPHYR: {
        id: 'ZEPHYR',
        name: 'Zephyr',
        sub: 'Pícaro Aéreo',
        element: 'AIRE',
        emoji: '🤖',
        elemClass: 'elem-AIRE',
        badge: '💨 AIRE'
    }
};

// =============================================================================
// CATÁLOGO DE LOGROS EXTENSIBLE
// Para añadir nuevos logros en el futuro, simplemente agrega un objeto a este arreglo:
// { id: 'KEY', title: 'Título', desc: 'Descripción', icon: '🏆', category: '...', check: (profile, meta) => bool }
// =============================================================================
const ACHIEVEMENTS_CATALOG = [
    {
        id: 'CUSTOM_CALLSIGN',
        title: 'Firma Neuronal',
        desc: 'Establece un nombre de comandante personalizado para tu perfil.',
        icon: '✍️',
        category: 'PERFIL',
        check: (profile) => Boolean(profile.username && profile.username.trim().length >= 3)
    },
    {
        id: 'ELEMENTAL_AVATAR',
        title: 'Sintonía Elemental',
        desc: 'Equipa un avatar elemental (Ignis, Aqua, Terra o Zephyr) como icono de perfil.',
        icon: '🤖',
        category: 'PERFIL',
        check: (profile) => profile.avatar_icon && profile.avatar_icon !== 'DEFAULT'
    },
    {
        id: 'TOWER_1_FIRST',
        title: 'Fin de la Red',
        desc: 'Derrota a TITAN-X y conquista la Torre Cibernética por primera vez.',
        icon: '🗼',
        category: 'TORRES',
        check: (profile) => (profile.tower_completions && Number(profile.tower_completions['1']) >= 1)
    },
    {
        id: 'TOWER_1_VETERAN',
        title: 'Veterano de la Red',
        desc: 'Supera la Torre Cibernética al menos 3 veces.',
        icon: '🎖️',
        category: 'TORRES',
        check: (profile) => (profile.tower_completions && Number(profile.tower_completions['1']) >= 3)
    },
    {
        id: 'TOWER_2_FIRST',
        title: 'Trascendencia Cuántica',
        desc: 'Derrota a TITAN-OMEGA y supera la Torre Cuántica (Pisos 11-20).',
        icon: '🌌',
        category: 'TORRES',
        check: (profile) => (profile.tower_completions && Number(profile.tower_completions['2']) >= 1)
    },
    {
        id: 'TOWER_3_FIRST',
        title: 'Señor de la Singularidad',
        desc: 'Neutraliza a SINGULARIDAD-ZERO y conquista la Torre de Singularidad.',
        icon: '👑',
        category: 'TORRES',
        check: (profile) => (profile.tower_completions && Number(profile.tower_completions['3']) >= 1)
    },
    {
        id: 'SCRAP_HOARDER_100',
        title: 'Chatarrero Experto',
        desc: 'Acumula al menos 100 de Chatarra Global en tu cuenta.',
        icon: '⚙️',
        category: 'RECURSOS',
        check: (profile, meta) => (meta.globalScrap >= 100)
    },
    {
        id: 'SCRAP_HOARDER_500',
        title: 'Magnate Tecnológico',
        desc: 'Acumula al menos 500 de Chatarra Global en tu cuenta.',
        icon: '💎',
        category: 'RECURSOS',
        check: (profile, meta) => (meta.globalScrap >= 500)
    }
];

const ProfileManager = {
    profileData: {
        username: '',
        avatar_icon: 'DEFAULT',
        tower_completions: { '1': 0, '2': 0, '3': 0 },
        achievements: []
    },
    
    validationTimer: null,
    isCheckingUsername: false,
    lastCheckedUsername: null,
    isUsernameValid: false,

    async init() {
        await this.loadProfile();
        this.updateAllAvatarDisplays();
    },

    getLocalUserId() {
        if (typeof AuthManager !== 'undefined' && AuthManager.currentUser) {
            return AuthManager.currentUser.id;
        }
        return 'local_pilot';
    },

    async loadProfile() {
        const userId = this.getLocalUserId();
        
        // 1. Cargar respaldo local
        const localKey = `ciber_profile_${userId}`;
        const localSaved = localStorage.getItem(localKey) || localStorage.getItem('ciber_player_profile');
        if (localSaved) {
            try {
                const parsed = JSON.parse(localSaved);
                this.profileData = Object.assign({}, this.profileData, parsed);
            } catch (e) {
                console.warn('[ProfileManager] Error parseando perfil local:', e);
            }
        }

        // 2. Si hay sesión y Supabase configurado, consultar en la nube
        if (typeof supabaseClient !== 'undefined' && supabaseClient && isSupabaseConfigured() && typeof AuthManager !== 'undefined' && AuthManager.currentUser) {
            try {
                const { data, error } = await supabaseClient
                    .from('player_profiles')
                    .select('user_id, global_scrap, unlocked_skills, username, avatar_icon, tower_completions, achievements')
                    .eq('user_id', AuthManager.currentUser.id)
                    .maybeSingle();

                if (error) {
                    console.warn('[ProfileManager] Error consultando player_profiles en Supabase:', error);
                } else if (data) {
                    if (data.username) this.profileData.username = data.username;
                    if (data.avatar_icon) this.profileData.avatar_icon = data.avatar_icon;
                    if (data.tower_completions && typeof data.tower_completions === 'object') {
                        this.profileData.tower_completions = Object.assign({ '1': 0, '2': 0, '3': 0 }, data.tower_completions);
                    }
                    if (Array.isArray(data.achievements)) {
                        this.profileData.achievements = data.achievements;
                    }
                }
            } catch (err) {
                console.warn('[ProfileManager] Excepción al cargar perfil desde Supabase:', err);
            }
        }

        // Evaluar logros automáticamente al cargar
        await this.evaluateAchievements(false);
        this.saveToLocalStorage();
        this.updateAllAvatarDisplays();
    },

    saveToLocalStorage() {
        const userId = this.getLocalUserId();
        const localKey = `ciber_profile_${userId}`;
        localStorage.setItem(localKey, JSON.stringify(this.profileData));
        localStorage.setItem('ciber_player_profile', JSON.stringify(this.profileData));
    },

    async saveProfileToCloud() {
        this.saveToLocalStorage();

        if (typeof supabaseClient !== 'undefined' && supabaseClient && isSupabaseConfigured() && typeof AuthManager !== 'undefined' && AuthManager.currentUser) {
            try {
                const userId = AuthManager.currentUser.id;
                const payload = {
                    user_id: userId,
                    username: this.profileData.username || null,
                    avatar_icon: this.profileData.avatar_icon || 'DEFAULT',
                    tower_completions: this.profileData.tower_completions || { '1': 0, '2': 0, '3': 0 },
                    achievements: this.profileData.achievements || [],
                    updated_at: new Date().toISOString()
                };

                const { error } = await supabaseClient
                    .from('player_profiles')
                    .upsert(payload, { onConflict: 'user_id' });

                if (error) {
                    console.error('[ProfileManager] Error al guardar perfil en Supabase:', error);
                    return { success: false, error };
                } else {
                    console.info('[ProfileManager] Perfil sincronizado exitosamente en Supabase');
                    return { success: true };
                }
            } catch (err) {
                console.error('[ProfileManager] Excepción al guardar perfil en Supabase:', err);
                return { success: false, error: err };
            }
        }
        return { success: true, offline: true };
    },

    // =========================================================================
    // AVATARES
    // =========================================================================
    getAvatarDef(avatarKey = null) {
        const key = avatarKey || this.profileData.avatar_icon || 'DEFAULT';
        return PROFILE_AVATARS[key] || PROFILE_AVATARS.DEFAULT;
    },

    getAvatarHtml(avatarKey = null, sizeClass = '') {
        const def = this.getAvatarDef(avatarKey);
        const styleAttr = def.filter ? `style="${def.filter}"` : '';
        const elemClass = def.elemClass || '';
        return `<span class="profile-avatar-graphic ${elemClass} ${sizeClass}" ${styleAttr}>${def.emoji}</span>`;
    },

    async selectAvatar(avatarKey) {
        if (!PROFILE_AVATARS[avatarKey]) return;
        this.profileData.avatar_icon = avatarKey;
        await this.evaluateAchievements(true);
        await this.saveProfileToCloud();
        this.updateAllAvatarDisplays();
        this.renderProfileTab();
        
        if (typeof AuthManager !== 'undefined') {
            AuthManager.updateAuthUI();
        }
    },

    updateAllAvatarDisplays() {
        const avatarHtml = this.getAvatarHtml(this.profileData.avatar_icon);
        
        // Modal de cuenta (tab-account)
        const accountAvatarBox = document.getElementById('account-user-avatar-display');
        if (accountAvatarBox) {
            accountAvatarBox.innerHTML = avatarHtml;
        }

        // Header del perfil
        const headerAvatar = document.getElementById('profile-current-avatar-icon');
        if (headerAvatar) {
            headerAvatar.innerHTML = avatarHtml;
        }
    },

    // =========================================================================
    // VALIDACIÓN Y CAMBIO DE NOMBRE DE USUARIO (COSTO: 500 ⚙️ PARA CAMBIOS)
    // =========================================================================
    handleUsernameInput(value) {
        const badge = document.getElementById('profile-username-feedback');
        const saveBtn = document.getElementById('btn-save-username');
        if (!badge) return;

        clearTimeout(this.validationTimer);
        const cleanVal = (value || '').trim();
        const isRename = Boolean(this.profileData.username && this.profileData.username.trim() !== '');
        const renameCost = 500;

        if (!cleanVal) {
            badge.className = 'username-feedback-badge badge-idle';
            badge.innerHTML = isRename
                ? `ℹ️ Ingresa tu nuevo nombre de comandante (3-16 caracteres). Costo: <strong>${renameCost} ⚙️</strong>.`
                : 'ℹ️ Ingresa un nombre para tu perfil (3-16 caracteres). Primer registro gratis.';
            badge.style.display = 'block';
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = `<span>${isRename ? `⚙️ CAMBIAR NOMBRE (${renameCost} ⚙️)` : '💾 REGISTRAR NOMBRE (GRATIS)'}</span>`;
            }
            this.isUsernameValid = false;
            return;
        }

        // Comprobación de formato básico
        const formatRegex = /^[a-zA-Z0-9_]{3,16}$/;
        if (!formatRegex.test(cleanVal)) {
            badge.className = 'username-feedback-badge badge-error';
            badge.innerHTML = '⚠️ Debe tener entre 3 y 16 caracteres alfanuméricos (letras, números y _). Sin espacios ni signos.';
            badge.style.display = 'block';
            if (saveBtn) saveBtn.disabled = true;
            this.isUsernameValid = false;
            return;
        }

        // Si es exactamente su nombre actual
        if (this.profileData.username && cleanVal.toLowerCase() === this.profileData.username.toLowerCase()) {
            badge.className = 'username-feedback-badge badge-info';
            badge.innerHTML = 'ℹ️ Este es tu nombre actual.';
            badge.style.display = 'block';
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = `<span>${isRename ? `⚙️ CAMBIAR NOMBRE (${renameCost} ⚙️)` : '💾 REGISTRAR NOMBRE'}</span>`;
            }
            this.isUsernameValid = false;
            return;
        }

        // Mostrar estado de comprobación
        badge.className = 'username-feedback-badge badge-checking';
        badge.innerHTML = '⏳ Comprobando disponibilidad en enlace neuronal...';
        badge.style.display = 'block';
        if (saveBtn) saveBtn.disabled = true;
        this.isUsernameValid = false;

        // Debounce de 350ms para consultar disponibilidad en Supabase
        this.validationTimer = setTimeout(async () => {
            await this.checkUsernameAvailability(cleanVal);
        }, 350);
    },

    async checkUsernameAvailability(username) {
        const badge = document.getElementById('profile-username-feedback');
        const saveBtn = document.getElementById('btn-save-username');
        if (!badge) return;

        const currentUserId = (typeof AuthManager !== 'undefined' && AuthManager.currentUser)
            ? AuthManager.currentUser.id
            : null;

        const isRename = Boolean(this.profileData.username && this.profileData.username.trim() !== '');
        const currentScrap = (typeof SkillsManager !== 'undefined') ? SkillsManager.globalScrap : 0;
        const renameCost = 500;

        if (typeof supabaseClient !== 'undefined' && supabaseClient && isSupabaseConfigured()) {
            try {
                this.isCheckingUsername = true;
                const { data, error } = await supabaseClient
                    .from('player_profiles')
                    .select('user_id, username')
                    .ilike('username', username)
                    .limit(2);

                this.isCheckingUsername = false;

                if (error) {
                    console.warn('[ProfileManager] Error comprobando unicidad de username:', error);
                    badge.className = 'username-feedback-badge badge-warning';
                    badge.innerHTML = '⚠️ No se pudo verificar en la nube (modo sin conexión). Formato válido.';
                    if (saveBtn) {
                        saveBtn.disabled = isRename && (currentScrap < renameCost);
                        saveBtn.innerHTML = `<span>${isRename ? `⚙️ CAMBIAR NOMBRE (${renameCost} ⚙️)` : '💾 REGISTRAR NOMBRE (GRATIS)'}</span>`;
                    }
                    this.isUsernameValid = true;
                    return;
                }

                // Verificar si algún registro encontrado pertenece a OTRA persona
                const isTakenByOther = data && data.some(row => row.user_id !== currentUserId);

                if (isTakenByOther) {
                    badge.className = 'username-feedback-badge badge-error';
                    badge.innerHTML = `❌ El nombre <strong>${username}</strong> ya está ocupado por otro comandante.`;
                    if (saveBtn) {
                        saveBtn.disabled = true;
                        saveBtn.innerHTML = `<span>${isRename ? `⚙️ CAMBIAR NOMBRE (${renameCost} ⚙️)` : '💾 REGISTRAR NOMBRE (GRATIS)'}</span>`;
                    }
                    this.isUsernameValid = false;
                } else if (isRename && currentScrap < renameCost) {
                    badge.className = 'username-feedback-badge badge-warning';
                    badge.innerHTML = `⚠️ ¡Nombre <strong>${username}</strong> disponible! Pero necesitas <strong>${renameCost} ⚙️</strong> para cambiar de nombre (tienes ${currentScrap.toLocaleString()} ⚙️).`;
                    if (saveBtn) {
                        saveBtn.disabled = true;
                        saveBtn.innerHTML = `<span>🔒 REQUIERE ${renameCost} ⚙️</span>`;
                    }
                    this.isUsernameValid = false;
                } else {
                    badge.className = 'username-feedback-badge badge-success';
                    badge.innerHTML = isRename
                        ? `✅ ¡Nombre <strong>${username}</strong> disponible! Costo de cambio: <strong>${renameCost} ⚙️</strong> (Tienes: ${currentScrap.toLocaleString()} ⚙️).`
                        : `✅ ¡Nombre <strong>${username}</strong> disponible para registrar! (Primer registro: Gratis)`;
                    if (saveBtn) {
                        saveBtn.disabled = false;
                        saveBtn.innerHTML = `<span>${isRename ? `⚙️ CAMBIAR NOMBRE (${renameCost} ⚙️)` : '💾 REGISTRAR NOMBRE (GRATIS)'}</span>`;
                    }
                    this.isUsernameValid = true;
                    this.lastCheckedUsername = username;
                }
            } catch (e) {
                console.error('[ProfileManager] Excepción al comprobar nombre:', e);
                badge.className = 'username-feedback-badge badge-success';
                badge.innerHTML = '✅ Formato válido.';
                if (saveBtn) {
                    saveBtn.disabled = isRename && (currentScrap < renameCost);
                    saveBtn.innerHTML = `<span>${isRename ? `⚙️ CAMBIAR NOMBRE (${renameCost} ⚙️)` : '💾 REGISTRAR NOMBRE (GRATIS)'}</span>`;
                }
                this.isUsernameValid = true;
            }
        } else {
            // Modo local sin Supabase configurado
            if (isRename && currentScrap < renameCost) {
                badge.className = 'username-feedback-badge badge-warning';
                badge.innerHTML = `⚠️ ¡Nombre <strong>${username}</strong> válido! Pero necesitas <strong>${renameCost} ⚙️</strong> para cambiar de nombre (tienes ${currentScrap.toLocaleString()} ⚙️).`;
                if (saveBtn) {
                    saveBtn.disabled = true;
                    saveBtn.innerHTML = `<span>🔒 REQUIERE ${renameCost} ⚙️</span>`;
                }
                this.isUsernameValid = false;
            } else {
                badge.className = 'username-feedback-badge badge-success';
                badge.innerHTML = isRename
                    ? `✅ ¡Nombre <strong>${username}</strong> válido! Costo: <strong>${renameCost} ⚙️</strong>.`
                    : `✅ ¡Nombre <strong>${username}</strong> válido! (Primer registro: Gratis)`;
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = `<span>${isRename ? `⚙️ CAMBIAR NOMBRE (${renameCost} ⚙️)` : '💾 REGISTRAR NOMBRE (GRATIS)'}</span>`;
                }
                this.isUsernameValid = true;
                this.lastCheckedUsername = username;
            }
        }
    },

    async saveUsername() {
        const input = document.getElementById('profile-input-username');
        const badge = document.getElementById('profile-username-feedback');
        const saveBtn = document.getElementById('btn-save-username');
        if (!input) return;

        const newName = input.value.trim();
        const formatRegex = /^[a-zA-Z0-9_]{3,16}$/;
        if (!formatRegex.test(newName)) {
            if (badge) {
                badge.className = 'username-feedback-badge badge-error';
                badge.innerHTML = '⚠️ Nombre inválido. Usa 3-16 caracteres alfanuméricos.';
            }
            return;
        }

        const isRename = Boolean(this.profileData.username && this.profileData.username.trim() !== '');
        const renameCost = 500;
        const currentScrap = (typeof SkillsManager !== 'undefined') ? SkillsManager.globalScrap : 0;

        if (isRename && currentScrap < renameCost) {
            if (badge) {
                badge.className = 'username-feedback-badge badge-error';
                badge.innerHTML = `❌ Chatarra insuficiente. Cambiar de nombre cuesta <strong>${renameCost} ⚙️</strong> (tienes ${currentScrap.toLocaleString()} ⚙️).`;
            }
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = `<span>🔒 REQUIERE ${renameCost} ⚙️</span>`;
            }
            return;
        }

        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span>⏳ GUARDANDO...</span>';
        }

        // Verificación final estricta de colisión antes del commit
        if (typeof supabaseClient !== 'undefined' && supabaseClient && isSupabaseConfigured()) {
            try {
                const currentUserId = (typeof AuthManager !== 'undefined' && AuthManager.currentUser)
                    ? AuthManager.currentUser.id
                    : null;

                const { data } = await supabaseClient
                    .from('player_profiles')
                    .select('user_id')
                    .ilike('username', newName)
                    .limit(2);

                const isTaken = data && data.some(row => row.user_id !== currentUserId);
                if (isTaken) {
                    if (badge) {
                        badge.className = 'username-feedback-badge badge-error';
                        badge.innerHTML = `❌ Error: El nombre <strong>${newName}</strong> acaba de ser tomado por otro usuario.`;
                    }
                    if (saveBtn) {
                        saveBtn.disabled = false;
                        saveBtn.innerHTML = `<span>${isRename ? `⚙️ CAMBIAR NOMBRE (${renameCost} ⚙️)` : '💾 REGISTRAR NOMBRE (GRATIS)'}</span>`;
                    }
                    return;
                }
            } catch (err) {}
        }

        // Descontar la chatarra global si es un cambio de nombre
        if (isRename) {
            if (typeof SkillsManager !== 'undefined' && typeof SkillsManager.deductGlobalScrap === 'function') {
                await SkillsManager.deductGlobalScrap(renameCost);
            }
        }

        this.profileData.username = newName;

        // Actualizar también user_metadata en Auth si está logueado
        if (typeof supabaseClient !== 'undefined' && supabaseClient && typeof AuthManager !== 'undefined' && AuthManager.currentUser && !AuthManager.isAnonymous()) {
            try {
                await supabaseClient.auth.updateUser({
                    data: { nickname: newName }
                });
            } catch (e) {}
        }

        await this.evaluateAchievements(true);
        const res = await this.saveProfileToCloud();

        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = `<span>${this.profileData.username ? `⚙️ CAMBIAR NOMBRE (${renameCost} ⚙️)` : '💾 GUARDAR NOMBRE'}</span>`;
        }

        if (res && res.error) {
            if (badge) {
                badge.className = 'username-feedback-badge badge-error';
                badge.innerHTML = `❌ Error al guardar: ${res.error.message || 'Fallo de BD'}`;
            }
        } else {
            if (badge) {
                badge.className = 'username-feedback-badge badge-success';
                badge.innerHTML = isRename
                    ? `✨ ¡Nombre cambiado a <strong>${newName}</strong> con éxito! (-${renameCost} ⚙️ Chatarra Global)`
                    : `✨ ¡Nombre de usuario <strong>${newName}</strong> registrado con éxito!`;
            }
            
            // Actualizar retroactivamente el nombre en partidas del Top 10 e historial
            if (typeof supabaseClient !== 'undefined' && supabaseClient && currentUserId) {
                try {
                    await supabaseClient
                        .from('match_runs')
                        .update({ player_name: newName })
                        .eq('user_id', currentUserId);
                    console.info('[ProfileManager] Nombre de piloto actualizado en match_runs a:', newName);
                } catch (mrErr) {
                    console.warn('[ProfileManager] Error actualizando player_name en match_runs:', mrErr);
                }
            }

            // Actualizar vista y nombre en toda la UI
            this.renderProfileTab();
            if (typeof AuthManager !== 'undefined') {
                AuthManager.updateAuthUI();
            }
        }
    },

    // =========================================================================
    // CONTADORES DE TORRE
    // =========================================================================
    getTowerCompletions(towerId = null) {
        if (!this.profileData.tower_completions) {
            this.profileData.tower_completions = { '1': 0, '2': 0, '3': 0 };
        }
        if (towerId) {
            return Number(this.profileData.tower_completions[String(towerId)]) || 0;
        }
        return this.profileData.tower_completions;
    },

    async recordTowerCompletion(towerId) {
        if (!towerId) return;
        const tKey = String(towerId);
        if (!this.profileData.tower_completions) {
            this.profileData.tower_completions = { '1': 0, '2': 0, '3': 0 };
        }
        
        const prevCount = Number(this.profileData.tower_completions[tKey]) || 0;
        this.profileData.tower_completions[tKey] = prevCount + 1;
        
        console.info(`[ProfileManager] Victoria registrada para Torre ${towerId}. Total: ${this.profileData.tower_completions[tKey]}`);

        await this.evaluateAchievements(true);
        await this.saveProfileToCloud();
    },

    // =========================================================================
    // LOGROS
    // =========================================================================
    hasAchievement(achievementId) {
        if (!Array.isArray(this.profileData.achievements)) return false;
        return this.profileData.achievements.includes(achievementId);
    },

    async evaluateAchievements(saveIfChanged = true) {
        if (!Array.isArray(this.profileData.achievements)) {
            this.profileData.achievements = [];
        }

        const metaContext = {
            globalScrap: (typeof SkillsManager !== 'undefined' && SkillsManager.globalScrap) ? SkillsManager.globalScrap : 0
        };

        let newUnlockedCount = 0;

        ACHIEVEMENTS_CATALOG.forEach(ach => {
            if (!this.hasAchievement(ach.id)) {
                try {
                    const isUnlocked = ach.check(this.profileData, metaContext);
                    if (isUnlocked) {
                        this.profileData.achievements.push(ach.id);
                        newUnlockedCount++;
                        console.info(`[ProfileManager] 🏆 ¡LOGRO DESBLOQUEADO!: ${ach.title}`);
                    }
                } catch (e) {
                    console.warn('[ProfileManager] Error evaluando logro:', ach.id, e);
                }
            }
        });

        if (newUnlockedCount > 0 && saveIfChanged) {
            await this.saveProfileToCloud();
        }
    },

    // =========================================================================
    // RENDERIZADO DE LA PESTAÑA PERFIL
    // =========================================================================
    renderProfileTab() {
        const container = document.getElementById('tab-profile');
        if (!container) return;

        const currentName = this.profileData.username || '';
        const currentAvatarKey = this.profileData.avatar_icon || 'DEFAULT';
        const currentAvatarDef = this.getAvatarDef(currentAvatarKey);
        const displayName = currentName || (typeof AuthManager !== 'undefined' ? AuthManager.getPlayerDisplayName() : 'Piloto Desconocido');
        
        const isAnon = (typeof AuthManager !== 'undefined') ? AuthManager.isAnonymous() : true;
        const accountBadge = isAnon 
            ? '<span class="profile-header-tag tag-anon">⚡ SESIÓN ANÓNIMA</span>'
            : '<span class="profile-header-tag tag-verified">🛡️ COMANDANTE VERIFICADO</span>';

        const t1Count = this.getTowerCompletions('1');
        const t2Count = this.getTowerCompletions('2');
        const t3Count = this.getTowerCompletions('3');
        const totalTowers = t1Count + t2Count + t3Count;

        // Avatar selector cards HTML
        const avatarCardsHtml = Object.keys(PROFILE_AVATARS).map(key => {
            const av = PROFILE_AVATARS[key];
            const isEquipped = (key === currentAvatarKey);
            const styleAttr = av.filter ? `style="${av.filter}"` : '';
            const elemClass = av.elemClass || '';

            return `
                <div class="avatar-option-card ${isEquipped ? 'equipped' : ''}" onclick="ProfileManager.selectAvatar('${key}')">
                    <div class="avatar-option-graphic-box">
                        <span class="avatar-option-emoji ${elemClass}" ${styleAttr}>${av.emoji}</span>
                    </div>
                    <div class="avatar-option-info">
                        <span class="avatar-option-name">${av.name}</span>
                        <span class="avatar-option-badge">${av.badge}</span>
                    </div>
                    <div class="avatar-option-status">
                        ${isEquipped ? '<span class="badge-equipped">✔ ACTIVO</span>' : '<span class="btn-select-avatar">ELEGIR</span>'}
                    </div>
                </div>
            `;
        }).join('');

        // Achievements list HTML
        const totalAchievements = ACHIEVEMENTS_CATALOG.length;
        const unlockedCount = this.profileData.achievements ? this.profileData.achievements.length : 0;
        const completionPct = totalAchievements > 0 ? Math.round((unlockedCount / totalAchievements) * 100) : 0;

        const achievementsCardsHtml = ACHIEVEMENTS_CATALOG.map(ach => {
            const isUnlocked = this.hasAchievement(ach.id);
            return `
                <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
                    <div class="achievement-icon-box">
                        <span class="achievement-icon">${ach.icon}</span>
                    </div>
                    <div class="achievement-details">
                        <div class="achievement-title-row">
                            <span class="achievement-name">${ach.title}</span>
                            <span class="achievement-status-badge ${isUnlocked ? 'badge-unlocked' : 'badge-locked'}">
                                ${isUnlocked ? '🏆 DESBLOQUEADO' : '🔒 BLOQUEADO'}
                            </span>
                        </div>
                        <p class="achievement-desc">${ach.desc}</p>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="profile-tab-wrapper">
                <!-- 1. Cabecera Táctica del Perfil -->
                <div class="profile-hero-card">
                    <div id="profile-current-avatar-icon" class="profile-hero-avatar-box">
                        ${this.getAvatarHtml(currentAvatarKey)}
                    </div>
                    <div class="profile-hero-info">
                        <div class="profile-hero-badges-row">
                            ${accountBadge}
                            <span class="profile-header-tag tag-rank">NIVEL DE ACCESO: ALPHA</span>
                        </div>
                        <h2 class="profile-hero-name">${displayName}</h2>
                        <div class="profile-hero-sub">
                            Icono Activo: <strong>${currentAvatarDef.name}</strong> • Conquistas Totales: <strong>${totalTowers} 🗼</strong>
                        </div>
                    </div>
                </div>

                <!-- 2. Formulario de Nombre de Usuario -->
                <div class="profile-section-box">
                    <div class="profile-section-header">
                        <div class="section-title-wrap">
                            <span class="section-icon">🆔</span>
                            <h3 class="profile-section-title">IDENTIFICADOR TÁCTICO // NOMBRE DE COMANDANTE</h3>
                        </div>
                        <span class="section-sub-badge">${currentName ? 'CAMBIO: 500 ⚙️ CHATARRA' : 'PRIMER REGISTRO: GRATIS'}</span>
                    </div>
                    <p class="profile-section-desc">
                        Este nombre te identificará en el Salón de la Fama y en los registros de incursión. ${currentName ? 'Cambiar tu nombre actual cuesta <strong>500 ⚙️ de Chatarra Global</strong>.' : 'El primer registro de nombre es gratuito (cambios posteriores costarán 500 ⚙️).'}
                    </p>

                    <div class="profile-username-form-row">
                        <div class="username-input-wrap">
                            <input 
                                type="text" 
                                id="profile-input-username" 
                                class="cyber-input username-field" 
                                placeholder="Ej: NeoViper_99" 
                                maxlength="16"
                                value="${currentName}" 
                                oninput="ProfileManager.handleUsernameInput(this.value)"
                                autocomplete="off"
                                spellcheck="false"
                            >
                        </div>
                        <button id="btn-save-username" class="btn-profile-save" onclick="ProfileManager.saveUsername()" disabled>
                            <span>${currentName ? '⚙️ CAMBIAR NOMBRE (500 ⚙️)' : '💾 REGISTRAR NOMBRE (GRATIS)'}</span>
                        </button>
                    </div>
                    <div id="profile-username-feedback" class="username-feedback-badge badge-idle" style="display: none;"></div>
                </div>

                <!-- 3. Selector de Icono de Perfil (Robots Elementales) -->
                <div class="profile-section-box">
                    <div class="profile-section-header">
                        <div class="section-title-wrap">
                            <span class="section-icon">🤖</span>
                            <h3 class="profile-section-title">CHASIS DE PERFIL // AVATAR DE COMANDANTE</h3>
                        </div>
                        <span class="section-sub-badge">ROBOTS ELEMENTALES</span>
                    </div>
                    <p class="profile-section-desc">
                        Personaliza tu holograma de enlace neuronal seleccionando uno de los chasis elementales iniciales:
                    </p>
                    <div class="profile-avatars-grid">
                        ${avatarCardsHtml}
                    </div>
                </div>

                <!-- 4. Contadores de Victorias por Torre -->
                <div class="profile-section-box">
                    <div class="profile-section-header">
                        <div class="section-title-wrap">
                            <span class="section-icon">🗼</span>
                            <h3 class="profile-section-title">REGISTRO DE CONQUISTA // SECTORES Y TORRES</h3>
                        </div>
                        <span class="section-sub-badge">TOTAL: ${totalTowers} COMPLETADAS</span>
                    </div>
                    <p class="profile-section-desc">
                        Historial de veces que has desmantelado con éxito a los Jefes Supremos en cada una de las Torres:
                    </p>
                    <div class="profile-towers-grid">
                        <!-- Torre 1 -->
                        <div class="tower-stat-card tower-1-theme">
                            <div class="tower-stat-header">
                                <span class="tower-stat-badge">SECTOR 01</span>
                                <span class="tower-stat-icon">🗼</span>
                            </div>
                            <h4 class="tower-stat-title">TORRE CIBERNÉTICA</h4>
                            <div class="tower-stat-boss">JEFE: TITAN-X (PISO 10)</div>
                            <div class="tower-stat-count-row">
                                <span class="tower-count-num">${t1Count}</span>
                                <span class="tower-count-lbl">Victorias</span>
                            </div>
                        </div>

                        <!-- Torre 2 -->
                        <div class="tower-stat-card tower-2-theme">
                            <div class="tower-stat-header">
                                <span class="tower-stat-badge">SECTOR 02</span>
                                <span class="tower-stat-icon">🌌</span>
                            </div>
                            <h4 class="tower-stat-title">TORRE CUÁNTICA</h4>
                            <div class="tower-stat-boss">JEFE: TITAN-OMEGA (PISO 20)</div>
                            <div class="tower-stat-count-row">
                                <span class="tower-count-num">${t2Count}</span>
                                <span class="tower-count-lbl">Victorias</span>
                            </div>
                        </div>

                        <!-- Torre 3 -->
                        <div class="tower-stat-card tower-3-theme">
                            <div class="tower-stat-header">
                                <span class="tower-stat-badge">SECTOR 03</span>
                                <span class="tower-stat-icon">👑</span>
                            </div>
                            <h4 class="tower-stat-title">TORRE SINGULARIDAD</h4>
                            <div class="tower-stat-boss">JEFE: SINGULARIDAD-ZERO (PISO 30)</div>
                            <div class="tower-stat-count-row">
                                <span class="tower-count-num">${t3Count}</span>
                                <span class="tower-count-lbl">Victorias</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 5. Módulo de Logros del Sistema -->
                <div class="profile-section-box">
                    <div class="profile-section-header">
                        <div class="section-title-wrap">
                            <span class="section-icon">🏆</span>
                            <h3 class="profile-section-title">LOGROS DEL SISTEMA</h3>
                        </div>
                        <span class="section-sub-badge">${unlockedCount} / ${totalAchievements} (${completionPct}%)</span>
                    </div>
                    
                    <!-- Barra de Progreso de Logros -->
                    <div class="achievements-progress-container">
                        <div class="achievements-progress-bar" style="width: ${completionPct}%;"></div>
                    </div>

                    <div class="profile-achievements-grid">
                        ${achievementsCardsHtml}
                    </div>
                </div>
            </div>
        `;
    }
};

// Inicialización automática
document.addEventListener('DOMContentLoaded', () => {
    ProfileManager.init();
});
