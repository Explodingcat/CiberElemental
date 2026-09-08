# Manual de Cyber-Elemental: Guía Definitiva

Bienvenido al manual oficial de **Cyber-Elemental**. Aquí encontrarás desglosadas todas las mecánicas, probabilidades, sinergias, chips elementales, combos de marcas, navegación de la torre y gestión del inventario.

---

## 1. Sistema de Elementos y Atributos

El juego opera bajo una rueda de afinidades elemental táctica:
* 🔥 **Fuego** vence a 🪨 **Tierra** (x1.35 daño)
* 🪨 **Tierra** vence a 💨 **Aire** (x1.35 daño)
* 💨 **Aire** vence a 💦 **Agua** (x1.35 daño)
* 💦 **Agua** vence a 🔥 **Fuego** (x1.35 daño)
* ⚙️ **Neutro** (Jefe) no tiene ventajas ni desventajas directas (x1.0 daño siempre).

> [!TIP]
> **Multiplicadores de Daño:**
> * **Ventaja Elemental:** Inflige **1.35x (135%)** del daño base.
> * **Desventaja Elemental:** Inflige **0.75x (75%)** del daño base.
> * **Neutral / Mismo Elemento:** Inflige **1.0x (100%)** del daño base.

### Estadísticas Base y Habilidades Iniciales (Nivel 1)

| Elemento | Robot Base | HP Máx | ATQ | Vel | Esq | Prec | Crít | Habilidades Iniciales |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 🔥 **FUEGO** | **Ignis** | 90 | 28 | 11 | 5% | 100% | 10% | **Ataque Básico:** 1.0x Daño.<br>**Ignición (CD 3):** Inflige 1.2x daño directo + Quemadura (8% HP/turno por 2 turnos). |
| 💦 **AGUA** | **Aqua** | 130 | 14 | 9 | 5% | 95% | 5% | **Ataque Básico:** 1.0x Daño.<br>**Barrera Plasma (CD 3):** Otorga barrera a cualquier aliado: bloquea el 100% de daño recibido hasta el próximo turno del invocador, restaura 5% de HP Máx y adhiere Marca de Agua (3T) al enemigo cuando éste ataca al protegido. |
| 🪨 **TIERRA** | **Terra** | 175 | 12 | 4 | 0% | 85% | 5% | **Ataque Básico:** 1.0x Daño.<br>**Coraza de Espinas (CD 2):** Provocación: obliga a los enemigos a atacarle (al de menor HP si hay varios), reduce 50% el daño recibido, refleja 50% y adhiere 3 Marcas de Tierra al atacante hasta su próximo turno. |
| 💨 **AIRE** | **Zephyr** | 80 | 22 | 16 | 25% | 95% | 15% | **Ataque Básico:** 1.0x Daño.<br>**Ráfaga Cortante (CD 2):** Inflige 1.4x daño (garantiza actuar primero en el turno de uso). |
| ⚙️ **NEUTRO** | **TITAN-X** *(Jefe Torre 1)* | 350 *(~507 Nv10)* | 26 *(~37 Nv10)* | 11 | 10% | 100% | 12% | **Golpe Titánico:** 1.4x Daño sísmico.<br>**Pulso PEM Titánico (CD 3):** 0.8x Daño en área a todo el escuadrón y destruye todas las barreras y escudos.<br>**Protocolo Exterminio (CD 4):** 2.2x Daño masivo infalible (fijación balística absoluta: no puede fallar ni ser esquivado). |
| ⚛️ **NEUTRO** | **TITAN-OMEGA** *(Jefe Torre 2)* | 420 *(~819 Nv20)* | 28 *(~54 Nv20)* | 12 | 12% | 100% | 15% | **Golpe Cuántico:** 1.5x Daño electromagnético.<br>**Sobrecarga Cuántica (CD 3):** 1.0x Daño en área que destruye escudos y aplica rompearmaduras.<br>**Protocolo Aniquilación (CD 4):** 2.5x Daño infalible devastador con sacudida sísmica. |
| 🌌 **NEUTRO** | **SINGULARIDAD-ZERO** *(Jefe Torre 3)* | 500 *(~1225 Nv30)* | 32 *(~78 Nv30)* | 14 | 15% | 100% | 20% | **Colapso Gravitatorio:** 1.6x Daño por aplastamiento espacial.<br>**Tormenta del Vacío (CD 3):** 1.2x Daño en área total, purga barreras y deja conmoción.<br>**Protocolo Singularidad (CD 4):** 3.0x Daño cataclísmico garantizado (no puede fallar). |
| 👑 **LEGENDARIO** | **Armas Doradas** | — | +25% Afinidad | — | — | — | +20% Crít (+1) | **Afinidad Universal:** Otorga **+25% ATQ y +15% HP Máximo** a cualquier robot independientemente de su elemento.<br>**1.15x Daño Universal:** Sin desventaja contra ningún elemento. Al desmantelarse otorga +100 Chatarra. |

> [!NOTE]
> **Sistema de Daño Crítico (1.5x / +50% Daño):** Ocurre de forma global exclusivamente en **Ataques Básicos** (las habilidades con Cooldown no pueden asestar golpes críticos).

### Crecimiento y Nivel del Robot
* **Ganancia de Experiencia:** Vencer a un enemigo otorga `Nivel_Enemigo * 50 XP` a todos los robots operativos del escuadrón.
* **Curva de Nivel:** Se requieren `Nivel_Actual * 100 XP` para subir de nivel.
* **Escalado por Nivel:** Cada nivel otorga **+5% de HP Máx** y **+5% de ATQ**.

---

## 2. Sistema de Combate en Escuadrón (Party Combat)

### 🤖 Despliegue Simultáneo de Aliados
* Todos los aliados reclutados (**1 a 3 robots**) luchan en la arena **al mismo tiempo** sobre plataformas holográficas individuales.
* Cada aliado posee su propia tarjeta HUD con su barra de vida, estadísticas, arma equipada (con color elemental distintivo) y chips instalados (`💾`).

### ⚡ Cola de Iniciativa (Timeline por Velocidad)
* En la parte superior de la arena se ubica la **Barra de Iniciativa**.
* Al inicio de cada ronda, todos los combatientes activos se ordenan de mayor a menor según su **Velocidad (⚡ SPD)**.
* **Turno Activo:** El combatiente al que le corresponde actuar se ilumina en el timeline y realiza un movimiento de levitación activo más rápido en su plataforma (conservando su color elemental puro).
* **Animaciones de Ataque:** Cada acción ofensiva dispara una embestida (*dash* hacia adelante con aceleración e impacto) seguida del retroceso del defensor y partículas elementales.
* **IA Enemiga:** El rival analiza el campo y ataca inteligentemente, priorizando ventajas de elemento o rematando a aliados con baja salud.

### Acciones por Turno
1. **⚔️ Ataque / Habilidad:** Ejecuta una habilidad básica (0 CD) o especial del robot activo.
2. **🛡️ Defender:** **Reduce a la mitad (50%)** todo el daño recibido hasta el inicio de su **próximo turno** (protegiendo eficazmente tanto a unidades rápidas como lentas).
3. **🎒 Objeto:** Usa consumibles tácticos desde la mochila (los Nanobots y Núcleos de Sobrecarga son acciones gratuitas; la Bomba PEM gasta el turno de acción).

---

## 3. Matriz Completa de Reacciones y Marcas Elementales

### ¿Cómo se aplican las marcas?
Toda **Habilidad Especial con Cooldown** (incluyendo habilidades nativas y las aprendidas por **Chips**) aplica una **Marca Elemental** (**Marca de Fuego 🔥, Marca de Agua 💦, Marca de Tierra 🪨, Marca de Aire 💨**) al objetivo durante **3 turnos**.

> [!IMPORTANT]
> Un combatiente solo puede tener **1 Marca Elemental activa** a la vez. Aplicar una nueva sobreescribe la anterior.

### Tabla Completa de Combos y Reacciones:

| Marca en el Defensor | Elemento Atacante | Nombre del Combo | Efecto Táctico de la Reacción |
| :--- | :---: | :--- | :--- |
| 💦 **Marca de Agua** | 🔥 **FUEGO** | **¡VAPORIZACIÓN!** | Inflige **1.5x Daño**. |
| 💦 **Marca de Agua** | 🪨 **TIERRA** | **¡LODO!** | Inflige **1.2x Daño** y aplica **Ralentización** (-50% Velocidad por 2 turnos). |
| 💦 **Marca de Agua** | 💨 **AIRE** | **¡VENTISCA!** | Inflige **1.35x Daño** y aplica **Congelación leve** (-20% Precisión rival por 2 turnos). |
| 🔥 **Marca de Fuego** | 💨 **AIRE** | **¡TORMENTA ÍGNEA!** | Inflige **1.3x Daño** y **renueva la Quemadura a 3 turnos**. |
| 🔥 **Marca de Fuego** | 💦 **AGUA** | **¡CHOQUE TÉRMICO!** | Inflige **1.45x Daño** y **remueve todas las ventajas y bufos del rival**. |
| 🔥 **Marca de Fuego** | 🪨 **TIERRA** | **¡ERUPCIÓN!** | Inflige **1.4x Daño** y aplica **Rompearmaduras** (-25% Defensa enemiga por 2 turnos). |
| 🪨 **Marca de Tierra** | 🔥 **FUEGO** | **¡CRISTALIZACIÓN!** | Inflige **1.2x Daño** y otorga un **Escudo equivalente al 25% de la vida actual**. |
| 🪨 **Marca de Tierra** | 💦 **AGUA** | **¡EROSIÓN!** | Inflige **1.3x Daño** y **cura al usuario el 30% del daño infligido**. |
| 🪨 **Marca de Tierra** | 💨 **AIRE** | **¡TORMENTA DE ARENA!** | Inflige **1.3x Daño** y aplica **Ceguera** (-50% Precisión en el siguiente ataque rival). |
| 💨 **Marca de Aire** | 🔥 **FUEGO** | **¡DEFLAGRACIÓN!** | Inflige **1.45x Daño directo puro** (sin quemadura adicional). |
| 💨 **Marca de Aire** | 💦 **AGUA** | **¡CICLÓN!** | Inflige **1.35x Daño** y **retrasa el turno del rival al final de la ronda**. |
| 💨 **Marca de Aire** | 🪨 **TIERRA** | **¡COLAPSO SÍSMICO!** | Inflige **1.4x Daño** y causa **Aturdimiento condicional con 40% de probabilidad**. |
| 🛡️ *(Barrera / Coraza Activa)* | *(Cualquiera)* | **RETRIBUCIÓN PROTECTORA** | Si un enemigo impacta contra tu Barrera o Coraza, ésta absorbe/refleja el daño y contraataca: si el agresor ya posee una Marca Elemental previa, detona la **Reacción Elemental Combinada** con daño basado en el **Ataque Básico** del portador; si no posee marca, le adhiere la **Marca Elemental** correspondiente durante **3 turnos**. |

---

## 4. Chips de Habilidad Elemental (Expansión Modular)

Los **Chips Elementales (💾)** permiten a un robot aprender habilidades de **otro elemento distinto al suyo**, creando configuraciones híbridas capaces de detonar sus propias marcas y combos.

> [!TIP]
> **Instalación Modular:** Se instalan directamente desde la **Mochila** en cualquier aliado operativo.
>
> **Límite de Ranura (Máx. 1 Chip por Robot):** Cada robot posee **1 única ranura para Chip** (3 habilidades en total: 2 nativas + 1 de chip). Si instalas un nuevo chip en un robot que ya tiene uno, el chip anterior se desinstalará automáticamente y regresará a tu mochila. También puedes pulsar **Desinstalar** en cualquier momento desde la tarjeta del robot.

| Chip | Icono | Habilidad Añadida | Elemento | CD | Potencia | Efecto Táctico y Marca |
| :--- | :---: | :--- | :---: | :---: | :---: | :--- |
| **Chip de Fuego** | 💾 | **Lanzallamas** | 🔥 **FUEGO** | 3 | **2.0x ATQ** | Inflige daño pesado de Fuego y aplica **Marca de Fuego** por 3 turnos. Prepara *Tormenta Ígnea* o detona *Vaporización*. |
| **Chip de Agua** | 💾 | **Geyser** | 💦 **AGUA** | 3 | **2.0x ATQ** | Chorro de alta presión que aplica **Marca de Agua** por 3 turnos. Abre paso a *Vaporización* o *Lodo*. |
| **Chip de Tierra** | 💾 | **Fisura** | 🪨 **TIERRA** | 3 | **2.0x ATQ** | Quiebre sísmico que inflige daño contundente y aplica **Marca de Tierra** por 3 turnos. Prepara *Cristalización*. |
| **Chip de Aire** | 💾 | **Tornado** | 💨 **AIRE** | 3 | **2.0x ATQ** | Vórtice cortante de viento que aplica **Marca de Aire** por 3 turnos. Prepara *Deflagración*. |

---

## 5. Armamento, Forja y Suministros

Las armas otorgan **efectos pasivos permanentes** durante el combate.

### Bono de Afinidad Elemental (🌟)
Si el elemento del arma coincide con el elemento nativo del robot portador:
* **+20% de HP Máximo**
* **+20% de Ataque (ATQ)**

### Tipos de Armas y Mejoras (+1)

En los **Campamentos / Talleres (⛺)** puedes **Forjar** para subir un arma a **+1**:

| Arma | Icono | Efecto Pasivo Base | Efecto Pasivo Mejorado (+1) |
| :--- | :---: | :--- | :--- |
| **Daga** | 🗡️ | **25% de probabilidad** de asestar un segundo golpe consecutivo. | **40% de probabilidad** de doble ataque consecutivo. |
| **Hacha** | 🪓 | **+10% ATQ base pasivo**, **20% prob. de Rompearmaduras** (-25% DEF, 2T) y **perfora 50%** de barreras/defensas.<br>**Verdugo:** +35% Daño a enemigos con $\le 40\%$ HP. | **Perfora 75%** de defensas.<br>**Verdugo Potenciado:** **+45% Daño** a enemigos con $\le 40\%$ HP.<br>Conserva el +10% ATQ y 20% Rompearmaduras. |
| **Báculo** | 🪄 | Repara automáticamente un **5% del HP Máximo** del portador al final de cada turno (potenciado por Afinidad de Agua). | Repara un **7% del HP Máximo** del portador + **cura 5% HP al aliado más herido**.<br>**20% prob. de reducir 1 turno de Cooldown** a una habilidad aliada o propia. |
| **Espada** | ⚔️ | **+15% Daño base pasivo** + **10% de Golpe Crítico en Básicos**. Críticos activan Racha (+10% ATQ). | **+30% Daño base pasivo** + **20% de Golpe Crítico en Básicos**. Críticos activan Racha (+10% ATQ). |

> [!NOTE]
> Cualquier arma no deseada en el inventario puede ser **Desmantelada** por **+20 Chatarra (⚙️)**.

### Objetos Consumibles

| Objeto | Icono | Uso | Efecto |
| :--- | :---: | :--- | :--- |
| **Kit de Nanobots** | 🩹 | Fuera de Combate *(Mochila)* | Repara instantáneamente un **40% del HP Máximo** de un robot del escuadrón. |
| **Bomba PEM** | 💥 | En Combate *(Gasta Turno)* | Sobrecarga los circuitos del enemigo, dejándolo **Aturdido (STUN)** por **1 turno**. |
| **Núcleo Sobrecarga** | 🔋 | En Combate *(Acción Gratuita)* | **Reduce 1 turno de Cooldown** a todas las habilidades del robot activo. |

> [!TIP]
> **Servicio de Desguace en Mercado Negro (🛒):** En cada tienda de mercado puedes pagar **30 Chatarra (⚙️)** para dar de baja a 1 robot del escuadrón (máx. 1 por visita). Sus armas y chips equipados son devueltos a la mochila automáticamente.

---

## 6. Mochila y Centro de Gestión Táctica

La ventana modal de **Mochila y Escuadrón (`🎒`)** ofrece control total sobre las unidades y recursos:

1. **🛡️ Unidades del Escuadrón:**
   - Visualización de tarjetas completas: HP actual/máximo, estadísticas (`⚔️ ATQ`, `⚡ VEL`), nivel y elemento.
   - **Ranura de Arma:** Muestra el arma equipada con su pasiva y botón directo de **"Desequipar"**.
   - **Ranura de Chips:** Muestra todas las habilidades adicionales instaladas mediante chips.
2. **⚔️ Armas y Equipo:**
   - Botón contextual para **"Equipar a [Aliado] 🌟"** (con afinidad resaltada).
   - Botón para **"⚙️ Desmantelar (+20 Chatarra)"**.
3. **💾 Chips de Habilidad:**
   - Permite la instalación directa sobre cualquier robot del escuadrón.
4. **🧪 Suministros y Consumibles:**
   - Botones rápidos de curación (ej. **"💊 Curar a Ignis (+40% HP)"**) e indicadores de consumibles exclusivos de combate.

---

## 7. Navegación Multitorre y Nodos Sectoriales

La incursión opera bajo un sistema de progresión roguelike estricto. **Toda expedición comienza obligatoriamente en el Piso 1 de la Torre 1**. Cada sector consta de 10 pisos con bifurcaciones tácticas:

* **🗼 Torre 1: Torre Cibernética (Pisos 1 - 10):**
  * Sector inicial. Enemigos de Nv1 a Nv10.
  * **Curva Limpia de Inicio:** Los enemigos regulares no portan armas (luchan a mano limpia con sus estadísticas y habilidades elementales base).
  * **Piso 10:** Jefe **TITAN-X**. Al derrotarlo, otorga la **Llave Cuántica** 🔑 (acceso a Torre 2) y un **Arma Legendaria Dorada** garantizada 👑.
* **⚛️ Torre 2: Torre Cuántica (Pisos 11 - 20):**
  * Desbloqueada tras derrotar a TITAN-X. Enemigos avanzados de Nv11 a Nv20.
  * **Enemigos Armados:** A partir de esta torre, los enemigos regulares pueden portar armas elementales (30% en Piso 11, +10% por piso).
  * **Piso 20:** Jefe **TITAN-OMEGA**. Al derrotarlo, otorga la **Llave de Singularidad** 🗝️ (acceso a Torre 3) y un **Arma Legendaria Dorada** 👑.
* **🌌 Torre 3: Torre de Singularidad (Pisos 21 - 30):**
  * El desafío supremo. Enemigos hiper-letales de Nv21 a Nv30.
  * **Máxima Hostilidad:** El 100% de los enemigos regulares van pertrechados con armamento de combate avanzado.
  * **Piso 30:** Jefe final **SINGULARIDAD-ZERO**. Al derrotarlo, se sella la victoria total de la expedición.

### Estructura Equilibrada por Torre
* **🛒 Mercados Garantizados (2 por torre):** Aparece exactamente 1 Mercado en los primeros pisos (pisos 2-4 / 12-14 / 22-24) y un 2º Mercado en los pisos superiores (pisos 6-9 / 16-19 / 26-29).
* **🎁 Cámara de Tesoros (Piso 5 / 15 / 25):** Compuesto **exclusivamente por cofres de tesoro** en todas sus rutas, garantizando una recompensa estratégica a mitad de cada torre.
* **👑 Núcleo de la Torre (Piso 10 / 20 / 30):** Enfrentamiento contra el jefe de la torre.

### Leyenda de Nodos
* 👾 **Combate Normal:** Enfrentamiento contra robot salvaje del nivel del piso actual.
* 💀 **Combate Élite:** Robot potenciado (+2 niveles, mayor vida, botín doble garantizado) con un **Mutador Cibernético** aleatorio (*Espinas*, *Regenerador* o *Rabia*).
* 🎁 **Tesoro / Suministros:** Recompensa de chatarra, objetos raros o armas sin combatir.
* 🛒 **Mercado Negro:** Tienda para adquirir armas, suministros y dar de baja robots por 30 ⚙️.
* ⛺ **Taller de Reparación:** Permite elegir entre **Reparar Escuadrón** (cura 30%), **Entrenar Robot** (+300 XP) o **Forjar Arma** (mejora a +1).
* ❓ **Evento Misterioso:** Terminales narrativas con decisiones de riesgo y recompensa.
* 👑 **Jefe de Sector:** Enfrentamiento contra el jefe supremo en el núcleo de la torre.

### Guardado Seguro en Base de Datos (Cero LocalStorage)
Para garantizar la integridad competitiva y evitar manipulaciones en el cliente:
* **Persistencia en Supabase:** Al derrotar al jefe de una torre, el estado completo de la run (escuadrón, niveles, armas, chips, inventario y chatarra recolectada) se almacena en la tabla `saved_tower_runs`.
* **Reanudar Incursión:** En el Menú Principal aparece el botón interactivo **⚡ REANUDAR INCURSIÓN** indicando la torre y piso guardado.
* **Muerte Permanente:** Si el escuadrón es derrotado en combate (Game Over), el checkpoint se purga automáticamente de la base de datos.
* **Llaves como Acceso Táctico:** Las llaves son un evento y recompensa psicológica que desbloquean el ascenso inmediato, no objetos de inventario permanente.

---

## 8. Decisiones Post-Combate

Al neutralizar a un escuadrón rival:
* **🤖 Reclutar (Normal):** Si el enemigo es estándar, se une garantizado al equipo al 50% de HP (máximo 3 miembros).
* **⚠️ Reclutar Élite (Alto Riesgo):** Reprogramar a un Élite tiene **50% de probabilidad de éxito**. Si falla, el núcleo **explota** infligiendo **10% de daño de HP a todo el escuadrón**.
* **⚙️ Desmantelar:** Destruye el chasis enemigo a cambio de **+30 Chatarra** y **+10% de reparación**. Tras un jefe, desmantelar cura al equipo sin forzar el avance, permitiendo decidir el siguiente paso.
* **🚀 Ascender a la Siguiente Torre:** Disponible tras vencer al jefe de la Torre 1 o 2. Despliega al equipo en el primer piso del nuevo sector.
* **🏆 Retirarse con Victoria:** Permite consolidar la chatarra acumulada en el pozo global de la cuenta y finalizar la expedición con éxito sin arriesgar el progreso.
* **➔ Avanzar Incursión:** Continúa al siguiente piso en nodos estándar.

