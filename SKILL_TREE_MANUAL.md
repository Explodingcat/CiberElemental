# 🌳 CYBER-ELEMENTAL // MANUAL DEL ÁRBOL DE HABILIDADES Y META-PROGRESIÓN

Este documento contiene la especificación completa, descripción, costos, dependencias, mecánicas numéricas y sinergias estratégicas del **Árbol de Habilidades Pasivas (50 nodos)** y el **Sistema de Chatarra Global** de **Cyber-Elemental**.

---

## ⚙️ 1. Sistema de Meta-Progresión: Chatarra Global vs Chatarra de la Run

En Cyber-Elemental la economía se divide en dos capas complementarias:

```
┌──────────────────────────────────────────────────────────┐
│                   INCURSIÓN / RUN                        │
│  - Chatarra de la Run (GAME_STATE.scrap)                 │
│  - Se obtiene en combates y eventos                      │
│  - Se gasta en Tiendas de Mercado                        │
└────────────────────────────┬─────────────────────────────┘
                             │  (Fin de Run: Victoria o Derrota)
                             ▼  100% de la Chatarra sobrante se transfiere
┌──────────────────────────────────────────────────────────┐
│                POZO GLOBAL DE LA CUENTA                  │
│  - Chatarra Global (player_profiles.global_scrap)        │
│  - Acumulativa y permanente (¡nunca se pierde!)         │
│  - Se usa en el Menú Principal para comprar Pasivas      │
└──────────────────────────────────────────────────────────┘
```

1. **Chatarra de la Run (`GAME_STATE.scrap`):** Se reúne durante el ascenso por los 10 pisos de la torre y se usa para comprar suministros, chips y armas en las tiendas de mercado (`NODE_TYPES.SHOP`).
2. **Chatarra Global de la Cuenta (`global_scrap`):** Al finalizar la incursión (ya sea que todo el escuadrón caiga o se destruya al jefe final TITAN-X), **el 100% de la chatarra remanente se deposita en el pozo global**.
3. **Persistencia Híbrida:** 
   - **Usuarios Autenticados:** Sincronizado en la nube con Supabase mediante la tabla `public.player_profiles`.
   - **Modo Invitado:** Sincronizado localmente en `localStorage`. Al iniciar sesión con una cuenta de correo, el progreso se migra y unifica automáticamente.
4. **Acceso Exclusivo en Menú Principal:** La interfaz táctica del Árbol de Habilidades se encuentra en la pantalla de inicio para configurar mejoras antes de iniciar una nueva incursión.

---

## 📊 2. Estructura de Tiers y Progresión de Costes

El árbol consta de **50 habilidades pasivas** divididas en 4 Tiers de desarrollo tecnológico:

| Tier | Rango de Coste | Requisitos Generales | Propósito Estratégico |
| :---: | :---: | :---: | :--- |
| **Tier 1** | **400 – 500 ⚙️** | Sin pre-requisitos | Mejoras base fundamentales de escuadrón y economía temprana. |
| **Tier 2** | **800 – 1200 ⚙️** | Requiere nodo previo Tier 1 | Especialización táctica, amplificación crítica y combos intermedios. |
| **Tier 3** | **1300 – 1800 ⚙️** | Requiere nodo previo Tier 2 | Maestrías de armamento, supervivencia avanzada y hacks de élite. |
| **Tier 4** | **2000 – 2200 ⚙️** | Requiere nodo previo Tier 3 | Pasivas maestras definitivas (*Capstone Abilities*) de máximo impacto. |

* **Coste Total para Desbloquear el Árbol Completo:** **58.100 ⚙️ de Chatarra Global**.

---

## ⚔️ 3. Rama 1: PROTOCOLO ASALTO (13 Pasivas)

Enfocada en maximizar la potencia ofensiva, daño crítico, precisión de impacto y maestrías de armas ofensivas (**Daga, Hacha y Espada**).

| ID | Nombre | Tier | Coste ⚙️ | Pre-requisito | Descripción en Juego | Modificador Interno | Sinergia Estratégica |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- | :--- |
| `atk_up_1` | **Calibración de Potencia I** | 1 | **400** | Ninguno | Aumenta el ATQ de todos los aliados en un +5%. | `atk_pct: 0.05` | Incrementa daño base de básicos y especiales. |
| `atk_up_2` | **Calibración de Potencia II** | 2 | **800** | `atk_up_1` | Aumenta el ATQ de todos los aliados en un +10% adicional. | `atk_pct: 0.10` | Acumulativo (+15% total). |
| `atk_up_3` | **Calibración de Potencia III** | 3 | **1500** | `atk_up_2` | Aumenta el ATQ de todos los aliados en un +15% adicional. | `atk_pct: 0.15` | Acumulativo (+30% total de ATQ). |
| `crit_rate_1` | **Sensores Ópticos I** | 1 | **500** | Ninguno | +3% de Probabilidad de Impacto Crítico para todo el escuadrón. | `crit_rate: 3` | Afecta los ataques básicos de todos los robots. |
| `crit_rate_2` | **Sensores Ópticos II** | 2 | **900** | `crit_rate_1` | +5% de Probabilidad de Impacto Crítico adicional para todo el escuadrón. | `crit_rate: 5` | Acumulativo (+8% crítico base extra). |
| `crit_rate_3` | **Sensores Ópticos III** | 3 | **1600** | `crit_rate_2` | +7% de Probabilidad de Impacto Crítico adicional para todo el escuadrón. | `crit_rate: 7` | Acumulativo (+15% crítico base extra). |
| `crit_dmg_1` | **Sobrecarga Crítica I** | 2 | **1000** | `crit_rate_1` | Los golpes críticos infligen un +15% de daño extra (Total 1.65x). | `crit_dmg_pct: 0.15` | Potencia golpes críticos a 165% de daño. |
| `crit_dmg_2` | **Sobrecarga Crítica II** | 3 | **1800** | `crit_dmg_1` | Los golpes críticos infligen un +25% de daño extra adicional (Total 1.90x). | `crit_dmg_pct: 0.25` | Críticos masivos de hasta casi el doble de daño (190%). |
| `acc_up_1` | **Algoritmo de Puntería I** | 1 | **400** | Ninguno | +5% de Precisión en todos los ataques del escuadrón. | `acc: 5` | Reduce fallos contra enemigos de alta evasión como Zephyr. |
| `acc_up_2` | **Algoritmo de Puntería II** | 2 | **800** | `acc_up_1` | +10% de Precisión adicional en todos los ataques del escuadrón. | `acc: 10` | Precisión casi infalible (+15% total). |
| `dagger_mastery` | **Dagas de Frecuencia** | 3 | **1400** | `atk_up_2` | +10% de probabilidad de ataque doble al portar Dagas. | `dagger_double_chance: 0.10` | Sube la prob. de doble ataque de Daga al 35% (o 50% con +1). |
| `axe_mastery` | **Hachas de Plasma** | 3 | **1400** | `atk_up_2` | Las Hachas perforan un +15% de defensas y barreras enemigas adicional. | `axe_penetration: 0.15` | Perfora 65% de barreras/defensa (o 90% con +1). |
| `sword_mastery` | **Filos Energizados** | 4 | **2200** | `atk_up_3` | Las Espadas otorgan un +10% de daño base y +5% de crítico adicional. | `sword_bonus_dmg: 0.10`, `sword_bonus_crit: 5` | Convierte a las Espadas en el arma de daño puro más letal. |

---

## 🛡️ 4. Rama 2: BLINDAJE ESTRUCTURAL (13 Pasivas)

Enfocada en supervivencia del escuadrón, mitigación de daño recibido, evasión, potenciación de báculos, nanobots y resistencia a efectos de estado alterado.

| ID | Nombre | Tier | Coste ⚙️ | Pre-requisito | Descripción en Juego | Modificador Interno | Sinergia Estratégica |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- | :--- |
| `hp_up_1` | **Aleación Reforzada I** | 1 | **400** | Ninguno | Aumenta el HP Máximo de todos los aliados en un +10%. | `hp_pct: 0.10` | Mayor margen de resistencia ante golpes de élite. |
| `hp_up_2` | **Aleación Reforzada II** | 2 | **800** | `hp_up_1` | Aumenta el HP Máximo de todos los aliados en un +15% adicional. | `hp_pct: 0.15` | Acumulativo (+25% HP Máx total). |
| `hp_up_3` | **Aleación Reforzada III** | 3 | **1500** | `hp_up_2` | Aumenta el HP Máximo de todos los aliados en un +20% adicional. | `hp_pct: 0.20` | Acumulativo (+45% HP Máx total). |
| `dodge_up_1` | **Propulsores de Evasión I** | 1 | **500** | Ninguno | +3% de Probabilidad de Esquiva para todo el escuadrón. | `dodge: 3` | Oportunidad de anular ataques enemigos por completo. |
| `dodge_up_2` | **Propulsores de Evasión II** | 2 | **900** | `dodge_up_1` | +5% de Probabilidad de Esquiva adicional para todo el escuadrón. | `dodge: 5` | Acumulativo (+8% esquiva total). |
| `dodge_up_3` | **Propulsores de Evasión III** | 3 | **1600** | `dodge_up_2` | +7% de Probabilidad de Esquiva adicional para todo el escuadrón. | `dodge: 7` | Acumulativo (+15% esquiva total, letal en Zephyr). |
| `barrier_boost` | **Blindaje de Plasma** | 2 | **1100** | `hp_up_1` | Las Barreras protectoras duran +1 turno adicional antes de disiparse. | `barrier_extra_duration: 1` | Las barreras de Aqua duran 3 turnos. |
| `staff_mastery` | **Báculos de Regeneración** | 3 | **1300** | `hp_up_2` | Los Báculos regeneran un +2% extra del HP Máximo al final del turno. | `staff_extra_heal: 0.02` | Cura pasiva de 5% (o 7% en +1) cada turno. |
| `defend_boost` | **Modo Fortaleza** | 2 | **900** | `hp_up_1` | La acción de Defender reduce el daño recibido un 10% adicional (60% total). | `defend_bonus_reduction: 0.10` | Pasar de 50% a 60% de reducción ante ataques de jefes. |
| `first_aid_core` | **Nanobots de Emergencia** | 3 | **1500** | `hp_up_2` | Todas las curaciones recibidas por el escuadrón aumentan un +25%. | `healing_received_pct: 0.25` | Potencia kits, talleres y báculos. |
| `revive_resilience` | **Protocolo Lázaro** | 3 | **1400** | `hp_up_2` | Al revivir en el campamento, las unidades recuperan 25% HP en vez de 10%. | `revive_hp_pct: 0.25` | Reanimaciones seguras para el escuadrón caído. |
| `burn_resist` | **Disipadores Térmicos** | 2 | **900** | `hp_up_1` | Reduce el daño recibido por Quemadura en un 30%. | `burn_damage_reduction: 0.30` | Mitiga el daño porcentual por fuego. |
| `stun_resist` | **Firmeza Giroscópica** | 4 | **2000** | `hp_up_3` | 25% de probabilidad de ignorar por completo los aturdimientos enemigos. | `stun_resist_chance: 0.25` | Previene la pérdida de turnos de acción en combate. |

---

## ⚡ 5. Rama 3: SINTONÍA ELEMENTAL (12 Pasivas)

Enfocada en amplificar el daño por elementos individuales (**Fuego 🔥, Agua 💧, Tierra 🪨, Aire 💨**), potenciar las **Reacciones en Cadena / Combos**, bonificaciones de afinidad de armas y ventajas de despliegue inicial.

| ID | Nombre | Tier | Coste ⚙️ | Pre-requisito | Descripción en Juego | Modificador Interno | Sinergia Estratégica |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- | :--- |
| `elem_fire_up` | **Condensadores Ígneos** | 1 | **500** | Ninguno | +15% de daño infligido con habilidades y ataques de FUEGO. | `elem_boost_FUEGO: 0.15` | Potencia a Ignis y chips de Fuego. |
| `elem_water_up` | **Bombas Hidráulicas** | 1 | **500** | Ninguno | +15% de daño infligido con habilidades y ataques de AGUA. | `elem_boost_AGUA: 0.15` | Potencia a Aqua y chips de Agua. |
| `elem_earth_up` | **Martillos Sísmicos** | 1 | **500** | Ninguno | +15% de daño infligido con habilidades y ataques de TIERRA. | `elem_boost_TIERRA: 0.15` | Potencia a Terra y chips de Tierra. |
| `elem_air_up` | **Turbinas Eólicas** | 1 | **500** | Ninguno | +15% de daño infligido con habilidades y ataques de AIRE. | `elem_boost_AIRE: 0.15` | Potencia a Zephyr y chips de Aire. |
| `combo_damage_up` | **Resonancia Reaccionaria** | 2 | **1200** | `elem_fire_up` | Las Reacciones Elementales y Combos infligen un +20% de daño adicional. | `combo_damage_pct: 0.20` | Multiplica vaporizaciones, choques y explosiones. |
| `burn_duration_up`| **Napalm Sintético** | 2 | **1000** | `elem_fire_up` | Las Quemaduras aplicadas por el escuadrón duran +1 turno extra. | `burn_duration_extra: 1` | Las quemaduras duran 3 turnos (24% HP total). |
| `affinity_mastery_1`| **Sintonía de Chasis I** | 2 | **1100** | `elem_earth_up` | El bono de Afinidad de Arma otorga +5% extra de HP y ATQ (+25% total). | `affinity_bonus_extra: 0.05` | Recompensa emparejar arma y elemento del robot. |
| `affinity_mastery_2`| **Sintonía de Chasis II** | 3 | **1700** | `affinity_mastery_1` | El bono de Afinidad de Arma otorga un +10% adicional (+35% total). | `affinity_bonus_extra: 0.10` | Bono masivo de +35% HP y +35% ATQ por afinidad. |
| `mark_damage_up` | **Neuro-Marcadores** | 3 | **1600** | `combo_damage_up` | +10% de daño infligido contra objetivos que tengan una Marca activa. | `marked_target_damage: 0.10` | Beneficia composiciones de sinergia continua. |
| `starter_fire_buff`| **Núcleo Volcánico** | 3 | **1500** | `elem_fire_up` | Las unidades de Fuego inician cada combate con un +10% de ATQ adicional. | `fire_starter_atk_pct: 0.10` | Ráfagas devastadoras desde la primera ronda. |
| `starter_water_buff`| **Batería Térmica** | 3 | **1500** | `elem_water_up` | Las unidades de Agua inician cada combate con una Barrera protectora activa. | `water_starter_barrier: true` | Inicia combates completamente protegido contra el 1er golpe. |
| `starter_earth_buff`| **Blindaje Tectónico** | 4 | **2200** | `affinity_mastery_2` | Las unidades de Tierra ganan un +20% de HP Máximo permanente adicional. | `earth_bonus_hp_pct: 0.20` | Convierte a Terra en un titán defensivo indestructible. |

---

## 🛠️ 6. Rama 4: LOGÍSTICA Y TÁCTICA (12 Pasivas)

Enfocada en la economía de la run (**reserva inicial de chatarra, multiplicadores de chatarra en victoria**), descuentos comerciales en tiendas, aceleración de XP, probabilidad de hackeo al reclutar robots Élite y mejoras de campamento/reciclaje.

| ID | Nombre | Tier | Coste ⚙️ | Pre-requisito | Descripción en Juego | Modificador Interno | Sinergia Estratégica |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- | :--- |
| `start_scrap_1` | **Reserva de Chatarra I** | 1 | **400** | Ninguno | Inicias cada incursión con +30 de Chatarra disponible. | `start_scrap: 30` | Permite compras inmediatas en tiendas tempranas. |
| `start_scrap_2` | **Reserva de Chatarra II** | 2 | **900** | `start_scrap_1` | Inicias cada incursión con +60 de Chatarra disponible adicional (+90 total). | `start_scrap: 60` | Fondo acumulativo inicial de 90 ⚙️. |
| `start_scrap_3` | **Reserva de Chatarra III** | 3 | **1600** | `start_scrap_2` | Inicias cada incursión con +100 de Chatarra disponible adicional (+190 total). | `start_scrap: 100` | Fondo acumulativo inicial de 190 ⚙️. |
| `scrap_gain_1` | **Imanes de Chatarrero I** | 1 | **500** | Ninguno | +15% de Chatarra recolectada en todas las victorias de combate. | `scrap_gain_pct: 0.15` | Acelera la economía de la run y el pozo global. |
| `scrap_gain_2` | **Imanes de Chatarrero II** | 2 | **1000** | `scrap_gain_1` | +25% de Chatarra recolectada en victorias de combate adicional (+40% total). | `scrap_gain_pct: 0.25` | Bono masivo de +40% de chatarra por batalla. |
| `shop_discount_1` | **Negociación Cibernética I** | 2 | **1000** | `start_scrap_1` | -10% de descuento en todos los artículos de las Tiendas de Mercado. | `shop_discount_pct: 0.10` | Facilita comprar chips y armas raras. |
| `shop_discount_2` | **Negociación Cibernética II** | 3 | **1700** | `shop_discount_1` | -20% de descuento en Tiendas de Mercado adicional (-30% total). | `shop_discount_pct: 0.20` | Precios rebajados hasta un 30% permanente. |
| `xp_boost_1` | **Chips de Aprendizaje I** | 1 | **500** | Ninguno | +15% de Experiencia (XP) ganada por todo el escuadrón en combates. | `xp_gain_pct: 0.15` | Subidas de nivel más rápidas por piso. |
| `xp_boost_2` | **Chips de Aprendizaje II** | 2 | **1100** | `xp_boost_1` | +25% de XP ganada adicional para todo el escuadrón (+40% total). | `xp_gain_pct: 0.25` | Aceleración de +40% de XP acumulada. |
| `elite_recruit_up`| **Algoritmo de Hackeo** | 3 | **1800** | `xp_boost_2` | La probabilidad de reclutar robots Élite exitosamente sube de 50% a 75%. | `elite_recruit_chance: 0.75` | Reduce el riesgo de explosión al 25%. |
| `repair_efficiency`| **Kits Optimizados** | 3 | **1500** | `shop_discount_1` | El Taller de Reparación repara un 40% de HP a todos los aliados (en vez de 30%). | `repair_shop_heal_pct: 0.40` | Mayor sostenimiento en campamentos. |
| `dismantle_bonus` | **Reciclaje Estructural** | 4 | **2200** | `scrap_gain_2` | Desmantelar robots derrotados otorga +50 Chatarra fija y +15% de curación. | `dismantle_scrap_bonus: 20`, `dismantle_heal_pct: 0.15` | Mayor recompensa que desmantelamiento estándar (+30 / 10%). |

---

## 💻 7. Arquitectura Técnica y Sincronización

### A. Tabla `public.player_profiles` (Supabase / PostgreSQL)
```sql
CREATE TABLE IF NOT EXISTS public.player_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    global_scrap INT NOT NULL DEFAULT 0,
    unlocked_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.player_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own profile"
    ON public.player_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
    ON public.player_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON public.player_profiles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```

### B. Módulos JavaScript del Sistema
1. **`js/skillsData.js`:** Contiene el catálogo de las 50 pasivas, ramas y metadatos.
2. **`js/skillsManager.js`:** 
   - Controla el saldo de chatarra global y el Set de habilidades desbloqueadas.
   - Proporciona getters de modificadores numéricos (`getAtkMultiplier()`, `getCritDmgMultiplier()`, `getStartingScrap()`, etc.).
   - Renderiza el modal interactivo con selección de ramas, validación de pre-requisitos y estados visuales (🔒 Bloqueada, 💡 Disponible, ✅ Desbloqueada).
3. **`js/Robot.js`:** Consulta dinámicamente a `SkillsManager` en `recalculateStats()`, `takeDamage()`, `heal()` y `updateStatuses()`.
4. **`js/combatSystem.js`:** Consulta multiplicadores de daño crítico, combos, penetración de armas y buffs iniciales.
5. **`js/postBattle.js`:** Aplica multiplicadores de XP, chatarra obtenida, hackeo de élites y desmantelamiento.
6. **`js/eventHandler.js`:** Aplica descuentos comerciales y efectividad de campamentos.
7. **`js/authManager.js`:** Sincroniza la meta-progresión al autenticar usuarios y añade la chatarra al finalizar runs.
