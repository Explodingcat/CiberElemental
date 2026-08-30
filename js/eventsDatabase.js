// eventsDatabase.js

const MYSTERY_EVENTS = [
    {
        title: "Tragamonedas Rota",
        desc: "Encuentras una vieja máquina expendedora. Puedes gastar chatarra para ver qué sale.",
        choices: [
            {
                label: "Gastar 20 Chatarra",
                condition: () => GAME_STATE.scrap >= 20,
                action: () => {
                    addScrap(-20);
                    if (Math.random() > 0.5) {
                        let w = generateRandomWeapon();
                        GAME_STATE.inventory.weapons.push(w);
                        return `¡Premio! Recibes ${w.name}.`;
                    }
                    return `La máquina tragó tus monedas y no dio nada.`;
                }
            },
            { label: "Ignorar", action: () => "Decides no apostar." }
        ]
    },
    {
        title: "Mercenario Moribundo",
        desc: "Un robot aliado está perdiendo aceite. Te pide piezas de repuesto.",
        choices: [
            {
                label: "Ayudar (Pierdes 30 Chatarra)",
                condition: () => GAME_STATE.scrap >= 30,
                action: () => {
                    addScrap(-30);
                    let w = generateRandomWeapon();
                    GAME_STATE.inventory.weapons.push(w);
                    return `El mercenario te agradece y te regala ${w.name} antes de irse.`;
                }
            },
            {
                label: "Robarle (Ganar 20 Chatarra)",
                action: () => {
                    addScrap(20);
                    return `Lo rematas y te quedas con sus pertenencias. Sientes un ligero arrepentimiento.`;
                }
            }
        ]
    },
    {
        title: "Altar de Cristal",
        desc: "Un extraño monolito pulsa con energía. Te ofrece poder a cambio de vitalidad.",
        choices: [
            {
                label: "Tocar el Altar (-20% HP a todos)",
                action: () => {
                    GAME_STATE.team.forEach(r => { if (!r.isOffline) r.hp = Math.max(1, r.hp - Math.floor(r.maxHp * 0.2)); });
                    let item = { type: ITEM_TYPES.SOBRECARGA, ...ITEM_DEFS[ITEM_TYPES.SOBRECARGA] };
                    GAME_STATE.inventory.items.push(item);
                    return `Un rayo carmesí quema a tu equipo, pero el altar materializa un Núcleo de Sobrecarga.`;
                }
            },
            { label: "Ignorar", action: () => "El poder oscuro te da mala espina. Te alejas." }
        ]
    },
    {
        title: "Charco de Ácido",
        desc: "Un gran vertido bloquea el camino. ¿Cómo procedes?",
        choices: [
            {
                label: "Cruzar corriendo (-15% HP activo)",
                action: () => {
                    let r = GAME_STATE.team[combatState?.activeRobotIndex || 0];
                    r.hp = Math.max(1, r.hp - Math.floor(r.maxHp * 0.15));
                    return `El ácido daña a tu robot, pero ahorras mucho tiempo.`;
                }
            },
            {
                label: "Rodear (Lento pero seguro)",
                action: () => {
                    return `Pierdes unas horas rodeando el obstáculo, pero tu equipo está a salvo.`;
                }
            }
        ]
    },
    {
        title: "Datos Encriptados",
        desc: "Encuentras un servidor abandonado con datos que podrían ser útiles.",
        choices: [
            {
                label: "Descargar Datos (+200 XP al activo)",
                action: () => {
                    let r = GAME_STATE.team[combatState?.activeRobotIndex || 0];
                    r.gainXp(200);
                    return `El robot procesa los datos y gana experiencia de combate valiosa.`;
                }
            },
            { label: "Destruir Servidor (+15 Chatarra)", action: () => { addScrap(15); return "Cosechas el disco duro para venderlo."; } }
        ]
    },
    {
        title: "El Nómada",
        desc: "Un misterioso comerciante con capucha te hace una oferta.",
        choices: [
            {
                label: "Comprar Objeto Secreto (30 Chatarra)",
                condition: () => GAME_STATE.scrap >= 30,
                action: () => {
                    addScrap(-30);
                    let item = generateRandomItem();
                    GAME_STATE.inventory.items.push(item);
                    return `El nómada te lanza un ${item.name} y desaparece.`;
                }
            },
            { label: "Ignorar", action: () => "El nómada se encoge de hombros." }
        ]
    },
    {
        title: "Emboscada Sensorial",
        desc: "Una alarma estruendosa comienza a sonar. Tus sensores fallan.",
        choices: [
            {
                label: "Apagar Sistema (-30% HP activo)",
                action: () => {
                    let r = GAME_STATE.team[combatState?.activeRobotIndex || 0];
                    r.hp = Math.max(1, r.hp - Math.floor(r.maxHp * 0.3));
                    return `Logras apagar los sensores, pero el ruido dañó gravemente tus circuitos de audio.`;
                }
            },
            {
                label: "Sobrecargar (Gastar 10 Chatarra)",
                condition: () => GAME_STATE.scrap >= 10,
                action: () => {
                    addScrap(-10);
                    return `Pagas el precio de energía adicional para aislar el ruido. Sales intacto.`;
                }
            }
        ]
    },
    {
        title: "Fábrica de Chips",
        desc: "Ves una vieja impresora 3D industrial aún operativa.",
        choices: [
            {
                label: "Imprimir Chip Elemental",
                action: () => {
                    const chips = [ITEM_TYPES.CHIP_FUEGO, ITEM_TYPES.CHIP_AGUA, ITEM_TYPES.CHIP_TIERRA, ITEM_TYPES.CHIP_AIRE];
                    let type = chips[Math.floor(Math.random() * chips.length)];
                    let item = { type: type, ...ITEM_DEFS[type] };
                    GAME_STATE.inventory.items.push(item);
                    return `La máquina hace ruidos extraños y produce un ${item.name}.`;
                }
            }
        ]
    },
    {
        title: "Repuestos Militares",
        desc: "Una caja militar sellada descansa en el suelo. Parece resistente.",
        choices: [
            {
                label: "Forzar Cerradura (-10% HP activo)",
                action: () => {
                    let r = GAME_STATE.team[combatState?.activeRobotIndex || 0];
                    r.hp = Math.max(1, r.hp - Math.floor(r.maxHp * 0.1));
                    let w = generateRandomWeapon();
                    GAME_STATE.inventory.weapons.push(w);
                    return `Te dañas forzándola, pero consigues un arma: ${w.name}.`;
                }
            },
            { label: "Dejarla estar", action: () => "No vale la pena el riesgo." }
        ]
    },
    {
        title: "Cápsula de Curación",
        desc: "Una antigua cápsula médica brilla débilmente. Aún tiene energía.",
        choices: [
            {
                label: "Usar Cápsula (+50% HP a todos)",
                action: () => {
                    GAME_STATE.team.forEach(r => { if (!r.isOffline) r.heal(r.maxHp * 0.5); });
                    return `Tus sistemas se reparan casi por completo.`;
                }
            }
        ]
    },
    {
        title: "Ruleta Rusa Robótica",
        desc: "Un robot demente te reta a un juego de azar. Mitad de HP o gran premio.",
        choices: [
            {
                label: "Aceptar Reto",
                action: () => {
                    if (Math.random() > 0.5) {
                        addScrap(50);
                        return `¡Ganaste! Recibes 50 Chatarra.`;
                    } else {
                        let r = GAME_STATE.team[combatState?.activeRobotIndex || 0];
                        r.hp = Math.max(1, r.hp - Math.floor(r.maxHp * 0.5));
                        return `Perdiste. El robot te ataca y huye, perdiendo mitad de tu vida.`;
                    }
                }
            },
            { label: "Rechazar", action: () => "Te alejas rápidamente del lunático." }
        ]
    },
    {
        title: "Campo Magnético",
        desc: "Estás atrapado en un fuerte campo magnético.",
        choices: [
            {
                label: "Desmantelar un Arma (-1 Arma, Salir Seguro)",
                condition: () => GAME_STATE.inventory.weapons.length > 0,
                action: () => {
                    GAME_STATE.inventory.weapons.pop();
                    return `Sacrificaste un arma al campo magnético para poder escapar.`;
                }
            },
            {
                label: "Forzar Salida (-25% HP a todos)",
                action: () => {
                    GAME_STATE.team.forEach(r => { if (!r.isOffline) r.hp = Math.max(1, r.hp - Math.floor(r.maxHp * 0.25)); });
                    return `Lograste salir, pero los motores de todo el equipo se dañaron gravemente.`;
                }
            }
        ]
    },
    {
        title: "Oasis Cibernético",
        desc: "Un lugar de descanso inesperado y pacífico.",
        choices: [
            {
                label: "Descansar (+20% HP a todos)",
                action: () => {
                    GAME_STATE.team.forEach(r => { if (!r.isOffline) r.heal(r.maxHp * 0.2); });
                    return `Te tomas un momento para enfriar los sistemas.`;
                }
            },
            {
                label: "Buscar Tesoros (+20 Chatarra)",
                action: () => {
                    addScrap(20);
                    return `Ignoras el descanso y encuentras algunas piezas valiosas en el suelo.`;
                }
            }
        ]
    },
    {
        title: "Actualización de Firmware",
        desc: "Encuentras un puerto de descarga universal.",
        choices: [
            {
                label: "Actualizar (Gana nivel el activo, -25% HP)",
                action: () => {
                    let r = GAME_STATE.team[combatState?.activeRobotIndex || 0];
                    r.gainXp(r.xpToNext - r.xp); // Fuerza subida de nivel
                    r.hp = Math.max(1, r.hp - Math.floor(r.maxHp * 0.25));
                    return `La descarga fue dolorosa, pero tus sistemas son mucho más fuertes ahora.`;
                }
            },
            { label: "Ignorar", action: () => "El software desconocido es muy peligroso." }
        ]
    },
    {
        title: "Portal Dimensional",
        desc: "Un extraño vórtice brilla frente a ti.",
        choices: [
            {
                label: "Meter la mano",
                action: () => {
                    if (Math.random() > 0.7) {
                        let w = generateRandomWeapon();
                        w.isUpgraded = true;
                        w.name += ' +1';
                        GAME_STATE.inventory.weapons.push(w);
                        return `¡Sacaste un arma mejorada de otra dimensión!`;
                    } else {
                        let r = GAME_STATE.team[combatState?.activeRobotIndex || 0];
                        r.hp = Math.max(1, r.hp - Math.floor(r.maxHp * 0.2));
                        return `Algo te mordió la mano. Perdiste 20% HP.`;
                    }
                }
            },
            { label: "Ignorar", action: () => "Decides no jugar con la física cuántica." }
        ]
    },
    {
        title: "Mina Terrestre",
        desc: "Pisas un explosivo camuflado. Tienes un segundo para reaccionar.",
        choices: [
            {
                label: "Saltar (Evasión aleatoria)",
                action: () => {
                    if (Math.random() > 0.5) {
                        return `Lograste escapar de la onda expansiva ileso.`;
                    } else {
                        let r = GAME_STATE.team[combatState?.activeRobotIndex || 0];
                        r.hp = Math.max(1, r.hp - Math.floor(r.maxHp * 0.4));
                        return `Saltaste demasiado tarde. Recibes un daño brutal.`;
                    }
                }
            },
            {
                label: "Escudar con Arma (Pierdes 1 arma)",
                condition: () => GAME_STATE.inventory.weapons.length > 0,
                action: () => {
                    GAME_STATE.inventory.weapons.pop();
                    return `Lanzaste un arma de tu inventario a la mina. Saliste ileso, pero el arma fue destruida.`;
                }
            }
        ]
    },
    {
        title: "Refugiado",
        desc: "Un pequeño robot de limpieza te pide protección.",
        choices: [
            {
                label: "Protegerlo (+100 XP a todos)",
                action: () => {
                    GAME_STATE.team.forEach(r => { if (!r.isOffline) r.gainXp(100); });
                    return `Escoltar al robot te dio valiosa experiencia de supervivencia.`;
                }
            },
            {
                label: "Desguazarlo (+15 Chatarra)",
                action: () => {
                    addScrap(15);
                    return `Es un mundo cruel. Tomas sus piezas.`;
                }
            }
        ]
    },
    {
        title: "Armería Antigua",
        desc: "Ves una serie de armas tras un cristal blindado.",
        choices: [
            {
                label: "Pagar para abrir (40 Chatarra)",
                condition: () => GAME_STATE.scrap >= 40,
                action: () => {
                    addScrap(-40);
                    let w1 = generateRandomWeapon();
                    let w2 = generateRandomWeapon();
                    GAME_STATE.inventory.weapons.push(w1, w2);
                    return `Logras abrir el cristal y obtienes dos armas.`;
                }
            },
            { label: "Irte", action: () => "No tienes los recursos suficientes." }
        ]
    },
    {
        title: "Lluvia de Meteoros",
        desc: "El cielo se ilumina con rocas ardientes cayendo.",
        choices: [
            {
                label: "Buscar Refugio",
                action: () => {
                    return `Esquivaste la lluvia sin problemas.`;
                }
            },
            {
                label: "Buscar Meteoritos (Arriesgado)",
                action: () => {
                    if (Math.random() > 0.5) {
                        let type = [ITEM_TYPES.CHIP_FUEGO, ITEM_TYPES.CHIP_TIERRA, ITEM_TYPES.CHIP_AIRE, ITEM_TYPES.CHIP_AGUA][Math.floor(Math.random() * 4)];
                        let item = { type: type, ...ITEM_DEFS[type] };
                        GAME_STATE.inventory.items.push(item);
                        return `¡Encontraste un Chip Elemental entre los restos!`;
                    } else {
                        GAME_STATE.team.forEach(r => { if (!r.isOffline) r.hp = Math.max(1, r.hp - Math.floor(r.maxHp * 0.1)); });
                        return `Fuiste golpeado por rocas espaciales. Todo el equipo sufre daño.`;
                    }
                }
            }
        ]
    },
    {
        title: "Entidad Digital",
        desc: "Una IA antigua se comunica contigo.",
        choices: [
            {
                label: "Pedir Conocimiento (+300 XP activo)",
                action: () => {
                    let r = GAME_STATE.team[combatState?.activeRobotIndex || 0];
                    r.gainXp(300);
                    return `La IA te transfiere siglos de tácticas de combate.`;
                }
            },
            {
                label: "Pedir Poder (Arma aleatoria)",
                action: () => {
                    let w = generateRandomWeapon();
                    GAME_STATE.inventory.weapons.push(w);
                    return `La IA materializa una ${w.name} para ti.`;
                }
            }
        ]
    },
    {
        title: "Chatarrero de Androides Caídos",
        desc: "Un camión recolector y desmantelador automatizado bloquea el cruce. Sus sensores detectan restos y circuitos inservibles en tu escuadrón. Ofrece desarmar y purgar todos los robots destruidos, extrayendo sus componentes valiosos.",
        choices: [
            {
                label: "Reciclar robots caídos (Elimina todos los robots desactivados)",
                condition: () => GAME_STATE.team.some(r => r.isOffline || r.hp <= 0) && GAME_STATE.team.some(r => !r.isOffline && r.hp > 0),
                action: () => {
                    const deadRobots = GAME_STATE.team.filter(r => r.isOffline || r.hp <= 0);
                    if (deadRobots.length === 0) return "No tienes robots desactivados en tu escuadrón.";
                    
                    let returnedWeapons = 0;
                    let returnedChips = 0;
                    
                    deadRobots.forEach(robot => {
                        if (robot.equippedWeapon) {
                            GAME_STATE.inventory.weapons.push(robot.equippedWeapon);
                            robot.equippedWeapon = null;
                            returnedWeapons++;
                        }
                        if (robot.skills.length > 2) {
                            if (typeof uninstallChip === 'function') {
                                uninstallChip(robot);
                            } else {
                                robot.skills.splice(2);
                            }
                            returnedChips++;
                        }
                    });
                    
                    let scrapGained = deadRobots.length * 15;
                    addScrap(scrapGained);
                    
                    const names = deadRobots.map(r => r.name).join(', ');
                    GAME_STATE.team = GAME_STATE.team.filter(r => !r.isOffline && r.hp > 0);
                    updateTeamUI();
                    
                    let bonusMsg = `Recuperaste ${returnedWeapons} arma(s) y ${returnedChips} chip(s) en tu inventario, además de ganar +${scrapGained} ⚙️ de chatarra reciclada.`;
                    return `♻️ Los robots caídos ([${names}]) fueron desmantelados y purgados del escuadrón. ${bonusMsg}`;
                }
            },
            {
                label: "Ignorar y conservar los restos",
                action: () => "Decides no tocar los restos de tu escuadrón por si encuentras un taller de reparación más adelante."
            }
        ]
    }
];
