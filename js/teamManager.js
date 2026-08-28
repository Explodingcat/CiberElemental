// teamManager.js

const GAME_STATE = {
    floor: 1,
    team: [],
    scrap: 0,
    currentNodeId: null,
    inventory: {
        weapons: [],
        items: []
    }
};

function addStarterRobot(templateKey) {
    GAME_STATE.team = [new Robot(ROBOT_TEMPLATES[templateKey])];
    updateTeamUI();
}

function recruitRobot(robot) {
    if (GAME_STATE.team.length < 3) {
        robot.isAlly = true;
        robot.recalculateStats();
        robot.hp = Math.floor(robot.maxHp * 0.5); // Reclutado al 50% HP
        robot.isOffline = false;
        robot.statuses = [];
        robot.name = robot.name.replace('Salvaje ', ''); // Quitar etiqueta
        GAME_STATE.team.push(robot);
        updateTeamUI();
        return true;
    }
    return false;
}

function addScrap(amount) {
    GAME_STATE.scrap += amount;
    const disp = document.getElementById('scrap-display');
    if(disp) disp.innerText = `Chatarra: ${GAME_STATE.scrap} ⚙️`;
}

function isGameOver() {
    return GAME_STATE.team.every(robot => robot.isOffline);
}

function updateTeamUI() {
    // Actualizar UI del mapa, eventos y post-batalla
    const mapTeam = document.getElementById('team-status-map');
    const eventTeam = document.getElementById('team-status-event');
    const postTeam = document.getElementById('team-status-post');
    
    const teamHTML = GAME_STATE.team.map(r => {
        let weaponHtml = '';
        if (r.equippedWeapon) {
            let afinidad = (r.element === r.equippedWeapon.element) ? '🌟 AFINIDAD' : '';
            weaponHtml = `
            <div class="team-weapon-pill elem-${r.equippedWeapon.element}">
                <span>${WEAPON_EMOJIS[r.equippedWeapon.type]} ${r.equippedWeapon.name}</span>
                ${afinidad ? `<span class="affinity-star">${afinidad}</span>` : ''}
            </div>`;
        }
        
        let chipHtml = '';
        if (r.skills.length > 2) {
            const extraSkills = r.skills.slice(2);
            const chipIcons = extraSkills.map(s => `<span class="chip-mini-badge" title="${s.name}">💾 ${s.name}</span>`).join('');
            chipHtml = `<div class="team-chips-container">${chipIcons}</div>`;
        }
        
        let hpPercent = Math.max(0, Math.min(100, Math.round((r.hp / r.maxHp) * 100)));
        let xpPercent = Math.max(0, Math.min(100, Math.round((r.xp / r.xpToNext) * 100)));

        return `
        <div class="team-member-card ${r.isOffline ? 'is-offline' : 'is-online'} member-elem-${r.element}">
            <div class="team-member-header">
                <span class="member-elem-badge elem-${r.element}">${r.element}</span>
                <span class="member-lvl-badge">NV. ${r.level}</span>
            </div>

            <div class="team-member-avatar-box">
                <div class="member-holo-ring"></div>
                <div class="member-emoji elem-${r.element}">${r.emoji}</div>
            </div>

            <div class="team-member-name">${r.name}</div>

            <!-- Barras HP / XP -->
            <div class="team-member-bars">
                <div class="member-bar-row">
                    <span class="bar-name">HP</span>
                    <span class="bar-num">${r.hp}/${r.maxHp}</span>
                </div>
                <div class="member-track">
                    <div class="member-fill member-hp-fill" style="width: ${hpPercent}%;"></div>
                </div>

                <div class="member-bar-row">
                    <span class="bar-name">XP</span>
                    <span class="bar-num">${r.xp}/${r.xpToNext}</span>
                </div>
                <div class="member-track">
                    <div class="member-fill member-xp-fill" style="width: ${xpPercent}%;"></div>
                </div>
            </div>

            <!-- Stats Grid -->
            <div class="team-member-stats-grid">
                <div class="stat-mini-cell"><span class="stat-mini-label">⚔️ ATQ</span><span class="stat-mini-val">${r.atk}</span></div>
                <div class="stat-mini-cell"><span class="stat-mini-label">⚡ VEL</span><span class="stat-mini-val">${r.spd}</span></div>
                <div class="stat-mini-cell"><span class="stat-mini-label">💨 ESQ</span><span class="stat-mini-val">${r.dodge}%</span></div>
                <div class="stat-mini-cell"><span class="stat-mini-label">🎯 PREC</span><span class="stat-mini-val">${r.acc}%</span></div>
            </div>

            ${weaponHtml}
            ${chipHtml}

            <div class="team-member-status-footer ${r.isOffline ? 'offline' : 'online'}">
                <span class="status-indicator-dot"></span>
                <span>${r.isOffline ? 'DESACTIVADO' : 'OPERATIVO'}</span>
            </div>
        </div>
        `;
    }).join('');
    
    if(mapTeam) mapTeam.innerHTML = teamHTML;
    if(eventTeam) eventTeam.innerHTML = teamHTML;
    if(postTeam) postTeam.innerHTML = teamHTML;
}


