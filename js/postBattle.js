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
    
    let relicScrapMult = (typeof RelicsManager !== 'undefined') ? RelicsManager.getScrapMultiplier() : 1;
    let scrapGainMult = ((typeof SkillsManager !== 'undefined') ? SkillsManager.getScrapGainMultiplier() : 1) * relicScrapMult;
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
    let allDroppedRelics = [];

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
            // Boss drop: Garantizado Arma Legendaria Dorada + Consumible (sin chip)
            if (typeof generateLegendaryWeapon === 'function') {
                let legWp = generateLegendaryWeapon();
                allDroppedWeapons.push(legWp);
            } else {
                let wp = generateRandomWeapon(enemy.element);
                wp.isUpgraded = true;
                wp.name += " +1";
                allDroppedWeapons.push(wp);
            }
            
            let consumableKeys = Object.keys(ITEM_TYPES).filter(k => !k.includes('CHIP'));
            let randomConsumableType = ITEM_TYPES[consumableKeys[Math.floor(Math.random() * consumableKeys.length)]];
            let cons = { type: randomConsumableType, ...ITEM_DEFS[randomConsumableType] };
            allDroppedConsumables.push(cons);
            
        } else if (isElite) {
            // Elite drop: 100% Reliquia Pasiva (70% Común, 20% Rara, 10% Épica) + 1 Consumible garantizado
            let excludeList = (GAME_STATE && GAME_STATE.relics) ? [...GAME_STATE.relics] : [];
            allDroppedRelics.forEach(r => { if (r && r.id) excludeList.push(r.id); });

            let droppedRelic = (typeof getRandomWeightedRelic === 'function')
                ? getRandomWeightedRelic(excludeList, { COMUN: 0.70, RARO: 0.20, EPICO: 0.10 })
                : null;

            if (droppedRelic) {
                allDroppedRelics.push(droppedRelic);
            }

            let consumableKeys = Object.keys(ITEM_TYPES).filter(k => !k.includes('CHIP'));
            let randomConsumableType = ITEM_TYPES[consumableKeys[Math.floor(Math.random() * consumableKeys.length)]];
            let cons = { type: randomConsumableType, ...ITEM_DEFS[randomConsumableType] };
            allDroppedConsumables.push(cons);
            
        } else {
            // Normal monster: 0% armas (los enemigos regulares no dropean armas), 30% consumible
            if (Math.random() < 0.30) {
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
            let prevLvl = r.level;
            let leveledUp = r.gainXp(totalXp);
            if (leveledUp) {
                xpMsgs.push(`¡${r.name} subió al Nivel ${r.level}!`);
                if (prevLvl < 5 && r.level >= 5 && r.isStarter) {
                    const ult = r.getUltimateSkill ? r.getUltimateSkill() : null;
                    const ultName = ult ? ult.name : 'Habilidad Definitiva';
                    xpMsgs.push(`👑 ¡<strong>${r.name}</strong> ha desbloqueado su Habilidad Definitiva: <strong>${ultName}</strong>!`);
                }
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

        // 1. Duración del speedrun de la torre culminada
        const towerDuration = GAME_STATE.startTime ? Math.max(1, Math.round((Date.now() - GAME_STATE.startTime) / 1000)) : 0;
        const minutes = Math.floor(towerDuration / 60);
        const seconds = towerDuration % 60;
        const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Guardar referencia de la última torre culminada en GAME_STATE
        GAME_STATE.lastCompletedTower = {
            towerId: currentTowerId,
            duration: towerDuration,
            timeFormatted: timeFormatted,
            completedAt: Date.now()
        };

        // 2. Registrar victoria en el contador de la torre en el Perfil de Usuario
        if (typeof ProfileManager !== 'undefined' && typeof ProfileManager.recordTowerCompletion === 'function') {
            ProfileManager.recordTowerCompletion(currentTowerId);
        }

        // 3. Renderizar banner visual de Speedrun inmediatamente (estado: sincronizando)
        renderPostBattleSpeedrunBanner(currentTowerConfig, timeFormatted, null);

        // 4. Registrar partida ganada en el Top 10 Speedrun de la Torre correspondiente
        if (typeof AuthManager !== 'undefined' && typeof AuthManager.saveMatchRun === 'function') {
            const squadData = (typeof extractSquadData === 'function')
                ? extractSquadData()
                : (GAME_STATE.team ? GAME_STATE.team.map(r => ({
                    name: r.name,
                    element: r.element,
                    level: r.level || 1,
                    isOffline: !!r.isOffline,
                    equippedWeapon: r.equippedWeapon,
                    chips: (r.skills && r.skills.length > 2) ? r.skills.slice(2).map(s => s.name) : []
                })) : []);

            AuthManager.saveMatchRun({
                won: true,
                tower_id: currentTowerId,
                floor_reached: currentTowerConfig.endFloor || GAME_STATE.floor,
                duration_seconds: towerDuration,
                scrap_collected: GAME_STATE.scrap || 0,
                squad: squadData
            }).then(result => {
                const isSuccess = Boolean(result && result.success);
                renderPostBattleSpeedrunBanner(currentTowerConfig, timeFormatted, isSuccess);
            }).catch(err => {
                console.error('[PostBattle] Error guardando run en Supabase:', err);
                renderPostBattleSpeedrunBanner(currentTowerConfig, timeFormatted, false);
            });

            GAME_STATE.runSaved = true;
        }

        // 5. El punto de control (checkpoint) se guardará tras registrar todo el botín caído en el inventario

        // 6. Si el usuario es anónimo o desea vincular su récord, mostrar tarjeta de registro en post-batalla
        if (typeof AuthManager !== 'undefined' && typeof AuthManager.renderPostGameAuthBanner === 'function') {
            AuthManager.renderPostGameAuthBanner('screen-post-battle');
        }
    } else {
        // Si no es un jefe, ocultar banner de speedrun y formulario de auth
        const speedrunBanner = document.getElementById('post-speedrun-banner');
        if (speedrunBanner) speedrunBanner.style.display = 'none';
        const postAuthCard = document.getElementById('postbattle-auth-card');
        if (postAuthCard) postAuthCard.style.display = 'none';
    }
    
    if (hasBoss) {
        // Mostrar selector de 3 reliquias de Jefe
        renderBossRelicSelection(currentTowerId);
    } else {
        const relicSec = document.getElementById('boss-relic-reward-section');
        if (relicSec) relicSec.style.display = 'none';
    }

    allDroppedWeapons.forEach(wp => {
        let isGold = wp.isLegendary || wp.element === 'LEGENDARIO';
        let goldTag = isGold ? ' 👑 [DORADA LEGENDARIA]' : '';
        logsHTML.push(`<div class="post-log-item log-weapon ${isGold ? 'log-weapon-legendary' : ''}">🎁 ¡Soltó un arma: <strong>${wp.name}${goldTag}</strong> ${WEAPON_EMOJIS[wp.type]}!</div>`);
        GAME_STATE.inventory.weapons.push(wp);
        droppedWeapon = wp;
    });

    allDroppedRelics.forEach(relic => {
        const rarityKey = relic.rarity ? relic.rarity.toLowerCase() : 'comun';
        logsHTML.push(`<div class="post-log-item log-relic rarity-${rarityKey}">✨ ¡Botín Élite: <strong>${relic.name}</strong> (${relic.rarity}) ${relic.icon}!</div>`);
        if (typeof RelicsManager !== 'undefined') {
            RelicsManager.addRelic(relic.id);
        } else {
            if (!GAME_STATE.relics) GAME_STATE.relics = [];
            if (!GAME_STATE.relics.includes(relic.id)) GAME_STATE.relics.push(relic.id);
        }
    });
    
    allDroppedItems.forEach(item => {
        logsHTML.push(`<div class="post-log-item log-item">💾 ¡Soltó un objeto: <strong>${item.name}</strong> ${item.emoji}!</div>`);
        GAME_STATE.inventory.items.push(item);
    });
    
    allDroppedConsumables.forEach(cons => {
        logsHTML.push(`<div class="post-log-item log-item">🧪 ¡Soltó consumible: <strong>${cons.name}</strong> ${cons.emoji}!</div>`);
        GAME_STATE.inventory.items.push(cons);
    });

    // Guardar checkpoint blindado con todo el botín y estadísticas tras vencer al jefe
    if (hasBoss && typeof saveCurrentTowerCheckpoint === 'function') {
        saveCurrentTowerCheckpoint(currentTowerId);
    }

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
                if (typeof SoundManager !== 'undefined') SoundManager.play('ui_equip');
                recruitRobot(enemy);
                advanceFloor();
            };
        }
        actionsContainer.appendChild(btnRecruit);
    });

    // Botón Desmantelar todo el botín derrotado
    const dismantleBase = (typeof SkillsManager !== 'undefined') ? SkillsManager.getDismantleRewards() : { scrap: 30, healPct: 0.10 };
    const dismantleScrap = Math.floor(dismantleBase.scrap * defeatedRobots.length * relicScrapMult);
    const dismantleHeal = dismantleBase.healPct;
    
    const btnScrap = document.createElement('button');
    btnScrap.className = 'btn-post-action btn-post-scrap';
    btnScrap.innerHTML = `<span>⚙️ Desmantelar Restos (+${dismantleScrap} Chatarra, +${Math.round(dismantleHeal * 100)}% Reparación)</span>`;
    
    if (hasBoss) {
        btnScrap.onclick = () => {
            if (typeof SoundManager !== 'undefined') SoundManager.play('camp_repair');
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
            if (typeof saveCurrentTowerCheckpoint === 'function') {
                saveCurrentTowerCheckpoint(currentTowerId);
            }
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
            if (typeof SoundManager !== 'undefined') SoundManager.play('camp_repair');
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
        if (typeof SoundManager !== 'undefined') SoundManager.play('ui_equip');
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
        if (typeof SoundManager !== 'undefined') SoundManager.play('item_emp');
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

function renderPostBattleSpeedrunBanner(towerConfig, timeFormatted, isSaved) {
    const banner = document.getElementById('post-speedrun-banner');
    if (!banner) return;

    const towerName = towerConfig ? towerConfig.name.toUpperCase() : 'TORRE';
    const towerId = towerConfig ? towerConfig.id : 1;
    const startFloor = towerConfig ? towerConfig.startFloor : 1;
    const endFloor = towerConfig ? towerConfig.endFloor : 10;
    const playerName = (typeof AuthManager !== 'undefined') ? AuthManager.getPlayerDisplayName() : 'Piloto';

    let statusHtml = '<span class="speedrun-status-saving">⏳ Sincronizando con Top 10 de Supabase...</span>';
    if (isSaved === true) {
        statusHtml = `<span class="speedrun-status-success">⚡ ¡Tiempo registrado con éxito en el Top 10 de ${towerConfig ? towerConfig.name : 'Torre'}!</span>`;
    } else if (isSaved === false) {
        statusHtml = '<span class="speedrun-status-warning">⚠️ Tiempo registrado localmente (Supabase offline o sin conexión).</span>';
    }

    banner.innerHTML = `
        <div class="speedrun-banner-card">
            <div class="speedrun-banner-badge">⏱️ SPEEDRUN CONQUISTADO // ${towerName} (PISOS ${startFloor} - ${endFloor})</div>
            <div class="speedrun-banner-main">
                <div class="speedrun-time-display">
                    <span class="speedrun-time-label">TIEMPO SPEEDRUN:</span>
                    <span class="speedrun-time-val">${timeFormatted}</span>
                </div>
                <div class="speedrun-pilot-display">
                    <span class="speedrun-pilot-label">COMANDANTE / PILOTO:</span>
                    <span class="speedrun-pilot-val">👤 ${playerName}</span>
                </div>
            </div>
            <div class="speedrun-banner-footer">
                ${statusHtml}
                <button type="button" class="btn-speedrun-view-top10" onclick="openLeaderboardForTower(${towerId})">
                    🏆 Ver Top 10 ${towerConfig ? towerConfig.name : 'Torre'} ➔
                </button>
            </div>
        </div>
    `;
    banner.style.display = 'block';
}

async function saveCurrentTowerCheckpoint(towerCompletedId = null) {
    if (typeof AuthManager === 'undefined' || typeof AuthManager.saveTowerCheckpoint !== 'function') return;
    if (!GAME_STATE || !GAME_STATE.team || GAME_STATE.team.length === 0) return;
    
    // Si todos están muertos, no guardar checkpoint activo
    const allDead = GAME_STATE.team.every(r => r.isOffline || r.hp <= 0);
    if (allDead) {
        if (typeof AuthManager.clearTowerCheckpoint === 'function') {
            await AuthManager.clearTowerCheckpoint();
        }
        return;
    }

    // Identificar la torre completada (1, 2, etc.)
    const completedTowerId = (towerCompletedId !== null)
        ? towerCompletedId
        : ((typeof GAME_STATE !== 'undefined' && GAME_STATE.currentTower)
            ? GAME_STATE.currentTower
            : ((GAME_STATE.floor <= 10) ? 1 : ((GAME_STATE.floor <= 20) ? 2 : 3)));

    const completedTowerCfg = (typeof TOWERS_CONFIG !== 'undefined' && TOWERS_CONFIG[completedTowerId])
        ? TOWERS_CONFIG[completedTowerId]
        : null;

    if (!completedTowerCfg || !completedTowerCfg.nextTowerId || !TOWERS_CONFIG[completedTowerCfg.nextTowerId]) {
        // Si no hay siguiente torre (ej. tras Torre 3 final), no se guarda checkpoint de reanudación
        return;
    }

    const nextTowerId = completedTowerCfg.nextTowerId;
    const nextTowerCfg = TOWERS_CONFIG[nextTowerId];
    const targetTower = nextTowerId;
    const targetFloor = nextTowerCfg.startFloor; // Piso 11 para Torre 2, Piso 21 para Torre 3

    const checkpointData = {
        tower_completed: completedTowerId,
        current_tower: targetTower,
        floor: targetFloor,
        scrap: (typeof GAME_STATE.scrap !== 'undefined') ? GAME_STATE.scrap : 0,
        squad: (GAME_STATE && GAME_STATE.team) ? GAME_STATE.team.map(r => {
            const data = (typeof r.serialize === 'function') ? r.serialize() : {
                id: r.id,
                name: r.name,
                element: r.element,
                emoji: r.emoji,
                skin: r.skin,
                aura: r.aura,
                particles: r.particles,
                level: r.level,
                xp: r.xp,
                hp: r.hp,
                maxHp: r.maxHp,
                attack: r.attack,
                defense: r.defense,
                speed: r.speed,
                equippedWeapon: r.equippedWeapon,
                skills: r.skills,
                isOffline: false
            };
            // Al ascender a la siguiente torre, todos los aliados reviven con 100% HP y cooldowns reseteados
            data.isOffline = false;
            data.hp = r.maxHp || data.maxHp || data.hp;
            if (data.skills) {
                data.skills.forEach(s => { if (s.currentCd) s.currentCd = 0; });
            }
            return data;
        }) : [],
        inventory: {
            items: [...((GAME_STATE && GAME_STATE.inventory && GAME_STATE.inventory.items) ? GAME_STATE.inventory.items : [])],
            weapons: [...((GAME_STATE && GAME_STATE.inventory && GAME_STATE.inventory.weapons) ? GAME_STATE.inventory.weapons : [])]
        },
        relics: [...((GAME_STATE && GAME_STATE.relics) ? GAME_STATE.relics : [])],
        saved_at: new Date().toISOString()
    };

    await AuthManager.saveTowerCheckpoint(checkpointData);
}

let bossRelicClaimed = false;

function renderBossRelicSelection(currentTowerId) {
    const section = document.getElementById('boss-relic-reward-section');
    if (!section) return;
    
    bossRelicClaimed = false;
    let pool = (typeof getRandomRelicPool === 'function' && typeof GAME_STATE !== 'undefined')
        ? getRandomRelicPool(3, GAME_STATE.relics, ['LEGENDARIO', 'EPICO'])
        : [];
    
    // Si quedan menos de 3 reliquias entre Legendarias y Épicas, rellenar con cualquier reliquia no poseída
    if (pool.length < 3 && typeof getRandomRelicPool === 'function' && typeof GAME_STATE !== 'undefined') {
        const excludeCombined = [...(GAME_STATE.relics || []), ...pool.map(r => r.id)];
        const filler = getRandomRelicPool(3 - pool.length, excludeCombined);
        pool.push(...filler);
    }
    
    if (pool.length === 0) {
        section.style.display = 'none';
        return;
    }
    
    const relicCards = pool.map(relic => {
        const rarityKey = relic.rarity ? relic.rarity.toLowerCase() : 'legendario';
        return `
            <div class="boss-relic-card rarity-${rarityKey}" id="boss-relic-card-${relic.id}">
                <div class="boss-relic-top">
                    <span class="relic-modal-rarity-badge badge-${rarityKey}">✨ ${relic.rarity || 'RELIQUIA'}</span>
                    <span class="boss-relic-category">${relic.category || 'PASIVA'}</span>
                </div>
                <div class="boss-relic-icon-wrap">
                    <div class="boss-relic-icon">${relic.icon}</div>
                </div>
                <div class="boss-relic-name">${relic.name}</div>
                <div class="boss-relic-desc">${relic.desc}</div>
                ${relic.lore ? `<div class="boss-relic-lore">"${relic.lore}"</div>` : ''}
                <button class="btn-boss-relic-claim" onclick="claimBossVictoryRelic('${relic.id}', ${currentTowerId})">
                    <span>✨ Reclamar Reliquia</span>
                </button>
            </div>
        `;
    }).join('');
    
    section.innerHTML = `
        <div class="boss-relic-picker-box">
            <div class="boss-relic-picker-header">
                <div class="boss-relic-badge">🏆 BOTÍN DE JEFE // RECOMPENSA DE PODER ANCESTRAL</div>
                <h2 class="boss-relic-title">SELECCIONA UNA RELIQUIA DE JEFE (1 DE ${pool.length})</h2>
                <p class="boss-relic-subtitle">Elige 1 artefacto pasivo para potenciar a tu escuadrón permanentemente durante toda la expedición:</p>
            </div>
            <div class="boss-relic-grid">
                ${relicCards}
            </div>
        </div>
    `;
    section.style.display = 'block';
}

function claimBossVictoryRelic(relicId, currentTowerId) {
    if (bossRelicClaimed) return;
    bossRelicClaimed = true;
    
    if (typeof RelicsManager !== 'undefined') {
        RelicsManager.addRelic(relicId);
        const relicData = (typeof getRelicData === 'function') ? getRelicData(relicId) : null;
        if (relicData) {
            RelicsManager.showRelicAcquiredToast(relicData);
        }
    } else {
        if (!GAME_STATE.relics) GAME_STATE.relics = [];
        if (!GAME_STATE.relics.includes(relicId)) GAME_STATE.relics.push(relicId);
    }
    
    // Deshabilitar botones de relic cards y marcar la elegida
    document.querySelectorAll('.boss-relic-card').forEach(card => {
        const btn = card.querySelector('.btn-boss-relic-claim');
        if (card.id === `boss-relic-card-${relicId}`) {
            card.classList.add('is-claimed');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<span>✓ RELIQUIA ADQUIRIDA</span>';
                btn.classList.add('btn-claimed');
            }
        } else {
            card.classList.add('is-unpicked');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<span>🔒 No seleccionada</span>';
            }
        }
    });
    
    // Actualizar checkpoint si existe
    if (typeof saveCurrentTowerCheckpoint === 'function') {
        saveCurrentTowerCheckpoint(currentTowerId);
    }
}


