// eventHandler.js

function startEvent(type) {
    showScreen('screen-event');
    
    const title = document.getElementById('event-title');
    const content = document.getElementById('event-content');
    const desc = document.getElementById('event-description');
    const actions = document.getElementById('event-actions');
    
    if (title) title.style.display = 'block';
    if (content) content.style.display = 'block';
    if (desc) desc.style.display = 'block';
    
    content.innerHTML = NODE_EMOJIS[type];
    actions.innerHTML = '';
    
    updateTeamUI();

    if (type === NODE_TYPES.CHEST) {
        title.innerText = "Cofre Abandonado";
        
        let r = Math.random();
        if (r < 0.5) {
            // 50% Arma +1
            const weapon = generateRandomWeapon();
            weapon.isUpgraded = true;
            weapon.name += " +1";
            if (weapon.type === WEAPON_TYPES.DAGA) weapon.desc = '40% prob. doble ataque';
            if (weapon.type === WEAPON_TYPES.HACHA) weapon.desc = 'Perfora 75% de barreras y defensas';
            if (weapon.type === WEAPON_TYPES.BACULO) weapon.desc = 'Cura 5% HP al final del turno';
            if (weapon.type === WEAPON_TYPES.ESPADA) weapon.desc = '+30% Daño + 20% Crítico en Básicos';
            desc.innerText = `Encontraste un arma rara: ${weapon.name} ${WEAPON_EMOJIS[weapon.type]}\nHa sido guardada en tu inventario.`;
            GAME_STATE.inventory.weapons.push(weapon);
        } else {
            // 50% Chip (Los chips están en los items, debemos asegurar que toque un chip)
            let chipKeys = Object.keys(ITEM_TYPES).filter(k => k.includes('CHIP'));
            let randomChipType = ITEM_TYPES[chipKeys[Math.floor(Math.random() * chipKeys.length)]];
            let item = { type: randomChipType, ...ITEM_DEFS[randomChipType] };
            
            desc.innerText = `Encontraste un objeto raro: ${item.name} ${item.emoji}\nHa sido guardado en tu inventario.`;
            GAME_STATE.inventory.items.push(item);
        }
        
        const btnAvanzar = document.createElement('button');
        btnAvanzar.innerText = "Continuar";
        btnAvanzar.onclick = () => advanceFloor();
        actions.appendChild(btnAvanzar);
    } 
    else if (type === NODE_TYPES.REPAIR_SHOP) {
        title.innerText = "Campamento (Taller de Reparación)";
        desc.innerText = `Elige una acción para tu equipo.`;
        
        // Opción 1: Reparar
        const btnHeal = document.createElement('button');
        btnHeal.innerHTML = `🔧 Reparar<br><small>Cura 30% a todos (revive con 10%)</small>`;
        btnHeal.onclick = () => {
            GAME_STATE.team.forEach(r => {
                if (r.isOffline) {
                    r.isOffline = false;
                    r.hp = Math.max(1, Math.floor(r.maxHp * 0.10));
                } else {
                    r.heal(r.maxHp * 0.30);
                }
            });
            advanceFloor();
        };
        actions.appendChild(btnHeal);

        // Opción 2: Entrenar
        const btnTrain = document.createElement('button');
        btnTrain.innerHTML = `💪 Entrenar<br><small>Dar 300 XP a un robot</small>`;
        btnTrain.onclick = () => {
            actions.innerHTML = '';
            desc.innerText = 'Selecciona quién recibirá el entrenamiento:';
            GAME_STATE.team.forEach(r => {
                const btn = document.createElement('button');
                btn.innerText = `Entrenar a ${r.name}`;
                btn.onclick = () => {
                    r.gainXp(300);
                    advanceFloor();
                };
                actions.appendChild(btn);
            });
        };
        actions.appendChild(btnTrain);

        // Opción 3: Forjar
        const btnForge = document.createElement('button');
        btnForge.innerHTML = `⚒️ Forjar<br><small>Mejorar arma equipada a +1</small>`;
        btnForge.onclick = () => {
            actions.innerHTML = '';
            const eligible = GAME_STATE.team.filter(r => r.equippedWeapon && !r.equippedWeapon.isUpgraded);
            if (eligible.length === 0) {
                desc.innerText = 'Nadie tiene un arma equipada que pueda mejorarse.';
                const backBtn = document.createElement('button');
                backBtn.innerText = 'Atrás';
                backBtn.onclick = () => startEvent(type);
                actions.appendChild(backBtn);
            } else {
                desc.innerText = 'Selecciona qué arma mejorar:';
                eligible.forEach(r => {
                    const btn = document.createElement('button');
                    btn.innerText = `Mejorar ${r.equippedWeapon.name} (en ${r.name})`;
                    btn.onclick = () => {
                        r.equippedWeapon.isUpgraded = true;
                        r.equippedWeapon.name += ' +1';
                        if (r.equippedWeapon.type === WEAPON_TYPES.DAGA) r.equippedWeapon.desc = '40% prob. doble ataque';
                        if (r.equippedWeapon.type === WEAPON_TYPES.HACHA) r.equippedWeapon.desc = 'Perfora 75% de barreras y defensas';
                        if (r.equippedWeapon.type === WEAPON_TYPES.BACULO) r.equippedWeapon.desc = 'Cura 5% HP al final del turno';
                        if (r.equippedWeapon.type === WEAPON_TYPES.ESPADA) r.equippedWeapon.desc = '+30% Daño + 20% Crítico en Básicos';
                        r.recalculateStats();
                        advanceFloor();
                    };
                    actions.appendChild(btn);
                });
            }
        };
        actions.appendChild(btnForge);
    } else if (type === NODE_TYPES.SHOP) {
        initShopEvent();
    } else if (type === NODE_TYPES.MYSTERY) {
        let event = MYSTERY_EVENTS[Math.floor(Math.random() * MYSTERY_EVENTS.length)];
        title.innerText = event.title;
        desc.innerText = event.desc;
        
        event.choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.innerText = choice.label;
            
            if (choice.condition && !choice.condition()) {
                btn.disabled = true;
                btn.style.opacity = '0.5';
            } else {
                btn.onclick = () => {
                    let resultMsg = choice.action();
                    actions.innerHTML = '';
                    desc.innerText = resultMsg;
                    
                    const btnLeave = document.createElement('button');
                    btnLeave.innerText = `Continuar`;
                    btnLeave.onclick = () => advanceFloor();
                    actions.appendChild(btnLeave);
                };
            }
            actions.appendChild(btn);
        });
    } else {
        // Evento genérico
        title.innerText = "Evento Desconocido";
        desc.innerText = "No hay nada útil aquí por ahora.";
        const btn = document.createElement('button');
        btn.innerText = `Avanzar`;
        btn.onclick = () => advanceFloor();
        actions.appendChild(btn);
    }
}

let currentShopItems = [];

function initShopEvent() {
    const title = document.getElementById('event-title');
    const content = document.getElementById('event-content');
    const desc = document.getElementById('event-description');
    
    if (title) title.style.display = 'none';
    if (content) content.style.display = 'none';
    if (desc) desc.style.display = 'none';
    
    currentShopItems = [];
    
    // 2 Armas con elemento aleatorio (1 unidad disponible de cada una)
    for (let i = 0; i < 2; i++) {
        let w = generateRandomWeapon();
        let cost = Math.floor(Math.random() * 15) + 35; // 35 - 49 chatarra
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
        let cost = isChip ? 30 : 25;
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
                    <p class="shop-subtitle">Existencias limitadas (1 unidad por artículo). Compra todo lo que tu chatarra te permita.</p>
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
