// authManager.js
// Manejo de autenticación (anónima y registrada), perfil de usuario y persistencia de partidas en Supabase

const AuthManager = {
    currentUser: null,
    historyCache: [],

    isAnonymous() {
        if (!this.currentUser) return true;
        return Boolean(this.currentUser.is_anonymous || !this.currentUser.email);
    },

    getPlayerDisplayName() {
        if (typeof ProfileManager !== 'undefined' && ProfileManager.profileData && ProfileManager.profileData.username) {
            return ProfileManager.profileData.username;
        }
        if (!this.currentUser) return 'Piloto Desconocido';
        if (this.isAnonymous()) {
            return `Invitado_${this.currentUser.id.substring(0, 5)}`;
        }
        return this.currentUser.user_metadata?.nickname 
            || (this.currentUser.email ? this.currentUser.email.split('@')[0] : 'Comandante');
    },

    async getOrFetchCurrentUser() {
        if (this.currentUser) return this.currentUser;
        if (typeof isSupabaseConfigured !== 'function' || !isSupabaseConfigured() || typeof supabaseClient === 'undefined' || !supabaseClient) {
            return null;
        }
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session && session.user) {
                this.currentUser = session.user;
                return this.currentUser;
            }
            // Si no hay sesión previa, iniciar sesión anónima automáticamente
            console.info('[AuthManager] Asegurando sesión anónima para operaciones en Supabase...');
            const { data, error } = await supabaseClient.auth.signInAnonymously();
            if (!error && data && data.user) {
                this.currentUser = data.user;
                console.info('[AuthManager] Sesión anónima asegurada con user_id:', this.currentUser.id);
                return this.currentUser;
            }
        } catch (err) {
            console.warn('[AuthManager] Error al recuperar o iniciar sesión de usuario:', err);
        }
        return null;
    },

    async init() {
        if (typeof isSupabaseConfigured === 'function' && isSupabaseConfigured() && typeof supabaseClient !== 'undefined' && supabaseClient) {
            try {
                const user = await this.getOrFetchCurrentUser();
                if (user) {
                    console.info('[AuthManager] Sesión activa inicializada para user_id:', user.id);
                }

                supabaseClient.auth.onAuthStateChange(async (_event, session) => {
                    this.currentUser = session ? session.user : null;
                    this.updateAuthUI();
                    if (typeof SkillsManager !== 'undefined') {
                        await SkillsManager.loadProfile();
                    }
                    if (typeof CosmeticsManager !== 'undefined') {
                        await CosmeticsManager.loadCosmeticsFromDB();
                        CosmeticsManager.updateEquippedDisplay();
                    }
                    if (typeof ProfileManager !== 'undefined') {
                        await ProfileManager.loadProfile();
                    }
                    if (typeof checkSavedCheckpoint === 'function') {
                        await checkSavedCheckpoint();
                    }
                });
            } catch (err) {
                console.warn('[AuthManager] Error al inicializar sesión:', err);
            }
        }
        this.updateAuthUI();
        if (typeof SkillsManager !== 'undefined') {
            await SkillsManager.loadProfile();
        }
        if (typeof CosmeticsManager !== 'undefined') {
            await CosmeticsManager.loadCosmeticsFromDB();
            CosmeticsManager.updateEquippedDisplay();
        }
        if (typeof ProfileManager !== 'undefined') {
            await ProfileManager.loadProfile();
        }
        if (typeof checkSavedCheckpoint === 'function') {
            await checkSavedCheckpoint();
        }
    },

    async linkAccount(email, password) {
        if (!isSupabaseConfigured() || !supabaseClient) {
            this.showAuthMessage('⚠️ Supabase no está configurado aún en js/supabaseClient.js.', 'warning');
            return { error: 'Supabase no configurado' };
        }

        if (!email || !password || password.length < 6) {
            this.showAuthMessage('⚠️ Ingresa un correo válido y una contraseña de al menos 6 caracteres.', 'error');
            return { error: 'Datos inválidos' };
        }

        this.showAuthMessage('⏳ Vinculando cuenta con Supabase...', 'info');

        try {
            // Si el usuario actual es anónimo, actualizar su usuario para convertirlo a permanente conservando su user_id
            const { data, error } = await supabaseClient.auth.updateUser({
                email: email,
                password: password
            });

            if (error) {
                this.showAuthMessage(`❌ ${error.message}`, 'error');
                return { error };
            }

            this.currentUser = data.user;
            this.showAuthMessage('🛡️ ¡Cuenta vinculada exitosamente! Tu progreso táctico ha quedado blindado de forma permanente.', 'success');
            this.updateAuthUI();
            this.refreshPostGameBanners();

            if (typeof SkillsManager !== 'undefined') {
                await SkillsManager.saveProfile();
            }

            return { data };
        } catch (err) {
            this.showAuthMessage(`❌ Error de conexión: ${err.message}`, 'error');
            return { error: err };
        }
    },

    async signUp(email, password) {
        if (!isSupabaseConfigured() || !supabaseClient) {
            this.showAuthMessage('⚠️ Supabase no está configurado aún en js/supabaseClient.js.', 'warning');
            return { error: 'Supabase no configurado' };
        }

        // Si ya hay un usuario anónimo activo, vincularlo en vez de crear una cuenta desconectada
        if (this.isAnonymous() && this.currentUser) {
            return await this.linkAccount(email, password);
        }

        if (!email || !password || password.length < 6) {
            this.showAuthMessage('⚠️ Ingresa un correo válido y una contraseña de al menos 6 caracteres.', 'error');
            return { error: 'Datos inválidos' };
        }

        this.showAuthMessage('⏳ Enviando solicitud de registro...', 'info');

        try {
            const redirectUrl = window.location.origin + window.location.pathname;
            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    emailRedirectTo: redirectUrl
                }
            });

            if (error) {
                this.showAuthMessage(`❌ ${error.message}`, 'error');
                return { error };
            }

            if (data?.user && data.user.identities && data.user.identities.length === 0) {
                this.showAuthMessage('⚠️ Este correo ya se encuentra registrado. Intenta iniciar sesión.', 'warning');
            } else {
                this.showAuthMessage('✉️ ¡Registro exitoso! Hemos enviado un enlace de confirmación a tu correo para activar tu cuenta.', 'success');
            }
            return { data };
        } catch (err) {
            this.showAuthMessage(`❌ Error de conexión: ${err.message}`, 'error');
            return { error: err };
        }
    },

    async signIn(email, password) {
        if (!isSupabaseConfigured() || !supabaseClient) {
            this.showAuthMessage('⚠️ Supabase no está configurado aún en js/supabaseClient.js.', 'warning');
            return { error: 'Supabase no configurado' };
        }

        if (!email || !password) {
            this.showAuthMessage('⚠️ Por favor ingresa tu correo y contraseña.', 'error');
            return { error: 'Campos vacíos' };
        }

        this.showAuthMessage('⏳ Iniciando sesión...', 'info');

        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                this.showAuthMessage(`❌ ${error.message}`, 'error');
                return { error };
            }

            this.currentUser = data.user;
            this.showAuthMessage('✅ ¡Sesión iniciada correctamente!', 'success');
            this.updateAuthUI();
            this.refreshPostGameBanners();

            if (typeof SkillsManager !== 'undefined') {
                await SkillsManager.loadProfile();
            }

            setTimeout(() => {
                this.switchTab('tab-history');
                this.loadAndRenderHistory();
            }, 600);
            return { data };
        } catch (err) {
            this.showAuthMessage(`❌ Error: ${err.message}`, 'error');
            return { error: err };
        }
    },

    async signOut() {
        if (supabaseClient) {
            await supabaseClient.auth.signOut();
            // Generar inmediatamente una nueva sesión anónima para seguir jugando
            const { data } = await supabaseClient.auth.signInAnonymously();
            this.currentUser = data ? data.user : null;
        } else {
            this.currentUser = null;
        }
        this.showAuthMessage('Sesión cerrada. Nueva sesión anónima activa.', 'info');
        this.updateAuthUI();
        this.refreshPostGameBanners();

        if (typeof SkillsManager !== 'undefined') {
            await SkillsManager.loadProfile();
        }
        if (typeof CosmeticsManager !== 'undefined') {
            await CosmeticsManager.loadCosmeticsFromDB();
            CosmeticsManager.updateEquippedDisplay();
        }
        if (typeof ProfileManager !== 'undefined') {
            await ProfileManager.loadProfile();
        }

        this.loadAndRenderHistory();
    },

    async saveMatchRun(runData) {
        // 1. Acumular la chatarra sobrante de la run al pozo global de la cuenta
        if (typeof SkillsManager !== 'undefined') {
            await SkillsManager.addGlobalScrap(runData.scrap_collected || 0);
        }

        // Recuperar o asegurar sesión de usuario en Supabase si aún no está asignada
        const user = await this.getOrFetchCurrentUser();

        // 2. Si hay usuario y Supabase configurado, guardar en la base de datos
        if (user && isSupabaseConfigured() && supabaseClient) {
            try {
                const playerName = this.getPlayerDisplayName();
                const towerId = runData.tower_id || (runData.floor_reached > 20 ? 3 : (runData.floor_reached > 10 ? 2 : 1));

                const insertPayload = {
                    user_id: user.id,
                    player_name: playerName,
                    won: runData.won,
                    tower_id: towerId,
                    floor_reached: runData.floor_reached,
                    duration_seconds: runData.duration_seconds,
                    scrap_collected: runData.scrap_collected,
                    squad: runData.squad
                };

                let { data, error } = await supabaseClient
                    .from('match_runs')
                    .insert([insertPayload])
                    .select();

                // Tolerancia a fallos: Si la columna tower_id aún no fue creada en la BD de Supabase
                if (error && error.message && error.message.includes('tower_id')) {
                    console.warn('[Supabase] Columna tower_id no detectada en la BD, reintentando inserción básica...');
                    delete insertPayload.tower_id;
                    const retry = await supabaseClient.from('match_runs').insert([insertPayload]).select();
                    error = retry.error;
                    data = retry.data;
                }

                if (error) {
                    console.error('[Supabase] Error al insertar match_run:', error);
                    return { success: false, error };
                } else {
                    console.info(`[Supabase] Partida guardada exitosamente en la nube (Torre ${towerId}) para user_id:`, user.id);
                    return { success: true, data };
                }
            } catch (err) {
                console.error('[Supabase] Excepción al guardar partida:', err);
                return { success: false, error: err };
            }
        } else {
            console.warn('[Supabase] No se guardó match_run en la nube (sin usuario o sin cliente Supabase).');
            return { success: false, reason: 'offline_or_no_user' };
        }
    },

    async saveTowerCheckpoint(checkpointData) {
        if (!checkpointData) return null;

        // Limpiar cualquier residuo de localStorage para evitar manipulaciones locales
        try {
            localStorage.removeItem('ciber_tower_checkpoint');
            if (this.currentUser) {
                localStorage.removeItem(`ciber_tower_checkpoint_${this.currentUser.id}`);
            }
        } catch (e) {}

        const user = await this.getOrFetchCurrentUser();
        if (user && isSupabaseConfigured() && supabaseClient) {
            const payload = {
                user_id: user.id,
                tower_completed: checkpointData.tower_completed,
                current_tower: checkpointData.current_tower,
                floor: checkpointData.floor,
                scrap: checkpointData.scrap || 0,
                squad: checkpointData.squad,
                inventory: checkpointData.inventory,
                updated_at: new Date().toISOString()
            };

            let savedSuccessfully = false;

            // 1. Intentar guardar en la tabla especializada saved_tower_runs
            try {
                const { error: runError } = await supabaseClient
                    .from('saved_tower_runs')
                    .upsert(payload, { onConflict: 'user_id' });
                if (!runError) {
                    savedSuccessfully = true;
                    console.info('[AuthManager] Checkpoint guardado en saved_tower_runs en Supabase:', payload);
                } else {
                    console.warn('[AuthManager] saved_tower_runs upsert falló o tabla no existe aún:', runError.message);
                }
            } catch (tableErr) {
                console.warn('[AuthManager] saved_tower_runs no disponible:', tableErr);
            }

            // 2. Guardar también en player_profiles.saved_run (garantía de persistencia en la BD)
            try {
                const { error: profileError } = await supabaseClient
                    .from('player_profiles')
                    .upsert({
                        user_id: user.id,
                        saved_run: payload,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id' });
                if (!profileError) {
                    savedSuccessfully = true;
                    console.info('[AuthManager] Checkpoint respaldado en player_profiles.saved_run en Supabase');
                } else {
                    console.warn('[AuthManager] player_profiles saved_run error:', profileError.message);
                }
            } catch (profErr) {
                console.warn('[AuthManager] Falló guardado de checkpoint en player_profiles:', profErr);
            }

            if (savedSuccessfully) {
                console.info('[AuthManager] ✅ Checkpoint de torre asegurado 100% en la base de datos Supabase.');
            } else {
                console.error('[AuthManager] ❌ No se pudo persistir el checkpoint en Supabase.');
            }
            return checkpointData;
        } else {
            console.warn('[AuthManager] No se guardó el checkpoint: se requiere conexión a Supabase (sin localStorage).');
        }
        return checkpointData;
    },

    async getSavedTowerCheckpoint() {
        // Limpiar cualquier residuo de localStorage
        try {
            localStorage.removeItem('ciber_tower_checkpoint');
            if (this.currentUser) {
                localStorage.removeItem(`ciber_tower_checkpoint_${this.currentUser.id}`);
            }
        } catch (e) {}

        const user = await this.getOrFetchCurrentUser();
        if (user && isSupabaseConfigured() && supabaseClient) {
            // 1. Intentar consultar en saved_tower_runs
            try {
                const { data, error } = await supabaseClient
                    .from('saved_tower_runs')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle();
                if (!error && data && data.squad && Array.isArray(data.squad) && data.squad.length > 0) {
                    console.info('[AuthManager] Checkpoint recuperado desde saved_tower_runs:', data);
                    return data;
                }
            } catch (err) {
                console.warn('[AuthManager] Error consultando saved_tower_runs:', err);
            }

            // 2. Fallback: Consultar en player_profiles.saved_run
            try {
                const { data: profile, error: profError } = await supabaseClient
                    .from('player_profiles')
                    .select('saved_run')
                    .eq('user_id', user.id)
                    .maybeSingle();
                if (!profError && profile && profile.saved_run && profile.saved_run.squad && Array.isArray(profile.saved_run.squad) && profile.saved_run.squad.length > 0) {
                    console.info('[AuthManager] Checkpoint recuperado desde player_profiles.saved_run:', profile.saved_run);
                    return profile.saved_run;
                }
            } catch (profErr) {
                console.warn('[AuthManager] Error consultando player_profiles.saved_run:', profErr);
            }
        }
        return null;
    },

    async clearTowerCheckpoint() {
        // 1. Limpiar cualquier residuo en localStorage
        try {
            if (this.currentUser) {
                localStorage.removeItem(`ciber_tower_checkpoint_${this.currentUser.id}`);
            }
            localStorage.removeItem('ciber_tower_checkpoint');
        } catch (e) {}

        const user = await this.getOrFetchCurrentUser();
        if (user && isSupabaseConfigured() && supabaseClient) {
            // 1. Eliminar de saved_tower_runs
            try {
                await supabaseClient
                    .from('saved_tower_runs')
                    .delete()
                    .eq('user_id', user.id);
            } catch (e) {}

            // 2. Limpiar en player_profiles
            try {
                await supabaseClient
                    .from('player_profiles')
                    .update({ saved_run: null, updated_at: new Date().toISOString() })
                    .eq('user_id', user.id);
            } catch (e) {}

            console.info('[AuthManager] Punto de control de torre eliminado de Supabase.');
        }
    },

    async getHistory() {
        const user = await this.getOrFetchCurrentUser();
        if (user && isSupabaseConfigured() && supabaseClient) {
            try {
                const { data, error } = await supabaseClient
                    .from('match_runs')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (!error && data && data.length > 0) {
                    return data;
                }
            } catch (err) {
                console.warn('[Supabase] Falló consulta de historial en la nube:', err);
            }
        }
        return [];
    },

    async loadAndRenderHistory() {
        const container = document.getElementById('history-runs-list');
        if (!container) return;

        container.innerHTML = `
            <div class="history-loading">
                <span class="loading-spinner">⚡</span> Sincronizando registros tácticos con Supabase...
            </div>
        `;

        try {
            const runs = await this.getHistory();

            if (!runs || !Array.isArray(runs) || runs.length === 0) {
                container.innerHTML = `
                    <div class="history-empty-state">
                        <div class="empty-icon">📂</div>
                        <div class="empty-title">SIN REGISTROS DE INCURSIÓN</div>
                        <div class="empty-desc">No hay partidas registradas en tu perfil aún. ¡Completa una incursión para generar tu historial táctico!</div>
                    </div>
                `;
                return;
            }

            const cardsHtml = runs.map(run => {
                try {
                    return this.renderRunCard(run);
                } catch (cardErr) {
                    console.error('[AuthManager] Error renderizando tarjeta de historial:', cardErr, run);
                    return '';
                }
            }).filter(Boolean).join('');

            container.innerHTML = cardsHtml || `
                <div class="history-empty-state">
                    <div class="empty-icon">📂</div>
                    <div class="empty-title">SIN REGISTROS DE INCURSIÓN</div>
                    <div class="empty-desc">No se pudieron procesar los registros de Supabase.</div>
                </div>
            `;
        } catch (err) {
            console.error('[AuthManager] Error inesperado en loadAndRenderHistory:', err);
            container.innerHTML = `
                <div class="history-empty-state">
                    <div class="empty-icon">⚠️</div>
                    <div class="empty-title">ERROR AL CARGAR HISTORIAL</div>
                    <div class="empty-desc">Ocurrió un error al procesar el historial táctico desde la base de datos.</div>
                    <button class="btn-refresh-history" onclick="AuthManager.loadAndRenderHistory()" style="margin-top: 10px; padding: 6px 14px;">
                        🔄 Reintentar
                    </button>
                </div>
            `;
        }
    },

    renderRunCard(run) {
        if (!run) return '';
        const isWin = !!run.won;
        const durationNum = Number(run.duration_seconds) || 0;
        const minutes = Math.floor(durationNum / 60);
        const seconds = durationNum % 60;
        const durationFormatted = `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
        
        let dateFormatted = 'Reciente';
        if (run.created_at) {
            try {
                const d = new Date(run.created_at);
                if (!isNaN(d.getTime())) {
                    dateFormatted = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
                }
            } catch (e) {}
        }

        let squad = run.squad;
        if (typeof squad === 'string') {
            try { squad = JSON.parse(squad); } catch (e) { squad = []; }
        }
        if (!Array.isArray(squad)) squad = [];

        const squadHtml = squad.map(r => {
            if (!r) return '';
            const rElem = (r.element && typeof r.element === 'string') ? r.element : 'NEUTRO';
            const elemEmoji = (typeof ELEMENT_EMOJIS !== 'undefined' && ELEMENT_EMOJIS[rElem]) ? ELEMENT_EMOJIS[rElem] : '🤖';
            const weaponText = (r.equippedWeapon && typeof r.equippedWeapon === 'object' && r.equippedWeapon.name)
                ? r.equippedWeapon.name
                : (typeof r.equippedWeapon === 'string' ? r.equippedWeapon : 'Sin Arma');
            const chips = Array.isArray(r.chips) ? r.chips : [];
            const chipsText = (chips.length > 0) ? chips.map(c => `💾 ${c}`).join(' ') : '';

            return `
                <div class="run-member-pill elem-${rElem}">
                    <div class="member-info-top">
                        <span class="member-avatar">${elemEmoji}</span>
                        <span class="member-name">${r.name || 'Robot'}</span>
                        <span class="member-level">NV.${r.level || 1}</span>
                    </div>
                    <div class="member-gear-info">
                        <span class="gear-weapon">⚔️ ${weaponText}</span>
                        ${chipsText ? `<span class="gear-chips">${chipsText}</span>` : ''}
                    </div>
                </div>
            `;
        }).filter(Boolean).join('');

        const runTowerId = run.tower_id || (run.floor_reached > 20 ? 3 : (run.floor_reached > 10 ? 2 : 1));
        const towerMaxFloor = runTowerId === 3 ? 30 : (runTowerId === 2 ? 20 : 10);
        const towerCfg = (typeof TOWERS_CONFIG !== 'undefined' && TOWERS_CONFIG[runTowerId]) ? TOWERS_CONFIG[runTowerId] : null;
        const towerName = towerCfg ? towerCfg.name.toUpperCase() : `TORRE ${runTowerId}`;
        const towerEmoji = runTowerId === 3 ? '👑' : (runTowerId === 2 ? '🌌' : '🗼');

        return `
            <div class="run-history-card ${isWin ? 'run-win' : 'run-loss'}">
                <div class="run-card-header">
                    <div class="run-outcome-badge ${isWin ? 'badge-win' : 'badge-loss'}">
                        ${isWin ? `🏆 VICTORIA // ${towerName}` : `💀 DERROTA // ${towerName}`}
                    </div>
                    <div class="run-date">${dateFormatted}</div>
                </div>

                <div class="run-metrics-row">
                    <div class="run-metric">
                        <span class="metric-lbl">${towerEmoji} TORRE / PISO</span>
                        <span class="metric-val ${isWin ? 'val-win' : ''}">${towerName} (P.${run.floor_reached || 1}/${towerMaxFloor})</span>
                    </div>
                    <div class="run-metric">
                        <span class="metric-lbl">⏱️ DURACIÓN</span>
                        <span class="metric-val">${durationFormatted}</span>
                    </div>
                    <div class="run-metric">
                        <span class="metric-lbl">⚙️ CHATARRA</span>
                        <span class="metric-val">${run.scrap_collected || 0}</span>
                    </div>
                </div>

                <div class="run-squad-section">
                    <div class="squad-title">🛡️ ESCUADRÓN DESPLEGADO</div>
                    <div class="run-squad-grid">
                        ${squadHtml || '<span class="no-squad">Sin datos de unidades</span>'}
                    </div>
                </div>
            </div>
        `;
    },

    activeLeaderboardTower: 1,

    async getTop10Speedruns(towerId = 1) {
        if (!isSupabaseConfigured() || !supabaseClient) {
            return [];
        }

        const tId = Number(towerId) || 1;

        try {
            let { data, error } = await supabaseClient
                .from('match_runs')
                .select('*')
                .eq('won', true)
                .eq('tower_id', tId)
                .order('duration_seconds', { ascending: true })
                .limit(10);

            // Fallback si la columna tower_id aún no ha sido migrada en Supabase
            if (error && error.message && error.message.includes('tower_id')) {
                console.warn('[Supabase] Columna tower_id no detectada al consultar leaderboard, aplicando fallback retroactivo...');
                const { data: allWins, error: fallbackError } = await supabaseClient
                    .from('match_runs')
                    .select('*')
                    .eq('won', true)
                    .order('duration_seconds', { ascending: true })
                    .limit(50);

                if (!fallbackError && allWins) {
                    data = allWins.filter(r => {
                        const calculatedTower = r.tower_id || (r.floor_reached > 20 ? 3 : (r.floor_reached > 10 ? 2 : 1));
                        return calculatedTower === tId;
                    }).slice(0, 10);
                    error = null;
                }
            }

            if (error) {
                console.warn(`[Supabase] Error al obtener Top 10 para Torre ${tId}:`, error);
                return [];
            }
            return data || [];
        } catch (err) {
            console.error(`[Supabase] Excepción al obtener Top 10 para Torre ${tId}:`, err);
            return [];
        }
    },

    switchLeaderboardTower(towerId) {
        this.activeLeaderboardTower = Number(towerId) || 1;
        
        // Sincronizar estilo activo de los botones de pestañas
        const tabBtns = document.querySelectorAll('.leaderboard-tower-tab');
        tabBtns.forEach(btn => {
            const btnTower = Number(btn.getAttribute('data-tower')) || 1;
            if (btnTower === this.activeLeaderboardTower) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Recargar clasificación para la torre seleccionada
        this.loadAndRenderLeaderboard(this.activeLeaderboardTower);
    },

    async loadAndRenderLeaderboard(towerId) {
        const tId = towerId ? Number(towerId) : (this.activeLeaderboardTower || 1);
        this.activeLeaderboardTower = tId;

        const container = document.getElementById('leaderboard-runs-list');
        if (!container) return;

        // Asegurar estado visual de las pestañas
        const tabBtns = document.querySelectorAll('.leaderboard-tower-tab');
        tabBtns.forEach(btn => {
            const btnTower = Number(btn.getAttribute('data-tower')) || 1;
            if (btnTower === tId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        const towerInfo = (typeof TOWERS_CONFIG !== 'undefined' && TOWERS_CONFIG[tId])
            ? TOWERS_CONFIG[tId]
            : { name: `Torre ${tId}`, bossName: 'Jefe del Sector', startFloor: 1, endFloor: 10 };

        const subtitleEl = document.getElementById('leaderboard-current-tower-subtitle');
        if (subtitleEl) {
            subtitleEl.innerHTML = `<strong>${towerInfo.name.toUpperCase()}</strong> (Pisos ${towerInfo.startFloor} al ${towerInfo.endFloor}) // Jefe: <strong>${towerInfo.bossName}</strong>`;
        }

        container.innerHTML = `
            <div class="history-loading">
                <span class="loading-spinner">⚡</span> Escaneando registros de los mejores comandantes de ${towerInfo.name} en Supabase...
            </div>
        `;

        if (!isSupabaseConfigured() || !supabaseClient) {
            container.innerHTML = `
                <div class="history-empty-state">
                    <div class="empty-icon">☁️</div>
                    <div class="empty-title">CLASIFICACIÓN EN LA NUBE OFFLINE</div>
                    <div class="empty-desc">Conecta Supabase en js/supabaseClient.js para sincronizar y visualizar el Top 10 global de cada torre.</div>
                </div>
            `;
            return;
        }

        try {
            const runs = await this.getTop10Speedruns(tId);

            if (!runs || !Array.isArray(runs) || runs.length === 0) {
                const emptyBossMsg = tId === 3 
                    ? 'Aún ningún comandante ha registrado una victoria sobre SINGULARIDAD-ZERO en la Torre de Singularidad. ¡Sé el primero en conquistar la Singularidad!'
                    : (tId === 2 
                        ? 'Aún ningún comandante ha registrado una victoria sobre TITAN-OMEGA en la Torre Cuántica. ¡Sé el primero en derrotarlo!'
                        : 'Aún ningún comandante ha registrado una victoria sobre TITAN-X en la Torre Cibernética. ¡Sé el primero en derrotarlo!');

                container.innerHTML = `
                    <div class="history-empty-state">
                        <div class="empty-icon">👑</div>
                        <div class="empty-title">SALÓN DE LA FAMA VACÍO // ${towerInfo.name.toUpperCase()}</div>
                        <div class="empty-desc">${emptyBossMsg}</div>
                    </div>
                `;
                return;
            }

            const cardsHtml = runs.map((run, index) => {
                try {
                    return this.renderLeaderboardCard(run, index + 1, tId);
                } catch (cardErr) {
                    console.error('[AuthManager] Error al renderizar tarjeta de leaderboard individual:', cardErr, run);
                    return '';
                }
            }).filter(Boolean).join('');

            if (!cardsHtml) {
                container.innerHTML = `
                    <div class="history-empty-state">
                        <div class="empty-icon">👑</div>
                        <div class="empty-title">SALÓN DE LA FAMA VACÍO</div>
                        <div class="empty-desc">No se pudieron procesar las partidas del Top 10 de ${towerInfo.name}.</div>
                    </div>
                `;
                return;
            }

            container.innerHTML = cardsHtml;
        } catch (err) {
            console.error('[AuthManager] Error inesperado en loadAndRenderLeaderboard:', err);
            container.innerHTML = `
                <div class="history-empty-state">
                    <div class="empty-icon">⚠️</div>
                    <div class="empty-title">ERROR AL SINCRONIZAR CLASIFICACIÓN</div>
                    <div class="empty-desc">Ocurrió una anomalía al recuperar el Top 10 de ${towerInfo.name} desde Supabase.</div>
                    <button class="btn-refresh-history" onclick="AuthManager.loadAndRenderLeaderboard(${tId})" style="margin-top: 12px; padding: 8px 16px;">
                        🔄 Reintentar conexión
                    </button>
                </div>
            `;
        }
    },

    renderLeaderboardCard(run, rank, towerId) {
        if (!run) return '';

        let tierClass = 'tier-silver';
        let tierBadgeIcon = '🥈';
        let tierName = 'PLATEADO';

        if (rank <= 3) {
            tierClass = 'tier-diamond';
            tierBadgeIcon = '💎';
            tierName = 'DIAMANTE';
        } else if (rank <= 6) {
            tierClass = 'tier-gold';
            tierBadgeIcon = '👑';
            tierName = 'DORADO';
        }

        const durationNum = Number(run.duration_seconds) || 0;
        const minutes = Math.floor(durationNum / 60);
        const seconds = durationNum % 60;
        const durationFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        let dateFormatted = 'Reciente';
        if (run.created_at) {
            try {
                const d = new Date(run.created_at);
                if (!isNaN(d.getTime())) {
                    dateFormatted = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                }
            } catch (e) {}
        }

        const commanderName = run.player_name || 'Comandante Anónimo';

        const runTowerId = run.tower_id || towerId || (run.floor_reached > 20 ? 3 : (run.floor_reached > 10 ? 2 : 1));
        const towerCfg = (typeof TOWERS_CONFIG !== 'undefined' && TOWERS_CONFIG[runTowerId]) ? TOWERS_CONFIG[runTowerId] : null;
        const towerPillName = towerCfg ? towerCfg.name : `Torre ${runTowerId}`;
        const towerPillEmoji = runTowerId === 3 ? '👑' : (runTowerId === 2 ? '🌌' : '🗼');

        let squad = run.squad;
        if (typeof squad === 'string') {
            try { squad = JSON.parse(squad); } catch (e) { squad = []; }
        }
        if (!Array.isArray(squad)) squad = [];

        const squadHtml = squad.map(r => {
            if (!r) return '';
            const rElem = (r.element && typeof r.element === 'string') ? r.element : 'NEUTRO';
            const elemEmoji = (typeof ELEMENT_EMOJIS !== 'undefined' && ELEMENT_EMOJIS[rElem]) ? ELEMENT_EMOJIS[rElem] : '🤖';
            const rName = r.name || 'Robot';
            const rLevel = r.level || 1;
            const weaponName = (r.equippedWeapon && typeof r.equippedWeapon === 'object' && r.equippedWeapon.name) 
                ? r.equippedWeapon.name 
                : (typeof r.equippedWeapon === 'string' ? r.equippedWeapon : '');
            const tooltipTitle = weaponName ? `${rName} (Nv.${rLevel}) - ${weaponName}` : `${rName} (Nv.${rLevel})`;
            return `
                <span class="leaderboard-squad-member elem-${rElem}" title="${tooltipTitle}">
                    ${elemEmoji} <span class="squad-robot-name">${rName}</span>
                </span>
            `;
        }).filter(Boolean).join('');

        return `
            <div class="leaderboard-card ${tierClass}">
                <div class="leaderboard-rank-col">
                    <div class="leaderboard-rank-badge">
                        <span class="rank-icon">${tierBadgeIcon}</span>
                        <span class="rank-num">#${rank}</span>
                    </div>
                    <span class="rank-tier-label">${tierName}</span>
                </div>

                <div class="leaderboard-main-col">
                    <div class="leaderboard-pilot-row">
                        <span class="leaderboard-pilot-name">👨‍💻 ${commanderName}</span>
                        <span class="leaderboard-tower-badge tower-${runTowerId}">
                            ${towerPillEmoji} ${towerPillName} (P.${run.floor_reached || (runTowerId * 10)})
                        </span>
                        <span class="leaderboard-date">${dateFormatted}</span>
                    </div>

                    <div class="leaderboard-squad-row">
                        <span class="squad-label">ESCUADRÓN:</span>
                        <div class="squad-chips-wrap">${squadHtml || '<span class="no-squad" style="font-size: 11px; color: #8395a7;">Sin datos</span>'}</div>
                    </div>
                </div>

                <div class="leaderboard-time-col">
                    <div class="leaderboard-time-display">
                        <span class="time-label">⏱️ TIEMPO</span>
                        <span class="time-value">${durationFormatted}</span>
                    </div>
                    <div class="leaderboard-scrap-info">
                        <span>⚙️ ${run.scrap_collected || 0}</span>
                    </div>
                </div>
            </div>
        `;
    },

    updateAuthUI() {
        const topBarStatus = document.getElementById('top-bar-status');
        const userEmailDisplay = document.getElementById('account-user-email');
        const authLoggedOutView = document.getElementById('auth-logged-out-view');
        const authLoggedInView = document.getElementById('auth-logged-in-view');
        const authStatusBadge = document.getElementById('auth-cloud-status-badge');
        const mainMenuStatus = document.getElementById('main-menu-status');

        const isAnon = this.isAnonymous();
        const hasUser = !!this.currentUser;
        const isConfigured = isSupabaseConfigured();

        // 1. Estado en Barra Superior y Menú Principal
        let statusIndicatorClass = 'offline';
        let statusText = 'OFFLINE';

        if (isConfigured && hasUser) {
            if (isAnon) {
                statusIndicatorClass = 'anon';
                statusText = 'ANÓNIMO';
            } else {
                statusIndicatorClass = 'online';
                statusText = 'ONLINE';
            }
        }

        if (topBarStatus) {
            topBarStatus.innerHTML = `<span class="status-indicator ${statusIndicatorClass}"></span> <span>${statusText}</span>`;
        }

        if (mainMenuStatus) {
            mainMenuStatus.innerHTML = `<span class="status-indicator ${statusIndicatorClass}"></span> ${statusText}`;
        }

        // 2. Vista en Modal de Cuenta
        if (authStatusBadge) {
            if (!isConfigured) {
                authStatusBadge.className = 'status-badge-offline';
                authStatusBadge.innerHTML = '⚠️ SUPABASE NO CONFIGURADO';
            } else if (hasUser && !isAnon) {
                authStatusBadge.className = 'status-badge-online';
                authStatusBadge.innerHTML = '☁️ CUENTA REGISTRADA Y SINCRONIZADA';
            } else if (hasUser && isAnon) {
                authStatusBadge.className = 'status-badge-anon';
                authStatusBadge.innerHTML = `⚡ USUARIO ANÓNIMO (ID: ${this.currentUser.id.substring(0, 8)}...)`;
            } else {
                authStatusBadge.className = 'status-badge-offline';
                authStatusBadge.innerHTML = '⚡ SIN CONEXIÓN';
            }
        }

        if (userEmailDisplay && this.currentUser && !isAnon) {
            userEmailDisplay.innerText = this.currentUser.email;
        }

        if (authLoggedOutView) {
            authLoggedOutView.style.display = (hasUser && !isAnon) ? 'none' : 'block';
            
            // Si es anónimo, actualizar encabezado explicativo del formulario de registro
            const authCardLead = authLoggedOutView.querySelector('.auth-card-lead');
            const authCardSub = authLoggedOutView.querySelector('.auth-card-sub');
            const btnSubmitSignup = document.getElementById('btn-modal-signup-action');
            
            if (authCardLead) {
                authCardLead.innerHTML = isAnon
                    ? '🛡️ <strong>Vincula tu correo para proteger tu progreso:</strong>'
                    : 'Guarda tus estadísticas, récords y composiciones de escuadrón en la nube.';
            }
            if (authCardSub) {
                authCardSub.innerHTML = isAnon
                    ? 'Actualmente juegas con una cuenta temporal anónima. Vincula un correo y contraseña para no perder tu chatarra global, habilidades e historial al limpiar el navegador.'
                    : 'Inicia sesión con tu cuenta registrada o crea una nueva.';
            }
            if (btnSubmitSignup) {
                btnSubmitSignup.innerHTML = isAnon
                    ? '<span>🛡️ VINCULAR Y PROTEGER CUENTA</span>'
                    : '<span>✨ REGISTRARSE</span>';
            }
        }

        if (authLoggedInView) {
            authLoggedInView.style.display = (hasUser && !isAnon) ? 'block' : 'none';
        }

        if (typeof ProfileManager !== 'undefined') {
            ProfileManager.updateAllAvatarDisplays();
            const accountUserName = document.getElementById('account-user-name');
            if (accountUserName) {
                accountUserName.innerText = this.getPlayerDisplayName();
            }
        }
    },

    // =========================================================================
    // BANNER / CTA POST-PARTIDA (VICTORIA Y GAME OVER)
    // =========================================================================
    renderPostGameAuthBanner(screenId) {
        const containerId = (screenId === 'screen-victory') 
            ? 'victory-auth-card' 
            : ((screenId === 'screen-post-battle') ? 'postbattle-auth-card' : 'gameover-auth-card');
        const container = document.getElementById(containerId);
        if (!container) return;

        const isAnon = this.isAnonymous();
        const hasUser = !!this.currentUser;
        const isPostBattle = (screenId === 'screen-post-battle');

        if (!hasUser || isAnon) {
            const headerBadge = isPostBattle ? '⏱️ SPEEDRUN CONQUISTADO // MODO ANÓNIMO' : '⚠️ MODO ANÓNIMO DETECTADO';
            const cardTitle = isPostBattle 
                ? '¿DESEAS REGISTRAR TU CUENTA Y ASEGURAR TU RÉCORD EN EL TOP 10?' 
                : '¿DESEAS BLINDAR TU PARTIDA Y RECURSOS?';
            const cardDesc = isPostBattle
                ? `Tu tiempo de speedrun ha sido registrado provisionalmente bajo el indicativo <strong>${this.getPlayerDisplayName()}</strong>. Vincula un correo y contraseña para que tu nombre quede blindado permanentemente en el Salón de la Fama y tu progreso no se pierda al cerrar o limpiar el navegador.`
                : `Tus <strong>${GAME_STATE ? GAME_STATE.scrap : 0} ⚙️ de Chatarra</strong> y habilidades están en una sesión anónima temporal. Si cierras o limpias tu navegador, <strong>podrías perderlos definitivamente</strong>. Registra tu correo para asociar todo tu progreso a una cuenta permanente:`;
            const btnText = isPostBattle ? '<span>🛡️ REGISTRAR Y BLINDAR RÉCORD</span>' : '<span>🛡️ BLINDAR Y VINCULAR CUENTA</span>';

            // Ofrecer formulario de registro para vincular la cuenta
            container.innerHTML = `
                <div class="postgame-auth-box">
                    <div class="postgame-auth-header">
                        <span class="postgame-auth-badge">${headerBadge}</span>
                        <h3 class="postgame-auth-title">${cardTitle}</h3>
                        <p class="postgame-auth-desc">${cardDesc}</p>
                    </div>

                    <form class="postgame-auth-form" onsubmit="event.preventDefault(); AuthManager.handlePostGameLink('${screenId}');">
                        <div class="postgame-inputs-row">
                            <input type="email" id="postgame-email-${screenId}" class="cyber-input postgame-input" placeholder="Tu correo electrónico..." autocomplete="email" required>
                            <input type="password" id="postgame-pass-${screenId}" class="cyber-input postgame-input" placeholder="Contraseña (mín. 6 carácteres)..." autocomplete="new-password" required>
                            <button type="submit" id="btn-postgame-link-${screenId}" class="btn-postgame-link">
                                ${btnText}
                            </button>
                        </div>
                        <div id="postgame-msg-${screenId}" class="postgame-auth-feedback" style="display: none;"></div>
                    </form>
                </div>
            `;
            container.style.display = 'block';
        } else {
            // Usuario ya registrado: confirmar que sus datos están a salvo
            const userEmail = this.currentUser.email || 'tu cuenta';
            const securedTitle = isPostBattle ? 'RÉCORD DE SPEEDRUN ASEGURADO EN EL TOP 10' : 'PROGRESO ASEGURADO EN LA NUBE';
            const securedDesc = isPostBattle
                ? `Tu tiempo de speedrun en esta torre ha quedado respaldado en el Salón de la Fama bajo el comandante <strong>${this.getPlayerDisplayName()}</strong> (${userEmail}).`
                : `Esta partida, tu chatarra acumulada y tus talentos han quedado respaldados en tu cuenta: <strong>${userEmail}</strong>.`;

            container.innerHTML = `
                <div class="postgame-auth-box postgame-auth-secured">
                    <div class="secured-icon">${isPostBattle ? '👑' : '☁️'}</div>
                    <div class="secured-content">
                        <div class="secured-title">${securedTitle}</div>
                        <div class="secured-desc">${securedDesc}</div>
                    </div>
                </div>
            `;
            container.style.display = 'block';
        }
    },

    async handlePostGameLink(screenId) {
        const emailInput = document.getElementById(`postgame-email-${screenId}`);
        const passInput = document.getElementById(`postgame-pass-${screenId}`);
        const msgEl = document.getElementById(`postgame-msg-${screenId}`);
        const btnSubmit = document.getElementById(`btn-postgame-link-${screenId}`);

        if (!emailInput || !passInput) return;
        const email = emailInput.value.trim();
        const pass = passInput.value;

        if (!email || !pass || pass.length < 6) {
            if (msgEl) {
                msgEl.className = 'postgame-auth-feedback feedback-error';
                msgEl.innerText = '⚠️ Ingresa un correo válido y una contraseña de al menos 6 caracteres.';
                msgEl.style.display = 'block';
            }
            return;
        }

        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<span>⏳ VINCULANDO...</span>';
        }

        if (msgEl) {
            msgEl.className = 'postgame-auth-feedback feedback-info';
            msgEl.innerText = '⏳ Guardando progreso y vinculando cuenta...';
            msgEl.style.display = 'block';
        }

        const res = await this.linkAccount(email, pass);

        if (res.error) {
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = (screenId === 'screen-post-battle')
                    ? '<span>🛡️ REGISTRAR Y BLINDAR RÉCORD</span>'
                    : '<span>🛡️ BLINDAR Y VINCULAR CUENTA</span>';
            }
            if (msgEl) {
                msgEl.className = 'postgame-auth-feedback feedback-error';
                msgEl.innerText = `❌ ${res.error.message || res.error}`;
                msgEl.style.display = 'block';
            }
        } else {
            // Actualizar nombre de piloto en match_runs de Supabase tras vincular cuenta
            if (typeof supabaseClient !== 'undefined' && supabaseClient && this.currentUser) {
                try {
                    const newDisplayName = this.getPlayerDisplayName();
                    await supabaseClient
                        .from('match_runs')
                        .update({ player_name: newDisplayName })
                        .eq('user_id', this.currentUser.id);
                    console.info('[AuthManager] Nombres de partidas vinculadas actualizados en match_runs a:', newDisplayName);
                } catch (updErr) {
                    console.warn('[AuthManager] Error actualizando nombre en match_runs tras vincular:', updErr);
                }
            }

            // Si está en pantalla post-batalla, refrescar el indicativo en el banner de speedrun
            const pilotDisplayVal = document.querySelector('.speedrun-pilot-val');
            if (pilotDisplayVal) {
                pilotDisplayVal.innerHTML = `👤 ${this.getPlayerDisplayName()}`;
            }

            if (msgEl) {
                msgEl.className = 'postgame-auth-feedback feedback-success';
                msgEl.innerText = '✨ ¡Cuenta vinculada exitosamente! Tu récord de speedrun y progreso táctico han sido asegurados permanentemente.';
                msgEl.style.display = 'block';
            }
            setTimeout(() => {
                this.renderPostGameAuthBanner(screenId);
            }, 1200);
        }
    },

    refreshPostGameBanners() {
        const gameOverScreen = document.getElementById('screen-game-over');
        const victoryScreen = document.getElementById('screen-victory');
        const postBattleScreen = document.getElementById('screen-post-battle');
        if (gameOverScreen && gameOverScreen.classList.contains('active')) {
            this.renderPostGameAuthBanner('screen-game-over');
        }
        if (victoryScreen && victoryScreen.classList.contains('active')) {
            this.renderPostGameAuthBanner('screen-victory');
        }
        if (postBattleScreen && postBattleScreen.classList.contains('active')) {
            this.renderPostGameAuthBanner('screen-post-battle');
        }
    },

    showAuthMessage(msg, type = 'info') {
        const msgEl = document.getElementById('auth-message-box');
        if (!msgEl) return;

        msgEl.className = `auth-msg-banner auth-msg-${type}`;
        msgEl.innerHTML = msg;
        msgEl.style.display = 'block';
    },

    clearAuthMessage() {
        const msgEl = document.getElementById('auth-message-box');
        if (msgEl) msgEl.style.display = 'none';
    },

    switchTab(tabId) {
        document.querySelectorAll('.account-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.account-tab-panel').forEach(p => p.classList.remove('active'));

        const btn = document.getElementById(`btn-${tabId}`);
        const panel = document.getElementById(tabId);
        if (btn) btn.classList.add('active');
        if (panel) panel.classList.add('active');

        this.clearAuthMessage();
        if (tabId === 'tab-history') {
            this.loadAndRenderHistory();
        } else if (tabId === 'tab-profile') {
            if (typeof ProfileManager !== 'undefined') {
                ProfileManager.renderProfileTab();
            }
        }
    }
};

// Funciones globales para invocar desde HTML
function openAccountModal(initialTab = 'tab-account') {
    const modal = document.getElementById('account-modal');
    if (modal) {
        modal.style.display = 'flex';
        AuthManager.switchTab(initialTab);
    }
}

function closeAccountModal() {
    const modal = document.getElementById('account-modal');
    if (modal) {
        modal.style.display = 'none';
        AuthManager.clearAuthMessage();
    }
}

// Inicializar Auth al cargar el documento
document.addEventListener('DOMContentLoaded', () => {
    AuthManager.init();
});

function openLeaderboardModal() {
    const modal = document.getElementById('leaderboard-modal');
    if (modal) {
        modal.style.display = 'flex';
        AuthManager.loadAndRenderLeaderboard();
    }
}

function openLeaderboardForTower(towerId = 1) {
    const modal = document.getElementById('leaderboard-modal');
    if (modal) {
        modal.style.display = 'flex';
        AuthManager.switchLeaderboardTower(towerId);
    }
}

function closeLeaderboardModal() {
    const modal = document.getElementById('leaderboard-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}
