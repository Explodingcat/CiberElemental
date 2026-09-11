// inventory.js

let selectedInventoryWeapon = null;

function openInventory() {
    if (typeof SoundManager !== 'undefined') SoundManager.play('ui_modal_open');
    document.getElementById('inventory-modal').style.display = 'flex';
    renderInventory();
}

function closeInventory() {
    if (typeof SoundManager !== 'undefined') SoundManager.play('ui_modal_close');
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
                const isLeg = w.isLegendary || w.element === (typeof ELEMENTS !== 'undefined' ? ELEMENTS.LEGENDARIO : 'LEGENDARIO');
                const hasAff = (robot.hasAffinity && robot.hasAffinity());
                const affDesc = hasAff ? `<div class="inv-slot-affinity" style="margin-top: 6px; font-size: 0.78rem; color: #ffd32a; font-weight: bold;">🌟 ${robot.getAffinityDescription()}</div>` : '';
                weaponSlotHtml = `
                    <div class="inv-slot-box inv-slot-equipped ${isLeg ? 'is-legendary' : ''} elem-${w.element}">
                        <div class="inv-slot-header">
                            <span class="inv-slot-name">${WEAPON_EMOJIS[w.type]} ${w.name} ${isLeg ? '<span class="badge-legendary-mini">👑 LEGENDARIA</span>' : ''}</span>
                            <button class="btn-inv-unequip" onclick="unequipWeaponFrom(${idx})" title="Desequipar y guardar en mochila">Desequipar</button>
                        </div>
                        <div class="inv-slot-desc">${w.desc}</div>
                        ${affDesc}
                    </div>
                `;
            } else {
                weaponSlotHtml = `
                    <div class="inv-slot-box inv-slot-empty">
                        <span class="empty-slot-text">⚔️ Sin arma equipada</span>
                    </div>
                `;
            }

            // Sección de Chips Instalados (Máximo 1 chip por robot)
            let chipsSlotHtml = '';
            if (robot.skills.length > 2) {
                const chipSkill = robot.skills[2];
                chipsSlotHtml = `
                    <div class="inv-slot-box inv-slot-equipped elem-${chipSkill.elementOverride}">
                        <div class="inv-slot-header">
                            <span class="inv-slot-name">💾 ${chipSkill.name}</span>
                            <button class="btn-inv-unequip" onclick="uninstallChipFrom(${idx})" title="Desinstalar y devolver a la mochila">Desinstalar</button>
                        </div>
                        <div class="inv-slot-desc">Habilidad: ${chipSkill.name} (${chipSkill.elementOverride}, CD ${chipSkill.cd})</div>
                    </div>
                `;
            } else {
                chipsSlotHtml = `
                    <div class="inv-slot-box inv-slot-empty">
                        <span class="empty-slot-text">💾 Sin chip instalado (Máx. 1)</span>
                    </div>
                `;
            }

            const xpPercent = Math.max(0, Math.min(100, Math.round(((robot.xp || 0) / (robot.xpToNext || 100)) * 100)));

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
                    
                    <!-- Barras de HP y XP -->
                    <div class="inv-unit-bar-box">
                        <div class="inv-bar-row">
                            <span class="inv-bar-label">HP</span>
                            <span class="inv-bar-val">${robot.hp}/${robot.maxHp}</span>
                        </div>
                        <div class="member-track">
                            <div class="member-fill member-hp-fill" style="width: ${hpPercent}%"></div>
                        </div>

                        <div class="inv-bar-row" style="margin-top: 4px;">
                            <span class="inv-bar-label">XP</span>
                            <span class="inv-bar-val">${robot.xp || 0}/${robot.xpToNext || 100}</span>
                        </div>
                        <div class="member-track">
                            <div class="member-fill member-xp-fill" style="width: ${xpPercent}%"></div>
                        </div>
                    </div>
                    
                    <!-- Stats Grid Completo (ATQ, VEL, ESQ, PREC, CRÍT) -->
                    <div class="inv-stats-grid">
                        <div class="inv-stat-cell">
                            <span class="stat-lbl">⚔️ ATQ</span>
                            <span class="stat-val">${robot.atk}</span>
                        </div>
                        <div class="inv-stat-cell">
                            <span class="stat-lbl">⚡ VEL</span>
                            <span class="stat-val">${robot.spd}</span>
                        </div>
                        <div class="inv-stat-cell">
                            <span class="stat-lbl">💨 ESQ</span>
                            <span class="stat-val">${robot.dodge}%</span>
                        </div>
                        <div class="inv-stat-cell">
                            <span class="stat-lbl">🎯 PREC</span>
                            <span class="stat-val">${robot.acc}%</span>
                        </div>
                        <div class="inv-stat-cell" style="grid-column: span 2;">
                            <span class="stat-lbl">💥 CRÍTICO</span>
                            <span class="stat-val">${robot.critChance || 5}%</span>
                        </div>
                    </div>
                    
                    ${weaponSlotHtml}
                    ${chipsSlotHtml}
                </div>
            `;
        }).join('');
    }

    // 2. Renderizar Armas del Almacén (Agrupadas/Stackeadas)
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
            
            const stackedWeapons = [];
            GAME_STATE.inventory.weapons.forEach((w, idx) => {
                const isLegendary = Boolean(w.isLegendary || w.element === (typeof ELEMENTS !== 'undefined' ? ELEMENTS.LEGENDARIO : 'LEGENDARIO'));
                const existing = stackedWeapons.find(sw => 
                    sw.weapon.name === w.name &&
                    sw.weapon.type === w.type &&
                    sw.weapon.element === w.element &&
                    sw.isLegendary === isLegendary
                );
                if (existing) {
                    existing.count++;
                    existing.indices.push(idx);
                } else {
                    stackedWeapons.push({
                        weapon: w,
                        count: 1,
                        indices: [idx],
                        firstIdx: idx,
                        isLegendary
                    });
                }
            });

            stackedWeapons.forEach((s) => {
                const w = s.weapon;
                const isLegendary = s.isLegendary;
                const isSelected = (selectedInventoryWeapon !== null && s.indices.includes(selectedInventoryWeapon));
                const actionIdx = isSelected ? selectedInventoryWeapon : s.firstIdx;
                
                const card = document.createElement('div');
                card.className = `inv-item-card ${isLegendary ? 'is-legendary' : ''} ${isSelected ? 'is-selected' : ''}`;
                
                let equipButtonsHtml = '';
                if (isSelected) {
                    equipButtonsHtml = `
                        <div class="inv-card-actions">
                            ${GAME_STATE.team.map((r, rIdx) => {
                                if (r.isOffline) return '';
                                const isAffinity = isLegendary || (r.element === w.element);
                                const affinityIcon = isLegendary ? '👑' : '🌟';
                                return `
                                    <button class="btn-inv-action btn-equip-ally ${isLegendary ? 'btn-equip-legendary' : ''}" onclick="event.stopPropagation(); equipWeaponToItem(${actionIdx}, ${rIdx})">
                                        Equipar a ${r.name} ${isAffinity ? affinityIcon : ''}
                                    </button>
                                `;
                            }).join('')}
                            <button class="btn-inv-action btn-scrap-item" onclick="event.stopPropagation(); scrapInventoryWeapon(${actionIdx})">
                                ⚙️ Desmantelar (+${isLegendary ? '100' : '20'} Chatarra)
                            </button>
                        </div>
                    `;
                }

                const legendBadge = isLegendary ? '<span class="badge-legendary">👑 LEGENDARIA</span>' : '';
                const stackBadge = s.count > 1 ? `<span class="inv-stack-badge">x${s.count}</span>` : '';

                card.innerHTML = `
                    <div class="inv-item-top">
                        <span class="inv-item-emoji elem-${w.element}">${WEAPON_EMOJIS[w.type]}</span>
                        <div class="inv-item-info">
                            <div class="inv-item-title elem-${w.element}">${w.name} ${legendBadge} ${stackBadge}</div>
                            <div class="inv-item-desc">${w.desc}</div>
                        </div>
                    </div>
                    ${equipButtonsHtml}
                    ${!isSelected ? '<div class="inv-item-hint">Clic para equipar o desmantelar</div>' : ''}
                `;
                
                if (!isSelected) {
                    card.onclick = () => {
                        selectedInventoryWeapon = s.firstIdx;
                        renderInventory();
                    };
                }
                
                weaponsList.appendChild(card);
            });
        }
    }

    // 3. Renderizar Chips de Habilidad (Agrupados/Stackeados)
    const chipsList = document.getElementById('inventory-chips-list');
    if (chipsList) {
        const chipEntries = (GAME_STATE.inventory.items || [])
            .map((item, idx) => ({ item, idx }))
            .filter(entry => entry.item.type.startsWith('CHIP_'));
        
        if (chipEntries.length === 0) {
            chipsList.innerHTML = `
                <div class="inv-empty-state">
                    <span class="empty-state-icon">💾</span>
                    <span class="empty-state-text">No hay chips de habilidad disponibles.</span>
                </div>
            `;
        } else {
            chipsList.innerHTML = '';
            
            const stackedChips = [];
            chipEntries.forEach(({ item, idx }) => {
                const existing = stackedChips.find(sc => sc.item.type === item.type);
                if (existing) {
                    existing.count++;
                    existing.indices.push(idx);
                } else {
                    stackedChips.push({
                        item,
                        count: 1,
                        indices: [idx],
                        firstIdx: idx
                    });
                }
            });

            stackedChips.forEach((s) => {
                const item = s.item;
                const card = document.createElement('div');
                card.className = 'inv-item-card';
                
                const installButtons = GAME_STATE.team.map((r, rIdx) => {
                    if (r.isOffline) return '';
                    const hasChip = r.skills.length > 2;
                    const btnLabel = hasChip ? `💾 Reemplazar en ${r.name}` : `💾 Instalar en ${r.name}`;
                    return `
                        <button class="btn-inv-action btn-install-chip" onclick="installChipTo(${s.firstIdx}, ${rIdx})">
                            ${btnLabel}
                        </button>
                    `;
                }).join('');
                
                const stackBadge = s.count > 1 ? `<span class="inv-stack-badge">x${s.count}</span>` : '';

                card.innerHTML = `
                    <div class="inv-item-top">
                        <span class="inv-item-emoji">${item.emoji}</span>
                        <div class="inv-item-info">
                            <div class="inv-item-title">${item.name} ${stackBadge}</div>
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

    // 4. Renderizar Consumibles (Agrupados/Stackeados)
    const consumablesList = document.getElementById('inventory-consumables-list');
    if (consumablesList) {
        const consumableEntries = (GAME_STATE.inventory.items || [])
            .map((item, idx) => ({ item, idx }))
            .filter(entry => !entry.item.type.startsWith('CHIP_'));
        
        if (consumableEntries.length === 0) {
            consumablesList.innerHTML = `
                <div class="inv-empty-state">
                    <span class="empty-state-icon">🧪</span>
                    <span class="empty-state-text">No hay suministros en la mochila.</span>
                </div>
            `;
        } else {
            consumablesList.innerHTML = '';
            
            const stackedConsumables = [];
            consumableEntries.forEach(({ item, idx }) => {
                const existing = stackedConsumables.find(sc => sc.item.type === item.type);
                if (existing) {
                    existing.count++;
                    existing.indices.push(idx);
                } else {
                    stackedConsumables.push({
                        item,
                        count: 1,
                        indices: [idx],
                        firstIdx: idx
                    });
                }
            });

            stackedConsumables.forEach((s) => {
                const item = s.item;
                const card = document.createElement('div');
                card.className = 'inv-item-card';
                
                let itemActionsHtml = '';
                if (item.type === ITEM_TYPES.NANOBOTS) {
                    const healButtons = GAME_STATE.team.map((r) => {
                        if (r.isOffline || r.hp >= r.maxHp) return '';
                        return `
                            <button class="btn-inv-action btn-heal-ally" onclick="useNanobotsOn(${s.firstIdx}, '${r.id}')">
                                💊 Curar a ${r.name} (+40% HP)
                            </button>
                        `;
                    }).join('');
                    
                    itemActionsHtml = healButtons || '<div class="inv-item-hint" style="color:#2ed573;">Todos los robots tienen vida completa.</div>';
                } else {
                    itemActionsHtml = `<div class="inv-combat-only-tag">⚡ Usable durante el combate</div>`;
                }

                const stackBadge = s.count > 1 ? `<span class="inv-stack-badge">x${s.count}</span>` : '';

                card.innerHTML = `
                    <div class="inv-item-top">
                        <span class="inv-item-emoji">${item.emoji}</span>
                        <div class="inv-item-info">
                            <div class="inv-item-title">${item.name} ${stackBadge}</div>
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

    // 5. Renderizar Pasivas del Árbol de Habilidades Activas
    const passivesList = document.getElementById('inventory-passives-list');
    const passivesBadge = document.getElementById('inv-passives-badge');
    
    if (passivesList) {
        let activeSkills = [];
        if (typeof SkillsManager !== 'undefined' && SkillsManager.unlockedSkills && typeof SKILLS_CATALOG !== 'undefined') {
            activeSkills = SKILLS_CATALOG.filter(skill => SkillsManager.hasSkill(skill.id));
        }
        
        if (passivesBadge) {
            passivesBadge.innerText = `${activeSkills.length} Activas`;
        }
        
        if (activeSkills.length === 0) {
            passivesList.innerHTML = `
                <div class="inv-empty-state" style="padding: 12px 10px; grid-column: 1 / -1;">
                    <span class="empty-state-icon">🧬</span>
                    <span class="empty-state-text">No hay habilidades pasivas desbloqueadas en esta incursión. Desbloquéalas en el Menú Principal con Chatarra Global.</span>
                </div>
            `;
        } else {
            passivesList.innerHTML = activeSkills.map(skill => {
                const branch = (typeof SKILL_BRANCHES !== 'undefined' && SKILL_BRANCHES[skill.branch]) 
                    ? SKILL_BRANCHES[skill.branch] 
                    : { themeClass: '', name: skill.branch || '' };
                
                return `
                    <div class="inv-passive-card ${branch.themeClass || ''}" title="${skill.name}: ${skill.desc}">
                        <span class="inv-passive-icon">${skill.icon || '🧬'}</span>
                        <div class="inv-passive-info">
                            <span class="inv-passive-title">${skill.name}</span>
                            <span class="inv-passive-desc">${skill.desc}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }
}

function unequipWeaponFrom(robotIndex) {
    const robot = GAME_STATE.team[robotIndex];
    if (robot && robot.equippedWeapon) {
        if (typeof SoundManager !== 'undefined') SoundManager.play('ui_cancel');
        GAME_STATE.inventory.weapons.push(robot.equippedWeapon);
        robot.equipWeapon(null);
        renderInventory();
    }
}

function equipWeaponToItem(weaponIndex, robotIndex) {
    const weapon = GAME_STATE.inventory.weapons[weaponIndex];
    const robot = GAME_STATE.team[robotIndex];
    if (!weapon || !robot) return;
    
    if (typeof SoundManager !== 'undefined') SoundManager.play('ui_equip');

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
    const weapon = GAME_STATE.inventory.weapons[weaponIndex];
    if (typeof SoundManager !== 'undefined') SoundManager.play('ui_scrap');
    const scrapAmount = (weapon && (weapon.isLegendary || weapon.element === (typeof ELEMENTS !== 'undefined' ? ELEMENTS.LEGENDARIO : 'LEGENDARIO'))) ? 100 : 20;
    addScrap(scrapAmount);
    GAME_STATE.inventory.weapons.splice(weaponIndex, 1);
    selectedInventoryWeapon = null;
    renderInventory();
}

function installChipTo(itemIndex, robotIndex) {
    const chip = GAME_STATE.inventory.items[itemIndex];
    const robot = GAME_STATE.team[robotIndex];
    if (!chip || !robot) return;
    
    if (typeof SoundManager !== 'undefined') SoundManager.play('ui_equip');

    // Si el robot ya tiene un chip instalado, desinstalar el anterior y devolverlo a la mochila
    if (robot.skills.length > 2) {
        uninstallChip(robot);
    }
    
    installChip(chip, robot);
    GAME_STATE.inventory.items.splice(itemIndex, 1);
    renderInventory();
}

function uninstallChipFrom(robotIndex) {
    const robot = GAME_STATE.team[robotIndex];
    if (robot && robot.skills.length > 2) {
        if (typeof SoundManager !== 'undefined') SoundManager.play('ui_cancel');
        uninstallChip(robot);
        renderInventory();
    }
}

function uninstallChip(robot) {
    if (!robot || robot.skills.length <= 2) return;
    const oldSkill = robot.skills.splice(2, 1)[0];
    
    let chipType = null;
    if (oldSkill.elementOverride === ELEMENTS.FUEGO || oldSkill.name === 'Lanzallamas') chipType = ITEM_TYPES.CHIP_FUEGO;
    else if (oldSkill.elementOverride === ELEMENTS.AGUA || oldSkill.name === 'Geyser') chipType = ITEM_TYPES.CHIP_AGUA;
    else if (oldSkill.elementOverride === ELEMENTS.TIERRA || oldSkill.name === 'Fisura') chipType = ITEM_TYPES.CHIP_TIERRA;
    else if (oldSkill.elementOverride === ELEMENTS.AIRE || oldSkill.name === 'Tornado') chipType = ITEM_TYPES.CHIP_AIRE;
    
    if (chipType && typeof ITEM_DEFS !== 'undefined') {
        GAME_STATE.inventory.items.push({
            type: chipType,
            ...ITEM_DEFS[chipType]
        });
    }
}

function useNanobotsOn(itemIndex, robotId) {
    const robot = GAME_STATE.team.find(r => r.id === robotId);
    if (robot) {
        if (typeof SoundManager !== 'undefined') SoundManager.play('item_heal');
        robot.heal(robot.maxHp * 0.4);
        GAME_STATE.inventory.items.splice(itemIndex, 1);
        renderInventory();
    }
}

function installChip(chip, robot) {
    let skillName, skillElement;
    if (chip.type === ITEM_TYPES.CHIP_FUEGO) { skillName = 'Lanzallamas'; skillElement = ELEMENTS.FUEGO; }
    else if (chip.type === ITEM_TYPES.CHIP_AGUA) { skillName = 'Geyser'; skillElement = ELEMENTS.AGUA; }
    else if (chip.type === ITEM_TYPES.CHIP_TIERRA) { skillName = 'Fisura'; skillElement = ELEMENTS.TIERRA; }
    else if (chip.type === ITEM_TYPES.CHIP_AIRE) { skillName = 'Tornado'; skillElement = ELEMENTS.AIRE; }
    
    // Garantizar que no exceda 1 chip (índice 2)
    if (robot.skills.length > 2) {
        robot.skills.splice(2);
    }
    
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

