// postBattle.js

let defeatedRobot = null;
let droppedWeapon = null;

function initPostBattle(enemy) {
    showScreen('screen-post-battle');
    defeatedRobot = enemy;
    
    // Siempre da chatarra base (modificada por pasivas de Imanes de Chatarrero)
    let scrapGainMult = (typeof SkillsManager !== 'undefined') ? SkillsManager.getScrapGainMultiplier() : 1;
    let baseScrap = Math.floor((Math.floor(Math.random() * 10) + 10) * scrapGainMult);

    // Si es Élite, doble chatarra
    let isElite = enemy.name.includes('ÉLITE');
    if (isElite) {
        baseScrap *= 2;
    }
    addScrap(baseScrap);

    // Repartir XP (modificada por pasivas de Chips de Aprendizaje)
    let xpGainMult = (typeof SkillsManager !== 'undefined') ? SkillsManager.getXpGainMultiplier() : 1;
    const xpGained = Math.floor(enemy.level * 50 * xpGainMult);
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
    
    droppedWeapon = null;
    let droppedItem = null;
    let isBoss = enemy.name.includes('Jefe');

    if (isElite || isBoss) {
        // Elite/Boss drop: 50% Upgraded Weapon, 50% Chip
        if (Math.random() < 0.5) {
            droppedWeapon = generateRandomWeapon(enemy.element);
            droppedWeapon.isUpgraded = true;
            droppedWeapon.name += " +1";
            if (droppedWeapon.type === WEAPON_TYPES.DAGA) droppedWeapon.desc = '40% prob. doble ataque';
            if (droppedWeapon.type === WEAPON_TYPES.HACHA) droppedWeapon.desc = 'Perfora 75% de barreras y defensas';
            if (droppedWeapon.type === WEAPON_TYPES.BACULO) droppedWeapon.desc = 'Cura 7% HP al final del turno';
            if (droppedWeapon.type === WEAPON_TYPES.ESPADA) droppedWeapon.desc = '+30% Daño + 20% Crítico en Básicos';
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
    if (GAME_STATE.team.length >= 3) {
        btnRecruit.className = 'btn-post-action btn-post-recruit';
        btnRecruit.disabled = true;
        btnRecruit.innerHTML = `<span>🤖 Reclutar (Equipo Completo 3/3)</span>`;
    } else if (isElite) {
        let eliteChance = (typeof SkillsManager !== 'undefined') ? SkillsManager.getEliteRecruitChance() : 0.50;
        let successPct = Math.round(eliteChance * 100);
        let failPct = 100 - successPct;
        btnRecruit.className = 'btn-post-action btn-post-recruit-elite';
        btnRecruit.innerHTML = `<span>⚠️ Reclutar Élite (${successPct}% Éxito / ${failPct}% 💥 Explosión)</span>`;
        btnRecruit.title = `${successPct}% prob. de éxito. Si falla, el robot explotará e infligirá un 10% de daño de HP a todo el escuadrón (puede ser letal).`;
        btnRecruit.onclick = () => handleRecruitElite(enemy, actionsContainer, desc);
    } else {
        btnRecruit.className = 'btn-post-action btn-post-recruit';
        btnRecruit.innerHTML = `<span>🤖 Reclutar a ${enemy.name} (50% HP)</span>`;
        btnRecruit.onclick = () => {
            recruitRobot(enemy);
            advanceFloor();
        };
    }
    actionsContainer.appendChild(btnRecruit);

    // Botón Desmantelar (beneficiado por Reciclaje Estructural)
    const dismantleRewards = (typeof SkillsManager !== 'undefined') ? SkillsManager.getDismantleRewards() : { scrap: 30, healPct: 0.10 };
    const btnScrap = document.createElement('button');
    btnScrap.className = 'btn-post-action btn-post-scrap';
    btnScrap.innerHTML = `<span>⚙️ Desmantelar (+${dismantleRewards.scrap} Chatarra, +${Math.round(dismantleRewards.healPct * 100)}% Reparación)</span>`;
    btnScrap.onclick = () => {
        addScrap(dismantleRewards.scrap);
        GAME_STATE.team.forEach(r => {
            if (!r.isOffline) {
                r.heal(r.maxHp * dismantleRewards.healPct);
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

function handleRecruitElite(enemy, actionsContainer, desc) {
    // Desactivar todos los botones para evitar clicks múltiples
    actionsContainer.querySelectorAll('button').forEach(btn => btn.disabled = true);
    
    const postContainer = document.querySelector('.post-battle-container') || document.getElementById('screen-post-battle');
    
    // Probabilidad de éxito configurada con meta-progresión
    let recruitChance = (typeof SkillsManager !== 'undefined') ? SkillsManager.getEliteRecruitChance() : 0.50;
    let isSuccess = Math.random() < recruitChance;
    
    if (isSuccess) {
        if (desc) {
            desc.innerHTML += `<div class="post-log-item log-lvl-up">🎉 ¡Reprogramación Exitosa! El robot <strong>${enemy.name}</strong> ha sido integrado a tu escuadrón operativo.</div>`;
            desc.scrollTop = desc.scrollHeight;
        }
        recruitRobot(enemy);
        setTimeout(() => {
            advanceFloor();
        }, 1300);
    } else {
        // Explosión del núcleo Élite
        if (postContainer) {
            postContainer.classList.remove('anim-explosion-shake');
            void postContainer.offsetWidth;
            postContainer.classList.add('anim-explosion-shake');
        }
        
        const defeatedEmoji = document.getElementById('defeated-emoji');
        if (defeatedEmoji) {
            defeatedEmoji.innerHTML = '💥';
        }
        
        // Dañar 10% de HP máximo a todo el escuadrón
        GAME_STATE.team.forEach(r => {
            if (!r.isOffline && r.hp > 0) {
                let dmg = Math.max(1, Math.floor(r.maxHp * 0.10));
                r.hp = Math.max(0, r.hp - dmg);
                if (r.hp === 0) {
                    r.isOffline = true;
                    r.statuses = [];
                }
            }
        });
        
        updateTeamUI();
        
        if (desc) {
            desc.innerHTML += `<div class="post-log-item log-explosion">💥 ¡SOBRECARGA Y AUTODESTRUCCIÓN! El núcleo de <strong>${enemy.name}</strong> estalló en pedazos. Todo el escuadrón recibe 10% de daño estructural.</div>`;
            desc.scrollTop = desc.scrollHeight;
        }
        
        // Verificar si murieron todos los miembros del escuadrón
        let allDead = GAME_STATE.team.every(r => r.isOffline || r.hp <= 0);
        
        if (allDead) {
            if (desc) {
                desc.innerHTML += `<div class="post-log-item log-game-over">💀 ¡CATÁSTROFE! Todo el escuadrón fue destruido por la detonación. Fin de la incursión.</div>`;
                desc.scrollTop = desc.scrollHeight;
            }
            setTimeout(() => {
                showScreen('screen-game-over');
            }, 1800);
        } else {
            // El escuadrón sobrevivió a la explosión
            setTimeout(() => {
                actionsContainer.innerHTML = '';
                const btnContinue = document.createElement('button');
                btnContinue.className = 'btn-post-action btn-post-advance';
                btnContinue.innerHTML = `<span>Sobrevivieron a la detonación. Continuar Incursión ➔</span>`;
                btnContinue.onclick = () => advanceFloor();
                actionsContainer.appendChild(btnContinue);
            }, 1000);
        }
    }
}

function advanceFloor() {
    GAME_STATE.floor++;
    renderMap();
    showScreen('screen-map');
}
