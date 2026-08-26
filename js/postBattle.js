// postBattle.js

let defeatedRobot = null;
let droppedWeapon = null;

function initPostBattle(enemy) {
    showScreen('screen-post-battle');
    defeatedRobot = enemy;
    
    // Siempre da chatarra base
    let baseScrap = Math.floor(Math.random() * 10) + 10;
    addScrap(baseScrap);

    // Repartir XP
    const xpGained = enemy.level * 50;
    let xpMsgs = [];
    GAME_STATE.team.forEach(r => {
        if (!r.isOffline) {
            let leveledUp = r.gainXp(xpGained);
            if (leveledUp) {
                xpMsgs.push(`¡${r.name} subió al Nivel ${r.level}!`);
            }
        }
    });
    
    document.getElementById('defeated-emoji').innerHTML = enemy.getEmojiGraphic();
    
    // Si es Élite, doble chatarra
    let isElite = enemy.name.includes('ÉLITE');
    if (isElite) {
        baseScrap *= 2;
        addScrap(baseScrap / 2); // Añadimos la mitad extra porque ya se añadió baseScrap al inicio
    }
    
    droppedWeapon = null;
    let droppedItem = null;
    let isBoss = enemy.name.includes('Jefe');

    if (isElite || isBoss) {
        // Elite/Boss drop: 50% Upgraded Weapon, 50% Chip
        if (Math.random() < 0.5) {
            droppedWeapon = generateRandomWeapon(enemy.element);
            droppedWeapon.isUpgraded = true;
            droppedWeapon.name += " +1";
        } else {
            let chipKeys = Object.keys(ITEM_TYPES).filter(k => k.includes('CHIP'));
            let randomChipType = ITEM_TYPES[chipKeys[Math.floor(Math.random() * chipKeys.length)]];
            droppedItem = { type: randomChipType, ...ITEM_DEFS[randomChipType] };
        }
        
        let consumableKeys = Object.keys(ITEM_TYPES).filter(k => !k.includes('CHIP'));
        let randomConsumableType = ITEM_TYPES[consumableKeys[Math.floor(Math.random() * consumableKeys.length)]];
        var droppedConsumable = { type: randomConsumableType, ...ITEM_DEFS[randomConsumableType] };
        GAME_STATE.inventory.items.push(droppedConsumable);
        
    } else {
        // Normal monster: 1% weapon, 30% consumable item
        if (Math.random() < 0.01) {
            droppedWeapon = generateRandomWeapon(enemy.element);
        }
        if (Math.random() < 0.3) {
            let consumableKeys = Object.keys(ITEM_TYPES).filter(k => !k.includes('CHIP'));
            let randomConsumableType = ITEM_TYPES[consumableKeys[Math.floor(Math.random() * consumableKeys.length)]];
            droppedItem = { type: randomConsumableType, ...ITEM_DEFS[randomConsumableType] };
        }
    }

    const badgesContainer = document.getElementById('post-rewards-badges');
    const desc = document.getElementById('post-battle-desc');
    
    let badgesHTML = `
        <div class="reward-pill pill-scrap">⚙️ +${baseScrap} Chatarra</div>
        <div class="reward-pill pill-xp">⭐ +${xpGained} XP</div>
    `;
    if (isElite) badgesHTML += `<div class="reward-pill pill-elite">👑 BOTÍN ÉLITE</div>`;
    if (isBoss) badgesHTML += `<div class="reward-pill pill-boss">🏆 JEFE DERROTADO</div>`;
    if (badgesContainer) badgesContainer.innerHTML = badgesHTML;
    
    let logsHTML = [];
    logsHTML.push(`<div class="post-log-item log-neutralized">⚔️ El enemigo <strong>${enemy.name}</strong> ha sido completamente neutralizado.</div>`);
    
    if (xpMsgs.length > 0) {
        xpMsgs.forEach(msg => {
            logsHTML.push(`<div class="post-log-item log-lvl-up">🎉 ${msg}</div>`);
        });
    }
    
    if (droppedWeapon) {
        logsHTML.push(`<div class="post-log-item log-weapon">🎁 ¡Soltó un arma rara: <strong>${droppedWeapon.name}</strong> ${WEAPON_EMOJIS[droppedWeapon.type]}!</div>`);
        GAME_STATE.inventory.weapons.push(droppedWeapon);
    }
    
    if (droppedItem) {
        logsHTML.push(`<div class="post-log-item log-item">💾 ¡Soltó un objeto: <strong>${droppedItem.name}</strong> ${droppedItem.emoji}!</div>`);
        GAME_STATE.inventory.items.push(droppedItem);
    }
    
    if (typeof droppedConsumable !== 'undefined' && droppedConsumable) {
        logsHTML.push(`<div class="post-log-item log-item">🧪 ¡Soltó consumible: <strong>${droppedConsumable.name}</strong> ${droppedConsumable.emoji}!</div>`);
    }

    if (desc) desc.innerHTML = logsHTML.join('');

    const actionsContainer = document.getElementById('post-battle-actions');
    actionsContainer.innerHTML = '';
    
    // Botón Reclutar
    const btnRecruit = document.createElement('button');
    btnRecruit.className = 'btn-post-action btn-post-recruit';
    if (GAME_STATE.team.length >= 3) {
        btnRecruit.disabled = true;
        btnRecruit.innerHTML = `<span>🤖 Reclutar (Equipo Completo 3/3)</span>`;
    } else {
        btnRecruit.innerHTML = `<span>🤖 Reclutar a ${enemy.name} (50% HP)</span>`;
        btnRecruit.onclick = () => {
            recruitRobot(enemy);
            advanceFloor();
        };
    }
    actionsContainer.appendChild(btnRecruit);

    // Botón Desmantelar
    const btnScrap = document.createElement('button');
    btnScrap.className = 'btn-post-action btn-post-scrap';
    btnScrap.innerHTML = `<span>⚙️ Desmantelar (+30 Chatarra, +10% Reparación)</span>`;
    btnScrap.onclick = () => {
        addScrap(30);
        GAME_STATE.team.forEach(r => {
            if (!r.isOffline) {
                r.hp = Math.min(r.maxHp, r.hp + Math.floor(r.maxHp * 0.1));
            }
        });
        advanceFloor();
    };
    actionsContainer.appendChild(btnScrap);

    // Botón avanzar
    const btnIgnore = document.createElement('button');
    btnIgnore.className = 'btn-post-action btn-post-advance';
    btnIgnore.innerHTML = `<span>Avanzar Incursión ➔</span>`;
    btnIgnore.onclick = () => advanceFloor();
    actionsContainer.appendChild(btnIgnore);
    
    updateTeamUI();
}

function advanceFloor() {
    GAME_STATE.floor++;
    renderMap();
    showScreen('screen-map');
}
