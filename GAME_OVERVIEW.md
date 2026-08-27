# ⚡ CYBER-ELEMENTAL: Resumen Ejecutivo y Guía de Juego

Bienvenido al documento general de **Cyber-Elemental**. Este documento resume de qué se trata el juego, cómo operan sus sistemas y cómo se alcanza la victoria o se produce el fin de la partida.

---

## 🌆 1. ¿De qué se trata? (Premisa y Lore)

**Cyber-Elemental** es un RPG táctico *roguelike* ambientado en un futuro Cyberpunk. Tomas el control de un comandante cibernético al mando de un escuadrón de robots autónomos con núcleos elementales (**Fuego 🔥, Agua 💦, Tierra 🪨, Aire 💨**).

El objetivo es infiltrarse y ascender a través de una **Torre Sectorial de 10 pisos** controlada por máquinas hostiles rebeldes, reclutando nuevas unidades, recolectando chatarra, equipando armas cibernéticas e instalando chips de tecnología hasta llegar al núcleo final para neutralizar a la IA suprema: **TITAN-X**.

---

## ⚙️ 2. ¿Cómo funciona? (Mecánicas Principales)

### A. Rueda de Afinidades Elementales
Cada robot pertenece a un elemento nativo que interactúa en un ciclo cerrado de efectividad:
$$\text{Fuego (🔥)} \rightarrow \text{Tierra (🪨)} \rightarrow \text{Aire (💨)} \rightarrow \text{Agua (💦)} \rightarrow \text{Fuego (🔥)}$$
* **Ventaja de Elemento:** Inflige **1.5x (150%)** del daño base.
* **Desventaja de Elemento:** Inflige **0.5x (50%)** del daño base.
* **Mismo Elemento / Neutro:** Inflige **1.0x (100%)** del daño base.

---

### B. Combate en Escuadrón Simultáneo (*Party Combat*)
* **Despliegue de Escuadrón:** Hasta **3 robots aliados** luchan al mismo tiempo en la arena sobre pedestales holográficos.
* **Timeline de Iniciativa por Velocidad (⚡ SPD):** Al inicio de cada ronda, todos los combatientes en el campo se ordenan de mayor a menor velocidad.
* **Turno Activo:** La unidad a la que le corresponde actuar se ilumina y puede ejecutar:
  1. **⚔️ Ataques y Habilidades:** Golpes estándar o técnicas especiales con tiempo de recarga (Cooldown).
  2. **🛡️ Defender:** Recupera 5% de HP y reduce a la mitad (50%) el daño recibido en esa ronda.
  3. **🎒 Suministros Tácticos:** Usa objetos de la mochila (Nanobots y Sobrecargas son gratuitos; la Bomba PEM gasta el turno).

---

### C. Matriz de Reacciones y Marcas Elementales
Al usar una habilidad especial, el atacante aplica una **Marca Elemental** (*Marca de Fuego 🔥, Marca de Agua 💦, Marca de Tierra 🪨 o Marca de Aire 💨*) al defensor durante **3 turnos**. Si otro aliado golpea con un elemento complementario, se detona una **Reacción en Cadena**:

* 💦 **Marca de Agua + 🔥 Fuego** $\rightarrow$ **¡Vaporización!** (*Daño crítico duplicado 2.0x*).
* 💦 **Marca de Agua + 🪨 Tierra** $\rightarrow$ **¡Lodo!** (*Daño + Aturdimiento STUN por 1 turno*).
* 💦 **Marca de Agua + 💨 Aire** $\rightarrow$ **¡Ventisca!** (*Daño gélido x1.5*).
* 🔥 **Marca de Fuego + 💨 Aire** $\rightarrow$ **¡Tormenta Ígnea!** (*Daño x1.4 + Quemadura por 2 turnos*).
* 🔥 **Marca de Fuego + 💦 Agua** $\rightarrow$ **¡Choque Térmico!** (*Extinción explosiva x1.75*).
* 🔥 **Marca de Fuego + 🪨 Tierra** $\rightarrow$ **¡Erupción de Magma!** (*Daño x1.5 + Quemadura*).
* 🪨 **Marca de Tierra + 🔥 Fuego** $\rightarrow$ **¡Cristalización!** (*Daño + Barrera de Plasma que bloquea 1 golpe*).
* 🪨 **Marca de Tierra + 💦 Agua** $\rightarrow$ **¡Erosión!** (*Daño x1.5 + El atacante se cura 15% de HP*).
* 🪨 **Marca de Tierra + 💨 Aire** $\rightarrow$ **¡Tormenta de Arena!** (*Daño + Aturdimiento STUN por 1 turno*).
* 💨 **Marca de Aire + 🔥 Fuego** $\rightarrow$ **¡Deflagración!** (*Daño masivo x1.6 + Quemadura*).
* 💨 **Marca de Aire + 💦 Agua** $\rightarrow$ **¡Ciclón Tormentoso!** (*Vórtice acuático x1.6*).
* 💨 **Marca de Aire + 🪨 Tierra** $\rightarrow$ **¡Colapso Sísmico!** (*Daño x1.5 + Aturdimiento STUN por 1 turno*).

---

### D. Centro de Mando: Mochila, Armamento y Chips
Desde la ventana modal de **Mochila (`🎒`)** gestionas los recursos del escuadrón:
1. **Tarjetas de Unidades:** Monitorea HP, ATQ, VEL, nivel, arma equipada y chips instalados.
2. **Armamento Cibernético:**
   * **Daga 🗡️:** 25% (o 40% en +1) de asestar un segundo ataque consecutivo.
   * **Hacha 🪓:** Perfora el 50% (o 75% en +1) de las reducciones por defensa y barreras.
   * **Báculo 🪄:** Autocuración pasiva del 3% (o 5% en +1) del HP máx por turno.
   * **Espada ⚔️:** +15% (o +30% en +1) de Daño base + 10% (o 20% en +1) de Golpe Crítico en Básicos (+50% daño).
   * **🌟 Afinidad Elemental:** Equipar un arma que coincida con el elemento del robot otorga **+20% de HP y +20% de ATQ**.
3. **💾 Chips de Habilidad:** Permiten que un robot aprenda un ataque de otro elemento (*Lanzallamas, Geyser, Fisura, Tornado*) para detonar sus propios combos.
4. **Desmantelamiento:** Cualquier arma no deseada se puede desmantelar por **+20 Chatarra (⚙️)**.

---

### E. Mapa Táctico de la Torre
El avance por la torre consta de 10 pisos con diferentes nodos interactivos:
* 👾 **Combate Normal:** Robots hostiles estándar para ganar XP y chatarra.
* 💀 **Combate Élite:** Rivales poderosos con mutadores (*Espinas, Regenerador, Rabia*) y botín superior garantizado.
* 🎁 **Tesoro / 🛒 Mercado Negro:** Recompensas gratuitas o compras de armas y chips.
* ⛺ **Taller de Reparación:** Permite elegir entre **Reparar Escuadrón (30% HP)**, **Entrenar Robot (+300 XP)** o **Forjar Arma a `+1`**.
* ❓ **Terminal Misteriosa:** Eventos de texto con decisiones interactivas de riesgo y recompensa.

---

## 🏆 3. ¿Cómo se Gana o Termina el Juego?

### 👑 Condición de Victoria (Completar la Incursión)
1. **Llegar al Piso 10 (Cámara del Núcleo):** Superar los 9 pisos previos administrando recursos, vida del escuadrón y sinergias.
2. **Derrotar a TITAN-X (Jefe Supremo):** Un coloso neutral de alto poder (**200 HP / 30 ATQ**) que cuenta con *Golpe Titánico* (1.5x) y el devastador *Protocolo Exterminio* (3.0x de daño masivo).
3. **Pantalla de Victoria:** Al neutralizar a TITAN-X, se despliega la pantalla de **Victoria Táctica Cyberpunk**, certificando el éxito de la misión y liberando el sector.

---

### 💀 Condición de Derrota (Fin de la Partida / Game Over)
* **Caída Total del Escuadrón:** Si en cualquier enfrentamiento o a causa de una **explosión por intento fallido de reclutamiento Élite**, **todos los miembros vivos del escuadrón llegan a 0 HP**, la partida concluye inmediatamente con la pantalla de **Game Over**.
* Al ser un juego de estilo *roguelike*, la derrota reinicia la expedición desde el Piso 1, permitiendo elegir un nuevo robot inicial y explorar rutas distintas en el mapa.
