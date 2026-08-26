// eventHandler.js

function startEvent(type) {
    showScreen('screen-event');
    
    const title = document.getElementById('event-title');
    const content = document.getElementById('event-content');
    const desc = document.getElementById('event-description');
    const actions = document.getElementById('event-actions');
    
    content.innerHTML = NODE_EMOJIS[type];
    actions.innerHTML = '';
    
    updateTeamUI();

    if (type === NODE_TYPES.CHEST) {
        title.innerText = "Cofre Abandonado";
        
        let r = Math.random();
        if (r < 0.5) {
            // 50% Arma +1
            const weapon = generateRandomWeapon();
            weapon.isUpgraded = true;
            weapon.name += " +1";
            if (weapon.type === WEAPON_TYPES.DAGA) weapon.desc = '40% prob. doble ataque';
            if (weapon.type === WEAPON_TYPES.HACHA) weapon.desc = 'Perfora 75% de barreras y defensas';
            if (weapon.type === WEAPON_TYPES.BACULO) weapon.desc = 'Cura 5% HP al final del turno';
            if (weapon.type === WEAPON_TYPES.ESPADA) weapon.desc = '+30% Daño + 5% Crítico';
            desc.innerText = `Encontraste un arma rara: ${weapon.name} ${WEAPON_EMOJIS[weapon.type]}\nHa sido guardada en tu inventario.`;
            GAME_STATE.inventory.weapons.push(weapon);
        } else {
            // 50% Chip (Los chips están en los items, debemos asegurar que toque un chip)
            let chipKeys = Object.keys(ITEM_TYPES).filter(k => k.includes('CHIP'));
            let randomChipType = ITEM_TYPES[chipKeys[Math.floor(Math.random() * chipKeys.length)]];
            let item = { type: randomChipType, ...ITEM_DEFS[randomChipType] };
            
            desc.innerText = `Encontraste un objeto raro: ${item.name} ${item.emoji}\nHa sido guardado en tu inventario.`;
            GAME_STATE.inventory.items.push(item);
        }
        
        const btnAvanzar = document.createElement('button');
        btnAvanzar.innerText = "Continuar";
        btnAvanzar.onclick = () => advanceFloor();
        actions.appendChild(btnAvanzar);
    } 
    else if (type === NODE_TYPES.REPAIR_SHOP) {
        title.innerText = "Campamento (Taller de Reparación)";
        desc.innerText = `Elige una acción para tu equipo.`;
        
        // Opción 1: Reparar
        const btnHeal = document.createElement('button');
        btnHeal.innerHTML = `🔧 Reparar<br><small>Cura 30% a todos (revive con 10%)</small>`;
        btnHeal.onclick = () => {
            GAME_STATE.team.forEach(r => {
                if (r.isOffline) {
                    r.isOffline = false;
                    r.hp = Math.max(1, Math.floor(r.maxHp * 0.10));
                } else {
                    r.heal(r.maxHp * 0.30);
                }
            });
            advanceFloor();
        };
        actions.appendChild(btnHeal);

        // Opción 2: Entrenar
        const btnTrain = document.createElement('button');
        btnTrain.innerHTML = `💪 Entrenar<br><small>Dar 300 XP a un robot</small>`;
        btnTrain.onclick = () => {
            actions.innerHTML = '';
            desc.innerText = 'Selecciona quién recibirá el entrenamiento:';
            GAME_STATE.team.forEach(r => {
                const btn = document.createElement('button');
                btn.innerText = `Entrenar a ${r.name}`;
                btn.onclick = () => {
                    r.gainXp(300);
                    advanceFloor();
                };
                actions.appendChild(btn);
            });
        };
        actions.appendChild(btnTrain);

        // Opción 3: Forjar
        const btnForge = document.createElement('button');
        btnForge.innerHTML = `⚒️ Forjar<br><small>Mejorar arma equipada a +1</small>`;
        btnForge.onclick = () => {
            actions.innerHTML = '';
            const eligible = GAME_STATE.team.filter(r => r.equippedWeapon && !r.equippedWeapon.isUpgraded);
            if (eligible.length === 0) {
                desc.innerText = 'Nadie tiene un arma equipada que pueda mejorarse.';
                const backBtn = document.createElement('button');
                backBtn.innerText = 'Atrás';
                backBtn.onclick = () => startEvent(type);
                actions.appendChild(backBtn);
            } else {
                desc.innerText = 'Selecciona qué arma mejorar:';
                eligible.forEach(r => {
                    const btn = document.createElement('button');
                    btn.innerText = `Mejorar ${r.equippedWeapon.name} (en ${r.name})`;
                    btn.onclick = () => {
                        r.equippedWeapon.isUpgraded = true;
                        r.equippedWeapon.name += ' +1';
                        if (r.equippedWeapon.type === WEAPON_TYPES.DAGA) r.equippedWeapon.desc = '40% prob. doble ataque';
                        if (r.equippedWeapon.type === WEAPON_TYPES.HACHA) r.equippedWeapon.desc = 'Perfora 75% de barreras y defensas';
                        if (r.equippedWeapon.type === WEAPON_TYPES.BACULO) r.equippedWeapon.desc = 'Cura 5% HP al final del turno';
                        if (r.equippedWeapon.type === WEAPON_TYPES.ESPADA) r.equippedWeapon.desc = '+30% Daño + 5% Crítico';
                        r.recalculateStats();
                        advanceFloor();
                    };
                    actions.appendChild(btn);
                });
            }
        };
        actions.appendChild(btnForge);
    } else if (type === NODE_TYPES.SHOP) {
        title.innerText = "Mercado Negro";
        desc.innerText = "Gasta tu chatarra en nuevo equipamiento.";
        
        // Generar 2 armas y 2 objetos a la venta
        for(let i = 0; i < 2; i++) {
            let w = generateRandomWeapon();
            let cost = Math.floor(Math.random() * 20) + 30; // 30-50 chatarra
            
            const btn = document.createElement('button');
            btn.innerHTML = `${w.name} ${WEAPON_EMOJIS[w.type]} (${cost} ⚙️)<br><small>${w.desc}</small>`;
            btn.onclick = () => {
                if (GAME_STATE.scrap >= cost) {
                    addScrap(-cost);
                    GAME_STATE.inventory.weapons.push(w);
                    actions.innerHTML = '';
                    desc.innerText = `Has comprado ${w.name} ${WEAPON_EMOJIS[w.type]}. Se ha guardado en tu inventario.`;
                    
                    const btnLeave = document.createElement('button');
                    btnLeave.innerText = `Salir del Mercado`;
                    btnLeave.onclick = () => advanceFloor();
                    actions.appendChild(btnLeave);
                } else {
                    alert("No tienes suficiente chatarra.");
                }
            };
            actions.appendChild(btn);
        }

        for(let i = 0; i < 2; i++) {
            let item = generateRandomItem();
            let cost = 25; // Precio fijo para consumibles por ahora
            
            const btn = document.createElement('button');
            btn.innerHTML = `${item.name} ${item.emoji} (${cost} ⚙️)<br><small>${item.desc}</small>`;
            btn.onclick = () => {
                if (GAME_STATE.scrap >= cost) {
                    addScrap(-cost);
                    GAME_STATE.inventory.items.push(item);
                    actions.innerHTML = '';
                    desc.innerText = `Has comprado ${item.name} ${item.emoji}. Se ha guardado en tu inventario.`;
                    
                    const btnLeave = document.createElement('button');
                    btnLeave.innerText = `Salir del Mercado`;
                    btnLeave.onclick = () => advanceFloor();
                    actions.appendChild(btnLeave);
                } else {
                    alert("No tienes suficiente chatarra.");
                }
            };
            actions.appendChild(btn);
        }

        const btnLeave = document.createElement('button');
        btnLeave.innerText = `Salir`;
        btnLeave.onclick = () => advanceFloor();
        actions.appendChild(btnLeave);

    } else if (type === NODE_TYPES.MYSTERY) {
        let event = MYSTERY_EVENTS[Math.floor(Math.random() * MYSTERY_EVENTS.length)];
        title.innerText = event.title;
        desc.innerText = event.desc;
        
        event.choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.innerText = choice.label;
            
            if (choice.condition && !choice.condition()) {
                btn.disabled = true;
                btn.style.opacity = '0.5';
            } else {
                btn.onclick = () => {
                    let resultMsg = choice.action();
                    actions.innerHTML = '';
                    desc.innerText = resultMsg;
                    
                    const btnLeave = document.createElement('button');
                    btnLeave.innerText = `Continuar`;
                    btnLeave.onclick = () => advanceFloor();
                    actions.appendChild(btnLeave);
                };
            }
            actions.appendChild(btn);
        });
    } else {
        // Evento genérico
        title.innerText = "Evento Desconocido";
        desc.innerText = "No hay nada útil aquí por ahora.";
        const btn = document.createElement('button');
        btn.innerText = `Avanzar`;
        btn.onclick = () => advanceFloor();
        actions.appendChild(btn);
    }
}
