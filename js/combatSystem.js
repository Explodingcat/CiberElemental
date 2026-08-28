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
    document.getElementById('combat-log').innerHTML = '';
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
    
    // 3. Ordenar estrictamente de mayor a menor Velocidad (SPD)
    queue.sort((a, b) => {
        if (b.robot.spd !== a.robot.spd) {
            return b.robot.spd - a.robot.spd;
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
        
        return `
            <div class="turn-queue-item ${typeClass} ${currentClass}" title="${item.robot.name} (Velocidad: ${item.robot.spd})">
                <span class="turn-queue-avatar">${elemIcon}</span>
                <span class="turn-queue-name">${name}</span>
                <span class="turn-queue-spd">⚡${item.robot.spd}</span>
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
        case 'DEFENDIENDO': return 'Defendiendo';
        case 'SLOW': return 'Ralentizado';
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
    
    const isDebuff = (s) => ['BURN', 'STUN', 'SLOW'].includes(s.type) || s.type.startsWith('MARCA_');
    
    let buffs = (statuses || []).filter(s => !isDebuff(s));
    let debuffs = (statuses || []).filter(s => isDebuff(s));
    
    const getIcon = (type) => {
        if (type === 'SHIELD' || type === 'BARRIER') return '🛡️';
        if (type === 'EVADE') return '💨';
        if (type === 'DEFENDIENDO') return '🛡️';
        if (type === 'BURN') return '🔥';
        if (type === 'STUN') return '⚡';
        if (type === 'SLOW') return '❄️';
        
        if (type === 'MARCA_FUEGO') return '🔥';
        if (type === 'MARCA_AGUA') return '💧';
        if (type === 'MARCA_TIERRA') return '🪨';
        if (type === 'MARCA_AIRE') return '💨';
        
        return '✨';
    };

    const getStatusPill = (s, isBuff) => `
        <div class="status-pill ${isBuff ? 'pill-buff' : 'pill-debuff'} status-${s.type.toLowerCase().replace('_', '-')}" data-tooltip="${formatStatusLabel(s.type)}: ${s.duration} turnos">
            <span class="status-pill-icon">${getIcon(s.type)}</span>
            <span class="status-pill-turns">${s.duration}</span>
        </div>
    `;

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
                let prevHp = r.hp;
                let msgs = r.updateStatuses();
                roundMessages.push(...msgs);
                if (prevHp > r.hp) {
                    showDamagePopup(prevHp - r.hp, false, idx, false);
                }
            }
        });
        if (combatState.enemy && combatState.enemy.hp > 0) {
            let prevHp = combatState.enemy.hp;
            let msgs = combatState.enemy.updateStatuses();
            roundMessages.push(...msgs);
            if (prevHp > combatState.enemy.hp) {
                showDamagePopup(prevHp - combatState.enemy.hp, true, 0, false);
            }
        }
        roundMessages.forEach(msg => logCombat(msg));
        
        // Mutadores de Élite al final de ronda
        const enemy = combatState.enemy;
        if (enemy && enemy.hp > 0 && enemy.mutator) {
            if (enemy.mutator.type === 'REGENERADOR') {
                let healAmt = enemy.heal(enemy.maxHp * 0.05);
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
        logCombat(`👉 Turno de [${currentActor.robot.name}] (⚡Velocidad: ${currentActor.robot.spd})`);
        renderCombatActions(currentActor.robot, currentActor.allyIndex);
        // Espera a que el jugador haga clic en una acción
    } else if (currentActor.type === 'ENEMY') {
        document.getElementById('combat-actions').innerHTML = '';
        await delay(800);
        await executeEnemyTurn(currentActor.robot);
        combatState.queueIndex++;
        advanceTurnQueue();
    }
}

function renderCombatActions(playerRobot, allyIndex) {
    const actionsContainer = document.getElementById('combat-actions');
    actionsContainer.innerHTML = '';
    
    if (combatState.isGameOver || !combatState.enemy || combatState.enemy.hp <= 0) return;
    
    // Habilidades del aliado activo
    playerRobot.skills.forEach((skill, skillIdx) => {
        const btn = document.createElement('button');
        btn.className = 'btn-combat-skill' + (skillIdx > 0 ? ' btn-special-skill' : '');
        let cdText = skill.currentCd > 0 ? `<span class="btn-cd-tag">⏳ ${skill.currentCd}</span>` : '';
        btn.innerHTML = `<span class="skill-btn-name">${skill.name}</span>${cdText}`;
        btn.title = skill.desc;
        btn.disabled = (skill.currentCd > 0 || combatState.isProcessing);
        btn.onclick = () => executePlayerTurn(skillIdx, allyIndex);
        actionsContainer.appendChild(btn);
    });
    
    // Defender
    const btnDefend = document.createElement('button');
    btnDefend.className = 'btn-combat-skill btn-combat-defend';
    btnDefend.innerHTML = `<span>🛡️ Defender</span>`;
    btnDefend.title = "Cura 5% HP y reduce el daño a la mitad este turno.";
    btnDefend.disabled = combatState.isProcessing;
    btnDefend.onclick = () => executeDefend(allyIndex);
    actionsContainer.appendChild(btnDefend);

    // Usar Objeto de Mochila
    if (GAME_STATE.inventory.items.length > 0) {
        const btnItem = document.createElement('button');
        btnItem.className = 'btn-combat-skill btn-combat-item';
        btnItem.innerHTML = `<span>🎒 Objeto (${GAME_STATE.inventory.items.length})</span>`;
        btnItem.disabled = combatState.isProcessing;
        btnItem.onclick = () => showItemsMenu(actionsContainer, allyIndex);
        actionsContainer.appendChild(btnItem);
    }
}

function showItemsMenu(container, allyIndex) {
    container.innerHTML = '<p style="margin:4px 0; font-size:12px; color:#66fcf1;">Usar objeto de mochila (Acción gratuita):</p>';
    GAME_STATE.inventory.items.forEach((item, idx) => {
        const btn = document.createElement('button');
        btn.innerText = `${item.emoji} ${item.name}`;
        btn.title = item.desc;
        btn.onclick = () => useCombatItem(idx, allyIndex);
        container.appendChild(btn);
    });
    const btnCancel = document.createElement('button');
    btnCancel.innerText = "Cancelar";
    btnCancel.onclick = () => renderCombatActions(GAME_STATE.team[allyIndex], allyIndex);
    container.appendChild(btnCancel);
}

async function useCombatItem(idx, activeAllyIndex) {
    if (combatState.isGameOver || combatState.isProcessing) return;
    let item = GAME_STATE.inventory.items[idx];
    let activeRobot = GAME_STATE.team[activeAllyIndex];
    let enemy = combatState.enemy;
    
    logCombat(`🎒 ¡[${activeRobot.name}] usa ${item.name}!`);
    
    if (item.type === ITEM_TYPES.NANOBOTS) {
        let healed = activeRobot.heal(activeRobot.maxHp * 0.4);
        logCombat(`- ${activeRobot.name} recupera ${healed} HP.`);
        GAME_STATE.inventory.items.splice(idx, 1);
        renderPartyCombatUI();
        renderCombatActions(activeRobot, activeAllyIndex);
    } else if (item.type === ITEM_TYPES.PEM) {
        // Bomba PEM: Gasta acción de turno | Aturde por 1 turno
        combatState.isProcessing = true;
        enemy.addStatus({ type: 'STUN', duration: 1 });
        logCombat(`- ¡${enemy.name} es aturdido por 1 turno!`);
        GAME_STATE.inventory.items.splice(idx, 1);
        document.getElementById('combat-actions').innerHTML = '';
        triggerCombatAnim(true, 'ATTACK', activeAllyIndex);
        setTimeout(() => triggerCombatAnim(false, 'HIT', activeAllyIndex), 100);
        showHitAnimation('SHIELD', true, activeAllyIndex);
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
        renderCombatActions(activeRobot, activeAllyIndex);
    }
}

async function executePlayerTurn(skillIndex, allyIndex) {
    if (combatState.isGameOver || combatState.isProcessing) return;
    combatState.isProcessing = true;
    
    // Ocultar botones durante la animación
    document.getElementById('combat-actions').innerHTML = '';
    
    const ally = GAME_STATE.team[allyIndex];
    const skill = ally.skills[skillIndex];
    
    if (skill.currentCd > 0) {
        combatState.isProcessing = false;
        return;
    }
    
    // Ejecutar la acción del aliado contra el enemigo (dispara el dash de ataque)
    executeTurn(ally, skill, combatState.enemy, true, allyIndex);
    
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
    
    document.getElementById('combat-actions').innerHTML = '';
    const ally = GAME_STATE.team[allyIndex];
    let healed = ally.heal(ally.maxHp * 0.05);
    logCombat(`[${ally.name}] toma posición defensiva. Recupera ${healed} HP.`);
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
    
    // 2. Elegir objetivo aliado vivo (prioriza debilidades o menor HP)
    let aliveAllies = GAME_STATE.team
        .map((r, idx) => ({ robot: r, idx }))
        .filter(item => !item.robot.isOffline && item.robot.hp > 0);
    
    if (aliveAllies.length === 0) return;
    
    // Buscar objetivo con ventaja elemental o menor HP
    let target = aliveAllies.find(a => getMultiplier(enemy.element, a.robot.element) > 1.0) ||
                 aliveAllies.reduce((prev, curr) => (curr.robot.hp < prev.robot.hp ? curr : prev), aliveAllies[0]);
    
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

function processElementalCombo(attackElement, defender, attacker, baseDmg) {
    let reaction = null;
    let finalDmg = baseDmg;
    
    // 1. Reacciones sobre MARCA_AGUA
    if (defender.hasStatus('MARCA_AGUA')) {
        if (attackElement === ELEMENTS.FUEGO) {
            finalDmg = Math.floor(baseDmg * 2.0);
            reaction = { name: '¡VAPORIZACIÓN!', desc: '¡Daño crítico x2.0!', color: '#ff6b6b' };
            defender.removeStatus('MARCA_AGUA');
        } else if (attackElement === ELEMENTS.TIERRA) {
            defender.addStatus({ type: 'STUN', duration: 1 });
            finalDmg = Math.floor(baseDmg * 1.3);
            reaction = { name: '¡LODO!', desc: '¡Aturde 1 turno!', color: '#feca57' };
            defender.removeStatus('MARCA_AGUA');
        } else if (attackElement === ELEMENTS.AIRE) {
            finalDmg = Math.floor(baseDmg * 1.5);
            reaction = { name: '¡VENTISCA!', desc: '¡Impacto gélido x1.5!', color: '#48dbfb' };
            defender.removeStatus('MARCA_AGUA');
        }
    }
    // 2. Reacciones sobre MARCA_FUEGO
    else if (defender.hasStatus('MARCA_FUEGO')) {
        if (attackElement === ELEMENTS.AIRE) {
            finalDmg = Math.floor(baseDmg * 1.4);
            defender.addStatus({ type: 'BURN', duration: 2 });
            reaction = { name: '¡TORMENTA ÍGNEA!', desc: '¡Quemadura Grave!', color: '#ff4757' };
            defender.removeStatus('MARCA_FUEGO');
        } else if (attackElement === ELEMENTS.AGUA) {
            finalDmg = Math.floor(baseDmg * 1.75);
            reaction = { name: '¡CHOQUE TÉRMICO!', desc: '¡Extinción x1.75!', color: '#48dbfb' };
            defender.removeStatus('MARCA_FUEGO');
        } else if (attackElement === ELEMENTS.TIERRA) {
            finalDmg = Math.floor(baseDmg * 1.5);
            defender.addStatus({ type: 'BURN', duration: 1 });
            reaction = { name: '¡ERUPCIÓN DE MAGMA!', desc: '¡Daño x1.5 + Quemadura!', color: '#ffa502' };
            defender.removeStatus('MARCA_FUEGO');
        }
    }
    // 3. Reacciones sobre MARCA_TIERRA
    else if (defender.hasStatus('MARCA_TIERRA')) {
        if (attackElement === ELEMENTS.FUEGO) {
            finalDmg = Math.floor(baseDmg * 1.3);
            attacker.addStatus({ type: 'BARRIER', duration: 2 });
            reaction = { name: '¡CRISTALIZACIÓN!', desc: '¡Gana Barrera de Plasma!', color: '#feca57' };
            defender.removeStatus('MARCA_TIERRA');
        } else if (attackElement === ELEMENTS.AGUA) {
            finalDmg = Math.floor(baseDmg * 1.5);
            let healed = attacker.heal(attacker.maxHp * 0.15);
            reaction = { name: '¡EROSIÓN!', desc: `¡Absorbe ${healed} HP!`, color: '#2ed573' };
            defender.removeStatus('MARCA_TIERRA');
        } else if (attackElement === ELEMENTS.AIRE) {
            finalDmg = Math.floor(baseDmg * 1.4);
            defender.addStatus({ type: 'STUN', duration: 1 });
            reaction = { name: '¡TORMENTA DE ARENA!', desc: '¡Ciega y aturde al objetivo!', color: '#eccc68' };
            defender.removeStatus('MARCA_TIERRA');
        }
    }
    // 4. Reacciones sobre MARCA_AIRE
    else if (defender.hasStatus('MARCA_AIRE')) {
        if (attackElement === ELEMENTS.FUEGO) {
            finalDmg = Math.floor(baseDmg * 1.6);
            defender.addStatus({ type: 'BURN', duration: 2 });
            reaction = { name: '¡DEFLAGRACIÓN!', desc: '¡Explosión x1.6 + Quemadura!', color: '#ff6348' };
            defender.removeStatus('MARCA_AIRE');
        } else if (attackElement === ELEMENTS.AGUA) {
            finalDmg = Math.floor(baseDmg * 1.6);
            reaction = { name: '¡CICLÓN TORMENTOSO!', desc: '¡Vórtice acuático x1.6!', color: '#70a1ff' };
            defender.removeStatus('MARCA_AIRE');
        } else if (attackElement === ELEMENTS.TIERRA) {
            finalDmg = Math.floor(baseDmg * 1.5);
            defender.addStatus({ type: 'STUN', duration: 1 });
            reaction = { name: '¡COLAPSO SÍSMICO!', desc: '¡Derriba y aturde al objetivo!', color: '#a4b0be' };
            defender.removeStatus('MARCA_AIRE');
        }
    }
    
    return { finalDmg, reaction };
}

function executeTurn(attacker, skill, defender, isAttackerAlly, allyIndex = 0) {
    logCombat(`[${attacker.name}] usa ${skill.name}`);
    skill.currentCd = skill.cd;
    
    // Animar al atacante saltando hacia adelante
    if (!skill.type.includes('BUFF')) {
        triggerCombatAnim(isAttackerAlly, 'ATTACK', allyIndex);
    }
    
    let attackElement = skill.elementOverride || attacker.element;

    // 1. Daño
    if (skill.type.includes('DAMAGE')) {
        let hitChance = attacker.acc - defender.dodge;
        if (Math.random() * 100 > hitChance) {
            logCombat(`¡${defender.name} esquivó el ataque!`);
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

            if (daggerProb > 0 && Math.random() < daggerProb) {
                if (defender.hp > 0) {
                    logCombat(`¡Doble Golpe de Daga!`);
                    let hitChance2 = attacker.acc - defender.dodge;
                    if (Math.random() * 100 > hitChance2) {
                        logCombat(`¡${defender.name} esquivó el segundo golpe!`);
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
        let hitChance = attacker.acc - defender.dodge;
        if (Math.random() * 100 > hitChance) {
            logCombat(`¡${defender.name} evadió el efecto!`);
        } else {
            if (!skill.type.includes('DAMAGE')) {
                setTimeout(() => triggerCombatAnim(!isAttackerAlly, 'HIT', allyIndex), 100);
            }
            
            // Verificación especial para Terremoto (60% prob. o 100% garantizado con Marca previa)
            let applyStatus = true;
            if (skill.name === 'Terremoto' && skill.status && skill.status.type === 'STUN') {
                let hasPreviousMark = defender.statuses.some(s => s.type.startsWith('MARCA_'));
                if (hasPreviousMark) {
                    logCombat(`🪨 ¡Marca previa detectada! Aturdimiento garantizado por Terremoto.`);
                } else if (Math.random() < 0.60) {
                    logCombat(`🪨 ¡Terremoto desestabilizó al enemigo (60% éxito)!`);
                } else {
                    applyStatus = false;
                    logCombat(`- [${defender.name}] resistió el aturdimiento de Terremoto.`);
                }
            }
            
            if (applyStatus) {
                let appliedStatus = JSON.parse(JSON.stringify(skill.status));
                // Napalm Sintético: +1 turno extra a las quemaduras aplicadas por aliados
                if (appliedStatus.type === 'BURN' && isAttackerAlly && typeof SkillsManager !== 'undefined') {
                    appliedStatus.duration += SkillsManager.getModifier('burn_duration_extra', 0);
                }
                defender.addStatus(appliedStatus);
                logCombat(`- Aplica ${formatStatusLabel(appliedStatus.type)} a ${defender.name} por ${appliedStatus.duration} turnos.`);
            }
            
            if (skill.cd > 0 && attackElement !== ELEMENTS.NEUTRO) {
                let markType = `MARCA_${attackElement}`;
                defender.statuses = defender.statuses.filter(s => !s.type.startsWith('MARCA_'));
                defender.addStatus({ type: markType, duration: 3 });
                logCombat(`- Aplica ${formatStatusLabel(markType)} a ${defender.name} (3 turnos).`);
            }
        }
    }
    
    // 3. Buffs sobre el atacante
    if (skill.type.includes('BUFF')) {
        attacker.addStatus(JSON.parse(JSON.stringify(skill.status)));
        logCombat(`- Obtiene ${formatStatusLabel(skill.status.type)} por ${skill.status.duration} turnos.`);
        
        // Si el buff es elemental especial, también salpica marca al rival
        if (skill.cd > 0 && attackElement !== ELEMENTS.NEUTRO && defender && defender.hp > 0) {
            let markType = `MARCA_${attackElement}`;
            defender.statuses = defender.statuses.filter(s => !s.type.startsWith('MARCA_'));
            defender.addStatus({ type: markType, duration: 3 });
            logCombat(`- Salpica a ${defender.name} con ${formatStatusLabel(markType)} (3 turnos).`);
        }
    }
}

async function endCombat(victory) {
    combatState.isGameOver = true;
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
    
    const log = document.getElementById('combat-log');
    if (log) {
        log.innerHTML += `<div>${msg}</div>`;
        log.scrollTop = log.scrollHeight;
    }
    
    const historyModalList = document.getElementById('history-log-list');
    if (historyModalList) {
        historyModalList.innerHTML += `<div>${msg}</div>`;
        historyModalList.scrollTop = historyModalList.scrollHeight;
    }
}

function openCombatHistory() {
    const modal = document.getElementById('combat-history-modal');
    const list = document.getElementById('history-log-list');
    if (modal && list) {
        list.innerHTML = (combatState.fullLog || []).map(msg => `<div>${msg}</div>`).join('');
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
    }
    
    if (animClass) {
        graphic.classList.remove('anim-attack-player', 'anim-attack-enemy', 'anim-hit-player', 'anim-hit-enemy');
        void graphic.offsetWidth;
        graphic.classList.add(animClass);
        setTimeout(() => {
            graphic.classList.remove(animClass);
        }, 400);
    }
}

function showHitAnimation(attackerElement, isPlayerAttacking, allyIndex = 0) {
    let emoji = '💥';
    if (attackerElement === ELEMENTS.FUEGO) emoji = '🔥';
    else if (attackerElement === ELEMENTS.AGUA) emoji = '💦';
    else if (attackerElement === ELEMENTS.TIERRA) emoji = '🪨';
    else if (attackerElement === ELEMENTS.AIRE) emoji = '💨';
    else if (attackerElement === ELEMENTS.NEUTRO) emoji = '⚔️';
    else if (attackerElement === 'SHIELD') emoji = '🛡️';

    let targetId = isPlayerAttacking ? 'enemy-hit-container' : `player-hit-container-${allyIndex}`;
    if (attackerElement === 'SHIELD') {
        targetId = isPlayerAttacking ? `player-hit-container-${allyIndex}` : 'enemy-hit-container';
    }
    
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

