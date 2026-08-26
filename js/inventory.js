// inventory.js

let selectedInventoryWeapon = null;

function openInventory() {
    document.getElementById('inventory-modal').style.display = 'flex';
    renderInventory();
}

function closeInventory() {
    document.getElementById('inventory-modal').style.display = 'none';
    selectedInventoryWeapon = null;
    updateTeamUI(); // Refresh map team UI
}

function renderInventory() {
    // 1. Renderizar Escuadrón Actual
    const teamList = document.getElementById('inventory-team-list');
    if (teamList && GAME_STATE && GAME_STATE.team) {
        teamList.innerHTML = GAME_STATE.team.map((robot, idx) => {
            const hpPercent = Math.max(0, Math.min(100, (robot.hp / robot.maxHp) * 100));
            const isOffline = robot.isOffline || robot.hp <= 0;
            
            // Sección de Arma Equipada
            let weaponSlotHtml = '';
            if (robot.equippedWeapon) {
                const w = robot.equippedWeapon;
                weaponSlotHtml = `
                    <div class="inv-slot-box inv-slot-equipped elem-${w.element}">
                        <div class="inv-slot-header">
                            <span class="inv-slot-name">${WEAPON_EMOJIS[w.type]} ${w.name}</span>
                            <button class="btn-inv-unequip" onclick="unequipWeaponFrom(${idx})" title="Desequipar y guardar en mochila">Desequipar</button>
                        </div>
                        <div class="inv-slot-desc">${w.desc}</div>
                    </div>
                `;
            } else {
                weaponSlotHtml = `
                    <div class="inv-slot-box inv-slot-empty">
                        <span class="empty-slot-text">⚔️ Sin arma equipada</span>
                    </div>
                `;
            }

            // Sección de Chips Instalados
            let chipsSlotHtml = '';
            if (robot.skills.length > 2) {
                const extraSkills = robot.skills.slice(2);
                chipsSlotHtml = `
                    <div class="inv-chips-row">
                        ${extraSkills.map(s => `
                            <span class="inv-chip-pill elem-${s.elementOverride}" title="${s.name} (CD ${s.cd})">
                                💾 ${s.name}
                            </span>
                        `).join('')}
                    </div>
                `;
            }

            return `
                <div class="inv-unit-card ${isOffline ? 'is-offline' : ''}">
                    <div class="inv-unit-header">
                        <span class="member-elem-badge elem-badge-${robot.element}">(${robot.element})</span>
                        <span class="member-lvl-badge">LVL ${robot.level}</span>
                    </div>
                    
                    <div class="inv-unit-avatar-box">
                        <div class="member-holo-ring"></div>
                        <div class="member-emoji elem-${robot.element}">
                            ${robot.emoji}
                        </div>
                    </div>
                    
                    <div class="inv-unit-name">${robot.name}</div>
                    
                    <!-- Barra de HP -->
                    <div class="inv-unit-bar-box">
                        <div class="inv-bar-row">
                            <span class="inv-bar-label">HP</span>
                            <span class="inv-bar-val">${robot.hp}/${robot.maxHp}</span>
                        </div>
                        <div class="member-track">
                            <div class="member-fill member-hp-fill" style="width: ${hpPercent}%"></div>
                        </div>
                    </div>
                    
                    <!-- Stats Mini Grid -->
                    <div class="inv-stats-grid">
                        <div class="inv-stat-cell">
                            <span class="stat-lbl">ATQ</span>
                            <span class="stat-val">⚔️ ${robot.atk}</span>
                        </div>
                        <div class="inv-stat-cell">
                            <span class="stat-lbl">VEL</span>
                            <span class="stat-val">⚡ ${robot.spd}</span>
                        </div>
                    </div>
                    
                    ${weaponSlotHtml}
                    ${chipsSlotHtml}
                </div>
            `;
        }).join('');
    }

    // 2. Renderizar Armas del Almacén
    const weaponsList = document.getElementById('inventory-weapons-list');
    if (weaponsList) {
        if (!GAME_STATE.inventory.weapons || GAME_STATE.inventory.weapons.length === 0) {
            weaponsList.innerHTML = `
                <div class="inv-empty-state">
                    <span class="empty-state-icon">⚔️</span>
                    <span class="empty-state-text">No hay armas almacenadas en la mochila.</span>
                </div>
            `;
        } else {
            weaponsList.innerHTML = '';
            GAME_STATE.inventory.weapons.forEach((w, idx) => {
                const card = document.createElement('div');
                card.className = `inv-item-card ${selectedInventoryWeapon === idx ? 'is-selected' : ''}`;
                
                let equipButtonsHtml = '';
                if (selectedInventoryWeapon === idx) {
                    equipButtonsHtml = `
                        <div class="inv-card-actions">
                            ${GAME_STATE.team.map((r, rIdx) => {
                                if (r.isOffline) return '';
                                const isAffinity = r.element === w.element;
                                return `
                                    <button class="btn-inv-action btn-equip-ally" onclick="event.stopPropagation(); equipWeaponToItem(${idx}, ${rIdx})">
                                        Equipar a ${r.name} ${isAffinity ? '🌟' : ''}
                                    </button>
                                `;
                            }).join('')}
                            <button class="btn-inv-action btn-scrap-item" onclick="event.stopPropagation(); scrapInventoryWeapon(${idx})">
                                ⚙️ Desmantelar (+20 Chatarra)
                            </button>
                        </div>
                    `;
                }

                card.innerHTML = `
                    <div class="inv-item-top">
                        <span class="inv-item-emoji elem-${w.element}">${WEAPON_EMOJIS[w.type]}</span>
                        <div class="inv-item-info">
                            <div class="inv-item-title elem-${w.element}">${w.name}</div>
                            <div class="inv-item-desc">${w.desc}</div>
                        </div>
                    </div>
                    ${equipButtonsHtml}
                    ${selectedInventoryWeapon !== idx ? '<div class="inv-item-hint">Clic para equipar o desmantelar</div>' : ''}
                `;
                
                if (selectedInventoryWeapon !== idx) {
                    card.onclick = () => {
                        selectedInventoryWeapon = idx;
                        renderInventory();
                    };
                }
                
                weaponsList.appendChild(card);
            });
        }
    }

    // 3. Renderizar Chips de Habilidad
    const chipsList = document.getElementById('inventory-chips-list');
    if (chipsList) {
        const chipItems = (GAME_STATE.inventory.items || []).map((item, idx) => ({ item, idx })).filter(entry => entry.item.type.startsWith('CHIP_'));
        
        if (chipItems.length === 0) {
            chipsList.innerHTML = `
                <div class="inv-empty-state">
                    <span class="empty-state-icon">💾</span>
                    <span class="empty-state-text">No hay chips de habilidad disponibles.</span>
                </div>
            `;
        } else {
            chipsList.innerHTML = '';
            chipItems.forEach(({ item, idx }) => {
                const card = document.createElement('div');
                card.className = 'inv-item-card';
                
                const installButtons = GAME_STATE.team.map((r, rIdx) => {
                    if (r.isOffline) return '';
                    return `
                        <button class="btn-inv-action btn-install-chip" onclick="installChipTo(${idx}, ${rIdx})">
                            💾 Instalar en ${r.name}
                        </button>
                    `;
                }).join('');
                
                card.innerHTML = `
                    <div class="inv-item-top">
                        <span class="inv-item-emoji">${item.emoji}</span>
                        <div class="inv-item-info">
                            <div class="inv-item-title">${item.name}</div>
                            <div class="inv-item-desc">${item.desc}</div>
                        </div>
                    </div>
                    <div class="inv-card-actions">
                        ${installButtons}
                    </div>
                `;
                chipsList.appendChild(card);
            });
        }
    }

    // 4. Renderizar Consumibles
    const consumablesList = document.getElementById('inventory-consumables-list');
    if (consumablesList) {
        const consumables = (GAME_STATE.inventory.items || []).map((item, idx) => ({ item, idx })).filter(entry => !entry.item.type.startsWith('CHIP_'));
        
        if (consumables.length === 0) {
            consumablesList.innerHTML = `
                <div class="inv-empty-state">
                    <span class="empty-state-icon">🧪</span>
                    <span class="empty-state-text">No hay suministros en la mochila.</span>
                </div>
            `;
        } else {
            consumablesList.innerHTML = '';
            consumables.forEach(({ item, idx }) => {
                const card = document.createElement('div');
                card.className = 'inv-item-card';
                
                let itemActionsHtml = '';
                if (item.type === ITEM_TYPES.NANOBOTS) {
                    const healButtons = GAME_STATE.team.map((r) => {
                        if (r.isOffline || r.hp >= r.maxHp) return '';
                        return `
                            <button class="btn-inv-action btn-heal-ally" onclick="useNanobotsOn(${idx}, '${r.id}')">
                                💊 Curar a ${r.name} (+40% HP)
                            </button>
                        `;
                    }).join('');
                    
                    itemActionsHtml = healButtons || '<div class="inv-item-hint" style="color:#2ed573;">Todos los robots tienen vida completa.</div>';
                } else {
                    itemActionsHtml = `<div class="inv-combat-only-tag">⚡ Usable durante el combate</div>`;
                }

                card.innerHTML = `
                    <div class="inv-item-top">
                        <span class="inv-item-emoji">${item.emoji}</span>
                        <div class="inv-item-info">
                            <div class="inv-item-title">${item.name}</div>
                            <div class="inv-item-desc">${item.desc}</div>
                        </div>
                    </div>
                    <div class="inv-card-actions">
                        ${itemActionsHtml}
                    </div>
                `;
                consumablesList.appendChild(card);
            });
        }
    }
}

function unequipWeaponFrom(robotIndex) {
    const robot = GAME_STATE.team[robotIndex];
    if (robot && robot.equippedWeapon) {
        GAME_STATE.inventory.weapons.push(robot.equippedWeapon);
        robot.equipWeapon(null);
        renderInventory();
    }
}

function equipWeaponToItem(weaponIndex, robotIndex) {
    const weapon = GAME_STATE.inventory.weapons[weaponIndex];
    const robot = GAME_STATE.team[robotIndex];
    if (!weapon || !robot) return;
    
    // Si el robot ya tenía un arma, va a la mochila
    if (robot.equippedWeapon) {
        GAME_STATE.inventory.weapons.push(robot.equippedWeapon);
    }
    
    robot.equipWeapon(weapon);
    GAME_STATE.inventory.weapons.splice(weaponIndex, 1);
    selectedInventoryWeapon = null;
    renderInventory();
}

function scrapInventoryWeapon(weaponIndex) {
    addScrap(20);
    GAME_STATE.inventory.weapons.splice(weaponIndex, 1);
    selectedInventoryWeapon = null;
    renderInventory();
}

function installChipTo(itemIndex, robotIndex) {
    const chip = GAME_STATE.inventory.items[itemIndex];
    const robot = GAME_STATE.team[robotIndex];
    if (!chip || !robot) return;
    
    installChip(chip, robot);
    GAME_STATE.inventory.items.splice(itemIndex, 1);
    renderInventory();
}

function useNanobotsOn(itemIndex, robotId) {
    const robot = GAME_STATE.team.find(r => r.id === robotId);
    if (robot) {
        robot.heal(robot.maxHp * 0.4);
        GAME_STATE.inventory.items.splice(itemIndex, 1);
        renderInventory();
    }
}

function installChip(chip, robot) {
    let skillName, skillElement;
    if (chip.type === 'CHIP_FUEGO') { skillName = 'Lanzallamas'; skillElement = ELEMENTS.FUEGO; }
    if (chip.type === 'CHIP_AGUA') { skillName = 'Geyser'; skillElement = ELEMENTS.AGUA; }
    if (chip.type === 'CHIP_TIERRA') { skillName = 'Fisura'; skillElement = ELEMENTS.TIERRA; }
    if (chip.type === 'CHIP_AIRE') { skillName = 'Tornado'; skillElement = ELEMENTS.AIRE; }
    
    robot.skills.push({
        name: skillName,
        cd: 3,
        currentCd: 0,
        desc: `Ataque instalado (${skillElement}).`,
        type: 'DAMAGE',
        power: 2.0,
        elementOverride: skillElement
    });
}

