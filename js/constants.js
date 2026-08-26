// constants.js

const ELEMENTS = {
    FUEGO: 'FUEGO',
    AGUA: 'AGUA',
    TIERRA: 'TIERRA',
    AIRE: 'AIRE',
    NEUTRO: 'NEUTRO'
};

const ELEMENT_EMOJIS = {
    [ELEMENTS.FUEGO]: '🔥',
    [ELEMENTS.AGUA]: '💧',
    [ELEMENTS.TIERRA]: '🪨',
    [ELEMENTS.AIRE]: '💨',
    [ELEMENTS.NEUTRO]: '⚙️'
};

const NODE_TYPES = {
    COMBAT: 'COMBAT',
    CHEST: 'CHEST',
    REPAIR_SHOP: 'REPAIR_SHOP',
    SHOP: 'SHOP',
    BOSS: 'BOSS',
    MYSTERY: 'MYSTERY',
    ELITE: 'ELITE'
};

const NODE_EMOJIS = {
    [NODE_TYPES.COMBAT]: '👾',
    [NODE_TYPES.CHEST]: '🎁',
    [NODE_TYPES.REPAIR_SHOP]: '⛺',
    [NODE_TYPES.SHOP]: '🛒',
    [NODE_TYPES.BOSS]: '👑',
    [NODE_TYPES.MYSTERY]: '❓',
    [NODE_TYPES.ELITE]: '💀'
};

const NODE_LABELS = {
    [NODE_TYPES.COMBAT]: 'Combate',
    [NODE_TYPES.CHEST]: 'Tesoro',
    [NODE_TYPES.REPAIR_SHOP]: 'Taller',
    [NODE_TYPES.SHOP]: 'Mercado',
    [NODE_TYPES.BOSS]: 'JEFE FINAL',
    [NODE_TYPES.MYSTERY]: 'Misterio',
    [NODE_TYPES.ELITE]: 'Élite'
};

// Matriz elemental: Atacante -> Defensor = Multiplicador
// FUEGO -> TIERRA -> AIRE -> AGUA -> FUEGO
const ELEMENTAL_MULTIPLIERS = {
    [ELEMENTS.FUEGO]: { [ELEMENTS.TIERRA]: 1.5, [ELEMENTS.AGUA]: 0.5 },
    [ELEMENTS.TIERRA]: { [ELEMENTS.AIRE]: 1.5, [ELEMENTS.FUEGO]: 0.5 },
    [ELEMENTS.AIRE]: { [ELEMENTS.AGUA]: 1.5, [ELEMENTS.TIERRA]: 0.5 },
    [ELEMENTS.AGUA]: { [ELEMENTS.FUEGO]: 1.5, [ELEMENTS.AIRE]: 0.5 },
};

const WEAPON_TYPES = {
    DAGA: 'DAGA',
    HACHA: 'HACHA',
    BACULO: 'BACULO',
    ESPADA: 'ESPADA'
};

const WEAPON_EMOJIS = {
    [WEAPON_TYPES.DAGA]: '🗡️',
    [WEAPON_TYPES.HACHA]: '🪓',
    [WEAPON_TYPES.BACULO]: '🪄',
    [WEAPON_TYPES.ESPADA]: '⚔️'
};

const ELEMENT_BASE_STATS = {
    [ELEMENTS.FUEGO]: { maxHp: 90, atk: 28, spd: 11, dodge: 5, acc: 100 },
    [ELEMENTS.AGUA]: { maxHp: 130, atk: 14, spd: 9, dodge: 5, acc: 95 },
    [ELEMENTS.TIERRA]: { maxHp: 175, atk: 12, spd: 4, dodge: 0, acc: 85 },
    [ELEMENTS.AIRE]: { maxHp: 80, atk: 22, spd: 16, dodge: 25, acc: 95 },
    [ELEMENTS.NEUTRO]: { maxHp: 200, atk: 30, spd: 12, dodge: 10, acc: 100 } // Boss
};

const ITEM_TYPES = {
    NANOBOTS: 'NANOBOTS',
    PEM: 'PEM',
    SOBRECARGA: 'SOBRECARGA',
    CHIP_FUEGO: 'CHIP_FUEGO',
    CHIP_AGUA: 'CHIP_AGUA',
    CHIP_TIERRA: 'CHIP_TIERRA',
    CHIP_AIRE: 'CHIP_AIRE'
};

const ITEM_DEFS = {
    [ITEM_TYPES.NANOBOTS]: { name: 'Kit de Nanobots', emoji: '🩹', desc: 'Cura 40% del HP máximo. Usable fuera de combate.' },
    [ITEM_TYPES.PEM]: { name: 'Bomba PEM', emoji: '💥', desc: 'Gasta turno de acción. Aturde al enemigo por 1 turno.' },
    [ITEM_TYPES.SOBRECARGA]: { name: 'Núcleo Sobrecarga', emoji: '🔋', desc: 'Reduce 1 turno de Cooldown al robot activo.' },
    [ITEM_TYPES.CHIP_FUEGO]: { name: 'Chip de Fuego', emoji: '💾', desc: 'Enseña: Lanzallamas (Fuego, 3 CD). Instálalo en el inventario.' },
    [ITEM_TYPES.CHIP_AGUA]: { name: 'Chip de Agua', emoji: '💾', desc: 'Enseña: Geyser (Agua, 3 CD). Instálalo en el inventario.' },
    [ITEM_TYPES.CHIP_TIERRA]: { name: 'Chip de Tierra', emoji: '💾', desc: 'Enseña: Fisura (Tierra, 3 CD). Instálalo en el inventario.' },
    [ITEM_TYPES.CHIP_AIRE]: { name: 'Chip de Aire', emoji: '💾', desc: 'Enseña: Tornado (Aire, 3 CD). Instálalo en el inventario.' }
};

function getMultiplier(attackerElement, defenderElement) {
    if (attackerElement === defenderElement) return 1.0;
    if (ELEMENTAL_MULTIPLIERS[attackerElement] && ELEMENTAL_MULTIPLIERS[attackerElement][defenderElement]) {
        return ELEMENTAL_MULTIPLIERS[attackerElement][defenderElement];
    }
    return 1.0;
}
