# 📊 Tabla de Probabilidades y Tasas de Aparición (Cofres, Mercado Negro, Eventos y Dropeo de Enemigos)

Guía técnica detallada sobre las probabilidades matemáticas, tiradas de generación, catálogo de objetos, eventos aleatorios, fórmulas de precios y **tasas de dropeo de enemigos** en **CiberElemental**.

---

## 👾 1. Tasas de Dropeo y Recompensas Post-Combate

Al neutralizar a un robot enemigo en nodos de combate normal, élite o jefe, el sistema calcula automáticamente las recompensas de botín, experiencia, chatarra y opciones tácticas.

```
                         [⚔️ ENEMIGO NEUTRALIZADO]
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
         ▼                           ▼                           ▼
  [👾 ENEMIGO NORMAL]         [💀 ENEMIGO ÉLITE]         [👑 JEFE TITAN-X]
  • Chatarra: 10-19 ⚙️         • Chatarra: 20-38 ⚙️ (x2)   • Chatarra: 20-38 ⚙️ (x2)
  • XP: Nivel x 50            • XP: Nivel x 50            • XP: 500 XP
  • Arma: 1.00%               • Botín 1 (50% Arma+1 /     • Botín 1 (50% Arma+1 /
  • Consumible: 30.00%           50% Chip): 100%             50% Chip): 100%
                              • Botín 2 (Consumible):     • Botín 2 (Consumible):
                                 100% Garantizado            100% Garantizado
```

### 📋 Tabla Comparativa de Dropeo por Tipo de Enemigo

| Tipo de Encuentro | Chatarra Base | XP Base Grupal | Dropeo de Arma | Dropeo de Chip | Dropeo de Consumible | Reclutamiento |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| 👾 **Combate Normal** | $10 - 19$ ⚙️ | $\text{Nivel} \times 50$ | **1.00%** *(Base)* | 0.00% | **30.00%** | **100% Éxito** *(50% HP)* |
| 💀 **Combate Élite** | $20 - 38$ ⚙️ *(x2)* | $(\text{Piso}+2) \times 50$ | **50.00%** *(Forjada +1)* | **50.00%** | **100.00%** *(Garantizado)* | **50% Éxito / 50% 💥** |
| 👑 **Jefe TITAN-X (Piso 10)** | $20 - 38$ ⚙️ *(x2)* | $500\text{ XP}$ | **50.00%** *(Forjada +1)* | **50.00%** | **100.00%** *(Garantizado)* | — *(Victoria)* |

---

### 👾 Desglose de Dropeos en Combate Normal

1. **⚙️ Chatarra:** $\text{random}(10, 19) \text{ ⚙️}$ (afectada por talentos de *Imanes de Chatarrero*).
2. **⭐ Experiencia:** $\text{Nivel del Robot} \times 50 \text{ XP}$ para cada miembro activo.
3. **⚔️ Dropeo de Arma Rara (1.00% de probabilidad):**
   * El arma obtenida es de **nivel base** y **siempre coincide con el elemento del enemigo derrotado**:
     * 🗡️ Daga: **0.25%**
     * 🪓 Hacha: **0.25%**
     * 🪄 Báculo: **0.25%**
     * ⚔️ Espada: **0.25%**
4. **🧪 Dropeo de Consumible (30.00% de probabilidad):**
   * Selecciona 1 consumible táctico del pool:
     * 🩹 **Kit de Nanobots:** **10.00%** global.
     * 💥 **Bomba PEM:** **10.00%** global.
     * 🔋 **Núcleo de Sobrecarga:** **10.00%** global.
5. **Decisión Post-Combate:**
   * **🤖 Reclutar:** **100% de éxito garantizado** (entra con el $50\%$ de HP, hasta 3 aliados).
   * **⚙️ Desmantelar:** Otorga **+30 ⚙️ Chatarra** y **+10% Curación** a todo el equipo.

---

### 💀 Desglose de Dropeos en Combate Élite

Los robots Élite tienen **+2 niveles**, **+30% de HP Máximo** y un **Mutador Cibernético** activo (*Espinas*, *Regenerador* o *Rabia*). Al vencerlos, otorgan **botín doble garantizado**:

1. **⚙️ Doble Chatarra:** $2 \times \text{random}(10, 19) = \mathbf{20\text{ a }38\text{ ⚙️}}$.
2. **🎁 Recompensa 1: Equipo Superior (100% de probabilidad):**
   * **50.00% de probabilidad:** **Arma Mejorada (+1)** con el mismo elemento del Élite (25% Daga +1, 25% Hacha +1, 25% Báculo +1, 25% Espada +1).
   * **50.00% de probabilidad:** **Chip Elemental (💾)** (25% Fuego, 25% Agua, 25% Tierra, 25% Aire).
3. **🧪 Recompensa 2: Consumible Táctico (100% garantizado):**
   * 🩹 Kit de Nanobots: **33.33%**
   * 💥 Bomba PEM: **33.33%**
   * 🔋 Núcleo de Sobrecarga: **33.33%**
4. **⚠️ Reclutamiento Élite de Alto Riesgo:**
   * **50.00% de Éxito Base:** Reprograma al robot Élite con sus estadísticas aumentadas y su Mutador de combate.
   * **50.00% de Fallo (💥 Sobrecarga Crítica):** El núcleo del Élite detona e inflige **10% de daño de HP Máximo a todo el escuadrón** (puede causar Game Over si la salud es crítica).
   * *(La habilidad pasiva Hackeo de Núcleos en el árbol de talentos permite elevar el éxito hasta un 65%).*

---

### 🛡️ Probabilidad de Enemigos con Armas Equipadas en Combate

Los robots enemigos salvajes pueden spawnear con armas ya equipadas desde el inicio de la batalla:

| Piso de la Torre | Probabilidad en Enemigo Normal | Probabilidad en Enemigo Élite | Probabilidad en Jefe TITAN-X |
| :---: | :---: | :---: | :---: |
| **Piso 1** | **30.00%** | **100.00%** | — |
| **Piso 2** | **40.00%** | **100.00%** | — |
| **Piso 3** | **50.00%** | **100.00%** | — |
| **Piso 4** | **60.00%** | **100.00%** | — |
| **Piso 5** | *(Puro Tesoro)* | *(Puro Tesoro)* | — |
| **Piso 6** | **80.00%** | **100.00%** | — |
| **Piso 7** | **90.00%** | **100.00%** | — |
| **Pisos 8 - 10** | **100.00%** | **100.00%** | **100.00%** |

---

## 🎁 2. Nodos de Tesoro / Cofres (`NODE_TYPES.CHEST`)

Los cofres sellados de alta tecnología aparecen de forma garantizada en el **Piso 5 (Cámara del Tesoro)** y recompensan al escuadrón con equipo de alta gama sin necesidad de combatir.

```
                         [🎁 APERTURA DE COFRE]
                                   │
                 ┌─────────────────┴─────────────────┐
                 │ 50.00%                            │ 50.00%
                 ▼                                   ▼
       [⚔️ ARMA MEJORADA +1]                [💾 CHIP ELEMENTAL]
      (25% cada tipo de arma)              (25% cada elemento)
      (25% cada elemento)
```

### 🎲 Distribución General de Recompensas del Cofre

| Categoría de Recompensa | Probabilidad Base | Calidad / Estado | Descripción del Contenido |
| :--- | :---: | :---: | :--- |
| ⚔️ **Módulo de Combate (Arma)** | **50.00%** | ⭐ **Forjada +1** *(Garantizado)* | Otorga 1 arma mejorada de tipo y elemento aleatorio. |
| 💾 **Expansión Modular (Chip)** | **50.00%** | 💾 **Habilidad Especial** | Otorga 1 chip elemental para enseñar una 3ª técnica. |

---

### ⚔️ Desglose de Armas en Cofres (50% de prob. global)

Todas las armas obtenidas en cofres vienen **garantizadas con mejora +1** (valores y pasivas potenciadas).

#### 1. Tipo de Arma (Equiprobable 25%):
* 🗡️ **Daga (+1):** **25%** *(12.50% global)* ➔ *40% prob. de doble ataque consecutivo.*
* 🪓 **Hacha (+1):** **25%** *(12.50% global)* ➔ *Perfora 75% de barreras y defensas.*
* 🪄 **Báculo (+1):** **25%** *(12.50% global)* ➔ *Repara 7% HP Máx al final de cada turno.*
* ⚔️ **Espada (+1):** **25%** *(12.50% global)* ➔ *+30% Daño base pasivo y +20% Crítico en Básicos.*

#### 2. Elemento del Arma (Equiprobable 25%):
* 🔥 **Fuego:** **25%**
* 💧 **Agua:** **25%**
* 🪨 **Tierra:** **25%**
* 💨 **Aire:** **25%**

#### 📋 Tabla Completa de Probabilidades por Arma Específica en Cofre:

$$\text{Probabilidad Exacta} = 50\% \times 25\% \times 25\% = \mathbf{3.125\%} \quad (1 \text{ de cada } 32 \text{ cofres})$$

| Arma y Elemento | Icono | Nivel | Probabilidad Global | Pasiva Potenciada |
| :--- | :---: | :---: | :---: | :--- |
| **Daga de Fuego +1** | 🗡️ 🔥 | +1 | **3.125%** | 40% doble ataque |
| **Daga de Agua +1** | 🗡️ 💧 | +1 | **3.125%** | 40% doble ataque |
| **Daga de Tierra +1** | 🗡️ 🪨 | +1 | **3.125%** | 40% doble ataque |
| **Daga de Aire +1** | 🗡️ 💨 | +1 | **3.125%** | 40% doble ataque |
| **Hacha de Fuego +1** | 🪓 🔥 | +1 | **3.125%** | Perfora 75% defensas/barreras |
| **Hacha de Agua +1** | 🪓 💧 | +1 | **3.125%** | Perfora 75% defensas/barreras |
| **Hacha de Tierra +1** | 🪓 🪨 | +1 | **3.125%** | Perfora 75% defensas/barreras |
| **Hacha de Aire +1** | 🪓 💨 | +1 | **3.125%** | Perfora 75% defensas/barreras |
| **Báculo de Fuego +1** | 🪄 🔥 | +1 | **3.125%** | Cura 7% HP Máx/turno |
| **Báculo de Agua +1** | 🪄 💧 | +1 | **3.125%** | Cura 7% HP Máx/turno |
| **Báculo de Tierra +1** | 🪄 🪨 | +1 | **3.125%** | Cura 7% HP Máx/turno |
| **Báculo de Aire +1** | 🪄 💨 | +1 | **3.125%** | Cura 7% HP Máx/turno |
| **Espada de Fuego +1** | ⚔️ 🔥 | +1 | **3.125%** | +30% Daño + 20% Crítico |
| **Espada de Agua +1** | ⚔️ 💧 | +1 | **3.125%** | +30% Daño + 20% Crítico |
| **Espada de Tierra +1** | ⚔️ 🪨 | +1 | **3.125%** | +30% Daño + 20% Crítico |
| **Espada de Aire +1** | ⚔️ 💨 | +1 | **3.125%** | +30% Daño + 20% Crítico |

---

### 💾 Desglose de Chips de Habilidad en Cofres (50% de prob. global)

Los chips permiten instalar una habilidad elemental de 2.0x potencia (CD 3) en cualquier aliado.

$$\text{Probabilidad por Chip} = 50\% \times 25\% = \mathbf{12.50\%} \quad (1 \text{ de cada } 8 \text{ cofres})$$

| Chip Elemental | Icono | Habilidad Añadida | Elemento | CD / Potencia | Probabilidad Global |
| :--- | :---: | :--- | :---: | :---: | :---: |
| **Chip de Fuego** | 💾 🔥 | **Lanzallamas** | FUEGO | CD 3 // 2.0x ATQ | **12.50%** |
| **Chip de Agua** | 💾 💧 | **Geyser** | AGUA | CD 3 // 2.0x ATQ | **12.50%** |
| **Chip de Tierra** | 💾 🪨 | **Fisura** | TIERRA | CD 3 // 2.0x ATQ | **12.50%** |
| **Chip de Aire** | 💾 💨 | **Tornado** | AIRE | CD 3 // 2.0x ATQ | **12.50%** |

---

## 🛒 3. Nodos de Mercado Negro (`NODE_TYPES.SHOP`)

El Mercado Negro ofrece una selección fija de **4 artículos aleatorios** (1 unidad en stock de cada uno) más un **servicio de desguace táctico**.

```
                   [🛒 CATÁLOGO DEL MERCADO NEGRO]
                                 │
     ┌───────────────────────────┼───────────────────────────┐
     │                           │                           │
     ▼                           ▼                           ▼
[RANURAS 1 Y 2]             [RANURAS 3 Y 4]             [SERVICIO FIJO]
2x Armas Base               2x Chips o Consumibles      🗑️ Dar de Baja Robot
(35-49 ⚙️)                  (25-30 ⚙️)                  (30 ⚙️, 1 uso/tienda)
```

### ⚔️ Ranuras 1 y 2: Armas Base del Mercado

* **Cantidad en Catálogo:** Exactamente **2 armas** por visita.
* **Estado:** Nivel base (sin forjar a +1).
* **Fórmula de Precio:**
  $$\text{Precio Base} = \text{random}(35, 49) \text{ ⚙️}$$
  $$\text{Precio Final} = \max(10, \lfloor \text{Precio Base} \times (1 - \text{Descuento}) \rfloor)$$
* **Probabilidades de cada arma en la ranura:**
  * Tipo de Arma: **25%** Daga, **25%** Hacha, **25%** Báculo, **25%** Espada.
  * Elemento: **25%** Fuego, **25%** Agua, **25%** Tierra, **25%** Aire.
  * Probabilidad de un arma específica por ranura: $25\% \times 25\% = \mathbf{6.25\%}$.

---

### 🧪 Ranuras 3 y 4: Chips y Consumibles

* **Cantidad en Catálogo:** Exactamente **2 artículos** por visita.
* **Pool de Selección:** 7 artículos disponibles en `ITEM_TYPES`.

#### 🎲 Probabilidades por Ranura:

| Tipo de Artículo | Icono | Nombre | Probabilidad en la Ranura | Costo Base | Con Descuento Máximo (-15%) |
| :--- | :---: | :--- | :---: | :---: | :---: |
| 💾 **Chip Elemental** | 💾 🔥 | **Chip de Fuego** | **14.29%** ($1/7$) | 30 ⚙️ | 25 ⚙️ |
| 💾 **Chip Elemental** | 💾 💧 | **Chip de Agua** | **14.29%** ($1/7$) | 30 ⚙️ | 25 ⚙️ |
| 💾 **Chip Elemental** | 💾 🪨 | **Chip de Tierra** | **14.29%** ($1/7$) | 30 ⚙️ | 25 ⚙️ |
| 💾 **Chip Elemental** | 💾 💨 | **Chip de Aire** | **14.29%** ($1/7$) | 30 ⚙️ | 25 ⚙️ |
| 🩹 **Consumible** | 🩹 | **Kit de Nanobots** | **14.29%** ($1/7$) | 25 ⚙️ | 21 ⚙️ |
| 💥 **Consumible** | 💥 | **Bomba PEM** | **14.29%** ($1/7$) | 25 ⚙️ | 21 ⚙️ |
| 🔋 **Consumible** | 🔋 | **Núcleo Sobrecarga** | **14.29%** ($1/7$) | 25 ⚙️ | 21 ⚙️ |

#### 📊 Resumen por Categoría en Ranuras 3 y 4:
* **Cualquier Chip Elemental (4 de 7):** $\mathbf{57.14\%}$
* **Cualquier Consumible (3 de 7):** $\mathbf{42.86\%}$

---

### 🗑️ Servicio Permanente: Desguace de Unidad

* **Disponibilidad:** 100% garantizado en todas las tiendas de mercado.
* **Costo:** **30 ⚙️** (fijo).
* **Límite de Uso:** **1 vez por visita**.
* **Beneficio:** Retira a un robot del escuadrón para liberar espacio. **El arma equipada y chips instalados regresan automáticamente a la mochila**.
* **Condiciones de Seguridad:**
  * Requiere tener al menos 2 robots en el equipo.
  * No permite dar de baja al único robot con vida.

---

## ❓ 4. Nodos de Eventos Misteriosos (`NODE_TYPES.MYSTERY`)

Al acceder a un nodo de misterio (`❓`), se selecciona aleatoriamente **1 evento** del pool total de 21 eventos interactivos.

$$\text{Probabilidad de aparición de cada evento} = \frac{1}{21} \approx \mathbf{4.76\%}$$

---

### 📋 Guía Completa de los 21 Eventos Misteriosos

#### 1. 🎰 Tragamonedas Rota (4.76%)
* **Descripción:** Una máquina expendedora averiada que acepta chatarra para apostar.
* **Opciones y Probabilidades:**
  * **Opción A: "Gastar 20 Chatarra"** *(Requiere $\ge 20$ ⚙️)*
    * **50.00% de Éxito:** Recibes 1 Arma base aleatoria.
    * **50.00% de Fallo:** Pierdes los 20 ⚙️ sin recompensa.
  * **Opción B: "Ignorar"**: Sin costo ni efecto.

---

#### 2. 🤖 Mercenario Moribundo (4.76%)
* **Descripción:** Un androide aliado herido solicita refacciones.
* **Opciones y Probabilidades:**
  * **Opción A: "Ayudar (Pierdes 30 Chatarra)"** *(Requiere $\ge 30$ ⚙️)*
    * **100% Garantizado:** Recibes 1 Arma base aleatoria de agradecimiento.
  * **Opción B: "Robarle (Ganar 20 Chatarra)"**:
    * **100% Garantizado:** Ganas **+20 ⚙️**.

---

#### 3. 🔮 Altar de Cristal (4.76%)
* **Descripción:** Un monolito ancestral ofrece poder a cambio de vitalidad.
* **Opciones y Probabilidades:**
  * **Opción A: "Tocar el Altar (-20% HP a todos)"**:
    * Todo el escuadrón activo pierde el **20% de su HP Máximo** (mínimo 1 HP).
    * **100% Garantizado:** Obtienes 1 **🔋 Núcleo de Sobrecarga**.
  * **Opción B: "Ignorar"**: Sin costo ni efecto.

---

#### 4. 🧪 Charco de Ácido (4.76%)
* **Descripción:** Un vertido químico corrosivo bloquea el paso directo.
* **Opciones y Probabilidades:**
  * **Opción A: "Cruzar corriendo (-15% HP activo)"**:
    * El robot activo en cabeza sufre **15% de daño de HP Máximo** (mínimo 1 HP).
  * **Opción B: "Rodear (Lento pero seguro)"**: Sin costo ni efecto.

---

#### 5. 💾 Datos Encriptados (4.76%)
* **Descripción:** Un servidor militar abandonado con registros de combate.
* **Opciones y Probabilidades:**
  * **Opción A: "Descargar Datos (+200 XP al activo)"**:
    * **100% Garantizado:** El robot activo obtiene **+200 XP**.
  * **Opción B: "Destruir Servidor (+15 Chatarra)"**:
    * **100% Garantizado:** Cosechas el disco duro y ganas **+15 ⚙️**.

---

#### 6. 🧥 El Nómada (4.76%)
* **Descripción:** Un mercader encapuchado ofrece un suministro sellado.
* **Opciones y Probabilidades:**
  * **Opción A: "Comprar Objeto Secreto (30 Chatarra)"** *(Requiere $\ge 30$ ⚙️)*
    * **100% Garantizado:** Recibes 1 objeto aleatorio de `generateRandomItem()` (57.14% Chip, 42.86% Consumible).
  * **Opción B: "Ignorar"**: Sin costo ni efecto.

---

#### 7. 🚨 Emboscada Sensorial (4.76%)
* **Descripción:** Una alarma sónica estruendosa satura los sistemas del robot.
* **Opciones y Probabilidades:**
  * **Opción A: "Apagar Sistema (-30% HP activo)"**:
    * El robot activo sufre **30% de daño de HP Máximo** (mínimo 1 HP).
  * **Opción B: "Sobrecargar (Gastar 10 Chatarra)"** *(Requiere $\ge 10$ ⚙️)*
    * Pagas 10 ⚙️ para aislar los sensores y sales ileso.

---

#### 8. 🏭 Fábrica de Chips (4.76%)
* **Descripción:** Una impresora 3D industrial lista para ensamblar microchips.
* **Opciones y Probabilidades:**
  * **Opción Única: "Imprimir Chip Elemental"**:
    * **100% Garantizado:** Obtienes 1 Chip Elemental aleatorio (**25%** Fuego, **25%** Agua, **25%** Tierra, **25%** Aire).

---

#### 9. 📦 Repuestos Militares (4.76%)
* **Descripción:** Una caja blindada sellada con material bélico.
* **Opciones y Probabilidades:**
  * **Opción A: "Forzar Cerradura (-10% HP activo)"**:
    * El robot activo sufre **10% de daño de HP Máximo** (mínimo 1 HP).
    * **100% Garantizado:** Obtienes 1 Arma base aleatoria.
  * **Opción B: "Dejarla estar"**: Sin costo ni efecto.

---

#### 10. 🩹 Cápsula de Curación (4.76%)
* **Descripción:** Una estación médica intacta con bio-nanobots de reparación.
* **Opciones y Probabilidades:**
  * **Opción Única: "Usar Cápsula (+50% HP a todos)"**:
    * **100% Garantizado:** Todo el escuadrón activo se repara un **50% de su HP Máximo**.

---

#### 11. 🔫 Ruleta Rusa Robótica (4.76%)
* **Descripción:** Un autómata trastornado te desafía a un juego de alta tensión.
* **Opciones y Probabilidades:**
  * **Opción A: "Aceptar Reto"**:
    * **50.00% de Éxito:** Ganas el premio mayor de **+50 ⚙️**.
    * **50.00% de Fallo:** El robot activo sufre **50% de daño de HP Máximo** (mínimo 1 HP).
  * **Opción B: "Rechazar"**: Te alejas sin consecuencias.

---

#### 12. 🧲 Campo Magnético (4.76%)
* **Descripción:** Un pulso electromagnético atrapa los componentes metálicos.
* **Opciones y Probabilidades:**
  * **Opción A: "Desmantelar un Arma (-1 Arma)"** *(Requiere $\ge 1$ arma en mochila)*
    * Sacrificas 1 arma del inventario para liberarte sin daño.
  * **Opción B: "Forzar Salida (-25% HP a todos)"**:
    * Todo el escuadrón activo sufre **25% de daño de HP Máximo** (mínimo 1 HP).

---

#### 13. 🌴 Oasis Cibernético (4.76%)
* **Descripción:** Una zona pacífica libre de interferencias hostiles.
* **Opciones y Probabilidades:**
  * **Opción A: "Descansar (+20% HP a todos)"**:
    * **100% Garantizado:** Todo el equipo recupera un **20% de su HP Máximo**.
  * **Opción B: "Buscar Tesoros (+20 Chatarra)"**:
    * **100% Garantizado:** Ganas **+20 ⚙️**.

---

#### 14. ⚡ Actualización de Firmware (4.76%)
* **Descripción:** Un terminal de sobreescritura de microcódigo.
* **Opciones y Probabilidades:**
  * **Opción A: "Actualizar (Gana nivel el activo, -25% HP)"**:
    * **100% Garantizado:** El robot activo **sube instantáneamente 1 nivel completo** (obtiene la XP necesaria para subir y sus estadísticas aumentan).
    * El robot activo sufre **25% de daño de HP Máximo** (mínimo 1 HP).
  * **Opción B: "Ignorar"**: Sin costo ni efecto.

---

#### 15. 🌀 Portal Dimensional (4.76%)
* **Descripción:** Un vórtice cuántico inestable de procedencia desconocida.
* **Opciones y Probabilidades:**
  * **Opción A: "Meter la mano"**:
    * **30.00% de Éxito:** Extraes 1 **Arma Mejorada (+1)** aleatoria.
    * **70.00% de Fallo:** Una descarga cuántica inflige **20% de daño de HP Máximo** al robot activo (mínimo 1 HP).
  * **Opción B: "Ignorar"**: Te alejas del portal.

---

#### 16. 💥 Mina Terrestre (4.76%)
* **Descripción:** Has pisado un artefacto explosivo con detonador de presión.
* **Opciones y Probabilidades:**
  * **Opción A: "Saltar (Evasión aleatoria)"**:
    * **50.00% de Éxito:** Esquivas la detonación ileso (0 daño).
    * **50.00% de Fallo:** El robot activo sufre **40% de daño brutal de HP Máximo** (mínimo 1 HP).
  * **Opción B: "Escudar con Arma (Pierdes 1 arma)"** *(Requiere $\ge 1$ arma en mochila)*
    * Detonas la mina con un arma de tu mochila; sales ileso sin daño.

---

#### 17. 🧹 Refugiado (4.76%)
* **Descripción:** Un dron de limpieza desarmado pide escolta y protección.
* **Opciones y Probabilidades:**
  * **Opción A: "Protegerlo (+100 XP a todos)"**:
    * **100% Garantizado:** Todo el escuadrón activo recibe **+100 XP**.
  * **Opción B: "Desguazarlo (+15 Chatarra)"**:
    * **100% Garantizado:** Desmantelas al dron y ganas **+15 ⚙️**.

---

#### 18. 🏛️ Armería Antigua (4.76%)
* **Descripción:** Un expositor blindado con tecnología militar antigua.
* **Opciones y Probabilidades:**
  * **Opción A: "Pagar para abrir (40 Chatarra)"** *(Requiere $\ge 40$ ⚙️)*
    * **100% Garantizado:** Pagas 40 ⚙️ y obtienes **2 Armas base aleatorias**.
  * **Opción B: "Irte"**: Sin costo ni efecto.

---

#### 19. ☄️ Lluvia de Meteoros (4.76%)
* **Descripción:** Fragmentos incandescentes de satélites caen en picada.
* **Opciones y Probabilidades:**
  * **Opción A: "Buscar Refugio"**:
    * **100% Garantizado:** Evitas todo peligro ileso.
  * **Opción B: "Buscar Meteoritos (Arriesgado)"**:
    * **50.00% de Éxito:** Encuentras 1 **Chip Elemental aleatorio** (25% cada elemento).
    * **50.00% de Fallo:** Todo el equipo sufre **10% de daño de HP Máximo** (mínimo 1 HP).

---

#### 20. 🤖 Entidad Digital (4.76%)
* **Descripción:** Una inteligencia artificial milenaria se proyecta ante ti.
* **Opciones y Probabilidades:**
  * **Opción A: "Pedir Conocimiento (+300 XP activo)"**:
    * **100% Garantizado:** El robot activo recibe **+300 XP**.
  * **Opción B: "Pedir Poder (Arma aleatoria)"**:
    * **100% Garantizado:** La IA materializa 1 Arma base aleatoria.

---

#### 21. ♻️ Chatarrero de Androides Caídos (4.76%)
* **Descripción:** Un camión recolector automatizado ofrece desarmar unidades desactivadas.
* **Opciones y Probabilidades:**
  * **Opción A: "Reciclar robots caídos"** *(Requiere al menos 1 robot desactivado/muerto y al menos 1 robot con vida)*:
    * **100% Garantizado:** Purga y elimina a todos los robots muertos del escuadrón.
    * **Devuelve todas sus armas y chips equipados** directamente a tu mochila.
    * Otorga **+15 ⚙️ por cada robot reciclado**.
  * **Opción B: "Ignorar y conservar los restos"**: Conservas las carcasas para repararlas más adelante.

---

## 🗺️ 5. Estructura General de Pisos de la Torre (10 Pisos)

| Piso | Nodos Disponibles | Mercados Garantizados | Tesoros Garantizados |
| :---: | :--- | :---: | :---: |
| **Piso 1** | 👾 Combate (80%) / ❓ Misterio (20%) | 0 | 0 |
| **Piso 2** | 👾 Combate / 💀 Élite / ❓ Misterio / 🛒 Mercado | **1er Mercado** *(entre Pisos 2, 3 o 4)* | 0 |
| **Piso 3** | 👾 Combate / 💀 Élite / ❓ Misterio / 🛒 Mercado | *(Rango de 1er Mercado)* | 0 |
| **Piso 4** | 👾 Combate / 💀 Élite / ❓ Misterio / 🛒 Mercado | *(Rango de 1er Mercado)* | 0 |
| **Piso 5** | 🎁 **Puros Cofres de Tesoro** | 0 | **1 Cofre a Elección (100%)** |
| **Piso 6** | 👾 Combate / 💀 Élite / ❓ Misterio / 🛒 Mercado / ⛺ Taller | **2do Mercado** *(entre Pisos 6, 7, 8 o 9)* | 0 |
| **Piso 7** | 👾 Combate / 💀 Élite / ❓ Misterio / 🛒 Mercado / ⛺ Taller | *(Rango de 2do Mercado)* | 0 |
| **Piso 8** | 👾 Combate / 💀 Élite / ❓ Misterio / 🛒 Mercado / ⛺ Taller | *(Rango de 2do Mercado)* | 0 |
| **Piso 9** | 👾 Combate / 💀 Élite / ❓ Misterio / 🛒 Mercado | *(Rango de 2do Mercado)* | 0 |
| **Piso 10** | 👑 **TITAN-X (Jefe Final)** | 0 | 0 |