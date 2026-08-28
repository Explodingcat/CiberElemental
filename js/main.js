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

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add('active');
    }
    
    // Mostrar u ocultar la barra superior completa
    const topBar = document.getElementById('top-bar');
    if (topBar) {
        if (['screen-start', 'screen-game-over', 'screen-victory'].includes(screenId)) {
            topBar.style.display = 'none';
        } else {
            topBar.style.display = 'flex';
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
                        <strong>${specialSkill.name}:</strong> ${specialSkill.desc}
                    </div>
                </div>
            `;
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
        if (wKey === 'DAGA') { wName = 'Daga'; desc = '25% prob. de doble ataque consecutivo (40% con +1).'; }
        if (wKey === 'HACHA') { wName = 'Hacha'; desc = 'Perfora el 50% de las defensas y barreras enemigas (75% con +1).'; }
        if (wKey === 'BACULO') { wName = 'Báculo'; desc = 'Regenera un 3% del HP máximo al finalizar cada turno (5% con +1).'; }
        if (wKey === 'ESPADA') { wName = 'Espada'; desc = '+15% de daño base pasivo + 10% Crítico en Básicos (+30% daño y +20% Crítico con +1).'; }
        
        weaponPreview.innerHTML = `
            <div class="preview-hero">
                <div class="holo-platform platform-${template.element}">
                    <div class="avatar-emoji elem-${template.element}">${WEAPON_EMOJIS[wType]}</div>
                </div>
                <div class="hero-name-row">
                    <h2 class="hero-name">${wName}</h2>
                    <span class="element-badge elem-badge-${template.element}">
                        ${ELEMENT_EMOJIS[template.element]} ${template.element}
                    </span>
                </div>
            </div>
            
            <div class="weapon-passive-card">
                <div class="passive-header">
                    <span class="passive-tag">🛡️ EFECTO PASIVO</span>
                    <span class="passive-type">PERMANENTE</span>
                </div>
                <div class="passive-body">
                    <strong>${wName}:</strong> ${desc}
                </div>
            </div>

            <div class="synergy-box">
                <div class="synergy-header">
                    <span class="synergy-icon">✨</span>
                    <span class="synergy-title">SINERGIA DE AFINIDAD</span>
                </div>
                <div class="synergy-body">
                    Armamento sintonizado con <strong>${template.element}</strong>: <strong>+20% HP Máx</strong> y <strong>+20% ATQ</strong>.
                </div>
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
        if (weapon.type === WEAPON_TYPES.DAGA) weapon.desc = '25% prob. doble ataque (40% con +1)';
        if (weapon.type === WEAPON_TYPES.HACHA) weapon.desc = 'Perfora 50% de barreras y defensas (75% con +1)';
        if (weapon.type === WEAPON_TYPES.BACULO) weapon.desc = 'Cura 3% HP al final del turno (5% con +1)';
        if (weapon.type === WEAPON_TYPES.ESPADA) weapon.desc = '+15% Daño + 10% Crítico en Básicos (+30% Daño y +20% Crítico con +1)';
        
        playerRobot.equipWeapon(weapon);
        
        GAME_STATE.floor = 1;
        GAME_STATE.startTime = Date.now();
        GAME_STATE.runSaved = false;
        
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
};
