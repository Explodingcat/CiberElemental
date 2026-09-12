// relicsManager.js - Gestor Central de Reliquias y Artefactos Pasivos

const RelicsManager = {
    // Estado volátil por combate / sesión
    combatStateData: {
        firstTurnRegenDone: {}, // { [robotId]: true }
        sobredriveUsedThisRound: false,
        assaultBoostDone: false,
        lastActionWasBasic: {} // { [robotId]: boolean }
    },

    init() {
        if (typeof GAME_STATE !== 'undefined') {
            if (!GAME_STATE.relics) {
                GAME_STATE.relics = [];
            }
            if (GAME_STATE.fenixTriggeredThisRun === undefined) {
                GAME_STATE.fenixTriggeredThisRun = false;
            }
        }
        this.renderRelicsBar();
    },

    hasRelic(relicId) {
        if (!GAME_STATE || !GAME_STATE.relics || !Array.isArray(GAME_STATE.relics)) return false;
        return GAME_STATE.relics.includes(relicId);
    },

    addRelic(relicId) {
        if (!GAME_STATE) return false;
        if (!GAME_STATE.relics) GAME_STATE.relics = [];
        if (this.hasRelic(relicId)) return false;

        const relic = getRelicData(relicId);
        if (!relic) return false;

        GAME_STATE.relics.push(relicId);

        // Si la reliquia es propulsor de iones, recalcular stats de velocidad de todo el equipo
        if (relicId === 'propulsor_iones') {
            if (GAME_STATE.team) {
                GAME_STATE.team.forEach(r => {
                    if (r && r.recalculateStats) r.recalculateStats();
                });
            }
        }

        if (typeof SoundManager !== 'undefined') {
            SoundManager.play('ui_equip');
        }

        this.renderRelicsBar();
        this.showRelicAcquiredToast(relic);
        return true;
    },

    removeRelic(relicId) {
        if (!GAME_STATE || !GAME_STATE.relics) return;
        GAME_STATE.relics = GAME_STATE.relics.filter(id => id !== relicId);
        this.renderRelicsBar();
    },

    getRelics() {
        if (!GAME_STATE || !GAME_STATE.relics) return [];
        return GAME_STATE.relics.map(id => getRelicData(id)).filter(Boolean);
    },

    resetForNewRun() {
        if (GAME_STATE) {
            GAME_STATE.relics = [];
            GAME_STATE.fenixTriggeredThisRun = false;
        }
        this.combatStateData = {
            firstTurnRegenDone: {},
            sobredriveUsedThisRound: false,
            assaultBoostDone: false,
            lastActionWasBasic: {}
        };
        this.renderRelicsBar();
    },

    // ==========================================
    // RENDERIZADO DEL HUD SUPERIOR Y TOOLTIPS
    // ==========================================
    renderRelicsBar() {
        const barContainer = document.getElementById('top-relics-bar');
        if (!barContainer) return;

        const relics = this.getRelics();
        if (relics.length === 0) {
            barContainer.innerHTML = `<div class="relics-bar-empty" title="No tienes reliquias equipadas aún"><span>💎 Sin reliquias</span></div>`;
            return;
        }

        barContainer.innerHTML = relics.map(r => {
            const rarityInfo = RELIC_RARITIES[r.rarity] || RELIC_RARITIES.COMUN;
            return `
                <div class="top-relic-slot rarity-${r.rarity.toLowerCase()}" 
                     onclick="RelicsManager.openRelicTooltip('${r.id}', event)" 
                     title="${r.name} (${rarityInfo.name}) - Clic para ver detalles">
                    <span class="top-relic-icon">${r.icon}</span>
                    <span class="top-relic-glow" style="background: ${rarityInfo.glow};"></span>
                </div>
            `;
        }).join('');
    },

    showRelicAcquiredToast(relic) {
        const toastContainer = document.getElementById('game-container') || document.body;
        const toast = document.createElement('div');
        toast.className = `relic-acquired-toast rarity-${relic.rarity.toLowerCase()}`;
        const rarityInfo = RELIC_RARITIES[relic.rarity] || RELIC_RARITIES.COMUN;

        toast.innerHTML = `
            <div class="relic-toast-icon-wrap">
                <span class="relic-toast-icon">${relic.icon}</span>
            </div>
            <div class="relic-toast-content">
                <div class="relic-toast-header">
                    <span class="relic-toast-badge">${rarityInfo.name.toUpperCase()}</span>
                    <span class="relic-toast-tag">NUEVA RELIQUIA OBTENIDA</span>
                </div>
                <div class="relic-toast-name">${relic.name}</div>
                <div class="relic-toast-desc">${relic.desc}</div>
            </div>
        `;

        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => { if (toast.parentNode) toast.remove(); }, 500);
        }, 3200);
    },

    openRelicTooltip(relicId, event) {
        if (event) event.stopPropagation();
        const relic = getRelicData(relicId);
        if (!relic) return;

        if (typeof SoundManager !== 'undefined') {
            SoundManager.play('ui_hover');
        }

        const modal = document.getElementById('relic-tooltip-modal');
        if (!modal) return;

        const rarityInfo = RELIC_RARITIES[relic.rarity] || RELIC_RARITIES.COMUN;
        const categoryInfo = RELIC_CATEGORIES[relic.category] || { name: 'General', icon: '✨' };

        const content = document.getElementById('relic-tooltip-content');
        if (content) {
            content.innerHTML = `
                <div class="relic-modal-card card-rarity-${relic.rarity.toLowerCase()}">
                    <div class="relic-modal-header">
                        <div class="relic-modal-category">
                            <span>${categoryInfo.icon} ${categoryInfo.name.toUpperCase()}</span>
                        </div>
                        <span class="relic-modal-rarity-badge badge-${relic.rarity.toLowerCase()}">${rarityInfo.name.toUpperCase()}</span>
                    </div>

                    <div class="relic-modal-hero">
                        <div class="relic-modal-icon-pedestal">
                            <span class="relic-modal-big-icon">${relic.icon}</span>
                        </div>
                        <h2 class="relic-modal-title">${relic.name}</h2>
                    </div>

                    <div class="relic-modal-body">
                        <div class="relic-modal-desc-label">EFECTO PASIVO:</div>
                        <div class="relic-modal-desc">${relic.desc}</div>
                    </div>

                    <div class="relic-modal-lore">
                        <em>"${relic.lore}"</em>
                    </div>

                    <div class="relic-modal-footer">
                        <button class="btn-relic-modal-close" onclick="RelicsManager.closeRelicTooltip()">
                            <span>Cerrar</span>
                        </button>
                    </div>
                </div>
            `;
        }

        modal.classList.add('active');
    },

    closeRelicTooltip() {
        const modal = document.getElementById('relic-tooltip-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    },

    // ==========================================
    // HOOKS Y DISPARADORES EN COMBATE
    // ==========================================
    onCombatStart(combatState) {
        this.combatStateData.firstTurnRegenDone = {};
        this.combatStateData.sobredriveUsedThisRound = false;
        this.combatStateData.assaultBoostDone = false;
        this.combatStateData.lastActionWasBasic = {};

        // 1. Blindaje de Nanografeno: 15% Max HP Shield por 2 turnos a todos los aliados
        if (this.hasRelic('blindaje_nanografeno') && GAME_STATE && GAME_STATE.team) {
            GAME_STATE.team.forEach(robot => {
                if (!robot.isOffline && robot.hp > 0) {
                    const shieldAmt = Math.max(1, Math.floor(robot.maxHp * 0.15));
                    robot.addStatus({
                        type: 'SHIELD',
                        subType: 'NANO_SHIELD',
                        name: 'Blindaje de Nanografeno',
                        amount: shieldAmt,
                        duration: 2,
                        casterId: robot.id,
                        casterName: robot.name
                    });
                }
            });
            if (typeof logCombat === 'function') {
                logCombat('🛡️ [Reliquia] Blindaje de Nanografeno despliega un escudo de plasma (15% HP) sobre todo el escuadrón.');
            }
        }

        // 2. Inyector de Nanomarcas: Aplica Marca aleatoria a todos los enemigos desplegados
        if (this.hasRelic('inyector_nanomarcas') && combatState && combatState.enemies) {
            const elements = [ELEMENTS.FUEGO, ELEMENTS.AGUA, ELEMENTS.TIERRA, ELEMENTS.AIRE];
            combatState.enemies.forEach(enemy => {
                if (!enemy.isOffline && enemy.hp > 0) {
                    const randElem = elements[Math.floor(Math.random() * elements.length)];
                    const markType = `MARCA_${randElem}`;
                    enemy.statuses = (enemy.statuses || []).filter(s => !s.type.startsWith('MARCA_'));
                    enemy.addStatus({ type: markType, duration: 3 });
                }
            });
            if (typeof logCombat === 'function') {
                logCombat('💉 [Reliquia] Inyector de Nanomarcas adhiere marcas elementales tácticas a todos los enemigos.');
            }
        }

        // 3. Aislante Electroestático: Limpia aturdimiento en aliados si hubiera
        if (this.hasRelic('aislante_electrostatico') && GAME_STATE && GAME_STATE.team) {
            GAME_STATE.team.forEach(robot => {
                if (robot.statuses) {
                    robot.statuses = robot.statuses.filter(s => s.type !== 'STUN' && s.type !== 'SLOW_EXTREME');
                }
            });
        }
    },

    onRoundStart(combatState) {
        this.combatStateData.sobredriveUsedThisRound = false;

        // Impulsor de Asalto: En la Ronda 1, el aliado más veloz realiza 2 turnos consecutivos
        if (this.hasRelic('impulsor_asalto') && combatState && combatState.round === 1 && !this.combatStateData.assaultBoostDone) {
            this.combatStateData.assaultBoostDone = true;
            if (combatState.initiativeQueue && combatState.initiativeQueue.length > 0) {
                // Encontrar el primer aliado vivo en la cola
                const fastestAllyIdx = combatState.initiativeQueue.findIndex(item => item.type === 'PLAYER' && !item.robot.isOffline && item.robot.hp > 0);
                if (fastestAllyIdx !== -1) {
                    const fastestAlly = combatState.initiativeQueue[fastestAllyIdx];
                    // Duplicar su turno al inicio de la cola
                    combatState.initiativeQueue.splice(fastestAllyIdx + 1, 0, Object.assign({}, fastestAlly, { isAssaultBonusTurn: true }));
                    if (typeof logCombat === 'function') {
                        logCombat(`⚡ [Reliquia] ¡Impulsor de Asalto otorga 2 turnos consecutivos de arranque a [${fastestAlly.robot.name}]!`);
                    }
                }
            }
        }
    },

    onTurnStart(currentActor) {
        if (!currentActor || !currentActor.robot) return;
        const robot = currentActor.robot;
        const isAlly = (currentActor.type === 'PLAYER');

        // Aislante Electroestático: Inmunidad activa
        if (isAlly && this.hasRelic('aislante_electrostatico')) {
            if (robot.hasStatus('STUN')) {
                robot.removeStatus('STUN');
                if (typeof logCombat === 'function') {
                    logCombat(`🔌 [Reliquia] Aislante Electroestático anula el Aturdimiento sobre [${robot.name}].`);
                }
            }
            if (robot.hasStatus('SLOW_EXTREME')) {
                robot.removeStatus('SLOW_EXTREME');
            }
        }

        if (isAlly) {
            // Célula Regenerativa: 1 vez por combate, en el 1er turno de cada aliado cura un 4% Max HP
            if (this.hasRelic('celula_regenerativa') && !this.combatStateData.firstTurnRegenDone[robot.id]) {
                this.combatStateData.firstTurnRegenDone[robot.id] = true;
                const healAmt = Math.max(1, Math.floor(robot.maxHp * 0.04));
                const healed = robot.heal(healAmt);
                if (healed > 0 && typeof logCombat === 'function') {
                    logCombat(`🔋 [Reliquia] Célula Regenerativa repara y restaura ${healed} HP a [${robot.name}] en su primer turno.`);
                    if (typeof showHealPopup === 'function') {
                        showHealPopup(healed, false, currentActor.allyIndex || 0);
                    }
                }
            }

            // Núcleo Hipercaliente (Corrupta): pierde 3% HP actual al inicio de su turno
            if (this.hasRelic('nucleo_hipercaliente') && robot.hp > 0) {
                const burnSelf = Math.max(1, Math.floor(robot.hp * 0.03));
                robot.hp = Math.max(1, robot.hp - burnSelf);
                if (typeof logCombat === 'function') {
                    logCombat(`☣️ [Reliquia Corrupta] Núcleo Hipercaliente sobrecalienta a [${robot.name}] (-${burnSelf} HP).`);
                    if (typeof showDamagePopup === 'function') {
                        showDamagePopup(burnSelf, false, currentActor.allyIndex || 0, true);
                    }
                }
            }
        }
    },

    modifyOutgoingDamage(attacker, defender, baseDmg, skill, isBasicAttack) {
        let dmg = baseDmg;
        const isAlly = attacker && attacker.isAlly;

        if (isAlly) {
            // Núcleo Hipercaliente: +35% daño permanente
            if (this.hasRelic('nucleo_hipercaliente')) {
                dmg = Math.floor(dmg * 1.35);
            }

            // Reciclador de Energía: +15% daño en Habilidad Especial si la acción previa fue Básico
            if (!isBasicAttack && skill && skill.cd > 0 && this.hasRelic('reciclador_energia')) {
                if (this.combatStateData.lastActionWasBasic[attacker.id]) {
                    dmg = Math.floor(dmg * 1.15);
                    if (typeof logCombat === 'function') {
                        logCombat(`♻️ [Reliquia] Reciclador de Energía canaliza la inercia: +15% daño a ${skill.name}.`);
                    }
                }
            }
        }

        return dmg;
    },

    modifyCritChance(robot, baseCrit) {
        let crit = baseCrit;
        if (robot.isAlly && this.hasRelic('modulo_critico_mk2')) {
            crit += 10;
        }
        return crit;
    },

    modifyCritMultiplier(robot, baseMult) {
        let mult = baseMult;
        if (robot.isAlly && this.hasRelic('modulo_critico_mk2')) {
            mult = Math.max(1.75, mult + 0.25);
        }
        return mult;
    },

    getDaggerBonusProbability(attacker) {
        if (attacker && attacker.isAlly && this.hasRelic('giroscopio_frecuencia')) {
            return 0.15;
        }
        return 0;
    },

    checkDualGauntletExtraAttack(attacker) {
        // Guantelete de Plasma Dual: 25% prob de segundo golpe si NO porta daga
        if (attacker && attacker.isAlly && this.hasRelic('guantelete_plasma_dual')) {
            if (!attacker.equippedWeapon || attacker.equippedWeapon.type !== WEAPON_TYPES.DAGA) {
                return Math.random() < 0.25;
            }
        }
        return false;
    },

    onReactionTriggered(reaction, attacker, defender, isAttackerAlly) {
        if (!reaction) return;

        // 1. Catalizador Térmico: Si detonó Vaporización o Tormenta Ígnea, quema a los demás
        if (isAttackerAlly && this.hasRelic('catalizador_termico')) {
            if (reaction.name === '¡VAPORIZACIÓN!' || reaction.name === '¡TORMENTA ÍGNEA!') {
                if (typeof combatState !== 'undefined' && combatState.enemies) {
                    let burnedOthers = false;
                    combatState.enemies.forEach(other => {
                        if (other !== defender && !other.isOffline && other.hp > 0) {
                            other.statuses = (other.statuses || []).filter(s => s.type !== 'BURN');
                            other.addStatus({ type: 'BURN', duration: 3 });
                            burnedOthers = true;
                        }
                    });
                    if (burnedOthers && typeof logCombat === 'function') {
                        logCombat('🔥 [Reliquia] ¡Catalizador Térmico propaga Quemadura a los demás enemigos!');
                    }
                }
            }
        }

        // 2. Condensador de Plasma: Si detonó Choque Térmico, 20 de daño directo a todos los enemigos
        if (isAttackerAlly && this.hasRelic('condensador_plasma')) {
            if (reaction.name === '¡CHOQUE TÉRMICO!') {
                if (typeof combatState !== 'undefined' && combatState.enemies) {
                    combatState.enemies.forEach((other, eIdx) => {
                        if (!other.isOffline && other.hp > 0) {
                            other.takeDamage(20, 0, true);
                            if (typeof showDamagePopup === 'function') {
                                showDamagePopup(20, true, eIdx, true);
                            }
                        }
                    });
                    if (typeof logCombat === 'function') {
                        logCombat('⚡ [Reliquia] ¡Condensador de Plasma descarga 20 de daño electromagnético a todos los hostiles!');
                    }
                }
            }
        }

        // 3. Fisión Volcánica: Erupción salpica Marca de Fuego a los demás enemigos
        if (isAttackerAlly && this.hasRelic('fision_volcanica')) {
            if (reaction.name === '¡ERUPCIÓN!') {
                if (typeof combatState !== 'undefined' && combatState.enemies) {
                    combatState.enemies.forEach(other => {
                        if (other !== defender && !other.isOffline && other.hp > 0) {
                            other.statuses = (other.statuses || []).filter(s => !s.type.startsWith('MARCA_'));
                            other.addStatus({ type: 'MARCA_FUEGO', duration: 3 });
                        }
                    });
                    if (typeof logCombat === 'function') {
                        logCombat('🌋 [Reliquia] ¡Fisión Volcánica esparce magma y Marca de Fuego sobre los enemigos adyacentes!');
                    }
                }
            }
        }
    },

    onEnemyKilled(attacker, killedEnemy) {
        const isAttackerAlly = attacker && attacker.isAlly;

        // Ignición Perpetua: Transfiere Quemadura a otro enemigo vivo
        if (isAttackerAlly && this.hasRelic('ignicion_perpetua') && killedEnemy.hasStatus && killedEnemy.hasStatus('BURN')) {
            if (typeof combatState !== 'undefined' && combatState.enemies) {
                const aliveOther = combatState.enemies.find(e => e !== killedEnemy && !e.isOffline && e.hp > 0);
                if (aliveOther) {
                    aliveOther.statuses = (aliveOther.statuses || []).filter(s => s.type !== 'BURN');
                    aliveOther.addStatus({ type: 'BURN', duration: 3 });
                    if (typeof logCombat === 'function') {
                        logCombat(`🕯️ [Reliquia] Ignición Perpetua transfiere la Quemadura a [${aliveOther.name}] (3 turnos).`);
                    }
                }
            }
        }

        // Cronómetro de Sobredrive: Extra turno instantáneo al matar
        if (isAttackerAlly && this.hasRelic('cronometro_sobredrive') && !this.combatStateData.sobredriveUsedThisRound) {
            this.combatStateData.sobredriveUsedThisRound = true;
            if (typeof combatState !== 'undefined' && combatState.initiativeQueue) {
                // Insertar un nuevo turno del atacante inmediatamente a continuación
                const allyIdx = GAME_STATE.team.indexOf(attacker);
                combatState.initiativeQueue.splice(combatState.queueIndex + 1, 0, {
                    type: 'PLAYER',
                    robot: attacker,
                    allyIndex: allyIdx !== -1 ? allyIdx : 0,
                    enemyIndex: -1,
                    isSobredriveTurn: true
                });
                if (typeof logCombat === 'function') {
                    logCombat(`⏱️ [Reliquia Legendaria] ¡Cronómetro de Sobredrive concede un turno instantáneo a [${attacker.name}] tras la baja!`);
                }
            }
        }
    },

    checkLethalSurvive(robot) {
        // Protocolo Fénix: 1 vez por run
        if (robot.isAlly && this.hasRelic('protocolo_fenix') && !GAME_STATE.fenixTriggeredThisRun) {
            GAME_STATE.fenixTriggeredThisRun = true;
            robot.hp = 1;
            robot.isOffline = false;
            robot.addStatus({
                type: 'BARRIER',
                duration: 1,
                name: 'Barrera Fénix',
                casterId: robot.id,
                casterName: robot.name
            });
            if (typeof SoundManager !== 'undefined') {
                SoundManager.play('combo_plasma');
            }
            if (typeof logCombat === 'function') {
                logCombat(`🦅🔥 ¡[PROTOCOLO FÉNIX ACTIVADO]! [${robot.name}] rechaza la desactivación: sobrevive con 1 HP y Barrera de Plasma.`);
            }
            return true;
        }
        return false;
    },

    recordAction(actor, isBasic) {
        if (actor && actor.id) {
            this.combatStateData.lastActionWasBasic[actor.id] = !!isBasic;
        }
    },

    // ==========================================
    // MULTIPLICADORES DE ECONOMÍA Y TALLER
    // ==========================================
    getScrapMultiplier() {
        let mult = 1.0;
        if (this.hasRelic('iman_chatarra')) {
            mult += 0.35;
        }
        if (this.hasRelic('pacto_desguazador')) {
            mult += 1.0; // Duplica (+100%)
        }
        return mult;
    },

    getShopDiscountPct() {
        let discount = 0;
        if (this.hasRelic('tarjeta_acceso_vip')) {
            discount += 0.25;
        }
        return discount;
    },

    canCampHeal() {
        if (this.hasRelic('pacto_desguazador')) {
            return false; // Pacto del desguazador bloquea la curación en campamentos
        }
        return true;
    },

    isCampForgeFree() {
        if (this.hasRelic('pacto_desguazador')) {
            return true;
        }
        return false;
    },

    getCampMaxOperations() {
        if (this.hasRelic('kit_forja_avanzada')) {
            return 2;
        }
        return 1;
    }
};

window.RelicsManager = RelicsManager;
