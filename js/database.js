// database.js

const ROBOT_TEMPLATES = {
    IGNIS: {
        name: 'Ignis',
        element: ELEMENTS.FUEGO,
        emoji: '🤖', // Robot icon tinted by css filter
        skills: [
            {
                name: 'Ataque Básico',
                cd: 0,
                currentCd: 0,
                desc: 'Ataque estándar de fuego.',
                type: 'DAMAGE',
                power: 1.0
            },
            {
                name: 'Ignición',
                cd: 3,
                currentCd: 0,
                desc: 'Inflige 1.2x daño directo + Quemadura (8% HP/turno por 2 turnos).',
                type: 'DAMAGE_STATUS',
                power: 1.2,
                status: { type: 'BURN', duration: 2 }
            }
        ]
    },
    AQUA: {
        name: 'Aqua',
        element: ELEMENTS.AGUA,
        emoji: '🤖',
        skills: [
            {
                name: 'Ataque Básico',
                cd: 0,
                currentCd: 0,
                desc: 'Ataque estándar de agua.',
                type: 'DAMAGE',
                power: 1.0
            },
            {
                name: 'Barrera de Plasma',
                cd: 3,
                currentCd: 0,
                desc: 'Otorga una barrera a cualquier aliado: bloquea el 100% de daño recibido hasta el próximo turno del invocador y le restaura 5% de su HP máximo.',
                type: 'BUFF',
                target: 'ALLY',
                status: { type: 'BARRIER', duration: 1 }
            }
        ]
    },
    TERRA: {
        name: 'Terra',
        element: ELEMENTS.TIERRA,
        emoji: '🤖',
        skills: [
            {
                name: 'Ataque Básico',
                cd: 0,
                currentCd: 0,
                desc: 'Ataque estándar de tierra.',
                type: 'DAMAGE',
                power: 1.0
            },
            {
                name: 'Coraza de Espinas',
                cd: 2,
                currentCd: 0,
                desc: 'Provocación: los enemigos solo pueden atacarlo a él (al de menor HP si hay varios). Reduce 50% el daño recibido, refleja 50% y adhiere 3 Marcas de Tierra al atacante.',
                type: 'BUFF',
                status: { type: 'CORAZA_ESPINAS', duration: 1 }
            }
        ]
    },
    ZEPHYR: {
        name: 'Zephyr',
        element: ELEMENTS.AIRE,
        emoji: '🤖',
        skills: [
            {
                name: 'Ataque Básico',
                cd: 0,
                currentCd: 0,
                desc: 'Ataque estándar de aire.',
                type: 'DAMAGE',
                power: 1.0
            },
            {
                name: 'Ráfaga Cortante',
                cd: 2,
                currentCd: 0,
                desc: 'Inflige 1.4x daño (garantiza actuar primero en el turno de uso).',
                type: 'DAMAGE',
                power: 1.4,
                priority: true
            }
        ]
    }
};

function generateRandomWeapon(forcedElement = null) {
    const types = Object.keys(WEAPON_TYPES);
    const type = WEAPON_TYPES[types[Math.floor(Math.random() * types.length)]];
    
    const elements = [ELEMENTS.FUEGO, ELEMENTS.AGUA, ELEMENTS.TIERRA, ELEMENTS.AIRE];
    const element = forcedElement || elements[Math.floor(Math.random() * elements.length)];
    
    let name = '';
    let abilityDesc = '';
    
    switch(type) {
        case WEAPON_TYPES.DAGA:
            name = 'Daga';
            abilityDesc = '25% prob. doble ataque (40% con +1)';
            break;
        case WEAPON_TYPES.HACHA:
            name = 'Hacha';
            abilityDesc = 'Perfora 50% de barreras y defensas (75% con +1)';
            break;
        case WEAPON_TYPES.BACULO:
            name = 'Báculo';
            abilityDesc = 'Cura 5% HP al final del turno (7% con +1)';
            break;
        case WEAPON_TYPES.ESPADA:
            name = 'Espada';
            abilityDesc = '+15% Daño + 10% Crítico en Básicos (+30% Daño y +20% Crítico con +1)';
            break;
    }
    
    return {
        id: Math.random().toString(36).substr(2, 9),
        type: type,
        element: element,
        name: `${name} de ${element}`,
        desc: abilityDesc
    };
}

const MUTATORS = [
    { type: 'ESPINAS', name: 'Espinas', desc: 'Devuelve 15% del daño recibido.' },
    { type: 'REGENERADOR', name: 'Regenerador', desc: 'Recupera 5% HP al final del turno.' },
    { type: 'RABIA', name: 'Rabia', desc: 'Daño aumenta 5% cada ronda.' }
];

const ELEMENTAL_ENEMY_NAMES = {
    [ELEMENTS.FUEGO]: [
        'Piroclasto', 'Magmatron', 'Fulgor-9', 'Brasabot', 'Vulcano',
        'Termovolt', 'Cenizo', 'Fénix-Core', 'Piro-Drone', 'Antorcha-X',
        'Kilovatio-Flame', 'Incendio', 'Chispazo', 'Carbono-Burn', 'Furia-Roja',
        'Pirotecnia', 'Fisión-Prime', 'Combustión', 'Centella-Infernal', 'Calorífero',
        'Infierno-7', 'Plasmatron', 'Solartron', 'Carburo', 'Llamarada',
        'Fogonazo', 'Corona-Solar', 'Piro-Vanguard', 'Erupción', 'Termo-Striker',
        'Rescoldo', 'Magma-Biped', 'Brasero', 'Piro-Stalker', 'Fulgurante',
        'Incandescente', 'Chispero', 'Lava-Runner', 'Piro-Rex', 'Caldera',
        'Ignitrón', 'Soplete', 'Helios-Unit', 'Piro-Mecha', 'Flare-Bot',
        'Quema-Circuitos', 'Fuego-Cero', 'Radiador-F', 'Titán-Ígneo', 'Piro-Sentinel',
        'Reactor-Flame', 'Estufa-Core', 'Fumarola', 'Termita-Unit', 'Magma-Hound',
        'Piro-Blaster', 'Abrasador', 'Pyro-Byte', 'Flama-Grip', 'Micro-Sol',
        'Calor-Flux', 'Asfixia-Thermal', 'Fuego-Táctico', 'Piro-Claw', 'Blazecore',
        'Nova-Spike', 'Crisol', 'Lava-Surge', 'Centella-Fire', 'Piro-Walker',
        'Termo-Shock', 'Brasas-77', 'Fénix-Unit', 'Incinerador', 'Piro-Stalker-X',
        'Quema-Nube', 'Vulcano-MK2', 'Spark-Core', 'Furia-Térmica', 'Piro-Scout',
        'Comburente', 'Brasa-Sombra', 'Termo-Cañón', 'Fuego-Baluarte', 'Magma-Titan',
        'Flare-Runner', 'Piro-Zero', 'Calcinador', 'Fundición-9', 'Rayo-Solar',
        'Piro-Reaper', 'Spark-Fiend', 'Brasa-Apex', 'Termo-Siege', 'Solar-Fang',
        'Piro-Viper', 'Chispa-Pulse', 'Fuego-Alfa', 'Magma-Core', 'Piro-Omni'
    ],
    [ELEMENTS.AGUA]: [
        'Tsunami-Bot', 'Hidroclasto', 'Mareas-9', 'Glaciar-Core', 'Diluvio',
        'Geyser-X', 'Océano-Byte', 'Criovolt', 'Escarcha-Unit', 'Tifón-Holo',
        'Manantial', 'Hidro-Scout', 'Ártico-7', 'Cascada-Core', 'Polar-Runner',
        'Vórtice-H', 'Crio-Stalker', 'Hidro-Reaper', 'Abisal', 'Maelstrom',
        'Gota-Zero', 'Condensador', 'Hidro-Tank', 'Iceberg-Unit', 'Marea-Negra',
        'Torrente', 'Hidro-Blade', 'Niebla-Pulse', 'Crio-Sentinel', 'Glacial-Fang',
        'Fosa-Abisal', 'Hidro-Spike', 'Ventisca-Bot', 'Onda-Marina', 'Rompehielos',
        'Laguna-Core', 'Hidro-Walker', 'Escarcha-MK', 'Sirena-Mech', 'Crio-Claw',
        'Salmuera', 'Hidro-Pulse', 'Vapor-Unit', 'Leviatán-Bot', 'Polar-Core',
        'Torrente-99', 'Crio-Zero', 'Escarcha-Byte', 'Hidro-Vanguard', 'Diluvio-MK2',
        'Crio-Hound', 'Rompeolas', 'Furia-Abisal', 'Hidro-Grip', 'Niebla-Stalker',
        'Glaciar-Siege', 'Aqua-Byte', 'Marea-Viva', 'Hidro-Laser', 'Polo-Surge',
        'Vórtice-Core', 'Cascada-X', 'Crio-Cañón', 'Abisal-Hunter', 'Hidro-Apex',
        'Polar-Spike', 'Escarcha-Fang', 'Maremoto', 'Hidro-Sombra', 'Crio-Blaster',
        'Ventisca-Core', 'Diluvio-Unit', 'Marea-Runner', 'Hidro-Surge', 'Crio-Mecha',
        'Ártico-Hound', 'Salmuera-Bot', 'Hidro-Titan', 'Glacial-Pulse', 'Torrente-Core',
        'Escarcha-Reaper', 'Hidro-Drone', 'Maelstrom-X', 'Crio-Viper', 'Abisal-Core',
        'Polo-Unit', 'Hidro-Baluarte', 'Rompehielos-9', 'Crio-Scout', 'Tifón-Core',
        'Hidro-Fang', 'Cascada-Runner', 'Glaciar-Apex', 'Crio-Omni', 'Marea-Pulse',
        'Hidro-Zero', 'Polar-Blade', 'Niebla-Core', 'Vórtice-Titan', 'Hidro-Prime'
    ],
    [ELEMENTS.TIERRA]: [
        'Monolito', 'Tectónico', 'Sismo-Unit', 'Geodo-Core', 'Granito-9',
        'Boulder-Bot', 'Cuarzo-Striker', 'Falla-Téctica', 'Magma-Roca', 'Basalto',
        'Pizarra-Core', 'Fósil-Mech', 'Placa-Terra', 'Pedernal', 'Geo-Sentinel',
        'Derrumbe', 'Muralla-Bot', 'Grava-Runner', 'Titan-Roque', 'Mármol-Unit',
        'Geo-Stalker', 'Grieta-X', 'Sílice-Byte', 'Rocodromo', 'Geo-Reaper',
        'Arena-Pulse', 'Obsidiana', 'Geo-Vanguard', 'Canto-Rodado', 'Terremoto-Bot',
        'Geo-Tank', 'Pizarra-MK', 'Cuarzo-Fang', 'Cantera-Core', 'Estrato-Unit',
        'Geo-Claw', 'Litosfera', 'Mineral-Byte', 'Geo-Hound', 'Peñasco',
        'Sismo-Core', 'Basalto-MK2', 'Geo-Blade', 'Falla-Runner', 'Duna-Stalker',
        'Geo-Siege', 'Roco-Drone', 'Piedra-Viva', 'Geo-Pulse', 'Monolito-X',
        'Tectón-Apex', 'Granito-Core', 'Fósil-Reaper', 'Geo-Cañón', 'Placa-Zero',
        'Muralla-Core', 'Geo-Scout', 'Sílice-Hunter', 'Derrumbe-MK', 'Geo-Titan',
        'Cantera-Bot', 'Obsidiana-Fang', 'Geo-Surge', 'Pedernal-Unit', 'Sismo-Runner',
        'Geo-Baluarte', 'Grieta-Pulse', 'Basalto-Core', 'Geo-Apex', 'Cuarzo-Mecha',
        'Estrato-Hunter', 'Geo-Viper', 'Mármol-Titan', 'Geo-Sombra', 'Peñasco-Core',
        'Litos-Runner', 'Geo-Laser', 'Mineral-Core', 'Falla-Apex', 'Geo-Blaster',
        'Boulder-Prime', 'Duna-Core', 'Geo-Zero', 'Piedra-Apex', 'Sismo-Titan',
        'Geo-Mecha-9', 'Muralla-Titan', 'Granito-Hunter', 'Geo-Spike', 'Tectón-Core',
        'Cantera-Apex', 'Obsidiana-Core', 'Geo-Omni', 'Basalto-Titan', 'Geo-Fang',
        'Derrumbe-Core', 'Sílice-Titan', 'Geo-Grip', 'Monolito-Prime', 'Geo-Prime'
    ],
    [ELEMENTS.AIRE]: [
        'Céfiro-Byte', 'Galerna', 'Huracán-9', 'Tempestad', 'Ráfaga-Core',
        'Aero-Striker', 'Tifón-Unit', 'Tornado-Bot', 'Ciclón-X', 'Eolo-Prime',
        'Brisa-Volt', 'Aero-Scout', 'Turbina-MK', 'Viento-Gélido', 'Vórtice-Aero',
        'Vórtice-7', 'Aero-Stalker', 'Giro-Copter', 'Estrato-Aero', 'Silbo-Core',
        'Borrasca', 'Aero-Reaper', 'Nimbus-Bot', 'Viento-Surge', 'Aero-Sentinel',
        'Vendaval', 'Hélice-Core', 'Aero-Vanguard', 'Cirro-Unit', 'Tormenta-Aero',
        'Aero-Tank', 'Ráfaga-Pulse', 'Remolino', 'Aero-Claw', 'Tromba-Bot',
        'Aero-Hound', 'Viento-Negro', 'Ciclón-Core', 'Aero-Blade', 'Galerna-MK2',
        'Aero-Siege', 'Ráfaga-Runner', 'Nimbus-Core', 'Aero-Cañón', 'Brisa-Stalker',
        'Huracán-Core', 'Aero-Pulse', 'Eolo-Hunter', 'Tempestad-Bot', 'Aero-Apex',
        'Vendaval-Core', 'Aero-Drone', 'Turbina-Core', 'Aero-Laser', 'Borrasca-X',
        'Cirro-Core', 'Aero-Titan', 'Remolino-Bot', 'Aero-Fang', 'Vórtice-Runner',
        'Aero-Baluarte', 'Tromba-Core', 'Aero-Blaster', 'Silbo-Runner', 'Aero-Viper',
        'Galerna-Core', 'Hélice-Titan', 'Aero-Sombra', 'Ráfaga-Apex', 'Ciclón-Titan',
        'Aero-Hunter', 'Tempestad-Core', 'Aero-Mecha-9', 'Nimbus-Titan', 'Aero-Spike',
        'Viento-Apex', 'Aero-Zero', 'Tormenta-Core', 'Aero-Surge', 'Brisa-Core',
        'Eolo-Titan', 'Aero-Grip', 'Vendaval-Titan', 'Huracán-Apex', 'Aero-Mecha',
        'Borrasca-Core', 'Aero-Prime-X', 'Turbina-Apex', 'Cirro-Titan', 'Aero-Omni',
        'Remolino-Core', 'Vórtice-Apex', 'Aero-Flash', 'Tromba-Titan', 'Galerna-Apex',
        'Céfiro-Core', 'Aero-Falcon', 'Tempestad-Apex', 'Ciclón-Prime', 'Aero-Prime'
    ],
    [ELEMENTS.NEUTRO]: [
        'Mecatrón', 'Servobot', 'Piston-9', 'Engranaje', 'Cyber-Drone',
        'Androide-X', 'Acero-Core', 'Nanobot-Host', 'Chatarra-MK', 'Bit-Striker',
        'Titanio-Core', 'Autómata', 'Sintético-7', 'Micro-Core', 'Soldador',
        'Batería-Bot', 'Cyber-Scout', 'Perno-Runner', 'Relojero', 'Cyber-Sentinel',
        'Turing-Unit', 'Cyber-Stalker', 'Ensamblador', 'Silicio-9', 'Cyber-Reaper',
        'Blindaje-Bot', 'Motor-Core', 'Cyber-Vanguard', 'Cromo-Unit', 'Válvula-Bot',
        'Cyber-Tank', 'Puntero-Null', 'Cyber-Claw', 'Terminal-Bot', 'Cyber-Hound',
        'Matriz-Unit', 'Chasis-99', 'Cyber-Blade', 'Código-Bot', 'Chatarra-Apex',
        'Cyber-Siege', 'Resistencia-X', 'Cyber-Cañón', 'Núcleo-Gris', 'Cyber-Pulse',
        'Acero-Apex', 'Cyber-Drone-X', 'Procesador', 'Cyber-Titan', 'Autómata-Prime',
        'Cyber-Laser', 'Chatarra-Core', 'Cyber-Blaster', 'Servomotor', 'Cyber-Viper',
        'Relé-Core', 'Cyber-Sombra', 'Titanio-Apex', 'Cyber-Fang', 'Microchip-Bot',
        'Cyber-Baluarte', 'Perno-Core', 'Cyber-Hunter', 'Soldador-Apex', 'Cyber-Mecha-9',
        'Sintético-Core', 'Cyber-Spike', 'Batería-Apex', 'Cyber-Zero', 'Turing-Core',
        'Cyber-Surge', 'Blindaje-Core', 'Cyber-Grip', 'Motor-Apex', 'Cyber-Mecha',
        'Cromo-Core', 'Cyber-Prime-X', 'Válvula-Core', 'Cyber-Omni', 'Terminal-Core',
        'Cyber-Flash', 'Chasis-Core', 'Cyber-Golem', 'Código-Core', 'Cyber-Automaton',
        'Resistencia-Core', 'Cyber-Sentinel-X', 'Procesador-Core', 'Cyber-Stalker-X', 'Servobot-Core',
        'Cyber-Warden', 'Engranaje-Apex', 'Cyber-Striker-X', 'Androide-Prime', 'Cyber-Enforcer',
        'Nanobot-Prime', 'Cyber-Colossus', 'Bit-Core', 'Cyber-Nexus', 'Cyber-Prime'
    ]
};

function getRandomEnemyName(element) {
    const names = (ELEMENTAL_ENEMY_NAMES && ELEMENTAL_ENEMY_NAMES[element]) ? ELEMENTAL_ENEMY_NAMES[element] : ELEMENTAL_ENEMY_NAMES[ELEMENTS.NEUTRO];
    if (!names || names.length === 0) return 'Autómata';
    return names[Math.floor(Math.random() * names.length)];
}

function generateWildRobot(floor, isElite = false) {
    const templates = Object.keys(ROBOT_TEMPLATES);
    const randomTemplate = ROBOT_TEMPLATES[templates[Math.floor(Math.random() * templates.length)]];
    
    // Nivel basado en el piso (élites tienen +2 niveles)
    let robotLevel = floor + (isElite ? 2 : 0);
    
    const baseEnemyName = getRandomEnemyName(randomTemplate.element);
    
    let robot = new Robot({
        ...randomTemplate,
        name: baseEnemyName,
        emoji: isElite ? '💀' : '👾',
        level: robotLevel,
        isAlly: false,
        isElite: isElite
    });
    
    if (isElite) {
        // Aumentar HP máximo 30% extra para élites
        robot.maxHp = Math.floor(robot.maxHp * 1.3);
        robot.hp = robot.maxHp;
        
        // Asignar mutador
        robot.mutator = MUTATORS[Math.floor(Math.random() * MUTATORS.length)];
    }
    
    // Probabilidad de arma: 30% en piso 1, sube 10% por piso. Élites 100%.
    let weaponProb = isElite ? 1.0 : Math.min(0.3 + (floor - 1) * 0.1, 1.0);
    if (Math.random() < weaponProb) {
        let weapon = generateRandomWeapon(robot.element); // Arma del mismo elemento
        robot.equipWeapon(weapon);
    }
    
    return robot;
}

function generateBoss() {
    let boss = new Robot({
        name: 'TITAN-X (Jefe)',
        element: ELEMENTS.NEUTRO,
        emoji: '👹',
        level: 10,
        skills: [
            { name: 'Golpe Titánico', cd: 0, currentCd: 0, desc: 'Ataque demoledor', type: 'DAMAGE', power: 1.5 },
            { name: 'Protocolo Exterminio', cd: 4, currentCd: 0, desc: 'Ataque masivo', type: 'DAMAGE', power: 3.0 }
        ]
    });
    // Boss always has a random powerful weapon
    boss.equipWeapon(generateRandomWeapon());
    return boss;
}

function generateRandomItem() {
    let keys = Object.keys(ITEM_TYPES);
    let type = ITEM_TYPES[keys[Math.floor(Math.random() * keys.length)]];
    return {
        type: type,
        ...ITEM_DEFS[type]
    };
}
