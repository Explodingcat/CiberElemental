// eventHandler.js

let pendingChestReward = null;
let currentMysteryEvent = null;

function startEvent(type) {
    showScreen('screen-event');
    
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
    const actions = document.getElementById('event-actions');
    if (!actions) return;
    
    let isWeapon = Math.random() < 0.5;
    let rewardObj = null;
    let rewardType = isWeapon ? 'WEAPON' : 'CHIP';
    
    let cardContentHtml = '';
    let elemClass = '';
    let elemBadgeClass = '';
    let rewardName = '';
    let rewardEmoji = '';
    let rarityBadgeText = '';
    
    if (isWeapon) {
        const weapon = generateRandomWeapon();
        weapon.isUpgraded = true;
        weapon.name += " +1";
        if (weapon.type === WEAPON_TYPES.DAGA) weapon.desc = '40% prob. doble ataque';
        if (weapon.type === WEAPON_TYPES.HACHA) weapon.desc = 'Perfora 75% de barreras y defensas';
        if (weapon.type === WEAPON_TYPES.BACULO) weapon.desc = 'Cura 7% HP al final del turno';
        if (weapon.type === WEAPON_TYPES.ESPADA) weapon.desc = '+30% Daño + 20% Crítico en Básicos';
        
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
        } else {
            GAME_STATE.inventory.items.push(data);
        }
        pendingChestReward = null;
    }
    advanceFloor();
}

function initCampEvent() {
    const actions = document.getElementById('event-actions');
    if (!actions) return;
    
    let healPct = (typeof SkillsManager !== 'undefined') ? SkillsManager.getRepairShopHealPct() : 0.30;
    let revivePct = (typeof SkillsManager !== 'undefined') ? SkillsManager.getReviveHpPct() : 0.10;
    let healPctStr = Math.round(healPct * 100);
    let revivePctStr = Math.round(revivePct * 100);
    
    actions.innerHTML = `
        <div class="event-panel-container">
            <div class="event-header-panel">
                <div class="event-header-badge">⛺ REFUGIO SECTORIAL // TALLER DE CAMPO</div>
                <h1 class="event-main-title">CAMPAMENTO TÁCTICO</h1>
                <p class="event-subtitle">Estación segura de mantenimiento. Selecciona una operación para tu escuadrón:</p>
            </div>
            
            <div class="camp-operations-grid">
                <!-- Tarjeta 1: Reparar -->
                <div class="camp-op-card">
                    <div class="camp-op-top">
                        <span class="camp-op-badge badge-green">RESTAURACIÓN</span>
                        <div class="camp-op-stat">+${healPctStr}% HP</div>
                    </div>
                    <div class="camp-op-icon">🔧</div>
                    <div class="camp-op-title">Reparación Integral</div>
                    <div class="camp-op-desc">
                        Restaura un <strong>${healPctStr}% de salud máxima</strong> a todo el escuadrón y reactiva a los aliados caídos con <strong>${revivePctStr}% HP</strong>.
                    </div>
                    <div class="camp-op-footer">
                        <button class="btn-camp-action btn-camp-heal" onclick="executeCampRepair(${healPct}, ${revivePct})">
                            <span class="btn-icon">🔧</span> Reparar Escuadrón
                        </button>
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
                        <span class="camp-op-badge badge-gold">HERRERÍA</span>
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
    GAME_STATE.team.forEach(r => {
        if (r.isOffline) {
            r.isOffline = false;
            r.hp = Math.max(1, Math.floor(r.maxHp * revivePct));
        } else {
            r.heal(r.maxHp * healPct);
        }
    });
    renderEventResultUI("Campamento de Reparación", `🔧 Los sistemas de soporte vital restauraron a tu escuadrón. Todos los robots recuperaron energía y están listos para continuar.`);
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
                <button class="btn-camp-back" onclick="initCampEvent()">
                    <span>◀ Volver a Opciones</span>
                </button>
            </div>
        </div>
    `;
}

function executeCampTraining(robotIndex) {
    const robot = GAME_STATE.team[robotIndex];
    if (!robot) return;
    let leveledUp = robot.gainXp(300);
    let msg = `💪 [${robot.name}] absorbió los paquetes de datos y ganó <strong>+300 XP</strong>.${leveledUp ? ` ¡Subió al <strong>Nivel ${robot.level}</strong>!` : ''}`;
    renderEventResultUI("Calibración Completada", msg);
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
                    <button class="btn-camp-back" onclick="initCampEvent()">
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
                <button class="btn-camp-back" onclick="initCampEvent()">
                    <span>◀ Volver a Opciones</span>
                </button>
            </div>
        </div>
    `;
}

function executeCampForge(robotId) {
    const robot = GAME_STATE.team.find(r => r.id === robotId);
    if (!robot || !robot.equippedWeapon) return;
    
    const w = robot.equippedWeapon;
    w.isUpgraded = true;
    w.name += ' +1';
    if (w.type === WEAPON_TYPES.DAGA) w.desc = '40% prob. doble ataque';
    if (w.type === WEAPON_TYPES.HACHA) w.desc = 'Perfora 75% de barreras y defensas';
    if (w.type === WEAPON_TYPES.BACULO) w.desc = 'Cura 7% HP al final del turno';
    if (w.type === WEAPON_TYPES.ESPADA) w.desc = '+30% Daño + 20% Crítico en Básicos';
    robot.recalculateStats();
    
    let msg = `⚒️ ¡El arma <strong>${w.name}</strong> de <strong>${robot.name}</strong> ha sido forjada con éxito al grado +1!`;
    renderEventResultUI("Forja Exitosa", msg);
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

function renderEventResultUI(title, resultMsg) {
    const actions = document.getElementById('event-actions');
    if (!actions) return;
    
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
                <button class="btn-event-cta" onclick="advanceFloor()">
                    <span class="btn-icon">⚡</span> CONTINUAR INCURSIÓN <span class="btn-arrow">➔</span>
                </button>
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
    let discountPct = (typeof SkillsManager !== 'undefined') ? SkillsManager.getShopDiscountPct() : 0;
    
    // 2 Armas con elemento aleatorio (1 unidad disponible de cada una)
    for (let i = 0; i < 2; i++) {
        let w = generateRandomWeapon();
        let rawCost = Math.floor(Math.random() * 15) + 35; // 35 - 49 chatarra
        let cost = Math.max(10, Math.floor(rawCost * (1 - discountPct)));
        currentShopItems.push({
            id: 'shop_weapon_' + i,
            category: 'WEAPON',
            data: w,
            name: w.name,
            element: w.element,
            icon: WEAPON_EMOJIS[w.type],
            desc: w.desc,
            cost: cost,
            bought: false
        });
    }
    
    // 2 Items (Chips o Consumibles, 1 unidad disponible de cada uno)
    for (let i = 0; i < 2; i++) {
        let item = generateRandomItem();
        let isChip = item.type.includes('CHIP');
        let rawCost = isChip ? 30 : 25;
        let cost = Math.max(8, Math.floor(rawCost * (1 - discountPct)));
        let element = isChip ? item.type.replace('CHIP_', '') : null;
        currentShopItems.push({
            id: 'shop_item_' + i,
            category: isChip ? 'CHIP' : 'ITEM',
            data: item,
            name: item.name,
            element: element,
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
        const elemBadgeClass = item.element ? `elem-badge-${item.element}` : 'badge-neutral';
        
        let tagText = 'ITEM';
        if (item.category === 'WEAPON') tagText = `⚔️ ARMA (${item.element})`;
        else if (item.category === 'CHIP') tagText = `💾 CHIP (${item.element})`;
        else tagText = `🧪 CONSUMIBLE`;
        
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
            <div class="shop-item-card ${item.bought ? 'item-bought' : ''} ${item.element ? 'card-elem-' + item.element : ''}">
                <div class="shop-card-top">
                    <span class="shop-tag-badge ${elemBadgeClass}">${tagText}</span>
                    <div class="shop-price-tag ${canAfford || item.bought ? 'price-ok' : 'price-no'}">
                        <span class="price-gear">⚙️</span> ${item.cost}
                    </div>
                </div>
                
                <div class="shop-card-hero">
                    <div class="shop-holo-pedestal ${item.element ? 'platform-' + item.element : ''}">
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
        return;
    }
    
    // Descontar chatarra
    addScrap(-item.cost);
    item.bought = true;
    
    // Añadir copia al inventario
    const clonedData = JSON.parse(JSON.stringify(item.data));
    if (item.category === 'WEAPON') {
        GAME_STATE.inventory.weapons.push(clonedData);
    } else {
        GAME_STATE.inventory.items.push(clonedData);
    }
    
    let msg = `✓ ¡Adquiriste <strong>${item.name}</strong> por ${item.cost} ⚙️! Guardado en tu inventario.`;
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
            } else {
                GAME_STATE.inventory.items.push(clonedData);
            }
            purchasedNames.push(item.name);
        }
    });
    
    if (purchasedNames.length > 0) {
        let msg = `⚡ ¡Compraste con éxito: <strong>${purchasedNames.join(', ')}</strong>! Guardados en tu inventario.`;
        renderShopUI(msg);
    }
}
