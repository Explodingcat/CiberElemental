// relicsData.js - Catálogo oficial de 34 Reliquias y Artefactos Pasivos

const RELIC_RARITIES = {
    COMUN: { id: 'COMUN', name: 'Común', color: '#a4b0be', glow: 'rgba(164, 176, 190, 0.4)' },
    RARO: { id: 'RARO', name: 'Raro', color: '#48dbfb', glow: 'rgba(72, 219, 251, 0.5)' },
    EPICO: { id: 'EPICO', name: 'Épico', color: '#a55eea', glow: 'rgba(165, 94, 234, 0.6)' },
    LEGENDARIO: { id: 'LEGENDARIO', name: 'Legendario', color: '#fed330', glow: 'rgba(254, 211, 48, 0.7)' },
    CORRUPTA: { id: 'CORRUPTA', name: 'Corrupta', color: '#eb4d4b', glow: 'rgba(235, 77, 75, 0.7)' }
};

const RELIC_CATEGORIES = {
    ELEMENTAL: { id: 'ELEMENTAL', name: 'Sinergias Elementales', icon: '✨' },
    WEAPONS: { id: 'WEAPONS', name: 'Armas & Maestrías', icon: '⚔️' },
    SURVIVAL: { id: 'SURVIVAL', name: 'Supervivencia & Blindaje', icon: '🛡️' },
    SPEED: { id: 'SPEED', name: 'Velocidad & Iniciativa', icon: '⚡' },
    ECONOMY: { id: 'ECONOMY', name: 'Economía & Taller', icon: '⚙️' },
    CORRUPTED: { id: 'CORRUPTED', name: 'Reliquias Corruptas', icon: '☣️' }
};

const RELICS_DATA = {
    // ==========================================
    // 1. SINERGIAS ELEMENTALES (10)
    // ==========================================
    'catalizador_termico': {
        id: 'catalizador_termico',
        name: 'Catalizador Térmico',
        category: 'ELEMENTAL',
        rarity: 'RARO',
        icon: '🔥',
        desc: 'Al detonar <strong>Vaporización</strong> o <strong>Tormenta Ígnea</strong>, aplica <strong>1 acumulación de Quemadura</strong> (3 turnos) a todos los demás enemigos vivos.',
        lore: 'Dispositivo pirotécnico que redirecciona el exceso de calor térmico a la telemetría enemiga circundante.'
    },
    'prisma_escarcha': {
        id: 'prisma_escarcha',
        name: 'Prisma de Escarcha',
        category: 'ELEMENTAL',
        rarity: 'COMUN',
        icon: '🧊',
        desc: 'La reacción <strong>Ventisca</strong> reduce la precisión rival en un <strong>-35%</strong> (en lugar de -20%) y extiende su duración a <strong>3 turnos</strong>.',
        lore: 'Cristal ultra-refinado que intensifica la refracción del frío absoluto cegando los sensores ópticos.'
    },
    'condensador_plasma': {
        id: 'condensador_plasma',
        name: 'Condensador de Plasma',
        category: 'ELEMENTAL',
        rarity: 'RARO',
        icon: '⚡',
        desc: 'Al detonar <strong>Choque Térmico</strong>, además de purgar ventajas enemigas, descarga <strong>20 de daño directo</strong> a todos los enemigos en el campo.',
        lore: 'Condensador de alta capacidad que descarga pulsos electromagnéticos residuales tras cada colisión térmica.'
    },
    'fision_volcanica': {
        id: 'fision_volcanica',
        name: 'Fisión Volcánica',
        category: 'ELEMENTAL',
        rarity: 'RARO',
        icon: '🌋',
        desc: 'La reacción <strong>Erupción</strong> reduce la defensa enemiga un <strong>-40%</strong> (en lugar de -25%) y salpica <strong>Marca de Fuego</strong> a los demás enemigos.',
        lore: 'Micro-reactor magmático capaz de fracturar aleaciones pesadas con calor de fisión instantáneo.'
    },
    'geoda_resonancia': {
        id: 'geoda_resonancia',
        name: 'Geoda de Resonancia',
        category: 'ELEMENTAL',
        rarity: 'COMUN',
        icon: '💎',
        desc: 'Al activar <strong>Cristalización</strong>, el escudo de plasma generado aumenta al <strong>35% del HP actual</strong> (en lugar del 25%).',
        lore: 'Estructura cristalina resonante que cataliza el impacto de tierra en una densa barrera fotónica.'
    },
    'sifon_biotelurico': {
        id: 'sifon_biotelurico',
        name: 'Sifón Biotelúrico',
        category: 'ELEMENTAL',
        rarity: 'EPICO',
        icon: '🌿',
        desc: 'La reacción <strong>Erosión</strong> drena y cura el <strong>50% del daño infligido</strong> en HP al robot atacante (en lugar del 30%).',
        lore: 'Bomba osmótica que transmuta la energía cinética del impacto mineral en micro-reparaciones inmediatas.'
    },
    'turbina_torbellino': {
        id: 'turbina_torbellino',
        name: 'Turbina Torbellino',
        category: 'ELEMENTAL',
        rarity: 'RARO',
        icon: '🌪️',
        desc: 'La <strong>Tormenta de Arena</strong> aplica Ceguera durante <strong>2 turnos</strong> (en lugar de 1) y reduce la Velocidad (SPD) del rival en <strong>-3</strong>.',
        lore: 'Turboventilador de alta frecuencia que prolonga vórtices de partículas abrasivas en la arena de combate.'
    },
    'inyector_nanomarcas': {
        id: 'inyector_nanomarcas',
        name: 'Inyector de Nanomarcas',
        category: 'ELEMENTAL',
        rarity: 'EPICO',
        icon: '💉',
        desc: 'Al inicio de cada combate, inyecta una <strong>Marca Elemental aleatoria</strong> (3 turnos) a todos los enemigos desplegados.',
        lore: 'Micro-drones invisibles que marcan las firmas electromagnéticas enemigas antes del primer cruce de disparos.'
    },
    'lente_refraccion': {
        id: 'lente_refraccion',
        name: 'Lente de Refracción',
        category: 'ELEMENTAL',
        rarity: 'COMUN',
        icon: '🔮',
        desc: 'Todas las <strong>Reacciones y Combinaciones Elementales</strong> infligen un <strong>+20% de daño adicional</strong>.',
        lore: 'Lente focalizadora que amplifica exponencialmente las ondas de choque en colisiones elementales.'
    },
    'ignicion_perpetua': {
        id: 'ignicion_perpetua',
        name: 'Ignición Perpetua',
        category: 'ELEMENTAL',
        rarity: 'EPICO',
        icon: '🕯️',
        desc: 'Si un enemigo muere teniendo <strong>Quemadura</strong> activa, transfiere su Quemadura con <strong>3 turnos completos</strong> a otro enemigo vivo.',
        lore: 'Fórmula incendiaria auto-replicante que salta de un chasis destruido al siguiente hostil.'
    },

    // ==========================================
    // 2. ARMAS Y MAESTRÍAS (8)
    // ==========================================
    'giroscopio_frecuencia': {
        id: 'giroscopio_frecuencia',
        name: 'Giroscopio de Frecuencia',
        category: 'WEAPONS',
        rarity: 'COMUN',
        icon: '🌀',
        desc: 'Los aliados que porten <strong>Daga</strong> obtienen <strong>+15% de probabilidad adicional</strong> de ejecutar un doble ataque consecutivo.',
        lore: 'Micro-giroscopio de aleación ligera que equilibra el filo para una cadencia de estocadas vertiginosa.'
    },
    'afilador_neutrones': {
        id: 'afilador_neutrones',
        name: 'Afilador de Neutrones',
        category: 'WEAPONS',
        rarity: 'RARO',
        icon: '✨',
        desc: 'El bufo de <strong>Racha de Espada</strong> (tras asestar un crítico) otorga <strong>+25% de ATQ</strong> (en lugar del +10%).',
        lore: 'Haz de neutrones continuos que pule el filo térmico de la espada a nivel atómico.'
    },
    'valvula_hidraulica': {
        id: 'valvula_hidraulica',
        name: 'Válvula Hidráulica de Asalto',
        category: 'WEAPONS',
        rarity: 'RARO',
        icon: '🪓',
        desc: 'El efecto <strong>Verdugo del Hacha</strong> se activa contra rivales con <strong>≤50% HP</strong> (en lugar de ≤40%) y su bonificación de daño aumenta en <strong>+15%</strong>.',
        lore: 'Pistones de compresión que liberan toda la fuerza de impacto cuando el objetivo muestra debilidad estructural.'
    },
    'nucleo_canalizador': {
        id: 'nucleo_canalizador',
        name: 'Núcleo Canalizador',
        category: 'WEAPONS',
        rarity: 'EPICO',
        icon: '🪄',
        desc: 'Los escudos y curaciones de <strong>Báculos</strong> son un <strong>50% más potentes</strong> y <strong>purgan 1 debuff</strong> del aliado beneficiado.',
        lore: 'Canalizador cuántico que filtra frecuencias corruptas y estabiliza el plasma defensivo de los báculos.'
    },
    'chip_punteria_laser': {
        id: 'chip_punteria_laser',
        name: 'Chip de Puntería Láser',
        category: 'WEAPONS',
        rarity: 'COMUN',
        icon: '🎯',
        desc: 'Todo el escuadrón gana <strong>+15% de Precisión (ACC)</strong> fija y sus impactos <strong>nunca fallan</strong> contra enemigos bajo estados alterados o marcas.',
        lore: 'Sensor óptico infrarrojo con telemetría de bloqueo continuo sobre objetivos alterados.'
    },
    'modulo_critico_mk2': {
        id: 'modulo_critico_mk2',
        name: 'Módulo Crítico MK-II',
        category: 'WEAPONS',
        rarity: 'RARO',
        icon: '💥',
        desc: 'Otorga <strong>+10% de Probabilidad Crítica</strong> a todo el escuadrón y aumenta el multiplicador de Daño Crítico a <strong>1.75x</strong> (o +25% al multiplicador actual).',
        lore: 'Algoritmo de cálculo balístico que localiza las junturas débiles de los chasis enemigos.'
    },
    'guantelete_plasma_dual': {
        id: 'guantelete_plasma_dual',
        name: 'Guantelete de Plasma Dual',
        category: 'WEAPONS',
        rarity: 'EPICO',
        icon: '🥊',
        desc: 'Cualquier aliado que <strong>no porte Daga</strong> tiene un <strong>25% de probabilidad</strong> de asestar un segundo impacto básico consecutivo al 50% de daño.',
        lore: 'Guantelete servo-asistido que descarga una segunda ráfaga de plasma antes de retraer el brazo.'
    },
    'reciclador_energia': {
        id: 'reciclador_energia',
        name: 'Reciclador de Energía',
        category: 'WEAPONS',
        rarity: 'COMUN',
        icon: '♻️',
        desc: 'Usar una <strong>Habilidad Especial</strong> justo en el turno siguiente a un ataque básico otorga <strong>+15% de daño</strong> a dicha habilidad.',
        lore: 'Batería auxiliar que almacena la inercia cinética del ataque básico para sobrecargar la habilidad táctica.'
    },

    // ==========================================
    // 3. SUPERVIVENCIA, BLINDAJE Y ESCUDOS (8)
    // ==========================================
    'blindaje_nanografeno': {
        id: 'blindaje_nanografeno',
        name: 'Blindaje de Nanografeno',
        category: 'SURVIVAL',
        rarity: 'RARO',
        icon: '🛡️',
        desc: 'Al iniciar cada combate, todos los aliados despliegan un <strong>Escudo de plasma</strong> equivalente al <strong>15% de su HP Máximo</strong> por 2 turnos.',
        lore: 'Capas de nanografeno auto-ensamblables que amortiguan la primera andanada de hostilidades.'
    },
    'deflector_reflectante': {
        id: 'deflector_reflectante',
        name: 'Deflector Reflectante',
        category: 'SURVIVAL',
        rarity: 'COMUN',
        icon: '🪞',
        desc: 'Al usar la acción <strong>Defender</strong>, el aliado <strong>refleja el 40% del daño recibido</strong> de vuelta al atacante.',
        lore: 'Espejo electromagnético que repele los proyectiles hacia su punto de origen mientras se mantiene la guardia.'
    },
    'manto_espinas_reactivas': {
        id: 'manto_espinas_reactivas',
        name: 'Manto de Espinas Reactivas',
        category: 'SURVIVAL',
        rarity: 'RARO',
        icon: '🌵',
        desc: 'La <strong>Coraza de Espinas</strong> dura <strong>1 turno adicional</strong> y refleja el <strong>70% del daño recibido</strong> (en lugar del 50%).',
        lore: 'Espinas de tungsteno imantadas que devuelven el impacto con letalidad reforzada.'
    },
    'celula_regenerativa': {
        id: 'celula_regenerativa',
        name: 'Célula Regenerativa',
        category: 'SURVIVAL',
        rarity: 'RARO',
        icon: '🔋',
        desc: '<strong>1 vez por combate</strong>: En el primer turno de acción de cada robot aliado, este repara y recupera un <strong>4% de su HP Máximo</strong>.',
        lore: 'Célula electroquímica de reserva que se auto-descarga en el arranque de sistemas para sellar fugas.'
    },
    'protocolo_fenix': {
        id: 'protocolo_fenix',
        name: 'Protocolo Fénix',
        category: 'SURVIVAL',
        rarity: 'LEGENDARIO',
        icon: '🦅',
        desc: '<strong>1 sola vez por incursión</strong>: Si un aliado recibe daño letal, sobrevive con <strong>1 HP</strong> y despliega <strong>Barrera de Plasma</strong> por 1 turno.',
        lore: 'Protocolo cibernético de emergencia militar que niega la desactivación total mediante un pulso de reinicio crítico.'
    },
    'aislante_electrostatico': {
        id: 'aislante_electrostatico',
        name: 'Aislante Electroestático',
        category: 'SURVIVAL',
        rarity: 'COMUN',
        icon: '🔌',
        desc: 'Todo el escuadrón es <strong>totalmente inmune al Aturdimiento (STUN)</strong> y a la Ralentización extrema.',
        lore: 'Conexión a tierra con bobinas superconductoras que anulan descargas y parálisis en los servomotores.'
    },
    'disipador_criogenico': {
        id: 'disipador_criogenico',
        name: 'Disipador Criogénico',
        category: 'SURVIVAL',
        rarity: 'COMUN',
        icon: '❄️',
        desc: 'El daño recibido por <strong>Quemaduras</strong> o efectos residuales por turno se reduce en un <strong>50%</strong> en todos los aliados.',
        lore: 'Tuberías de nitrógeno líquido que enfrían inmediatamente el fuselaje ante aumentos críticos de temperatura.'
    },
    'condensador_rocio': {
        id: 'condensador_rocio',
        name: 'Condensador de Rocío',
        category: 'SURVIVAL',
        rarity: 'RARO',
        icon: '💧',
        desc: 'Cuando un aliado protegido por <strong>Rocío Protector</strong> es atacado, además de salpicar Marca de Agua, aplica <strong>Ceguera</strong> (-50% PREC) al atacante por 1 turno.',
        lore: 'Vaporizador hidrostático que dispara niebla densa a los sensores del agresor al recibir un impacto.'
    },

    // ==========================================
    // 4. VELOCIDAD, INICIATIVA Y TURNOS (3)
    // ==========================================
    'propulsor_iones': {
        id: 'propulsor_iones',
        name: 'Propulsor de Iones',
        category: 'SPEED',
        rarity: 'COMUN',
        icon: '🚀',
        desc: 'Todo el escuadrón gana <strong>+2 de Velocidad (SPD)</strong> permanente, mejorando su posición en la cola de iniciativa.',
        lore: 'Micro-toberas de propulsión iónica instaladas en los chasis para una respuesta táctica inmediata.'
    },
    'impulsor_asalto': {
        id: 'impulsor_asalto',
        name: 'Impulsor de Asalto',
        category: 'SPEED',
        rarity: 'EPICO',
        icon: '⚡',
        desc: 'En la <strong>Ronda 1</strong> de cada combate, el aliado más veloz realiza <strong>dos turnos consecutivos</strong> antes de que actúen los enemigos.',
        lore: 'Inyector de sobrevoltaje que duplica los ciclos de procesamiento del combatiente líder al desplegarse.'
    },
    'cronometro_sobredrive': {
        id: 'cronometro_sobredrive',
        name: 'Cronómetro de Sobredrive',
        category: 'SPEED',
        rarity: 'LEGENDARIO',
        icon: '⏱️',
        desc: 'Cuando un aliado <strong>elimina a un enemigo</strong>, obtiene inmediatamente un <strong>turno adicional instantáneo</strong> (máx. 1 vez por ronda).',
        lore: 'Reloj cuántico que comprime el flujo temporal al detectar una firma hostil neutralizada.'
    },

    // ==========================================
    // 5. ECONOMÍA, EXPLORACIÓN Y TALLER (3)
    // ==========================================
    'iman_chatarra': {
        id: 'iman_chatarra',
        name: 'Imán de Chatarra',
        category: 'ECONOMY',
        rarity: 'COMUN',
        icon: '🧲',
        desc: 'Aumenta toda la <strong>Chatarra ⚙️</strong> obtenida en combates y eventos en un <strong>+35%</strong>.',
        lore: 'Electroimán de alto alcance que recolecta aleaciones valiosas de los escombros de combate.'
    },
    'tarjeta_acceso_vip': {
        id: 'tarjeta_acceso_vip',
        name: 'Tarjeta de Acceso VIP',
        category: 'ECONOMY',
        rarity: 'RARO',
        icon: '💳',
        desc: 'Reduce todos los precios en la <strong>Tienda de Mercaderes</strong> en un <strong>25% adicional</strong>.',
        lore: 'Credencial corporativa codificada que desbloquea tarifas preferenciales en terminales comerciales.'
    },
    'kit_forja_avanzada': {
        id: 'kit_forja_avanzada',
        name: 'Kit de Forja Avanzada',
        category: 'ECONOMY',
        rarity: 'EPICO',
        icon: '🧰',
        desc: 'Los <strong>Campamentos Tácticos</strong> permiten realizar <strong>2 operaciones de mantenimiento</strong> en lugar de solo 1.',
        lore: 'Conjunto de herramientas neumáticas modulares que duplican la eficiencia de los talleres de campo.'
    },

    // ==========================================
    // 6. RELIQUIAS CORRUPTAS (2)
    // ==========================================
    'nucleo_hipercaliente': {
        id: 'nucleo_hipercaliente',
        name: 'Núcleo Hipercaliente',
        category: 'CORRUPTED',
        rarity: 'CORRUPTA',
        icon: '☣️',
        desc: '<strong>+35% de Daño</strong> para todo el escuadrón en todas sus acciones. A cambio, cada aliado <strong>pierde el 3% de su HP actual</strong> al inicio de su turno.',
        lore: 'Núcleo inestable que irradia un poder devastador a costa de la integridad estructural de sus portadores.'
    },
    'pacto_desguazador': {
        id: 'pacto_desguazador',
        name: 'Pacto del Desguazador',
        category: 'CORRUPTED',
        rarity: 'CORRUPTA',
        icon: '💀',
        desc: '<strong>+100% de Chatarra ⚙️</strong> (duplica ganancias) y la Forja de armas en Campamentos es <strong>gratis</strong>. Sin embargo, los Campamentos <strong>no pueden reparar ni curar HP</strong>.',
        lore: 'Un acuerdo clandestino con chatarreros de la periferia: recursos ilimitados a cambio de prescindir de protocolos médicos.'
    }
};

function getRelicData(relicId) {
    return RELICS_DATA[relicId] || null;
}

function getAllRelicsArray() {
    return Object.values(RELICS_DATA);
}

function getRandomRelicPool(count = 3, excludeIds = [], allowedRarities = null) {
    let pool = Object.values(RELICS_DATA).filter(r => !excludeIds.includes(r.id));
    if (allowedRarities && Array.isArray(allowedRarities) && allowedRarities.length > 0) {
        pool = pool.filter(r => allowedRarities.includes(r.rarity));
    }
    const shuffled = pool.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function getRandomWeightedRelic(excludeIds = [], weights = { COMUN: 0.70, RARO: 0.20, EPICO: 0.10 }) {
    const unowned = Object.values(RELICS_DATA).filter(r => !excludeIds.includes(r.id));
    if (unowned.length === 0) return null;

    let roll = Math.random();
    let targetRarity = 'COMUN';
    let cumulative = 0;
    
    for (const [rarity, weight] of Object.entries(weights)) {
        cumulative += weight;
        if (roll <= cumulative) {
            targetRarity = rarity;
            break;
        }
    }
    
    let candidates = unowned.filter(r => r.rarity === targetRarity);
    if (candidates.length === 0) {
        const allowedRarities = Object.keys(weights);
        candidates = unowned.filter(r => allowedRarities.includes(r.rarity));
        if (candidates.length === 0) {
            candidates = unowned;
        }
    }
    
    return candidates[Math.floor(Math.random() * candidates.length)] || null;
}

