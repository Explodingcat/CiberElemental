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
    
    const robotPreview = document.getElementById('robot-preview');
    const weaponPreview = document.getElementById('weapon-preview');

    function renderRobot() {
        let key = robotKeys[currentRobotIndex];
        let template = ROBOT_TEMPLATES[key];
        let elStats = ELEMENT_BASE_STATS[template.element];
        
        const robotPageIndicator = document.getElementById('robot-page-indicator');
        if (robotPageIndicator) {
            robotPageIndicator.innerText = `${currentRobotIndex + 1} / ${robotKeys.length}`;
        }
        
        let specialSkill = template.skills && template.skills[1] ? template.skills[1] : null;
        let specialSkillHtml = '';
        if (specialSkill) {
            specialSkillHtml = `
                <div class="special-skill-box">
                    <div class="skill-header">
                        <span class="skill-tag">⚡ HABILIDAD ESPECIAL</span>
                        <span class="skill-cd">⏱️ CD: ${specialSkill.cd} turnos</span>
                    </div>
                    <div class="skill-body">
                        <strong class="skill-title">${specialSkill.name}:</strong>
                        <span class="skill-desc-text">${specialSkill.desc}</span>
                    </div>
                </div>
            `;
        }

        let roleSubtitle = '';
        if (template.element === ELEMENTS.FUEGO) {
            roleSubtitle = '⚔️ Guerrero Ofensivo • Daño Térmico Directo';
        } else if (template.element === ELEMENTS.AGUA) {
            roleSubtitle = '💧 Soporte Táctico • Escudos Temporales y Control';
        } else if (template.element === ELEMENTS.TIERRA) {
            roleSubtitle = '🛡️ Coloso Defensivo • Tanque y Provocación';
        } else if (template.element === ELEMENTS.AIRE) {
            roleSubtitle = '⚡ Pícaro Cibernético • Alta Velocidad y Evasión';
        }

        const previewAura = (typeof CosmeticsManager !== 'undefined') ? CosmeticsManager.getEquippedAura() : 'NONE';
        const previewParticles = (typeof CosmeticsManager !== 'undefined') ? CosmeticsManager.getEquippedParticles() : 'NONE';
        const previewRobot = new Robot(Object.assign({}, template, {
            aura: previewAura,
            particles: previewParticles
        }));
        const avatarGraphicHtml = previewRobot.getAvatarGraphicHtml();

        robotPreview.innerHTML = `
            <div class="preview-hero">
                <div class="holo-platform platform-${template.element}">
                    ${avatarGraphicHtml}
                </div>
                <div class="hero-name-row">
                    <h2 class="hero-name">${template.name}</h2>
                    <span class="element-badge elem-badge-${template.element}">
                        ${ELEMENT_EMOJIS[template.element]} ${template.element}
                    </span>
                </div>
                <div class="hero-role-badge">${roleSubtitle}</div>
            </div>
            
            <div class="stats-grid">
                <div class="stat-pill"><span class="stat-icon">❤️</span> <span class="stat-label">HP</span> <span class="stat-val">${elStats.maxHp}</span></div>
                <div class="stat-pill"><span class="stat-icon">⚔️</span> <span class="stat-label">ATQ</span> <span class="stat-val">${elStats.atk}</span></div>
                <div class="stat-pill"><span class="stat-icon">⚡</span> <span class="stat-label">VEL</span> <span class="stat-val">${elStats.spd}</span></div>
                <div class="stat-pill"><span class="stat-icon">💨</span> <span class="stat-label">ESQ</span> <span class="stat-val">${elStats.dodge}%</span></div>
                <div class="stat-pill"><span class="stat-icon">🎯</span> <span class="stat-label">PREC</span> <span class="stat-val">${elStats.acc}%</span></div>
                <div class="stat-pill"><span class="stat-icon">💥</span> <span class="stat-label">CRÍT</span> <span class="stat-val">${elStats.critChance || 5}%</span></div>
            </div>

            ${specialSkillHtml}
        `;
        renderWeapon(); // Sincronizar elemento y sinergia del arma
        renderSynergyBanner();
    }
    
    function renderWeapon() {
        let wKey = weaponKeys[currentWeaponIndex];
        let wType = WEAPON_TYPES[wKey];
        let template = ROBOT_TEMPLATES[robotKeys[currentRobotIndex]];
        
        const weaponPageIndicator = document.getElementById('weapon-page-indicator');
        if (weaponPageIndicator) {
            weaponPageIndicator.innerText = `${currentWeaponIndex + 1} / ${weaponKeys.length}`;
        }
        
        let desc = '';
        let wName = '';
        let weaponRoleSubtitle = '';
        if (wKey === 'DAGA') { 
            wName = 'Daga'; 
            desc = '<strong>25% prob. de doble ataque</strong> consecutivo (40% con +1). Cada golpe puede aplicar marca elemental al rival.';
            weaponRoleSubtitle = '🗡️ Filo Rápido • Ataque Doble Consecutivo';
        }
        if (wKey === 'HACHA') { 
            wName = 'Hacha'; 
            desc = '<strong>+10% ATQ base</strong>. <strong>20% prob. de Rompearmaduras</strong> (-25% DEF). Perfora 50% barreras/defensa (75% con +1). <strong>+35% Daño a ≤40% HP (+45% con +1)</strong>.';
            weaponRoleSubtitle = '🪓 Arma Pesada • Quiebre de Armadura y Verdugo';
        }
        if (wKey === 'BACULO') { 
            wName = 'Báculo'; 
            desc = '<strong>Al finalizar su turno, genera un Escudo de plasma</strong> (10% HP Máx, 15% con +1). En +1 otorga <strong>micro-escudo (8%) a aliado</strong> y <strong>20% prob. de reducir 1 CD</strong>.';
            weaponRoleSubtitle = '🪄 Canalizador • Escudos de Plasma y Soporte Grupal';
        }
        if (wKey === 'ESPADA') { 
            wName = 'Espada'; 
            desc = '<strong>+15% Daño base</strong> y <strong>+10% Crítico</strong> (+30%/+20% con +1). Críticos activan <strong>Racha</strong> (+10% ATQ temporal).';
            weaponRoleSubtitle = '⚔️ Hoja Balanceada • Crítico y Racha';
        }

        weaponPreview.innerHTML = `
            <div class="preview-hero">
                <div class="holo-platform platform-${template.element}">
                    <div class="avatar-emoji elem-${template.element}">${WEAPON_EMOJIS[wType]}</div>
                </div>
                <div class="hero-name-row">
                    <h2 class="hero-name">${wName} de ${template.element}</h2>
                    <span class="element-badge elem-badge-${template.element}">
                        ${ELEMENT_EMOJIS[template.element]} ${template.element}
                    </span>
                </div>
                <div class="hero-role-badge">${weaponRoleSubtitle}</div>
            </div>
            
            <div class="weapon-passive-card">
                <div class="passive-header">
                    <span class="passive-tag">🛡️ EFECTO PASIVO PRINCIPAL</span>
                    <span class="passive-type">PERMANENTE</span>
                </div>
                <div class="passive-body">
                    ${desc}
                </div>
            </div>

            <div class="weapon-basic-row">
                <span class="weapon-basic-badge">⚔️ ATAQUE BÁSICO</span>
                <span class="weapon-basic-desc">1.0x Potencia • 20% prob. de aplicar <strong>Marca de ${template.element}</strong> (3 turnos)</span>
            </div>
        `;
        renderSynergyBanner();
    }

    function renderSynergyBanner() {
        const banner = document.getElementById('elemental-synergy-banner');
        if (!banner) return;

        let template = ROBOT_TEMPLATES[robotKeys[currentRobotIndex]];
        let element = template.element;

        let synergyDesc = '';
        if (element === ELEMENTS.FUEGO) {
            synergyDesc = 'Afinidad compartida: <strong>+15% ATQ</strong> y <strong>+15% Daño adicional</strong> contra rivales con Marca o Quemadura activa.';
        } else if (element === ELEMENTS.AGUA) {
            synergyDesc = 'Afinidad compartida: <strong>+15% HP Máximo</strong> y <strong>+25% Potencia de Escudos</strong> temporales y barreras de plasma.';
        } else if (element === ELEMENTS.TIERRA) {
            synergyDesc = 'Afinidad compartida: <strong>+25% HP Máximo</strong> y <strong>-10% Daño recibido permanente</strong> (Mitigación pasiva de blindaje).';
        } else if (element === ELEMENTS.AIRE) {
            synergyDesc = 'Afinidad compartida: <strong>+15% ATQ</strong>, <strong>+2 Velocidad base</strong> y <strong>+10% Probabilidad de Esquiva</strong>.';
        }

        banner.className = `synergy-banner synergy-theme-${element}`;
        banner.innerHTML = `
            <div class="synergy-header-row">
                <div class="synergy-title-group">
                    <span class="synergy-icon">✨</span>
                    <span class="synergy-label">ENLACE ELEMENTAL ACTIVO</span>
                    <span class="element-badge elem-badge-${element}">${ELEMENT_EMOJIS[element]} ${element}</span>
                </div>
                <span class="synergy-status-pill">SINERGIA COMBINADA 100%</span>
            </div>
            <div class="synergy-body-text">
                ${synergyDesc}
            </div>
        `;
    }

    document.getElementById('btn-prev-robot').onclick = () => {
        currentRobotIndex = (currentRobotIndex - 1 + robotKeys.length) % robotKeys.length;
        renderRobot();
    };
    document.getElementById('btn-next-robot').onclick = () => {
        currentRobotIndex = (currentRobotIndex + 1) % robotKeys.length;
        renderRobot();
    };
    
    document.getElementById('btn-prev-weapon').onclick = () => {
        currentWeaponIndex = (currentWeaponIndex - 1 + weaponKeys.length) % weaponKeys.length;
        renderWeapon();
    };
    document.getElementById('btn-next-weapon').onclick = () => {
        currentWeaponIndex = (currentWeaponIndex + 1) % weaponKeys.length;
        renderWeapon();
    };

    // Navegación por teclado (Flechas / Enter)
    document.addEventListener('keydown', (e) => {
        const startScreen = document.getElementById('screen-start');
        if (!startScreen || !startScreen.classList.contains('active')) return;
        
        if (e.key === 'ArrowLeft') {
            currentRobotIndex = (currentRobotIndex - 1 + robotKeys.length) % robotKeys.length;
            renderRobot();
        } else if (e.key === 'ArrowRight') {
            currentRobotIndex = (currentRobotIndex + 1) % robotKeys.length;
            renderRobot();
        } else if (e.key === 'ArrowUp') {
            currentWeaponIndex = (currentWeaponIndex - 1 + weaponKeys.length) % weaponKeys.length;
            renderWeapon();
        } else if (e.key === 'ArrowDown') {
            currentWeaponIndex = (currentWeaponIndex + 1) % weaponKeys.length;
            renderWeapon();
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            document.getElementById('btn-start').click();
        }
    });

    document.getElementById('btn-start').onclick = () => {
        let selectedTemplate = robotKeys[currentRobotIndex];
        let selectedWeaponType = weaponKeys[currentWeaponIndex];
        
        // Reiniciar equipo e inventario para nueva expedición
        GAME_STATE.team = [];
        GAME_STATE.inventory = { items: [], weapons: [] };
        
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
        const disp = document.getElementById('scrap-display');
        if (disp) disp.innerText = `Chatarra: ${GAME_STATE.scrap} ⚙️`;

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
    const disp = document.getElementById('scrap-display');
    if (disp) disp.innerText = `Chatarra: ${GAME_STATE.scrap} ⚙️`;

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

    renderMap();
    updateTeamUI();
    showScreen('screen-map');
}

// Iniciar
window.onload = () => {
    initGame();
    checkSavedCheckpoint();
    if (window.location.hash === '#start') {
        showScreen('screen-start');
    }
};
