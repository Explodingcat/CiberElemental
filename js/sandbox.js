// sandbox.js - Lógica Integral del Entorno de Pruebas y Balance

window.isSandboxMode = true;

// Acelerador de velocidad en combate (1x, 2x, 4x, 8x)
let combatSpeedMultiplier = 1;
const _originalSetTimeout = window.setTimeout;
window.setTimeout = function(fn, delayTime, ...args) {
    let adjusted = (typeof delayTime === 'number') ? Math.max(1, Math.round(delayTime / combatSpeedMultiplier)) : delayTime;
    return _originalSetTimeout(fn, adjusted, ...args);
};

// Estado de configuración del Sandbox
const Sandbox = {
    currentTab: 'combat', // 'combat' | 'events'
    activeCombatSetup: null,
    
    combatConfig: {
        allies: [
            { enabled: true, templateKey: 'IGNIS', level: 3, weaponType: 'ESPADA', weaponElement: 'FUEGO', isUpgraded: true, chipType: 'NONE', mutatorType: 'NONE' },
            { enabled: true, templateKey: 'AQUA', level: 3, weaponType: 'BACULO', weaponElement: 'AGUA', isUpgraded: false, chipType: 'NONE', mutatorType: 'NONE' },
            { enabled: true, templateKey: 'TERRA', level: 3, weaponType: 'HACHA', weaponElement: 'TIERRA', isUpgraded: false, chipType: 'NONE', mutatorType: 'NONE' }
        ],
        enemies: [
            { enabled: true, templateKey: 'WILD_FUEGO', level: 3, weaponType: 'DAGA', weaponElement: 'FUEGO', isUpgraded: false, chipType: 'NONE', mutatorType: 'NONE' },
            { enabled: true, templateKey: 'WILD_AGUA', level: 3, weaponType: 'BACULO', weaponElement: 'AGUA', isUpgraded: false, chipType: 'NONE', mutatorType: 'NONE' },
            { enabled: false, templateKey: 'WILD_TIERRA', level: 3, weaponType: 'HACHA', weaponElement: 'TIERRA', isUpgraded: false, chipType: 'NONE', mutatorType: 'NONE' }
        ],
        options: {
            arenaBg: 'bg-normal',
            enableMetaProgression: false,
            startingScrap: 100,
            hasPem: true,
            hasNanobots: true,
            hasSobrecarga: true
        }
    },

    eventsState: {
        selectedEventIndex: 0,
        selectedCategory: 'ALL', // 'ALL', 'MYSTERY', 'SPECIAL'
        filterQuery: '',
        sandboxScrap: 50,
        sandboxHpPct: 100,
        activeRobotIndex: 0
    }
};

// Inicialización general del Sandbox al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    initSandbox();
});

function initSandbox() {
    // Interceptar final de pantalla de combate del motor principal
    hookCombatLifecycle();
    
    // Renderizar editores
    renderTeamBuilder('allies');
    renderTeamBuilder('enemies');
    
    // Inicializar probador de eventos
    initEventsTester();

    // Inicializar balanceador
    renderBalanceEditor();
    
    // Inicializar estado del equipo dummy de prueba
    syncSandboxGameStateTeam();
}

function switchSandboxTab(tabName) {
    Sandbox.currentTab = tabName;
    document.querySelectorAll('.sandbox-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.sandbox-view').forEach(view => view.classList.remove('active'));
    
    const activeBtn = document.getElementById(`tab-btn-${tabName}`);
    const activeView = document.getElementById(`view-${tabName}`);
    if (activeBtn) activeBtn.classList.add('active');
    if (activeView) activeView.classList.add('active');
    
    if (tabName === 'events') {
        syncSandboxGameStateTeam();
        renderEventStage();
    } else if (tabName === 'balance') {
        renderBalanceEditor();
    } else if (tabName === 'combat') {
        renderTeamBuilder('allies');
        renderTeamBuilder('enemies');
    }
}

/* ==========================================================================
   INTERCEPTOR DE CICLO DE VIDA DE COMBATE
   ========================================================================== */

function hookCombatLifecycle() {
    const originalShowScreen = window.showScreen;
    window.showScreen = function(screenId) {
        if (screenId === 'screen-victory' || screenId === 'screen-game-over') {
            showSandboxCombatResult(screenId === 'screen-victory');
            return;
        }
        if (screenId === 'screen-post-battle') {
            // Mostrar modal de resultado sandbox en vez de post-batalla estándar de campaña
            showSandboxCombatResult(true);
            return;
        }
        if (originalShowScreen) {
            originalShowScreen(screenId);
        }
    };
}

/* ==========================================================================
   CONSTRUCCIÓN DE ROBOTS Y FORMULARIOS DE EQUIPOS
   ========================================================================== */

const CHARACTER_TEMPLATES = {
    // Iniciadores
    'IGNIS': { name: 'Ignis', group: '🤖 Iniciadores', template: ROBOT_TEMPLATES.IGNIS },
    'AQUA': { name: 'Aqua', group: '🤖 Iniciadores', template: ROBOT_TEMPLATES.AQUA },
    'TERRA': { name: 'Terra', group: '🤖 Iniciadores', template: ROBOT_TEMPLATES.TERRA },
    'ZEPHYR': { name: 'Zephyr', group: '🤖 Iniciadores', template: ROBOT_TEMPLATES.ZEPHYR },
    
    // Élites
    'COLOSO_SISMICO': { name: 'Coloso Sísmico', group: '💀 Élites', template: ELITE_TEMPLATES.COLOSO_SISMICO, isElite: true },
    'BERSERKER_TERMICO': { name: 'Berserker Térmico', group: '💀 Élites', template: ELITE_TEMPLATES.BERSERKER_TERMICO, isElite: true },
    'CYBER_STALKER': { name: 'Cyber-Stalker', group: '💀 Élites', template: ELITE_TEMPLATES.CYBER_STALKER, isElite: true },
    'CRIO_CENTINELA': { name: 'Crio-Centinela', group: '💀 Élites', template: ELITE_TEMPLATES.CRIO_CENTINELA, isElite: true },
    
    // Jefes
    'TITAN_X': {
        name: 'TITAN-X (Jefe)',
        group: '👑 Jefes',
        isBoss: true,
        template: {
            name: 'TITAN-X (Jefe)',
            element: ELEMENTS.NEUTRO,
            emoji: '👹',
            level: 10,
            turnPattern: ['Golpe Titánico', 'Pulso PEM Titánico', 'Protocolo Exterminio'],
            skills: [
                { name: 'Golpe Titánico', cd: 0, currentCd: 0, desc: 'Ataque demoledor neutro (1.4x de daño).', type: 'DAMAGE', power: 1.4 },
                { name: 'Pulso PEM Titánico', cd: 3, currentCd: 1, desc: 'Pulso electromagnético masivo que daña a todo el escuadrón (0.8x) y desactiva todas las Barreras y Escudos aliados.', type: 'DAMAGE_AOE_STATUS', target: 'ALL_ENEMIES', power: 0.8, purgeShields: true },
                { name: 'Protocolo Exterminio', cd: 4, currentCd: 2, desc: 'Ataque masivo devastador concentrado en un objetivo (2.2x de daño).', type: 'DAMAGE', power: 2.2 }
            ]
        }
    },
    
    // Salvajes Genéricos
    'WILD_FUEGO': { name: 'Autómata Ígneo', group: '👾 Salvajes', template: { ...ROBOT_TEMPLATES.IGNIS, name: 'Autómata Ígneo', emoji: '👾' } },
    'WILD_AGUA': { name: 'Autómata Glacial', group: '👾 Salvajes', template: { ...ROBOT_TEMPLATES.AQUA, name: 'Autómata Glacial', emoji: '👾' } },
    'WILD_TIERRA': { name: 'Autómata Pétreo', group: '👾 Salvajes', template: { ...ROBOT_TEMPLATES.TERRA, name: 'Autómata Pétreo', emoji: '👾' } },
    'WILD_AIRE': { name: 'Autómata Aéreo', group: '👾 Salvajes', template: { ...ROBOT_TEMPLATES.ZEPHYR, name: 'Autómata Aéreo', emoji: '👾' } },
    'WILD_NEUTRO': { name: 'Cyber-Drone', group: '👾 Salvajes', template: { name: 'Cyber-Drone', element: ELEMENTS.NEUTRO, emoji: '👾', skills: [{ name: 'Impacto Cinético', cd: 0, currentCd: 0, desc: 'Ataque neutro estándar.', type: 'DAMAGE', power: 1.0 }] } }
};

function createRobotFromConfig(config, isAlly) {
    if (!config.enabled) return null;
    
    const charDef = CHARACTER_TEMPLATES[config.templateKey] || CHARACTER_TEMPLATES.IGNIS;
    const baseTemplate = charDef.template;
    
    let robot = new Robot({
        ...baseTemplate,
        level: parseInt(config.level) || 1,
        isAlly: isAlly,
        isElite: !!charDef.isElite,
        isBoss: !!charDef.isBoss
    });
    
    // Equipar Arma
    if (config.weaponType && config.weaponType !== 'NONE') {
        let wType = WEAPON_TYPES[config.weaponType];
        let wElem = ELEMENTS[config.weaponElement] || robot.element;
        let isPlusOne = !!config.isUpgraded;
        
        let wName = `${config.weaponType.charAt(0) + config.weaponType.slice(1).toLowerCase()} de ${wElem}`;
        if (isPlusOne) wName += ' +1';
        
        let desc = '';
        if (wType === WEAPON_TYPES.DAGA) desc = isPlusOne ? '40% prob. doble ataque (con +1). Cada golpe aplica marca.' : '25% prob. doble ataque. Cada golpe aplica marca.';
        if (wType === WEAPON_TYPES.HACHA) desc = isPlusOne ? 'Perfora 75% barreras. +35% Daño a ≤40% HP (Verdugo).' : 'Perfora 50% barreras. +35% Daño a ≤40% HP (Verdugo).';
        if (wType === WEAPON_TYPES.BACULO) desc = isPlusOne ? 'Regenera 7% HP por ronda. Potenciado por afinidad Agua.' : 'Regenera 5% HP por ronda. Potenciado por afinidad Agua.';
        if (wType === WEAPON_TYPES.ESPADA) desc = isPlusOne ? '+30% Daño base y +20% Crítico. Críticos activan Racha (+10% ATQ).' : '+15% Daño base y +10% Crítico. Críticos activan Racha (+10% ATQ).';
        
        robot.equipWeapon({
            id: Math.random().toString(36).substr(2, 9),
            type: wType,
            element: wElem,
            name: wName,
            desc: desc,
            isUpgraded: isPlusOne
        });
    }
    
    // Mutador de Élite o Mutación Forzada
    if (config.mutatorType && config.mutatorType !== 'NONE') {
        let mut = MUTATORS.find(m => m.type === config.mutatorType);
        if (mut) {
            robot.mutator = mut;
            robot.statuses = robot.statuses.filter(s => !s.type.startsWith('MUTACION_'));
            robot.addStatus({
                type: `MUTACION_${mut.type}`,
                name: `Mutación: ${mut.name}`,
                desc: mut.desc,
                isPermanent: true,
                duration: Infinity
            });
        }
    }
    
    // Chip adicional
    if (config.chipType && config.chipType !== 'NONE') {
        let chipItem = { type: config.chipType };
        installChip(chipItem, robot);
    }
    
    robot.recalculateStats();
    robot.hp = robot.maxHp;
    robot.isOffline = false;
    
    return robot;
}

function renderTeamBuilder(teamType) {
    const container = document.getElementById(`slots-${teamType}`);
    if (!container) return;
    
    const slots = Sandbox.combatConfig[teamType];
    const isAlly = (teamType === 'allies');
    
    container.innerHTML = slots.map((slot, idx) => {
        const previewRobot = createRobotFromConfig(slot, isAlly);
        
        // Agrupar opciones de personajes
        const groups = {};
        Object.keys(CHARACTER_TEMPLATES).forEach(key => {
            const item = CHARACTER_TEMPLATES[key];
            if (!groups[item.group]) groups[item.group] = [];
            groups[item.group].push({ key, name: item.name });
        });
        
        const characterOptionsHtml = Object.keys(groups).map(grp => `
            <optgroup label="${grp}">
                ${groups[grp].map(opt => `<option value="${opt.key}" ${slot.templateKey === opt.key ? 'selected' : ''}>${opt.name}</option>`).join('')}
            </optgroup>
        `).join('');
        
        const weaponTypeOptions = `
            <option value="NONE" ${slot.weaponType === 'NONE' ? 'selected' : ''}>[ Sin Arma ]</option>
            <option value="ESPADA" ${slot.weaponType === 'ESPADA' ? 'selected' : ''}>⚔️ Espada</option>
            <option value="DAGA" ${slot.weaponType === 'DAGA' ? 'selected' : ''}>🗡️ Daga</option>
            <option value="HACHA" ${slot.weaponType === 'HACHA' ? 'selected' : ''}>🪓 Hacha</option>
            <option value="BACULO" ${slot.weaponType === 'BACULO' ? 'selected' : ''}>🪄 Báculo</option>
        `;
        
        const elementOptions = `
            <option value="FUEGO" ${slot.weaponElement === 'FUEGO' ? 'selected' : ''}>🔥 Fuego</option>
            <option value="AGUA" ${slot.weaponElement === 'AGUA' ? 'selected' : ''}>💧 Agua</option>
            <option value="TIERRA" ${slot.weaponElement === 'TIERRA' ? 'selected' : ''}>🪨 Tierra</option>
            <option value="AIRE" ${slot.weaponElement === 'AIRE' ? 'selected' : ''}>💨 Aire</option>
            <option value="NEUTRO" ${slot.weaponElement === 'NEUTRO' ? 'selected' : ''}>⚙️ Neutro</option>
        `;
        
        const chipOptions = `
            <option value="NONE" ${slot.chipType === 'NONE' ? 'selected' : ''}>[ Sin Chip ]</option>
            <option value="CHIP_FUEGO" ${slot.chipType === 'CHIP_FUEGO' ? 'selected' : ''}>💾 Chip Fuego (Lanzallamas)</option>
            <option value="CHIP_AGUA" ${slot.chipType === 'CHIP_AGUA' ? 'selected' : ''}>💾 Chip Agua (Geyser)</option>
            <option value="CHIP_TIERRA" ${slot.chipType === 'CHIP_TIERRA' ? 'selected' : ''}>💾 Chip Tierra (Fisura)</option>
            <option value="CHIP_AIRE" ${slot.chipType === 'CHIP_AIRE' ? 'selected' : ''}>💾 Chip Aire (Tornado)</option>
        `;
        
        const mutatorOptions = `
            <option value="NONE" ${slot.mutatorType === 'NONE' ? 'selected' : ''}>[ Sin Mutación ]</option>
            <option value="ESPINAS" ${slot.mutatorType === 'ESPINAS' ? 'selected' : ''}>🌵 Espinas (15% reflejo)</option>
            <option value="REGENERADOR" ${slot.mutatorType === 'REGENERADOR' ? 'selected' : ''}>💚 Regenerador (5% HP/turno)</option>
            <option value="RABIA" ${slot.mutatorType === 'RABIA' ? 'selected' : ''}>💢 Rabia (+5% ATQ/turno)</option>
        `;

        let statsHtml = '<span style="color:#8395a7; font-size:0.85rem;">Slot desactivado</span>';
        if (previewRobot) {
            const affDesc = (previewRobot.hasAffinity && previewRobot.hasAffinity()) ? previewRobot.getAffinityDescription() : '';
            statsHtml = `
                <span class="stat-chip">❤️ HP: <strong>${previewRobot.maxHp}</strong></span>
                <span class="stat-chip">⚔️ ATQ: <strong>${previewRobot.atk}</strong></span>
                <span class="stat-chip">⚡ VEL: <strong>${previewRobot.spd}</strong></span>
                <span class="stat-chip">💨 ESQ: <strong>${previewRobot.dodge}%</strong></span>
                <span class="stat-chip">🎯 PREC: <strong>${previewRobot.acc}%</strong></span>
                <span class="stat-chip">💥 CRÍT: <strong>${previewRobot.critChance}%</strong></span>
                ${affDesc ? `<span class="stat-chip stat-affinity" title="${affDesc}">🌟 Afinidad Activa</span>` : ''}
            `;
        }

        return `
            <div class="robot-slot-card ${slot.enabled ? '' : 'disabled-slot'} ${isAlly ? 'slot-ally' : 'slot-enemy'}">
                <div class="slot-top-row">
                    <span class="slot-index-badge">
                        ${isAlly ? '🔵 Aliado' : '🔴 Enemigo'} #${idx + 1}
                    </span>
                    <label class="slot-toggle-label">
                        <input type="checkbox" ${slot.enabled ? 'checked' : ''} onchange="updateSlotField('${teamType}', ${idx}, 'enabled', this.checked)">
                        ${slot.enabled ? 'Activo en combate' : 'Desactivado'}
                    </label>
                </div>
                
                <div class="slot-form-grid" style="${slot.enabled ? '' : 'opacity: 0.4; pointer-events: none;'}">
                    <div class="form-group">
                        <label>Arquetipo / Personaje</label>
                        <select class="form-control" onchange="updateSlotField('${teamType}', ${idx}, 'templateKey', this.value)">
                            ${characterOptionsHtml}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Nivel de Unidad (1 - 20)</label>
                        <div class="level-input-row">
                            <input type="range" class="level-slider" min="1" max="20" value="${slot.level}" oninput="updateSlotField('${teamType}', ${idx}, 'level', this.value)">
                            <span class="level-number-badge">${slot.level}</span>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Arma Equipada</label>
                        <select class="form-control" onchange="updateSlotField('${teamType}', ${idx}, 'weaponType', this.value)">
                            ${weaponTypeOptions}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Elemento del Arma</label>
                        <select class="form-control" onchange="updateSlotField('${teamType}', ${idx}, 'weaponElement', this.value)" ${slot.weaponType === 'NONE' ? 'disabled' : ''}>
                            ${elementOptions}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Mejora de Arma (+1)</label>
                        <label class="option-checkbox-label" style="margin-top: 6px;">
                            <input type="checkbox" ${slot.isUpgraded ? 'checked' : ''} onchange="updateSlotField('${teamType}', ${idx}, 'isUpgraded', this.checked)" ${slot.weaponType === 'NONE' ? 'disabled' : ''}>
                            Arma Mejorada (+1)
                        </label>
                    </div>
                    
                    <div class="form-group">
                        <label>Chip de Habilidad</label>
                        <select class="form-control" onchange="updateSlotField('${teamType}', ${idx}, 'chipType', this.value)">
                            ${chipOptions}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Mutación de Élite</label>
                        <select class="form-control" onchange="updateSlotField('${teamType}', ${idx}, 'mutatorType', this.value)">
                            ${mutatorOptions}
                        </select>
                    </div>
                </div>
                
                <div class="slot-stats-preview">
                    ${statsHtml}
                </div>
            </div>
        `;
    }).join('');
}

function updateSlotField(teamType, slotIndex, field, value) {
    Sandbox.combatConfig[teamType][slotIndex][field] = value;
    renderTeamBuilder(teamType);
}

/* ==========================================================================
   PRESETS RÁPIDOS DE COMBATE
   ========================================================================== */

function applyCombatPreset(presetKey) {
    if (presetKey === '1V1') {
        Sandbox.combatConfig.allies = [
            { enabled: true, templateKey: 'IGNIS', level: 1, weaponType: 'ESPADA', weaponElement: 'FUEGO', isUpgraded: false, chipType: 'NONE', mutatorType: 'NONE' },
            { enabled: false, templateKey: 'AQUA', level: 1, weaponType: 'NONE', weaponElement: 'AGUA', isUpgraded: false, chipType: 'NONE', mutatorType: 'NONE' },
            { enabled: false, templateKey: 'TERRA', level: 1, weaponType: 'NONE', weaponElement: 'TIERRA', isUpgraded: false, chipType: 'NONE', mutatorType: 'NONE' }
        ];
        Sandbox.combatConfig.enemies = [
            { enabled: true, templateKey: 'WILD_FUEGO', level: 1, weaponType: 'DAGA', weaponElement: 'FUEGO', isUpgraded: false, chipType: 'NONE', mutatorType: 'NONE' },
            { enabled: false, templateKey: 'WILD_AGUA', level: 1, weaponType: 'NONE', weaponElement: 'AGUA', isUpgraded: false, chipType: 'NONE', mutatorType: 'NONE' },
            { enabled: false, templateKey: 'WILD_TIERRA', level: 1, weaponType: 'NONE', weaponElement: 'TIERRA', isUpgraded: false, chipType: 'NONE', mutatorType: 'NONE' }
        ];
        Sandbox.combatConfig.options.arenaBg = 'bg-normal';
    } else if (presetKey === '3V3_STARTERS') {
        Sandbox.combatConfig.allies = [
            { enabled: true, templateKey: 'IGNIS', level: 3, weaponType: 'ESPADA', weaponElement: 'FUEGO', isUpgraded: false, chipType: 'NONE', mutatorType: 'NONE' },
            { enabled: true, templateKey: 'AQUA', level: 3, weaponType: 'BACULO', weaponElement: 'AGUA', isUpgraded: false, chipType: 'NONE', mutatorType: 'NONE' },
            { enabled: true, templateKey: 'TERRA', level: 3, weaponType: 'HACHA', weaponElement: 'TIERRA', isUpgraded: false, chipType: 'NONE', mutatorType: 'NONE' }
        ];
        Sandbox.combatConfig.enemies = [
            { enabled: true, templateKey: 'WILD_FUEGO', level: 3, weaponType: 'DAGA', weaponElement: 'FUEGO', isUpgraded: false, chipType: 'NONE', mutatorType: 'NONE' },
            { enabled: true, templateKey: 'WILD_AGUA', level: 3, weaponType: 'BACULO', weaponElement: 'AGUA', isUpgraded: false, chipType: 'NONE', mutatorType: 'NONE' },
            { enabled: true, templateKey: 'WILD_TIERRA', level: 3, weaponType: 'HACHA', weaponElement: 'TIERRA', isUpgraded: false, chipType: 'NONE', mutatorType: 'NONE' }
        ];
        Sandbox.combatConfig.options.arenaBg = 'bg-normal';
    } else if (presetKey === 'VS_BOSS') {
        Sandbox.combatConfig.allies = [
            { enabled: true, templateKey: 'IGNIS', level: 7, weaponType: 'ESPADA', weaponElement: 'FUEGO', isUpgraded: true, chipType: 'CHIP_FUEGO', mutatorType: 'NONE' },
            { enabled: true, templateKey: 'AQUA', level: 7, weaponType: 'BACULO', weaponElement: 'AGUA', isUpgraded: true, chipType: 'CHIP_AGUA', mutatorType: 'NONE' },
            { enabled: true, templateKey: 'TERRA', level: 7, weaponType: 'HACHA', weaponElement: 'TIERRA', isUpgraded: true, chipType: 'CHIP_TIERRA', mutatorType: 'NONE' }
        ];
        Sandbox.combatConfig.enemies = [
            { enabled: true, templateKey: 'TITAN_X', level: 10, weaponType: 'NONE', weaponElement: 'NEUTRO', isUpgraded: false, chipType: 'NONE', mutatorType: 'NONE' },
            { enabled: false, templateKey: 'WILD_AGUA', level: 1, weaponType: 'NONE', weaponElement: 'AGUA', isUpgraded: false, chipType: 'NONE', mutatorType: 'NONE' },
            { enabled: false, templateKey: 'WILD_TIERRA', level: 1, weaponType: 'NONE', weaponElement: 'TIERRA', isUpgraded: false, chipType: 'NONE', mutatorType: 'NONE' }
        ];
        Sandbox.combatConfig.options.arenaBg = 'bg-boss';
    } else if (presetKey === 'VS_3_ELITES') {
        Sandbox.combatConfig.allies = [
            { enabled: true, templateKey: 'IGNIS', level: 8, weaponType: 'ESPADA', weaponElement: 'FUEGO', isUpgraded: true, chipType: 'CHIP_FUEGO', mutatorType: 'NONE' },
            { enabled: true, templateKey: 'AQUA', level: 8, weaponType: 'BACULO', weaponElement: 'AGUA', isUpgraded: true, chipType: 'CHIP_AGUA', mutatorType: 'NONE' },
            { enabled: true, templateKey: 'ZEPHYR', level: 8, weaponType: 'DAGA', weaponElement: 'AIRE', isUpgraded: true, chipType: 'CHIP_AIRE', mutatorType: 'NONE' }
        ];
        Sandbox.combatConfig.enemies = [
            { enabled: true, templateKey: 'COLOSO_SISMICO', level: 8, weaponType: 'NONE', weaponElement: 'TIERRA', isUpgraded: false, chipType: 'NONE', mutatorType: 'ESPINAS' },
            { enabled: true, templateKey: 'BERSERKER_TERMICO', level: 8, weaponType: 'NONE', weaponElement: 'FUEGO', isUpgraded: false, chipType: 'NONE', mutatorType: 'RABIA' },
            { enabled: true, templateKey: 'CYBER_STALKER', level: 8, weaponType: 'NONE', weaponElement: 'AIRE', isUpgraded: false, chipType: 'NONE', mutatorType: 'REGENERADOR' }
        ];
        Sandbox.combatConfig.options.arenaBg = 'bg-elite';
    } else if (presetKey === 'BOSS_DUEL') {
        Sandbox.combatConfig.allies = [
            { enabled: true, templateKey: 'TITAN_X', level: 10, weaponType: 'ESPADA', weaponElement: 'NEUTRO', isUpgraded: true, chipType: 'NONE', mutatorType: 'NONE' },
            { enabled: false, templateKey: 'AQUA', level: 1, weaponType: 'NONE', weaponElement: 'AGUA', isUpgraded: false, chipType: 'NONE', mutatorType: 'NONE' },
            { enabled: false, templateKey: 'TERRA', level: 1, weaponType: 'NONE', weaponElement: 'TIERRA', isUpgraded: false, chipType: 'NONE', mutatorType: 'NONE' }
        ];
        Sandbox.combatConfig.enemies = [
            { enabled: true, templateKey: 'TITAN_X', level: 10, weaponType: 'HACHA', weaponElement: 'NEUTRO', isUpgraded: true, chipType: 'NONE', mutatorType: 'RABIA' },
            { enabled: false, templateKey: 'WILD_AGUA', level: 1, weaponType: 'NONE', weaponElement: 'AGUA', isUpgraded: false, chipType: 'NONE', mutatorType: 'NONE' },
            { enabled: false, templateKey: 'WILD_TIERRA', level: 1, weaponType: 'NONE', weaponElement: 'TIERRA', isUpgraded: false, chipType: 'NONE', mutatorType: 'NONE' }
        ];
        Sandbox.combatConfig.options.arenaBg = 'bg-boss';
    } else if (presetKey === 'MIRROR') {
        Sandbox.combatConfig.enemies = JSON.parse(JSON.stringify(Sandbox.combatConfig.allies));
    }
    
    renderTeamBuilder('allies');
    renderTeamBuilder('enemies');
}

/* ==========================================================================
   EJECUCIÓN DEL COMBATE EN VIVO EN EL SANDBOX
   ========================================================================== */

function launchSandboxCombat() {
    const allies = Sandbox.combatConfig.allies.map(c => createRobotFromConfig(c, true)).filter(r => r !== null);
    const enemies = Sandbox.combatConfig.enemies.map(c => createRobotFromConfig(c, false)).filter(r => r !== null);
    
    if (allies.length === 0) {
        alert('⚠️ Debes activar al menos 1 robot en el Escuadrón Aliado.');
        return;
    }
    if (enemies.length === 0) {
        alert('⚠️ Debes activar al menos 1 robot en el Escuadrón Enemigo.');
        return;
    }
    
    // Guardar copia para reintentar
    Sandbox.activeCombatSetup = {
        alliesConfig: JSON.parse(JSON.stringify(Sandbox.combatConfig.allies)),
        enemiesConfig: JSON.parse(JSON.stringify(Sandbox.combatConfig.enemies)),
        options: JSON.parse(JSON.stringify(Sandbox.combatConfig.options))
    };
    
    // Configurar GAME_STATE
    GAME_STATE.team = allies;
    GAME_STATE.floor = Math.max(...allies.map(a => a.level), ...enemies.map(e => e.level));
    GAME_STATE.scrap = Sandbox.combatConfig.options.startingScrap || 100;
    GAME_STATE.inventory = {
        weapons: [],
        items: []
    };
    
    if (Sandbox.combatConfig.options.hasPem) {
        GAME_STATE.inventory.items.push({ type: ITEM_TYPES.PEM, ...ITEM_DEFS[ITEM_TYPES.PEM] });
    }
    if (Sandbox.combatConfig.options.hasNanobots) {
        GAME_STATE.inventory.items.push({ type: ITEM_TYPES.NANOBOTS, ...ITEM_DEFS[ITEM_TYPES.NANOBOTS] });
    }
    if (Sandbox.combatConfig.options.hasSobrecarga) {
        GAME_STATE.inventory.items.push({ type: ITEM_TYPES.SOBRECARGA, ...ITEM_DEFS[ITEM_TYPES.SOBRECARGA] });
    }
    
    // Asignar enemigos a combatState
    combatState.enemies = enemies;
    combatState.fullLog = [];
    combatState.isProcessing = false;
    combatState.isGameOver = false;
    combatState.selectingTarget = null;
    combatState.round = 1;
    
    // Arena Background
    const arenaBg = document.getElementById('combat-arena-bg');
    if (arenaBg) {
        arenaBg.className = `combat-arena ${Sandbox.combatConfig.options.arenaBg}`;
    }
    
    // Cambiar vista a la arena de combate
    document.getElementById('combat-editor-container').style.display = 'none';
    document.getElementById('combat-live-container').style.display = 'flex';
    
    // Limpiar estados de inicio
    GAME_STATE.team.forEach(r => {
        r.statuses = r.statuses.filter(s => s.isPermanent);
        if (r.skills) r.skills.forEach(s => s.currentCd = 0);
    });
    
    buildInitiativeQueue();
    renderPartyCombatUI();
    logCombat('🚀 [SANDBOX] ¡Incursión de combate iniciada con parámetros personalizados!');
    advanceTurnQueue();
}

function exitCombatToEditor() {
    combatState.isGameOver = true;
    document.getElementById('combat-live-container').style.display = 'none';
    document.getElementById('combat-editor-container').style.display = 'flex';
    closeSandboxResultModal();
    renderTeamBuilder('allies');
    renderTeamBuilder('enemies');
}

function restartSameCombat() {
    closeSandboxResultModal();
    if (Sandbox.activeCombatSetup) {
        Sandbox.combatConfig.allies = JSON.parse(JSON.stringify(Sandbox.activeCombatSetup.alliesConfig));
        Sandbox.combatConfig.enemies = JSON.parse(JSON.stringify(Sandbox.activeCombatSetup.enemiesConfig));
        Sandbox.combatConfig.options = JSON.parse(JSON.stringify(Sandbox.activeCombatSetup.options));
    }
    launchSandboxCombat();
}

function setCombatSpeed(multiplier) {
    combatSpeedMultiplier = multiplier;
    document.querySelectorAll('.btn-speed').forEach(btn => btn.classList.remove('active'));
    const btn = document.getElementById(`btn-speed-${multiplier}x`);
    if (btn) btn.classList.add('active');
}

function showSandboxCombatResult(isVictory) {
    const modal = document.getElementById('sandbox-result-modal');
    if (!modal) return;
    
    const titleEl = document.getElementById('sandbox-result-title');
    const badgeEl = document.getElementById('sandbox-result-badge');
    const roundsEl = document.getElementById('sandbox-stat-rounds');
    const alliesAliveEl = document.getElementById('sandbox-stat-allies-alive');
    const enemiesAliveEl = document.getElementById('sandbox-stat-enemies-alive');
    
    const aliveAllies = (GAME_STATE.team || []).filter(r => !r.isOffline && r.hp > 0).length;
    const aliveEnemies = (combatState.enemies || []).filter(e => !e.isOffline && e.hp > 0).length;
    
    if (isVictory) {
        titleEl.innerText = '¡VICTORIA ALIADA!';
        titleEl.className = 'result-title victory';
        badgeEl.innerText = '🏆 TELEMETRÍA: OBJETIVOS NEUTRALIZADOS';
    } else {
        titleEl.innerText = '¡VICTORIA ENEMIGA / DERROTA!';
        titleEl.className = 'result-title defeat';
        badgeEl.innerText = '💀 TELEMETRÍA: ESCUADRÓN ALIADO CAÍDO';
    }
    
    if (roundsEl) roundsEl.innerText = `${combatState.round || 1} Rondas`;
    if (alliesAliveEl) alliesAliveEl.innerText = `${aliveAllies} / ${(GAME_STATE.team || []).length}`;
    if (enemiesAliveEl) enemiesAliveEl.innerText = `${aliveEnemies} / ${(combatState.enemies || []).length}`;
    
    modal.style.display = 'flex';
}

function closeSandboxResultModal() {
    const modal = document.getElementById('sandbox-result-modal');
    if (modal) modal.style.display = 'none';
}

/* ==========================================================================
   PROBADOR DE EVENTOS ALEATORIOS Y NODOS ESPECIALES
   ========================================================================== */

const SPECIAL_NODES = [
    {
        title: "🎁 Nodo: Tesoro / Cofre",
        isSpecial: true,
        type: NODE_TYPES.CHEST,
        desc: "Abre una cápsula sellada con armamento mejorado (+1) o chips de habilidad aleatorios.",
        choices: [
            { label: "Abrir Cofre Especial", action: () => { initChestEvent(); return "Abriendo cofre especial..."; } }
        ]
    },
    {
        title: "⛺ Nodo: Taller de Reparación",
        isSpecial: true,
        type: NODE_TYPES.REPAIR_SHOP,
        desc: "Zona segura de mantenimiento. Permite reparar el 50% de HP o mejorar un arma a +1.",
        choices: [
            { label: "Entrar al Taller de Reparación", action: () => { initCampEvent(); return "Iniciando protocolo de taller..."; } }
        ]
    },
    {
        title: "🛒 Nodo: Mercado / Tienda",
        isSpecial: true,
        type: NODE_TYPES.SHOP,
        desc: "Puesto comercial automatizado. Vende armas, chips de técnicas y consumibles por chatarra.",
        choices: [
            { label: "Acceder al Mercado Cibernético", action: () => { initShopEvent(); return "Conectando al inventario de la tienda..."; } }
        ]
    }
];

function getAllEventsList() {
    let list = [];
    
    if (Sandbox.eventsState.selectedCategory === 'ALL' || Sandbox.eventsState.selectedCategory === 'MYSTERY') {
        MYSTERY_EVENTS.forEach((ev, idx) => {
            list.push({
                ...ev,
                eventIndex: idx,
                category: 'MYSTERY',
                badge: '❓ Misterio'
            });
        });
    }
    
    if (Sandbox.eventsState.selectedCategory === 'ALL' || Sandbox.eventsState.selectedCategory === 'SPECIAL') {
        SPECIAL_NODES.forEach((ev, idx) => {
            list.push({
                ...ev,
                eventIndex: idx,
                category: 'SPECIAL',
                badge: '⭐ Nodo Especial'
            });
        });
    }
    
    if (Sandbox.eventsState.filterQuery.trim() !== '') {
        const q = Sandbox.eventsState.filterQuery.toLowerCase();
        list = list.filter(e => e.title.toLowerCase().includes(q) || (e.desc && e.desc.toLowerCase().includes(q)));
    }
    
    return list;
}

function initEventsTester() {
    renderEventsCatalog();
    renderEventStage();
}

function renderEventsCatalog() {
    const listContainer = document.getElementById('events-catalog-list');
    if (!listContainer) return;
    
    const events = getAllEventsList();
    
    if (events.length === 0) {
        listContainer.innerHTML = '<div style="color:#8395a7; text-align:center; padding:20px;">No se encontraron eventos coincidentes.</div>';
        return;
    }
    
    listContainer.innerHTML = events.map((ev, idx) => {
        const isSelected = (idx === Sandbox.eventsState.selectedEventIndex);
        return `
            <div class="event-catalog-item ${isSelected ? 'selected' : ''}" onclick="selectSandboxEvent(${idx})">
                <div class="event-item-top">
                    <span class="event-item-name">${ev.title}</span>
                    <span class="event-item-badge">${ev.badge}</span>
                </div>
                <div class="event-item-desc-snippet">${ev.desc || ''}</div>
            </div>
        `;
    }).join('');
}

function selectSandboxEvent(index) {
    Sandbox.eventsState.selectedEventIndex = index;
    renderEventsCatalog();
    renderEventStage();
}

function filterEventsCatalog(query) {
    Sandbox.eventsState.filterQuery = query;
    Sandbox.eventsState.selectedEventIndex = 0;
    renderEventsCatalog();
    renderEventStage();
}

function setEventsCategory(cat) {
    Sandbox.eventsState.selectedCategory = cat;
    Sandbox.eventsState.selectedEventIndex = 0;
    
    document.querySelectorAll('.btn-cat-filter').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(`btn-cat-${cat.toLowerCase()}`);
    if (btn) btn.classList.add('active');
    
    renderEventsCatalog();
    renderEventStage();
}

function syncSandboxGameStateTeam() {
    // Generar equipo de 3 robots activos para probar eventos
    if (!GAME_STATE.team || GAME_STATE.team.length === 0) {
        GAME_STATE.team = [
            new Robot({ ...ROBOT_TEMPLATES.IGNIS, level: 3, isAlly: true }),
            new Robot({ ...ROBOT_TEMPLATES.AQUA, level: 3, isAlly: true }),
            new Robot({ ...ROBOT_TEMPLATES.TERRA, level: 3, isAlly: true })
        ];
    }
    
    GAME_STATE.scrap = Sandbox.eventsState.sandboxScrap;
    GAME_STATE.floor = 3;
    if (!GAME_STATE.inventory) {
        GAME_STATE.inventory = { weapons: [], items: [] };
    }
    
    // Aplicar porcentaje de HP
    const hpRatio = Sandbox.eventsState.sandboxHpPct / 100;
    GAME_STATE.team.forEach(r => {
        r.hp = Math.max(1, Math.floor(r.maxHp * hpRatio));
        r.isOffline = (r.hp <= 0);
    });
    
    // Sincronizar activeRobotIndex para combatState si es necesario
    if (typeof combatState !== 'undefined') {
        combatState.activeRobotIndex = Sandbox.eventsState.activeRobotIndex;
    }
}

function adjustSandboxScrap(delta) {
    Sandbox.eventsState.sandboxScrap = Math.max(0, Sandbox.eventsState.sandboxScrap + delta);
    updateSandboxStateControllerUI();
    syncSandboxGameStateTeam();
    renderEventStage();
}

function setSandboxHpPct(pct) {
    Sandbox.eventsState.sandboxHpPct = pct;
    updateSandboxStateControllerUI();
    syncSandboxGameStateTeam();
    renderEventStage();
}

function updateSandboxStateControllerUI() {
    const scrapInput = document.getElementById('sandbox-scrap-input');
    if (scrapInput) scrapInput.value = Sandbox.eventsState.sandboxScrap;
}

function renderEventStage() {
    const stageContainer = document.getElementById('event-sandbox-stage');
    if (!stageContainer) return;
    
    const events = getAllEventsList();
    const currentEvent = events[Sandbox.eventsState.selectedEventIndex];
    
    if (!currentEvent) {
        stageContainer.innerHTML = '<div style="color:#8395a7; text-align:center;">Selecciona un evento del catálogo izquierdo.</div>';
        return;
    }
    
    syncSandboxGameStateTeam();
    
    // Si es un nodo especial del juego (Cofre, Taller, Tienda)
    if (currentEvent.isSpecial) {
        stageContainer.innerHTML = `
            <div class="event-panel-container">
                <div class="event-header-panel">
                    <div class="event-header-badge">${currentEvent.badge.toUpperCase()} // SIMULADOR DE NODO</div>
                    <h1 class="event-main-title">${currentEvent.title}</h1>
                    <p style="color:#c5c6c7; margin-top:8px;">${currentEvent.desc}</p>
                </div>
                <div id="event-actions" class="actions-container" style="margin-top: 20px;">
                    <button class="btn-mystery-choice can-choose" onclick="startSpecialNodeSimulation('${currentEvent.type}')">
                        <div class="choice-content">
                            <span class="choice-icon">⚡</span>
                            <span class="choice-label">Ejecutar Interfaz Completa de ${currentEvent.title}</span>
                        </div>
                        <span class="choice-arrow">➔</span>
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    // Si es un evento de misterio con opciones
    const choicesHtml = currentEvent.choices.map((choice, cIdx) => {
        const canExecute = !choice.condition || choice.condition();
        return `
            <button class="btn-mystery-choice ${canExecute ? 'can-choose' : 'cannot-choose'}" 
                    ${canExecute ? `onclick="executeSandboxMysteryChoice(${cIdx})"` : 'disabled'}>
                <div class="choice-content">
                    <span class="choice-icon">${canExecute ? '⚡' : '🔒'}</span>
                    <span class="choice-label">${choice.label}</span>
                </div>
                ${!canExecute ? '<span class="choice-locked-tag">Requisito no cumplido (Verifica Chatarra)</span>' : '<span class="choice-arrow">➔</span>'}
            </button>
        `;
    }).join('');
    
    currentMysteryEvent = currentEvent;
    
    stageContainer.innerHTML = `
        <div class="event-panel-container">
            <div class="event-header-panel">
                <div class="event-header-badge">❓ ANOMALÍA DETECTADA // REGISTRO SECTORIAL</div>
                <h1 class="event-main-title">${currentEvent.title}</h1>
            </div>
            
            <div class="mystery-terminal-card">
                <div class="mystery-terminal-header">
                    <span class="terminal-dot green"></span>
                    <span class="terminal-dot yellow"></span>
                    <span class="terminal-dot red"></span>
                    <span class="terminal-title">ENLACE SENSORIAL SECTORIAL // EVENTO ACTIVO</span>
                </div>
                <div class="mystery-terminal-body">
                    <div class="mystery-narrative-text">
                        "${currentEvent.desc}"
                    </div>
                </div>
            </div>
            
            <div class="mystery-choices-grid" style="margin-top: 18px;">
                ${choicesHtml}
            </div>
            
            <div class="event-tech-inspector">
                <div class="tech-inspector-title">⚙️ Telemetría del Evento:</div>
                <div>Opciones Disponibles: <strong>${currentEvent.choices.length}</strong> | Chatarra requerida: <strong>${extractRequirementsText(currentEvent)}</strong></div>
            </div>
        </div>
    `;
}

function extractRequirementsText(event) {
    let reqs = [];
    event.choices.forEach(c => {
        if (c.condition) {
            let str = c.condition.toString();
            if (str.includes('scrap')) reqs.push(c.label);
        }
    });
    return reqs.length > 0 ? reqs.join(', ') : 'Ninguno';
}

function executeSandboxMysteryChoice(choiceIndex) {
    if (!currentMysteryEvent) return;
    const choice = currentMysteryEvent.choices[choiceIndex];
    if (!choice) return;
    
    let resultMsg = choice.action();
    
    // Reflejar cambios en la UI de estado
    Sandbox.eventsState.sandboxScrap = GAME_STATE.scrap;
    updateSandboxStateControllerUI();
    
    const stageContainer = document.getElementById('event-sandbox-stage');
    if (!stageContainer) return;
    
    stageContainer.innerHTML = `
        <div class="event-panel-container">
            <div class="event-header-panel">
                <div class="event-header-badge">✅ RESOLUCIÓN DE EVENTO // INFORME DE TELEMETRÍA</div>
                <h1 class="event-main-title">${currentMysteryEvent.title}</h1>
            </div>
            
            <div class="mystery-terminal-card" style="border-color: #66fcf1; box-shadow: 0 0 20px rgba(102, 252, 241, 0.2);">
                <div class="mystery-terminal-body">
                    <div class="mystery-narrative-text" style="color: #66fcf1; font-size: 1.15rem;">
                        ${resultMsg}
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 20px; display: flex; gap: 12px; justify-content: center;">
                <button class="btn-preset" style="padding: 10px 20px; font-size: 1rem;" onclick="renderEventStage()">
                    🔄 Reintentar Este Evento
                </button>
                <button class="btn-preset" style="padding: 10px 20px; font-size: 1rem; border-color: var(--accent-color); color: #fff;" onclick="pickRandomMysteryEvent()">
                    🎲 Elegir Evento Aleatorio
                </button>
            </div>
        </div>
    `;
}

function pickRandomMysteryEvent() {
    const events = getAllEventsList();
    Sandbox.eventsState.selectedEventIndex = Math.floor(Math.random() * events.length);
    renderEventsCatalog();
    renderEventStage();
}

function startSpecialNodeSimulation(nodeType) {
    const stageContainer = document.getElementById('event-sandbox-stage');
    if (!stageContainer) return;
    
    // Asignar contenedor de acciones
    stageContainer.innerHTML = `
        <div id="screen-event" class="screen active" style="display: block; min-height: 400px;">
            <div id="event-actions" class="actions-container"></div>
            <div id="team-status-event" class="team-status" style="margin-top: 20px;"></div>
        </div>
        <div style="text-align: center; margin-top: 20px;">
            <button class="btn-preset" onclick="renderEventStage()">🔙 Volver a la Selección de Eventos</button>
        </div>
    `;
    
    // Interceptar advanceFloor en simulación de nodo
    window.advanceFloor = function() {
        alert('🎉 Simulación del nodo finalizada con éxito.');
        renderEventStage();
    };
    
    startEvent(nodeType);
}

/* ==========================================================================
   BALANCEADOR DE STATS EN TIEMPO REAL
   ========================================================================== */

function renderBalanceEditor() {
    const container = document.getElementById('balance-editor-content');
    if (!container) return;

    const data = BalanceManager.current;

    // 1. Elementos Base
    const elementCardsHtml = Object.keys(data.elementBaseStats).map(elem => {
        const stats = data.elementBaseStats[elem];
        const emoji = ELEMENT_EMOJIS[elem] || '⚙️';
        return `
            <div class="balance-elem-card card-${elem}">
                <div class="balance-elem-header">
                    <span>${emoji}</span>
                    <span>${elem}</span>
                </div>
                <div class="balance-stats-inputs-grid">
                    <div class="stat-input-group">
                        <label>❤️ HP Base</label>
                        <input type="number" class="stat-num-input" value="${stats.maxHp}" min="1" max="9999" onchange="updateElementStat('${elem}', 'maxHp', this.value)">
                    </div>
                    <div class="stat-input-group">
                        <label>⚔️ ATQ Base</label>
                        <input type="number" class="stat-num-input" value="${stats.atk}" min="1" max="999" onchange="updateElementStat('${elem}', 'atk', this.value)">
                    </div>
                    <div class="stat-input-group">
                        <label>⚡ VEL Base</label>
                        <input type="number" class="stat-num-input" value="${stats.spd}" min="1" max="100" onchange="updateElementStat('${elem}', 'spd', this.value)">
                    </div>
                    <div class="stat-input-group">
                        <label>💨 Esquiva %</label>
                        <input type="number" class="stat-num-input" value="${stats.dodge}" min="0" max="100" onchange="updateElementStat('${elem}', 'dodge', this.value)">
                    </div>
                    <div class="stat-input-group">
                        <label>🎯 Precisión %</label>
                        <input type="number" class="stat-num-input" value="${stats.acc}" min="0" max="100" onchange="updateElementStat('${elem}', 'acc', this.value)">
                    </div>
                    <div class="stat-input-group">
                        <label>💥 Crítico %</label>
                        <input type="number" class="stat-num-input" value="${stats.critChance || 5}" min="0" max="100" onchange="updateElementStat('${elem}', 'critChance', this.value)">
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // 2. Élites y Jefes
    const elitesHtml = Object.keys(data.eliteOverrides).map(key => {
        const stats = data.eliteOverrides[key];
        const template = ELITE_TEMPLATES[key] || { name: key, emoji: '💀' };
        return `
            <div class="balance-elem-card" style="border-top: 4px solid #ff6b6b;">
                <div class="balance-elem-header">
                    <span>${template.emoji}</span>
                    <span>${template.name}</span>
                </div>
                <div class="balance-stats-inputs-grid">
                    <div class="stat-input-group">
                        <label>❤️ HP Base</label>
                        <input type="number" class="stat-num-input" value="${stats.maxHp || 100}" min="1" max="9999" onchange="updateEliteStat('${key}', 'maxHp', this.value)">
                    </div>
                    <div class="stat-input-group">
                        <label>⚔️ ATQ Base</label>
                        <input type="number" class="stat-num-input" value="${stats.atk || 25}" min="1" max="999" onchange="updateEliteStat('${key}', 'atk', this.value)">
                    </div>

                    <div class="stat-input-group">
                        <label>⚡ VEL</label>
                        <input type="number" class="stat-num-input" value="${stats.spd}" min="1" max="100" onchange="updateEliteStat('${key}', 'spd', this.value)">
                    </div>
                    <div class="stat-input-group">
                        <label>💨 Esquiva %</label>
                        <input type="number" class="stat-num-input" value="${stats.dodge}" min="0" max="100" onchange="updateEliteStat('${key}', 'dodge', this.value)">
                    </div>
                    <div class="stat-input-group">
                        <label>🎯 Precisión %</label>
                        <input type="number" class="stat-num-input" value="${stats.acc}" min="0" max="100" onchange="updateEliteStat('${key}', 'acc', this.value)">
                    </div>
                    <div class="stat-input-group">
                        <label>💥 Crítico %</label>
                        <input type="number" class="stat-num-input" value="${stats.critChance}" min="0" max="100" onchange="updateEliteStat('${key}', 'critChance', this.value)">
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // 3. Jefe TITAN-X
    const boss = data.bossStats;
    const bossHtml = `
        <div class="balance-elem-card" style="border-top: 4px solid #feca57;">
            <div class="balance-elem-header">
                <span>👹</span>
                <span>TITAN-X (Jefe Final)</span>
            </div>
            <div class="balance-stats-inputs-grid">
                <div class="stat-input-group">
                    <label>❤️ HP Base</label>
                    <input type="number" class="stat-num-input" value="${boss.maxHp}" min="1" max="9999" onchange="updateBossStat('maxHp', this.value)">
                </div>
                <div class="stat-input-group">
                    <label>⚔️ ATQ Base</label>
                    <input type="number" class="stat-num-input" value="${boss.atk}" min="1" max="999" onchange="updateBossStat('atk', this.value)">
                </div>
                <div class="stat-input-group">
                    <label>⚡ VEL Base</label>
                    <input type="number" class="stat-num-input" value="${boss.spd}" min="1" max="100" onchange="updateBossStat('spd', this.value)">
                </div>
                <div class="stat-input-group">
                    <label>💨 Esquiva %</label>
                    <input type="number" class="stat-num-input" value="${boss.dodge}" min="0" max="100" onchange="updateBossStat('dodge', this.value)">
                </div>
                <div class="stat-input-group">
                    <label>🎯 Precisión %</label>
                    <input type="number" class="stat-num-input" value="${boss.acc}" min="0" max="100" onchange="updateBossStat('acc', this.value)">
                </div>
                <div class="stat-input-group">
                    <label>💥 Crítico %</label>
                    <input type="number" class="stat-num-input" value="${boss.critChance}" min="0" max="100" onchange="updateBossStat('critChance', this.value)">
                </div>
            </div>
        </div>
    `;

    container.innerHTML = `
        <div class="balance-sections-container">
            <!-- 1. Elementos Base -->
            <div class="balance-section-card">
                <div class="balance-section-header">
                    <h3 class="balance-section-title">
                        <span>🔥</span> ESTADÍSTICAS BASE POR ELEMENTO (INICIADORES Y SALVAJES)
                    </h3>
                    <span style="font-size:0.85rem; color:#8395a7;">Escalan +5% por nivel en combate</span>
                </div>
                <div class="balance-elements-grid">
                    ${elementCardsHtml}
                </div>
            </div>

            <!-- 2. Élites y Jefes -->
            <div class="balance-section-card">
                <div class="balance-section-header">
                    <h3 class="balance-section-title">
                        <span>💀</span> CONFIGURACIÓN DE ÉLITES Y JEFE SUPREMO
                    </h3>
                    <span style="font-size:0.85rem; color:#8395a7;">Overrides específicos de estadísticas</span>
                </div>
                <div class="balance-elements-grid">
                    ${elitesHtml}
                    ${bossHtml}
                </div>
            </div>
        </div>
    `;
}

function updateElementStat(element, stat, value) {
    const num = parseFloat(value) || 0;
    BalanceManager.current.elementBaseStats[element][stat] = num;
    BalanceManager.saveToStorage();
}

function updateEliteStat(eliteKey, stat, value) {
    const num = parseFloat(value) || 0;
    BalanceManager.current.eliteOverrides[eliteKey][stat] = num;
    BalanceManager.saveToStorage();
}

function updateBossStat(stat, value) {
    const num = parseFloat(value) || 0;
    BalanceManager.current.bossStats[stat] = num;
    BalanceManager.saveToStorage();
}

async function handleSaveToDisk() {
    const res = await BalanceManager.saveDirectlyToDisk();
    if (res.success) {
        alert(res.message);
    } else if (res.method !== 'CANCELLED') {
        alert('⚠️ ' + res.message);
    }
}

function handleSaveToMemory() {
    BalanceManager.saveToStorage();
    alert('✅ ¡Estadísticas guardadas y aplicadas de inmediato a todos los personajes!');
}

function handleResetDefaults() {
    if (confirm('¿Deseas restablecer todas las estadísticas a sus valores oficiales originales?')) {
        BalanceManager.resetDefaults();
        renderBalanceEditor();
        renderTeamBuilder('allies');
        renderTeamBuilder('enemies');
        alert('🔄 Se han restablecido los valores por defecto.');
    }
}

function testBalanceInCombat() {
    BalanceManager.saveToStorage();
    switchSandboxTab('combat');
}

function openCodeModal() {
    const modal = document.getElementById('code-modal');
    const textarea = document.getElementById('code-modal-content');
    if (modal && textarea) {
        textarea.value = BalanceManager.generateConstantsCode();
        modal.style.display = 'flex';
    }
}

function closeCodeModal() {
    const modal = document.getElementById('code-modal');
    if (modal) modal.style.display = 'none';
}

function copyCodeToClipboard() {
    const textarea = document.getElementById('code-modal-content');
    if (textarea) {
        textarea.select();
        navigator.clipboard.writeText(textarea.value).then(() => {
            alert('📋 ¡Código copiado al portapapeles!');
        });
    }
}

function openExportModal() {
    const jsonStr = BalanceManager.exportJSON();
    const modal = document.getElementById('code-modal');
    const textarea = document.getElementById('code-modal-content');
    const title = document.getElementById('code-modal-title');
    if (modal && textarea) {
        if (title) title.innerText = '📤 EXPORTAR CONFIGURACIÓN (JSON)';
        textarea.value = jsonStr;
        modal.style.display = 'flex';
    }
}

function openImportModal() {
    const jsonStr = prompt('Pega aquí el JSON de configuración de balance:');
    if (jsonStr) {
        const res = BalanceManager.importJSON(jsonStr);
        alert(res.message);
        if (res.success) {
            renderBalanceEditor();
        }
    }
}

