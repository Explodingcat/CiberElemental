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
        if (!this.currentUser) return 'Piloto Desconocido';
        if (this.isAnonymous()) {
            return `Invitado_${this.currentUser.id.substring(0, 5)}`;
        }
        return this.currentUser.user_metadata?.nickname 
            || (this.currentUser.email ? this.currentUser.email.split('@')[0] : 'Comandante');
    },

    async init() {
        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            try {
                const { data: { session } } = await supabaseClient.auth.getSession();
                if (session && session.user) {
                    this.currentUser = session.user;
                } else if (isSupabaseConfigured()) {
                    // Si no hay sesión previa, iniciar sesión anónima automáticamente
                    console.info('[AuthManager] No hay sesión activa. Iniciando sesión anónima...');
                    const { data, error } = await supabaseClient.auth.signInAnonymously();
                    if (error) {
                        console.warn('[AuthManager] Falló inicio de sesión anónimo automático:', error);
                    } else if (data && data.user) {
                        this.currentUser = data.user;
                        console.info('[AuthManager] Sesión anónima creada con user_id:', this.currentUser.id);
                    }
                }

                supabaseClient.auth.onAuthStateChange(async (_event, session) => {
                    this.currentUser = session ? session.user : null;
                    this.updateAuthUI();
                    if (typeof SkillsManager !== 'undefined') {
                        await SkillsManager.loadProfile();
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

        this.loadAndRenderHistory();
    },

    async saveMatchRun(runData) {
        // 1. Acumular la chatarra sobrante de la run al pozo global de la cuenta
        if (typeof SkillsManager !== 'undefined') {
            await SkillsManager.addGlobalScrap(runData.scrap_collected || 0);
        }

        // 2. Si hay usuario y Supabase configurado, guardar en la base de datos
        if (this.currentUser && isSupabaseConfigured() && supabaseClient) {
            try {
                const playerName = this.getPlayerDisplayName();

                const { error } = await supabaseClient
                    .from('match_runs')
                    .insert([{
                        user_id: this.currentUser.id,
                        player_name: playerName,
                        won: runData.won,
                        floor_reached: runData.floor_reached,
                        duration_seconds: runData.duration_seconds,
                        scrap_collected: runData.scrap_collected,
                        squad: runData.squad
                    }]);

                if (error) {
                    console.error('[Supabase] Error al insertar match_run:', error);
                } else {
                    console.info('[Supabase] Partida guardada exitosamente en la nube para user_id:', this.currentUser.id);
                }
            } catch (err) {
                console.error('[Supabase] Excepción al guardar partida:', err);
            }
        } else {
            console.warn('[Supabase] No se guardó match_run en la nube (sin usuario o sin cliente Supabase).');
        }
    },

    async getHistory() {
        if (this.currentUser && isSupabaseConfigured() && supabaseClient) {
            try {
                const { data, error } = await supabaseClient
                    .from('match_runs')
                    .select('*')
                    .eq('user_id', this.currentUser.id)
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

        return `
            <div class="run-history-card ${isWin ? 'run-win' : 'run-loss'}">
                <div class="run-card-header">
                    <div class="run-outcome-badge ${isWin ? 'badge-win' : 'badge-loss'}">
                        ${isWin ? '🏆 VICTORIA // SECTOR LIBERADO' : '💀 GAME OVER // FALLO DE ESCUADRÓN'}
                    </div>
                    <div class="run-date">${dateFormatted}</div>
                </div>

                <div class="run-metrics-row">
                    <div class="run-metric">
                        <span class="metric-lbl">🗼 PISO</span>
                        <span class="metric-val ${isWin ? 'val-win' : ''}">${run.floor_reached || 1}/10</span>
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

    async getTop10Speedruns() {
        if (!isSupabaseConfigured() || !supabaseClient) {
            return [];
        }

        try {
            const { data, error } = await supabaseClient
                .from('match_runs')
                .select('*')
                .eq('won', true)
                .order('duration_seconds', { ascending: true })
                .limit(10);

            if (error) {
                console.warn('[Supabase] Error al obtener Top 10:', error);
                return [];
            }
            return data || [];
        } catch (err) {
            console.error('[Supabase] Excepción al obtener Top 10:', err);
            return [];
        }
    },

    async loadAndRenderLeaderboard() {
        const container = document.getElementById('leaderboard-runs-list');
        if (!container) return;

        container.innerHTML = `
            <div class="history-loading">
                <span class="loading-spinner">⚡</span> Escaneando registros de los mejores comandantes en Supabase...
            </div>
        `;

        if (!isSupabaseConfigured() || !supabaseClient) {
            container.innerHTML = `
                <div class="history-empty-state">
                    <div class="empty-icon">☁️</div>
                    <div class="empty-title">CLASIFICACIÓN EN LA NUBE OFFLINE</div>
                    <div class="empty-desc">Conecta Supabase en js/supabaseClient.js para sincronizar y visualizar el Top 10 global.</div>
                </div>
            `;
            return;
        }

        try {
            const runs = await this.getTop10Speedruns();

            if (!runs || !Array.isArray(runs) || runs.length === 0) {
                container.innerHTML = `
                    <div class="history-empty-state">
                        <div class="empty-icon">👑</div>
                        <div class="empty-title">SALÓN DE LA FAMA VACÍO</div>
                        <div class="empty-desc">Aún ningún comandante ha registrado una victoria sobre TITAN-X. ¡Sé el primero en derrotarlo!</div>
                    </div>
                `;
                return;
            }

            const cardsHtml = runs.map((run, index) => {
                try {
                    return this.renderLeaderboardCard(run, index + 1);
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
                        <div class="empty-desc">No se pudieron procesar las partidas del Top 10.</div>
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
                    <div class="empty-desc">Ocurrió una anomalía al recuperar el Top 10 global desde Supabase.</div>
                    <button class="btn-refresh-history" onclick="AuthManager.loadAndRenderLeaderboard()" style="margin-top: 12px; padding: 8px 16px;">
                        🔄 Reintentar conexión
                    </button>
                </div>
            `;
        }
    },

    renderLeaderboardCard(run, rank) {
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
    },

    // =========================================================================
    // BANNER / CTA POST-PARTIDA (VICTORIA Y GAME OVER)
    // =========================================================================
    renderPostGameAuthBanner(screenId) {
        const containerId = (screenId === 'screen-victory') ? 'victory-auth-card' : 'gameover-auth-card';
        const container = document.getElementById(containerId);
        if (!container) return;

        const isAnon = this.isAnonymous();
        const hasUser = !!this.currentUser;

        if (!hasUser || isAnon) {
            // Ofrecer formulario de registro para vincular la cuenta
            container.innerHTML = `
                <div class="postgame-auth-box">
                    <div class="postgame-auth-header">
                        <span class="postgame-auth-badge">⚠️ MODO ANÓNIMO DETECTADO</span>
                        <h3 class="postgame-auth-title">¿DESEAS BLINDAR TU PARTIDA Y RECURSOS?</h3>
                        <p class="postgame-auth-desc">
                            Tus <strong>${GAME_STATE ? GAME_STATE.scrap : 0} ⚙️ de Chatarra</strong> y habilidades están en una sesión anónima temporal.
                            Si cierras o limpias tu navegador, <strong>podrías perderlos definitivamente</strong>.
                            Registra tu correo para asociar todo tu progreso a una cuenta permanente:
                        </p>
                    </div>

                    <form class="postgame-auth-form" onsubmit="event.preventDefault(); AuthManager.handlePostGameLink('${screenId}');">
                        <div class="postgame-inputs-row">
                            <input type="email" id="postgame-email-${screenId}" class="cyber-input postgame-input" placeholder="Tu correo electrónico..." autocomplete="email" required>
                            <input type="password" id="postgame-pass-${screenId}" class="cyber-input postgame-input" placeholder="Contraseña (mín. 6 carácteres)..." autocomplete="new-password" required>
                            <button type="submit" id="btn-postgame-link-${screenId}" class="btn-postgame-link">
                                <span>🛡️ BLINDAR Y VINCULAR CUENTA</span>
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
            container.innerHTML = `
                <div class="postgame-auth-box postgame-auth-secured">
                    <div class="secured-icon">☁️</div>
                    <div class="secured-content">
                        <div class="secured-title">PROGRESO ASEGURADO EN LA NUBE</div>
                        <div class="secured-desc">Esta partida, tu chatarra acumulada y tus talentos han quedado respaldados en tu cuenta: <strong>${userEmail}</strong>.</div>
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
                btnSubmit.innerHTML = '<span>🛡️ BLINDAR Y VINCULAR CUENTA</span>';
            }
            if (msgEl) {
                msgEl.className = 'postgame-auth-feedback feedback-error';
                msgEl.innerText = `❌ ${res.error.message || res.error}`;
                msgEl.style.display = 'block';
            }
        } else {
            if (msgEl) {
                msgEl.className = 'postgame-auth-feedback feedback-success';
                msgEl.innerText = '✨ ¡Cuenta vinculada exitosamente! Tu progreso táctico ha sido asegurado permanentemente.';
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
        if (gameOverScreen && gameOverScreen.classList.contains('active')) {
            this.renderPostGameAuthBanner('screen-game-over');
        }
        if (victoryScreen && victoryScreen.classList.contains('active')) {
            this.renderPostGameAuthBanner('screen-victory');
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

function closeLeaderboardModal() {
    const modal = document.getElementById('leaderboard-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}
