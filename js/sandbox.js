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
            { enabled: true, templateKey: 'IGNIS', level: 3, weaponType: 'ESPADA', weaponElement: 'FUEGO', isUpgraded: true, chipType: 'NONE', mutatorType: 'NONE', skin: 'ROBOT_SHADES', aura: 'AUTO', particles: 'AUTO' },
            { enabled: true, templateKey: 'AQUA', level: 3, weaponType: 'BACULO', weaponElement: 'AGUA', isUpgraded: false, chipType: 'NONE', mutatorType: 'NONE', skin: 'DEFAULT', aura: 'AUTO', particles: 'AUTO' },
            { enabled: true, templateKey: 'TERRA', level: 3, weaponType: 'HACHA', weaponElement: 'TIERRA', isUpgraded: false, chipType: 'NONE', mutatorType: 'NONE', skin: 'DEFAULT', aura: 'AUTO', particles: 'AUTO' }
        ],
        enemies: [
            { enabled: true, templateKey: 'WILD_FUEGO', level: 3, weaponType: 'DAGA', weaponElement: 'FUEGO', isUpgraded: false, chipType: 'NONE', mutatorType: 'NONE', skin: 'DEFAULT', aura: 'AUTO', particles: 'AUTO' },
            { enabled: true, templateKey: 'WILD_AGUA', level: 3, weaponType: 'BACULO', weaponElement: 'AGUA', isUpgraded: false, chipType: 'NONE', mutatorType: 'NONE', skin: 'DEFAULT', aura: 'AUTO', particles: 'AUTO' },
            { enabled: false, templateKey: 'WILD_TIERRA', level: 3, weaponType: 'HACHA', weaponElement: 'TIERRA', isUpgraded: false, chipType: 'NONE', mutatorType: 'NONE', skin: 'DEFAULT', aura: 'AUTO', particles: 'AUTO' }
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
    } else if (tabName === 'towers') {
        initTowersSandbox();
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
        name: 'TITAN-X (Jefe Torre 1)',
        group: '👑 Jefes',
        isBoss: true,
        template: {
            name: 'TITAN-X (Jefe)',
            element: ELEMENTS.NEUTRO,
            emoji: '👹',
            level: 10,
            isBoss: true,
            baseStatsOverride: {
                maxHp: 350,
                atk: 26,
                spd: 11,
                dodge: 10,
                acc: 100,
                critChance: 12
            },
            turnPattern: ['Golpe Titánico', 'Pulso PEM Titánico', 'Protocolo Exterminio'],
            skills: [
                { name: 'Golpe Titánico', cd: 0, currentCd: 0, desc: 'Ataque demoledor neutro (1.4x de daño) que sacude la arena.', type: 'DAMAGE', power: 1.4 },
                { name: 'Pulso PEM Titánico', cd: 3, currentCd: 1, desc: 'Tormenta electromagnética masiva que descarga rayos sobre todo el escuadrón (0.8x) y desactiva todas las Barreras y Escudos aliados.', type: 'DAMAGE_AOE_STATUS', target: 'ALL_ENEMIES', power: 0.8, purgeShields: true },
                { name: 'Protocolo Exterminio', cd: 4, currentCd: 2, desc: 'Haz orbital aniquilador concentrado (2.2x de daño masivo). Infalible: Fijación balística absoluta, no puede fallar ni ser esquivado.', type: 'DAMAGE', power: 2.2, cannotMiss: true }
            ]
        }
    },
    'TITAN_OMEGA': {
        name: 'TITAN-OMEGA (Jefe Torre 2)',
        group: '👑 Jefes',
        isBoss: true,
        template: {
            name: 'TITAN-OMEGA (Jefe)',
            element: ELEMENTS.NEUTRO,
            emoji: '👹',
            level: 20,
            isBoss: true,
            baseStatsOverride: {
                maxHp: 420,
                atk: 28,
                spd: 12,
                dodge: 12,
                acc: 100,
                critChance: 15
            },
            turnPattern: ['Golpe Cuántico', 'Sobrecarga Cuántica', 'Protocolo Aniquilación'],
            skills: [
                { name: 'Golpe Cuántico', cd: 0, currentCd: 0, desc: 'Impacto cuántico neutro (1.5x de daño) que desestabiliza las frecuencias del blanco.', type: 'DAMAGE', power: 1.5 },
                { name: 'Sobrecarga Cuántica', cd: 3, currentCd: 1, desc: 'Descarga cuántica masiva sobre todo el escuadrón (1.0x). Destruye escudos y aplica rompearmaduras.', type: 'DAMAGE_AOE_STATUS', target: 'ALL_ENEMIES', power: 1.0, purgeShields: true },
                { name: 'Protocolo Aniquilación', cd: 4, currentCd: 2, desc: 'Rayo orbital concentrado (2.5x de daño masivo). Infalible: No puede fallar ni ser esquivado.', type: 'DAMAGE', power: 2.5, cannotMiss: true }
            ]
        }
    },
    'SINGULARIDAD_ZERO': {
        name: 'SINGULARIDAD-ZERO (Jefe Torre 3)',
        group: '👑 Jefes',
        isBoss: true,
        template: {
            name: 'SINGULARIDAD-ZERO (Jefe Final)',
            element: ELEMENTS.NEUTRO,
            emoji: '👹',
            level: 30,
            isBoss: true,
            baseStatsOverride: {
                maxHp: 500,
                atk: 32,
                spd: 14,
                dodge: 15,
                acc: 100,
                critChance: 20
            },
            turnPattern: ['Colapso Gravitatorio', 'Tormenta del Vacío', 'Protocolo Singularidad'],
            skills: [
                { name: 'Colapso Gravitatorio', cd: 0, currentCd: 0, desc: 'Aplastamiento de gravedad cero (1.6x de daño neutro).', type: 'DAMAGE', power: 1.6 },
                { name: 'Tormenta del Vacío', cd: 3, currentCd: 1, desc: 'Colapso dimensional en área (1.2x daño a todo el escuadrón). Purga barreras y deja conmoción.', type: 'DAMAGE_AOE_STATUS', target: 'ALL_ENEMIES', power: 1.2, purgeShields: true },
                { name: 'Protocolo Singularidad', cd: 4, currentCd: 2, desc: 'Aniquilación total por horizonte de sucesos (3.0x daño devastador). Infalible.', type: 'DAMAGE', power: 3.0, cannotMiss: true }
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
        isBoss: !!charDef.isBoss,
        skin: config.skin || 'DEFAULT',
        aura: config.aura !== undefined ? config.aura : 'AUTO',
        particles: config.particles !== undefined ? config.particles : 'AUTO'
    });
    
    // Equipar Arma
    if (config.weaponType && config.weaponType !== 'NONE') {
        let wType = WEAPON_TYPES[config.weaponType];
        let isLegendary = (config.weaponElement === 'LEGENDARIO' || config.weaponElement === (typeof ELEMENTS !== 'undefined' ? ELEMENTS.LEGENDARIO : 'LEGENDARIO') || !!config.isLegendary);
        let wElem = isLegendary ? (typeof ELEMENTS !== 'undefined' ? ELEMENTS.LEGENDARIO : 'LEGENDARIO') : (ELEMENTS[config.weaponElement] || robot.element);
        let isPlusOne = !!config.isUpgraded || isLegendary;
        
        let wName = isLegendary
            ? `${config.weaponType.charAt(0) + config.weaponType.slice(1).toLowerCase()} Legendaria`
            : `${config.weaponType.charAt(0) + config.weaponType.slice(1).toLowerCase()} de ${wElem}`;
        if (isPlusOne && !isLegendary) wName += ' +1';
        
        let desc = '';
        if (isLegendary) {
            if (wType === WEAPON_TYPES.DAGA) desc = '40% prob. doble ataque (con +1). Afinidad Universal (+25% ATQ / +15% HP). 1.15x Daño universal.';
            if (wType === WEAPON_TYPES.HACHA) desc = '+10% ATQ base. Perfora 75% defensas (+1). 20% prob. Rompearmaduras. +45% Daño a ≤40% HP (Verdugo +1). Afinidad Universal.';
            if (wType === WEAPON_TYPES.BACULO) desc = 'Al finalizar turno: Escudo de plasma 15% HP Máx portador + micro-escudo 8% a aliado. 20% prob. de -1 CD. Afinidad Universal.';
            if (wType === WEAPON_TYPES.ESPADA) desc = '+30% Daño base y +20% Crítico (+1). Críticos activan Racha (+10% ATQ). Afinidad Universal.';
        } else {
            if (wType === WEAPON_TYPES.DAGA) desc = isPlusOne ? '40% prob. doble ataque (con +1). Cada golpe aplica marca.' : '25% prob. doble ataque. Cada golpe aplica marca.';
            if (wType === WEAPON_TYPES.HACHA) desc = isPlusOne ? '+10% ATQ. Perfora 75% barreras. 20% Rompearmaduras. +45% Daño a ≤40% HP.' : '+10% ATQ. Perfora 50% barreras. 20% Rompearmaduras. +35% Daño a ≤40% HP.';
            if (wType === WEAPON_TYPES.BACULO) desc = isPlusOne ? 'Al finalizar turno: Escudo de plasma 15% HP portador + micro-escudo 8% a aliado. 20% prob. -1 CD. Potenciado por Agua.' : 'Al finalizar turno: Escudo de plasma 10% HP portador. Potenciado por afinidad Agua (+25%).';
            if (wType === WEAPON_TYPES.ESPADA) desc = isPlusOne ? '+30% Daño base y +20% Crítico. Críticos activan Racha (+10% ATQ).' : '+15% Daño base y +10% Crítico. Críticos activan Racha (+10% ATQ).';
        }
        
        robot.equipWeapon({
            id: Math.random().toString(36).substr(2, 9),
            type: wType,
            element: wElem,
            name: wName,
            desc: desc,
            isUpgraded: isPlusOne,
            isLegendary: isLegendary
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

        // Opciones de Skins / Chasis
        let skinGroups = {};
        if (typeof SKINS_DATABASE !== 'undefined') {
            Object.keys(SKINS_DATABASE).forEach(sKey => {
                const sDef = SKINS_DATABASE[sKey];
                const grp = sDef.group || 'Otras';
                if (!skinGroups[grp]) skinGroups[grp] = [];
                skinGroups[grp].push(sDef);
            });
        }
        const skinOptionsHtml = Object.keys(skinGroups).map(grp => `
            <optgroup label="${grp}">
                ${skinGroups[grp].map(sDef => `<option value="${sDef.id}" ${(slot.skin || 'DEFAULT') === sDef.id ? 'selected' : ''}>${sDef.name}</option>`).join('')}
            </optgroup>
        `).join('');

        // Opciones de Auras
        let auraOptionsHtml = '';
        if (typeof AURAS_DATABASE !== 'undefined') {
            auraOptionsHtml = Object.keys(AURAS_DATABASE).map(aKey => {
                const aDef = AURAS_DATABASE[aKey];
                return `<option value="${aDef.id}" ${(slot.aura || 'AUTO') === aDef.id ? 'selected' : ''}>${aDef.name}</option>`;
            }).join('');
        }

        // Opciones de Partículas
        let particlesOptionsHtml = '';
        if (typeof PARTICLES_DATABASE !== 'undefined') {
            particlesOptionsHtml = Object.keys(PARTICLES_DATABASE).map(pKey => {
                const pDef = PARTICLES_DATABASE[pKey];
                return `<option value="${pDef.id}" ${(slot.particles || 'AUTO') === pDef.id ? 'selected' : ''}>${pDef.name}</option>`;
            }).join('');
        }
        
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
            <option value="LEGENDARIO" ${slot.weaponElement === 'LEGENDARIO' ? 'selected' : ''}>👑 Legendario (Dorado)</option>
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
                    <div class="slot-header-left">
                        <div class="slot-avatar-badge-preview">
                            ${previewRobot && previewRobot.getAvatarGraphicHtml ? previewRobot.getAvatarGraphicHtml() : (previewRobot ? previewRobot.emoji : '🤖')}
                        </div>
                        <div>
                            <span class="slot-index-badge">
                                ${isAlly ? '🔵 Aliado' : '🔴 Enemigo'} #${idx + 1}
                            </span>
                            <div style="font-size: 0.8rem; color: #66fcf1; font-weight: 700;">
                                ${previewRobot ? previewRobot.name : ''}
                            </div>
                        </div>
                    </div>
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
                        <label>🎨 Chasis / Skin</label>
                        <select class="form-control" onchange="updateSlotField('${teamType}', ${idx}, 'skin', this.value)">
                            ${skinOptionsHtml}
                        </select>
                    </div>

                    <div class="form-group">
                        <label>✨ Aura de Fondo</label>
                        <select class="form-control" onchange="updateSlotField('${teamType}', ${idx}, 'aura', this.value)">
                            ${auraOptionsHtml}
                        </select>
                    </div>

                    <div class="form-group">
                        <label>🎆 Partículas</label>
                        <select class="form-control" onchange="updateSlotField('${teamType}', ${idx}, 'particles', this.value)">
                            ${particlesOptionsHtml}
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
    } else if (presetKey === 'VS_TITAN_OMEGA') {
        Sandbox.combatConfig.allies = [
            { enabled: true, templateKey: 'IGNIS', level: 15, weaponType: 'ESPADA', weaponElement: 'FUEGO', isUpgraded: true, chipType: 'CHIP_FUEGO', mutatorType: 'NONE' },
            { enabled: true, templateKey: 'AQUA', level: 15, weaponType: 'BACULO', weaponElement: 'AGUA', isUpgraded: true, chipType: 'CHIP_AGUA', mutatorType: 'NONE' },
            { enabled: true, templateKey: 'TERRA', level: 15, weaponType: 'HACHA', weaponElement: 'TIERRA', isUpgraded: true, chipType: 'CHIP_TIERRA', mutatorType: 'NONE' }
        ];
        Sandbox.combatConfig.enemies = [
            { enabled: true, templateKey: 'TITAN_OMEGA', level: 20, weaponType: 'NONE', weaponElement: 'NEUTRO', isUpgraded: false, chipType: 'NONE', mutatorType: 'NONE' },
            { enabled: false, templateKey: 'WILD_AGUA', level: 1, weaponType: 'NONE', weaponElement: 'AGUA', isUpgraded: false, chipType: 'NONE', mutatorType: 'NONE' },
            { enabled: false, templateKey: 'WILD_TIERRA', level: 1, weaponType: 'NONE', weaponElement: 'TIERRA', isUpgraded: false, chipType: 'NONE', mutatorType: 'NONE' }
        ];
        Sandbox.combatConfig.options.arenaBg = 'bg-boss';
    } else if (presetKey === 'VS_SINGULARIDAD') {
        Sandbox.combatConfig.allies = [
            { enabled: true, templateKey: 'IGNIS', level: 25, weaponType: 'ESPADA', weaponElement: 'FUEGO', isUpgraded: true, chipType: 'CHIP_FUEGO', mutatorType: 'NONE' },
            { enabled: true, templateKey: 'AQUA', level: 25, weaponType: 'BACULO', weaponElement: 'AGUA', isUpgraded: true, chipType: 'CHIP_AGUA', mutatorType: 'NONE' },
            { enabled: true, templateKey: 'TERRA', level: 25, weaponType: 'HACHA', weaponElement: 'TIERRA', isUpgraded: true, chipType: 'CHIP_TIERRA', mutatorType: 'NONE' }
        ];
        Sandbox.combatConfig.enemies = [
            { enabled: true, templateKey: 'SINGULARIDAD_ZERO', level: 30, weaponType: 'NONE', weaponElement: 'NEUTRO', isUpgraded: false, chipType: 'NONE', mutatorType: 'NONE' },
            { enabled: false, templateKey: 'WILD_AGUA', level: 1, weaponType: 'NONE', weaponElement: 'AGUA', isUpgraded: false, chipType: 'NONE', mutatorType: 'NONE' },
            { enabled: false, templateKey: 'WILD_TIERRA', level: 1, weaponType: 'NONE', weaponElement: 'TIERRA', isUpgraded: false, chipType: 'NONE', mutatorType: 'NONE' }
        ];
        Sandbox.combatConfig.options.arenaBg = 'bg-boss';
    } else if (presetKey === 'LEGENDARY_SQUAD') {
        Sandbox.combatConfig.allies = [
            { enabled: true, templateKey: 'IGNIS', level: 12, weaponType: 'ESPADA', weaponElement: 'LEGENDARIO', isUpgraded: true, isLegendary: true, chipType: 'CHIP_FUEGO', mutatorType: 'NONE' },
            { enabled: true, templateKey: 'AQUA', level: 12, weaponType: 'BACULO', weaponElement: 'LEGENDARIO', isUpgraded: true, isLegendary: true, chipType: 'CHIP_AGUA', mutatorType: 'NONE' },
            { enabled: true, templateKey: 'TERRA', level: 12, weaponType: 'HACHA', weaponElement: 'LEGENDARIO', isUpgraded: true, isLegendary: true, chipType: 'CHIP_TIERRA', mutatorType: 'NONE' }
        ];
        Sandbox.combatConfig.enemies = [
            { enabled: true, templateKey: 'COLOSO_SISMICO', level: 14, weaponType: 'NONE', weaponElement: 'TIERRA', isUpgraded: false, chipType: 'NONE', mutatorType: 'ESPINAS' },
            { enabled: true, templateKey: 'BERSERKER_TERMICO', level: 14, weaponType: 'NONE', weaponElement: 'FUEGO', isUpgraded: false, chipType: 'NONE', mutatorType: 'RABIA' },
            { enabled: true, templateKey: 'CYBER_STALKER', level: 14, weaponType: 'NONE', weaponElement: 'AIRE', isUpgraded: false, chipType: 'NONE', mutatorType: 'REGENERADOR' }
        ];
        Sandbox.combatConfig.options.arenaBg = 'bg-elite';
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
    } else if (presetKey === 'SKINS_SHOWCASE') {
        Sandbox.combatConfig.allies = [
            { enabled: true, templateKey: 'IGNIS', level: 5, weaponType: 'ESPADA', weaponElement: 'FUEGO', isUpgraded: true, chipType: 'CHIP_FUEGO', mutatorType: 'NONE', skin: 'PRIMAL_FIRE_SHADES', aura: 'FUEGO', particles: 'FUEGO' },
            { enabled: true, templateKey: 'AQUA', level: 5, weaponType: 'BACULO', weaponElement: 'AGUA', isUpgraded: true, chipType: 'CHIP_AGUA', mutatorType: 'NONE', skin: 'PRIMAL_WATER_SHADES', aura: 'AGUA', particles: 'AGUA' },
            { enabled: true, templateKey: 'TERRA', level: 5, weaponType: 'HACHA', weaponElement: 'TIERRA', isUpgraded: true, chipType: 'CHIP_TIERRA', mutatorType: 'NONE', skin: 'PRIMAL_EARTH_SHADES', aura: 'TIERRA', particles: 'TIERRA' }
        ];
        Sandbox.combatConfig.enemies = [
            { enabled: true, templateKey: 'ZEPHYR', level: 5, weaponType: 'DAGA', weaponElement: 'AIRE', isUpgraded: true, chipType: 'CHIP_AIRE', mutatorType: 'NONE', skin: 'PRIMAL_AIR_SHADES', aura: 'AIRE', particles: 'AIRE' },
            { enabled: true, templateKey: 'WILD_NEUTRO', level: 5, weaponType: 'ESPADA', weaponElement: 'NEUTRO', isUpgraded: true, chipType: 'NONE', mutatorType: 'NONE', skin: 'CYBER_DINO_SHADES', aura: 'COSMIC', particles: 'COSMIC' },
            { enabled: true, templateKey: 'TITAN_X', level: 8, weaponType: 'HACHA', weaponElement: 'NEUTRO', isUpgraded: true, chipType: 'NONE', mutatorType: 'RABIA', skin: 'CYBER_SKULL_SHADES', aura: 'GOLD', particles: 'GOLD' }
        ];
        Sandbox.combatConfig.options.arenaBg = 'bg-boss';
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
    
    // Limpiar estados de inicio y aplicar cooldowns completos al iniciar combate
    GAME_STATE.team.forEach(r => {
        r.statuses = r.statuses.filter(s => s.isPermanent);
        if (r.resetCooldowns) r.resetCooldowns(true);
        else if (r.skills) r.skills.forEach(s => {
            s.currentCd = s.cd > 0 ? s.cd : 0;
        });
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

/* ==========================================================================
   SIMULADOR DE PASO ENTRE TORRES Y ARMAS LEGENDARIAS
   ========================================================================== */

function initTowersSandbox() {
    if (!Sandbox.towersState) {
        Sandbox.towersState = {
            activeTowerId: 1,
            simulatedFloor: 1,
            transitionStep: 'IDLE',
            simulatedResult: null,
            legendaryWeaponType: 'ESPADA',
            legendaryTargetRobot: 'IGNIS'
        };
    }
    
    renderTowersOverview();
    renderTowerTransitionStage();
    renderTowerMapPreview(Sandbox.towersState.activeTowerId, Sandbox.towersState.simulatedFloor);
    renderLegendaryWeaponsLab();
}

function renderTowersOverview() {
    const grid = document.getElementById('towers-cards-grid');
    if (!grid) return;
    
    const activeId = (Sandbox.towersState && Sandbox.towersState.activeTowerId) ? Sandbox.towersState.activeTowerId : 1;
    
    grid.innerHTML = Object.keys(TOWERS_CONFIG).map(tId => {
        const id = parseInt(tId);
        const t = TOWERS_CONFIG[id];
        const isActive = id === activeId;
        const isCompleted = id < activeId;
        
        let statusBadge = '';
        if (isActive) statusBadge = '<span class="tower-status-badge status-active">▶ ACTIVA</span>';
        else if (isCompleted) statusBadge = '<span class="tower-status-badge status-completed">✔ SUPERADA</span>';
        else statusBadge = '<span class="tower-status-badge status-locked">🔒 BLOQUEADA</span>';
        
        return `
            <div class="tower-card ${isActive ? 'is-active-tower' : ''} ${isCompleted ? 'is-completed-tower' : ''}" onclick="selectTowerForMapPreview(${id})">
                <div class="tower-card-header">
                    <span class="tower-id-badge">TORRE 0${id}</span>
                    ${statusBadge}
                </div>
                <h3 class="tower-card-title">${t.name}</h3>
                <div class="tower-card-badge-desc">${t.badge}</div>
                <div class="tower-card-stats">
                    <div class="tower-stat-item">
                        <span class="lbl">Pisos:</span>
                        <span class="val">${t.startFloor} al ${t.endFloor}</span>
                    </div>
                    <div class="tower-stat-item">
                        <span class="lbl">Jefe:</span>
                        <span class="val">${t.bossName}</span>
                    </div>
                    <div class="tower-stat-item">
                        <span class="lbl">Llave:</span>
                        <span class="val">${id === 1 ? '🔑 Cuántica' : (id === 2 ? '🗝️ Singularidad' : '👑 Corona')}</span>
                    </div>
                </div>
                <div class="tower-card-footer">
                    <span class="click-hint">${isActive ? 'Mostrando mapa ➔' : 'Clic para explorar mapa'}</span>
                </div>
            </div>
        `;
    }).join('');
}

function selectTowerForMapPreview(towerId) {
    if (typeof TOWERS_CONFIG === 'undefined' || !TOWERS_CONFIG[towerId]) return;
    Sandbox.towersState.activeTowerId = towerId;
    Sandbox.towersState.simulatedFloor = TOWERS_CONFIG[towerId].startFloor;
    renderTowersOverview();
    renderTowerMapPreview(towerId, TOWERS_CONFIG[towerId].startFloor);
}

function simulateTowerTransition(fromTowerId) {
    fromTowerId = parseInt(fromTowerId) || 1;
    const currentTower = TOWERS_CONFIG[fromTowerId] || TOWERS_CONFIG[1];
    const nextTowerId = currentTower.nextTowerId;
    const nextTower = nextTowerId ? TOWERS_CONFIG[nextTowerId] : null;
    
    Sandbox.towersState.activeTowerId = fromTowerId;
    Sandbox.towersState.simulatedFloor = currentTower.endFloor;
    
    // Generar arma dorada legendaria
    const legWeapon = (typeof generateLegendaryWeapon === 'function') 
        ? generateLegendaryWeapon() 
        : { name: 'Espada Legendaria', type: WEAPON_TYPES.ESPADA, element: ELEMENTS.LEGENDARIO, isLegendary: true, desc: '+30% Daño base y +20% Crítico. Afinidad Universal.' };
    
    Sandbox.towersState.lastDroppedWeapon = legWeapon;
    
    const checkpointPayload = {
        user_id: "usr_sandbox_simulation_01",
        tower_completed: fromTowerId,
        current_tower: nextTowerId || fromTowerId,
        floor: nextTower ? nextTower.startFloor : currentTower.endFloor,
        scrap: 240,
        squad: [
            { name: "Ignis", element: "FUEGO", level: fromTowerId * 10, hp: 125, maxHp: 125, weapon: legWeapon.name },
            { name: "Aqua", element: "AGUA", level: fromTowerId * 10, hp: 160, maxHp: 160, weapon: "Báculo de Agua +1" },
            { name: "Terra", element: "TIERRA", level: fromTowerId * 10, hp: 220, maxHp: 220, weapon: "Hacha de Tierra +1" }
        ],
        inventory: {
            weapons: [legWeapon],
            items: [{ type: "CHIP_FUEGO", name: "Chip Fuego (Lanzallamas)" }]
        }
    };
    
    Sandbox.towersState.simulatedResult = {
        fromTower: currentTower,
        nextTower: nextTower,
        bossName: currentTower.bossName,
        legWeapon: legWeapon,
        checkpoint: checkpointPayload,
        hasAscended: false
    };
    
    renderTowersOverview();
    renderTowerTransitionStage();
    renderTowerMapPreview(fromTowerId, currentTower.endFloor);
}

function renderTowerTransitionStage() {
    const stage = document.getElementById('tower-transition-stage');
    const badgeEl = document.getElementById('trans-current-step-badge');
    if (!stage) return;
    
    const res = Sandbox.towersState.simulatedResult;
    if (!res) {
        if (badgeEl) badgeEl.innerText = 'SELECCIONA TRANSICIÓN';
        stage.innerHTML = `
            <div class="transition-empty-state">
                <span class="empty-icon">🗼</span>
                <p>Haz clic en uno de los botones superiores para simular el paso entre torres:</p>
                <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-top:10px;">
                    <button class="btn-preset" onclick="simulateTowerTransition(1)">🔑 Torre 1 ➔ Torre 2</button>
                    <button class="btn-preset" onclick="simulateTowerTransition(2)">🗝️ Torre 2 ➔ Torre 3</button>
                    <button class="btn-preset" onclick="simulateTowerTransition(3)">👑 Torre 3 ➔ Victoria</button>
                </div>
            </div>
        `;
        return;
    }
    
    if (badgeEl) {
        badgeEl.innerText = res.hasAscended ? `ASCENDIDO A TORRE ${res.nextTower ? res.nextTower.id : 3}` : `PISO ${res.fromTower.endFloor} DERROTADO`;
    }
    
    let keyBannerHtml = '';
    if (res.fromTower.id === 1) {
        keyBannerHtml = `
            <div class="post-log-item log-key-unlocked">
                <div class="key-banner-icon">🔑</div>
                <div class="key-banner-text">
                    <strong>¡LLAVE CUÁNTICA OBTENIDA!</strong>
                    <span>ACCESO AUTORIZADO // TORRE CUÁNTICA (PISOS 11 - 20)</span>
                </div>
            </div>
        `;
    } else if (res.fromTower.id === 2) {
        keyBannerHtml = `
            <div class="post-log-item log-key-unlocked">
                <div class="key-banner-icon">🗝️</div>
                <div class="key-banner-text">
                    <strong>¡LLAVE DE SINGULARIDAD OBTENIDA!</strong>
                    <span>ACCESO AUTORIZADO // TORRE DE SINGULARIDAD (PISOS 21 - 30)</span>
                </div>
            </div>
        `;
    } else {
        keyBannerHtml = `
            <div class="post-log-item log-key-unlocked">
                <div class="key-banner-icon">👑</div>
                <div class="key-banner-text">
                    <strong>¡NÚCLEO DE SINGULARIDAD NEUTRALIZADO!</strong>
                    <span>¡HAS SUPERADO TODOS LOS SECTORES Y CONQUISTADO EL JUEGO!</span>
                </div>
            </div>
        `;
    }
    
    let actionsHtml = '';
    if (!res.hasAscended) {
        if (res.nextTower) {
            actionsHtml = `
                <div class="post-actions-flex">
                    <button class="btn-post-action btn-post-scrap" onclick="simulateDismantleBossInSandbox(this)">
                        <span>⚙️ Desmantelar Restos (+60 Chatarra, +20% HP)</span>
                    </button>
                    <button class="btn-post-action btn-post-ascend" onclick="executeAscentTransition(${res.nextTower.id})">
                        <span>🚀 Ascender a ${res.nextTower.name} (Piso ${res.nextTower.startFloor}) ➔</span>
                    </button>
                    <button class="btn-post-action btn-post-claim-victory" onclick="alert('🏆 ¡Incursión finalizada con éxito! Se consolidan 240 ⚙️ en el pozo global.')">
                        <span>🏆 Retirarse con Victoria y Consolidar Chatarra</span>
                    </button>
                </div>
            `;
        } else {
            actionsHtml = `
                <div class="post-actions-flex">
                    <button class="btn-post-action btn-post-claim-victory btn-pulse-gold" onclick="alert('👑 ¡FELICITACIONES! Has conquistado el 100% de los sectores roguelike.')">
                        <span>👑 ¡CONQUISTAR SINGULARIDAD Y FINALIZAR EXPEDICIÓN! 🏆</span>
                    </button>
                </div>
            `;
        }
    } else {
        actionsHtml = `
            <div class="ascent-success-banner">
                <span style="font-size: 1.8rem;">🚀</span>
                <div>
                    <strong style="color:#1dd1a1; font-size:1.1rem;">¡ASCENSO COMPLETADO CON ÉXITO!</strong>
                    <div style="font-size:0.85rem; color:#c8d6e5;">Ahora te encuentras en ${res.nextTower ? res.nextTower.name : 'Nueva Torre'} (Piso ${res.nextTower ? res.nextTower.startFloor : 1}). Observa el mapa en el panel derecho.</div>
                </div>
            </div>
        `;
    }
    
    stage.innerHTML = `
        <div class="transition-summary-header">
            <div class="boss-trophy-row">
                <span class="boss-emoji-large">👹</span>
                <div>
                    <h3 class="boss-defeated-title">⚔️ ${res.bossName} NEUTRALIZADO</h3>
                    <div class="reward-pill-row">
                        <span class="reward-pill pill-scrap">⚙️ +60 Chatarra</span>
                        <span class="reward-pill pill-xp">⭐ +1500 XP</span>
                        <span class="reward-pill pill-boss">🏆 JEFE DERROTADO</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Banner Llave Psicológica -->
        ${keyBannerHtml}

        <!-- Drop de Arma Dorada Legendaria -->
        <div class="legendary-drop-box">
            <div class="legendary-drop-label">🎁 BOTÍN LEGENDARIO DORADO GARANTIZADO:</div>
            <div class="inv-item-card is-legendary" style="margin: 0;">
                <div class="inv-item-top">
                    <span class="inv-item-emoji elem-LEGENDARIO" style="font-size: 2rem;">${WEAPON_EMOJIS[res.legWeapon.type]}</span>
                    <div class="inv-item-info">
                        <div class="inv-item-title elem-LEGENDARIO">
                            ${res.legWeapon.name} <span class="badge-legendary">👑 LEGENDARIA</span>
                        </div>
                        <div class="inv-item-desc" style="color: #ffd700;">${res.legWeapon.desc}</div>
                        <div class="inv-item-desc" style="color: #66fcf1; font-size: 0.78rem; margin-top: 4px;">
                            ✨ Afinidad universal activa con cualquier aliado (+25% ATQ / +15% HP) • 1.15x Daño
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Botones de Acción Post-Batalla -->
        <div class="transition-interactive-actions">
            ${actionsHtml}
        </div>

        <!-- Inspección de Checkpoint en Base de Datos (Cero LocalStorage) -->
        <details class="checkpoint-telemetry-box">
            <summary class="checkpoint-telemetry-summary">
                <span>💾 Ver Checkpoint Guardado en Supabase (saved_tower_runs)</span>
                <span class="zero-storage-tag">0% LocalStorage // 100% DB</span>
            </summary>
            <pre class="checkpoint-json-code">${JSON.stringify(res.checkpoint, null, 2)}</pre>
        </details>
    `;
}

function executeAscentTransition(nextTowerId) {
    if (!TOWERS_CONFIG[nextTowerId]) return;
    const nextTower = TOWERS_CONFIG[nextTowerId];
    
    if (Sandbox.towersState.simulatedResult) {
        Sandbox.towersState.simulatedResult.hasAscended = true;
    }
    Sandbox.towersState.activeTowerId = nextTowerId;
    Sandbox.towersState.simulatedFloor = nextTower.startFloor;
    
    renderTowersOverview();
    renderTowerTransitionStage();
    renderTowerMapPreview(nextTowerId, nextTower.startFloor);
}

function simulateDismantleBossInSandbox(buttonEl) {
    if (buttonEl) {
        buttonEl.disabled = true;
        buttonEl.classList.add('btn-dismantled');
        buttonEl.innerHTML = `<span>✔ Restos del Jefe Desmantelados (+60 ⚙️, +20% HP)</span>`;
    }
}

function renderTowerMapPreview(towerId, activeFloor) {
    towerId = parseInt(towerId) || 1;
    const tower = (typeof TOWERS_CONFIG !== 'undefined' && TOWERS_CONFIG[towerId]) ? TOWERS_CONFIG[towerId] : { name: 'Torre Cibernética', startFloor: 1, endFloor: 10, bossName: 'TITAN-X' };
    
    if (activeFloor === undefined || activeFloor === null) {
        activeFloor = tower.startFloor;
    }
    activeFloor = parseInt(activeFloor);
    Sandbox.towersState.simulatedFloor = activeFloor;
    
    const towerNameEl = document.getElementById('map-preview-tower-name');
    if (towerNameEl) towerNameEl.innerText = tower.name.toUpperCase();
    
    // Generar mapa con el motor real de mapGenerator.js
    if (typeof generateFullMap === 'function') {
        generateFullMap(towerId);
    }
    
    // Actualizar selector de pisos (startFloor a endFloor)
    const selectEl = document.getElementById('map-preview-floor-select');
    if (selectEl) {
        let opts = '';
        for (let fl = tower.startFloor; fl <= tower.endFloor; fl++) {
            opts += `<option value="${fl}" ${fl === activeFloor ? 'selected' : ''}>Piso ${fl}${fl === tower.endFloor ? ' 👑 (Jefe)' : ''}</option>`;
        }
        selectEl.innerHTML = opts;
    }
    
    const container = document.getElementById('sandbox-map-preview-container');
    if (!container) return;
    container.innerHTML = '';
    
    // Crear SVG para las líneas
    const svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgContainer.id = 'sandbox-map-svg-lines';
    container.appendChild(svgContainer);
    
    if (typeof fullMap === 'undefined' || !fullMap || fullMap.length === 0) return;
    
    // Renderizamos de arriba a abajo (del piso más alto al primero)
    for (let f = fullMap.length - 1; f >= 0; f--) {
        const floorData = fullMap[f];
        if (!floorData || floorData.length === 0) continue;
        const floorNum = floorData[0].floor;
        const isCurrent = floorNum === activeFloor;
        const isPast = floorNum < activeFloor;
        const isBoss = floorNum === tower.endFloor;
        
        const row = document.createElement('div');
        row.className = `map-floor-row ${isBoss ? 'floor-boss-chamber' : ''} ${isCurrent ? 'floor-current' : ''} ${isPast ? 'floor-passed' : 'floor-future'}`;
        
        const label = document.createElement('div');
        label.className = 'floor-label-box';
        label.innerHTML = `
            <span class="${isBoss ? 'floor-badge-boss' : (isCurrent ? 'floor-badge-current' : (isPast ? 'floor-badge-passed' : 'floor-badge-future'))}">
                ${isBoss ? '👑' : ''} PISO ${floorNum}
            </span>
        `;
        row.appendChild(label);
        
        const nodesContainer = document.createElement('div');
        nodesContainer.className = 'nodes-container';
        if (isBoss) nodesContainer.style.justifyContent = 'center';
        
        floorData.forEach(node => {
            const nodeDiv = document.createElement('div');
            nodeDiv.className = `map-node node-type-${node.type} ${isPast ? 'node-disabled' : ''} ${isCurrent ? 'node-selectable' : ''}`;
            nodeDiv.id = `sb-node-ui-${node.id}`;
            nodeDiv.title = `Nodo: ${NODE_LABELS[node.type] || node.type} (Piso ${node.floor})`;
            
            nodeDiv.innerHTML = `
                <div class="node-icon-wrapper">
                    <span class="node-emoji">${NODE_EMOJIS[node.type] || '❓'}</span>
                </div>
                <span class="node-name">${NODE_LABELS[node.type] || node.type}</span>
            `;
            nodeDiv.onclick = () => inspectSandboxMapNode(node, tower);
            nodesContainer.appendChild(nodeDiv);
        });
        
        row.appendChild(nodesContainer);
        container.appendChild(row);
    }
    
    // Dibujar líneas SVG entre capas
    setTimeout(() => {
        drawSandboxMapLines(container, svgContainer);
    }, 60);
}

function drawSandboxMapLines(container, svg) {
    if (!svg || !container || typeof fullMap === 'undefined' || !fullMap) return;
    svg.innerHTML = '';
    const containerRect = container.getBoundingClientRect();
    
    for (let f = 0; f < fullMap.length - 1; f++) {
        const floorNodes = fullMap[f];
        if (!floorNodes) continue;
        floorNodes.forEach(node => {
            const el1 = document.getElementById(`sb-node-ui-${node.id}`);
            if (!el1) return;
            node.nextNodes.forEach(nextId => {
                const el2 = document.getElementById(`sb-node-ui-${nextId}`);
                if (!el2) return;
                const r1 = el1.getBoundingClientRect();
                const r2 = el2.getBoundingClientRect();
                const x1 = r1.left - containerRect.left + r1.width / 2;
                const y1 = r1.top - containerRect.top + r1.height / 2 + container.scrollTop;
                const x2 = r2.left - containerRect.left + r2.width / 2;
                const y2 = r2.top - containerRect.top + r2.height / 2 + container.scrollTop;
                
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', x1);
                line.setAttribute('y1', y1);
                line.setAttribute('x2', x2);
                line.setAttribute('y2', y2);
                line.setAttribute('stroke', 'rgba(102, 252, 241, 0.55)');
                line.setAttribute('stroke-width', '3');
                svg.appendChild(line);
            });
        });
    }
}

function inspectSandboxMapNode(node, tower) {
    const detailsEl = document.getElementById('sandbox-node-details');
    const badgeEl = document.getElementById('node-detail-badge');
    const infoEl = document.getElementById('node-detail-info');
    if (!detailsEl || !badgeEl || !infoEl) return;
    
    detailsEl.style.display = 'flex';
    badgeEl.innerHTML = `${NODE_EMOJIS[node.type] || '❓'} ${NODE_LABELS[node.type] || node.type}`;
    badgeEl.className = `node-detail-badge node-type-${node.type}`;
    
    let infoText = `Piso ${node.floor} // ${tower.name} (Rutas conectadas: ${node.nextNodes.length})`;
    if (node.type === NODE_TYPES.BOSS) {
        infoText += ` • Cámara del Jefe ${tower.bossName}. Al derrotarlo suelta 1 Arma Legendaria Dorada y la Llave de sector.`;
    } else if (node.type === NODE_TYPES.ELITE) {
        infoText += ` • Robot Élite potenciado con mutador. Recompensa doble y riesgo de explosión.`;
    } else if (node.type === NODE_TYPES.CHEST) {
        infoText += ` • Suministros o armas mejoradas (+1) garantizadas sin combate.`;
    } else if (node.type === NODE_TYPES.SHOP) {
        infoText += ` • Mercado de armas, chips y suministros por chatarra.`;
    } else if (node.type === NODE_TYPES.REPAIR_SHOP) {
        infoText += ` • Taller de mantenimiento: cura 30%, entrena 300 XP o forja +1.`;
    }
    infoEl.innerText = infoText;
}

function onTowerFloorSelectChange(val) {
    const floor = parseInt(val);
    Sandbox.towersState.simulatedFloor = floor;
    renderTowerMapPreview(Sandbox.towersState.activeTowerId, floor);
}

function renderLegendaryWeaponsLab() {
    const container = document.getElementById('legendary-lab-content');
    if (!container) return;
    
    const state = Sandbox.towersState;
    const activeType = state.legendaryWeaponType || 'ESPADA';
    const activeRobotKey = state.legendaryTargetRobot || 'IGNIS';
    
    const wType = WEAPON_TYPES[activeType] || WEAPON_TYPES.ESPADA;
    const template = ROBOT_TEMPLATES[activeRobotKey] || ROBOT_TEMPLATES.IGNIS;
    
    // Robot base sin arma
    const baseRobot = new Robot(template);
    const baseAtk = baseRobot.atk;
    const baseHp = baseRobot.maxHp;
    
    // Robot equipado con arma legendaria dorada
    const legWp = (typeof generateLegendaryWeapon === 'function') 
        ? generateLegendaryWeapon(wType)
        : { name: `${activeType.charAt(0) + activeType.slice(1).toLowerCase()} Legendaria`, type: wType, element: ELEMENTS.LEGENDARIO, isLegendary: true, desc: 'Afinidad Universal (+25% ATQ / +15% HP).' };
    
    const legRobot = new Robot(template);
    legRobot.equipWeapon(legWp);
    
    const atkDiff = legRobot.atk - baseAtk;
    const hpDiff = legRobot.maxHp - baseHp;
    
    const weaponButtons = Object.keys(WEAPON_TYPES).map(k => {
        const wt = WEAPON_TYPES[k];
        const isSel = k === activeType;
        return `
            <button class="btn-lab-choice ${isSel ? 'active-lab-choice' : ''}" onclick="changeLegendaryLabWeapon('${k}')">
                ${WEAPON_EMOJIS[wt]} ${k.charAt(0) + k.slice(1).toLowerCase()}
            </button>
        `;
    }).join('');
    
    const robotButtons = Object.keys(ROBOT_TEMPLATES).map(rKey => {
        const rTemp = ROBOT_TEMPLATES[rKey];
        const isSel = rKey === activeRobotKey;
        return `
            <button class="btn-lab-choice ${isSel ? 'active-lab-choice' : ''}" onclick="changeLegendaryLabRobot('${rKey}')">
                ${rTemp.emoji} ${rTemp.name} (${rTemp.element})
            </button>
        `;
    }).join('');
    
    container.innerHTML = `
        <div class="lab-col-selectors">
            <div class="lab-selector-group">
                <span class="lab-group-title">1. TIPO DE ARMA DORADA LEGENDARIA:</span>
                <div class="lab-buttons-row">${weaponButtons}</div>
            </div>
            
            <div class="lab-selector-group" style="margin-top: 14px;">
                <span class="lab-group-title">2. SELECCIONA ROBOT DE PRUEBA:</span>
                <div class="lab-buttons-row">${robotButtons}</div>
            </div>
            
            <!-- Tarjeta de Arma Dorada -->
            <div class="inv-item-card is-legendary" style="margin-top: 20px;">
                <div class="inv-item-top">
                    <span class="inv-item-emoji elem-LEGENDARIO" style="font-size: 2.2rem;">${WEAPON_EMOJIS[wType]}</span>
                    <div class="inv-item-info">
                        <div class="inv-item-title elem-LEGENDARIO">
                            ${legWp.name} <span class="badge-legendary">👑 LEGENDARIA</span>
                        </div>
                        <div class="inv-item-desc" style="color: #ffd700; font-weight: 600;">${legWp.desc}</div>
                        <div class="inv-item-desc" style="color: #c8d6e5; margin-top: 6px;">
                            🌟 <strong>Afinidad Universal:</strong> +25% ATQ y +15% HP Máx activados en ${template.name} (${template.element}).
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="lab-col-stats">
            <div class="stat-comparison-box">
                <div class="stat-comp-header">
                    <span class="comp-title">📊 COMPARATIVA DE ESTADÍSTICAS EN VIVO</span>
                    <span class="badge-legendary-mini">ARMONÍA ACTIVA</span>
                </div>
                
                <div class="comp-stat-row">
                    <span class="comp-stat-name">⚔️ Ataque Base:</span>
                    <span class="comp-val-base">${baseAtk}</span>
                    <span class="comp-arrow">➔</span>
                    <span class="comp-val-boosted elem-LEGENDARIO">${legRobot.atk} <small>(+${atkDiff} / +25%)</small></span>
                </div>
                
                <div class="comp-stat-row">
                    <span class="comp-stat-name">❤️ HP Máximo:</span>
                    <span class="comp-val-base">${baseHp}</span>
                    <span class="comp-arrow">➔</span>
                    <span class="comp-val-boosted elem-LEGENDARIO">${legRobot.maxHp} <small>(+${hpDiff} / +15%)</small></span>
                </div>
                
                <div class="comp-stat-row">
                    <span class="comp-stat-name">💥 Prob. Crítico:</span>
                    <span class="comp-val-base">${baseRobot.critChance}%</span>
                    <span class="comp-arrow">➔</span>
                    <span class="comp-val-boosted">${legRobot.critChance}%</span>
                </div>
                
                <div class="comp-stat-row">
                    <span class="comp-stat-name">⚡ Multiplicador Elemental:</span>
                    <div class="multipliers-pill-row">
                        <span class="mult-pill" title="Contra Fuego">🔥 1.15x</span>
                        <span class="mult-pill" title="Contra Agua">💧 1.15x</span>
                        <span class="mult-pill" title="Contra Tierra">🪨 1.15x</span>
                        <span class="mult-pill" title="Contra Aire">💨 1.15x</span>
                        <span class="mult-pill" title="Contra Neutro">⚙️ 1.15x</span>
                    </div>
                </div>
                
                <div class="comp-stat-hint">
                    ✨ <strong>Ventaja Táctica:</strong> A diferencia de las armas elementales que sufren 0.75x (desventaja), las armas doradas siempre golpean con <strong>1.15x (+15% daño)</strong> contra cualquier oponente y nunca sufren penalización.
                </div>
                
                <button class="btn-send-to-combat" onclick="sendLegendaryToCombatSimulator('${activeType}', '${activeRobotKey}')">
                    <span>⚔️</span> CARGAR EN SIMULADOR DE COMBATE (PROBAR AHORA)
                </button>
            </div>
        </div>
    `;
}

function changeLegendaryLabWeapon(wType) {
    Sandbox.towersState.legendaryWeaponType = wType;
    renderLegendaryWeaponsLab();
}

function changeLegendaryLabRobot(rKey) {
    Sandbox.towersState.legendaryTargetRobot = rKey;
    renderLegendaryWeaponsLab();
}

function sendLegendaryToCombatSimulator(weaponType, robotKey) {
    weaponType = weaponType || (Sandbox.towersState && Sandbox.towersState.legendaryWeaponType) || 'ESPADA';
    robotKey = robotKey || (Sandbox.towersState && Sandbox.towersState.legendaryTargetRobot) || 'IGNIS';
    
    Sandbox.combatConfig.allies[0] = {
        enabled: true,
        templateKey: robotKey,
        level: 10,
        weaponType: weaponType,
        weaponElement: 'LEGENDARIO',
        isUpgraded: true,
        isLegendary: true,
        chipType: 'NONE',
        mutatorType: 'NONE',
        skin: 'DEFAULT',
        aura: 'GOLD',
        particles: 'GOLD'
    };
    
    switchSandboxTab('combat');
    renderTeamBuilder('allies');
    alert(`👑 ¡${robotKey} equipado con ${weaponType} Legendaria Dorada listo en el Slot 1 del Simulador de Combate!`);
}


