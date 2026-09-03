// balanceManager.js - Módulo de Balanceo en Tiempo Real y Modificación de Archivos

const DEFAULT_BALANCE = {
    elementBaseStats: {
        [ELEMENTS.FUEGO]: { maxHp: 110, atk: 18, spd: 10, dodge: 5, acc: 100, critChance: 10 }, // Caballero
        [ELEMENTS.AGUA]: { maxHp: 135, atk: 15, spd: 8, dodge: 5, acc: 100, critChance: 5 },     // Curandero
        [ELEMENTS.TIERRA]: { maxHp: 180, atk: 16, spd: 4, dodge: 0, acc: 85, critChance: 5 },    // Tanque
        [ELEMENTS.AIRE]: { maxHp: 85, atk: 22, spd: 16, dodge: 25, acc: 100, critChance: 20 },   // Pícaro
        [ELEMENTS.NEUTRO]: { maxHp: 200, atk: 22, spd: 10, dodge: 10, acc: 100, critChance: 10 } // Boss / Maniquí
    },
    elementalMultipliers: {
        [ELEMENTS.FUEGO]: { [ELEMENTS.TIERRA]: 1.35, [ELEMENTS.AGUA]: 0.75 },
        [ELEMENTS.TIERRA]: { [ELEMENTS.AIRE]: 1.35, [ELEMENTS.FUEGO]: 0.75 },
        [ELEMENTS.AIRE]: { [ELEMENTS.AGUA]: 1.35, [ELEMENTS.TIERRA]: 0.75 },
        [ELEMENTS.AGUA]: { [ELEMENTS.FUEGO]: 1.35, [ELEMENTS.AIRE]: 0.75 }
    },
    eliteOverrides: {
        COLOSO_SISMICO: { maxHp: 250, atk: 20, spd: 3, dodge: 0, acc: 95, critChance: 15 },
        BERSERKER_TERMICO: { maxHp: 130, atk: 22, spd: 12, dodge: 10, acc: 100, critChance: 15 },
        CYBER_STALKER: { maxHp: 75, atk: 24, spd: 22, dodge: 40, acc: 100, critChance: 25 },
        CRIO_CENTINELA: { maxHp: 170, atk: 17, spd: 8, dodge: 5, acc: 95, critChance: 10 }
    },
    bossStats: {
        maxHp: 260,
        atk: 20,
        spd: 10,
        dodge: 10,
        acc: 100,
        critChance: 10,
        skill1Power: 1.5,
        skill2Power: 2.2
    },
    version: 3
};

const BalanceManager = {
    storageKey: 'CYBER_ELEMENTAL_CUSTOM_BALANCE',
    current: JSON.parse(JSON.stringify(DEFAULT_BALANCE)),
    fileHandleConstants: null,

    init() {
        this.loadFromStorage();
        this.applyToRuntime();
    },

    loadFromStorage() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                // Si la versión guardada es anterior a la v3 (nuevo balance de élites y jefes), sincronizar a los nuevos defaults
                if (!parsed.version || parsed.version < 3) {
                    console.info('[BalanceManager] Actualizando almacenamiento al nuevo balance de élites y jefe v3.');
                    this.current = JSON.parse(JSON.stringify(DEFAULT_BALANCE));
                    this.saveToStorage();
                } else {
                    this.current = this.mergeWithDefaults(parsed);
                }
                console.info('[BalanceManager] Configuración de balance cargada.');
            } else {
                this.current = JSON.parse(JSON.stringify(DEFAULT_BALANCE));
            }
        } catch (e) {
            console.error('[BalanceManager] Error al cargar de localStorage:', e);
            this.current = JSON.parse(JSON.stringify(DEFAULT_BALANCE));
        }
    },

    mergeWithDefaults(custom) {
        const mergedElites = {};
        Object.keys(DEFAULT_BALANCE.eliteOverrides).forEach(key => {
            const def = DEFAULT_BALANCE.eliteOverrides[key];
            const cust = (custom && custom.eliteOverrides && custom.eliteOverrides[key]) ? custom.eliteOverrides[key] : {};
            mergedElites[key] = {
                maxHp: cust.maxHp !== undefined ? cust.maxHp : (cust.hpMultiplier ? Math.round(def.maxHp * cust.hpMultiplier / 1.45) : def.maxHp),
                atk: cust.atk !== undefined ? cust.atk : (cust.atkMultiplier ? Math.round(def.atk * cust.atkMultiplier) : def.atk),
                spd: cust.spd !== undefined ? cust.spd : def.spd,
                dodge: cust.dodge !== undefined ? cust.dodge : def.dodge,
                acc: cust.acc !== undefined ? cust.acc : def.acc,
                critChance: cust.critChance !== undefined ? cust.critChance : def.critChance
            };
        });

        return {
            elementBaseStats: { ...DEFAULT_BALANCE.elementBaseStats, ...(custom.elementBaseStats || {}) },
            elementalMultipliers: { ...DEFAULT_BALANCE.elementalMultipliers, ...(custom.elementalMultipliers || {}) },
            eliteOverrides: mergedElites,
            bossStats: { ...DEFAULT_BALANCE.bossStats, ...(custom.bossStats || {}) },
            version: 3
        };
    },

    saveToStorage() {
        try {
            this.current.version = 3;
            localStorage.setItem(this.storageKey, JSON.stringify(this.current));
            this.applyToRuntime();
            console.info('[BalanceManager] Configuración guardada en localStorage y aplicada en memoria.');
            return true;
        } catch (e) {
            console.error('[BalanceManager] Error al guardar en localStorage:', e);
            return false;
        }
    },

    resetDefaults() {
        localStorage.removeItem(this.storageKey);
        this.current = JSON.parse(JSON.stringify(DEFAULT_BALANCE));
        this.applyToRuntime();
        console.info('[BalanceManager] Valores restablecidos a los originales oficiales.');
    },

    applyToRuntime() {
        // 1. Aplicar stats base de elementos
        if (typeof ELEMENT_BASE_STATS !== 'undefined') {
            Object.keys(this.current.elementBaseStats).forEach(elem => {
                ELEMENT_BASE_STATS[elem] = { ...this.current.elementBaseStats[elem] };
            });
        }

        // 2. Aplicar multiplicadores elementales
        if (typeof ELEMENTAL_MULTIPLIERS !== 'undefined') {
            Object.keys(this.current.elementalMultipliers).forEach(elem => {
                ELEMENTAL_MULTIPLIERS[elem] = { ...this.current.elementalMultipliers[elem] };
            });
        }

        // 3. Aplicar overrides a ELITE_TEMPLATES si existen
        if (typeof ELITE_TEMPLATES !== 'undefined') {
            Object.keys(this.current.eliteOverrides).forEach(key => {
                if (ELITE_TEMPLATES[key]) {
                    ELITE_TEMPLATES[key].baseStatsOverride = { ...this.current.eliteOverrides[key] };
                }
            });
        }
    },

    // Generar código JS para constants.js
    generateConstantsCode() {
        const statsStr = JSON.stringify(this.current.elementBaseStats, null, 4)
            .replace(/"FUEGO"/g, '[ELEMENTS.FUEGO]')
            .replace(/"AGUA"/g, '[ELEMENTS.AGUA]')
            .replace(/"TIERRA"/g, '[ELEMENTS.TIERRA]')
            .replace(/"AIRE"/g, '[ELEMENTS.AIRE]')
            .replace(/"NEUTRO"/g, '[ELEMENTS.NEUTRO]');

        const multStr = JSON.stringify(this.current.elementalMultipliers, null, 4)
            .replace(/"FUEGO"/g, '[ELEMENTS.FUEGO]')
            .replace(/"AGUA"/g, '[ELEMENTS.AGUA]')
            .replace(/"TIERRA"/g, '[ELEMENTS.TIERRA]')
            .replace(/"AIRE"/g, '[ELEMENTS.AIRE]');

        return `// constants.js

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
const ELEMENTAL_MULTIPLIERS = ${multStr};

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

const ELEMENT_BASE_STATS = ${statsStr};

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
`;
    },

    // Guardado directo en disco con File System Access API (Chrome / Edge / Opera)
    async saveDirectlyToDisk() {
        const code = this.generateConstantsCode();
        
        if ('showSaveFilePicker' in window || 'showOpenFilePicker' in window) {
            try {
                let handle = this.fileHandleConstants;
                if (!handle) {
                    if ('showSaveFilePicker' in window) {
                        handle = await window.showSaveFilePicker({
                            suggestedName: 'constants.js',
                            types: [{
                                description: 'Archivo JavaScript (*.js)',
                                accept: { 'text/javascript': ['.js'] }
                            }]
                        });
                    } else {
                        const [file] = await window.showOpenFilePicker({
                            types: [{
                                description: 'Selecciona js/constants.js',
                                accept: { 'text/javascript': ['.js'] }
                            }]
                        });
                        handle = file;
                    }
                    this.fileHandleConstants = handle;
                }

                const writable = await handle.createWritable();
                await writable.write(code);
                await writable.close();
                
                this.saveToStorage();
                return { success: true, method: 'DIRECT_FILE', message: '¡Archivo constants.js modificado y guardado directamente en tu disco con éxito!' };
            } catch (err) {
                if (err.name === 'AbortError') {
                    return { success: false, method: 'CANCELLED', message: 'Guardado cancelado por el usuario.' };
                }
                console.warn('[BalanceManager] File System API no completada, usando descarga:', err);
            }
        }

        // Fallback: Descarga directa
        this.downloadConstantsFile();
        this.saveToStorage();
        return { success: true, method: 'DOWNLOAD', message: 'Se ha descargado el archivo constants.js actualizado para reemplazarlo en tu carpeta js/.' };
    },

    downloadConstantsFile() {
        const code = this.generateConstantsCode();
        const blob = new Blob([code], { type: 'text/javascript;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'constants.js';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    exportJSON() {
        return JSON.stringify(this.current, null, 2);
    },

    importJSON(jsonStr) {
        try {
            const parsed = JSON.parse(jsonStr);
            this.current = this.mergeWithDefaults(parsed);
            this.saveToStorage();
            return { success: true, message: 'Configuración importada y aplicada exitosamente.' };
        } catch (e) {
            return { success: false, message: 'Error al parsear el archivo JSON: ' + e.message };
        }
    }
};

// Inicializar BalanceManager de inmediato
BalanceManager.init();
