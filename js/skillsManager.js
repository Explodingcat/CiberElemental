// skillsManager.js
// Gestor de Meta-Progresión, Chatarra Global, Habilidades Pasivas y UI del Árbol de Talentos

const LOCAL_GLOBAL_SCRAP_KEY = 'cyber_elemental_global_scrap';
const LOCAL_UNLOCKED_SKILLS_KEY = 'cyber_elemental_unlocked_skills';

const SkillsManager = {
    globalScrap: 0,
    unlockedSkills: new Set(),
    selectedBranch: 'ASSAULT',
    selectedSkillId: null,
    isInitialized: false,

    async init() {
        await this.loadProfile();
        this.isInitialized = true;
        this.updateAllScrapDisplays();
    },

    async loadProfile() {
        // 1. Cargar primero desde LocalStorage (rápido y fallback seguro)
        try {
            const localScrap = parseInt(localStorage.getItem(LOCAL_GLOBAL_SCRAP_KEY) || '0', 10);
            const localSkillsRaw = localStorage.getItem(LOCAL_UNLOCKED_SKILLS_KEY);
            const localSkills = localSkillsRaw ? JSON.parse(localSkillsRaw) : [];

            this.globalScrap = isNaN(localScrap) ? 0 : localScrap;
            this.unlockedSkills = new Set(Array.isArray(localSkills) ? localSkills : []);
        } catch (e) {
            console.warn('[SkillsManager] Error leyendo de localStorage:', e);
            this.globalScrap = 0;
            this.unlockedSkills = new Set();
        }

        // 2. Si hay usuario autenticado en Supabase, sincronizar con la nube
        if (typeof AuthManager !== 'undefined' && AuthManager.currentUser && isSupabaseConfigured() && supabaseClient) {
            try {
                const userId = AuthManager.currentUser.id;
                const { data, error } = await supabaseClient
                    .from('player_profiles')
                    .select('*')
                    .eq('user_id', userId)
                    .maybeSingle();

                if (error) {
                    console.warn('[SkillsManager] Error consultando player_profiles:', error);
                } else if (data) {
                    // Si ya existe registro remoto, combinar o adoptar el valor de la nube
                    const cloudScrap = data.global_scrap || 0;
                    const cloudSkills = Array.isArray(data.unlocked_skills) ? data.unlocked_skills : [];
                    
                    // Unificar habilidades locales y remotas
                    cloudSkills.forEach(id => this.unlockedSkills.add(id));
                    // Usar el mayor valor de chatarra entre local y nube
                    this.globalScrap = Math.max(this.globalScrap, cloudScrap);
                    
                    // Actualizar localStorage sincronizado
                    localStorage.setItem(LOCAL_GLOBAL_SCRAP_KEY, this.globalScrap.toString());
                    localStorage.setItem(LOCAL_UNLOCKED_SKILLS_KEY, JSON.stringify(Array.from(this.unlockedSkills)));
                } else {
                    // Si no existe perfil en la nube, crearlo con el progreso actual
                    await supabaseClient.from('player_profiles').insert([{
                        user_id: userId,
                        global_scrap: this.globalScrap,
                        unlocked_skills: Array.from(this.unlockedSkills),
                        updated_at: new Date().toISOString()
                    }]);
                }
            } catch (err) {
                console.warn('[SkillsManager] Excepción al sincronizar con Supabase:', err);
            }
        }

        this.updateAllScrapDisplays();
    },

    async saveProfile() {
        // 1. Guardar localmente
        try {
            localStorage.setItem(LOCAL_GLOBAL_SCRAP_KEY, this.globalScrap.toString());
            localStorage.setItem(LOCAL_UNLOCKED_SKILLS_KEY, JSON.stringify(Array.from(this.unlockedSkills)));
        } catch (e) {
            console.warn('[SkillsManager] Error guardando en localStorage:', e);
        }

        // 2. Guardar en Supabase si está autenticado
        if (typeof AuthManager !== 'undefined' && AuthManager.currentUser && isSupabaseConfigured() && supabaseClient) {
            try {
                const userId = AuthManager.currentUser.id;
                const { error } = await supabaseClient
                    .from('player_profiles')
                    .upsert({
                        user_id: userId,
                        global_scrap: this.globalScrap,
                        unlocked_skills: Array.from(this.unlockedSkills),
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id' });

                if (error) {
                    console.warn('[SkillsManager] Error guardando en player_profiles:', error);
                }
            } catch (err) {
                console.error('[SkillsManager] Excepción al guardar player_profiles:', err);
            }
        }

        this.updateAllScrapDisplays();
    },

    addGlobalScrap(amount) {
        if (!amount || amount <= 0) return;
        this.globalScrap += Math.floor(amount);
        this.saveProfile();
    },

    hasSkill(skillId) {
        return this.unlockedSkills.has(skillId);
    },

    getSkill(skillId) {
        return SKILLS_CATALOG.find(s => s.id === skillId) || null;
    },

    canUnlockSkill(skillId) {
        const skill = this.getSkill(skillId);
        if (!skill) return { can: false, reason: 'Habilidad no encontrada.' };
        if (this.hasSkill(skillId)) return { can: false, reason: 'Esta habilidad ya está desbloqueada.' };
        
        // Verificar pre-requisitos
        if (skill.prerequisites && skill.prerequisites.length > 0) {
            const missingPrereq = skill.prerequisites.find(pId => !this.hasSkill(pId));
            if (missingPrereq) {
                const prereqSkill = this.getSkill(missingPrereq);
                const prereqName = prereqSkill ? prereqSkill.name : missingPrereq;
                return { can: false, reason: `Requiere desbloquear primero: ${prereqName}.` };
            }
        }

        // Verificar chatarra global disponible
        if (this.globalScrap < skill.cost) {
            const diff = skill.cost - this.globalScrap;
            return { can: false, reason: `Te faltan ${diff} ⚙️ de Chatarra Global.` };
        }

        return { can: true, reason: 'Listo para desbloquear.' };
    },

    async unlockSkill(skillId) {
        const check = this.canUnlockSkill(skillId);
        if (!check.can) {
            this.showFeedbackMessage(`⚠️ ${check.reason}`, 'warning');
            return { success: false, error: check.reason };
        }

        const skill = this.getSkill(skillId);
        this.globalScrap -= skill.cost;
        this.unlockedSkills.add(skillId);

        await this.saveProfile();

        this.showFeedbackMessage(`✨ ¡Habilidad Desbloqueada: ${skill.name}!`, 'success');
        this.renderSkillTree();
        this.updateAllScrapDisplays();
        return { success: true };
    },

    // =========================================================================
    // CÁLCULO DE MODIFICADORES GLOBALES
    // =========================================================================
    getModifier(modKey, defaultValue = 0) {
        let total = defaultValue;
        let isBoolean = typeof defaultValue === 'boolean';

        for (const skillId of this.unlockedSkills) {
            const skill = this.getSkill(skillId);
            if (skill && skill.modifiers && skill.modifiers[modKey] !== undefined) {
                if (isBoolean) {
                    if (skill.modifiers[modKey] === true) total = true;
                } else {
                    total += skill.modifiers[modKey];
                }
            }
        }
        return total;
    },

    getAtkMultiplier() {
        return 1 + this.getModifier('atk_pct', 0);
    },

    getHpMultiplier() {
        return 1 + this.getModifier('hp_pct', 0);
    },

    getDodgeBonus() {
        return this.getModifier('dodge', 0);
    },

    getAccBonus() {
        return this.getModifier('acc', 0);
    },

    getCritRateBonus() {
        return this.getModifier('crit_rate', 0);
    },

    getCritDmgMultiplier() {
        // Base critical multiplier is 1.5x (50% bonus) + any passives
        return 1.5 + this.getModifier('crit_dmg_pct', 0);
    },

    getStartingScrap() {
        return this.getModifier('start_scrap', 0);
    },

    getScrapGainMultiplier() {
        return 1 + this.getModifier('scrap_gain_pct', 0);
    },

    getXpGainMultiplier() {
        return 1 + this.getModifier('xp_gain_pct', 0);
    },

    getShopDiscountPct() {
        return Math.min(0.50, this.getModifier('shop_discount_pct', 0));
    },

    getEliteRecruitChance() {
        return this.hasSkill('elite_recruit_up') ? 0.75 : 0.50;
    },

    getRepairShopHealPct() {
        return this.hasSkill('repair_efficiency') ? 0.40 : 0.30;
    },

    getReviveHpPct() {
        return this.hasSkill('revive_resilience') ? 0.25 : 0.10;
    },

    getDismantleRewards() {
        const hasBonus = this.hasSkill('dismantle_bonus');
        return {
            scrap: hasBonus ? 50 : 30,
            healPct: hasBonus ? 0.15 : 0.10
        };
    },

    getElementalBoost(element) {
        return this.getModifier(`elem_boost_${element}`, 0);
    },

    getComboDamageMultiplier() {
        return 1 + this.getModifier('combo_damage_pct', 0);
    },

    getAffinityMultiplierBonus() {
        return this.getModifier('affinity_bonus_extra', 0);
    },

    // =========================================================================
    // RENDERIZADO Y GESTIÓN DE UI DEL ÁRBOL
    // =========================================================================
    updateAllScrapDisplays() {
        // Chatarra en menú principal
        const mainMenuScrapEl = document.getElementById('main-menu-scrap');
        if (mainMenuScrapEl) {
            mainMenuScrapEl.innerText = `${this.globalScrap.toLocaleString()}`;
        }

        // Botón en pantalla de inicio (mantengo si sigue existiendo en algún lado)
        const btnSkillsStart = document.getElementById('btn-skills-tree-start');
        if (btnSkillsStart) {
            btnSkillsStart.innerHTML = `
                <span class="btn-icon">🌳</span> ÁRBOL DE HABILIDADES
                <span class="scrap-pill-badge">${this.globalScrap.toLocaleString()} ⚙️</span>
            `;
        }

        // Contador dentro del modal
        const modalScrapEl = document.getElementById('skills-modal-global-scrap');
        if (modalScrapEl) {
            modalScrapEl.innerText = `${this.globalScrap.toLocaleString()} ⚙️`;
        }

        // Progreso total de desbloqueo (ej. 14 / 50)
        const progressEl = document.getElementById('skills-modal-unlocked-count');
        if (progressEl) {
            progressEl.innerText = `${this.unlockedSkills.size} / ${SKILLS_CATALOG.length}`;
        }
    },

    switchBranch(branchId) {
        this.selectedBranch = branchId;
        this.selectedSkillId = null;
        this.renderSkillTree();
    },

    selectSkill(skillId) {
        this.selectedSkillId = skillId;
        this.renderSkillDetail();
        this.renderSkillTree(); // Para actualizar clase selected en nodos
    },

    renderSkillTree() {
        const container = document.getElementById('skills-tree-nodes-container');
        if (!container) return;

        const currentBranch = SKILL_BRANCHES[this.selectedBranch];
        const branchSkills = SKILLS_CATALOG.filter(s => s.branch === this.selectedBranch);

        // Actualizar pestañas activas
        document.querySelectorAll('.skills-branch-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.branch === this.selectedBranch);
        });

        // Actualizar encabezado de rama
        const headerTitle = document.getElementById('skills-branch-name');
        const headerDesc = document.getElementById('skills-branch-desc');
        if (headerTitle) headerTitle.innerHTML = `${currentBranch.icon} ${currentBranch.name}`;
        if (headerDesc) headerDesc.innerText = currentBranch.desc;

        // Agrupar habilidades por Tier (1, 2, 3, 4)
        const tiers = [1, 2, 3, 4];
        let html = '';

        tiers.forEach(tierNum => {
            const tierSkills = branchSkills.filter(s => s.tier === tierNum);
            if (tierSkills.length === 0) return;

            const tierCardsHtml = tierSkills.map(skill => {
                const isUnlocked = this.hasSkill(skill.id);
                const check = this.canUnlockSkill(skill.id);
                const isAvailable = !isUnlocked && check.can;
                const isLocked = !isUnlocked && !check.can;
                const isSelected = this.selectedSkillId === skill.id;

                let statusClass = 'node-locked';
                let statusBadge = '🔒 Bloqueada';
                if (isUnlocked) {
                    statusClass = 'node-unlocked';
                    statusBadge = '✅ Activa';
                } else if (isAvailable) {
                    statusClass = 'node-available';
                    statusBadge = '💡 Disponible';
                }

                // Generar etiquetas de pre-requisitos
                let prereqHtml = '';
                if (skill.prerequisites && skill.prerequisites.length > 0) {
                    const prereqNames = skill.prerequisites.map(pId => {
                        const p = this.getSkill(pId);
                        const hasP = this.hasSkill(pId);
                        return `<span class="prereq-pill ${hasP ? 'prereq-met' : 'prereq-unmet'}">${hasP ? '✓' : '🔒'} ${p ? p.name : pId}</span>`;
                    }).join(' ');
                    prereqHtml = `<div class="skill-card-prereqs">${prereqHtml}</div>`;
                }

                let actionHtml = '';
                if (isUnlocked) {
                    actionHtml = `<button class="btn-unlock-inline btn-skill-acquired" disabled>✅ ACTIVA</button>`;
                } else if (isAvailable) {
                    actionHtml = `<button class="btn-unlock-inline btn-skill-can-buy" onclick="event.stopPropagation(); SkillsManager.unlockSkill('${skill.id}')">⚡ DESBLOQUEAR (${skill.cost} ⚙️)</button>`;
                } else {
                    actionHtml = `<button class="btn-unlock-inline btn-skill-locked" disabled title="${check.reason}">🔒 BLOQUEADA</button>`;
                }

                return `
                    <div class="skill-node-card ${statusClass}" data-skill-id="${skill.id}">
                        <div class="node-card-header">
                            <span class="node-icon">${skill.icon}</span>
                            <span class="node-status-badge ${statusClass}-badge">${statusBadge}</span>
                        </div>
                        <div class="node-name">${skill.name}</div>
                        <div class="node-desc">${skill.desc}</div>
                        ${prereqHtml}
                        <div class="node-footer">
                            <span class="node-tier-tag">TIER ${skill.tier}</span>
                            <span class="node-cost-tag ${isUnlocked ? 'cost-paid' : (this.globalScrap >= skill.cost ? 'cost-affordable' : 'cost-expensive')}">
                                ${isUnlocked ? 'DESBLOQUEADO' : `⚙️ ${skill.cost.toLocaleString()}`}
                            </span>
                        </div>
                        <div class="node-action-bar">
                            ${actionHtml}
                        </div>
                    </div>
                `;
            }).join('');

            html += `
                <div class="skills-tier-row">
                    <div class="tier-indicator-pill">
                        <span class="tier-label">NIVEL / TIER ${tierNum}</span>
                        <div class="tier-divider-line"></div>
                    </div>
                    <div class="skills-tier-cards-grid">
                        ${tierCardsHtml}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        // Si no hay nodo seleccionado, seleccionar el primero disponible o de Tier 1
        if (!this.selectedSkillId && branchSkills.length > 0) {
            const firstAvailable = branchSkills.find(s => !this.hasSkill(s.id) && this.canUnlockSkill(s.id).can);
            this.selectedSkillId = firstAvailable ? firstAvailable.id : branchSkills[0].id;
        }

        this.renderSkillDetail();
    },

    renderSkillDetail() {
        // Obsoleto: Ya no hay panel de detalles a la derecha, todo está en la tarjeta
    },

    showFeedbackMessage(msg, type = 'info') {
        const toast = document.getElementById('skills-modal-toast');
        if (!toast) return;

        toast.className = `skills-toast toast-${type} show`;
        toast.innerHTML = msg;
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3200);
    }
};

// Funciones globales para invocar desde HTML
function openSkillTreeModal() {
    const modal = document.getElementById('skills-modal');
    if (modal) {
        modal.style.display = 'flex';
        SkillsManager.renderSkillTree();
        SkillsManager.updateAllScrapDisplays();
    }
}

function closeSkillTreeModal() {
    const modal = document.getElementById('skills-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Inicializar al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    SkillsManager.init();
});
