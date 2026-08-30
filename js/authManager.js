// authManager.js
// Manejo de autenticación, perfil de usuario y persistencia de partidas en Supabase / localStorage

const LOCAL_STORAGE_HISTORY_KEY = 'cyber_elemental_runs_history';

const AuthManager = {
    currentUser: null,
    historyCache: [],

    async init() {
        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            try {
                const { data: { session } } = await supabaseClient.auth.getSession();
                this.currentUser = session ? session.user : null;

                supabaseClient.auth.onAuthStateChange(async (_event, session) => {
                    this.currentUser = session ? session.user : null;
                    this.updateAuthUI();
                    if (typeof SkillsManager !== 'undefined') {
                        await SkillsManager.loadProfile();
                    }
                });
            } catch (err) {
                console.warn('[AuthManager] Error al obtener sesión:', err);
            }
        }
        this.updateAuthUI();
        if (typeof SkillsManager !== 'undefined') {
            SkillsManager.loadProfile();
        }
    },

    async signUp(email, password) {
        if (!isSupabaseConfigured() || !supabaseClient) {
            this.showAuthMessage('⚠️ Supabase no está configurado aún en js/supabaseClient.js. Configura tus claves primero.', 'warning');
            return { error: 'Supabase no configurado' };
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
                this.showAuthMessage('✉️ ¡Registro exitoso! Hemos enviado un enlace de confirmación a tu correo. Revísalo para activar tu cuenta.', 'success');
            }
            return { data };
        } catch (err) {
            this.showAuthMessage(`❌ Error de conexión: ${err.message}`, 'error');
            return { error: err };
        }
    },

    async signIn(email, password) {
        if (!isSupabaseConfigured() || !supabaseClient) {
            this.showAuthMessage('⚠️ Supabase no está configurado aún en js/supabaseClient.js. Las partidas se guardarán localmente.', 'warning');
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
        }
        this.currentUser = null;
        this.showAuthMessage('Sesión cerrada. Modo invitado activo.', 'info');
        this.updateAuthUI();

        if (typeof SkillsManager !== 'undefined') {
            await SkillsManager.loadProfile();
        }

        this.loadAndRenderHistory();
    },

    async saveMatchRun(runData) {
        // 1. Acumular la chatarra sobrante de la run al pozo global de la cuenta
        if (typeof SkillsManager !== 'undefined') {
            SkillsManager.addGlobalScrap(runData.scrap_collected || 0);
        }

        // Enriquecer datos con fecha
        const enrichedRun = {
            ...runData,
            created_at: new Date().toISOString()
        };

        // 2. Guardar siempre en LocalStorage como resguardo
        try {
            const localHistory = JSON.parse(localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY) || '[]');
            localHistory.unshift(enrichedRun);
            localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(localHistory.slice(0, 20)));
        } catch (e) {
            console.warn('[AuthManager] Error guardando en localStorage:', e);
        }

        // 3. Si el usuario está autenticado en Supabase, guardar en la nube
        if (this.currentUser && isSupabaseConfigured() && supabaseClient) {
            try {
                const playerName = this.currentUser.user_metadata?.nickname 
                    || this.currentUser.email.split('@')[0];

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
                    console.info('[Supabase] Partida guardada exitosamente en la nube.');
                }
            } catch (err) {
                console.error('[Supabase] Excepción al guardar partida:', err);
            }
        }
    },

    async getHistory() {
        if (this.currentUser && isSupabaseConfigured() && supabaseClient) {
            try {
                const { data, error } = await supabaseClient
                    .from('match_runs')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (!error && data && data.length > 0) {
                    return data;
                }
            } catch (err) {
                console.warn('[Supabase] Falló consulta remota, cargando local:', err);
            }
        }

        // Fallback a LocalStorage
        try {
            return JSON.parse(localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY) || '[]');
        } catch (e) {
            return [];
        }
    },

    async loadAndRenderHistory() {
        const container = document.getElementById('history-runs-list');
        if (!container) return;

        container.innerHTML = `
            <div class="history-loading">
                <span class="loading-spinner">⚡</span> Sincronizando registros tácticos...
            </div>
        `;

        try {
            const runs = await this.getHistory();

            if (!runs || !Array.isArray(runs) || runs.length === 0) {
                container.innerHTML = `
                    <div class="history-empty-state">
                        <div class="empty-icon">📂</div>
                        <div class="empty-title">SIN REGISTROS DE INCURSIÓN</div>
                        <div class="empty-desc">No hay partidas registradas aún. ¡Comienza una incursión para generar tu historial táctico!</div>
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
                    <div class="empty-desc">No se pudieron procesar los registros locales/remotos.</div>
                </div>
            `;
        } catch (err) {
            console.error('[AuthManager] Error inesperado en loadAndRenderHistory:', err);
            container.innerHTML = `
                <div class="history-empty-state">
                    <div class="empty-icon">⚠️</div>
                    <div class="empty-title">ERROR AL CARGAR HISTORIAL</div>
                    <div class="empty-desc">Ocurrió un error al procesar el historial táctico.</div>
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
                <span class="loading-spinner">⚡</span> Escaneando registros de los mejores comandantes...
            </div>
        `;

        if (!isSupabaseConfigured() || !supabaseClient) {
            container.innerHTML = `
                <div class="history-empty-state">
                    <div class="empty-icon">☁️</div>
                    <div class="empty-title">CLASIFICACIÓN EN LA NUBE OFFLINE</div>
                    <div class="empty-desc">Conecta Supabase para sincronizar y visualizar el Top 10 global de speedrunners.</div>
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
                        <div class="empty-desc">Aún ningún comandante ha registrado una victoria sobre TITAN-X con su cuenta. ¡Sé el primero en derrotarlo!</div>
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
                    <div class="empty-desc">Ocurrió una anomalía al recuperar el Top 10 global.</div>
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
        const topBarStatus = document.getElementById('top-bar-status') || document.getElementById('btn-account-top');
        const startScreenBtn = document.getElementById('btn-account-start');
        const userEmailDisplay = document.getElementById('account-user-email');
        const authLoggedOutView = document.getElementById('auth-logged-out-view');
        const authLoggedInView = document.getElementById('auth-logged-in-view');
        const authStatusBadge = document.getElementById('auth-cloud-status-badge');

        const isLogged = !!this.currentUser;
        const isConfigured = isSupabaseConfigured();

        const indicatorClass = isLogged ? 'online' : 'offline';
        const statusText = isLogged ? 'ONLINE' : 'OFFLINE';

        if (topBarStatus) {
            topBarStatus.innerHTML = `<span class="status-indicator ${indicatorClass}"></span> <span>${statusText}</span>`;
        }
        if (startScreenBtn) {
            startScreenBtn.innerHTML = `<span class="btn-icon">${isLogged ? '🟢' : '👤'}</span> ${isLogged ? this.currentUser.email.split('@')[0] : 'CUENTA / HISTORIAL'}`;
        }

        const mainMenuStatus = document.getElementById('main-menu-status');
        if (mainMenuStatus) {
            mainMenuStatus.innerHTML = `<span class="status-indicator ${indicatorClass}"></span> ${statusText}`;
        }

        if (userEmailDisplay && this.currentUser) {
            userEmailDisplay.innerText = this.currentUser.email;
        }

        if (authLoggedOutView) authLoggedOutView.style.display = isLogged ? 'none' : 'block';
        if (authLoggedInView) authLoggedInView.style.display = isLogged ? 'block' : 'none';

        if (authStatusBadge) {
            if (!isConfigured) {
                authStatusBadge.className = 'status-badge-offline';
                authStatusBadge.innerHTML = '⚡ MODO INVITADO (LOCAL STORAGE)';
            } else if (isLogged) {
                authStatusBadge.className = 'status-badge-online';
                authStatusBadge.innerHTML = '☁️ SINCRONIZADO';
            } else {
                authStatusBadge.className = 'status-badge-ready';
                authStatusBadge.innerHTML = '☁️ SUPABASE LISTO // INICIA SESIÓN';
            }
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
