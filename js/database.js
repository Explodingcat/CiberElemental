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
                cd: 4,
                currentCd: 0,
                desc: 'Bloquea 100% del próximo golpe recibido y aplica 1 Marca de Agua al atacante.',
                type: 'BUFF',
                status: { type: 'BARRIER', duration: 2 }
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
                name: 'Terremoto',
                cd: 4,
                currentCd: 0,
                desc: 'Inflige 1.3x daño + 60% prob. de Aturdimiento (garantizado con Marca previa).',
                type: 'DAMAGE_STATUS',
                power: 1.3,
                status: { type: 'STUN', duration: 1 }
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

function generateWildRobot(floor, isElite = false) {
    const templates = Object.keys(ROBOT_TEMPLATES);
    const randomTemplate = ROBOT_TEMPLATES[templates[Math.floor(Math.random() * templates.length)]];
    
    // Nivel basado en el piso (élites tienen +2 niveles)
    let robotLevel = floor + (isElite ? 2 : 0);
    
    let robot = new Robot({
        ...randomTemplate,
        name: isElite ? `ÉLITE ${randomTemplate.name}` : `Salvaje ${randomTemplate.name}`,
        emoji: isElite ? '💀' : '👾',
        level: robotLevel
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
