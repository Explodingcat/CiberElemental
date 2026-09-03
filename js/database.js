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
                name: 'Rocío Reparador',
                cd: 3,
                currentCd: 0,
                desc: 'Cura a un aliado (o a sí mismo) un 10% de su HP máximo de inmediato. Envuelve al objetivo en rocío que salpica Marca de Agua (3 turnos) a quien lo ataque, y al próximo turno de Aqua le restaura otro 10% de HP.',
                type: 'BUFF_HEAL',
                target: 'ALLY',
                healPct: 0.10,
                status: { type: 'REGENERACION', name: 'Rocío Reparador', duration: 1, healPct: 0.10 }
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
                desc: 'Provocación: los enemigos son obligados a atacarlo a él. Reduce 50% el daño recibido, refleja 50% y adhiere Marca de Tierra (3 turnos) al atacante.',
                type: 'BUFF',
                target: 'SELF',
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

const ELITE_TEMPLATES = {
    COLOSO_SISMICO: {
        name: 'Coloso Sísmico',
        element: ELEMENTS.TIERRA,
        emoji: '🦍',
        isElite: true,
        baseStatsOverride: {
            maxHp: 250,
            atk: 20,
            spd: 3,
            dodge: 0,
            acc: 95,
            critChance: 15
        },
        skills: [
            {
                name: 'Impacto Tectónico',
                cd: 0,
                currentCd: 0,
                desc: 'Golpe demoledor de masa tectónica (1.5x de daño).',
                type: 'DAMAGE',
                power: 1.5
            },
            {
                name: 'Terremoto Cataclísmico',
                cd: 4,
                currentCd: 0,
                desc: 'Onda sísmica devastadora que golpea a todos los contrincantes (1.2x de daño), aplica Aturdimiento por 1 turno y adhiere Marca de Tierra (3 turnos).',
                type: 'DAMAGE_AOE_STATUS',
                target: 'ALL_ENEMIES',
                power: 1.2,
                status: { type: 'STUN', duration: 1 },
                marks: { type: 'MARCA_TIERRA', duration: 3 }
            }
        ]
    },
    BERSERKER_TERMICO: {
        name: 'Berserker Térmico',
        element: ELEMENTS.FUEGO,
        emoji: '👹',
        isElite: true,
        passive: 'FURIA_SOBRECALENTADA',
        baseStatsOverride: {
            maxHp: 130,
            atk: 22,
            spd: 12,
            dodge: 10,
            acc: 100,
            critChance: 15
        },
        skills: [
            {
                name: 'Sobrecarga de Furia',
                cd: 99,
                currentCd: 0,
                desc: 'Sobrecarga su núcleo térmico al inicio del combate: sacrifica 20% de su HP para activar Furia Sobrecalentada de inmediato.',
                type: 'BUFF',
                target: 'SELF',
                selfDamagePct: 0.20
            },
            {
                name: 'Tajo Incandescente',
                cd: 0,
                currentCd: 0,
                desc: 'Ataque feroz de fuego que escala en daño y probabilidad de crítico a menor porcentaje de HP.',
                type: 'DAMAGE',
                power: 1.3
            }
        ]
    },
    CYBER_STALKER: {
        name: 'Cyber-Stalker',
        element: ELEMENTS.AIRE,
        emoji: '🥷',
        isElite: true,
        baseStatsOverride: {
            maxHp: 75,
            atk: 24,
            spd: 22,
            dodge: 40,
            acc: 100,
            critChance: 25
        },
        skills: [
            {
                name: 'Tajo Asesino',
                cd: 0,
                currentCd: 0,
                desc: 'Tajo de frecuencia de alta potencia con perforación de defensas.',
                type: 'DAMAGE',
                power: 2.0,
                penetrationRatio: 0.50
            },
            {
                name: 'Desfase Cuántico',
                cd: 3,
                currentCd: 0,
                desc: 'Desplaza su firma cuántica, otorgándole 100% de Probabilidad de Esquiva durante 1 turno.',
                type: 'BUFF',
                target: 'SELF',
                status: { type: 'DESFASE_100', duration: 1 }
            }
        ]
    },
    CRIO_CENTINELA: {
        name: 'Crio-Centinela',
        element: ELEMENTS.AGUA,
        emoji: '🧊',
        isElite: true,
        baseStatsOverride: {
            maxHp: 170,
            atk: 17,
            spd: 8,
            dodge: 5,
            acc: 95,
            critChance: 10
        },
        skills: [
            {
                name: 'Ráfaga Gélida',
                cd: 0,
                currentCd: 0,
                desc: 'Disparo de viento cortante (Elemento Aire). Detona ¡Ventisca! si el objetivo tiene Marca de Agua.',
                type: 'DAMAGE',
                power: 1.1,
                elementOverride: ELEMENTS.AIRE
            },
            {
                name: 'Ventisca de Cero Absoluto',
                cd: 3,
                currentCd: 0,
                desc: 'Golpea a todos los contrincantes, reduce su velocidad al mínimo (SPD 1) por 2 turnos y adhiere Marca de Agua (3 turnos).',
                type: 'DAMAGE_AOE_STATUS',
                target: 'ALL_ENEMIES',
                power: 0.85,
                status: { type: 'SLOW_EXTREME', duration: 2 },
                marks: { type: 'MARCA_AGUA', duration: 3 }
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

function generateWildRobot(floor, isElite = false, equipWeapon = false) {
    let robotLevel = floor + (isElite ? 2 : 0);
    
    if (isElite) {
        const eliteKeys = Object.keys(ELITE_TEMPLATES);
        const eliteTemplate = ELITE_TEMPLATES[eliteKeys[Math.floor(Math.random() * eliteKeys.length)]];
        
        let robot = new Robot({
            ...eliteTemplate,
            level: robotLevel,
            isAlly: false,
            isElite: true
        });
        
        // Mutadores de élite: solo aparecen después del piso 5 (a partir del piso 6)
        if (floor >= 6) {
            robot.mutator = MUTATORS[Math.floor(Math.random() * MUTATORS.length)];
            robot.statuses = robot.statuses.filter(s => !s.type.startsWith('MUTACION_'));
            robot.addStatus({
                type: `MUTACION_${robot.mutator.type}`,
                name: `Mutación: ${robot.mutator.name}`,
                desc: robot.mutator.desc,
                isPermanent: true,
                duration: Infinity
            });
        }
        
        // Élites por defecto no portan armas (luchan con sus stats y habilidades puras)
        // Se mantiene la posibilidad opcional con el parámetro equipWeapon
        if (equipWeapon) {
            let weapon = generateRandomWeapon(robot.element);
            robot.equipWeapon(weapon);
        }
        
        return robot;
    }
    
    const templates = Object.keys(ROBOT_TEMPLATES);
    const randomTemplate = ROBOT_TEMPLATES[templates[Math.floor(Math.random() * templates.length)]];
    const baseEnemyName = getRandomEnemyName(randomTemplate.element);
    
    let robot = new Robot({
        ...randomTemplate,
        name: baseEnemyName,
        emoji: '👾',
        level: robotLevel,
        isAlly: false,
        isElite: false
    });
    
    // Probabilidad de arma: 30% en piso 1, sube 10% por piso.
    let weaponProb = Math.min(0.3 + (floor - 1) * 0.1, 1.0);
    if (Math.random() < weaponProb) {
        let weapon = generateRandomWeapon(robot.element); // Arma del mismo elemento
        robot.equipWeapon(weapon);
    }
    
    return robot;
}

function generateBoss(equipWeapon = false) {
    let boss = new Robot({
        name: 'TITAN-X (Jefe)',
        element: ELEMENTS.NEUTRO,
        emoji: '👹',
        level: 10,
        baseStatsOverride: {
            maxHp: 260,
            atk: 20,
            spd: 10,
            dodge: 10,
            acc: 100,
            critChance: 10
        },
        turnPattern: ['Golpe Titánico', 'Pulso PEM Titánico', 'Protocolo Exterminio'],
        skills: [
            { 
                name: 'Golpe Titánico', 
                cd: 0, 
                currentCd: 0, 
                desc: 'Ataque demoledor neutro (1.4x de daño).', 
                type: 'DAMAGE', 
                power: 1.4 
            },
            { 
                name: 'Pulso PEM Titánico', 
                cd: 3, 
                currentCd: 1, 
                desc: 'Pulso electromagnético masivo que daña a todo el escuadrón (0.8x) y desactiva todas las Barreras y Escudos aliados.', 
                type: 'DAMAGE_AOE_STATUS', 
                target: 'ALL_ENEMIES', 
                power: 0.8, 
                purgeShields: true 
            },
            { 
                name: 'Protocolo Exterminio', 
                cd: 4, 
                currentCd: 2, 
                desc: 'Ataque masivo devastador concentrado en un objetivo (2.2x de daño).', 
                type: 'DAMAGE', 
                power: 2.2 
            }
        ]
    });
    // Por defecto no lleva arma para balance controlado y limpio, pero admite equiparla
    if (equipWeapon) {
        boss.equipWeapon(generateRandomWeapon());
    }
    return boss;
}

function generateEncounter(floor, nodeType) {
    if (nodeType === NODE_TYPES.BOSS || floor === 10) {
        return [generateBoss()];
    }
    
    const isElite = (nodeType === NODE_TYPES.ELITE);
    
    // Pisos 1-5: 1 enemigo
    // Pisos 6-9: Probabilidad escalable de generar 2 enemigos (Piso 6: 40%, Piso 7: 50%, Piso 8: 60%, Piso 9: 70%)
    let enemyCount = 1;
    if (floor >= 6 && floor <= 9) {
        let multiChance = 0.40 + (floor - 6) * 0.10; // 0.40, 0.50, 0.60, 0.70
        if (Math.random() < multiChance) {
            enemyCount = 2;
        }
    }
    
    let enemies = [];
    if (isElite) {
        // En Élite: 1 Élite principal + secuaces normales si hay múltiples
        enemies.push(generateWildRobot(floor, true));
        for (let i = 1; i < enemyCount; i++) {
            enemies.push(generateWildRobot(floor, false));
        }
    } else {
        // Combate normal: 1 a N enemigos salvajes
        for (let i = 0; i < enemyCount; i++) {
            enemies.push(generateWildRobot(floor, false));
        }
    }
    
    return enemies;
}

function generateRandomItem() {
    let keys = Object.keys(ITEM_TYPES);
    let type = ITEM_TYPES[keys[Math.floor(Math.random() * keys.length)]];
    return {
        type: type,
        ...ITEM_DEFS[type]
    };
}
