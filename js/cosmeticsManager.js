// cosmeticsManager.js
// Gestor de la Tienda de Cosméticos, Auras, Partículas y Persistencia en Supabase
// LA BASE DE DATOS SUPABASE ES LA ÚNICA FUENTE DE LA VERDAD (Sin localStorage)

const CosmeticsManager = {
    AURA_PRICE: 999999,
    PARTICLES_PRICE: 999999,

    unlockedAuras: new Set(['NONE']),
    unlockedParticles: new Set(['NONE']),

    equippedAura: 'NONE',
    equippedParticles: 'NONE',

    previewElement: 'FUEGO',
    previewSkin: 'DEFAULT',
    inspectedAura: null,
    inspectedParticles: null,
    activeTab: 'AURAS', // 'AURAS' | 'PARTICLES'
    isInitialized: false,

    async init() {
        await this.loadCosmeticsFromDB();
        this.isInitialized = true;
        this.updateEquippedDisplay();
    },

    getUserId() {
        if (typeof AuthManager !== 'undefined' && AuthManager.currentUser) {
            return AuthManager.currentUser.id;
        }
        return null;
    },

    // =========================================================================
    // CARGAR COSMÉTICOS DESDE SUPABASE (ÚNICA FUENTE DE LA VERDAD)
    // =========================================================================
    async loadCosmeticsFromDB() {
        const userId = this.getUserId();
        if (!userId || !isSupabaseConfigured() || !supabaseClient) {
            return;
        }

        try {
            const { data, error } = await supabaseClient
                .from('player_cosmetics')
                .select('*')
                .eq('user_id', userId);

            if (error) {
                if (error.code === 'PGRST205') {
                    console.warn('[CosmeticsManager] La tabla player_cosmetics aún no existe en Supabase. Ejecuta sql/create_player_cosmetics.sql en el SQL Editor.');
                } else {
                    console.warn('[CosmeticsManager] Error al consultar player_cosmetics:', error);
                }
                return;
            }

            // Reiniciar con las opciones base gratuitas (solo NONE, ningún cosmético regalado)
            this.unlockedAuras = new Set(['NONE']);
            this.unlockedParticles = new Set(['NONE']);
            let foundEquippedAura = false;
            let foundEquippedParticles = false;

            if (data && Array.isArray(data)) {
                data.forEach(item => {
                    if (item.cosmetic_type === 'AURA') {
                        this.unlockedAuras.add(item.cosmetic_id);
                        if (item.is_equipped) {
                            this.equippedAura = item.cosmetic_id;
                            foundEquippedAura = true;
                        }
                    } else if (item.cosmetic_type === 'PARTICLES') {
                        this.unlockedParticles.add(item.cosmetic_id);
                        if (item.is_equipped) {
                            this.equippedParticles = item.cosmetic_id;
                            foundEquippedParticles = true;
                        }
                    }
                });
            }

            // Si no hay equipados en la BD, por defecto es NONE
            if (!foundEquippedAura) this.equippedAura = 'NONE';
            if (!foundEquippedParticles) this.equippedParticles = 'NONE';

            console.info('[CosmeticsManager] Cosméticos sincronizados desde Supabase:', {
                auras: Array.from(this.unlockedAuras),
                particles: Array.from(this.unlockedParticles),
                equippedAura: this.equippedAura,
                equippedParticles: this.equippedParticles
            });
        } catch (err) {
            console.error('[CosmeticsManager] Excepción al sincronizar cosméticos desde Supabase:', err);
        }
    },

    isUnlocked(type, id) {
        if (id === 'NONE') return true;
        if (type === 'AURA') {
            return this.unlockedAuras.has(id);
        } else if (type === 'PARTICLES') {
            return this.unlockedParticles.has(id);
        }
        return false;
    },

    getEquippedAura() {
        return this.equippedAura || 'NONE';
    },

    getEquippedParticles() {
        return this.equippedParticles || 'NONE';
    },

    // =========================================================================
    // COMPRA DE COSMÉTICOS (BLOQUEADO: SE GANAN JUGANDO, 999.999 ⚙️)
    // =========================================================================
    async buyCosmetic(type, id) {
        this.showToast('🔒 Cosmético bloqueado. Todos los cosméticos se ganan en combate y desafíos, no están a la venta.', 'warning');
        return;
    },

    // =========================================================================
    // EQUIPAR COSMÉTICOS Y PERSISTIR ESTADO EN SUPABASE
    // =========================================================================
    async equipCosmetic(type, id) {
        const userId = this.getUserId();

        if (!this.isUnlocked(type, id)) {
            this.showToast('⚠️ No tienes desbloqueado este cosmético.', 'warning');
            return;
        }

        if (type === 'AURA') {
            this.equippedAura = id;
        } else if (type === 'PARTICLES') {
            this.equippedParticles = id;
        }

        // Persistir estado de equipado en Supabase si hay sesión
        if (userId && isSupabaseConfigured() && supabaseClient) {
            try {
                // 1. Desmarcar todos los cosméticos de este tipo como no equipados
                await supabaseClient
                    .from('player_cosmetics')
                    .update({ is_equipped: false })
                    .eq('user_id', userId)
                    .eq('cosmetic_type', type);

                // 2. Si el cosmético seleccionado es de pago (está en la tabla), marcarlo como equipado
                if (id !== 'NONE' && id !== 'AUTO') {
                    await supabaseClient
                        .from('player_cosmetics')
                        .update({ is_equipped: true })
                        .eq('user_id', userId)
                        .eq('cosmetic_type', type)
                        .eq('cosmetic_id', id);
                }
            } catch (err) {
                console.warn('[CosmeticsManager] Advertencia al actualizar equipamiento en Supabase:', err);
            }
        }

        let cosmeticDef = null;
        if (type === 'AURA' && typeof AURAS_DATABASE !== 'undefined') {
            cosmeticDef = AURAS_DATABASE[id];
        } else if (type === 'PARTICLES' && typeof PARTICLES_DATABASE !== 'undefined') {
            cosmeticDef = PARTICLES_DATABASE[id];
        }
        const cosmeticName = cosmeticDef ? cosmeticDef.name : id;

        this.showToast(`✨ Equipado: ${cosmeticName}`, 'info');
        if (typeof SoundManager !== 'undefined') SoundManager.play('ui_equip');
        this.renderShop();
        this.updateEquippedDisplay();

        // Actualizar previsualización en la pantalla de inicio de run si está activa
        if (typeof renderRobot === 'function') {
            try { renderRobot(); } catch (e) {}
        }
    },

    // =========================================================================
    // RENDERIZADO DE LA TIENDA DE COSMÉTICOS
    // =========================================================================
    renderShop() {
        const modal = document.getElementById('cosmetics-modal');
        if (!modal) return;

        // Actualizar contador de chatarra global en la cabecera
        const scrapEl = document.getElementById('cosmetics-modal-global-scrap');
        const currentScrap = (typeof SkillsManager !== 'undefined') ? SkillsManager.globalScrap : 0;
        if (scrapEl) {
            scrapEl.innerText = `${currentScrap.toLocaleString()} ⚙️`;
        }

        // Renderizar Holo-Pod de Previsualización en Vivo
        this.renderPreviewHoloPod();

        // Renderizar Grid de Tarjetas según la pestaña activa
        this.renderCardsGrid();
    },

    renderPreviewHoloPod() {
        const podContainer = document.getElementById('cosmetics-preview-pod');
        if (!podContainer) return;

        const effectiveAura = this.inspectedAura || this.equippedAura;
        const effectiveParticles = this.inspectedParticles || this.equippedParticles;

        // Crear una unidad dummy para renderizar su avatar con el aura y partículas en vivo
        const dummyRobot = new Robot({
            name: 'Demo Robot',
            element: this.previewElement,
            emoji: '🤖',
            skin: this.previewSkin || 'DEFAULT',
            aura: effectiveAura,
            particles: effectiveParticles
        });

        const avatarGraphicHtml = dummyRobot.getAvatarGraphicHtml();

        let auraDef = dummyRobot.getAuraDef();
        let particlesDef = dummyRobot.getParticlesDef();

        let auraLabel = auraDef && auraDef.name ? auraDef.name : effectiveAura;
        let particlesLabel = particlesDef && particlesDef.name ? particlesDef.name : effectiveParticles;

        podContainer.innerHTML = `
            <div class="holo-pod-scanline"></div>
            
            <div class="holo-pod-stage">
                <div class="holo-pod-pedestal platform-${this.previewElement}">
                    <div class="holo-avatar-container">
                        ${avatarGraphicHtml}
                    </div>
                </div>
            </div>

            <div class="holo-pod-details">
                <div class="holo-controls-group">
                    <div class="holo-element-switchers">
                        <span class="switcher-label">Chasis Demo:</span>
                        <div class="switcher-buttons">
                            <button class="btn-element-switch ${this.previewSkin === 'DEFAULT' ? 'active' : ''}" onclick="CosmeticsManager.setPreviewSkin('DEFAULT')">🤖 Robot</button>
                            <button class="btn-element-switch ${this.previewSkin === 'ROBOT_SHADES' ? 'active' : ''}" onclick="CosmeticsManager.setPreviewSkin('ROBOT_SHADES')">🕶️ Lentes</button>
                            <button class="btn-element-switch ${this.previewSkin === 'PRIMAL_FIRE' ? 'active' : ''}" onclick="CosmeticsManager.setPreviewSkin('PRIMAL_FIRE')">🐉 Dragón</button>
                            <button class="btn-element-switch ${this.previewSkin === 'PRIMAL_WATER' ? 'active' : ''}" onclick="CosmeticsManager.setPreviewSkin('PRIMAL_WATER')">🐙 Leviatán</button>
                            <button class="btn-element-switch ${this.previewSkin === 'PRIMAL_EARTH' ? 'active' : ''}" onclick="CosmeticsManager.setPreviewSkin('PRIMAL_EARTH')">🗿 Gólem</button>
                            <button class="btn-element-switch ${this.previewSkin === 'PRIMAL_AIR' ? 'active' : ''}" onclick="CosmeticsManager.setPreviewSkin('PRIMAL_AIR')">🦅 Grifo</button>
                        </div>
                    </div>

                    <div class="holo-element-switchers">
                        <span class="switcher-label">Color Elemental:</span>
                        <div class="switcher-buttons">
                            <button class="btn-element-switch ${this.previewElement === 'FUEGO' ? 'active' : ''} elem-badge-FUEGO" onclick="CosmeticsManager.setPreviewElement('FUEGO')">🔥 Fuego</button>
                            <button class="btn-element-switch ${this.previewElement === 'AGUA' ? 'active' : ''} elem-badge-AGUA" onclick="CosmeticsManager.setPreviewElement('AGUA')">💧 Agua</button>
                            <button class="btn-element-switch ${this.previewElement === 'TIERRA' ? 'active' : ''} elem-badge-TIERRA" onclick="CosmeticsManager.setPreviewElement('TIERRA')">🪨 Tierra</button>
                            <button class="btn-element-switch ${this.previewElement === 'AIRE' ? 'active' : ''} elem-badge-AIRE" onclick="CosmeticsManager.setPreviewElement('AIRE')">💨 Aire</button>
                        </div>
                    </div>
                </div>

                <div class="holo-equipped-status-card">
                    <div class="status-row">
                        <span class="status-icon">✨</span>
                        <div class="status-info">
                            <span class="status-lbl">Aura en Proyección:</span>
                            <span class="status-val">${auraLabel}</span>
                        </div>
                    </div>
                    <div class="status-row">
                        <span class="status-icon">🎆</span>
                        <div class="status-info">
                            <span class="status-lbl">Partículas en Proyección:</span>
                            <span class="status-val">${particlesLabel}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    setPreviewSkin(skin) {
        this.previewSkin = skin;
        this.renderPreviewHoloPod();
    },

    setPreviewElement(element) {
        this.previewElement = element;
        this.renderPreviewHoloPod();
    },

    inspectCosmetic(type, id) {
        if (typeof SoundManager !== 'undefined') SoundManager.play('ui_hover');
        if (type === 'AURA') {
            this.inspectedAura = id;
        } else if (type === 'PARTICLES') {
            this.inspectedParticles = id;
        }
        this.renderPreviewHoloPod();
        this.renderCardsGrid();
    },

    switchTab(tab) {
        if (typeof SoundManager !== 'undefined') SoundManager.play('ui_tab');
        this.activeTab = tab;
        const btnAuras = document.getElementById('cosmetics-tab-btn-auras');
        const btnParticles = document.getElementById('cosmetics-tab-btn-particles');
        if (btnAuras) btnAuras.classList.toggle('active', tab === 'AURAS');
        if (btnParticles) btnParticles.classList.toggle('active', tab === 'PARTICLES');

        this.renderCardsGrid();
    },

    renderCardsGrid() {
        const gridContainer = document.getElementById('cosmetics-cards-grid');
        if (!gridContainer) return;

        const currentScrap = (typeof SkillsManager !== 'undefined') ? SkillsManager.globalScrap : 0;
        let html = '';

        if (this.activeTab === 'AURAS') {
            if (typeof AURAS_DATABASE === 'undefined') {
                gridContainer.innerHTML = '<div class="shop-empty-msg">No se encontró el catálogo de auras.</div>';
                return;
            }

            const aurasKeys = Object.keys(AURAS_DATABASE);
            html = aurasKeys.map(aKey => {
                const aDef = AURAS_DATABASE[aKey];
                const isUnlocked = this.isUnlocked('AURA', aDef.id);
                const isEquipped = (this.equippedAura === aDef.id);
                const isInspected = (this.inspectedAura === aDef.id);
                const isBase = (aDef.id === 'NONE');

                // Previsualización pequeña con un dummy robot
                const miniRobot = new Robot({
                    name: 'Mini',
                    element: this.previewElement,
                    emoji: '🤖',
                    skin: this.previewSkin || 'DEFAULT',
                    aura: aDef.id,
                    particles: 'NONE'
                });
                const miniAvatarHtml = miniRobot.getAvatarGraphicHtml();

                let actionButtonHtml = '';
                if (isEquipped) {
                    actionButtonHtml = `<button class="btn-cosmetic-action btn-equipped" disabled>✅ EQUIPADO</button>`;
                } else if (isUnlocked) {
                    actionButtonHtml = `<button class="btn-cosmetic-action btn-equip" onclick="event.stopPropagation(); CosmeticsManager.equipCosmetic('AURA', '${aDef.id}')">✨ EQUIPAR</button>`;
                } else {
                    actionButtonHtml = `<button class="btn-cosmetic-action btn-locked" disabled title="Bloqueado: Los cosméticos se ganan jugando">🔒 BLOQUEADO (999.999 ⚙️)</button>`;
                }

                return `
                    <div class="cosmetic-card ${isEquipped ? 'equipped-card' : ''} ${isUnlocked ? 'unlocked-card' : 'locked-card'} ${isInspected ? 'inspected-card' : ''} aura-card-${aDef.type || 'base'}" onclick="CosmeticsManager.inspectCosmetic('AURA', '${aDef.id}')" title="Haz clic para previsualizar en el Holo-Pod" style="cursor: pointer;">
                        <div class="card-mini-preview">
                            <div class="mini-avatar-scale">
                                ${miniAvatarHtml}
                            </div>
                        </div>
                        <div class="card-info">
                            <div class="card-title-row">
                                <h3 class="card-name">${aDef.name}</h3>
                                ${isBase 
                                    ? `<span class="cosmetic-price-pill free">BASE</span>`
                                    : `<span class="cosmetic-price-pill ${isUnlocked ? 'purchased' : 'cost'}">${isUnlocked ? 'DESBLOQUEADO' : '999.999 ⚙️'}</span>`
                                }
                            </div>
                            <p class="card-desc">${aDef.desc || 'Aura cibernética elemental para el escuadrón.'}</p>
                            <div class="card-action-bar">
                                ${actionButtonHtml}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

        } else if (this.activeTab === 'PARTICLES') {
            if (typeof PARTICLES_DATABASE === 'undefined') {
                gridContainer.innerHTML = '<div class="shop-empty-msg">No se encontró el catálogo de partículas.</div>';
                return;
            }

            const pKeys = Object.keys(PARTICLES_DATABASE);
            html = pKeys.map(pKey => {
                const pDef = PARTICLES_DATABASE[pKey];
                const isUnlocked = this.isUnlocked('PARTICLES', pDef.id);
                const isEquipped = (this.equippedParticles === pDef.id);
                const isInspected = (this.inspectedParticles === pDef.id);
                const isBase = (pDef.id === 'NONE');

                // Previsualización pequeña con un dummy robot
                const miniRobot = new Robot({
                    name: 'Mini',
                    element: this.previewElement,
                    emoji: '🤖',
                    skin: this.previewSkin || 'DEFAULT',
                    aura: 'NONE',
                    particles: pDef.id
                });
                const miniAvatarHtml = miniRobot.getAvatarGraphicHtml();

                let actionButtonHtml = '';
                if (isEquipped) {
                    actionButtonHtml = `<button class="btn-cosmetic-action btn-equipped" disabled>✅ EQUIPADO</button>`;
                } else if (isUnlocked) {
                    actionButtonHtml = `<button class="btn-cosmetic-action btn-equip" onclick="event.stopPropagation(); CosmeticsManager.equipCosmetic('PARTICLES', '${pDef.id}')">✨ EQUIPAR</button>`;
                } else {
                    actionButtonHtml = `<button class="btn-cosmetic-action btn-locked" disabled title="Bloqueado: Los cosméticos se ganan jugando">🔒 BLOQUEADO (999.999 ⚙️)</button>`;
                }

                return `
                    <div class="cosmetic-card ${isEquipped ? 'equipped-card' : ''} ${isUnlocked ? 'unlocked-card' : 'locked-card'} ${isInspected ? 'inspected-card' : ''} particle-card-${pDef.type || 'base'}" onclick="CosmeticsManager.inspectCosmetic('PARTICLES', '${pDef.id}')" title="Haz clic para previsualizar en el Holo-Pod" style="cursor: pointer;">
                        <div class="card-mini-preview">
                            <div class="mini-avatar-scale">
                                ${miniAvatarHtml}
                            </div>
                        </div>
                        <div class="card-info">
                            <div class="card-title-row">
                                <h3 class="card-name">${pDef.name}</h3>
                                ${isBase 
                                    ? `<span class="cosmetic-price-pill free">BASE</span>`
                                    : `<span class="cosmetic-price-pill ${isUnlocked ? 'purchased' : 'cost'}">${isUnlocked ? 'DESBLOQUEADO' : '999.999 ⚙️'}</span>`
                                }
                            </div>
                            <p class="card-desc">${pDef.desc || 'Sistema de partículas animadas dinámico.'}</p>
                            <div class="card-action-bar">
                                ${actionButtonHtml}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        gridContainer.innerHTML = html;
    },

    updateEquippedDisplay() {
        const indicator = document.getElementById('start-screen-cosmetics-pill');
        if (indicator) {
            let aName = 'Sin Aura';
            let pName = 'Sin Partículas';
            if (typeof AURAS_DATABASE !== 'undefined' && AURAS_DATABASE[this.equippedAura]) {
                aName = AURAS_DATABASE[this.equippedAura].name;
            }
            if (typeof PARTICLES_DATABASE !== 'undefined' && PARTICLES_DATABASE[this.equippedParticles]) {
                pName = PARTICLES_DATABASE[this.equippedParticles].name;
            }
            indicator.innerHTML = `
                <span class="cosmetics-indicator-label">✨ Cosméticos:</span>
                <span class="cosmetics-tag">${aName}</span> + 
                <span class="cosmetics-tag">${pName}</span>
            `;
        }
    },

    showToast(msg, type = 'info') {
        const toast = document.getElementById('cosmetics-modal-toast');
        if (!toast) return;

        toast.className = `cosmetics-toast toast-${type} show`;
        toast.innerHTML = msg;
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3400);
    }
};

// =============================================================================
// FUNCIONES GLOBALES PARA APERTURA Y CIERRE DEL MODAL
// =============================================================================
function openCosmeticsShopModal() {
    const modal = document.getElementById('cosmetics-modal');
    if (modal) {
        modal.style.display = 'flex';
        if (typeof SoundManager !== 'undefined') SoundManager.play('ui_modal_open');
        CosmeticsManager.renderShop();
        if (typeof SkillsManager !== 'undefined') {
            SkillsManager.updateAllScrapDisplays();
        }
    }
}

function closeCosmeticsShopModal() {
    const modal = document.getElementById('cosmetics-modal');
    if (modal) {
        modal.style.display = 'none';
        if (typeof SoundManager !== 'undefined') SoundManager.play('ui_modal_close');
    }
}

// Inicialización automática
document.addEventListener('DOMContentLoaded', () => {
    CosmeticsManager.init();
});
