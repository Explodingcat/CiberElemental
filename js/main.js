// main.js

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

    // Actualizar datos de Game Over
    if (screenId === 'screen-game-over' && typeof GAME_STATE !== 'undefined') {
        const floorEl = document.getElementById('gameover-floor');
        const scrapEl = document.getElementById('gameover-scrap');
        const teamEl = document.getElementById('gameover-team-count');
        if (floorEl) floorEl.innerText = `Piso ${GAME_STATE.floor}`;
        if (scrapEl) scrapEl.innerText = `${GAME_STATE.scrap} ⚙️`;
        if (teamEl) teamEl.innerText = `${GAME_STATE.team ? GAME_STATE.team.length : 1} 💀`;
    }

    // Actualizar datos de Victoria Final
    if (screenId === 'screen-victory' && typeof GAME_STATE !== 'undefined') {
        const scrapEl = document.getElementById('victory-scrap');
        const teamEl = document.getElementById('victory-team-count');
        const rosterEl = document.getElementById('victory-team-roster');
        
        let aliveRobots = GAME_STATE.team ? GAME_STATE.team.filter(r => !r.isOffline) : [];
        if (scrapEl) scrapEl.innerText = `${GAME_STATE.scrap} ⚙️`;
        if (teamEl) teamEl.innerText = `${aliveRobots.length} 🤖`;

        if (rosterEl && GAME_STATE.team) {
            rosterEl.innerHTML = GAME_STATE.team.map(r => `
                <div class="victory-hero-pill elem-${r.element}">
                    <span>${r.emoji} ${r.name}</span>
                    <span class="victory-lvl">NV.${r.level}</span>
                </div>
            `).join('');
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
                <div class="stat-pill full-width"><span class="stat-icon">🎯</span> <span class="stat-label">PRECISIÓN</span> <span class="stat-val">${elStats.acc}%</span></div>
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
        if (wKey === 'ESPADA') { wName = 'Espada'; desc = '+15% de daño base pasivo + 5% Crítico (+30% daño con +1).'; }
        
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
        if (weapon.type === WEAPON_TYPES.ESPADA) weapon.desc = '+15% Daño + 5% Crítico (+30% Daño con +1)';
        
        playerRobot.equipWeapon(weapon);
        
        GAME_STATE.floor = 1;
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
