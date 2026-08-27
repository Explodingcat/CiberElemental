# Manual de Cyber-Elemental: Guía Definitiva

Bienvenido al manual oficial de **Cyber-Elemental**. Aquí encontrarás desglosadas todas las mecánicas, probabilidades, sinergias, chips elementales, combos de marcas, navegación de la torre y gestión del inventario.

---

## 1. Sistema de Elementos y Atributos

El juego opera bajo una rueda de afinidades elemental táctica:
* 🔥 **Fuego** vence a 🪨 **Tierra** (x1.5 daño)
* 🪨 **Tierra** vence a 💨 **Aire** (x1.5 daño)
* 💨 **Aire** vence a 💦 **Agua** (x1.5 daño)
* 💦 **Agua** vence a 🔥 **Fuego** (x1.5 daño)
* ⚙️ **Neutro** (Jefe) no tiene ventajas ni desventajas directas (x1.0 daño siempre).

> [!TIP]
> **Multiplicadores de Daño:**
> * **Ventaja Elemental:** Inflige **1.5x (150%)** del daño base.
> * **Desventaja Elemental:** Inflige **0.5x (50%)** del daño base.
> * **Neutral / Mismo Elemento:** Inflige **1.0x (100%)** del daño base.

---

### Estadísticas Base y Habilidades Iniciales (Nivel 1)

| Elemento | Robot Base | HP Máx | ATQ | Vel | Esq | Prec | Habilidades Iniciales |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 🔥 **FUEGO** | **Ignis** | 90 | 28 | 11 | 5% | 100% | **Ataque Básico:** 1.0x Daño.<br>**Ignición (CD 3):** Inflige 1.2x daño directo + Quemadura (8% HP/turno por 2 turnos). |
| 💦 **AGUA** | **Aqua** | 130 | 14 | 9 | 5% | 95% | **Ataque Básico:** 1.0x Daño.<br>**Barrera Plasma (CD 4):** Bloquea 100% del próximo golpe recibido y aplica 1 Marca de Agua al atacante. |
| 🪨 **TIERRA** | **Terra** | 175 | 12 | 4 | 0% | 85% | **Ataque Básico:** 1.0x Daño.<br>**Terremoto (CD 4):** Inflige 1.3x daño + 60% prob. de Aturdimiento (100% garantizado con Marca previa). |
| 💨 **AIRE** | **Zephyr** | 80 | 22 | 16 | 25% | 95% | **Ataque Básico:** 1.0x Daño.<br>**Ráfaga Cortante (CD 2):** Inflige 1.4x daño (garantiza actuar primero en el turno de uso). |
| ⚙️ **NEUTRO** | **TITAN-X** *(Jefe)* | 200 | 30 | 12 | 10% | 100% | **Golpe Titánico:** 1.5x Daño.<br>**Protocolo Exterminio (CD 4):** 3.0x Daño masivo. |

### Crecimiento y Nivel del Robot
* **Ganancia de Experiencia:** Vencer a un enemigo otorga `Nivel_Enemigo * 50 XP` a todos los robots operativos del escuadrón.
* **Curva de Nivel:** Se requieren `Nivel_Actual * 100 XP` para subir de nivel.
* **Escalado por Nivel:** Cada nivel otorga **+5% de HP Máx** y **+5% de ATQ**. Además, al subir de nivel el robot **se repara al 100% de su vida**.

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
2. **🛡️ Defender:** Recupera **5% del HP Máximo** y **reduce a la mitad (50%)** todo el daño recibido ese turno.
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
| 💦 **Marca de Agua** | 🔥 **FUEGO** | **¡VAPORIZACIÓN!** | Daño crítico duplicado (**2.0x / 200% de Daño**). |
| 💦 **Marca de Agua** | 🪨 **TIERRA** | **¡LODO!** | Inflige 1.3x Daño y **Aturde (STUN)** al enemigo por 1 turno completo. |
| 💦 **Marca de Agua** | 💨 **AIRE** | **¡VENTISCA!** | Inflige **1.5x Daño** con choque de escarcha gélida. |
| 🔥 **Marca de Fuego** | 💨 **AIRE** | **¡TORMENTA ÍGNEA!** | Inflige **1.4x Daño** y provoca **Quemadura Grave (BURN)** (drena HP por 2 turnos). |
| 🔥 **Marca de Fuego** | 💦 **AGUA** | **¡CHOQUE TÉRMICO!** | Extinción explosiva que inflige **1.75x de Daño**. |
| 🔥 **Marca de Fuego** | 🪨 **TIERRA** | **¡ERUPCIÓN DE MAGMA!** | Inflige **1.5x Daño** e inflige estado de Quemadura. |
| 🪨 **Marca de Tierra** | 🔥 **FUEGO** | **¡CRISTALIZACIÓN!** | Inflige **1.3x Daño** y otorga al atacante una **Barrera de Plasma** (bloquea 100% del próximo golpe). |
| 🪨 **Marca de Tierra** | 💦 **AGUA** | **¡EROSIÓN!** | Inflige **1.5x Daño** y el atacante **absorbe y cura un 15% de su HP Máximo**. |
| 🪨 **Marca de Tierra** | 💨 **AIRE** | **¡TORMENTA DE ARENA!** | Inflige 1.4x Daño y **Aturde (STUN)** al enemigo durante 1 turno. |
| 💨 **Marca de Aire** | 🔥 **FUEGO** | **¡DEFLAGRACIÓN!** | Inflige **1.6x Daño** masivo y aplica estado de Quemadura por 2 turnos. |
| 💨 **Marca de Aire** | 💦 **AGUA** | **¡CICLÓN TORMENTOSO!** | Desata un vórtice acuático que inflige **1.6x Daño**. |
| 💨 **Marca de Aire** | 🪨 **TIERRA** | **¡COLAPSO SÍSMICO!** | Inflige **1.5x Daño** y derriba al objetivo dejándolo **Aturdido (STUN)** por 1 turno. |
| 🛡️ *(Barrera Activa)* | *(Cualquiera)* | **RETRIBUCIÓN DE BARRERA** | Si un enemigo impacta contra tu Barrera, esta absorbe el daño y contraataca aplicando la **Marca Elemental** del robot defensor al agresor durante **3 turnos**. |

---

## 4. Chips de Habilidad Elemental (Expansión Modular)

Los **Chips Elementales (💾)** permiten a un robot aprender habilidades de **otro elemento distinto al suyo**, creando configuraciones híbridas capaces de detonar sus propias marcas y combos.

> [!TIP]
> **Instalación:** Se instalan directamente desde la **Mochila** en cualquier aliado operativo.

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
| **Hacha** | 🪓 | **Perfora el 50%** de la reducción de daño por defensa y barreras. | **Perfora el 75%** de la reducción de daño por defensa y barreras. |
| **Báculo** | 🪄 | Repara automáticamente un **3% del HP Máximo** al final de cada turno. | Repara un **5% del HP Máximo** al final de cada turno. |
| **Espada** | ⚔️ | **+15% Daño base pasivo** + **5% de Golpe Crítico** (+50% daño). | **+30% Daño base pasivo** + **5% de Golpe Crítico** (+50% daño). |

> [!NOTE]
> Cualquier arma no deseada en el inventario puede ser **Desmantelada** por **+20 Chatarra (⚙️)**.

### Objetos Consumibles

| Objeto | Icono | Uso | Efecto |
| :--- | :---: | :--- | :--- |
| **Kit de Nanobots** | 🩹 | Fuera de Combate *(Mochila)* | Repara instantáneamente un **40% del HP Máximo** de un robot del escuadrón. |
| **Bomba PEM** | 💥 | En Combate *(Gasta Turno)* | Sobrecarga los circuitos del enemigo, dejándolo **Aturdido (STUN)** por **1 turno**. |
| **Núcleo Sobrecarga** | 🔋 | En Combate *(Acción Gratuita)* | **Reduce 1 turno de Cooldown** a todas las habilidades del robot activo. |

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

## 7. Navegación de la Torre y Nodos Sectoriales

El mapa de cada sector consta de 10 pisos de bifurcaciones tácticas:

### Leyenda de Nodos
* 👾 **Combate Normal:** Enfrentamiento contra robot salvaje del nivel del piso actual.
* 💀 **Combate Élite:** Robot potenciado (+2 niveles, mayor vida, botín doble garantizado) con un **Mutador Cibernético** aleatorio (*Espinas*, *Regenerador* o *Rabia*).
* 🎁 **Tesoro / Suministros:** Recompensa de chatarra, objetos raros o armas sin combatir.
* 🛒 **Mercado Negro:** Tienda para adquirir armas y suministros a cambio de chatarra.
* ⛺ **Taller de Reparación:** Permite elegir entre **Reparar Escuadrón** (cura 30%), **Entrenar Robot** (+300 XP) o **Forjar Arma** (mejora a +1).
* ❓ **Evento Misterioso:** Terminales narrativas con decisiones de riesgo y recompensa.
* 👑 **Jefe de Sector (Piso 10):** Enfrentamiento supremo contra **TITAN-X** en el núcleo de la torre.

### Estados Visuales del Mapa
* **👑 Piso 10 (Cámara del Jefe):** Advertencia e iluminación en rojo carmesí (`#ff4757`).
* **▶ Piso Actual:** Resplandor cian neón (`#66fcf1`) con etiqueta activa.
* **✔ Pisos Superados:** Atenuados con marca de sector completado.
* **Nodos Seleccionables:** Destacados con un anillo pulsante cian (`.node-pulse-ring`) y animación interactiva.
* **Circuitos de Datos:** Las rutas disponibles hacia el siguiente piso muestran un flujo de datos animado (`.map-line-active`).

---

## 8. Decisiones Post-Combate

Al neutralizar a un robot rival, el escuadrón debe elegir:
* **🤖 Reclutar (50% HP):** Añade al robot derrotado como nuevo miembro del equipo (hasta un máximo de 3 integrantes en formación).
* **⚙️ Desmantelar:** Destruye el chasis enemigo a cambio de **+30 Chatarra** y una **reparación del 10% de HP** para todo el escuadrón.
* **➔ Avanzar Incursión:** Continúa directamente hacia el siguiente sector sin interactuar con los restos.
