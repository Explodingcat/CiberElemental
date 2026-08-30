# 🗄️ Scripts de Base de Datos - Cyber-Elemental (Supabase)

Esta carpeta contiene los scripts SQL necesarios para configurar o restaurar la base de datos de **Cyber-Elemental** en **Supabase**.

---

## 📄 Archivos

* **[`schema.sql`](./schema.sql):** Script completo e idempotente (se puede ejecutar múltiples veces sin borrar datos existentes). Contiene:
  1. Tabla `match_runs` con soporte de `jsonb` para escuadrones, armas y chips.
  2. Columna `player_name` para identificar a los comandantes en el ranking.
  3. Tabla `player_profiles` para guardar la **Chatarra Global** y el **Árbol de Habilidades Desbloqueadas** del jugador.
  4. Índices de aceleración para la consulta del **Top 10 Speedrun**.
  5. Políticas de seguridad **Row Level Security (RLS)** que protegen la privacidad de los usuarios mientras permiten el Leaderboard público de victorias y la meta-progresión personal.

---

## 🚀 ¿Cómo ejecutarlo en Supabase?

1. Entra a tu proyecto en **[Supabase Dashboard](https://supabase.com/dashboard)**.
2. En el menú lateral izquierdo, haz clic en **SQL Editor** (`>_`).
3. Haz clic en **New query** (o `+`).
4. Abre el archivo [`schema.sql`](./schema.sql), copia todo su contenido y pégalo en el editor.
5. Haz clic en el botón verde **Run** (o presiona `Ctrl + Enter`).
6. Verás el mensaje de confirmación `Success. No rows returned`.

---

## ⚡ Configuración de Autenticación Anónima (Obligatorio)

Para que los jugadores no registrados puedan jugar y almacenar su chatarra/partidas con una sesión anónima en Supabase:

1. Ve a **Authentication** -> **Providers** (o **Sign-in Methods**).
2. Busca y activa **Anonymous Sign-in** (Habilitar inicios de sesión anónimos).
3. Guarda los cambios (**Save**).
4. Cuando un usuario anónimo decida registrarse al finalizar una partida, el juego llamará a `supabase.auth.updateUser()` para convertir su cuenta anónima en una cuenta registrada permanente con correo y contraseña, preservando el mismo `user_id` y todo su progreso.

---

## 📋 Estructura de las Tablas

### Tabla `match_runs`

| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | `uuid` | Identificador único de la partida (`PRIMARY KEY`). |
| `user_id` | `uuid` | ID del usuario autenticado en `auth.users`. |
| `player_name` | `text` | Nombre o apodo del comandante para el Leaderboard. |
| `won` | `boolean` | `true` si venció a TITAN-X (Piso 10), `false` si fue Game Over. |
| `floor_reached` | `int` | Piso máximo alcanzado (1 a 10). |
| `duration_seconds` | `int` | Tiempo total transcurrido en la partida (en segundos). |
| `scrap_collected` | `int` | Cantidad de chatarra acumulada al finalizar la partida. |
| `squad` | `jsonb` | Arreglo JSON con robots, elementos, niveles, armas y chips equipados. |
| `created_at` | `timestamptz`| Fecha y hora de creación del registro. |

### Tabla `player_profiles` (Meta-Progresión)

| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `user_id` | `uuid` | ID del usuario autenticado (`PRIMARY KEY REFERENCES auth.users`). |
| `global_scrap` | `int` | Pozo global acumulado de chatarra asociada a la cuenta. |
| `unlocked_skills` | `jsonb` | Lista (array JSON) de IDs de habilidades pasivas desbloqueadas. |
| `updated_at` | `timestamptz`| Última fecha de actualización del perfil y meta-progresión. |

