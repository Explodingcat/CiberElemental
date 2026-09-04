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
            AuthManager.saveMatchRun({
                won: false,
                floor_reached: GAME_STATE.floor || 1,
                duration_seconds: duration,
                scrap_collected: GAME_STATE.scrap || 0,
                squad: extractSquadData()
            });
            if (typeof SkillsManager !== 'undefined') SkillsManager.updateAllScrapDisplays();
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
                floor_reached: 10,
                duration_seconds: duration,
                scrap_collected: GAME_STATE.scrap || 0,
                squad: extractSquadData()
            });
            if (typeof SkillsManager !== 'undefined') SkillsManager.updateAllScrapDisplays();
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
            roleSubtitle = '💧 Soporte Táctico • Médico y Regeneración';
        } else if (template.element === ELEMENTS.TIERRA) {
            roleSubtitle = '🛡️ Coloso Defensivo • Tanque y Provocación';
        } else if (template.element === ELEMENTS.AIRE) {
            roleSubtitle = '⚡ Pícaro Cibernético • Alta Velocidad y Evasión';
        }

        robotPreview.innerHTML = `
            <div class="preview-hero">
                <div class="holo-platform platform-${template.element}">
                    <div class="avatar-emoji elem-${template.element}">${template.emoji}</div>
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
            desc = '<strong>Perfora el 50% de barreras/defensa</strong> (75% con +1). Otorga <strong>+35% de Daño masivo</strong> a rivales con ≤40% HP (Verdugo).';
            weaponRoleSubtitle = '🪓 Arma Pesada • Perforación y Verdugo';
        }
        if (wKey === 'BACULO') { 
            wName = 'Báculo'; 
            desc = '<strong>Regenera un 5% del HP máximo</strong> al finalizar cada ronda (7% con +1). Potenciado por Afinidad de Agua (+25% cura).';
            weaponRoleSubtitle = '🪄 Canalizador • Sustento y Curación';
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
            synergyDesc = 'Afinidad compartida: <strong>+15% HP Máximo</strong> y <strong>+25% Potencia de Curación</strong> a todas las fuentes de regeneración.';
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
        
        addStarterRobot(selectedTemplate);
        
        // Equipar el arma seleccionada
        const playerRobot = GAME_STATE.team[0];
        let weapon = generateRandomWeapon(playerRobot.element);
        weapon.type = WEAPON_TYPES[selectedWeaponType];
        weapon.name = `${selectedWeaponType.charAt(0) + selectedWeaponType.slice(1).toLowerCase()} de ${playerRobot.element}`;
        if (weapon.type === WEAPON_TYPES.DAGA) weapon.desc = '25% prob. doble ataque (40% con +1). Cada golpe puede aplicar marca.';
        if (weapon.type === WEAPON_TYPES.HACHA) weapon.desc = 'Perfora 50% barreras/defensa (75% con +1). +35% Daño a enemigos con ≤40% HP (Verdugo).';
        if (weapon.type === WEAPON_TYPES.BACULO) weapon.desc = 'Regenera 5% HP por ronda (7% con +1). Potenciado por afinidad de Agua.';
        if (weapon.type === WEAPON_TYPES.ESPADA) weapon.desc = '+15% Daño base y +10% Crítico (+30%/+20% con +1). Críticos otorgan +10% ATQ temporal.';
        
        playerRobot.equipWeapon(weapon);
        
        GAME_STATE.floor = 1;
        GAME_STATE.startTime = Date.now();
        GAME_STATE.runSaved = false;
        startRunTimer();
        
        // Inicializar chatarra de la run con pasiva de meta-progresión
        GAME_STATE.scrap = (typeof SkillsManager !== 'undefined') ? SkillsManager.getStartingScrap() : 0;
        const disp = document.getElementById('scrap-display');
        if (disp) disp.innerText = `Chatarra: ${GAME_STATE.scrap} ⚙️`;

        generateFullMap();
        renderMap();
        showScreen('screen-map');
    };
    
    // Initial render
    renderRobot();
}

// Iniciar
window.onload = () => {
    initGame();
    if (window.location.hash === '#start') {
        showScreen('screen-start');
    }
};
