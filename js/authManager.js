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

                supabaseClient.auth.onAuthStateChange((_event, session) => {
                    this.currentUser = session ? session.user : null;
                    this.updateAuthUI();
                });
            } catch (err) {
                console.warn('[AuthManager] Error al obtener sesión:', err);
            }
        }
        this.updateAuthUI();
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
        this.loadAndRenderHistory();
    },

    async saveMatchRun(runData) {
        // Enriquecer datos con fecha
        const enrichedRun = {
            ...runData,
            created_at: new Date().toISOString()
        };

        // 1. Guardar siempre en LocalStorage como resguardo
        try {
            const localHistory = JSON.parse(localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY) || '[]');
            localHistory.unshift(enrichedRun);
            localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(localHistory.slice(0, 20)));
        } catch (e) {
            console.warn('[AuthManager] Error guardando en localStorage:', e);
        }

        // 2. Si el usuario está autenticado en Supabase, guardar en la nube
        if (this.currentUser && isSupabaseConfigured() && supabaseClient) {
            try {
                const { error } = await supabaseClient
                    .from('match_runs')
                    .insert([{
                        user_id: this.currentUser.id,
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

        const runs = await this.getHistory();

        if (!runs || runs.length === 0) {
            container.innerHTML = `
                <div class="history-empty-state">
                    <div class="empty-icon">📂</div>
                    <div class="empty-title">SIN REGISTROS DE INCURSIÓN</div>
                    <div class="empty-desc">No hay partidas registradas aún. ¡Comienza una incursión para generar tu historial táctico!</div>
                </div>
            `;
            return;
        }

        container.innerHTML = runs.map(run => this.renderRunCard(run)).join('');
    },

    renderRunCard(run) {
        const isWin = !!run.won;
        const minutes = Math.floor((run.duration_seconds || 0) / 60);
        const seconds = (run.duration_seconds || 0) % 60;
        const durationFormatted = `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
        
        let dateFormatted = 'Reciente';
        if (run.created_at) {
            try {
                const d = new Date(run.created_at);
                dateFormatted = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
            } catch (e) {}
        }

        const squad = Array.isArray(run.squad) ? run.squad : [];
        const squadHtml = squad.map(r => {
            const elemEmoji = (typeof ELEMENT_EMOJIS !== 'undefined' && ELEMENT_EMOJIS[r.element]) ? ELEMENT_EMOJIS[r.element] : '🤖';
            const weaponText = r.equippedWeapon ? `${r.equippedWeapon.name || 'Arma'}` : 'Sin Arma';
            const chipsText = (r.chips && r.chips.length > 0) ? r.chips.map(c => `💾 ${c}`).join(' ') : '';

            return `
                <div class="run-member-pill elem-${r.element || 'NEUTRO'}">
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
        }).join('');

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

    updateAuthUI() {
        const topBarBtn = document.getElementById('btn-account-top');
        const startScreenBtn = document.getElementById('btn-account-start');
        const userEmailDisplay = document.getElementById('account-user-email');
        const authLoggedOutView = document.getElementById('auth-logged-out-view');
        const authLoggedInView = document.getElementById('auth-logged-in-view');
        const authStatusBadge = document.getElementById('auth-cloud-status-badge');

        const isLogged = !!this.currentUser;
        const isConfigured = isSupabaseConfigured();

        const btnLabel = isLogged 
            ? `🟢 ${this.currentUser.email.split('@')[0]}` 
            : `👤 CUENTA / HISTORIAL`;

        if (topBarBtn) topBarBtn.innerHTML = `<span>${btnLabel}</span>`;
        if (startScreenBtn) startScreenBtn.innerHTML = `<span class="btn-icon">${isLogged ? '🟢' : '👤'}</span> ${btnLabel}`;

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
                authStatusBadge.innerHTML = '☁️ SINCRONIZADO EN LA NUBE (SUPABASE)';
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
