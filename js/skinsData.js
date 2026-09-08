// skinsData.js
// Catálogo de Skins, Criaturas Mitológicas Primigenias, Accesorios y Auras Elementales

const ACCESSORIES_DATABASE = {
    'NONE': {
        id: 'NONE',
        name: '[ Sin Accesorio ]',
        emoji: '',
        className: 'acc-none'
    },
    'SHADES': {
        id: 'SHADES',
        name: 'Lentes Cyber-Shades',
        emoji: '🕶️',
        className: 'acc-shades',
        desc: 'Gafas de sol oscuras polarizadas con filtro anti-deslumbramiento térmico.'
    },
    'VR': {
        id: 'VR',
        name: 'Visor Táctico VR',
        emoji: '🥽',
        className: 'acc-vr',
        desc: 'Visor de realidad aumentada holográfico para fijación de blancos.'
    },
    'CROWN': {
        id: 'CROWN',
        name: 'Corona de Campeón',
        emoji: '👑',
        className: 'acc-crown',
        desc: 'Corona dorada holográfica para unidades de alto rango.'
    }
};

const AURAS_DATABASE = {
    'NONE': {
        id: 'NONE',
        name: '[ Sin Aura ]',
        className: 'aura-none',
        type: 'none',
        desc: 'Sin efecto de aura de fondo.'
    },
    'AUTO': {
        id: 'AUTO',
        name: '🌀 Auto (Según Elemento)',
        className: 'aura-auto',
        type: 'auto',
        desc: 'El aura se adapta automáticamente al elemento nativo del robot.'
    },
    'FUEGO': {
        id: 'FUEGO',
        name: '🔥 Torbellino Infernal (Fuego)',
        className: 'aura-fire',
        type: 'fire',
        desc: 'Llamas intensas, pulso de calor extremo y resplandor carmesí giratorio.'
    },
    'AGUA': {
        id: 'AGUA',
        name: '💧 Vórtice Abisal (Agua)',
        className: 'aura-water',
        type: 'water',
        desc: 'Ondas de marea concéntricas líquidas y resplandor bioluminiscente cian.'
    },
    'TIERRA': {
        id: 'TIERRA',
        name: '🪨 Campo Sísmico (Tierra)',
        className: 'aura-earth',
        type: 'earth',
        desc: 'Runas tectónicas geométricas, escudo gravitacional y pulso telúrico.'
    },
    'AIRE': {
        id: 'AIRE',
        name: '💨 Tempestad Ciclónica (Aire)',
        className: 'aura-air',
        type: 'air',
        desc: 'Vórtice eólico rotatorio a gran velocidad y resplandor de plasma celeste.'
    },
    'COSMIC': {
        id: 'COSMIC',
        name: '⚡ Falla Glitch Cuántica',
        className: 'aura-cosmic',
        type: 'cosmic',
        desc: 'Aberración cromática pulsante, distorsión cuántica y halo magenta/cian.'
    },
    'GOLD': {
        id: 'GOLD',
        name: '✨ Resplandor Divino (Cyber-Gold)',
        className: 'aura-gold',
        type: 'gold',
        desc: 'Aura dorada suprema con anillos de gloria solar brillante.'
    }
};

const PARTICLES_DATABASE = {
    'NONE': {
        id: 'NONE',
        name: '[ Sin Partículas ]',
        className: 'particles-none',
        type: 'none',
        desc: 'Sin efectos de partículas adicionales.'
    },
    'AUTO': {
        id: 'AUTO',
        name: '🌀 Auto (Según Elemento)',
        className: 'particles-auto',
        type: 'auto',
        desc: 'Las partículas se adaptan automáticamente al elemento del robot.'
    },
    'FUEGO': {
        id: 'FUEGO',
        name: '🔥 Brasas y Chispas Flotantes (Fuego)',
        className: 'particles-fire',
        type: 'fire',
        desc: 'Brasas ardientes incandescentes que flotan hacia arriba con chispas de fuego.'
    },
    'AGUA': {
        id: 'AGUA',
        name: '💧 Burbujas y Gotas Bioluminiscentes (Agua)',
        className: 'particles-water',
        type: 'water',
        desc: 'Burbujas acuáticas que suben oscilando suavemente con destellos marinos.'
    },
    'TIERRA': {
        id: 'TIERRA',
        name: '🪨 Fragmentos y Cristales en Órbita (Tierra)',
        className: 'particles-earth',
        type: 'earth',
        desc: 'Esquirlas tectónicas y diamantes telúricos orbitando en 3D alrededor del robot.'
    },
    'AIRE': {
        id: 'AIRE',
        name: '💨 Ráfagas y Centellas Ciclónicas (Aire)',
        className: 'particles-air',
        type: 'air',
        desc: 'Vórtices de viento translúcidos y centellas eléctricas girando a gran velocidad.'
    },
    'COSMIC': {
        id: 'COSMIC',
        name: '⚡ Píxeles Cuánticos y Glitch',
        className: 'particles-cosmic',
        type: 'cosmic',
        desc: 'Fragmentos de datos digitales y píxeles cuánticos parpadeando con desfasaje.'
    },
    'GOLD': {
        id: 'GOLD',
        name: '✨ Estrellas y Destellos Divinos (Cyber-Gold)',
        className: 'particles-gold',
        type: 'gold',
        desc: 'Estrellas doradas radiantes y destellos celestiales expandiéndose hacia afuera.'
    }
};

const SKINS_DATABASE = {
    // === CHASIS ESTÁNDAR ===
    'DEFAULT': {
        id: 'DEFAULT',
        name: '🤖 Chasis Estándar',
        group: '🤖 Estándar',
        emoji: null,
        accessory: null,
        desc: 'El chasis cibernético de combate reglamentario.'
    },
    'ROBOT_SHADES': {
        id: 'ROBOT_SHADES',
        name: '🕶️ Robot con Lentes Cyber-Shades',
        group: '🕶️ Con Lentes Cyberpunk',
        emoji: '🤖',
        accessory: 'SHADES',
        desc: 'Chasis estándar equipado con gafas de sol oscuras de alta facha táctica.'
    },
    'ROBOT_VR': {
        id: 'ROBOT_VR',
        name: '🥽 Robot con Visor VR',
        group: '🤖 Estándar',
        emoji: '🤖',
        accessory: 'VR',
        desc: 'Chasis estándar equipado con visor holográfico de combate.'
    },

    // === ELEMENTALES PRIMIGENIOS (CRIATURAS MITOLÓGICAS) ===
    'PRIMAL_FIRE': {
        id: 'PRIMAL_FIRE',
        name: '🐉 Dragón Ígneo Primordial',
        group: '🐉 Criaturas Primigenias',
        emoji: '🐉',
        accessory: null,
        desc: 'Criatura ancestral nacida de las calderas de fusión nuclear de Ignis.'
    },
    'PRIMAL_FIRE_SHADES': {
        id: 'PRIMAL_FIRE_SHADES',
        name: '🕶️🐉 Dragón Ígneo con Lentes',
        group: '🕶️ Con Lentes Cyberpunk',
        emoji: '🐉',
        accessory: 'SHADES',
        desc: 'El temible Dragón de Fuego Primordial con lentes oscuros.'
    },

    'PRIMAL_WATER': {
        id: 'PRIMAL_WATER',
        name: '🐙 Leviatán Abisal',
        group: '🐉 Criaturas Primigenias',
        emoji: '🐙',
        accessory: null,
        desc: 'Monstruo abisal de plasma hidrodinámico y tentáculos superconductores de Aqua.'
    },
    'PRIMAL_WATER_SHADES': {
        id: 'PRIMAL_WATER_SHADES',
        name: '🕶️🐙 Leviatán Abisal con Lentes',
        group: '🕶️ Con Lentes Cyberpunk',
        emoji: '🐙',
        accessory: 'SHADES',
        desc: 'El soberano de las profundidades marinas equipado con gafas de sol.'
    },

    'PRIMAL_EARTH': {
        id: 'PRIMAL_EARTH',
        name: '🗿 Gólem Ancestral Sísmico',
        group: '🐉 Criaturas Primigenias',
        emoji: '🗿',
        accessory: null,
        desc: 'Coloso monolítico imbuido con el pulso gravitacional telúrico de Terra.'
    },
    'PRIMAL_EARTH_SHADES': {
        id: 'PRIMAL_EARTH_SHADES',
        name: '🕶️🗿 Gólem Ancestral con Lentes',
        group: '🕶️ Con Lentes Cyberpunk',
        emoji: '🗿',
        accessory: 'SHADES',
        desc: 'El coloso de piedra monolítico más estilizado y fachero del sector.'
    },

    'PRIMAL_AIR': {
        id: 'PRIMAL_AIR',
        name: '🦅 Grifo de las Tempestades',
        group: '🐉 Criaturas Primigenias',
        emoji: '🦅',
        accessory: null,
        desc: 'Bestia eólica alada que cabalga los vientos huracanados de Zephyr.'
    },
    'PRIMAL_AIR_SHADES': {
        id: 'PRIMAL_AIR_SHADES',
        name: '🕶️🦅 Grifo Celeste con Lentes',
        group: '🕶️ Con Lentes Cyberpunk',
        emoji: '🦅',
        accessory: 'SHADES',
        desc: 'El amo de las corrientes aéreas surcando el cielo con gafas polarizadas.'
    },

    // === MECHA-BESTIAS Y ESPECIALES ===
    'CYBER_DINO': {
        id: 'CYBER_DINO',
        name: '🦖 Mecha-Dino T-Rex',
        group: '🦖 Bestias Mecánicas',
        emoji: '🦖',
        accessory: null,
        desc: 'Chasis biónico pesado con mandíbulas de presión de titanio.'
    },
    'CYBER_DINO_SHADES': {
        id: 'CYBER_DINO_SHADES',
        name: '🕶️🦖 Mecha-Dino con Lentes',
        group: '🕶️ Con Lentes Cyberpunk',
        emoji: '🦖',
        accessory: 'SHADES',
        desc: 'El Mecha-T-Rex con gafas oscuras listo para la demolición táctica.'
    },

    'CYBER_SKULL': {
        id: 'CYBER_SKULL',
        name: '💀 Cráneo Mecha Cyberpunk',
        group: '🦖 Bestias Mecánicas',
        emoji: '💀',
        accessory: null,
        desc: 'Estructura craneal reforzada de nanocarbono con interfaz neuronal.'
    },
    'CYBER_SKULL_SHADES': {
        id: 'CYBER_SKULL_SHADES',
        name: '🕶️💀 Cráneo Mecha con Lentes',
        group: '🕶️ Con Lentes Cyberpunk',
        emoji: '💀',
        accessory: 'SHADES',
        desc: 'Cráneo cibernético blindado luciendo gafas oscuras de infiltración.'
    },

    'CYBER_ALIEN': {
        id: 'CYBER_ALIEN',
        name: '👾 Invasor Glitch 8-Bit',
        group: '🦖 Bestias Mecánicas',
        emoji: '👾',
        accessory: null,
        desc: 'Entidad de código corrupto con estética arcade retro.'
    },
    'CYBER_ALIEN_SHADES': {
        id: 'CYBER_ALIEN_SHADES',
        name: '🕶️👾 Invasor Glitch con Lentes',
        group: '🕶️ Con Lentes Cyberpunk',
        emoji: '👾',
        accessory: 'SHADES',
        desc: 'Invasor arcade retro con gafas oscuras pixeladas.'
    }
};
