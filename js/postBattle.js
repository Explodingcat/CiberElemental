// postBattle.js

let defeatedRobots = [];
let droppedWeapon = null;

function initPostBattle(enemies) {
    const postContainer = document.querySelector('.post-battle-container') || document.getElementById('screen-post-battle');
    if (postContainer) {
        postContainer.classList.remove('anim-explosion-shake');
    }
    const screenPost = document.getElementById('screen-post-battle');
    if (screenPost) {
        screenPost.classList.remove('anim-explosion-shake');
    }
    
    showScreen('screen-post-battle');
    
    // Normalizar a arreglo
    defeatedRobots = Array.isArray(enemies) ? enemies : [enemies];
    
    let scrapGainMult = (typeof SkillsManager !== 'undefined') ? SkillsManager.getScrapGainMultiplier() : 1;
    let xpGainMult = (typeof SkillsManager !== 'undefined') ? SkillsManager.getXpGainMultiplier() : 1;
    
    let totalScrap = 0;
    let totalXp = 0;
    let hasElite = false;
    let hasBoss = false;
    let logsHTML = [];
    
    droppedWeapon = null;
    let allDroppedWeapons = [];
    let allDroppedItems = [];
    let allDroppedConsumables = [];

    // Procesar recompensas de cada robot derrotado
    defeatedRobots.forEach(enemy => {
        let isElite = !!enemy.isElite || enemy.name.includes('ÉLITE');
        let isBoss = enemy.name.includes('Jefe');
        if (isElite) hasElite = true;
        if (isBoss) hasBoss = true;

        // Chatarra
        let baseScrap = Math.floor((Math.floor(Math.random() * 10) + 10) * scrapGainMult);
        if (isElite) baseScrap *= 2;
        totalScrap += baseScrap;

        // XP
        let enemyXp = Math.floor(enemy.level * 50 * xpGainMult);
        totalXp += enemyXp;

        logsHTML.push(`<div class="post-log-item log-neutralized">⚔️ El enemigo <strong>${enemy.name}</strong> ha sido completamente neutralizado.</div>`);

        // Botín por robot
        if (isBoss) {
            // Boss drop: Garantizado Arma Legendaria Dorada + Chip + Consumible
            if (typeof generateLegendaryWeapon === 'function') {
                let legWp = generateLegendaryWeapon();
                allDroppedWeapons.push(legWp);
            } else {
                let wp = generateRandomWeapon(enemy.element);
                wp.isUpgraded = true;
                wp.name += " +1";
                allDroppedWeapons.push(wp);
            }
            
            let chipKeys = Object.keys(ITEM_TYPES).filter(k => k.includes('CHIP'));
            let randomChipType = ITEM_TYPES[chipKeys[Math.floor(Math.random() * chipKeys.length)]];
            allDroppedItems.push({ type: randomChipType, ...ITEM_DEFS[randomChipType] });
            
            let consumableKeys = Object.keys(ITEM_TYPES).filter(k => !k.includes('CHIP'));
            let randomConsumableType = ITEM_TYPES[consumableKeys[Math.floor(Math.random() * consumableKeys.length)]];
            let cons = { type: randomConsumableType, ...ITEM_DEFS[randomConsumableType] };
            allDroppedConsumables.push(cons);
            
        } else if (isElite) {
            // Elite drop: 33% Upgraded Weapon (+1), 33% Chip, 34% Nada
            let eliteRoll = Math.random();
            if (eliteRoll < 0.33) {
                let wp = generateRandomWeapon(enemy.element);
                wp.isUpgraded = true;
                wp.name += " +1";
                if (wp.type === WEAPON_TYPES.DAGA) wp.desc = '40% prob. doble ataque (con +1). Cada golpe puede aplicar marca.';
                if (wp.type === WEAPON_TYPES.HACHA) wp.desc = '+10% ATQ base. Perfora 75% defensas (con +1). 20% prob. Rompearmaduras. +45% Daño a ≤40% HP (Verdugo +1).';
                if (wp.type === WEAPON_TYPES.BACULO) wp.desc = 'Regenera 7% HP portador (con +1) + 5% a un aliado. 20% prob. de reducir 1 CD.';
                if (wp.type === WEAPON_TYPES.ESPADA) wp.desc = '+30% Daño base y +20% Crítico (con +1). Críticos activan Racha (+10% ATQ).';
                allDroppedWeapons.push(wp);
            } else if (eliteRoll < 0.66) {
                let chipKeys = Object.keys(ITEM_TYPES).filter(k => k.includes('CHIP'));
                let randomChipType = ITEM_TYPES[chipKeys[Math.floor(Math.random() * chipKeys.length)]];
                allDroppedItems.push({ type: randomChipType, ...ITEM_DEFS[randomChipType] });
            }
            
            let consumableKeys = Object.keys(ITEM_TYPES).filter(k => !k.includes('CHIP'));
            let randomConsumableType = ITEM_TYPES[consumableKeys[Math.floor(Math.random() * consumableKeys.length)]];
            let cons = { type: randomConsumableType, ...ITEM_DEFS[randomConsumableType] };
            allDroppedConsumables.push(cons);
            
        } else {
            // Normal monster: 1% weapon, 30% consumable item
            if (Math.random() < 0.01) {
                allDroppedWeapons.push(generateRandomWeapon(enemy.element));
            }
            if (Math.random() < 0.3) {
                let consumableKeys = Object.keys(ITEM_TYPES).filter(k => !k.includes('CHIP'));
                let randomConsumableType = ITEM_TYPES[consumableKeys[Math.floor(Math.random() * consumableKeys.length)]];
                allDroppedItems.push({ type: randomConsumableType, ...ITEM_DEFS[randomConsumableType] });
            }
        }
    });

    // Otorgar chatarra total
    addScrap(totalScrap);

    // Repartir XP total a los aliados vivos
    let xpMsgs = [];
    GAME_STATE.team.forEach(r => {
        if (!r.isOffline) {
            let leveledUp = r.gainXp(totalXp);
            if (leveledUp) {
                xpMsgs.push(`¡${r.name} subió al Nivel ${r.level}!`);
            }
        }
    });

    // Mostrar gráficos de enemigos derrotados
    const defeatedEmojiContainer = document.getElementById('defeated-emoji');
    if (defeatedEmojiContainer) {
        defeatedEmojiContainer.innerHTML = `
            <div style="display: flex; gap: 12px; justify-content: center; align-items: center; flex-wrap: wrap;">
                ${defeatedRobots.map(e => `<div style="display: flex; flex-direction: column; align-items: center;"><span style="font-size: 2.2rem;">${e.emoji}</span><span style="font-size: 0.75rem; color: #a4b0be;">${e.name}</span></div>`).join('')}
            </div>
        `;
    }

    // Badges de recompensas
    const badgesContainer = document.getElementById('post-rewards-badges');
    const desc = document.getElementById('post-battle-desc');
    
    let badgesHTML = `
        <div class="reward-pill pill-scrap">⚙️ +${totalScrap} Chatarra Total</div>
        <div class="reward-pill pill-xp">⭐ +${totalXp} XP Total</div>
    `;
    if (hasElite) badgesHTML += `<div class="reward-pill pill-elite">👑 BOTÍN ÉLITE</div>`;
    if (hasBoss) badgesHTML += `<div class="reward-pill pill-boss">🏆 JEFE DERROTADO</div>`;
    if (badgesContainer) badgesContainer.innerHTML = badgesHTML;
    
    if (xpMsgs.length > 0) {
        xpMsgs.forEach(msg => {
            logsHTML.push(`<div class="post-log-item log-lvl-up">🎉 ${msg}</div>`);
        });
    }

    // Identificar torre actual y siguiente
    const currentTowerId = (typeof GAME_STATE !== 'undefined' && GAME_STATE.currentTower)
        ? GAME_STATE.currentTower
        : ((GAME_STATE.floor <= 10) ? 1 : ((GAME_STATE.floor <= 20) ? 2 : 3));
    const currentTowerConfig = (typeof TOWERS_CONFIG !== 'undefined' && TOWERS_CONFIG[currentTowerId])
        ? TOWERS_CONFIG[currentTowerId]
        : { id: 1, name: 'Torre Cibernética', endFloor: 10, nextTowerId: 2 };
    const nextTowerId = currentTowerConfig ? currentTowerConfig.nextTowerId : null;
    const nextTowerConfig = (nextTowerId && typeof TOWERS_CONFIG !== 'undefined') ? TOWERS_CONFIG[nextTowerId] : null;

    if (hasBoss) {
        if (currentTowerId === 1) {
            logsHTML.push(`
                <div class="post-log-item log-key-unlocked">
                    <div class="key-banner-icon">🔑</div>
                    <div class="key-banner-text">
                        <strong>¡LLAVE CUÁNTICA OBTENIDA!</strong>
                        <span>ACCESO AUTORIZADO // TORRE CUÁNTICA (PISOS 11 - 20)</span>
                    </div>
                </div>
            `);
        } else if (currentTowerId === 2) {
            logsHTML.push(`
                <div class="post-log-item log-key-unlocked">
                    <div class="key-banner-icon">🗝️</div>
                    <div class="key-banner-text">
                        <strong>¡LLAVE DE SINGULARIDAD OBTENIDA!</strong>
                        <span>ACCESO AUTORIZADO // TORRE DE SINGULARIDAD (PISOS 21 - 30)</span>
                    </div>
                </div>
            `);
        } else {
            logsHTML.push(`
                <div class="post-log-item log-key-unlocked">
                    <div class="key-banner-icon">👑</div>
                    <div class="key-banner-text">
                        <strong>¡NÚCLEO DE SINGULARIDAD NEUTRALIZADO!</strong>
                        <span>¡HAS SUPERADO TODOS LOS SECTORES Y CONQUISTADO EL JUEGO!</span>
                    </div>
                </div>
            `);
        }

        // Guardar checkpoint en Base de Datos (cero localStorage)
        if (typeof AuthManager !== 'undefined' && typeof AuthManager.saveTowerCheckpoint === 'function') {
            const checkpointData = {
                tower_completed: currentTowerId,
                current_tower: nextTowerId || currentTowerId,
                floor: nextTowerConfig ? nextTowerConfig.startFloor : currentTowerConfig.endFloor,
                scrap: GAME_STATE.scrap,
                squad: GAME_STATE.team.map(r => r.serialize ? r.serialize() : {
                    id: r.id,
                    name: r.name,
                    element: r.element,
                    emoji: r.emoji,
                    level: r.level,
                    hp: r.hp,
                    maxHp: r.maxHp,
                    attack: r.attack,
                    defense: r.defense,
                    speed: r.speed,
                    equippedWeapon: r.equippedWeapon,
                    skills: r.skills
                }),
                inventory: {
                    items: GAME_STATE.inventory.items,
                    weapons: GAME_STATE.inventory.weapons
                }
            };
            AuthManager.saveTowerCheckpoint(checkpointData).then(res => {
                console.log('✅ Checkpoint de torre guardado en BD:', res);
            }).catch(err => {
                console.error('❌ Error guardando checkpoint de torre:', err);
            });
        }
    }
    
    allDroppedWeapons.forEach(wp => {
        let isGold = wp.isLegendary || wp.element === 'LEGENDARIO';
        let goldTag = isGold ? ' 👑 [DORADA LEGENDARIA]' : '';
        logsHTML.push(`<div class="post-log-item log-weapon ${isGold ? 'log-weapon-legendary' : ''}">🎁 ¡Soltó un arma: <strong>${wp.name}${goldTag}</strong> ${WEAPON_EMOJIS[wp.type]}!</div>`);
        GAME_STATE.inventory.weapons.push(wp);
        droppedWeapon = wp;
    });
    
    allDroppedItems.forEach(item => {
        logsHTML.push(`<div class="post-log-item log-item">💾 ¡Soltó un objeto: <strong>${item.name}</strong> ${item.emoji}!</div>`);
        GAME_STATE.inventory.items.push(item);
    });
    
    allDroppedConsumables.forEach(cons => {
        logsHTML.push(`<div class="post-log-item log-item">🧪 ¡Soltó consumible: <strong>${cons.name}</strong> ${cons.emoji}!</div>`);
        GAME_STATE.inventory.items.push(cons);
    });

    if (desc) desc.innerHTML = logsHTML.join('');

    const actionsContainer = document.getElementById('post-battle-actions');
    actionsContainer.innerHTML = '';
    
    // Botones de Reclutar para cada enemigo derrotado (si no es Jefe)
    defeatedRobots.forEach((enemy, idx) => {
        if (enemy.name.includes('Jefe')) return;
        
        let isElite = !!enemy.isElite || enemy.name.includes('ÉLITE');
        const btnRecruit = document.createElement('button');
        
        if (GAME_STATE.team.length >= 3) {
            btnRecruit.className = 'btn-post-action btn-post-recruit';
            btnRecruit.disabled = true;
            btnRecruit.innerHTML = `<span>🤖 Reclutar ${enemy.name} (Equipo Completo 3/3)</span>`;
        } else if (isElite) {
            let eliteChance = (typeof SkillsManager !== 'undefined') ? SkillsManager.getEliteRecruitChance() : 0.50;
            let successPct = Math.round(eliteChance * 100);
            let failPct = 100 - successPct;
            btnRecruit.className = 'btn-post-action btn-post-recruit-elite';
            btnRecruit.innerHTML = `<span>⚠️ Reclutar Élite: ${enemy.name} (${successPct}% Éxito / ${failPct}% 💥 Explosión)</span>`;
            btnRecruit.title = `${successPct}% prob. de éxito. Si falla, el robot explotará e infligirá un 10% de daño de HP a todo el escuadrón.`;
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
    });

    // Botón Desmantelar todo el botín derrotado
    const dismantleBase = (typeof SkillsManager !== 'undefined') ? SkillsManager.getDismantleRewards() : { scrap: 30, healPct: 0.10 };
    const dismantleScrap = dismantleBase.scrap * defeatedRobots.length;
    const dismantleHeal = dismantleBase.healPct;
    
    const btnScrap = document.createElement('button');
    btnScrap.className = 'btn-post-action btn-post-scrap';
    btnScrap.innerHTML = `<span>⚙️ Desmantelar Restos (+${dismantleScrap} Chatarra, +${Math.round(dismantleHeal * 100)}% Reparación)</span>`;
    
    if (hasBoss) {
        btnScrap.onclick = () => {
            addScrap(dismantleScrap);
            GAME_STATE.team.forEach(r => {
                if (!r.isOffline) {
                    r.heal(r.maxHp * dismantleHeal);
                }
            });
            updateTeamUI();
            btnScrap.disabled = true;
            btnScrap.classList.add('btn-dismantled');
            btnScrap.innerHTML = `<span>✔ Restos del Jefe Desmantelados (+${dismantleScrap} ⚙️, +${Math.round(dismantleHeal * 100)}% HP)</span>`;
        };
        actionsContainer.appendChild(btnScrap);

        if (nextTowerId && nextTowerConfig) {
            // Botón de Ascenso a la siguiente Torre
            const btnAscend = document.createElement('button');
            btnAscend.className = 'btn-post-action btn-post-ascend';
            btnAscend.innerHTML = `<span>🚀 Ascender a ${nextTowerConfig.name} (Piso ${nextTowerConfig.startFloor}) ➔</span>`;
            btnAscend.onclick = () => {
                btnAscend.disabled = true;
                advanceToNextTower(nextTowerId);
            };
            actionsContainer.appendChild(btnAscend);

            // Botón de Finalizar Incursión y Consolidar
            const btnRetire = document.createElement('button');
            btnRetire.className = 'btn-post-action btn-post-claim-victory';
            btnRetire.innerHTML = `<span>🏆 Retirarse con Victoria y Consolidar Chatarra</span>`;
            btnRetire.onclick = () => {
                if (typeof AuthManager !== 'undefined' && typeof AuthManager.clearTowerCheckpoint === 'function') {
                    AuthManager.clearTowerCheckpoint();
                }
                showScreen('screen-victory');
            };
            actionsContainer.appendChild(btnRetire);
        } else {
            // Victoria Absoluta (Torre 3 Final)
            const btnFinalVictory = document.createElement('button');
            btnFinalVictory.className = 'btn-post-action btn-post-claim-victory btn-pulse-gold';
            btnFinalVictory.innerHTML = `<span>👑 ¡CONQUISTAR SINGULARIDAD Y FINALIZAR EXPEDICIÓN! 🏆</span>`;
            btnFinalVictory.onclick = () => {
                if (typeof AuthManager !== 'undefined' && typeof AuthManager.clearTowerCheckpoint === 'function') {
                    AuthManager.clearTowerCheckpoint();
                }
                showScreen('screen-victory');
            };
            actionsContainer.appendChild(btnFinalVictory);
        }
    } else {
        btnScrap.onclick = () => {
            addScrap(dismantleScrap);
            GAME_STATE.team.forEach(r => {
                if (!r.isOffline) {
                    r.heal(r.maxHp * dismantleHeal);
                }
            });
            advanceFloor();
        };
        actionsContainer.appendChild(btnScrap);

        // Botón avanzar normal
        const btnIgnore = document.createElement('button');
        btnIgnore.className = 'btn-post-action btn-post-advance';
        btnIgnore.innerHTML = `<span>Avanzar Incursión ➔</span>`;
        btnIgnore.onclick = () => advanceFloor();
        actionsContainer.appendChild(btnIgnore);
    }
    
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
            setTimeout(() => {
                postContainer.classList.remove('anim-explosion-shake');
            }, 600);
        }
        
        const defeatedEmoji = document.getElementById('defeated-emoji');
        if (defeatedEmoji) {
            defeatedEmoji.innerHTML = '<span style="font-size: 3rem;">💥</span>';
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
