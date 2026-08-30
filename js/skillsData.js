// skillsData.js
// Catálogo completo de las 50 habilidades pasivas para el Árbol de Meta-Progresión de Cyber-Elemental

const SKILL_BRANCHES = {
    ASSAULT: {
        id: 'ASSAULT',
        name: 'Protocolo Asalto',
        icon: '⚔️',
        themeClass: 'branch-assault',
        desc: 'Optimización de potencia de fuego, sensores críticos, precisión y maestría en armas.'
    },
    DEFENSE: {
        id: 'DEFENSE',
        name: 'Blindaje Estructural',
        icon: '🛡️',
        themeClass: 'branch-defense',
        desc: 'Refuerzo de aleaciones, mitigación de impactos, propulsores de evasión y nanobots.'
    },
    ELEMENTAL: {
        id: 'ELEMENTAL',
        name: 'Sintonía Elemental',
        icon: '⚡',
        themeClass: 'branch-elemental',
        desc: 'Canalización de matrices de Fuego, Agua, Tierra y Aire, combos de reacción y afinidad.'
    },
    TACTICS: {
        id: 'TACTICS',
        name: 'Logística y Táctica',
        icon: '🛠️',
        themeClass: 'branch-tactics',
        desc: 'Gestión de chatarra, descuentos en mercados, protocolos de hackeo y optimización de recursos.'
    }
};

const SKILLS_CATALOG = [
    // =========================================================================
    // ⚔️ RAMA 1: PROTOCOLO ASALTO (13 Pasivas)
    // =========================================================================
    {
        id: 'atk_up_1',
        branch: 'ASSAULT',
        tier: 1,
        name: 'Calibración de Potencia I',
        icon: '💥',
        cost: 100,
        prerequisites: [],
        desc: 'Aumenta el ATQ de todos los aliados en un +5%.',
        modifiers: { atk_pct: 0.05 }
    },
    {
        id: 'atk_up_2',
        branch: 'ASSAULT',
        tier: 2,
        name: 'Calibración de Potencia II',
        icon: '💥',
        cost: 200,
        prerequisites: ['atk_up_1'],
        desc: 'Aumenta el ATQ de todos los aliados en un +10% adicional.',
        modifiers: { atk_pct: 0.10 }
    },
    {
        id: 'atk_up_3',
        branch: 'ASSAULT',
        tier: 3,
        name: 'Calibración de Potencia III',
        icon: '💥',
        cost: 375,
        prerequisites: ['atk_up_2'],
        desc: 'Aumenta el ATQ de todos los aliados en un +15% adicional.',
        modifiers: { atk_pct: 0.15 }
    },
    {
        id: 'crit_rate_1',
        branch: 'ASSAULT',
        tier: 1,
        name: 'Sensores Ópticos I',
        icon: '🎯',
        cost: 125,
        prerequisites: [],
        desc: '+3% de Probabilidad de Impacto Crítico para todo el escuadrón.',
        modifiers: { crit_rate: 3 }
    },
    {
        id: 'crit_rate_2',
        branch: 'ASSAULT',
        tier: 2,
        name: 'Sensores Ópticos II',
        icon: '🎯',
        cost: 225,
        prerequisites: ['crit_rate_1'],
        desc: '+5% de Probabilidad de Impacto Crítico adicional para todo el escuadrón.',
        modifiers: { crit_rate: 5 }
    },
    {
        id: 'crit_rate_3',
        branch: 'ASSAULT',
        tier: 3,
        name: 'Sensores Ópticos III',
        icon: '🎯',
        cost: 400,
        prerequisites: ['crit_rate_2'],
        desc: '+7% de Probabilidad de Impacto Crítico adicional para todo el escuadrón.',
        modifiers: { crit_rate: 7 }
    },
    {
        id: 'crit_dmg_1',
        branch: 'ASSAULT',
        tier: 2,
        name: 'Sobrecarga Crítica I',
        icon: '⚡',
        cost: 250,
        prerequisites: ['crit_rate_1'],
        desc: 'Los golpes críticos infligen un +15% de daño extra (Total 1.65x).',
        modifiers: { crit_dmg_pct: 0.15 }
    },
    {
        id: 'crit_dmg_2',
        branch: 'ASSAULT',
        tier: 3,
        name: 'Sobrecarga Crítica II',
        icon: '⚡',
        cost: 450,
        prerequisites: ['crit_dmg_1'],
        desc: 'Los golpes críticos infligen un +25% de daño extra adicional (Total 1.90x).',
        modifiers: { crit_dmg_pct: 0.25 }
    },
    {
        id: 'acc_up_1',
        branch: 'ASSAULT',
        tier: 1,
        name: 'Algoritmo de Puntería I',
        icon: '👁️',
        cost: 100,
        prerequisites: [],
        desc: '+5% de Precisión en todos los ataques del escuadrón.',
        modifiers: { acc: 5 }
    },
    {
        id: 'acc_up_2',
        branch: 'ASSAULT',
        tier: 2,
        name: 'Algoritmo de Puntería II',
        icon: '👁️',
        cost: 200,
        prerequisites: ['acc_up_1'],
        desc: '+10% de Precisión adicional en todos los ataques del escuadrón.',
        modifiers: { acc: 10 }
    },
    {
        id: 'dagger_mastery',
        branch: 'ASSAULT',
        tier: 3,
        name: 'Dagas de Frecuencia',
        icon: '🗡️',
        cost: 350,
        prerequisites: ['atk_up_2'],
        desc: '+10% de probabilidad de ataque doble al portar Dagas.',
        modifiers: { dagger_double_chance: 0.10 }
    },
    {
        id: 'axe_mastery',
        branch: 'ASSAULT',
        tier: 3,
        name: 'Hachas de Plasma',
        icon: '🪓',
        cost: 350,
        prerequisites: ['atk_up_2'],
        desc: 'Las Hachas perforan un +15% de defensas y barreras enemigas adicional.',
        modifiers: { axe_penetration: 0.15 }
    },
    {
        id: 'sword_mastery',
        branch: 'ASSAULT',
        tier: 4,
        name: 'Filos Energizados',
        icon: '⚔️',
        cost: 550,
        prerequisites: ['atk_up_3'],
        desc: 'Las Espadas otorgan un +10% de daño base y +5% de crítico adicional.',
        modifiers: { sword_bonus_dmg: 0.10, sword_bonus_crit: 5 }
    },

    // =========================================================================
    // 🛡️ RAMA 2: BLINDAJE ESTRUCTURAL (13 Pasivas)
    // =========================================================================
    {
        id: 'hp_up_1',
        branch: 'DEFENSE',
        tier: 1,
        name: 'Aleación Reforzada I',
        icon: '❤️',
        cost: 100,
        prerequisites: [],
        desc: 'Aumenta el HP Máximo de todos los aliados en un +10%.',
        modifiers: { hp_pct: 0.10 }
    },
    {
        id: 'hp_up_2',
        branch: 'DEFENSE',
        tier: 2,
        name: 'Aleación Reforzada II',
        icon: '❤️',
        cost: 200,
        prerequisites: ['hp_up_1'],
        desc: 'Aumenta el HP Máximo de todos los aliados en un +15% adicional.',
        modifiers: { hp_pct: 0.15 }
    },
    {
        id: 'hp_up_3',
        branch: 'DEFENSE',
        tier: 3,
        name: 'Aleación Reforzada III',
        icon: '❤️',
        cost: 375,
        prerequisites: ['hp_up_2'],
        desc: 'Aumenta el HP Máximo de todos los aliados en un +20% adicional.',
        modifiers: { hp_pct: 0.20 }
    },
    {
        id: 'dodge_up_1',
        branch: 'DEFENSE',
        tier: 1,
        name: 'Propulsores de Evasión I',
        icon: '💨',
        cost: 125,
        prerequisites: [],
        desc: '+3% de Probabilidad de Esquiva para todo el escuadrón.',
        modifiers: { dodge: 3 }
    },
    {
        id: 'dodge_up_2',
        branch: 'DEFENSE',
        tier: 2,
        name: 'Propulsores de Evasión II',
        icon: '💨',
        cost: 225,
        prerequisites: ['dodge_up_1'],
        desc: '+5% de Probabilidad de Esquiva adicional para todo el escuadrón.',
        modifiers: { dodge: 5 }
    },
    {
        id: 'dodge_up_3',
        branch: 'DEFENSE',
        tier: 3,
        name: 'Propulsores de Evasión III',
        icon: '💨',
        cost: 400,
        prerequisites: ['dodge_up_2'],
        desc: '+7% de Probabilidad de Esquiva adicional para todo el escuadrón.',
        modifiers: { dodge: 7 }
    },
    {
        id: 'barrier_boost',
        branch: 'DEFENSE',
        tier: 2,
        name: 'Blindaje de Plasma',
        icon: '🛡️',
        cost: 275,
        prerequisites: ['hp_up_1'],
        desc: 'Las Barreras protectoras duran +1 turno adicional antes de disiparse.',
        modifiers: { barrier_extra_duration: 1 }
    },
    {
        id: 'staff_mastery',
        branch: 'DEFENSE',
        tier: 3,
        name: 'Báculos de Regeneración',
        icon: '🪄',
        cost: 325,
        prerequisites: ['hp_up_2'],
        desc: 'Los Báculos regeneran un +2% extra del HP Máximo al final del turno.',
        modifiers: { staff_extra_heal: 0.02 }
    },
    {
        id: 'defend_boost',
        branch: 'DEFENSE',
        tier: 2,
        name: 'Modo Fortaleza',
        icon: '🏰',
        cost: 225,
        prerequisites: ['hp_up_1'],
        desc: 'La acción de Defender reduce el daño recibido un 10% adicional (60% total).',
        modifiers: { defend_bonus_reduction: 0.10 }
    },
    {
        id: 'first_aid_core',
        branch: 'DEFENSE',
        tier: 3,
        name: 'Nanobots de Emergencia',
        icon: '🩹',
        cost: 375,
        prerequisites: ['hp_up_2'],
        desc: 'Todas las curaciones recibidas por el escuadrón aumentan un +25%.',
        modifiers: { healing_received_pct: 0.25 }
    },
    {
        id: 'revive_resilience',
        branch: 'DEFENSE',
        tier: 3,
        name: 'Protocolo Lázaro',
        icon: '⚕️',
        cost: 350,
        prerequisites: ['hp_up_2'],
        desc: 'Al revivir en el campamento, las unidades recuperan 25% HP en vez de 10%.',
        modifiers: { revive_hp_pct: 0.25 }
    },
    {
        id: 'burn_resist',
        branch: 'DEFENSE',
        tier: 2,
        name: 'Disipadores Térmicos',
        icon: '❄️',
        cost: 225,
        prerequisites: ['hp_up_1'],
        desc: 'Reduce el daño recibido por Quemadura en un 30%.',
        modifiers: { burn_damage_reduction: 0.30 }
    },
    {
        id: 'stun_resist',
        branch: 'DEFENSE',
        tier: 4,
        name: 'Firmeza Giroscópica',
        icon: '🧱',
        cost: 500,
        prerequisites: ['hp_up_3'],
        desc: '25% de probabilidad de ignorar por completo los aturdimientos enemigos.',
        modifiers: { stun_resist_chance: 0.25 }
    },

    // =========================================================================
    // ⚡ RAMA 3: SINTONÍA ELEMENTAL (12 Pasivas)
    // =========================================================================
    {
        id: 'elem_fire_up',
        branch: 'ELEMENTAL',
        tier: 1,
        name: 'Condensadores Ígneos',
        icon: '🔥',
        cost: 125,
        prerequisites: [],
        desc: '+15% de daño infligido con habilidades y ataques de FUEGO.',
        modifiers: { elem_boost_FUEGO: 0.15 }
    },
    {
        id: 'elem_water_up',
        branch: 'ELEMENTAL',
        tier: 1,
        name: 'Bombas Hidráulicas',
        icon: '💧',
        cost: 125,
        prerequisites: [],
        desc: '+15% de daño infligido con habilidades y ataques de AGUA.',
        modifiers: { elem_boost_AGUA: 0.15 }
    },
    {
        id: 'elem_earth_up',
        branch: 'ELEMENTAL',
        tier: 1,
        name: 'Martillos Sísmicos',
        icon: '🪨',
        cost: 125,
        prerequisites: [],
        desc: '+15% de daño infligido con habilidades y ataques de TIERRA.',
        modifiers: { elem_boost_TIERRA: 0.15 }
    },
    {
        id: 'elem_air_up',
        branch: 'ELEMENTAL',
        tier: 1,
        name: 'Turbinas Eólicas',
        icon: '💨',
        cost: 125,
        prerequisites: [],
        desc: '+15% de daño infligido con habilidades y ataques de AIRE.',
        modifiers: { elem_boost_AIRE: 0.15 }
    },
    {
        id: 'combo_damage_up',
        branch: 'ELEMENTAL',
        tier: 2,
        name: 'Resonancia Reaccionaria',
        icon: '💥',
        cost: 300,
        prerequisites: ['elem_fire_up'],
        desc: 'Las Reacciones Elementales y Combos infligen un +20% de daño adicional.',
        modifiers: { combo_damage_pct: 0.20 }
    },
    {
        id: 'burn_duration_up',
        branch: 'ELEMENTAL',
        tier: 2,
        name: 'Napalm Sintético',
        icon: '🧨',
        cost: 250,
        prerequisites: ['elem_fire_up'],
        desc: 'Las Quemaduras aplicadas por el escuadrón duran +1 turno extra.',
        modifiers: { burn_duration_extra: 1 }
    },
    {
        id: 'affinity_mastery_1',
        branch: 'ELEMENTAL',
        tier: 2,
        name: 'Sintonía de Chasis I',
        icon: '🌟',
        cost: 275,
        prerequisites: ['elem_earth_up'],
        desc: 'El bono de Afinidad de Arma otorga +5% extra de HP y ATQ (+25% total).',
        modifiers: { affinity_bonus_extra: 0.05 }
    },
    {
        id: 'affinity_mastery_2',
        branch: 'ELEMENTAL',
        tier: 3,
        name: 'Sintonía de Chasis II',
        icon: '🌟',
        cost: 425,
        prerequisites: ['affinity_mastery_1'],
        desc: 'El bono de Afinidad de Arma otorga un +10% adicional (+35% total).',
        modifiers: { affinity_bonus_extra: 0.10 }
    },
    {
        id: 'mark_damage_up',
        branch: 'ELEMENTAL',
        tier: 3,
        name: 'Neuro-Marcadores',
        icon: '🔮',
        cost: 400,
        prerequisites: ['combo_damage_up'],
        desc: '+10% de daño infligido contra objetivos que tengan una Marca activa.',
        modifiers: { marked_target_damage: 0.10 }
    },
    {
        id: 'starter_fire_buff',
        branch: 'ELEMENTAL',
        tier: 3,
        name: 'Núcleo Volcánico',
        icon: '🌋',
        cost: 375,
        prerequisites: ['elem_fire_up'],
        desc: 'Las unidades de Fuego inician cada combate con un +10% de ATQ adicional.',
        modifiers: { fire_starter_atk_pct: 0.10 }
    },
    {
        id: 'starter_water_buff',
        branch: 'ELEMENTAL',
        tier: 3,
        name: 'Batería Térmica',
        icon: '🌊',
        cost: 375,
        prerequisites: ['elem_water_up'],
        desc: 'Las unidades de Agua inician cada combate con una Barrera protectora activa.',
        modifiers: { water_starter_barrier: true }
    },
    {
        id: 'starter_earth_buff',
        branch: 'ELEMENTAL',
        tier: 4,
        name: 'Blindaje Tectónico',
        icon: '⛰️',
        cost: 550,
        prerequisites: ['affinity_mastery_2'],
        desc: 'Las unidades de Tierra ganan un +20% de HP Máximo permanente adicional.',
        modifiers: { earth_bonus_hp_pct: 0.20 }
    },

    // =========================================================================
    // 🛠️ RAMA 4: LOGÍSTICA Y TÁCTICA (12 Pasivas)
    // =========================================================================
    {
        id: 'start_scrap_1',
        branch: 'TACTICS',
        tier: 1,
        name: 'Reserva de Chatarra I',
        icon: '⚙️',
        cost: 100,
        prerequisites: [],
        desc: 'Inicias cada incursión con +30 de Chatarra disponible.',
        modifiers: { start_scrap: 30 }
    },
    {
        id: 'start_scrap_2',
        branch: 'TACTICS',
        tier: 2,
        name: 'Reserva de Chatarra II',
        icon: '⚙️',
        cost: 225,
        prerequisites: ['start_scrap_1'],
        desc: 'Inicias cada incursión con +60 de Chatarra disponible adicional (+90 total).',
        modifiers: { start_scrap: 60 }
    },
    {
        id: 'start_scrap_3',
        branch: 'TACTICS',
        tier: 3,
        name: 'Reserva de Chatarra III',
        icon: '⚙️',
        cost: 400,
        prerequisites: ['start_scrap_2'],
        desc: 'Inicias cada incursión con +100 de Chatarra disponible adicional (+190 total).',
        modifiers: { start_scrap: 100 }
    },
    {
        id: 'scrap_gain_1',
        branch: 'TACTICS',
        tier: 1,
        name: 'Imanes de Chatarrero I',
        icon: '🧲',
        cost: 125,
        prerequisites: [],
        desc: '+15% de Chatarra recolectada en todas las victorias de combate.',
        modifiers: { scrap_gain_pct: 0.15 }
    },
    {
        id: 'scrap_gain_2',
        branch: 'TACTICS',
        tier: 2,
        name: 'Imanes de Chatarrero II',
        icon: '🧲',
        cost: 250,
        prerequisites: ['scrap_gain_1'],
        desc: '+25% de Chatarra recolectada en victorias de combate adicional (+40% total).',
        modifiers: { scrap_gain_pct: 0.25 }
    },
    {
        id: 'shop_discount_1',
        branch: 'TACTICS',
        tier: 2,
        name: 'Negociación Cibernética I',
        icon: '🏷️',
        cost: 250,
        prerequisites: ['start_scrap_1'],
        desc: '-10% de descuento en todos los artículos de las Tiendas de Mercado.',
        modifiers: { shop_discount_pct: 0.10 }
    },
    {
        id: 'shop_discount_2',
        branch: 'TACTICS',
        tier: 3,
        name: 'Negociación Cibernética II',
        icon: '🏷️',
        cost: 425,
        prerequisites: ['shop_discount_1'],
        desc: '-20% de descuento en Tiendas de Mercado adicional (-30% total).',
        modifiers: { shop_discount_pct: 0.20 }
    },
    {
        id: 'xp_boost_1',
        branch: 'TACTICS',
        tier: 1,
        name: 'Chips de Aprendizaje I',
        icon: '💡',
        cost: 125,
        prerequisites: [],
        desc: '+15% de Experiencia (XP) ganada por todo el escuadrón en combates.',
        modifiers: { xp_gain_pct: 0.15 }
    },
    {
        id: 'xp_boost_2',
        branch: 'TACTICS',
        tier: 2,
        name: 'Chips de Aprendizaje II',
        icon: '💡',
        cost: 275,
        prerequisites: ['xp_boost_1'],
        desc: '+25% de XP ganada adicional para todo el escuadrón (+40% total).',
        modifiers: { xp_gain_pct: 0.25 }
    },
    {
        id: 'elite_recruit_up',
        branch: 'TACTICS',
        tier: 3,
        name: 'Algoritmo de Hackeo',
        icon: '🤖',
        cost: 450,
        prerequisites: ['xp_boost_2'],
        desc: 'La probabilidad de reclutar robots Élite exitosamente sube de 50% a 75%.',
        modifiers: { elite_recruit_chance: 0.75 }
    },
    {
        id: 'repair_efficiency',
        branch: 'TACTICS',
        tier: 3,
        name: 'Kits Optimizados',
        icon: '⛺',
        cost: 375,
        prerequisites: ['shop_discount_1'],
        desc: 'El Taller de Reparación repara un 40% de HP a todos los aliados (en vez de 30%).',
        modifiers: { repair_shop_heal_pct: 0.40 }
    },
    {
        id: 'dismantle_bonus',
        branch: 'TACTICS',
        tier: 4,
        name: 'Reciclaje Estructural',
        icon: '♻️',
        cost: 550,
        prerequisites: ['scrap_gain_2'],
        desc: 'Desmantelar robots derrotados otorga +50 Chatarra fija y +15% de curación.',
        modifiers: { dismantle_scrap_bonus: 20, dismantle_heal_pct: 0.15 }
    }
];
