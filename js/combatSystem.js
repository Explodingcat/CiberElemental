// combatSystem.js

let combatState = {
    enemy: null,
    initiativeQueue: [], // Array de { type: 'PLAYER'|'ENEMY', robot: Robot, allyIndex: number }
    queueIndex: 0,
    activeRobotIndex: 0,
    round: 1,
    isProcessing: false,
    isGameOver: false,
    fullLog: []
};

const delay = ms => new Promise(res => setTimeout(res, ms));

function startCombat(nodeType) {
    showScreen('screen-combat');
    combatState.fullLog = [];
    combatState.isProcessing = false;
    combatState.isGameOver = false;
    combatState.round = 1;
    
    // Asignar fondo de arena
    const arenaBg = document.getElementById('combat-arena-bg');
    arenaBg.className = 'combat-arena';
    if (nodeType === NODE_TYPES.BOSS) {
        combatState.enemy = generateBoss();
        arenaBg.classList.add('bg-boss');
    } else if (nodeType === NODE_TYPES.ELITE) {
        combatState.enemy = generateWildRobot(GAME_STATE.floor, true);
        arenaBg.classList.add('bg-elite');
    } else {
        combatState.enemy = generateWildRobot(GAME_STATE.floor, false);
        arenaBg.classList.add(Math.random() > 0.5 ? 'bg-normal' : 'bg-normal-alt');
    }
    
    // Limpiar estados previos, marcas, debuffs y cooldowns de todo el escuadrón
    if (GAME_STATE && GAME_STATE.team) {
        GAME_STATE.team.forEach(robot => {
            if (robot.clearStatuses) robot.clearStatuses();
            else robot.statuses = [];
            if (robot.resetCooldowns) robot.resetCooldowns();
            else if (robot.skills) robot.skills.forEach(s => s.currentCd = 0);
        });
    }

    // Aplicar ventajas de inicio de combate de meta-progresión si están desbloqueadas
    if (typeof SkillsManager !== 'undefined' && GAME_STATE && GAME_STATE.team) {
        GAME_STATE.team.forEach(robot => {
            if (!robot.isOffline && robot.hp > 0) {
                // Batería Térmica: Aqua inicia con Barrera
                if (robot.element === ELEMENTS.AGUA && SkillsManager.hasSkill('starter_water_buff') && !robot.hasStatus('BARRIER')) {
                    robot.addStatus({ type: 'BARRIER', duration: 2 });
                }
            }
        });
    }

    // Construir la cola de iniciativa inicial por velocidad
    buildInitiativeQueue();
    
    // Renderizar la arena completa y el escuadrón
    renderPartyCombatUI();
    logCombat('¡Incursión de combate iniciada! Todos los aliados desplegados en formación.');
    
    // Iniciar el bucle de turnos por iniciativa
    advanceTurnQueue();
}

function buildInitiativeQueue() {
    let queue = [];
    
    // 1. Agregar todos los aliados vivos
    if (GAME_STATE && GAME_STATE.team) {
        GAME_STATE.team.forEach((robot, idx) => {
            if (!robot.isOffline && robot.hp > 0) {
                queue.push({
                    type: 'PLAYER',
                    robot: robot,
                    allyIndex: idx
                });
            }
        });
    }
    
    // 2. Agregar al enemigo si sigue vivo
    if (combatState.enemy && combatState.enemy.hp > 0) {
        queue.push({
            type: 'ENEMY',
            robot: combatState.enemy,
            allyIndex: -1
        });
    }
    
    // 3. Ordenar estrictamente de mayor a menor Velocidad efectiva (SPD)
    queue.sort((a, b) => {
        let spdA = a.robot.getEffectiveSpeed ? a.robot.getEffectiveSpeed() : a.robot.spd;
        let spdB = b.robot.getEffectiveSpeed ? b.robot.getEffectiveSpeed() : b.robot.spd;
        if (spdB !== spdA) {
            return spdB - spdA;
        }
        // Desempate: los aliados tienen prioridad sobre el enemigo
        return a.type === 'PLAYER' ? -1 : 1;
    });
    
    combatState.initiativeQueue = queue;
    combatState.queueIndex = 0;
}

function updateCombatUI() {
    renderPartyCombatUI();
}

function renderPartyCombatUI() {
    if (!GAME_STATE || !GAME_STATE.team) return;
    
    const currentActor = combatState.initiativeQueue[combatState.queueIndex] || null;
    
    // 1. Renderizar Barra de Iniciativa / Timeline
    renderTurnQueue(currentActor);
    
    // 2. Renderizar Escuadrón Aliado (Party Combat)
    const teamContainer = document.getElementById('combat-player-team');
    if (teamContainer) {
        const aliveAlliesCount = GAME_STATE.team.filter(r => !r.isOffline && r.hp > 0).length;
        teamContainer.className = `combat-player-team team-count-${Math.max(1, aliveAlliesCount)}`;
        
        teamContainer.innerHTML = GAME_STATE.team.map((robot, idx) => {
            const isOffline = robot.isOffline || robot.hp <= 0;
            const isActingNow = (currentActor && currentActor.type === 'PLAYER' && currentActor.allyIndex === idx);
            const extraChips = Math.max(0, robot.skills.length - 2);
            const chipIcons = extraChips > 0 ? ' 💾'.repeat(extraChips) : '';
            
            let weaponHtml = '';
            if (robot.equippedWeapon) {
                weaponHtml = `
                    <span class="hud-weapon-icon elem-${robot.equippedWeapon.element}" 
                          data-tooltip="${robot.equippedWeapon.name}: ${robot.equippedWeapon.desc}">
                        ${WEAPON_EMOJIS[robot.equippedWeapon.type]}
                    </span>
                `;
            }
            
            const hpPercent = Math.max(0, Math.min(100, (robot.hp / robot.maxHp) * 100));
            const actingClass = isActingNow ? 'acting-now' : '';
            const offlineClass = isOffline ? 'is-offline' : '';
            
            return `
                <div class="combat-ally-unit ${actingClass} ${offlineClass}" id="ally-unit-${idx}">
                    <!-- Barras de estado individuales -->
                    <div class="status-bars">
                        <div class="buff-bar" id="player-buffs-${idx}"></div>
                        <div class="debuff-bar" id="player-debuffs-${idx}"></div>
                    </div>
                    
                    <div class="hit-effect-container" id="player-hit-container-${idx}">
                        <div class="combat-holo-platform player-platform"></div>
                        <div class="combat-avatar-emoji elem-${robot.element}" id="player-emoji-${idx}">
                            ${robot.emoji}
                        </div>
                    </div>
                    
                    <div class="stats combat-hud-card player-hud">
                        <div class="hud-name-row">
                            <div class="hud-name-container">
                                <span class="hud-robot-name">${robot.name}${chipIcons}</span>
                                ${weaponHtml}
                            </div>
                            <span class="hud-element-badge elem-badge-${robot.element}">(${robot.element})</span>
                        </div>
                        <div class="hud-hp-row">
                            <span class="hud-hp-label">HP</span>
                            <span class="hud-hp-val">${robot.hp}/${robot.maxHp}</span>
                        </div>
                        <progress value="${hpPercent}" max="100"></progress>
                    </div>
                </div>
            `;
        }).join('');
        
        // Renderizar estados de cada aliado
        GAME_STATE.team.forEach((robot, idx) => {
            renderStatusesSplitted(`player-buffs-${idx}`, `player-debuffs-${idx}`, robot.statuses);
        });
    }
    
    // 3. Renderizar Enemigo
    const enemy = combatState.enemy;
    if (enemy) {
        document.getElementById('enemy-robot-name').innerText = enemy.name;
        
        const enemyElemBadge = document.getElementById('enemy-element');
        if (enemyElemBadge) {
            enemyElemBadge.innerText = `(${enemy.element})`;
            enemyElemBadge.className = `hud-element-badge elem-badge-${enemy.element}`;
        }
        document.getElementById('enemy-robot-hp').innerText = `${enemy.hp}/${enemy.maxHp}`;
        document.getElementById('enemy-robot-hp-bar').value = (enemy.hp / enemy.maxHp) * 100;

        const eWeaponBadge = document.getElementById('enemy-weapon-badge');
        if (eWeaponBadge) {
            if (enemy.equippedWeapon) {
                eWeaponBadge.style.display = 'inline-flex';
                eWeaponBadge.innerText = WEAPON_EMOJIS[enemy.equippedWeapon.type];
                eWeaponBadge.className = `hud-weapon-icon elem-${enemy.equippedWeapon.element}`;
                eWeaponBadge.setAttribute('data-tooltip', `${enemy.equippedWeapon.name}: ${enemy.equippedWeapon.desc}`);
            } else {
                eWeaponBadge.style.display = 'none';
            }
        }
        
        const eEmoji = document.getElementById('enemy-robot-emoji');
        eEmoji.innerText = enemy.emoji;
        eEmoji.classList.remove('elem-FUEGO', 'elem-AGUA', 'elem-TIERRA', 'elem-AIRE', 'elem-NEUTRO');
        eEmoji.classList.add(`elem-${enemy.element}`);
        
        renderStatusesSplitted('enemy-buffs', 'enemy-debuffs', enemy.statuses);
    }
}

function renderTurnQueue(currentActor) {
    const queueContainer = document.getElementById('combat-turn-queue');
    if (!queueContainer) return;
    
    if (!combatState.initiativeQueue || combatState.initiativeQueue.length === 0) {
        queueContainer.style.display = 'none';
        return;
    }
    
    queueContainer.style.display = 'flex';
    let html = `<span class="turn-queue-label">⚡ INICIATIVA:</span>`;
    
    html += combatState.initiativeQueue.map((item, idx) => {
        const isCurrent = (idx === combatState.queueIndex);
        const isEnemy = (item.type === 'ENEMY');
        const elemIcon = ELEMENT_EMOJIS[item.robot.element] || '';
        const name = item.robot.name.replace('Salvaje ', '').replace('ÉLITE ', '');
        const currentClass = isCurrent ? 'is-current' : '';
        const typeClass = isEnemy ? 'is-enemy' : 'is-player';
        const effectiveSpd = item.robot.getEffectiveSpeed ? item.robot.getEffectiveSpeed() : item.robot.spd;
        
        return `
            <div class="turn-queue-item ${typeClass} ${currentClass}" title="${item.robot.name} (Velocidad: ${effectiveSpd})">
                <span class="turn-queue-avatar">${elemIcon}</span>
                <span class="turn-queue-name">${name}</span>
                <span class="turn-queue-spd">⚡${effectiveSpd}</span>
            </div>
        `;
    }).join('');
    
    queueContainer.innerHTML = html;
}

function formatStatusLabel(type) {
    switch (type) {
        case 'MARCA_FUEGO': return 'Marca de Fuego 🔥';
        case 'MARCA_AGUA': return 'Marca de Agua 💦';
        case 'MARCA_TIERRA': return 'Marca de Tierra 🪨';
        case 'MARCA_AIRE': return 'Marca de Aire 💨';
        case 'BURN': return 'Quemadura';
        case 'STUN': return 'Aturdimiento';
        case 'BARRIER': return 'Barrera Plasma';
        case 'SHIELD': return 'Escudo';
        case 'DEFENDIENDO': return 'Defendiendo';
        case 'CORAZA_ESPINAS': return 'Coraza de Espinas';
        case 'SLOW': return 'Ralentización (-50% VEL)';
        case 'FROST': return 'Congelación (-20% PREC)';
        case 'BLIND': return 'Ceguera (-50% PREC)';
        case 'ARMOR_BREAK': return 'Rompearmaduras (-25% DEF)';
        default: 
            if (type && type.startsWith('MARCA_')) {
                return `Marca de ${type.replace('MARCA_', '')}`;
            }
            return type;
    }
}

function renderStatusesSplitted(buffId, debuffId, statuses) {
    const buffContainer = document.getElementById(buffId);
    const debuffContainer = document.getElementById(debuffId);
    
    if (!buffContainer || !debuffContainer) return;
    
    const isDebuff = (s) => ['BURN', 'STUN', 'SLOW', 'FROST', 'BLIND', 'ARMOR_BREAK'].includes(s.type) || s.type.startsWith('MARCA_');
    
    let buffs = (statuses || []).filter(s => !isDebuff(s));
    let debuffs = (statuses || []).filter(s => isDebuff(s));
    
    const getIcon = (type) => {
        if (type === 'SHIELD' || type === 'BARRIER') return '🛡️';
        if (type === 'EVADE') return '💨';
        if (type === 'DEFENDIENDO') return '🛡️';
        if (type === 'CORAZA_ESPINAS') return '🌵';
        if (type === 'BURN') return '🔥';
        if (type === 'STUN') return '⚡';
        if (type === 'SLOW') return '❄️';
        if (type === 'FROST') return '🧊';
        if (type === 'BLIND') return '👁️';
        if (type === 'ARMOR_BREAK') return '💔';
        
        if (type === 'MARCA_FUEGO') return '🔥';
        if (type === 'MARCA_AGUA') return '💧';
        if (type === 'MARCA_TIERRA') return '🪨';
        if (type === 'MARCA_AIRE') return '💨';
        
        return '✨';
    };

    const getStatusPill = (s, isBuff) => {
        let labelText = formatStatusLabel(s.type);
        let tooltipText = `${labelText}: ${s.duration} turnos`;
        if (s.type === 'SHIELD' && s.amount !== undefined) {
            tooltipText = `${labelText} (${s.amount} HP): ${s.duration} turnos`;
        } else if (s.type === 'DEFENDIENDO') {
            tooltipText = `${labelText}: Activo hasta tu próximo turno (-50% Daño recibido)`;
        } else if (s.type === 'CORAZA_ESPINAS') {
            tooltipText = `${labelText}: Activo hasta tu próximo turno (-50% Daño, refleja 50% y adhiere Marca de Tierra al atacante)`;
        } else if (s.type === 'BARRIER') {
            let casterText = s.casterName ? ` (Invocada por ${s.casterName})` : '';
            tooltipText = `${labelText}${casterText}: Bloquea 100% del daño recibido hasta el próximo turno del invocador`;
        }
        return `
            <div class="status-pill ${isBuff ? 'pill-buff' : 'pill-debuff'} status-${s.type.toLowerCase().replace('_', '-')}" data-tooltip="${tooltipText}">
                <span class="status-pill-icon">${getIcon(s.type)}</span>
                ${(s.type === 'DEFENDIENDO' || s.type === 'CORAZA_ESPINAS' || s.type === 'BARRIER') ? '' : `<span class="status-pill-turns">${s.duration}</span>`}
            </div>
        `;
    };

    if (buffs.length > 0) {
        buffContainer.style.display = 'flex';
        buffContainer.innerHTML = buffs.map(s => getStatusPill(s, true)).join('');
    } else {
        buffContainer.style.display = 'none';
        buffContainer.innerHTML = '';
    }
    
    if (debuffs.length > 0) {
        debuffContainer.style.display = 'flex';
        debuffContainer.innerHTML = debuffs.map(s => getStatusPill(s, false)).join('');
    } else {
        debuffContainer.style.display = 'none';
        debuffContainer.innerHTML = '';
    }
}

async function advanceTurnQueue() {
    if (combatState.isGameOver) return;
    
    // 1. Verificar si el enemigo ha sido derrotado
    if (combatState.enemy && combatState.enemy.hp <= 0) {
        await endCombat(true);
        return;
    }
    
    // 2. Verificar si todos los aliados están muertos
    const aliveAllies = GAME_STATE.team.filter(r => !r.isOffline && r.hp > 0);
    if (aliveAllies.length === 0) {
        combatState.isGameOver = true;
        logCombat('💀 ¡Todo el escuadrón ha caído fuera de combate!');
        await delay(1200);
        showScreen('screen-game-over');
        return;
    }
    
    // 3. Fin de ronda: si todos los combatientes de la cola ya actuaron
    if (combatState.queueIndex >= combatState.initiativeQueue.length) {
        logCombat(`--- Fin de Ronda ${combatState.round} ---`);
        
        // Procesar estados alterados de todos los aliados y enemigo
        let roundMessages = [];
        GAME_STATE.team.forEach((r, idx) => {
            if (!r.isOffline && r.hp > 0) {
                let msgs = r.updateStatuses();
                roundMessages.push(...msgs);
                let dmg = (msgs.damage !== undefined) ? msgs.damage : 0;
                let heal = (msgs.heal !== undefined) ? msgs.heal : 0;
                if (dmg > 0) {
                    showDamagePopup(dmg, false, idx, false);
                }
                if (heal > 0) {
                    if (dmg > 0) {
                        setTimeout(() => showHealPopup(heal, false, idx), 250);
                    } else {
                        showHealPopup(heal, false, idx);
                    }
                }
            }
        });
        if (combatState.enemy && combatState.enemy.hp > 0) {
            let msgs = combatState.enemy.updateStatuses();
            roundMessages.push(...msgs);
            let dmg = (msgs.damage !== undefined) ? msgs.damage : 0;
            let heal = (msgs.heal !== undefined) ? msgs.heal : 0;
            if (dmg > 0) {
                showDamagePopup(dmg, true, 0, false);
            }
            if (heal > 0) {
                if (dmg > 0) {
                    setTimeout(() => showHealPopup(heal, true, 0), 250);
                } else {
                    showHealPopup(heal, true, 0);
                }
            }
        }
        roundMessages.forEach(msg => logCombat(msg));
        
        // Mutadores de Élite al final de ronda
        const enemy = combatState.enemy;
        if (enemy && enemy.hp > 0 && enemy.mutator) {
            if (enemy.mutator.type === 'REGENERADOR') {
                let healAmt = enemy.heal(enemy.maxHp * 0.05);
                if (healAmt > 0) {
                    showHealPopup(healAmt, true, 0);
                }
                logCombat(`💀 [Élite] Regenerador curó ${healAmt} HP a ${enemy.name}.`);
            } else if (enemy.mutator.type === 'RABIA') {
                enemy.atk = Math.floor(enemy.atk * 1.05);
                logCombat(`💀 [Élite] Rabia incrementó el ATQ de ${enemy.name}.`);
            }
        }
        
        // Comprobar muertes por estados (Quemadura)
        if (enemy.hp <= 0) {
            await endCombat(true);
            return;
        }
        if (GAME_STATE.team.every(r => r.isOffline || r.hp <= 0)) {
            combatState.isGameOver = true;
            await delay(1200);
            showScreen('screen-game-over');
            return;
        }
        
        // Nueva ronda: regenerar cola de turnos con velocidades actualizadas
        combatState.round++;
        buildInitiativeQueue();
        renderPartyCombatUI();
        await delay(600);
        return advanceTurnQueue();
    }
    
    // 4. Obtener el combatiente actual en el turno
    const currentActor = combatState.initiativeQueue[combatState.queueIndex];
    
    // Si el robot murió o está offline durante la ronda, salta su turno
    if (currentActor.robot.hp <= 0 || currentActor.robot.isOffline) {
        combatState.queueIndex++;
        return advanceTurnQueue();
    }
    
    // Al iniciar el turno del combatiente, baja su postura defensiva, coraza de espinas o barreras que haya invocado
    if (currentActor.robot.hasStatus('DEFENDIENDO')) {
        currentActor.robot.removeStatus('DEFENDIENDO');
        logCombat(`🛡️ [${currentActor.robot.name}] finaliza su postura defensiva.`);
    }
    if (currentActor.robot.hasStatus('CORAZA_ESPINAS')) {
        currentActor.robot.removeStatus('CORAZA_ESPINAS');
        logCombat(`🌵 [${currentActor.robot.name}] finaliza su Coraza de Espinas.`);
    }

    // Expirar Barreras de Plasma invocadas por este combatiente
    if (GAME_STATE && GAME_STATE.team) {
        GAME_STATE.team.forEach(robot => {
            for (let i = robot.statuses.length - 1; i >= 0; i--) {
                let s = robot.statuses[i];
                if (s.type === 'BARRIER' && (s.casterId === currentActor.robot.id || (!s.casterId && robot === currentActor.robot))) {
                    robot.statuses.splice(i, 1);
                    logCombat(`🌊 La Barrera de Plasma sobre [${robot.name}] ha expirado.`);
                }
            }
        });
    }
    if (combatState.enemy) {
        for (let i = combatState.enemy.statuses.length - 1; i >= 0; i--) {
            let s = combatState.enemy.statuses[i];
            if (s.type === 'BARRIER' && (s.casterId === currentActor.robot.id || (!s.casterId && combatState.enemy === currentActor.robot))) {
                combatState.enemy.statuses.splice(i, 1);
                logCombat(`🌊 La Barrera de Plasma sobre [${combatState.enemy.name}] ha expirado.`);
            }
        }
    }

    // Renderizar la UI destacando al robot activo
    renderPartyCombatUI();
    
    // 5. Verificar si está aturdido (STUN)
    if (currentActor.robot.hasStatus('STUN')) {
        logCombat(`⚡ [${currentActor.robot.name}] está aturdido y pierde su turno.`);
        await delay(1000);
        combatState.queueIndex++;
        return advanceTurnQueue();
    }
    
    // 6. Ejecutar turno según el bando
    if (currentActor.type === 'PLAYER') {
        const effSpd = currentActor.robot.getEffectiveSpeed ? currentActor.robot.getEffectiveSpeed() : currentActor.robot.spd;
        logCombat(`👉 Turno de [${currentActor.robot.name}] (⚡Velocidad: ${effSpd})`);
        renderCombatActions(currentActor.robot, currentActor.allyIndex);
        // Espera a que el jugador haga clic en una acción
    } else if (currentActor.type === 'ENEMY') {
        showWaitingCombatActions(`TURNO DE [${currentActor.robot.name.toUpperCase()}] // EJECUTANDO ACCIÓN...`);
        await delay(800);
        await executeEnemyTurn(currentActor.robot);
        combatState.queueIndex++;
        advanceTurnQueue();
    }
}

function showWaitingCombatActions(msg = 'TURNO ENEMIGO EN PROCESO // CALCULANDO TELEMETRÍA...') {
    const container = document.getElementById('combat-actions');
    if (!container) return;
    container.innerHTML = `
        <div class="tactical-waiting-card">
            <span class="tactical-waiting-spinner">⏳</span>
            <span class="tactical-waiting-text">${msg}</span>
        </div>
    `;
}

function renderCombatActions(playerRobot, allyIndex, view = 'MAIN', activeSkillIdx = null) {
    const actionsContainer = document.getElementById('combat-actions');
    if (!actionsContainer) return;
    actionsContainer.innerHTML = '';
    
    if (combatState.isGameOver || !combatState.enemy || combatState.enemy.hp <= 0) return;
    
    const consumableCount = (GAME_STATE && GAME_STATE.inventory && GAME_STATE.inventory.items) ? GAME_STATE.inventory.items.length : 0;
    const effSpd = playerRobot.getEffectiveSpeed ? playerRobot.getEffectiveSpeed() : playerRobot.spd;
    
    let headerHtml = `
        <div class="tactical-box-header">
            <div class="tactical-header-left">
                <span class="tactical-indicator-pulse"></span>
                <span class="tactical-header-title">CONSOLA TÁCTICA // TURNO DE ${playerRobot.name.toUpperCase()}</span>
            </div>
            <div class="tactical-header-right">
                <span class="member-elem-badge elem-${playerRobot.element}">(${playerRobot.element})</span>
                <span class="member-lvl-badge">NV. ${playerRobot.level || 1}</span>
                <span class="tactical-spd-badge">⚡ ${effSpd} VEL</span>
            </div>
        </div>
    `;

    if (view === 'MAIN') {
        actionsContainer.innerHTML = `
            ${headerHtml}
            <div class="tactical-main-grid">
                <!-- 1. ATACAR -->
                <button class="tactical-cmd-btn cmd-attack" onclick="renderCombatActions(GAME_STATE.team[${allyIndex}], ${allyIndex}, 'ATTACK')">
                    <div class="cmd-icon">⚔️</div>
                    <div class="cmd-texts">
                        <span class="cmd-title">ATACAR</span>
                        <span class="cmd-sub">Básicos & Especiales</span>
                    </div>
                </button>

                <!-- 2. DEFENDER -->
                <button class="tactical-cmd-btn cmd-defend" onclick="executeDefend(${allyIndex})">
                    <div class="cmd-icon">🛡️</div>
                    <div class="cmd-texts">
                        <span class="cmd-title">DEFENDER</span>
                        <span class="cmd-sub">-50% Daño Recibido</span>
                    </div>
                </button>

                <!-- 3. INVENTARIO -->
                <button class="tactical-cmd-btn cmd-inventory" onclick="renderCombatActions(GAME_STATE.team[${allyIndex}], ${allyIndex}, 'ITEMS')">
                    <div class="cmd-icon">🎒</div>
                    <div class="cmd-texts">
                        <span class="cmd-title">INVENTARIO</span>
                        <span class="cmd-sub">${consumableCount} Consumibles</span>
                    </div>
                </button>

                <!-- 4. HISTORIAL -->
                <button class="tactical-cmd-btn cmd-history" onclick="openCombatHistory()">
                    <div class="cmd-icon">📜</div>
                    <div class="cmd-texts">
                        <span class="cmd-title">HISTORIAL</span>
                        <span class="cmd-sub">Registro de Batalla</span>
                    </div>
                </button>
            </div>
        `;
    } 
    else if (view === 'ATTACK') {
        const skillsHtml = playerRobot.skills.map((skill, skillIdx) => {
            const isBasic = (skillIdx === 0);
            const isChip = (skillIdx > 1);
            const isSpecial = (skillIdx === 1);
            
            const isLocked = (skill.currentCd > 0 || combatState.isProcessing);
            const cdBadge = skill.currentCd > 0 
                ? `<span class="skill-card-cd">⏳ ENFRIAMIENTO (${skill.currentCd})</span>` 
                : `<span class="skill-card-ready">⚡ LISTA</span>`;
            
            let typeTag = 'BÁSICO';
            let cardClass = 'skill-card-basic';
            let elemTag = playerRobot.element;
            
            if (isSpecial) {
                typeTag = 'ESPECIAL';
                cardClass = 'skill-card-special';
                elemTag = skill.elementOverride || playerRobot.element;
            } else if (isChip) {
                typeTag = 'CHIP MODULAR';
                cardClass = 'skill-card-chip';
                elemTag = skill.elementOverride || playerRobot.element;
            }

            return `
                <div class="tactical-skill-card ${cardClass} ${isLocked ? 'is-disabled' : ''}" 
                     ${isLocked ? '' : `onclick="onSelectSkill(${skillIdx}, ${allyIndex})"`}>
                    <div class="skill-card-top">
                        <span class="skill-type-badge elem-${elemTag}">${typeTag}</span>
                        ${cdBadge}
                    </div>
                    <div class="skill-card-name-row">
                        <span class="skill-name-text">${skill.name}</span>
                        <span class="member-elem-badge elem-${elemTag}">(${elemTag})</span>
                    </div>
                    <div class="skill-card-desc">${skill.desc || 'Ataque ofensivo.'}</div>
                </div>
            `;
        }).join('');

        actionsContainer.innerHTML = `
            ${headerHtml}
            <div class="tactical-sub-panel">
                <div class="tactical-sub-header">
                    <button class="btn-tactical-back" onclick="renderCombatActions(GAME_STATE.team[${allyIndex}], ${allyIndex}, 'MAIN')">
                        <span>◀ VOLVER AL MENÚ</span>
                    </button>
                    <span class="tactical-sub-title">SELECCIONAR ACCIÓN TÁCTICA</span>
                </div>
                <div class="tactical-skills-grid">
                    ${skillsHtml}
                </div>
            </div>
        `;
    }
    else if (view === 'SELECT_ALLY_TARGET') {
        const skill = (playerRobot && playerRobot.skills && activeSkillIdx !== null && activeSkillIdx !== undefined) ? playerRobot.skills[activeSkillIdx] : null;
        const aliveAllies = GAME_STATE.team
            .map((r, idx) => ({ robot: r, idx }))
            .filter(item => !item.robot.isOffline && item.robot.hp > 0);

        const alliesHtml = aliveAllies.map(item => {
            const r = item.robot;
            const idx = item.idx;
            const isSelf = (idx === allyIndex);
            const hpPercent = Math.max(0, Math.min(100, (r.hp / r.maxHp) * 100));

            return `
                <div class="tactical-ally-target-card ${isSelf ? 'is-self' : ''}">
                    <div class="ally-target-top">
                        <span class="ally-target-emoji elem-${r.element}">${r.emoji}</span>
                        <div class="ally-target-info">
                            <span class="ally-target-name">${r.name} ${isSelf ? '(Usuario)' : ''}</span>
                            <span class="member-elem-badge elem-${r.element}">(${r.element})</span>
                        </div>
                    </div>
                    <div class="ally-target-hp-row">
                        <span class="hud-hp-label">HP</span>
                        <span class="hud-hp-val">${r.hp}/${r.maxHp}</span>
                    </div>
                    <progress value="${hpPercent}" max="100"></progress>
                    <button class="btn-target-ally-cta" onclick="executePlayerTurn(${activeSkillIdx}, ${allyIndex}, ${idx})">
                        <span>🛡️ Proteger a ${r.name}</span>
                    </button>
                </div>
            `;
        }).join('');

        actionsContainer.innerHTML = `
            ${headerHtml}
            <div class="tactical-sub-panel">
                <div class="tactical-sub-header">
                    <button class="btn-tactical-back" onclick="renderCombatActions(GAME_STATE.team[${allyIndex}], ${allyIndex}, 'ATTACK')">
                        <span>◀ VOLVER A HABILIDADES</span>
                    </button>
                    <span class="tactical-sub-title">SELECCIONAR ALIADO OBJETIVO PARA ${skill ? skill.name.toUpperCase() : 'HABILIDAD'}</span>
                </div>
                <div class="tactical-allies-target-grid">
                    ${alliesHtml}
                </div>
            </div>
        `;
    }
    else if (view === 'ITEMS') {
        const items = (GAME_STATE && GAME_STATE.inventory && GAME_STATE.inventory.items) ? GAME_STATE.inventory.items : [];
        let itemsHtml = '';
        
        if (items.length === 0) {
            itemsHtml = `
                <div class="tactical-items-empty">
                    <div class="empty-icon">🎒</div>
                    <div class="empty-text">No tienes objetos consumibles en la mochila para usar en combate.</div>
                    <button class="btn-open-full-inv" onclick="openInventory()">
                        <span>🎒 Abrir Mochila Completa</span>
                    </button>
                </div>
            `;
        } else {
            itemsHtml = `
                <div class="tactical-items-grid">
                    ${items.map((item, idx) => `
                        <div class="tactical-item-card">
                            <div class="tactical-item-top">
                                <span class="tactical-item-emoji">${item.emoji}</span>
                                <span class="tactical-item-name">${item.name}</span>
                            </div>
                            <div class="tactical-item-desc">${item.desc}</div>
                            <button class="btn-use-item-cta" onclick="useCombatItem(${idx}, ${allyIndex})">
                                <span>⚡ Usar Objeto</span>
                            </button>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        actionsContainer.innerHTML = `
            ${headerHtml}
            <div class="tactical-sub-panel">
                <div class="tactical-sub-header">
                    <button class="btn-tactical-back" onclick="renderCombatActions(GAME_STATE.team[${allyIndex}], ${allyIndex}, 'MAIN')">
                        <span>◀ VOLVER AL MENÚ</span>
                    </button>
                    <span class="tactical-sub-title">SUMINISTROS TÁCTICOS (OBJETOS DE MOCHILA)</span>
                </div>
                ${itemsHtml}
            </div>
        `;
    }
}

async function useCombatItem(idx, activeAllyIndex) {
    if (combatState.isGameOver || combatState.isProcessing) return;
    let item = GAME_STATE.inventory.items[idx];
    let activeRobot = GAME_STATE.team[activeAllyIndex];
    let enemy = combatState.enemy;
    
    logCombat(`🎒 ¡[${activeRobot.name}] usa ${item.name}!`);
    
    if (item.type === ITEM_TYPES.NANOBOTS) {
        let healed = activeRobot.heal(activeRobot.maxHp * 0.4);
        if (healed > 0) {
            showHealPopup(healed, false, activeAllyIndex);
        }
        logCombat(`- ${activeRobot.name} recupera ${healed} HP.`);
        GAME_STATE.inventory.items.splice(idx, 1);
        renderPartyCombatUI();
        renderCombatActions(activeRobot, activeAllyIndex, 'ITEMS');
    } else if (item.type === ITEM_TYPES.PEM) {
        // Bomba PEM: Gasta acción de turno | Aturde por 1 turno
        combatState.isProcessing = true;
        enemy.addStatus({ type: 'STUN', duration: 1 });
        logCombat(`- ¡${enemy.name} es aturdido por 1 turno!`);
        GAME_STATE.inventory.items.splice(idx, 1);
        showWaitingCombatActions('⚡ DETONANDO BOMBA PEM...');
        triggerCombatAnim(true, 'ATTACK', activeAllyIndex);
        setTimeout(() => triggerCombatAnim(false, 'HIT', activeAllyIndex), 100);
        showHitAnimation('PEM', true, activeAllyIndex);
        await delay(500);
        renderPartyCombatUI();
        await delay(600);
        combatState.isProcessing = false;
        combatState.queueIndex++;
        advanceTurnQueue();
    } else if (item.type === ITEM_TYPES.SOBRECARGA) {
        // Núcleo Sobrecarga: Reduce 1 turno de CD a 1 robot (el activo)
        let reduced = 0;
        activeRobot.skills.forEach(s => {
            if (s.currentCd > 0) {
                s.currentCd = Math.max(0, s.currentCd - 1);
                reduced++;
            }
        });
        if (reduced > 0) {
            logCombat(`- Cooldowns de ${activeRobot.name} reducidos en 1 turno.`);
        } else {
            logCombat(`- Las habilidades de ${activeRobot.name} ya estaban listas.`);
        }
        GAME_STATE.inventory.items.splice(idx, 1);
        renderPartyCombatUI();
        renderCombatActions(activeRobot, activeAllyIndex, 'ITEMS');
    }
}

function onSelectSkill(skillIdx, allyIndex) {
    if (combatState.isGameOver || combatState.isProcessing) return;
    const ally = GAME_STATE.team[allyIndex];
    if (!ally) return;
    const skill = ally.skills[skillIdx];
    if (!skill || skill.currentCd > 0) return;

    if (skill.target === 'ALLY') {
        const aliveAllies = GAME_STATE.team
            .map((r, idx) => ({ robot: r, idx }))
            .filter(item => !item.robot.isOffline && item.robot.hp > 0);
        
        if (aliveAllies.length <= 1) {
            executePlayerTurn(skillIdx, allyIndex, allyIndex);
        } else {
            renderCombatActions(ally, allyIndex, 'SELECT_ALLY_TARGET', skillIdx);
        }
    } else {
        executePlayerTurn(skillIdx, allyIndex);
    }
}

async function executePlayerTurn(skillIndex, allyIndex, targetAllyIndex = null) {
    if (combatState.isGameOver || combatState.isProcessing) return;
    combatState.isProcessing = true;
    
    const ally = GAME_STATE.team[allyIndex];
    const skill = ally.skills[skillIndex];
    
    if (skill.currentCd > 0) {
        combatState.isProcessing = false;
        return;
    }
    
    let targetAlly = (targetAllyIndex !== null && GAME_STATE.team[targetAllyIndex]) ? GAME_STATE.team[targetAllyIndex] : ally;
    let actionDesc = (skill.target === 'ALLY' && targetAlly !== ally) 
        ? `⚡ [${ally.name.toUpperCase()}] APLICANDO ${skill.name.toUpperCase()} A [${targetAlly.name.toUpperCase()}]...`
        : `⚡ [${ally.name.toUpperCase()}] EJECUTANDO ${skill.name.toUpperCase()}...`;

    showWaitingCombatActions(actionDesc);
    
    // Ejecutar la acción del aliado contra el enemigo / aliado objetivo
    executeTurn(ally, skill, combatState.enemy, true, allyIndex, targetAllyIndex);
    
    // Esperar a que la animación de dash y golpe termine antes de re-renderizar la UI
    await delay(450);
    renderPartyCombatUI();
    await delay(650);
    
    combatState.isProcessing = false;
    combatState.queueIndex++;
    advanceTurnQueue();
}

async function executeDefend(allyIndex) {
    if (combatState.isGameOver || combatState.isProcessing) return;
    combatState.isProcessing = true;
    
    const ally = GAME_STATE.team[allyIndex];
    showWaitingCombatActions(`🛡️ [${ally.name.toUpperCase()}] ESTABLECIENDO POSTURA DEFENSIVA...`);
    logCombat(`[${ally.name}] toma posición defensiva (reduce 50% el daño recibido).`);
    ally.addStatus({ type: 'DEFENDIENDO', duration: 1 });
    
    showHitAnimation('SHIELD', false, allyIndex);
    await delay(350);
    renderPartyCombatUI();
    await delay(550);
    
    combatState.isProcessing = false;
    combatState.queueIndex++;
    advanceTurnQueue();
}

async function executeEnemyTurn(enemy) {
    if (combatState.isGameOver || enemy.hp <= 0) return;
    
    // 1. Elegir habilidad enemiga disponible (CD = 0)
    let validSkills = enemy.skills.filter(s => s.currentCd === 0);
    let enemySkill = validSkills[Math.floor(Math.random() * validSkills.length)];
    
    // 2. Elegir objetivo aliado vivo (prioriza Coraza de Espinas / Provocación)
    let aliveAllies = GAME_STATE.team
        .map((r, idx) => ({ robot: r, idx }))
        .filter(item => !item.robot.isOffline && item.robot.hp > 0);
    
    if (aliveAllies.length === 0) return;
    
    // Si hay aliados con Coraza de Espinas activa, obligar al enemigo a atacarlos (al de menor HP si hay varios)
    const tauntAllies = aliveAllies.filter(item => item.robot.hasStatus('CORAZA_ESPINAS'));
    let target;
    if (tauntAllies.length > 0) {
        target = tauntAllies.reduce((prev, curr) => (curr.robot.hp < prev.robot.hp ? curr : prev), tauntAllies[0]);
        logCombat(`🧲 ¡${enemy.name} es obligado a atacar a [${target.robot.name}] por su Coraza de Espinas!`);
    } else {
        // Buscar objetivo con ventaja elemental o menor HP
        target = aliveAllies.find(a => getMultiplier(enemy.element, a.robot.element) > 1.0) ||
                 aliveAllies.reduce((prev, curr) => (curr.robot.hp < prev.robot.hp ? curr : prev), aliveAllies[0]);
    }
    
    let targetAlly = target.robot;
    let targetIndex = target.idx;
    
    // 3. Ejecutar ataque enemigo (dispara dash enemigo y retroceso del aliado)
    executeTurn(enemy, enemySkill, targetAlly, false, targetIndex);
    
    // Esperar animación de dash
    await delay(450);
    
    // 4. Si el aliado muere
    if (targetAlly.hp <= 0) {
        targetAlly.hp = 0;
        targetAlly.isOffline = true;
        logCombat(`💀 ¡${targetAlly.name} ha caído fuera de combate!`);
    }
    
    renderPartyCombatUI();
    await delay(650);
}

function showComboPopup(reaction, isTargetEnemy, targetIndex = 0) {
    let containerId = isTargetEnemy ? 'enemy-hit-container' : `player-hit-container-${targetIndex}`;
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const popup = document.createElement('div');
    popup.className = 'combo-popup-banner';
    popup.style.borderColor = reaction.color;
    popup.innerHTML = `
        <span class="combo-popup-title" style="color: ${reaction.color}">${reaction.name}</span>
        <span class="combo-popup-desc">${reaction.desc}</span>
    `;
    container.appendChild(popup);
    
    setTimeout(() => popup.remove(), 1200);
}

function showDamagePopup(amount, isTargetEnemy, targetIndex = 0, isRed = false, isCrit = false) {
    let containerId = isTargetEnemy ? 'enemy-hit-container' : `player-hit-container-${targetIndex}`;
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const popup = document.createElement('div');
    popup.className = 'damage-popup-banner' + (isRed ? ' damage-popup-red' : '');
    
    const valText = amount > 0 ? `-${amount}` : (amount === 0 ? `🛡️ 0` : `${amount}`);
    
    popup.innerHTML = `
        ${isCrit ? '<span class="damage-popup-crit-tag">¡CRÍTICO!</span>' : ''}
        <span class="damage-popup-val">${valText}</span>
    `;
    container.appendChild(popup);
    
    setTimeout(() => {
        if (container.contains(popup)) {
            popup.remove();
        }
    }, 1100);
}

function showHealPopup(amount, isTargetEnemy, targetIndex = 0) {
    if (!amount || amount <= 0) return;
    let containerId = isTargetEnemy ? 'enemy-hit-container' : `player-hit-container-${targetIndex}`;
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const popup = document.createElement('div');
    popup.className = 'damage-popup-banner damage-popup-green';
    
    popup.innerHTML = `
        <span class="damage-popup-val">+${amount}</span>
    `;
    container.appendChild(popup);
    
    setTimeout(() => {
        if (container.contains(popup)) {
            popup.remove();
        }
    }, 1100);
}

function processElementalCombo(attackElement, defender, attacker, baseDmg) {
    let reaction = null;
    let finalDmg = baseDmg;
    
    // 1. Reacciones sobre MARCA_AGUA
    if (defender.hasStatus('MARCA_AGUA')) {
        if (attackElement === ELEMENTS.FUEGO) {
            // Vaporización (💦 + 🔥): 1.5x Daño (antes 2.0x)
            finalDmg = Math.floor(baseDmg * 1.5);
            reaction = { name: '¡VAPORIZACIÓN!', desc: '¡Daño térmico x1.5!', color: '#ff6b6b' };
            defender.removeStatus('MARCA_AGUA');
        } else if (attackElement === ELEMENTS.TIERRA) {
            // Lodo (💦 + 🪨): 1.2x Daño + Ralentización (-50% Vel por 2 turnos) (reemplaza el Stun)
            finalDmg = Math.floor(baseDmg * 1.2);
            defender.addStatus({ type: 'SLOW', duration: 2 });
            reaction = { name: '¡LODO!', desc: '¡Daño x1.2 + Ralentiza (-50% VEL 2T)!', color: '#feca57' };
            defender.removeStatus('MARCA_AGUA');
        } else if (attackElement === ELEMENTS.AIRE) {
            // Ventisca (💦 + 💨): 1.35x Daño + Congelación leve (-20% Precisión rival)
            finalDmg = Math.floor(baseDmg * 1.35);
            defender.addStatus({ type: 'FROST', duration: 2 });
            reaction = { name: '¡VENTISCA!', desc: '¡Daño x1.35 + Congelación (-20% PREC)!', color: '#48dbfb' };
            defender.removeStatus('MARCA_AGUA');
        }
    }
    // 2. Reacciones sobre MARCA_FUEGO
    else if (defender.hasStatus('MARCA_FUEGO')) {
        if (attackElement === ELEMENTS.AIRE) {
            // Tormenta Ígnea (🔥 + 💨): 1.3x Daño + Renueva la Quemadura a 3 turnos
            finalDmg = Math.floor(baseDmg * 1.3);
            defender.removeStatus('BURN');
            defender.addStatus({ type: 'BURN', duration: 3 });
            reaction = { name: '¡TORMENTA ÍGNEA!', desc: '¡Daño x1.3 + Renueva Quemadura (3T)!', color: '#ff4757' };
            defender.removeStatus('MARCA_FUEGO');
        } else if (attackElement === ELEMENTS.AGUA) {
            // Choque Térmico (🔥 + 💦): 1.45x Daño + Remueve ventajas/bufos del rival
            finalDmg = Math.floor(baseDmg * 1.45);
            if (defender.removeBuffs) {
                defender.removeBuffs();
            } else {
                const buffTypes = ['BARRIER', 'SHIELD', 'DEFENDIENDO', 'CORAZA_ESPINAS', 'EVADE'];
                defender.statuses = defender.statuses.filter(s => !buffTypes.includes(s.type));
            }
            reaction = { name: '¡CHOQUE TÉRMICO!', desc: '¡Daño x1.45 + Purga ventajas enemigas!', color: '#48dbfb' };
            defender.removeStatus('MARCA_FUEGO');
        } else if (attackElement === ELEMENTS.TIERRA) {
            // Erupción (🔥 + 🪨): 1.4x Daño + Rompearmaduras (-25% Defensa enemiga)
            finalDmg = Math.floor(baseDmg * 1.4);
            defender.addStatus({ type: 'ARMOR_BREAK', duration: 2 });
            reaction = { name: '¡ERUPCIÓN!', desc: '¡Daño x1.4 + Rompearmaduras (-25% DEF)!', color: '#ffa502' };
            defender.removeStatus('MARCA_FUEGO');
        }
    }
    // 3. Reacciones sobre MARCA_TIERRA
    else if (defender.hasStatus('MARCA_TIERRA')) {
        if (attackElement === ELEMENTS.FUEGO) {
            // Cristalización (🪨 + 🔥): 1.2x Daño + Escudo equivalente al 25% de la vida actual (antes 100% de barrera)
            finalDmg = Math.floor(baseDmg * 1.2);
            let shieldAmt = Math.max(1, Math.floor(attacker.hp * 0.25));
            attacker.removeStatus('SHIELD');
            attacker.addStatus({ type: 'SHIELD', duration: 2, amount: shieldAmt });
            reaction = { name: '¡CRISTALIZACIÓN!', desc: `¡Daño x1.2 + Escudo ${shieldAmt} HP (25% Vida)!`, color: '#feca57' };
            defender.removeStatus('MARCA_TIERRA');
        } else if (attackElement === ELEMENTS.AGUA) {
            // Erosión (🪨 + 💦): 1.3x Daño + Cura al usuario el 30% del daño infligido (antes 15% HP Máx plano)
            finalDmg = Math.floor(baseDmg * 1.3);
            reaction = { name: '¡EROSIÓN!', desc: '¡Daño x1.3 + Drena 30% del daño en HP!', color: '#2ed573', lifesteal: 0.30 };
            defender.removeStatus('MARCA_TIERRA');
        } else if (attackElement === ELEMENTS.AIRE) {
            // Tormenta de Arena (🪨 + 💨): 1.3x Daño + Ceguera (-50% Precisión en el siguiente ataque rival) (reemplaza el Stun)
            finalDmg = Math.floor(baseDmg * 1.3);
            defender.addStatus({ type: 'BLIND', duration: 1 });
            reaction = { name: '¡TORMENTA DE ARENA!', desc: '¡Daño x1.3 + Ceguera (-50% PREC próx. ataque)!', color: '#eccc68' };
            defender.removeStatus('MARCA_TIERRA');
        }
    }
    // 4. Reacciones sobre MARCA_AIRE
    else if (defender.hasStatus('MARCA_AIRE')) {
        if (attackElement === ELEMENTS.FUEGO) {
            // Deflagración (💨 + 🔥): 1.45x Daño directo puro (sin quemadura adicional)
            finalDmg = Math.floor(baseDmg * 1.45);
            reaction = { name: '¡DEFLAGRACIÓN!', desc: '¡Daño puro x1.45!', color: '#ff6348' };
            defender.removeStatus('MARCA_AIRE');
        } else if (attackElement === ELEMENTS.AGUA) {
            // Ciclón (💨 + 💦): 1.35x Daño + Retrasa el turno del rival al final de la ronda
            finalDmg = Math.floor(baseDmg * 1.35);
            reaction = { name: '¡CICLÓN!', desc: '¡Daño x1.35 + Retrasa turno rival!', color: '#70a1ff', delayTurn: true };
            defender.removeStatus('MARCA_AIRE');
        } else if (attackElement === ELEMENTS.TIERRA) {
            // Colapso Sísmico (💨 + 🪨): 1.4x Daño + Aturdimiento condicional con 40% de probabilidad (antes 100%)
            finalDmg = Math.floor(baseDmg * 1.4);
            let stunSuccess = Math.random() < 0.40;
            if (stunSuccess) {
                defender.addStatus({ type: 'STUN', duration: 1 });
                reaction = { name: '¡COLAPSO SÍSMICO!', desc: '¡Daño x1.4 + Aturdimiento (40%)!', color: '#a4b0be' };
            } else {
                reaction = { name: '¡COLAPSO SÍSMICO!', desc: '¡Daño x1.4 (Aturdimiento resistido)!', color: '#a4b0be' };
            }
            defender.removeStatus('MARCA_AIRE');
        }
    }
    
    return { finalDmg, reaction };
}

function executeTurn(attacker, skill, defender, isAttackerAlly, allyIndex = 0, targetAllyIndex = null) {
    logCombat(`[${attacker.name}] usa ${skill.name}`);
    skill.currentCd = skill.cd;
    
    // Animar al atacante saltando hacia adelante
    if (!skill.type.includes('BUFF')) {
        triggerCombatAnim(isAttackerAlly, 'ATTACK', allyIndex);
    }
    
    let attackElement = skill.elementOverride || attacker.element;

    // 1. Daño
    if (skill.type.includes('DAMAGE')) {
        let attackerAcc = attacker.getEffectiveAcc ? attacker.getEffectiveAcc() : attacker.acc;
        if (attacker.hasStatus('BLIND')) {
            attacker.removeStatus('BLIND');
            logCombat(`👁️ ¡[${attacker.name}] sufre Ceguera (-50% Precisión en este ataque)!`);
        }
        let hitChance = attackerAcc - defender.dodge;
        if (Math.random() * 100 > hitChance) {
            logCombat(`¡${defender.name} esquivó el ataque!`);
            triggerCombatAnim(!isAttackerAlly, 'DODGE', allyIndex);
            showDodgePopup(isAttackerAlly, allyIndex);
        } else {
            // Animar retroceso del defensor
            setTimeout(() => triggerCombatAnim(!isAttackerAlly, 'HIT', allyIndex), 100);
            
            let mult = getMultiplier(attackElement, defender.element);
            let baseDmg = Math.floor(attacker.atk * skill.power * mult);

            // Bonificaciones de daño de meta-progresión si el atacante es un aliado
            if (isAttackerAlly && typeof SkillsManager !== 'undefined') {
                // Potenciadores elementales
                let elemBoost = SkillsManager.getElementalBoost(attackElement);
                if (elemBoost > 0) baseDmg = Math.floor(baseDmg * (1 + elemBoost));

                // Núcleo Volcánico (Ignis +10% ATQ en combate)
                if (attacker.element === ELEMENTS.FUEGO && SkillsManager.hasSkill('starter_fire_buff')) {
                    baseDmg = Math.floor(baseDmg * 1.10);
                }

                // Neuro-Marcadores (+10% daño contra objetivos marcados)
                let hasMark = defender.statuses.some(s => s.type.startsWith('MARCA_'));
                if (hasMark) {
                    let markBoost = SkillsManager.getModifier('marked_target_damage', 0);
                    if (markBoost > 0) baseDmg = Math.floor(baseDmg * (1 + markBoost));
                }
            }

            const isBasicAttack = (skill.cd === 0);
            let isCrit = false;
            
            // Daño Crítico Global: Exclusivo de ataques básicos (skill.cd === 0)
            if (isBasicAttack) {
                let critRate = attacker.critChance || 5;
                if (Math.random() * 100 < critRate) {
                    let critMult = (isAttackerAlly && typeof SkillsManager !== 'undefined') 
                        ? SkillsManager.getCritDmgMultiplier() 
                        : 1.5;
                    baseDmg = Math.floor(baseDmg * critMult);
                    isCrit = true;
                    let critPctStr = Math.round((critMult - 1) * 100);
                    logCombat(`⚡💥 ¡Impacto Crítico de [${attacker.name}] (+${critPctStr}% Daño)!`);
                }
            }
            
            // Evaluar Sinergias y Reacciones Elementales
            let { finalDmg, reaction } = processElementalCombo(attackElement, defender, attacker, baseDmg);

            // Resonancia Reaccionaria: potenciar daño de combos para aliados
            if (reaction && isAttackerAlly && typeof SkillsManager !== 'undefined') {
                finalDmg = Math.floor(finalDmg * SkillsManager.getComboDamageMultiplier());
            }
            
            // Hacha: perfora 50% de barreras y defensas (75% si mejorada) + pasiva Hachas de Plasma
            let penetrationRatio = 0;
            if (attacker.equippedWeapon && attacker.equippedWeapon.type === WEAPON_TYPES.HACHA) {
                penetrationRatio = attacker.equippedWeapon.isUpgraded ? 0.75 : 0.50;
                if (isAttackerAlly && typeof SkillsManager !== 'undefined') {
                    penetrationRatio = Math.min(1.0, penetrationRatio + SkillsManager.getModifier('axe_penetration', 0));
                }
            }
            
            if (reaction) {
                showComboPopup(reaction, isAttackerAlly, allyIndex);
                logCombat(`💥⚡ [COMBO] ${reaction.name} ${reaction.desc}`);
            }

            let dmgDealt = defender.takeDamage(finalDmg, penetrationRatio, false, attacker);
            let multMsg = mult > 1 ? " ¡Súper efectivo!" : (mult < 1 ? " Poco efectivo..." : "");
            logCombat(`- Inflige ${dmgDealt} de daño a ${defender.name}.${multMsg}`);
            
            // Erosión: Cura al atacante el 30% del daño infligido
            if (reaction && reaction.lifesteal && dmgDealt > 0) {
                let healAmt = Math.max(1, Math.floor(dmgDealt * reaction.lifesteal));
                let actualHealed = attacker.heal(healAmt);
                if (actualHealed > 0) {
                    showHealPopup(actualHealed, !isAttackerAlly, isAttackerAlly ? allyIndex : 0);
                }
                logCombat(`- 🌿 [${attacker.name}] absorbe y recupera ${actualHealed} HP (30% del daño infligido).`);
            }

            // Ciclón: Retrasa el turno del rival al final de la ronda
            if (reaction && reaction.delayTurn && defender.hp > 0) {
                let defQueueIdx = combatState.initiativeQueue.findIndex((item, idx) => idx > combatState.queueIndex && item.robot === defender);
                if (defQueueIdx !== -1) {
                    let [delayedItem] = combatState.initiativeQueue.splice(defQueueIdx, 1);
                    combatState.initiativeQueue.push(delayedItem);
                    logCombat(`💨 ¡[${defender.name}] fue empujado al final de la ronda de turnos!`);
                    const currentActor = combatState.initiativeQueue[combatState.queueIndex];
                    renderTurnQueue(currentActor);
                }
            }

            // Mostrar número de daño (Rojo si es crítico o reacción elemental de marcas, Amarillo si es estándar)
            let isRedDamage = isCrit || (reaction !== null);
            showDamagePopup(dmgDealt, isAttackerAlly, allyIndex, isRedDamage, isCrit);
            
            // Mutador Élite Espinas
            if (defender.mutator && defender.mutator.type === 'ESPINAS' && dmgDealt > 0) {
                let recoil = Math.floor(dmgDealt * 0.15);
                if (recoil > 0) {
                    attacker.takeDamage(recoil, 0, true);
                    logCombat(`💀 [Élite] Espinas devuelve ${recoil} daño a ${attacker.name}.`);
                    setTimeout(() => showDamagePopup(recoil, !isAttackerAlly, allyIndex, false), 200);
                }
            }

            // Coraza de Espinas (Refleja daño y adhiere Marca de Tierra / detona reacción elemental con TIERRA)
            if (defender.hasStatus('CORAZA_ESPINAS') && finalDmg > 0) {
                let elemMultTierra = getMultiplier(ELEMENTS.TIERRA, attacker.element);
                let baseDmgTierra = Math.max(1, Math.floor(defender.atk * 1.0 * elemMultTierra));
                if (!isAttackerAlly && typeof SkillsManager !== 'undefined') {
                    let elemBoost = SkillsManager.getElementalBoost(ELEMENTS.TIERRA);
                    if (elemBoost > 0) baseDmgTierra = Math.floor(baseDmgTierra * (1 + elemBoost));
                }

                // Evaluar si el atacante ya tenía una marca activa para detonar reacción combinada
                let { finalDmg: reflectDmg, reaction: reflectReaction } = processElementalCombo(ELEMENTS.TIERRA, attacker, defender, baseDmgTierra);

                if (reflectReaction) {
                    if (!isAttackerAlly && typeof SkillsManager !== 'undefined') {
                        reflectDmg = Math.floor(reflectDmg * SkillsManager.getComboDamageMultiplier());
                    }
                    let actualReflected = attacker.takeDamage(reflectDmg, 0, true);
                    logCombat(`🌵 ¡[${defender.name}] reacciona con Coraza de Espinas e inflige ${actualReflected} de daño a [${attacker.name}]!`);
                    setTimeout(() => showDamagePopup(actualReflected, !isAttackerAlly, allyIndex, true), 200);
                    showComboPopup(reflectReaction, !isAttackerAlly, allyIndex);
                    logCombat(`💥⚡ [COMBO] ${reflectReaction.name} ${reflectReaction.desc}`);
                    showHitAnimation(ELEMENTS.TIERRA, !isAttackerAlly, allyIndex);

                    if (reflectReaction.lifesteal && actualReflected > 0) {
                        let healAmt = Math.max(1, Math.floor(actualReflected * reflectReaction.lifesteal));
                        let actualHealed = defender.heal(healAmt);
                        if (actualHealed > 0) {
                            showHealPopup(actualHealed, isAttackerAlly, isAttackerAlly ? 0 : allyIndex);
                        }
                        logCombat(`- 🌿 [${defender.name}] absorbe y recupera ${actualHealed} HP.`);
                    }

                    if (reflectReaction.delayTurn && attacker.hp > 0) {
                        let attQueueIdx = combatState.initiativeQueue.findIndex((item, idx) => idx > combatState.queueIndex && item.robot === attacker);
                        if (attQueueIdx !== -1) {
                            let [delayedItem] = combatState.initiativeQueue.splice(attQueueIdx, 1);
                            combatState.initiativeQueue.push(delayedItem);
                            logCombat(`💨 ¡[${attacker.name}] fue empujado al final de la ronda de turnos!`);
                            const currentActor = combatState.initiativeQueue[combatState.queueIndex];
                            renderTurnQueue(currentActor);
                        }
                    }
                } else {
                    // Reflejo estándar (50% del daño recibido) + Marca de Tierra si no hubo combo
                    let standardReflectDmg = Math.max(1, Math.floor(finalDmg * 0.50));
                    let actualReflected = attacker.takeDamage(standardReflectDmg, 0, true);
                    logCombat(`🌵 ¡[${defender.name}] refleja ${actualReflected} de daño a [${attacker.name}] con Coraza de Espinas!`);
                    setTimeout(() => showDamagePopup(actualReflected, !isAttackerAlly, allyIndex, false), 200);

                    attacker.statuses = attacker.statuses.filter(s => !s.type.startsWith('MARCA_'));
                    attacker.addStatus({ type: 'MARCA_TIERRA', duration: 3 });
                    logCombat(`- 🪨 Coraza de Espinas adhiere ${formatStatusLabel('MARCA_TIERRA')} a [${attacker.name}] (3 turnos).`);
                }
            }

            // Barrera de Plasma: Adhiere Marca de Agua de 3 turnos al atacante o detona reacción elemental con AGUA
            if (defender.hasStatus('BARRIER') && finalDmg > 0) {
                let elemMultAgua = getMultiplier(ELEMENTS.AGUA, attacker.element);
                let baseDmgAgua = Math.max(1, Math.floor(defender.atk * 1.0 * elemMultAgua));
                if (!isAttackerAlly && typeof SkillsManager !== 'undefined') {
                    let elemBoost = SkillsManager.getElementalBoost(ELEMENTS.AGUA);
                    if (elemBoost > 0) baseDmgAgua = Math.floor(baseDmgAgua * (1 + elemBoost));
                }

                // Evaluar si el atacante ya tenía una marca activa para detonar reacción combinada
                let { finalDmg: counterDmg, reaction: barrierReaction } = processElementalCombo(ELEMENTS.AGUA, attacker, defender, baseDmgAgua);

                if (barrierReaction) {
                    if (!isAttackerAlly && typeof SkillsManager !== 'undefined') {
                        counterDmg = Math.floor(counterDmg * SkillsManager.getComboDamageMultiplier());
                    }
                    let actualCounterDmg = attacker.takeDamage(counterDmg, 0, true);
                    logCombat(`🌊 ¡La Barrera de Plasma reacciona e inflige ${actualCounterDmg} de daño a [${attacker.name}]!`);
                    setTimeout(() => showDamagePopup(actualCounterDmg, !isAttackerAlly, allyIndex, true), 200);
                    showComboPopup(barrierReaction, !isAttackerAlly, allyIndex);
                    logCombat(`💥⚡ [COMBO] ${barrierReaction.name} ${barrierReaction.desc}`);
                    showHitAnimation(ELEMENTS.AGUA, !isAttackerAlly, allyIndex);

                    if (barrierReaction.lifesteal && actualCounterDmg > 0) {
                        let healAmt = Math.max(1, Math.floor(actualCounterDmg * barrierReaction.lifesteal));
                        let actualHealed = defender.heal(healAmt);
                        if (actualHealed > 0) {
                            showHealPopup(actualHealed, isAttackerAlly, isAttackerAlly ? 0 : allyIndex);
                        }
                        logCombat(`- 🌿 [${defender.name}] absorbe y recupera ${actualHealed} HP.`);
                    }

                    if (barrierReaction.delayTurn && attacker.hp > 0) {
                        let attQueueIdx = combatState.initiativeQueue.findIndex((item, idx) => idx > combatState.queueIndex && item.robot === attacker);
                        if (attQueueIdx !== -1) {
                            let [delayedItem] = combatState.initiativeQueue.splice(attQueueIdx, 1);
                            combatState.initiativeQueue.push(delayedItem);
                            logCombat(`💨 ¡[${attacker.name}] fue empujado al final de la ronda de turnos!`);
                            const currentActor = combatState.initiativeQueue[combatState.queueIndex];
                            renderTurnQueue(currentActor);
                        }
                    }
                } else {
                    // Si no hubo combo, aplicar Marca de Agua (3 turnos) al atacante
                    attacker.statuses = attacker.statuses.filter(s => !s.type.startsWith('MARCA_'));
                    attacker.addStatus({ type: 'MARCA_AGUA', duration: 3 });
                    logCombat(`- 🌊 La Barrera de Plasma adhiere ${formatStatusLabel('MARCA_AGUA')} a [${attacker.name}] (3 turnos).`);
                }
            }
            
            // Aplicar marca elemental si es habilidad especial
            if (skill.cd > 0 && attackElement !== ELEMENTS.NEUTRO) {
                let markType = `MARCA_${attackElement}`;
                defender.statuses = defender.statuses.filter(s => !s.type.startsWith('MARCA_'));
                defender.addStatus({ type: markType, duration: 3 });
                logCombat(`- Aplica ${formatStatusLabel(markType)} a ${defender.name} (3 turnos).`);
            }
            
            showHitAnimation(attackElement, isAttackerAlly, allyIndex);
            
            // Pasiva Daga: 25% doble ataque (40% si mejorada) + pasiva Dagas de Frecuencia
            let daggerExtraChance = (isAttackerAlly && typeof SkillsManager !== 'undefined') 
                ? SkillsManager.getModifier('dagger_double_chance', 0) 
                : 0;
            let daggerProb = (attacker.equippedWeapon && attacker.equippedWeapon.type === WEAPON_TYPES.DAGA)
                ? ((attacker.equippedWeapon.isUpgraded ? 0.4 : 0.25) + daggerExtraChance)
                : 0;

            if (daggerProb > 0 && Math.random() < daggerProb && attacker.hp > 0) {
                if (defender.hp > 0) {
                    logCombat(`¡Doble Golpe de Daga!`);
                    let hitChance2 = (attacker.getEffectiveAcc ? attacker.getEffectiveAcc() : attacker.acc) - defender.dodge;
                    if (Math.random() * 100 > hitChance2) {
                        logCombat(`¡${defender.name} esquivó el segundo golpe!`);
                        triggerCombatAnim(!isAttackerAlly, 'DODGE', allyIndex);
                        showDodgePopup(isAttackerAlly, allyIndex);
                    } else {
                        let daggerBaseDmg = baseDmg;
                        let isDaggerCrit = false;
                        if (isBasicAttack && Math.random() * 100 < (attacker.critChance || 5)) {
                            let critMult = (isAttackerAlly && typeof SkillsManager !== 'undefined') 
                                ? SkillsManager.getCritDmgMultiplier() 
                                : 1.5;
                            daggerBaseDmg = Math.floor(daggerBaseDmg * critMult);
                            isDaggerCrit = true;
                            logCombat(`⚡💥 ¡Segundo Golpe Crítico!`);
                        }
                        let dmgDealt2 = defender.takeDamage(daggerBaseDmg, penetrationRatio, false, attacker);
                        logCombat(`- Inflige ${dmgDealt2} de daño extra a ${defender.name}.`);
                        if (defender.hasStatus('CORAZA_ESPINAS') && daggerBaseDmg > 0) {
                            let daggerReflect = Math.max(1, Math.floor(daggerBaseDmg * 0.50));
                            let actualDaggerReflect = attacker.takeDamage(daggerReflect, 0, true);
                            logCombat(`🌵 ¡[${defender.name}] refleja ${actualDaggerReflect} de daño extra a [${attacker.name}] con Coraza de Espinas!`);
                            setTimeout(() => showDamagePopup(actualDaggerReflect, !isAttackerAlly, allyIndex, false), 350);
                        }
                        setTimeout(() => {
                            showHitAnimation(attackElement, isAttackerAlly, allyIndex);
                            showDamagePopup(dmgDealt2, isAttackerAlly, allyIndex, isDaggerCrit, isDaggerCrit);
                        }, 200);
                    }
                }
            }
        }
    }
    
    // 2. Estados alterados sobre el defensor
    if (skill.type.includes('STATUS')) {
        let hitChance = (attacker.getEffectiveAcc ? attacker.getEffectiveAcc() : attacker.acc) - defender.dodge;
        if (Math.random() * 100 > hitChance) {
            logCombat(`¡${defender.name} evadió el efecto!`);
            triggerCombatAnim(!isAttackerAlly, 'DODGE', allyIndex);
            showDodgePopup(isAttackerAlly, allyIndex);
        } else {
            if (!skill.type.includes('DAMAGE')) {
                setTimeout(() => triggerCombatAnim(!isAttackerAlly, 'HIT', allyIndex), 100);
            }
            
            let appliedStatus = JSON.parse(JSON.stringify(skill.status));
            // Napalm Sintético: +1 turno extra a las quemaduras aplicadas por aliados
            if (appliedStatus.type === 'BURN' && isAttackerAlly && typeof SkillsManager !== 'undefined') {
                appliedStatus.duration += SkillsManager.getModifier('burn_duration_extra', 0);
            }
            defender.addStatus(appliedStatus);
            logCombat(`- Aplica ${formatStatusLabel(appliedStatus.type)} a ${defender.name} por ${appliedStatus.duration} turnos.`);
            
            if (skill.cd > 0 && attackElement !== ELEMENTS.NEUTRO) {
                let markType = `MARCA_${attackElement}`;
                defender.statuses = defender.statuses.filter(s => !s.type.startsWith('MARCA_'));
                defender.addStatus({ type: markType, duration: 3 });
                logCombat(`- Aplica ${formatStatusLabel(markType)} a ${defender.name} (3 turnos).`);
            }
        }
    }
    
    // 3. Buffs sobre el atacante o aliado objetivo
    if (skill.type.includes('BUFF')) {
        let recipient = attacker;
        let recipientAllyIdx = allyIndex;
        let recipientIsEnemy = !isAttackerAlly;

        if (isAttackerAlly && skill.target === 'ALLY' && targetAllyIndex !== null && GAME_STATE.team[targetAllyIndex]) {
            recipient = GAME_STATE.team[targetAllyIndex];
            recipientAllyIdx = targetAllyIndex;
            recipientIsEnemy = false;
        }

        let appliedStatus = JSON.parse(JSON.stringify(skill.status));
        appliedStatus.casterId = attacker.id;
        appliedStatus.casterName = attacker.name;
        
        // Si ya tenía barrera previa, renovarla
        if (appliedStatus.type === 'BARRIER') {
            recipient.statuses = recipient.statuses.filter(s => s.type !== 'BARRIER');
        }
        recipient.addStatus(appliedStatus);

        if (skill.status.type === 'CORAZA_ESPINAS') {
            logCombat(`- [${attacker.name}] activa Coraza de Espinas (reduce 50% daño recibido y refleja 50% al atacante hasta su próximo turno).`);
            showHitAnimation('SHIELD', !isAttackerAlly, allyIndex);
        } else if (skill.status.type === 'BARRIER') {
            // Curar 5% de la vida máxima del que recibe la barrera
            let healAmt = Math.max(1, Math.floor(recipient.maxHp * 0.05));
            let actualHealed = recipient.heal(healAmt);
            if (actualHealed > 0) {
                showHealPopup(actualHealed, recipientIsEnemy, recipientAllyIdx);
            }
            logCombat(`🌊 [${attacker.name}] otorga Barrera de Plasma a [${recipient.name}] (100% protección hasta el próximo turno de ${attacker.name}) y le restaura ${actualHealed} HP.`);
            showHitAnimation('SHIELD', recipientIsEnemy, recipientAllyIdx);
        } else {
            logCombat(`- Obtiene ${formatStatusLabel(skill.status.type)} por ${skill.status.duration} turnos.`);
        }
        
        // Si el buff es elemental especial y NO es de reacción defensiva (como BARRIER o CORAZA_ESPINAS que aplican marca al recibir ataque), salpica marca al rival
        const isDefensiveReactionBuff = (skill.status && (skill.status.type === 'BARRIER' || skill.status.type === 'CORAZA_ESPINAS'));
        if (!isDefensiveReactionBuff && skill.cd > 0 && attackElement !== ELEMENTS.NEUTRO && defender && defender.hp > 0) {
            let markType = `MARCA_${attackElement}`;
            defender.statuses = defender.statuses.filter(s => !s.type.startsWith('MARCA_'));
            defender.addStatus({ type: markType, duration: 3 });
            logCombat(`- Salpica a ${defender.name} con ${formatStatusLabel(markType)} (3 turnos).`);
        }
    }

    // 4. Curación (Habilidades con efecto de curación o tipo HEAL)
    if (skill.type && (skill.type.includes('HEAL') || skill.healPower || skill.healPct)) {
        let healAmount = 0;
        if (skill.healPower) {
            healAmount = Math.floor(attacker.atk * skill.healPower);
        } else if (skill.healPct) {
            healAmount = Math.floor(attacker.maxHp * skill.healPct);
        } else {
            healAmount = Math.floor(attacker.maxHp * 0.3);
        }
        let actualHealed = attacker.heal(healAmount);
        if (actualHealed > 0) {
            showHealPopup(actualHealed, !isAttackerAlly, isAttackerAlly ? allyIndex : 0);
        }
        logCombat(`- 💚 [${attacker.name}] recupera ${actualHealed} HP.`);
    }
}

async function endCombat(victory) {
    combatState.isGameOver = true;

    // Limpiar estados, marcas, buffs, debuffs y cooldowns de todos los aliados al terminar el combate
    if (GAME_STATE && GAME_STATE.team) {
        GAME_STATE.team.forEach(robot => {
            if (robot.clearStatuses) robot.clearStatuses();
            else robot.statuses = [];
            if (robot.resetCooldowns) robot.resetCooldowns();
            else if (robot.skills) robot.skills.forEach(s => s.currentCd = 0);
        });
    }

    if (victory) {
        logCombat("🏆 ¡Victoria Táctica del Escuadrón!");
        await delay(1400);
        if (combatState.enemy && combatState.enemy.name === 'TITAN-X (Jefe)') {
            showScreen('screen-victory');
        } else {
            initPostBattle(combatState.enemy);
        }
    }
}

function logCombat(msg) {
    if (!combatState.fullLog) combatState.fullLog = [];
    combatState.fullLog.push(msg);
    
    const historyModalList = document.getElementById('history-log-list');
    if (historyModalList && document.getElementById('combat-history-modal')?.style.display === 'flex') {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'history-log-item';
        itemDiv.innerHTML = msg;
        historyModalList.appendChild(itemDiv);
        historyModalList.scrollTop = historyModalList.scrollHeight;
    }
}

function openCombatHistory() {
    const modal = document.getElementById('combat-history-modal');
    const list = document.getElementById('history-log-list');
    if (modal && list) {
        const logs = combatState.fullLog || [];
        if (logs.length === 0) {
            list.innerHTML = `
                <div class="history-empty-state">
                    <div class="empty-icon">📜</div>
                    <div class="empty-title">SIN REGISTROS EN ESTE ENCUENTRO</div>
                    <div class="empty-desc">Los eventos y cálculos de batalla se registrarán aquí en tiempo real a medida que avance el combate.</div>
                </div>
            `;
        } else {
            list.innerHTML = logs.map(msg => `<div class="history-log-item">${msg}</div>`).join('');
        }
        modal.style.display = 'flex';
        setTimeout(() => list.scrollTop = list.scrollHeight, 10);
    }
}

function closeCombatHistory() {
    const modal = document.getElementById('combat-history-modal');
    if (modal) modal.style.display = 'none';
}

function triggerCombatAnim(isPlayer, animType, allyIndex = 0) {
    const graphicId = isPlayer ? `player-emoji-${allyIndex}` : 'enemy-robot-emoji';
    const graphic = document.getElementById(graphicId);
    if (!graphic) return;
    
    let animClass = '';
    if (animType === 'ATTACK') {
        animClass = isPlayer ? 'anim-attack-player' : 'anim-attack-enemy';
    } else if (animType === 'HIT') {
        animClass = isPlayer ? 'anim-hit-player' : 'anim-hit-enemy';
    } else if (animType === 'DODGE') {
        animClass = isPlayer ? 'anim-dodge-player' : 'anim-dodge-enemy';
    }
    
    if (animClass) {
        graphic.classList.remove('anim-attack-player', 'anim-attack-enemy', 'anim-hit-player', 'anim-hit-enemy', 'anim-dodge-player', 'anim-dodge-enemy');
        void graphic.offsetWidth;
        graphic.classList.add(animClass);
        setTimeout(() => {
            graphic.classList.remove(animClass);
        }, 450);
    }
}

function showDodgePopup(isTargetEnemy, targetIndex = 0) {
    let containerId = isTargetEnemy ? 'enemy-hit-container' : `player-hit-container-${targetIndex}`;
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const popup = document.createElement('div');
    popup.className = 'dodge-popup-banner';
    popup.innerHTML = `
        <span class="dodge-popup-tag">💨 ¡ESQUIVADO!</span>
        <span class="dodge-popup-sub">Evasión 0 Daño</span>
    `;
    container.appendChild(popup);
    
    setTimeout(() => {
        if (container.contains(popup)) {
            popup.remove();
        }
    }, 1100);
}

function showHitAnimation(effectType, isTargetEnemy, allyIndex = 0) {
    let emoji = '💥';
    if (effectType === ELEMENTS.FUEGO) emoji = '🔥';
    else if (effectType === ELEMENTS.AGUA) emoji = '💦';
    else if (effectType === ELEMENTS.TIERRA) emoji = '🪨';
    else if (effectType === ELEMENTS.AIRE) emoji = '💨';
    else if (effectType === ELEMENTS.NEUTRO) emoji = '⚔️';
    else if (effectType === 'SHIELD') emoji = '🛡️';
    else if (effectType === 'PEM') emoji = '💥';

    let targetId = isTargetEnemy ? 'enemy-hit-container' : `player-hit-container-${allyIndex}`;
    const container = document.getElementById(targetId);
    if (!container) return;

    const hitDiv = document.createElement('div');
    hitDiv.className = 'hit-effect';
    hitDiv.innerText = emoji;
    
    container.appendChild(hitDiv);

    setTimeout(() => {
        if (container.contains(hitDiv)) {
            container.removeChild(hitDiv);
        }
    }, 500);
}

