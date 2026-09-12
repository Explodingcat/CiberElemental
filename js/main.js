function extractSquadData() {
    if (!GAME_STATE || !GAME_STATE.team) return [];
    return GAME_STATE.team.map(r => {
        const chips = (r.skills && r.skills.length > 2)
            ? r.skills.slice(2).map(s => s.name)
            : [];
        return {
            name: r.name,
            element: r.element,
            level: r.level || 1,
            isOffline: !!r.isOffline,
            equippedWeapon: r.equippedWeapon ? {
                name: r.equippedWeapon.name,
                type: r.equippedWeapon.type,
                element: r.equippedWeapon.element,
                isPlusOne: !!r.equippedWeapon.isPlusOne
            } : null,
            chips: chips
        };
    });
}

let runTimerInterval = null;

function startRunTimer() {
    stopRunTimer();
    updateRunTimerDisplay();
    runTimerInterval = setInterval(updateRunTimerDisplay, 500);
}

function stopRunTimer() {
    if (runTimerInterval) {
        clearInterval(runTimerInterval);
        runTimerInterval = null;
    }
}

function updateRunTimerDisplay() {
    const timerEl = document.getElementById('run-timer-val');
    if (!timerEl) return;
    if (!GAME_STATE || !GAME_STATE.startTime) {
        timerEl.innerText = '00:00';
        return;
    }
    const elapsedSecs = Math.max(0, Math.floor((Date.now() - GAME_STATE.startTime) / 1000));
    const hours = Math.floor(elapsedSecs / 3600);
    const mins = Math.floor((elapsedSecs % 3600) / 60);
    const secs = elapsedSecs % 60;
    
    if (hours > 0) {
        timerEl.innerText = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
        timerEl.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add('active');
    }

    // Gestión de Música Ambiental según la pantalla
    if (typeof SoundManager !== 'undefined') {
        if (screenId === 'screen-main-menu' || screenId === 'screen-start') {
            SoundManager.playMusic('TITLE_THEME');
        } else if (screenId === 'screen-map') {
            SoundManager.playMusic('MAP_THEME');
        } else if (screenId === 'screen-game-over') {
            SoundManager.playMusic('GAMEOVER_THEME');
            SoundManager.play('robot_death');
        } else if (screenId === 'screen-victory') {
            SoundManager.playMusic('VICTORY_FANFARE');
        }
    }
    
    // Mostrar u ocultar la barra superior completa
    const topBar = document.getElementById('top-bar');
    if (topBar) {
        if (['screen-main-menu', 'screen-start', 'screen-game-over', 'screen-victory'].includes(screenId)) {
            topBar.style.display = 'none';
            stopRunTimer();
        } else {
            topBar.style.display = 'flex';
            if (GAME_STATE && GAME_STATE.startTime && !runTimerInterval) {
                startRunTimer();
            }
        }
    }

    if (screenId === 'screen-main-menu') {
        checkSavedCheckpoint();
    } else if (screenId === 'screen-start') {
        if (typeof goToRobotStep === 'function') {
            goToRobotStep();
        }
    }

    // Actualizar datos de Game Over y guardar run
    if (screenId === 'screen-game-over' && typeof GAME_STATE !== 'undefined') {
        const floorEl = document.getElementById('gameover-floor');
        const scrapEl = document.getElementById('gameover-scrap');
        const teamEl = document.getElementById('gameover-team-count');
        const globalScrapAddedEl = document.getElementById('gameover-global-scrap-added');
        if (floorEl) floorEl.innerText = `Piso ${GAME_STATE.floor}`;
        if (scrapEl) scrapEl.innerText = `${GAME_STATE.scrap} ⚙️`;
        if (teamEl) teamEl.innerText = `${GAME_STATE.team ? GAME_STATE.team.length : 1} 💀`;
        if (globalScrapAddedEl) globalScrapAddedEl.innerText = `+${GAME_STATE.scrap} ⚙️ transferidos al Pozo Global de tu Cuenta`;

        if (!GAME_STATE.runSaved && typeof AuthManager !== 'undefined') {
            GAME_STATE.runSaved = true;
            const duration = GAME_STATE.startTime ? Math.max(1, Math.round((Date.now() - GAME_STATE.startTime) / 1000)) : 0;
            const towerId = (GAME_STATE && GAME_STATE.currentTower) ? GAME_STATE.currentTower : ((GAME_STATE.floor <= 10) ? 1 : ((GAME_STATE.floor <= 20) ? 2 : 3));
            AuthManager.saveMatchRun({
                won: false,
                tower_id: towerId,
                floor_reached: GAME_STATE.floor || 1,
                duration_seconds: duration,
                scrap_collected: GAME_STATE.scrap || 0,
                squad: extractSquadData()
            });
            if (typeof SkillsManager !== 'undefined') SkillsManager.updateAllScrapDisplays();
        }

        // Si el escuadrón cae derrotado, se borra el checkpoint de la base de datos
        if (typeof AuthManager !== 'undefined' && typeof AuthManager.clearTowerCheckpoint === 'function') {
            AuthManager.clearTowerCheckpoint();
        }

        // Renderizar banner / formulario de registro si el usuario es anónimo
        if (typeof AuthManager !== 'undefined') {
            AuthManager.renderPostGameAuthBanner('screen-game-over');
        }
    }

    // Actualizar datos de Victoria Final y guardar run
    if (screenId === 'screen-victory' && typeof GAME_STATE !== 'undefined') {
        const scrapEl = document.getElementById('victory-scrap');
        const teamEl = document.getElementById('victory-team-count');
        const rosterEl = document.getElementById('victory-team-roster');
        const globalScrapAddedEl = document.getElementById('victory-global-scrap-added');
        
        let aliveRobots = GAME_STATE.team ? GAME_STATE.team.filter(r => !r.isOffline) : [];
        if (scrapEl) scrapEl.innerText = `${GAME_STATE.scrap} ⚙️`;
        if (teamEl) teamEl.innerText = `${aliveRobots.length} 🤖`;
        if (globalScrapAddedEl) globalScrapAddedEl.innerText = `+${GAME_STATE.scrap} ⚙️ transferidos al Pozo Global de tu Cuenta`;

        const currentTowerId = (GAME_STATE && GAME_STATE.currentTower) ? GAME_STATE.currentTower : 1;
        const sectorEl = document.getElementById('victory-sector-conquered');
        if (sectorEl) {
            const towerCfg = (typeof TOWERS_CONFIG !== 'undefined' && TOWERS_CONFIG[currentTowerId]) ? TOWERS_CONFIG[currentTowerId] : null;
            sectorEl.innerText = towerCfg ? `${towerCfg.name.toUpperCase()} (PISO ${GAME_STATE.floor || 10}) ✔` : `PISO ${GAME_STATE.floor || 10} ✔`;
        }

        if (rosterEl && GAME_STATE.team) {
            rosterEl.innerHTML = GAME_STATE.team.map(r => `
                <div class="victory-hero-pill elem-${r.element}">
                    <span>${r.emoji} ${r.name}</span>
                    <span class="victory-lvl">NV.${r.level}</span>
                </div>
            `).join('');
        }

        if (!GAME_STATE.runSaved && typeof AuthManager !== 'undefined') {
            GAME_STATE.runSaved = true;
            const duration = GAME_STATE.startTime ? Math.max(1, Math.round((Date.now() - GAME_STATE.startTime) / 1000)) : 0;
            AuthManager.saveMatchRun({
                won: true,
                tower_id: currentTowerId,
                floor_reached: GAME_STATE.floor || 10,
                duration_seconds: duration,
                scrap_collected: GAME_STATE.scrap || 0,
                squad: extractSquadData()
            });
            if (typeof SkillsManager !== 'undefined') SkillsManager.updateAllScrapDisplays();
        }

        // Si se consolida la victoria, se borra el checkpoint de la base de datos
        if (typeof AuthManager !== 'undefined' && typeof AuthManager.clearTowerCheckpoint === 'function') {
            AuthManager.clearTowerCheckpoint();
        }

        // Renderizar banner / formulario de registro si el usuario es anónimo
        if (typeof AuthManager !== 'undefined') {
            AuthManager.renderPostGameAuthBanner('screen-victory');
        }
    }
}

function initGame() {
    let robotKeys = Object.keys(ROBOT_TEMPLATES);
    let weaponKeys = Object.keys(WEAPON_TYPES);
    
    let currentRobotIndex = 0;
    let currentWeaponIndex = 0;
    let currentSelectStep = 1;
    let isRobotCardFlipped = false;
    
    const robotCardInner = document.getElementById('robot-card-inner');
    const robotCardFront = document.getElementById('robot-card-front');
    const robotCardBack = document.getElementById('robot-card-back');
    const stepRobotEl = document.getElementById('step-select-robot');
    const stepWeaponEl = document.getElementById('step-select-weapon');
    const stepInstructionEl = document.getElementById('start-step-instruction');
    const dotsContainer = document.getElementById('robot-carousel-dots');
    const weaponCardsRow = document.getElementById('weapon-cards-row');
    const selectedRobotChip = document.getElementById('selected-robot-chip');

    function toggleRobotCardFlip(e) {
        if (e) e.stopPropagation();
        isRobotCardFlipped = !isRobotCardFlipped;
        if (robotCardInner) {
            if (isRobotCardFlipped) {
                robotCardInner.classList.add('flipped');
            } else {
                robotCardInner.classList.remove('flipped');
            }
        }
        if (typeof SoundManager !== 'undefined') SoundManager.play('ui_hover');
    }
    window.toggleRobotCardFlip = toggleRobotCardFlip;

    function goToWeaponStep() {
        if (typeof SoundManager !== 'undefined') SoundManager.play('ui_click');
        currentSelectStep = 2;
        isRobotCardFlipped = false;
        if (robotCardInner) robotCardInner.classList.remove('flipped');
        
        if (stepRobotEl) stepRobotEl.classList.remove('active');
        if (stepWeaponEl) stepWeaponEl.classList.add('active');
        if (stepInstructionEl) {
            stepInstructionEl.innerText = 'Paso 2 de 2: Selecciona el módulo de armamento para tu incursión';
        }
        renderWeaponStep();
    }
    window.goToWeaponStep = goToWeaponStep;

    function goToRobotStep() {
        if (typeof SoundManager !== 'undefined') SoundManager.play('ui_hover');
        currentSelectStep = 1;
        isRobotCardFlipped = false;
        if (robotCardInner) robotCardInner.classList.remove('flipped');
        
        if (stepWeaponEl) stepWeaponEl.classList.remove('active');
        if (stepRobotEl) stepRobotEl.classList.add('active');
        if (stepInstructionEl) {
            stepInstructionEl.innerText = 'Paso 1 de 2: Selecciona tu chasis táctico y analiza sus estadísticas';
        }
        renderRobot();
    }
    window.goToRobotStep = goToRobotStep;

    function selectWeapon(index) {
        if (typeof SoundManager !== 'undefined') SoundManager.play('ui_click');
        currentWeaponIndex = index;
        renderWeaponStep();
    }
    window.selectWeapon = selectWeapon;

    function renderRobot() {
        let key = robotKeys[currentRobotIndex];
        let template = ROBOT_TEMPLATES[key];
        let elStats = ELEMENT_BASE_STATS[template.element];
        let element = template.element;

        // Resetear volteo de tarjeta al cambiar de robot
        isRobotCardFlipped = false;
        if (robotCardInner) robotCardInner.classList.remove('flipped');

        // Subtítulo de rol
        let roleSubtitle = '';
        if (element === ELEMENTS.FUEGO) {
            roleSubtitle = 'Guerrero Ofensivo // Daño Térmico Directo';
        } else if (element === ELEMENTS.AGUA) {
            roleSubtitle = 'Soporte Táctico // Escudos y Control';
        } else if (element === ELEMENTS.TIERRA) {
            roleSubtitle = 'Coloso Defensivo // Tanque y Provocación';
        } else if (element === ELEMENTS.AIRE) {
            roleSubtitle = 'Pícaro Cibernético // Alta Velocidad y Evasión';
        }

        // Habilidad especial
        let specialSkill = template.skills && template.skills[1] ? template.skills[1] : { name: 'Especial', cd: 3, desc: 'Habilidad activa' };

        // Afinidad elemental descriptiva
        let affinityDesc = '';
        if (element === ELEMENTS.FUEGO) {
            affinityDesc = 'Afinidad Térmica: <strong>+15% ATQ</strong> y <strong>+15% Daño adicional</strong> contra rivales con Marca o Quemadura activa.';
        } else if (element === ELEMENTS.AGUA) {
            affinityDesc = 'Afinidad Hidrostática: <strong>+15% HP Máx</strong> y <strong>+25% Potencia de Escudos</strong> temporales y barreras de plasma.';
        } else if (element === ELEMENTS.TIERRA) {
            affinityDesc = 'Afinidad Tectónica: <strong>+25% HP Máx</strong> y <strong>-10% Daño recibido</strong> permanente (Mitigación pasiva de blindaje).';
        } else if (element === ELEMENTS.AIRE) {
            affinityDesc = 'Afinidad Electrostática: <strong>+15% ATQ</strong>, <strong>+2 Velocidad base</strong> y <strong>+10% Probabilidad de Esquiva</strong>.';
        }

        // Avatar cosméticos
        const previewAura = (typeof CosmeticsManager !== 'undefined') ? CosmeticsManager.getEquippedAura() : 'NONE';
        const previewParticles = (typeof CosmeticsManager !== 'undefined') ? CosmeticsManager.getEquippedParticles() : 'NONE';
        const previewRobot = new Robot(Object.assign({}, template, {
            aura: previewAura,
            particles: previewParticles
        }));
        const avatarGraphicHtml = previewRobot.getAvatarGraphicHtml();

        // Porcentajes para las barras de progreso
        const hpPct = Math.min(100, Math.max(10, Math.round((elStats.maxHp / 200) * 100)));
        const atkPct = Math.min(100, Math.max(10, Math.round((elStats.atk / 25) * 100)));
        const spdPct = Math.min(100, Math.max(10, Math.round((elStats.spd / 20) * 100)));
        const critPct = Math.min(100, Math.max(10, Math.round(((elStats.critChance || 5) / 25) * 100)));

        // Actualizar clases temáticas en las caras de la tarjeta
        if (robotCardFront) {
            robotCardFront.className = `robot-card-face robot-card-front theme-${element}`;
            robotCardFront.innerHTML = `
                <div class="robot-card-front-content">
                    <!-- Columna Izquierda: Avatar y Nombre -->
                    <div class="robot-card-hero-col">
                        <div class="robot-card-avatar-ring ring-${element}">
                            ${avatarGraphicHtml}
                        </div>
                        <h2 class="robot-card-name">${template.name}</h2>
                        <span class="element-badge elem-badge-${element}" style="margin-bottom: 4px;">
                            ${ELEMENT_EMOJIS[element]} ${element}
                        </span>
                        <div class="robot-card-role">${roleSubtitle}</div>
                    </div>
                    
                    <!-- Columna Derecha: Barras de Estadísticas -->
                    <div class="robot-card-stats-col">
                        <div class="robot-stat-row">
                            <span class="robot-stat-label">SALUD INTEGRAL (HP)</span>
                            <div class="robot-stat-track">
                                <div class="robot-stat-fill fill-${element}" style="width: ${hpPct}%;"></div>
                            </div>
                            <span class="robot-stat-val">${elStats.maxHp}</span>
                        </div>

                        <div class="robot-stat-row">
                            <span class="robot-stat-label">POTENCIA DE ${element} (ATQ)</span>
                            <div class="robot-stat-track">
                                <div class="robot-stat-fill fill-${element}" style="width: ${atkPct}%;"></div>
                            </div>
                            <span class="robot-stat-val">${elStats.atk}</span>
                        </div>

                        <div class="robot-stat-row">
                            <span class="robot-stat-label">VELOCIDAD DE CICLO</span>
                            <div class="robot-stat-track">
                                <div class="robot-stat-fill fill-${element}" style="width: ${spdPct}%;"></div>
                            </div>
                            <span class="robot-stat-val">${elStats.spd}</span>
                        </div>

                        <div class="robot-stat-row">
                            <span class="robot-stat-label">ÍNDICE CRÍTICO</span>
                            <div class="robot-stat-track">
                                <div class="robot-stat-fill fill-${element}" style="width: ${critPct}%;"></div>
                            </div>
                            <span class="robot-stat-val">${elStats.critChance || 5}%</span>
                        </div>
                    </div>
                </div>

                <div class="robot-card-flip-prompt">
                    <span>🔄 Tocar tarjeta para ver habilidades y afinidad</span>
                </div>
            `;
        }

        if (robotCardBack) {
            robotCardBack.className = `robot-card-face robot-card-back theme-${element}`;
            robotCardBack.innerHTML = `
                <div class="card-back-header">
                    <div class="card-back-title-group">
                        <span class="card-back-title">${template.name.toUpperCase()} // DATOS TÁCTICOS</span>
                        <span class="element-badge elem-badge-${element}">${ELEMENT_EMOJIS[element]} ${element}</span>
                    </div>
                    <button class="card-back-flip-btn" onclick="toggleRobotCardFlip(event)">
                        🔄 Volver a Stats
                    </button>
                </div>

                <div class="card-back-sections">
                    <div class="card-detail-box">
                        <div class="card-detail-header">
                            <span class="card-detail-tag-basic">⚔️ ATAQUE BÁSICO</span>
                            <span class="card-detail-cd">0 CD</span>
                        </div>
                        <div class="card-detail-body">
                            1.0x Potencia • Si porta un arma, adquiere su elemento con <strong>20% prob. de aplicar Marca de ${element}</strong> (3 turnos).
                        </div>
                    </div>

                    <div class="card-detail-box">
                        <div class="card-detail-header">
                            <span class="card-detail-tag-skill">⚡ ${specialSkill.name.toUpperCase()}</span>
                            <span class="card-detail-cd">⏱️ CD: ${specialSkill.cd} turnos</span>
                        </div>
                        <div class="card-detail-body">
                            ${specialSkill.desc}
                        </div>
                    </div>

                    <div class="card-detail-box">
                        <div class="card-detail-header">
                            <span class="card-detail-tag-affinity">✨ AFINIDAD ELEMENTAL</span>
                            <span class="element-badge elem-badge-${element}" style="font-size: 9.5px; padding: 1px 6px;">100% SINERGIA</span>
                        </div>
                        <div class="card-detail-body">
                            ${affinityDesc}
                        </div>
                    </div>
                </div>
            `;
        }

        // Renderizar dots del carrusel
        if (dotsContainer) {
            dotsContainer.innerHTML = robotKeys.map((k, idx) => `
                <div class="carousel-dot ${idx === currentRobotIndex ? 'active' : ''}" onclick="selectRobotByIndex(${idx})" title="${ROBOT_TEMPLATES[k].name}"></div>
            `).join('');
        }
    }

    function selectRobotByIndex(idx) {
        if (typeof SoundManager !== 'undefined') SoundManager.play('ui_hover');
        currentRobotIndex = idx;
        renderRobot();
    }
    window.selectRobotByIndex = selectRobotByIndex;

    function prevRobot() {
        if (typeof SoundManager !== 'undefined') SoundManager.play('ui_hover');
        currentRobotIndex = (currentRobotIndex - 1 + robotKeys.length) % robotKeys.length;
        renderRobot();
    }
    window.prevRobot = prevRobot;

    function nextRobot() {
        if (typeof SoundManager !== 'undefined') SoundManager.play('ui_hover');
        currentRobotIndex = (currentRobotIndex + 1) % robotKeys.length;
        renderRobot();
    }
    window.nextRobot = nextRobot;

    const btnPrev = document.getElementById('btn-prev-robot');
    const btnNext = document.getElementById('btn-next-robot');
    if (btnPrev) btnPrev.onclick = prevRobot;
    if (btnNext) btnNext.onclick = nextRobot;

    function renderWeaponStep() {
        let template = ROBOT_TEMPLATES[robotKeys[currentRobotIndex]];
        let element = template.element;

        const weaponSubtitle = document.getElementById('weapon-section-subtitle');
        if (weaponSubtitle) {
            weaponSubtitle.innerHTML = `Chasis seleccionado: <strong style="color: #66fcf1;">${template.name}</strong> (${element}) • Selecciona 1 arma para tu incursión`;
        }

        // Renderizar 4 tarjetas de armas en fila
        if (weaponCardsRow) {
            const weaponsData = [
                {
                    key: 'DAGA',
                    name: 'Daga',
                    role: '🗡️ Filo Rápido',
                    desc: '<strong>25% prob. de doble ataque</strong> consecutivo (40% con +1). Cada impacto aplica Marca Elemental al rival.'
                },
                {
                    key: 'HACHA',
                    name: 'Hacha',
                    role: '🪓 Arma Pesada',
                    desc: '<strong>+10% ATQ base</strong>. <strong>20% prob. de Rompearmaduras</strong> (-25% DEF). +35% Daño contra rivales con ≤40% HP.'
                },
                {
                    key: 'BACULO',
                    name: 'Báculo',
                    role: '🪄 Canalizador',
                    desc: 'Al finalizar cada turno, genera un <strong>Escudo de plasma automático</strong> (10% HP Máx). En +1 protege a aliados.'
                },
                {
                    key: 'ESPADA',
                    name: 'Espada',
                    role: '⚔️ Hoja Balanceada',
                    desc: '<strong>+15% Daño base</strong> y <strong>+10% Crítico</strong> (+30%/+20% con +1). Críticos activan <strong>Racha de ATQ</strong>.'
                }
            ];

            weaponCardsRow.innerHTML = weaponsData.map((w, idx) => {
                const isSelected = (idx === currentWeaponIndex);
                const selectedBadge = isSelected ? '<span class="weapon-card-selected-badge">✔ SELECCIONADA</span>' : '';
                return `
                    <div class="weapon-card-item ${isSelected ? 'selected' : ''}" onclick="selectWeapon(${idx})">
                        ${selectedBadge}
                        <div class="weapon-card-icon-wrapper platform-${element}">
                            <div class="avatar-emoji elem-${element}">${WEAPON_EMOJIS[w.key]}</div>
                        </div>
                        <h3 class="weapon-card-title">${w.name} de ${element}</h3>
                        <div class="weapon-card-role">${w.role}</div>
                        <div class="weapon-card-desc">${w.desc}</div>
                    </div>
                `;
            }).join('');
        }
    }

    // Navegación por teclado (Flechas / Enter / Espacio)
    document.addEventListener('keydown', (e) => {
        const startScreen = document.getElementById('screen-start');
        if (!startScreen || !startScreen.classList.contains('active')) return;
        
        if (currentSelectStep === 1) {
            if (e.key === 'ArrowLeft') {
                prevRobot();
            } else if (e.key === 'ArrowRight') {
                nextRobot();
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === ' ') {
                e.preventDefault();
                toggleRobotCardFlip();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                goToWeaponStep();
            }
        } else if (currentSelectStep === 2) {
            if (e.key === 'ArrowLeft') {
                selectWeapon((currentWeaponIndex - 1 + 4) % 4);
            } else if (e.key === 'ArrowRight') {
                selectWeapon((currentWeaponIndex + 1) % 4);
            } else if (e.key === 'Escape' || e.key === 'Backspace') {
                e.preventDefault();
                goToRobotStep();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('btn-start').click();
            }
        }
    });

    document.getElementById('btn-start').onclick = () => {
        if (typeof SoundManager !== 'undefined') SoundManager.play('ui_click');
        let selectedTemplate = robotKeys[currentRobotIndex];
        let selectedWeaponType = weaponKeys[currentWeaponIndex];
        
        // Reiniciar equipo, inventario y reliquias para nueva expedición
        GAME_STATE.team = [];
        GAME_STATE.inventory = { items: [], weapons: [] };
        if (typeof RelicsManager !== 'undefined') {
            RelicsManager.resetForNewRun();
        } else {
            GAME_STATE.relics = [];
            GAME_STATE.fenixTriggeredThisRun = false;
        }
        
        addStarterRobot(selectedTemplate);
        
        // Equipar el arma seleccionada
        const playerRobot = GAME_STATE.team[0];
        let weapon = generateRandomWeapon(playerRobot.element);
        weapon.type = WEAPON_TYPES[selectedWeaponType];
        weapon.name = `${selectedWeaponType.charAt(0) + selectedWeaponType.slice(1).toLowerCase()} de ${playerRobot.element}`;
        if (weapon.type === WEAPON_TYPES.DAGA) weapon.desc = '25% prob. doble ataque (40% con +1). Cada golpe puede aplicar marca.';
        if (weapon.type === WEAPON_TYPES.HACHA) weapon.desc = '+10% ATQ base. 20% prob. Rompearmaduras (-25% DEF). Perfora 50% defensas (75% con +1). +35% Daño a ≤40% HP (+45% con +1).';
        if (weapon.type === WEAPON_TYPES.BACULO) weapon.desc = 'Al finalizar su turno, genera un Escudo de plasma (10% HP Máx, 15% con +1). En +1 otorga micro-escudo (8%) a aliado y 20% prob. de -1 CD.';
        if (weapon.type === WEAPON_TYPES.ESPADA) weapon.desc = '+15% Daño base y +10% Crítico (+30%/+20% con +1). Críticos otorgan +10% ATQ temporal.';
        
        playerRobot.equipWeapon(weapon);
        
        GAME_STATE.currentTower = 1;
        GAME_STATE.floor = 1;
        GAME_STATE.currentNodeId = null;
        GAME_STATE.startTime = Date.now();
        GAME_STATE.runSaved = false;
        startRunTimer();
        
        // Inicializar chatarra de la run con pasiva de meta-progresión
        GAME_STATE.scrap = (typeof SkillsManager !== 'undefined') ? SkillsManager.getStartingScrap() : 0;
        if (typeof updateScrapDisplay === 'function') {
            updateScrapDisplay();
        } else {
            const disp = document.getElementById('scrap-display');
            if (disp) disp.innerText = `Chatarra: ${GAME_STATE.scrap} ⚙️`;
        }

        generateFullMap(1);
        renderMap();

        // Al iniciar una nueva expedición desde Torre 1, limpiar checkpoint previo
        if (typeof AuthManager !== 'undefined' && typeof AuthManager.clearTowerCheckpoint === 'function') {
            AuthManager.clearTowerCheckpoint();
        }

        showScreen('screen-map');
    };
    
    // Initial render
    renderRobot();
}

async function checkSavedCheckpoint() {
    const resumeBtn = document.getElementById('btn-resume-run');
    if (!resumeBtn) return;
    
    if (typeof AuthManager === 'undefined' || typeof AuthManager.getSavedTowerCheckpoint !== 'function') {
        resumeBtn.style.display = 'none';
        return;
    }
    
    try {
        const checkpoint = await AuthManager.getSavedTowerCheckpoint();
        if (checkpoint && checkpoint.squad && checkpoint.squad.length > 0 && checkpoint.floor) {
            const towerId = checkpoint.current_tower || ((checkpoint.floor <= 10) ? 1 : ((checkpoint.floor <= 20) ? 2 : 3));
            const towerCfg = (typeof TOWERS_CONFIG !== 'undefined' && TOWERS_CONFIG[towerId]) 
                ? TOWERS_CONFIG[towerId] 
                : { name: `Torre ${towerId}` };
            
            const badgeEl = document.getElementById('resume-tower-badge');
            if (badgeEl) badgeEl.innerText = `${towerCfg.name.toUpperCase()} (PISO ${checkpoint.floor})`;
            
            resumeBtn.style.display = 'flex';
            resumeBtn.onclick = () => resumeSavedRun(checkpoint);
        } else {
            resumeBtn.style.display = 'none';
        }
    } catch (e) {
        console.error('Error al comprobar checkpoint guardado de torre:', e);
        resumeBtn.style.display = 'none';
    }
}

async function resumeSavedRun(checkpoint) {
    if (!checkpoint) {
        checkpoint = await AuthManager.getSavedTowerCheckpoint();
    }
    if (!checkpoint) return;

    // Restaurar torre y piso
    GAME_STATE.floor = checkpoint.floor || 1;
    GAME_STATE.currentTower = checkpoint.current_tower || ((GAME_STATE.floor <= 10) ? 1 : ((GAME_STATE.floor <= 20) ? 2 : 3));
    GAME_STATE.currentNodeId = checkpoint.currentNodeId || null;
    GAME_STATE.startTime = checkpoint.startTime || Date.now();
    GAME_STATE.runSaved = false;
    startRunTimer();

    // Restaurar escuadrón completo
    GAME_STATE.team = [];
    if (Array.isArray(checkpoint.squad)) {
        const isTowerStart = GAME_STATE.floor === 11 || GAME_STATE.floor === 21;
        checkpoint.squad.forEach(robotData => {
            const robot = (typeof Robot.deserialize === 'function') 
                ? Robot.deserialize(robotData) 
                : new Robot(robotData);
            if (isTowerStart) {
                robot.isOffline = false;
                robot.recalculateStats();
                robot.hp = robot.maxHp;
                if (robot.statuses) {
                    robot.statuses = robot.statuses.filter(s => s && s.isPermanent);
                }
                if (robot.skills) {
                    robot.skills.forEach(skill => {
                        if (skill.currentCd) skill.currentCd = 0;
                    });
                }
            }
            GAME_STATE.team.push(robot);
        });
    }

    // Restaurar inventario
    GAME_STATE.inventory = {
        items: (checkpoint.inventory && checkpoint.inventory.items) ? checkpoint.inventory.items : [],
        weapons: (checkpoint.inventory && checkpoint.inventory.weapons) ? checkpoint.inventory.weapons : []
    };

    // Restaurar chatarra recolectada en la run
    GAME_STATE.scrap = checkpoint.scrap || 0;
    if (typeof updateScrapDisplay === 'function') {
        updateScrapDisplay();
    } else {
        const disp = document.getElementById('scrap-display');
        if (disp) disp.innerText = `Chatarra: ${GAME_STATE.scrap} ⚙️`;
    }

    // Restaurar mapa o generar de la torre correspondiente
    if (checkpoint.map && Array.isArray(checkpoint.map) && checkpoint.map.length > 0) {
        if (typeof setFullMap === 'function') {
            setFullMap(checkpoint.map);
        } else if (typeof fullMap !== 'undefined') {
            fullMap = checkpoint.map;
        }
    } else {
        generateFullMap(GAME_STATE.currentTower);
    }

    // Restaurar reliquias
    GAME_STATE.relics = (checkpoint.relics && Array.isArray(checkpoint.relics)) ? checkpoint.relics : [];
    GAME_STATE.fenixTriggeredThisRun = !!checkpoint.fenixTriggeredThisRun;
    if (typeof RelicsManager !== 'undefined') {
        RelicsManager.renderRelicsBar();
    }

    renderMap();
    updateTeamUI();
    showScreen('screen-map');
}

// Iniciar
window.onload = () => {
    initGame();
    if (typeof RelicsManager !== 'undefined') {
        RelicsManager.init();
    }
    checkSavedCheckpoint();
    if (window.location.hash === '#start') {
        showScreen('screen-start');
    }
};
