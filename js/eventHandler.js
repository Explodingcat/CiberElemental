// eventHandler.js

let pendingChestReward = null;
let currentMysteryEvent = null;

function startEvent(type) {
    showScreen('screen-event');
    
    if (typeof SoundManager !== 'undefined') {
        SoundManager.playMusic('REST_LOUNGE');
    }

    const title = document.getElementById('event-title');
    const content = document.getElementById('event-content');
    const desc = document.getElementById('event-description');
    const actions = document.getElementById('event-actions');
    
    if (title) title.style.display = 'none';
    if (content) content.style.display = 'none';
    if (desc) desc.style.display = 'none';
    if (actions) actions.innerHTML = '';
    
    updateTeamUI();

    if (type === NODE_TYPES.CHEST) {
        initChestEvent();
    } else if (type === NODE_TYPES.REPAIR_SHOP) {
        initCampEvent();
    } else if (type === NODE_TYPES.SHOP) {
        initShopEvent();
    } else if (type === NODE_TYPES.MYSTERY) {
        initMysteryEvent();
    } else {
        initGenericEvent();
    }
}

function initChestEvent() {
    if (typeof SoundManager !== 'undefined') {
        SoundManager.play('chest_open');
    }
    const actions = document.getElementById('event-actions');
    if (!actions) return;
    
    let roll = Math.random();
    let unownedRelics = (typeof getRandomRelicPool === 'function' && typeof GAME_STATE !== 'undefined')
        ? getRandomRelicPool(1, GAME_STATE.relics)
        : [];
    
    let rewardType = 'WEAPON';
    if (unownedRelics.length > 0 && roll < 0.40) {
        rewardType = 'RELIC';
    } else if (roll < 0.70) {
        rewardType = 'WEAPON';
    } else {
        rewardType = 'CHIP';
    }
    
    let rewardObj = null;
    let cardContentHtml = '';
    let elemClass = '';
    let elemBadgeClass = '';
    let rewardName = '';
    let rewardEmoji = '';
    let rarityBadgeText = '';
    
    if (rewardType === 'RELIC') {
        const relic = unownedRelics[0];
        rewardObj = relic;
        rewardName = relic.name;
        rewardEmoji = relic.icon;
        elemClass = 'elem-relic';
        const rarityKey = relic.rarity ? relic.rarity.toLowerCase() : 'comun';
        elemBadgeClass = `badge-${rarityKey}`;
        rarityBadgeText = `✨ RELIQUIA // ${relic.rarity || 'PASIVA'}`;
        
        cardContentHtml = `
            <div class="chest-card-top">
                <span class="chest-badge relic-modal-rarity-badge ${elemBadgeClass}">${rarityBadgeText}</span>
                <span class="chest-type-tag">🔮 ${relic.category || 'PASIVA PERMANENTE'}</span>
            </div>
            <div class="chest-hero-visual">
                <div class="chest-holo-pedestal platform-relic rarity-${rarityKey}">
                    <div class="chest-reward-icon">${rewardEmoji}</div>
                </div>
                <div class="chest-reward-title">${relic.name}</div>
            </div>
            <div class="chest-reward-desc">
                ${relic.desc}
                ${relic.lore ? `<div style="margin-top:8px; font-size:11px; color:#8395a7; font-style:italic; border-top:1px solid rgba(255,255,255,0.06); padding-top:6px;">"${relic.lore}"</div>` : ''}
            </div>
        `;
    } else if (rewardType === 'WEAPON') {
        const weapon = generateRandomWeapon();
        weapon.isUpgraded = true;
        weapon.name += " +1";
        if (weapon.type === WEAPON_TYPES.DAGA) weapon.desc = '40% prob. doble ataque (con +1). Cada golpe puede aplicar marca.';
        if (weapon.type === WEAPON_TYPES.HACHA) weapon.desc = '+10% ATQ base. Perfora 75% defensas (con +1). 20% prob. Rompearmaduras. +45% Daño a ≤40% HP (Verdugo +1).';
        if (weapon.type === WEAPON_TYPES.BACULO) weapon.desc = 'Al finalizar turno: Escudo de plasma 15% HP Máx portador + micro-escudo 8% a un aliado. 20% prob. de reducir 1 CD.';
        if (weapon.type === WEAPON_TYPES.ESPADA) weapon.desc = '+30% Daño base y +20% Crítico (con +1). Críticos activan Racha (+10% ATQ).';
        
        rewardObj = weapon;
        rewardName = weapon.name;
        rewardEmoji = WEAPON_EMOJIS[weapon.type];
        elemClass = `elem-${weapon.element}`;
        elemBadgeClass = `elem-badge-${weapon.element}`;
        rarityBadgeText = `⭐ ARMA MEJORADA (+1) // ${weapon.element}`;
        
        cardContentHtml = `
            <div class="chest-card-top">
                <span class="chest-badge ${elemBadgeClass}">${rarityBadgeText}</span>
                <span class="chest-type-tag">⚔️ MÓDULO DE COMBATE</span>
            </div>
            <div class="chest-hero-visual">
                <div class="chest-holo-pedestal platform-${weapon.element}">
                    <div class="chest-reward-icon ${elemClass}">${rewardEmoji}</div>
                </div>
                <div class="chest-reward-title ${elemClass}">${weapon.name}</div>
            </div>
            <div class="chest-reward-desc">
                ${weapon.desc}
            </div>
        `;
    } else {
        let chipKeys = Object.keys(ITEM_TYPES).filter(k => k.includes('CHIP'));
        let randomChipType = ITEM_TYPES[chipKeys[Math.floor(Math.random() * chipKeys.length)]];
        let item = { type: randomChipType, ...ITEM_DEFS[randomChipType] };
        let chipElement = randomChipType.replace('CHIP_', '');
        
        rewardObj = item;
        rewardName = item.name;
        rewardEmoji = item.emoji;
        elemClass = `elem-${chipElement}`;
        elemBadgeClass = `elem-badge-${chipElement}`;
        rarityBadgeText = `💾 CHIP DE HABILIDAD // ${chipElement}`;
        
        let skillName = 'Técnica';
        if (randomChipType === 'CHIP_FUEGO') skillName = 'Lanzallamas';
        if (randomChipType === 'CHIP_AGUA') skillName = 'Geyser';
        if (randomChipType === 'CHIP_TIERRA') skillName = 'Fisura';
        if (randomChipType === 'CHIP_AIRE') skillName = 'Tornado';
        
        cardContentHtml = `
            <div class="chest-card-top">
                <span class="chest-badge ${elemBadgeClass}">${rarityBadgeText}</span>
                <span class="chest-type-tag">💾 EXPANSIÓN MODULAR</span>
            </div>
            <div class="chest-hero-visual">
                <div class="chest-holo-pedestal platform-${chipElement}">
                    <div class="chest-reward-icon ${elemClass}">${rewardEmoji}</div>
                </div>
                <div class="chest-reward-title ${elemClass}">${item.name}</div>
            </div>
            <div class="chest-reward-desc">
                Enseña la habilidad <strong>${skillName}</strong> (${chipElement}, CD 3, Potencia 2.0x). Aplica Marca de ${chipElement}.
            </div>
        `;
    }
    
    pendingChestReward = { type: rewardType, data: rewardObj };
    
    actions.innerHTML = `
        <div class="event-panel-container">
            <div class="event-header-panel">
                <div class="event-header-badge">🎁 BÚNKER DE RECURSOS // ALMACÉN ABANDONADO</div>
                <h1 class="event-main-title">COFRE ABANDONADO</h1>
                <p class="event-subtitle">Has abierto un contenedor sellado de alta tecnología intacto en el sector.</p>
            </div>
            
            <div class="chest-showcase-box">
                <div class="chest-reward-card card-${elemClass}">
                    ${cardContentHtml}
                </div>
            </div>
            
            <div class="event-bottom-actions">
                <button class="btn-event-cta btn-chest-claim" onclick="claimPendingChestReward()">
                    <span class="btn-icon">🎒</span> GUARDAR EN MOCHILA Y CONTINUAR <span class="btn-arrow">➔</span>
                </button>
            </div>
        </div>
    `;
    
    updateTeamUI();
}

function claimPendingChestReward() {
    if (pendingChestReward) {
        const { type, data } = pendingChestReward;
        if (type === 'WEAPON') {
            GAME_STATE.inventory.weapons.push(data);
        } else if (type === 'CHIP') {
            GAME_STATE.inventory.items.push(data);
        } else if (type === 'RELIC') {
            if (typeof RelicsManager !== 'undefined') {
                RelicsManager.addRelic(data.id);
                RelicsManager.showRelicAcquiredToast(data);
            } else {
                if (!GAME_STATE.relics) GAME_STATE.relics = [];
                if (!GAME_STATE.relics.includes(data.id)) GAME_STATE.relics.push(data.id);
            }
        }
        pendingChestReward = null;
    }
    advanceFloor();
}

let campOperationsRemaining = 1;

function initCampEvent(isContinuing = false) {
    const actions = document.getElementById('event-actions');
    if (!actions) return;
    
    if (!isContinuing) {
        campOperationsRemaining = (typeof RelicsManager !== 'undefined') ? RelicsManager.getCampMaxOperations() : 1;
    }
    
    let healPct = (typeof SkillsManager !== 'undefined') ? SkillsManager.getRepairShopHealPct() : 0.30;
    let revivePct = (typeof SkillsManager !== 'undefined') ? SkillsManager.getReviveHpPct() : 0.10;
    let healPctStr = Math.round(healPct * 100);
    let revivePctStr = Math.round(revivePct * 100);
    
    const canHeal = (typeof RelicsManager !== 'undefined') ? RelicsManager.canCampHeal() : true;
    const isForgeFree = (typeof RelicsManager !== 'undefined') ? RelicsManager.isCampForgeFree() : false;
    const hasKitForja = (typeof RelicsManager !== 'undefined' && RelicsManager.hasRelic('kit_forja_avanzada'));
    
    let subtitleExtra = '';
    if (hasKitForja) {
        subtitleExtra = ` <span style="color:#66fcf1; font-weight:700;">[⚡ Kit de Forja Avanzada: ${campOperationsRemaining} acción(es) disponible(s)]</span>`;
    }
    
    let healButtonHtml = '';
    let healDescHtml = '';
    if (!canHeal) {
        healButtonHtml = `
            <button class="btn-camp-action" disabled style="opacity:0.45; cursor:not-allowed; border-color:#eb4d4b; color:#eb4d4b; background:rgba(235,77,75,0.1);">
                <span class="btn-icon">🔒</span> BLOQUEADO (Pacto)
            </button>
        `;
        healDescHtml = `<span style="color:#eb4d4b;">⚠️ Pacto del Desguazador activo:</span> Los nanobots de curación han sido transmutados a chatarra. La reparación está deshabilitada.`;
    } else {
        healButtonHtml = `
            <button class="btn-camp-action btn-camp-heal" onclick="executeCampRepair(${healPct}, ${revivePct})">
                <span class="btn-icon">🔧</span> Reparar Escuadrón
            </button>
        `;
        healDescHtml = `Restaura un <strong>${healPctStr}% de salud máxima</strong> a todo el escuadrón y reactiva a los aliados caídos con <strong>${revivePctStr}% HP</strong>.`;
    }
    
    let forgeBadgeHtml = isForgeFree
        ? `<span class="camp-op-badge" style="background:rgba(235,77,75,0.2); color:#eb4d4b; border:1px solid #eb4d4b;">GRATIS / PACTO</span>`
        : `<span class="camp-op-badge badge-gold">HERRERÍA</span>`;

    actions.innerHTML = `
        <div class="event-panel-container">
            <div class="event-header-panel">
                <div class="event-header-badge">⛺ REFUGIO SECTORIAL // TALLER DE CAMPO</div>
                <h1 class="event-main-title">CAMPAMENTO TÁCTICO</h1>
                <p class="event-subtitle">Estación segura de mantenimiento. Selecciona una operación para tu escuadrón:${subtitleExtra}</p>
            </div>
            
            <div class="camp-operations-grid">
                <!-- Tarjeta 1: Reparar -->
                <div class="camp-op-card ${!canHeal ? 'camp-op-locked' : ''}">
                    <div class="camp-op-top">
                        <span class="camp-op-badge ${canHeal ? 'badge-green' : ''}" style="${!canHeal ? 'background:rgba(235,77,75,0.15); color:#eb4d4b; border:1px solid #eb4d4b;' : ''}">${canHeal ? 'RESTAURACIÓN' : 'INHABILITADO'}</span>
                        <div class="camp-op-stat" style="${!canHeal ? 'color:#eb4d4b;' : ''}">${canHeal ? '+' + healPctStr + '% HP' : '0% HP'}</div>
                    </div>
                    <div class="camp-op-icon">${canHeal ? '🔧' : '🚫'}</div>
                    <div class="camp-op-title">Reparación Integral</div>
                    <div class="camp-op-desc">
                        ${healDescHtml}
                    </div>
                    <div class="camp-op-footer">
                        ${healButtonHtml}
                    </div>
                </div>

                <!-- Tarjeta 2: Entrenar -->
                <div class="camp-op-card">
                    <div class="camp-op-top">
                        <span class="camp-op-badge badge-purple">ENTRENAMIENTO</span>
                        <div class="camp-op-stat">+300 XP</div>
                    </div>
                    <div class="camp-op-icon">💪</div>
                    <div class="camp-op-title">Calibración de Datos</div>
                    <div class="camp-op-desc">
                        Inyecta simulaciones de combate en un robot aliado, otorgándole <strong>300 puntos de Experiencia (XP)</strong> inmediatos.
                    </div>
                    <div class="camp-op-footer">
                        <button class="btn-camp-action btn-camp-train" onclick="showCampTrainingPicker()">
                            <span class="btn-icon">💪</span> Seleccionar Robot
                        </button>
                    </div>
                </div>

                <!-- Tarjeta 3: Forjar -->
                <div class="camp-op-card">
                    <div class="camp-op-top">
                        ${forgeBadgeHtml}
                        <div class="camp-op-stat">MEJORA +1</div>
                    </div>
                    <div class="camp-op-icon">⚒️</div>
                    <div class="camp-op-title">Forja de Blindaje</div>
                    <div class="camp-op-desc">
                        Mejora un arma equipada que no haya sido forjada al grado <strong>+1</strong>, incrementando sus pasivas y letalidad.
                    </div>
                    <div class="camp-op-footer">
                        <button class="btn-camp-action btn-camp-forge" onclick="showCampForgePicker()">
                            <span class="btn-icon">⚒️</span> Mejorar Arma
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    updateTeamUI();
}

function executeCampRepair(healPct, revivePct) {
    if (typeof SoundManager !== 'undefined') SoundManager.play('camp_repair');
    GAME_STATE.team.forEach(r => {
        if (r.isOffline) {
            r.isOffline = false;
            r.hp = Math.max(1, Math.floor(r.maxHp * revivePct));
        } else {
            r.heal(r.maxHp * healPct);
        }
    });
    
    campOperationsRemaining--;
    const hasMore = campOperationsRemaining > 0;
    let msg = `🔧 Los sistemas de soporte vital restauraron a tu escuadrón. Todos los robots recuperaron energía y están listos para continuar.`;
    if (hasMore) {
        msg += `<br><br><span style="color:#66fcf1; font-weight:700;">⚡ ¡Kit de Forja Avanzada te otorga 1 operación adicional en este campamento!</span>`;
    }
    renderEventResultUI("Campamento de Reparación", msg, hasMore);
}

function showCampTrainingPicker() {
    const actions = document.getElementById('event-actions');
    if (!actions) return;
    
    const unitCards = GAME_STATE.team.map((r, idx) => {
        const xpPercent = Math.max(0, Math.min(100, Math.round(((r.xp || 0) / (r.xpToNext || 100)) * 100)));
        return `
            <div class="camp-select-card" onclick="executeCampTraining(${idx})">
                <div class="camp-select-header">
                    <span class="member-elem-badge elem-${r.element}">${r.element}</span>
                    <span class="member-lvl-badge">NV. ${r.level}</span>
                </div>
                <div class="camp-select-emoji elem-${r.element}">${r.emoji}</div>
                <div class="camp-select-name">${r.name}</div>
                <div class="camp-select-xp-row">
                    <span>XP: ${r.xp}/${r.xpToNext}</span>
                </div>
                <div class="member-track">
                    <div class="member-fill member-xp-fill" style="width: ${xpPercent}%;"></div>
                </div>
                <button class="btn-camp-select-cta">
                    <span>💪 Otorgar +300 XP</span>
                </button>
            </div>
        `;
    }).join('');
    
    actions.innerHTML = `
        <div class="event-panel-container">
            <div class="event-header-panel">
                <div class="event-header-badge">💪 ENTRENAMIENTO // CALIBRACIÓN DE DATOS</div>
                <h1 class="event-main-title">SELECCIONA UN ROBOT</h1>
                <p class="event-subtitle">Elige qué unidad recibirá los 300 puntos de experiencia técnica:</p>
            </div>
            
            <div class="camp-select-grid">
                ${unitCards}
            </div>
            
            <div class="event-bottom-actions">
                <button class="btn-camp-back" onclick="initCampEvent(true)">
                    <span>◀ Volver a Opciones</span>
                </button>
            </div>
        </div>
    `;
}

function executeCampTraining(robotIndex) {
    const robot = GAME_STATE.team[robotIndex];
    if (!robot) return;
    if (typeof SoundManager !== 'undefined') SoundManager.play('ui_equip');
    let leveledUp = robot.gainXp(300);
    let msg = `💪 [${robot.name}] absorbió los paquetes de datos y ganó <strong>+300 XP</strong>.${leveledUp ? ` ¡Subió al <strong>Nivel ${robot.level}</strong>!` : ''}`;
    
    campOperationsRemaining--;
    const hasMore = campOperationsRemaining > 0;
    if (hasMore) {
        msg += `<br><br><span style="color:#66fcf1; font-weight:700;">⚡ ¡Kit de Forja Avanzada te otorga 1 operación adicional en este campamento!</span>`;
    }
    renderEventResultUI("Calibración Completada", msg, hasMore);
}

function showCampForgePicker() {
    const actions = document.getElementById('event-actions');
    if (!actions) return;
    
    const eligible = GAME_STATE.team.filter(r => r.equippedWeapon && !r.equippedWeapon.isUpgraded);
    
    if (eligible.length === 0) {
        actions.innerHTML = `
            <div class="event-panel-container">
                <div class="event-header-panel">
                    <div class="event-header-badge">⚒️ FORJA // MEJORA DE ARMAMENTO</div>
                    <h1 class="event-main-title">SIN ARMAS DISPONIBLES</h1>
                    <p class="event-subtitle">Ningún robot de tu escuadrón tiene un arma equipada que pueda mejorarse (o ya están al nivel +1).</p>
                </div>
                <div class="event-bottom-actions">
                    <button class="btn-camp-back" onclick="initCampEvent(true)">
                        <span>◀ Volver a Opciones</span>
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    const weaponCards = eligible.map(r => {
        const w = r.equippedWeapon;
        return `
            <div class="camp-select-card card-elem-${w.element}" onclick="executeCampForge('${r.id}')">
                <div class="camp-select-header">
                    <span class="member-elem-badge elem-${w.element}">${w.element}</span>
                    <span class="member-lvl-badge">Equipada en ${r.name}</span>
                </div>
                <div class="camp-select-emoji elem-${w.element}">${WEAPON_EMOJIS[w.type]}</div>
                <div class="camp-select-name elem-${w.element}">${w.name} ➔ ${w.name} +1</div>
                <div class="camp-select-desc">${w.desc}</div>
                <button class="btn-camp-select-cta">
                    <span>⚒️ Mejorar a +1</span>
                </button>
            </div>
        `;
    }).join('');
    
    actions.innerHTML = `
        <div class="event-panel-container">
            <div class="event-header-panel">
                <div class="event-header-badge">⚒️ FORJA // MEJORA DE ARMAMENTO</div>
                <h1 class="event-main-title">SELECCIONA EL ARMA A FORJAR</h1>
                <p class="event-subtitle">Elige el arma equipada que deseas potenciar al nivel +1:</p>
            </div>
            
            <div class="camp-select-grid">
                ${weaponCards}
            </div>
            
            <div class="event-bottom-actions">
                <button class="btn-camp-back" onclick="initCampEvent(true)">
                    <span>◀ Volver a Opciones</span>
                </button>
            </div>
        </div>
    `;
}

function executeCampForge(robotId) {
    const robot = GAME_STATE.team.find(r => r.id === robotId);
    if (!robot || !robot.equippedWeapon) return;
    
    if (typeof SoundManager !== 'undefined') SoundManager.play('camp_repair');
    const w = robot.equippedWeapon;
    w.isUpgraded = true;
    w.name += ' +1';
    if (w.type === WEAPON_TYPES.DAGA) w.desc = '40% prob. doble ataque (con +1). Cada golpe puede aplicar marca.';
    if (w.type === WEAPON_TYPES.HACHA) w.desc = '+10% ATQ base. Perfora 75% defensas (con +1). 20% prob. Rompearmaduras. +45% Daño a ≤40% HP (Verdugo +1).';
    if (w.type === WEAPON_TYPES.BACULO) w.desc = 'Al finalizar turno: Escudo de plasma 15% HP Máx portador + micro-escudo 8% a un aliado. 20% prob. de reducir 1 CD.';
    if (w.type === WEAPON_TYPES.ESPADA) w.desc = '+30% Daño base y +20% Crítico (con +1). Críticos activan Racha (+10% ATQ).';
    robot.recalculateStats();
    
    let msg = `⚒️ ¡El arma <strong>${w.name}</strong> de <strong>${robot.name}</strong> ha sido forjada con éxito al grado +1!`;
    campOperationsRemaining--;
    const hasMore = campOperationsRemaining > 0;
    if (hasMore) {
        msg += `<br><br><span style="color:#66fcf1; font-weight:700;">⚡ ¡Kit de Forja Avanzada te otorga 1 operación adicional en este campamento!</span>`;
    }
    renderEventResultUI("Forja Exitosa", msg, hasMore);
}

function initMysteryEvent() {
    const actions = document.getElementById('event-actions');
    if (!actions) return;
    
    let event = MYSTERY_EVENTS[Math.floor(Math.random() * MYSTERY_EVENTS.length)];
    
    const choicesHtml = event.choices.map((choice, cIdx) => {
        const canExecute = !choice.condition || choice.condition();
        return `
            <button class="btn-mystery-choice ${canExecute ? 'can-choose' : 'cannot-choose'}" 
                    ${canExecute ? `onclick="executeMysteryChoice(${cIdx})"` : 'disabled'}>
                <div class="choice-content">
                    <span class="choice-icon">${canExecute ? '⚡' : '🔒'}</span>
                    <span class="choice-label">${choice.label}</span>
                </div>
                ${!canExecute ? '<span class="choice-locked-tag">Requisito no cumplido</span>' : '<span class="choice-arrow">➔</span>'}
            </button>
        `;
    }).join('');
    
    currentMysteryEvent = event;
    
    actions.innerHTML = `
        <div class="event-panel-container">
            <div class="event-header-panel">
                <div class="event-header-badge">❓ ANOMALÍA DETECTADA // REGISTRO SECTORIAL</div>
                <h1 class="event-main-title">${event.title}</h1>
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
                        "${event.desc}"
                    </div>
                </div>
            </div>
            
            <div class="mystery-choices-grid">
                ${choicesHtml}
            </div>
        </div>
    `;
    
    updateTeamUI();
}

function executeMysteryChoice(choiceIndex) {
    if (!currentMysteryEvent) return;
    const choice = currentMysteryEvent.choices[choiceIndex];
    if (!choice) return;
    
    let resultMsg = choice.action();
    renderEventResultUI(currentMysteryEvent.title, resultMsg);
    currentMysteryEvent = null;
}

function renderEventResultUI(title, resultMsg, hasMoreActions = false) {
    const actions = document.getElementById('event-actions');
    if (!actions) return;
    
    const btnActionHtml = hasMoreActions
        ? `<button class="btn-event-cta" onclick="initCampEvent(true)"><span class="btn-icon">⚒️</span> REALIZAR 2ª OPERACIÓN DE CAMPO <span class="btn-arrow">➔</span></button>`
        : `<button class="btn-event-cta" onclick="advanceFloor()"><span class="btn-icon">⚡</span> CONTINUAR INCURSIÓN <span class="btn-arrow">➔</span></button>`;

    actions.innerHTML = `
        <div class="event-panel-container">
            <div class="event-header-panel">
                <div class="event-header-badge">✓ RESOLUCIÓN DEL ENCUENTRO</div>
                <h1 class="event-main-title">${title}</h1>
            </div>
            
            <div class="event-resolution-box">
                <div class="resolution-icon">📡</div>
                <div class="resolution-text">${resultMsg}</div>
            </div>
            
            <div class="event-bottom-actions">
                ${btnActionHtml}
            </div>
        </div>
    `;
    
    updateTeamUI();
}

function initGenericEvent() {
    const actions = document.getElementById('event-actions');
    if (!actions) return;
    
    actions.innerHTML = `
        <div class="event-panel-container">
            <div class="event-header-panel">
                <div class="event-header-badge">⚡ SECTOR DESPEJADO</div>
                <h1 class="event-main-title">ZONA ESTABLE</h1>
                <p class="event-subtitle">No se detectaron anomalías en este sector.</p>
            </div>
            <div class="event-bottom-actions">
                <button class="btn-event-cta" onclick="advanceFloor()">
                    <span>Avanzar ➔</span>
                </button>
            </div>
        </div>
    `;
    updateTeamUI();
}

let currentShopItems = [];
let shopDismissalUsed = false;

function initShopEvent() {
    const title = document.getElementById('event-title');
    const content = document.getElementById('event-content');
    const desc = document.getElementById('event-description');
    
    if (title) title.style.display = 'none';
    if (content) content.style.display = 'none';
    if (desc) desc.style.display = 'none';
    
    currentShopItems = [];
    shopDismissalUsed = false;
    let discountPct = Math.min(0.70, 
        ((typeof SkillsManager !== 'undefined') ? SkillsManager.getShopDiscountPct() : 0) +
        ((typeof RelicsManager !== 'undefined') ? RelicsManager.getShopDiscountPct() : 0)
    );
    
    // 1. PRIMERO: 2 Armas (150 a 200 de chatarra base)
    for (let i = 0; i < 2; i++) {
        let w = generateRandomWeapon();
        let rawWeaponCost = Math.floor(Math.random() * 51) + 150; // 150 - 200 chatarra
        let weaponCost = Math.max(30, Math.floor(rawWeaponCost * (1 - discountPct)));
        currentShopItems.push({
            id: 'shop_weapon_' + i,
            category: 'WEAPON',
            data: w,
            name: w.name,
            element: w.element,
            icon: WEAPON_EMOJIS[w.type],
            desc: w.desc,
            cost: weaponCost,
            bought: false
        });
    }
    
    // 2. SEGUNDO: 2 Reliquias pasivas (Solo Común, Rara o Épica; entre 150 y 200 según rareza)
    let shopRelicPool = (typeof getRandomRelicPool === 'function' && typeof GAME_STATE !== 'undefined')
        ? getRandomRelicPool(2, GAME_STATE.relics, ['COMUN', 'RARO', 'EPICO'])
        : [];
        
    shopRelicPool.forEach((relic, idx) => {
        let baseRelicCost = 150; // COMUN
        if (relic.rarity === 'RARO') baseRelicCost = 175;
        else if (relic.rarity === 'EPICO') baseRelicCost = 200;
        
        let relicCost = Math.max(30, Math.floor(baseRelicCost * (1 - discountPct)));
        currentShopItems.push({
            id: 'shop_relic_' + idx,
            category: 'RELIC',
            data: relic,
            name: relic.name,
            element: null,
            icon: relic.icon,
            desc: relic.desc,
            rarity: relic.rarity,
            cost: relicCost,
            bought: false
        });
    });

    // 3. TERCERO: 4 Consumibles tácticos aleatorios (Nanobots, PEM o Sobrecarga)
    for (let i = 0; i < 4; i++) {
        let item = (typeof generateRandomConsumable === 'function')
            ? generateRandomConsumable()
            : (() => {
                let keys = Object.keys(ITEM_TYPES).filter(k => !k.includes('CHIP'));
                let t = ITEM_TYPES[keys[Math.floor(Math.random() * keys.length)]];
                return { type: t, ...ITEM_DEFS[t] };
            })();
        let rawCost = Math.floor(Math.random() * 10) + 25; // 25 - 34 chatarra
        let cost = Math.max(8, Math.floor(rawCost * (1 - discountPct)));
        currentShopItems.push({
            id: 'shop_consumable_' + i,
            category: 'ITEM',
            data: item,
            name: item.name,
            element: null,
            icon: item.emoji,
            desc: item.desc,
            cost: cost,
            bought: false
        });
    }
    
    renderShopUI();
}

function renderShopUI(feedbackMessage = '') {
    const actions = document.getElementById('event-actions');
    if (!actions) return;
    
    let feedbackHtml = '';
    if (feedbackMessage) {
        feedbackHtml = `<div class="shop-feedback-toast">${feedbackMessage}</div>`;
    }
    
    let cardsHtml = currentShopItems.map((item, idx) => {
        const canAfford = GAME_STATE.scrap >= item.cost;
        const elemClass = item.element ? `elem-${item.element}` : '';
        let elemBadgeClass = 'badge-neutral';
        
        let tagText = 'ITEM';
        if (item.category === 'WEAPON') {
            tagText = `⚔️ ARMA (${item.element})`;
            elemBadgeClass = `elem-badge-${item.element}`;
        } else if (item.category === 'CHIP') {
            tagText = `💾 CHIP (${item.element})`;
            elemBadgeClass = `elem-badge-${item.element}`;
        } else if (item.category === 'RELIC') {
            const rKey = item.rarity ? item.rarity.toLowerCase() : 'comun';
            tagText = `✨ RELIQUIA (${item.rarity || 'PASIVA'})`;
            elemBadgeClass = `badge-${rKey}`;
        } else {
            tagText = `🧪 CONSUMIBLE`;
        }
        
        let buttonHtml = '';
        if (item.bought) {
            buttonHtml = `<button class="btn-shop-buy is-bought" disabled><span class="shop-btn-icon">✓</span> ADQUIRIDO (Agotado)</button>`;
        } else if (canAfford) {
            buttonHtml = `
                <button class="btn-shop-buy can-afford" onclick="buyShopItem(${idx})">
                    <span class="shop-btn-icon">🛒</span> COMPRAR <span class="shop-btn-price">(${item.cost} ⚙️)</span>
                </button>
            `;
        } else {
            buttonHtml = `
                <button class="btn-shop-buy cannot-afford" disabled>
                    <span class="shop-btn-icon">🔒</span> CHATARRA INSUFICIENTE <span class="shop-btn-price">(${item.cost} ⚙️)</span>
                </button>
            `;
        }
        
        return `
            <div class="shop-item-card ${item.bought ? 'item-bought' : ''} ${item.element ? 'card-elem-' + item.element : ''} ${item.category === 'RELIC' ? 'card-relic' : ''}">
                <div class="shop-card-top">
                    <span class="shop-tag-badge ${elemBadgeClass}">${tagText}</span>
                    <div class="shop-price-tag ${canAfford || item.bought ? 'price-ok' : 'price-no'}">
                        <span class="price-gear">⚙️</span> ${item.cost}
                    </div>
                </div>
                
                <div class="shop-card-hero">
                    <div class="shop-holo-pedestal ${item.element ? 'platform-' + item.element : (item.category === 'RELIC' ? 'platform-relic' : '')}">
                        <div class="shop-card-icon ${elemClass}">${item.icon}</div>
                    </div>
                    <div class="shop-card-name ${elemClass}">${item.name}</div>
                </div>
                
                <div class="shop-card-desc">
                    ${item.desc}
                </div>
                
                <div class="shop-card-footer">
                    ${buttonHtml}
                </div>
            </div>
        `;
    }).join('');
    
    // Botón / Panel de Servicio de Desguace (Baja de Robot por 30 chatarra, 1 por mercado)
    let dismissBtnHtml = '';
    if (shopDismissalUsed) {
        dismissBtnHtml = `<button class="btn-shop-service is-used" disabled><span class="shop-btn-icon">✓</span> SERVICIO UTILIZADO (Agotado)</button>`;
    } else if (GAME_STATE.team.length <= 1) {
        dismissBtnHtml = `<button class="btn-shop-service cannot-use" disabled><span class="shop-btn-icon">🔒</span> MÍNIMO 1 ROBOT EN EQUIPO</button>`;
    } else if (GAME_STATE.scrap < 30) {
        dismissBtnHtml = `<button class="btn-shop-service cannot-use" disabled><span class="shop-btn-icon">🔒</span> CHATARRA INSUFICIENTE (30 ⚙️)</button>`;
    } else {
        dismissBtnHtml = `
            <button class="btn-shop-service can-use" onclick="showShopDismissalPicker()">
                <span class="shop-btn-icon">🗑️</span> RETIRAR ROBOT <span class="shop-btn-price">(30 ⚙️)</span>
            </button>
        `;
    }

    const dismissServiceHtml = `
        <div class="shop-service-panel">
            <div class="shop-service-header">
                <span class="shop-service-badge">🗑️ DESGUACE // BAJA DE UNIDAD</span>
                <div class="shop-service-price">
                    <span class="price-gear">⚙️</span> 30
                </div>
            </div>
            <div class="shop-service-body">
                <div class="shop-service-info">
                    <div class="shop-service-title">Retirar Robot del Escuadrón</div>
                    <div class="shop-service-desc">Da de baja a un robot para liberar espacio táctico. Sus armas equipadas y chips instalados regresarán a tu inventario. (Límite: 1 por mercado).</div>
                </div>
                <div class="shop-service-action">
                    ${dismissBtnHtml}
                </div>
            </div>
        </div>
    `;

    // Calcular costo de comprar todo lo disponible en el catálogo
    const unboughtItems = currentShopItems.filter(it => !it.bought);
    const totalCostAll = unboughtItems.reduce((acc, it) => acc + it.cost, 0);
    const canBuyAll = unboughtItems.length > 1 && GAME_STATE.scrap >= totalCostAll;
    
    let buyAllBtnHtml = '';
    if (canBuyAll) {
        buyAllBtnHtml = `
            <button class="btn-shop-buy-all" onclick="buyAllAvailableShopItems()">
                <span class="buy-all-icon">⚡</span> COMPRAR TODO EL CATÁLOGO DISPONIBLE (${totalCostAll} ⚙️)
            </button>
        `;
    }
    
    actions.innerHTML = `
        <div class="shop-container">
            <div class="shop-header-panel">
                <div class="shop-header-badge">🛒 MERCADO NEGRO // RED DE CONTRABANDO</div>
                <h1 class="shop-main-title">MERCADO NEGRO</h1>
                <div class="shop-subtitle-row">
                    <p class="shop-subtitle">Existencias limitadas (1 unidad por artículo). Compra suministros o contrata el servicio de desguace.</p>
                    <div class="shop-scrap-pill">
                        <span class="scrap-pill-label">TU SALDO:</span>
                        <span class="scrap-pill-val">${GAME_STATE.scrap} ⚙️</span>
                    </div>
                </div>
            </div>
            
            ${feedbackHtml}
            
            <div class="shop-cards-grid">
                ${cardsHtml}
            </div>

            ${dismissServiceHtml}
            
            <div class="shop-bottom-actions">
                ${buyAllBtnHtml}
                <button class="btn-shop-exit" onclick="advanceFloor()">
                    <span class="exit-icon">🚪</span> SALIR DEL MERCADO <span class="exit-arrow">➔</span>
                </button>
            </div>
        </div>
    `;
    
    updateTeamUI();
}

function showShopDismissalPicker() {
    const actions = document.getElementById('event-actions');
    if (!actions) return;
    
    const aliveCount = GAME_STATE.team.filter(r => !r.isOffline && r.hp > 0).length;
    
    const unitCards = GAME_STATE.team.map((r, idx) => {
        const isOffline = r.isOffline || r.hp <= 0;
        const isLastAlive = !isOffline && aliveCount <= 1;
        const weaponText = r.equippedWeapon ? `${WEAPON_EMOJIS[r.equippedWeapon.type]} ${r.equippedWeapon.name}` : 'Sin arma';
        const chipText = r.skills.length > 2 ? `💾 ${r.skills[2].name}` : 'Sin chip';
        
        let btnHtml = '';
        if (isLastAlive) {
            btnHtml = `<button class="btn-camp-select-cta" disabled style="opacity:0.5; cursor:not-allowed; background:rgba(255,255,255,0.05); color:#8395a7; border-color:rgba(255,255,255,0.15);"><span>🔒 ÚNICO OPERATIVO</span></button>`;
        } else {
            btnHtml = `
                <button class="btn-camp-select-cta btn-camp-dismiss" onclick="executeShopDismissal(${idx})">
                    <span>🗑️ Dar de Baja (30 ⚙️)</span>
                </button>
            `;
        }
        
        return `
            <div class="camp-select-card member-elem-${r.element}">
                <div class="camp-select-header">
                    <span class="member-elem-badge elem-${r.element}">${r.element}</span>
                    <span class="member-lvl-badge">NV. ${r.level}</span>
                </div>
                <div class="camp-select-emoji elem-${r.element}">${r.emoji}</div>
                <div class="camp-select-name">${r.name}</div>
                <div class="camp-select-desc">
                    <div><strong>Estado:</strong> ${isOffline ? '<span style="color:#ff4757;">DESACTIVADO</span>' : '<span style="color:#2ed573;">OPERATIVO</span>'} (${r.hp}/${r.maxHp} HP)</div>
                    <div style="margin-top:4px; font-size:11px; opacity:0.85;">⚔️ ${weaponText} | ${chipText}</div>
                </div>
                ${btnHtml}
            </div>
        `;
    }).join('');
    
    actions.innerHTML = `
        <div class="event-panel-container">
            <div class="event-header-panel">
                <div class="event-header-badge">🗑️ DESGUACE // RETIRAR UNIDAD DEL ESCUADRÓN</div>
                <h1 class="event-main-title">SELECCIONA EL ROBOT A RETIRAR</h1>
                <p class="event-subtitle">Elige qué unidad deseas dar de baja (costo: 30 ⚙️). Sus armas y chips equipados serán devueltos a tu inventario:</p>
            </div>
            
            <div class="camp-select-grid">
                ${unitCards}
            </div>
            
            <div class="event-bottom-actions">
                <button class="btn-camp-back" onclick="renderShopUI()">
                    <span>◀ Volver al Mercado</span>
                </button>
            </div>
        </div>
    `;
}

function executeShopDismissal(robotIndex) {
    if (shopDismissalUsed || GAME_STATE.scrap < 30 || GAME_STATE.team.length <= 1) return;
    const robot = GAME_STATE.team[robotIndex];
    if (!robot) return;
    
    const aliveCount = GAME_STATE.team.filter(r => !r.isOffline && r.hp > 0).length;
    if (!robot.isOffline && robot.hp > 0 && aliveCount <= 1) return;
    
    addScrap(-30);
    shopDismissalUsed = true;
    
    let salvagedMsg = [];
    if (robot.equippedWeapon) {
        GAME_STATE.inventory.weapons.push(robot.equippedWeapon);
        salvagedMsg.push(`arma (${robot.equippedWeapon.name})`);
        robot.equippedWeapon = null;
    }
    if (robot.skills.length > 2) {
        if (typeof uninstallChip === 'function') {
            uninstallChip(robot);
        } else {
            robot.skills.splice(2);
        }
        salvagedMsg.push(`chip instalado`);
    }
    
    const robotName = robot.name;
    GAME_STATE.team.splice(robotIndex, 1);
    updateTeamUI();
    
    let extraText = salvagedMsg.length > 0 ? ` Se recuperaron en tu mochila: ${salvagedMsg.join(' y ')}.` : '';
    renderShopUI(`✓ ¡[${robotName}] fue dado de baja del escuadrón por 30 ⚙️!${extraText}`);
}

function buyShopItem(idx) {
    const item = currentShopItems[idx];
    if (!item || item.bought) return;
    
    if (GAME_STATE.scrap < item.cost) {
        if (typeof SoundManager !== 'undefined') SoundManager.play('ui_cancel');
        return;
    }
    
    if (typeof SoundManager !== 'undefined') {
        SoundManager.play('shop_buy');
        setTimeout(() => SoundManager.play('ui_scrap'), 120);
    }

    // Descontar chatarra
    addScrap(-item.cost);
    item.bought = true;
    
    // Añadir al inventario / reliquias
    const clonedData = JSON.parse(JSON.stringify(item.data));
    if (item.category === 'WEAPON') {
        GAME_STATE.inventory.weapons.push(clonedData);
    } else if (item.category === 'RELIC') {
        if (typeof RelicsManager !== 'undefined') {
            RelicsManager.addRelic(clonedData.id);
            RelicsManager.showRelicAcquiredToast(clonedData);
        } else {
            if (!GAME_STATE.relics) GAME_STATE.relics = [];
            if (!GAME_STATE.relics.includes(clonedData.id)) GAME_STATE.relics.push(clonedData.id);
        }
    } else {
        GAME_STATE.inventory.items.push(clonedData);
    }
    
    let msg = `✓ ¡Adquiriste <strong>${item.name}</strong> por ${item.cost} ⚙️! Guardado en tu ${item.category === 'RELIC' ? 'colección de reliquias' : 'inventario'}.`;
    renderShopUI(msg);
}

function buyAllAvailableShopItems() {
    let purchasedNames = [];
    currentShopItems.forEach(item => {
        if (!item.bought && GAME_STATE.scrap >= item.cost) {
            addScrap(-item.cost);
            item.bought = true;
            const clonedData = JSON.parse(JSON.stringify(item.data));
            if (item.category === 'WEAPON') {
                GAME_STATE.inventory.weapons.push(clonedData);
            } else if (item.category === 'RELIC') {
                if (typeof RelicsManager !== 'undefined') {
                    RelicsManager.addRelic(clonedData.id);
                    RelicsManager.showRelicAcquiredToast(clonedData);
                } else {
                    if (!GAME_STATE.relics) GAME_STATE.relics = [];
                    if (!GAME_STATE.relics.includes(clonedData.id)) GAME_STATE.relics.push(clonedData.id);
                }
            } else {
                GAME_STATE.inventory.items.push(clonedData);
            }
            purchasedNames.push(item.name);
        }
    });
    
    if (purchasedNames.length > 0) {
        if (typeof SoundManager !== 'undefined') {
            SoundManager.play('shop_buy');
            setTimeout(() => SoundManager.play('ui_scrap'), 120);
        }
        let msg = `⚡ ¡Compraste con éxito: <strong>${purchasedNames.join(', ')}</strong>! Guardados con éxito.`;
        renderShopUI(msg);
    }
}
