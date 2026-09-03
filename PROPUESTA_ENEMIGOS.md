# 🤖 CYBER-ELEMENTAL: Documento de Propuesta de Enemigos, Élites y Jefes

Este documento recopila la especificación técnica y de diseño de los **4 Grandes Élites Especiales**, los **8 Enemigos Regulares**, los **7 Jefes de Sector** y la **Estructura de Campaña de 3 Torres**.

---

## 🌆 1. Estructura de Campaña: La Conquista de las 3 Torres

```mermaid
graph LR
    A["Torre 1: Sector Periférico (Piso 1-10)"] -->|Jefe Aleatorio (1 de 6)| B["Torre 2: Sub-Núcleo Industrial (Piso 11-20)"]
    B -->|Jefe Aleatorio (1 de 5 restantes)| C["Torre 3: La Cámara del Núcleo (Piso 21-30)"]
    C -->|Jefe Final Supremo| D["👑 TITAN-OMEGA (Jefe Máximo)"]
```

* **Torre 1 (Pisos 1 al 10):** Enemigos regulares y primeros encuentros Élite individuales. En el Piso 10 aparece **1 Jefe Regional aleatorio** (entre 6 posibles).
* **Torre 2 (Pisos 11 al 20):** Escuadrones mixtos con Élites reforzados. En el Piso 20 aparece un **segundo Jefe Regional aleatorio** (con stats escaladas).
* **Torre 3 (Pisos 21 al 30):** Incursión de máxima dificultad en el corazón del sistema. En el Piso 30 te espera el **Jefe Máximo Supremo: TITAN-OMEGA**.

---

## 💀 2. Los 4 Grandes Élites Especiales (Diseño Refinado)

Estos 4 enemigos representan las amenazas Élite más temibles de la torre, cada uno gobernando un elemento o sinergia híbrida con mecánicas únicas de alto impacto:

---

### 1. 🦍 COLOSO SÍSMICO (Élite de Tierra `🪨`)
* **Icono / Emoji:** `🦍`
* **Elemento:** `🪨` Tierra
* **Rol:** Tanque colosal / Control de Masas Total en Área.
* **Perfil de Stats:** HP Masivo, SPD muy baja (`SPD 3`), ATQ Demoledor (**28 ATQ Base**).
* **Habilidades y Mecánicas:**
  * **💥 Terremoto Cataclísmico (Habilidad en Área - CD: 4):**
    * Golpea con una onda de choque a **todos los contrincantes** a la vez ($1.2\times$ de daño).
    * Aplica **`Aturdimiento (STUN)` garantizado durante 1 turno** a todos los robots golpeados (pierden su siguiente turno).
    * Adhiere **3 `Marcas de Tierra`** a cada objetivo, dejándolos listos para reacciones en cadena de *Cristalización* (`🔥`), *Erosión* (`💦`) o *Tormenta de Arena* (`💨`).
  * **⚔️ Impacto Tectónico (Ataque Normal - CD: 0):**
    * Golpe básico directo individual con multiplicador demoledor de masa tectónica ($1.5\times$ de daño).
* **Peligro en Combate:** Si no se le interrumpe o neutraliza antes de que use su Terremoto, congelará el turno de todo tu escuadrón mientras acumula marcas de tierra letales.
* **Al Reclutarlo:** El mejor iniciador y controlador de masas del juego para voltear combates difíciles.

---

### 2. 👹 BERSERKER TÉRMICO (Élite de Fuego `🔥`)
* **Icono / Emoji:** `👹`
* **Elemento:** `🔥` Fuego
* **Rol:** Daño hiper-creciente / Amenaza crítica en agonía.
* **Perfil de Stats:** HP alto, SPD media, ATQ Base potente (**30 ATQ Base**) que escala exponencialmente con la vida perdida.
* **Habilidades y Mecánicas:**
  * **🔥 Furia Sobrecalentada (Habilidad Pasiva Continua):**
    * No usa habilidades activas con cooldown; todo su poder radica en su transformación pasiva.
    * **Todo el porcentaje de vida perdida se convierte directamente en Daño extra y Probabilidad de Crítico:**
      $$\Delta \text{Daño} = (100\% - \% \text{HP Actual}) \times 1.25$$
      $$\Delta \text{Crítico} = (100\% - \% \text{HP Actual}) \times 0.60$$
      *(Ejemplo: Al 20% de HP, gana +100% de Daño y +48% de Crítico).*
  * **⚔️ Tajo Incandescente (Ataque Normal - CD: 0):**
    * Ataque básico individual de fuego que escala con su pasiva, capaz de infligir impactos críticos descomunales.
  * **Visual / FX:** A medida que su vida baja, se genera y amplifica una **estela y aura roja neón creciente** (`anim-berserk-glow`) alrededor de su avatar.
* **Peligro en Combate:** Dejarlo herido a baja vida sin rematarlo en el mismo turno significa la muerte garantizada de cualquier robot aliado.
* **Al Reclutarlo:** El carry ofensivo más destructivo en batallas largas contra jefes.

---

### 3. 🥷 CYBER-STALKER (Élite de Aire `💨`)
* **Icono / Emoji:** `🥷`
* **Elemento:** `💨` Aire
* **Rol:** Asesino espectral / Evasión Absoluta y Golpe Demoledor.
* **Perfil de Stats:** HP Mínimo (**30 HP Base**), Altísima Velocidad (`SPD 22+`), Evasión base muy alta (40%).
* **Habilidades y Mecánicas:**
  * **👻 Desfase Cuántico (Habilidad Especial - CD: 3):**
    * Aumenta su probabilidad de **Esquiva al 100% durante 1 turno** (inmunidad total a ataques directos en esa ronda).
  * **🗡️ Tajo Asesino de Frecuencia (Ataque Demoledor - CD: 0):**
    * Ataque individual con altísimo multiplicador base ($1.8\times - 2.2\times$) y bonus masivo de penetración de barreras.
* **Peligro en Combate:** Actúa primero por su gran velocidad, esquiva todos tus contraataques en su turno de desfase y elimina objetivos de un solo impacto demoledor.
* **Al Reclutarlo:** Tu mejor ejecutor quirúrgico para aniquilar objetivos prioritarios antes de que puedan reaccionar.

---

### 4. 🧊 CRIO-CENTINELA (Élite Híbrido Agua/Aire `💦💨`)
* **Icono / Emoji:** `🧊`
* **Elemento:** `💦` Agua (Nativo) / `💨` Aire (Ofensivo)
* **Rol:** Controlador de Velocidad y Auto-Detonador de Combos.
* **Perfil de Stats:** HP Alto, SPD media-baja, ATQ equilibrado.
* **Habilidades y Mecánicas:**
  * **❄️ Ventisca de Cero Absoluto (Habilidad en Área - CD: 3):**
    * Golpea a **todos los contrincantes** a la vez.
    * **Reduce la velocidad de todo el escuadrón al mínimo** ($\text{SPD } = 1$) durante **2 turnos**.
    * Aplica **3 `Marcas de Agua`** a todos los objetivos.
  * **💨 Ráfaga Gélida (Ataque Normal - Tipo Aire `💨`):**
    * Su ataque básico individual está catalogado como elemento **Aire (`💨`)**.
    * **Auto-Sinergia Elemental:** Al golpear en turnos siguientes a objetivos que tienen su `Marca de Agua`, **él mismo detona la Reacción de ¡VENTISCA!** ($1.35\times$ de daño extra + Congelación `-20% Precisión`).
* **Peligro en Combate:** Arrebata por completo la iniciativa del timeline a tu escuadrón y luego detona sus propios combos elementales ronda tras ronda.
* **Al Reclutarlo:** Sinergia perfecta para controlar el flujo del combate y abrir combos para el resto de tu equipo.

---

## 📊 Matriz Comparativa de los 4 Grandes Élites

| Icono | Nombre del Élite | Elemento | Rol Principal | Habilidad Especial | Ataque Normal / Pasiva |
|:---:|---|---|---|---|---|
| **`🦍`** | **Coloso Sísmico** | `🪨` Tierra | AoE Stun & Marcas | **Terremoto Cataclísmico:** Daño AoE + Stun 1T a todos + 3 Marcas de Tierra | Ataque pesado de Élite |
| **`👹`** | **Berserker Térmico** | `🔥` Fuego | Daño Agónico Crítico | **Furia Sobrecalentada (Pasiva):** +Daño y +Crítico por % HP perdido + Estela roja | Tajo de Fuego demoledor |
| **`🥷`** | **Cyber-Stalker** | `💨` Aire | Evasión 100% & Asesino | **Desfase Cuántico:** 100% Esquiva por 1 turno | Tajo Asesino masivo |
| **`🧊`** | **Crio-Centinela** | `💦`/`💨` Híbrido | Debuff Velocidad & Combo | **Ventisca Cero:** Daño AoE + SPD al mínimo (2T) + Marcas de Agua | Básico de Aire (Auto-Ventisca) |

---

## 👾 3. Catálogo de los 8 Enemigos Regulares

Los 8 enemigos estándar para combates normales en el ascenso por las torres:

1. **💣 Dron Kamikaze (`🔥`/`⚙️`):** Sonda suicida con temporizador que detona causando daño masivo.
2. **🗿 Baluarte Tectónico (`🪨`):** Escudero pesado que otorga barreras defensivas a sus aliados.
3. **💉 Nanocirujano (`💦`):** Dron médico que cura a sus compañeros y purga estados negativos.
4. **📡 Inhibidor Glitch (`⚙️`/`💨`):** Saboteador que incrementa cooldowns, causa ceguera y retrasa turnos.
5. **🩸 Drenador de Plasma (`💦`/`🪨`):** Unidad de sostenimiento que se cura absorbiendo % del daño infligido.
6. **🎯 Francotirador Gauss (`🔥`/`💨`):** Artillero pesado que telegrafía su disparo láser de alta perforación.
7. **🔮 Mímico Prisma (`⚙️` Adaptable):** Núcleo camaleónico que muta al elemento ventajoso contra su atacante.
8. **🛰️ Matriz Comandante (`⚙️`/`🔥`):** Baliza de soporte que otorga +25% ATQ a su escuadrón e invoca refuerzos.

---

## 👑 4. Catálogo de los 7 Jefes de Sector

---

### 🎲 Jefes Intermedios Regionales (Aleatorios en Torres 1 y 2)

1. **🐲 PYRO-LEVIATHAN (`🔥` Fuego):** Dragón mecha de fusión. Inunda la arena con `Quemadura` global y gana $+10\%$ ATQ con cada golpe no acuático recibido.
2. **🐙 ABYSSAL-KRAKEN (`💦` Agua):** Marea cibernética sumergida. Desata *Tsunamis* que ralentizan en área y levanta triples barreras de plasma.
3. **🏔️ TECTÓN-9000 (`🪨` Tierra):** Fortaleza móvil con blindaje de 100 HP y *Cataclismo Telúrico* telegrafiado con 60% de aturdimiento.
4. **🦅 CYCLONE-VALKYRIE (`💨` Aire):** Caza supersónico con $\text{SPD } 25$ y 40% de evasión que desordena el timeline de iniciativa.
5. **🌋 MAGMATRON-OVERLORD (`🔥`/`🪨` Híbrido):** Fundición viviente que detona erupciones, rompe armaduras y refleja daño con coraza de fuego.
6. **❄️ ZERO-KELVIN (`💦`/`💨` Híbrido):** Glaciar criogénico que congela y manda a todo el escuadrón al final de la ronda de turnos.

---

### 👑 EL JEFE MÁXIMO DEFINITIVO (Torre 3 - Piso 30)

7. **👑 TITAN-OMEGA: NÚCLEO SUPREMO (`⚙️` Omni-Neutro):**
   * **Fase 1 (100% - 66% HP):** Escudos adaptativos y *Golpe Titánico* ($1.5\times$ perforante).
   * **Fase 2 (65% - 33% HP):** Invoca 2 balizas flotantes de soporte y lanza sobrecarga PEM aturdidora global.
   * **Fase 3 (32% - 0% HP):** Aura roja crítica y canaliza el catastrófico **PROTOCOLO EXTERMINIO ($3.0\times$ AoE)** cada 3 turnos.

---

## 🛠️ 5. Próximos Pasos para la Implementación

1. Integrar los 4 Grandes Élites en `js/database.js` y `js/Robot.js` con sus pasivas, ataques AoE y efectos visuales de estela.
2. Configurar en `js/combatSystem.js` la lógica de ataques en área (`target: 'ALL_ENEMIES'`) y estados de 100% de esquiva.
3. Implementar en `js/mapGenerator.js` el pool aleatorio de jefes para Torre 1 y Torre 2, reservando a TITAN-OMEGA para Torre 3.
