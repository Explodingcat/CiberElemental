// js/SoundManager.js
// Motor central de audio y música ambiental procedural para Cyber-Elemental
// Diseñado con Web Audio API pura (Cero dependencias externas, cero lag, 100% offline)

const SoundManager = (() => {
    let audioCtx = null;
    let masterGain = null;
    let musicGain = null;
    let sfxGain = null;
    let isInitialized = false;

    // Configuración y persistencia de volumen
    const STORAGE_KEY = 'cyberelemental_audio_config';
    let config = {
        muted: false,
        masterVol: 0.8,
        musicVol: 0.45,
        sfxVol: 0.7
    };

    // Estado del secuenciador de música ambiental
    let currentTrackId = null;
    let musicInterval = null;
    let isMusicPlaying = false;

    // Cargar preferencias guardadas
    function loadConfig() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                config = Object.assign(config, JSON.parse(saved));
            }
        } catch (e) {
            console.warn('[SoundManager] Error al cargar configuración de audio:', e);
        }
    }

    function saveConfig() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        } catch (e) {
            console.warn('[SoundManager] Error al guardar configuración de audio:', e);
        }
    }

    // Inicialización al primer toque/clic (Cumple con las políticas de autoplay de navegadores)
    function init() {
        if (isInitialized && audioCtx) {
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            return;
        }

        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                console.warn('[SoundManager] Web Audio API no soportada.');
                return;
            }

            audioCtx = new AudioContextClass();
            loadConfig();

            // Cadena de Ganancia: [Nodos SFX / Música] -> [sfxGain / musicGain] -> [masterGain] -> [Destination]
            masterGain = audioCtx.createGain();
            musicGain = audioCtx.createGain();
            sfxGain = audioCtx.createGain();

            updateVolumes();

            musicGain.connect(masterGain);
            sfxGain.connect(masterGain);
            masterGain.connect(audioCtx.destination);

            isInitialized = true;

            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            console.log('[SoundManager] Motor de audio sintetizado inicializado correctamente.');
        } catch (err) {
            console.error('[SoundManager] Error al inicializar Web Audio API:', err);
        }
    }

    function ensureContext() {
        if (!isInitialized || !audioCtx) {
            init();
        } else if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    function updateVolumes() {
        if (!masterGain || !musicGain || !sfxGain || !audioCtx) return;
        const now = audioCtx.currentTime;
        const effectiveMaster = config.muted ? 0 : config.masterVol;
        masterGain.gain.cancelScheduledValues(now);
        masterGain.gain.setValueAtTime(masterGain.gain.value, now);
        masterGain.gain.linearRampToValueAtTime(effectiveMaster, now + 0.05);

        musicGain.gain.cancelScheduledValues(now);
        musicGain.gain.setValueAtTime(musicGain.gain.value, now);
        musicGain.gain.linearRampToValueAtTime(config.musicVol, now + 0.05);

        sfxGain.gain.cancelScheduledValues(now);
        sfxGain.gain.setValueAtTime(sfxGain.gain.value, now);
        sfxGain.gain.linearRampToValueAtTime(config.sfxVol, now + 0.05);
    }

    // Audio Ducking temporal (bajar la música momentáneamente ante un impacto fuerte)
    function duckMusic(factor = 0.35, duration = 0.4) {
        if (!musicGain || !audioCtx || config.muted) return;
        const now = audioCtx.currentTime;
        musicGain.gain.cancelScheduledValues(now);
        musicGain.gain.setValueAtTime(musicGain.gain.value, now);
        musicGain.gain.linearRampToValueAtTime(config.musicVol * factor, now + 0.03);
        musicGain.gain.linearRampToValueAtTime(config.musicVol, now + duration);
    }

    // Generador de ruido blanco sintetizado
    function createNoiseBuffer(duration = 0.5) {
        if (!audioCtx) return null;
        const bufferSize = audioCtx.sampleRate * duration;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    // ==========================================
    // SÍNTESIS DE EFECTOS DE SONIDO (SFX)
    // ==========================================
    const SFX_SYNTHS = {
        // --- 1. Interfaz y Menús ---
        ui_hover: () => {
            const ctx = ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, now);
            osc.frequency.exponentialRampToValueAtTime(1600, now + 0.025);

            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

            osc.connect(gain);
            gain.connect(sfxGain);
            osc.start(now);
            osc.stop(now + 0.025);
        },

        ui_click: () => {
            const ctx = ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

            osc.connect(gain);
            gain.connect(sfxGain);
            osc.start(now);
            osc.stop(now + 0.07);
        },

        ui_cancel: () => {
            const ctx = ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(520, now);
            osc.frequency.exponentialRampToValueAtTime(260, now + 0.09);

            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

            osc.connect(gain);
            gain.connect(sfxGain);
            osc.start(now);
            osc.stop(now + 0.09);
        },

        ui_modal_open: () => {
            const ctx = ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            
            const osc = ctx.createOscillator();
            const oscGain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(640, now + 0.12);

            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, now);
            filter.frequency.linearRampToValueAtTime(2200, now + 0.12);

            oscGain.gain.setValueAtTime(0.12, now);
            oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

            osc.connect(filter);
            filter.connect(oscGain);
            oscGain.connect(sfxGain);
            osc.start(now);
            osc.stop(now + 0.14);
        },

        ui_modal_close: () => {
            const ctx = ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            
            const osc = ctx.createOscillator();
            const oscGain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(540, now);
            osc.frequency.exponentialRampToValueAtTime(140, now + 0.11);

            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1800, now);
            filter.frequency.linearRampToValueAtTime(400, now + 0.11);

            oscGain.gain.setValueAtTime(0.1, now);
            oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

            osc.connect(filter);
            filter.connect(oscGain);
            oscGain.connect(sfxGain);
            osc.start(now);
            osc.stop(now + 0.12);
        },

        ui_equip: () => {
            const ctx = ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();

            osc1.type = 'triangle';
            osc1.frequency.setValueAtTime(320, now);
            osc1.frequency.exponentialRampToValueAtTime(960, now + 0.05);

            osc2.type = 'square';
            osc2.frequency.setValueAtTime(800, now + 0.05);
            osc2.frequency.exponentialRampToValueAtTime(1200, now + 0.1);

            gain.gain.setValueAtTime(0.22, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(sfxGain);

            osc1.start(now);
            osc1.stop(now + 0.06);
            osc2.start(now + 0.05);
            osc2.stop(now + 0.13);
        },

        ui_scrap: () => {
            const ctx = ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            [1480, 1960].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const t = now + i * 0.04;

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, t);

                gain.gain.setValueAtTime(0.15, t);
                gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);

                osc.connect(gain);
                gain.connect(sfxGain);
                osc.start(t);
                osc.stop(t + 0.09);
            });
        },

        // --- 2. Acciones del Mapa y Eventos ---
        map_node_select: () => {
            const ctx = ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(784, now);
            osc.frequency.exponentialRampToValueAtTime(1046, now + 0.08);

            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

            osc.connect(gain);
            gain.connect(sfxGain);
            osc.start(now);
            osc.stop(now + 0.22);
        },

        chest_open: () => {
            const ctx = ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            const chords = [523.25, 659.25, 783.99, 1046.50];
            chords.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const t = now + idx * 0.06;

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, t);

                gain.gain.setValueAtTime(0.2, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

                osc.connect(gain);
                gain.connect(sfxGain);
                osc.start(t);
                osc.stop(t + 0.4);
            });
        },

        camp_repair: () => {
            const ctx = ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            const buffer = createNoiseBuffer(0.25);
            if (buffer) {
                const noise = ctx.createBufferSource();
                noise.buffer = buffer;
                const filter = ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(3200, now);
                filter.Q.setValueAtTime(3, now);

                const nGain = ctx.createGain();
                nGain.gain.setValueAtTime(0.18, now);
                nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

                noise.connect(filter);
                filter.connect(nGain);
                nGain.connect(sfxGain);
                noise.start(now);
            }

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(220, now + 0.1);
            osc.frequency.exponentialRampToValueAtTime(660, now + 0.35);

            gain.gain.setValueAtTime(0.2, now + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

            osc.connect(gain);
            gain.connect(sfxGain);
            osc.start(now + 0.1);
            osc.stop(now + 0.4);
        },

        shop_buy: () => {
            const ctx = ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            [587.33, 880, 1174.66].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const t = now + idx * 0.05;

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, t);

                gain.gain.setValueAtTime(0.2, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

                osc.connect(gain);
                gain.connect(sfxGain);
                osc.start(t);
                osc.stop(t + 0.16);
            });
        },

        // --- 3. Combate, Habilidades e Impactos ---
        combat_turn_start: () => {
            const ctx = ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.setValueAtTime(1174.66, now + 0.04);

            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

            osc.connect(gain);
            gain.connect(sfxGain);
            osc.start(now);
            osc.stop(now + 0.09);
        },

        attack_fire: () => {
            const ctx = ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            const osc = ctx.createOscillator();
            const filter = ctx.createBiquadFilter();
            const gain = ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(260, now);
            osc.frequency.exponentialRampToValueAtTime(70, now + 0.22);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1400, now);
            filter.frequency.linearRampToValueAtTime(300, now + 0.22);

            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(sfxGain);
            osc.start(now);
            osc.stop(now + 0.24);
        },

        attack_water: () => {
            const ctx = ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(450, now);
            osc.frequency.linearRampToValueAtTime(850, now + 0.08);
            osc.frequency.exponentialRampToValueAtTime(180, now + 0.2);

            gain.gain.setValueAtTime(0.28, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

            osc.connect(gain);
            gain.connect(sfxGain);
            osc.start(now);
            osc.stop(now + 0.22);
        },

        attack_earth: () => {
            const ctx = ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(35, now + 0.25);

            gain.gain.setValueAtTime(0.45, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

            osc.connect(gain);
            gain.connect(sfxGain);
            osc.start(now);
            osc.stop(now + 0.28);
        },

        attack_air: () => {
            const ctx = ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            const osc = ctx.createOscillator();
            const filter = ctx.createBiquadFilter();
            const gain = ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(900, now);
            osc.frequency.exponentialRampToValueAtTime(2400, now + 0.06);
            osc.frequency.exponentialRampToValueAtTime(400, now + 0.16);

            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1600, now);
            filter.Q.setValueAtTime(2, now);

            gain.gain.setValueAtTime(0.26, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(sfxGain);
            osc.start(now);
            osc.stop(now + 0.18);
        },

        hit_normal: () => {
            const ctx = ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

            osc.connect(gain);
            gain.connect(sfxGain);
            osc.start(now);
            osc.stop(now + 0.14);
        },

        hit_crit: () => {
            const ctx = ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            duckMusic(0.2, 0.5);

            // 1. Sub-punch
            const oscSub = ctx.createOscillator();
            const gainSub = ctx.createGain();
            oscSub.type = 'triangle';
            oscSub.frequency.setValueAtTime(160, now);
            oscSub.frequency.exponentialRampToValueAtTime(30, now + 0.35);

            gainSub.gain.setValueAtTime(0.5, now);
            gainSub.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

            oscSub.connect(gainSub);
            gainSub.connect(sfxGain);
            oscSub.start(now);
            oscSub.stop(now + 0.38);

            // 2. Crujido eléctrico
            const oscElect = ctx.createOscillator();
            const gainElect = ctx.createGain();
            oscElect.type = 'sawtooth';
            oscElect.frequency.setValueAtTime(800, now);
            oscElect.frequency.exponentialRampToValueAtTime(120, now + 0.18);

            gainElect.gain.setValueAtTime(0.35, now);
            gainElect.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

            oscElect.connect(gainElect);
            gainElect.connect(sfxGain);
            oscElect.start(now);
            oscElect.stop(now + 0.2);
        },

        dodge: () => {
            const ctx = ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            const osc = ctx.createOscillator();
            const filter = ctx.createBiquadFilter();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.linearRampToValueAtTime(900, now + 0.08);
            osc.frequency.linearRampToValueAtTime(450, now + 0.16);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1200, now);

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(sfxGain);
            osc.start(now);
            osc.stop(now + 0.18);
        },

        shield_up: () => {
            const ctx = ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(660, now + 0.15);

            gain.gain.setValueAtTime(0.28, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

            osc.connect(gain);
            gain.connect(sfxGain);
            osc.start(now);
            osc.stop(now + 0.3);
        },

        elemental_reaction: () => {
            const ctx = ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            duckMusic(0.2, 0.6);

            const notes = [440, 554.37, 659.25, 880];
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const t = now + idx * 0.04;

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, t);

                gain.gain.setValueAtTime(0.24, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

                osc.connect(gain);
                gain.connect(sfxGain);
                osc.start(t);
                osc.stop(t + 0.35);
            });

            const oscExp = ctx.createOscillator();
            const gainExp = ctx.createGain();
            oscExp.type = 'sawtooth';
            oscExp.frequency.setValueAtTime(280, now);
            oscExp.frequency.exponentialRampToValueAtTime(50, now + 0.28);

            gainExp.gain.setValueAtTime(0.3, now);
            gainExp.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

            oscExp.connect(gainExp);
            gainExp.connect(sfxGain);
            oscExp.start(now);
            oscExp.stop(now + 0.3);
        },

        combo_vaporize: () => {
            const ctx = ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            duckMusic(0.15, 0.7);

            // 1. Explosión de fuego/térmica
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            osc.connect(gain);
            gain.connect(sfxGain);
            osc.start(now);
            osc.stop(now + 0.4);

            // 2. Silbido de vapor a presión (Noise + Bandpass)
            const noise = createNoiseBuffer(0.6);
            if (noise) {
                const src = ctx.createBufferSource();
                src.buffer = noise;
                const filter = ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(1200, now);
                filter.frequency.exponentialRampToValueAtTime(3400, now + 0.3);
                filter.Q.value = 3.0;
                const nGain = ctx.createGain();
                nGain.gain.setValueAtTime(0.35, now);
                nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
                src.connect(filter);
                filter.connect(nGain);
                nGain.connect(sfxGain);
                src.start(now + 0.05);
                src.stop(now + 0.65);
            }
        },

        combo_frost: () => {
            const ctx = ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            duckMusic(0.15, 0.7);

            // Cristal / Hielo rompiéndose (Triangles armónicos agudos)
            [880, 1318.51, 1760, 2637].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const t = now + idx * 0.025;
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, t);
                osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.3);
                gain.gain.setValueAtTime(0.28, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
                osc.connect(gain);
                gain.connect(sfxGain);
                osc.start(t);
                osc.stop(t + 0.35);
            });

            // Viento gélido
            const noise = createNoiseBuffer(0.5);
            if (noise) {
                const src = ctx.createBufferSource();
                src.buffer = noise;
                const filter = ctx.createBiquadFilter();
                filter.type = 'highpass';
                filter.frequency.setValueAtTime(2000, now);
                const nGain = ctx.createGain();
                nGain.gain.setValueAtTime(0.25, now);
                nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                src.connect(filter);
                filter.connect(nGain);
                nGain.connect(sfxGain);
                src.start(now);
                src.stop(now + 0.5);
            }
        },

        combo_quake: () => {
            const ctx = ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            duckMusic(0.1, 0.8);

            // Sub-bass telúrico
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(25, now + 0.6);
            gain.gain.setValueAtTime(0.55, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
            osc.connect(gain);
            gain.connect(sfxGain);
            osc.start(now);
            osc.stop(now + 0.65);

            // Rumble de rocas (Noise Lowpass)
            const noise = createNoiseBuffer(0.65);
            if (noise) {
                const src = ctx.createBufferSource();
                src.buffer = noise;
                const filter = ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(300, now);
                const nGain = ctx.createGain();
                nGain.gain.setValueAtTime(0.45, now);
                nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
                src.connect(filter);
                filter.connect(nGain);
                nGain.connect(sfxGain);
                src.start(now);
                src.stop(now + 0.65);
            }
        },

        combo_firestorm: () => {
            const ctx = ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            duckMusic(0.15, 0.7);

            // Vórtice de fuego
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.linearRampToValueAtTime(520, now + 0.25);
            osc.frequency.exponentialRampToValueAtTime(80, now + 0.5);
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
            osc.connect(gain);
            gain.connect(sfxGain);
            osc.start(now);
            osc.stop(now + 0.55);
        },

        combo_cyclone: () => {
            const ctx = ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            duckMusic(0.15, 0.7);

            // Viento arremolinado
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(250, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);
            osc.frequency.exponentialRampToValueAtTime(180, now + 0.5);
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
            osc.connect(gain);
            gain.connect(sfxGain);
            osc.start(now);
            osc.stop(now + 0.55);
        },

        combo_crystal: () => {
            const ctx = ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            duckMusic(0.15, 0.7);

            // Acordes cristalinos prismáticos
            [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const t = now + idx * 0.04;
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, t);
                gain.gain.setValueAtTime(0.25, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
                osc.connect(gain);
                gain.connect(sfxGain);
                osc.start(t);
                osc.stop(t + 0.5);
            });
        },

        combo_plasma: () => {
            const ctx = ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            duckMusic(0.12, 0.75);

            // Descarga de plasma láser y anulación
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(950, now);
            osc.frequency.exponentialRampToValueAtTime(120, now + 0.4);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
            osc.connect(gain);
            gain.connect(sfxGain);
            osc.start(now);
            osc.stop(now + 0.45);
        },

        item_heal: () => {
            const ctx = ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            [392, 523.25, 659.25, 783.99].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const t = now + i * 0.05;

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, t);

                gain.gain.setValueAtTime(0.22, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

                osc.connect(gain);
                gain.connect(sfxGain);
                osc.start(t);
                osc.stop(t + 0.28);
            });
        },

        item_emp: () => {
            const ctx = ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            duckMusic(0.15, 0.6);

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(1200, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);

            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(800, now);
            filter.Q.setValueAtTime(4, now);

            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(sfxGain);
            osc.start(now);
            osc.stop(now + 0.45);
        },

        item_overcharge: () => {
            const ctx = ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(110, now);
            osc.frequency.exponentialRampToValueAtTime(550, now + 0.2);

            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

            osc.connect(gain);
            gain.connect(sfxGain);
            osc.start(now);
            osc.stop(now + 0.25);
        },

        robot_death: () => {
            const ctx = ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            duckMusic(0.2, 0.5);

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(25, now + 0.45);

            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

            osc.connect(gain);
            gain.connect(sfxGain);
            osc.start(now);
            osc.stop(now + 0.48);
        },

        titan_protocol: () => {
            const ctx = ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            duckMusic(0.1, 1.2);

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(60, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.7);

            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0.5, now + 0.65);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

            osc.connect(gain);
            gain.connect(sfxGain);
            osc.start(now);
            osc.stop(now + 0.85);
        },

        ultimate_activate: () => {
            const ctx = ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            duckMusic(0.1, 1.5);

            // Capa 1: Crecendo brillante ascendente
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(220, now);
            osc1.frequency.exponentialRampToValueAtTime(880, now + 0.35);
            osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.7);

            gain1.gain.setValueAtTime(0.05, now);
            gain1.gain.linearRampToValueAtTime(0.4, now + 0.4);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

            osc1.connect(gain1);
            gain1.connect(sfxGain);
            osc1.start(now);
            osc1.stop(now + 0.9);

            // Capa 2: Impacto armónico grave
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(110, now + 0.35);
            osc2.frequency.exponentialRampToValueAtTime(55, now + 0.85);

            gain2.gain.setValueAtTime(0.45, now + 0.35);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.95);

            osc2.connect(gain2);
            gain2.connect(sfxGain);
            osc2.start(now + 0.35);
            osc2.stop(now + 0.95);
        },

        ultimate_charge: () => {
            const ctx = ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

            osc.connect(gain);
            gain.connect(sfxGain);
            osc.start(now);
            osc.stop(now + 0.25);
        }
    };

    function play(sfxName) {
        if (config.muted) return;
        try {
            if (SFX_SYNTHS[sfxName]) {
                SFX_SYNTHS[sfxName]();
            }
        } catch (e) {
            console.warn(`[SoundManager] Error al reproducir SFX: ${sfxName}`, e);
        }
    }

    // ==========================================
    // MOTOR DE MÚSICA AMBIENTAL PROCEDURAL
    // ==========================================
    function playSynthNote(freq, type = 'sawtooth', duration = 0.3, vol = 0.15, filterFreq = 1200) {
        if (!audioCtx || config.muted) return;
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(filterFreq, now);

        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(musicGain);

        osc.start(now);
        osc.stop(now + duration);
    }

    function playDrum(drumType = 'kick') {
        if (!audioCtx || config.muted) return;
        const now = audioCtx.currentTime;

        if (drumType === 'kick') {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(130, now);
            osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);

            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

            osc.connect(gain);
            gain.connect(musicGain);
            osc.start(now);
            osc.stop(now + 0.14);
        } else if (drumType === 'snare') {
            const buffer = createNoiseBuffer(0.12);
            if (buffer) {
                const noise = audioCtx.createBufferSource();
                noise.buffer = buffer;
                const filter = audioCtx.createBiquadFilter();
                filter.type = 'highpass';
                filter.frequency.setValueAtTime(1000, now);

                const gain = audioCtx.createGain();
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

                noise.connect(filter);
                filter.connect(gain);
                gain.connect(musicGain);
                noise.start(now);
            }
        } else if (drumType === 'hat') {
            const buffer = createNoiseBuffer(0.03);
            if (buffer) {
                const noise = audioCtx.createBufferSource();
                noise.buffer = buffer;
                const filter = audioCtx.createBiquadFilter();
                filter.type = 'highpass';
                filter.frequency.setValueAtTime(5000, now);

                const gain = audioCtx.createGain();
                gain.gain.setValueAtTime(0.06, now);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

                noise.connect(filter);
                filter.connect(gain);
                gain.connect(musicGain);
                noise.start(now);
            }
        }
    }

    const N = {
        C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.00, B2: 123.47,
        C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
        C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
        C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
        Eb2: 77.78, Gb2: 92.50, Ab2: 103.83, Eb5: 622.25
    };

    const TRACK_DEFINITIONS = {
        TITLE_THEME: {
            bpm: 95,
            steps: 16,
            stepIntervalMs: (60 / 95 / 2) * 1000,
            tick: (step) => {
                const bassPattern = [
                    N.A2, N.A2, N.A3, N.A2,
                    N.F2, N.F2, N.F3, N.F2,
                    N.C2, N.C2, N.C3, N.C2,
                    N.G2, N.G2, N.G3, N.G2
                ];
                playSynthNote(bassPattern[step % 16], 'sawtooth', 0.22, 0.16, 600);

                const arp = [
                    N.A4, N.C5, N.E5, N.A5,
                    N.F4, N.A4, N.C5, N.F5,
                    N.C4, N.E4, N.G4, N.C5,
                    N.G4, N.B4, N.D5, N.G5
                ];
                if (step % 2 === 0) {
                    playSynthNote(arp[step % 16], 'triangle', 0.28, 0.1, 1400);
                }

                if (step % 2 === 1) {
                    playDrum('hat');
                }
            }
        },

        MAP_THEME: {
            bpm: 80,
            steps: 16,
            stepIntervalMs: (60 / 80 / 2) * 1000,
            tick: (step) => {
                if (step === 0 || step === 8) {
                    playSynthNote(N.C2, 'sine', 1.8, 0.22, 350);
                    playSynthNote(N.G2, 'triangle', 1.6, 0.12, 450);
                }
                if (step === 4 || step === 12) {
                    playSynthNote(N.C5, 'sine', 0.4, 0.08, 2400);
                }
                if (step % 4 === 2) {
                    playDrum('hat');
                }
            }
        },

        COMBAT_NORMAL: {
            bpm: 120,
            steps: 16,
            stepIntervalMs: (60 / 120 / 4) * 1000,
            tick: (step) => {
                if (step % 4 === 0) {
                    playDrum('kick');
                }
                if (step === 4 || step === 12) {
                    playDrum('snare');
                }
                if (step % 2 === 1) {
                    playDrum('hat');
                }

                const bassNotes = [
                    N.D2, N.D2, N.D3, N.D2,
                    N.F2, N.D2, N.A2, N.D2,
                    N.C2, N.D2, N.D3, N.D2,
                    N.E2, N.F2, N.G2, N.A2
                ];
                playSynthNote(bassNotes[step % 16], 'sawtooth', 0.14, 0.2, 900);

                if (step === 2 || step === 6 || step === 10 || step === 14) {
                    const leadNotes = [N.D4, N.F4, N.A4, N.D5];
                    playSynthNote(leadNotes[Math.floor(step / 4)], 'square', 0.18, 0.09, 1800);
                }
            }
        },

        COMBAT_BOSS: {
            bpm: 132,
            steps: 16,
            stepIntervalMs: (60 / 132 / 4) * 1000,
            tick: (step) => {
                if (step === 0 || step === 3 || step === 8 || step === 11) {
                    playDrum('kick');
                }
                if (step === 4 || step === 12) {
                    playDrum('snare');
                }
                playDrum('hat');

                const bossBass = [
                    N.C2, N.C2, N.C2, N.Eb2,
                    N.C2, N.C2, N.G2, N.C2,
                    N.Ab2, N.Ab2, N.G2, N.G2,
                    N.F2, N.Gb2, N.G2, N.B2
                ];
                playSynthNote(bossBass[step % 16], 'sawtooth', 0.16, 0.26, 1400);

                if (step % 2 === 0) {
                    const fastArp = [N.C5, N.G4, N.Eb5, N.C5];
                    playSynthNote(fastArp[(step / 2) % 4], 'sawtooth', 0.1, 0.12, 2200);
                }
            }
        },

        REST_LOUNGE: {
            bpm: 75,
            steps: 16,
            stepIntervalMs: (60 / 75 / 2) * 1000,
            tick: (step) => {
                if (step === 0) {
                    playSynthNote(N.F3, 'sine', 1.8, 0.14, 500);
                    playSynthNote(N.A3, 'triangle', 1.8, 0.1, 700);
                    playSynthNote(N.C4, 'sine', 1.8, 0.08, 900);
                } else if (step === 8) {
                    playSynthNote(N.D3, 'sine', 1.8, 0.14, 500);
                    playSynthNote(N.F3, 'triangle', 1.8, 0.1, 700);
                    playSynthNote(N.A3, 'sine', 1.8, 0.08, 900);
                }
                if (step % 4 === 2) {
                    playDrum('hat');
                }
            }
        },

        VICTORY_FANFARE: {
            bpm: 128,
            steps: 16,
            stepIntervalMs: (60 / 128 / 2) * 1000,
            tick: (step) => {
                const victoryNotes = [
                    N.C4, N.E4, N.G4, N.C5,
                    N.F4, N.A4, N.C5, N.F5,
                    N.G4, N.B4, N.D5, N.G5,
                    N.C5, N.E5, N.G5, N.C5
                ];
                playSynthNote(victoryNotes[step % 16], 'triangle', 0.35, 0.22, 2000);
                if (step % 4 === 0) playDrum('kick');
                if (step % 2 === 1) playDrum('hat');
            }
        },

        GAMEOVER_THEME: {
            bpm: 60,
            steps: 8,
            stepIntervalMs: 600,
            tick: (step) => {
                if (step === 0) {
                    const ctx = ensureContext();
                    if (!ctx) return;
                    const now = ctx.currentTime;
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(220, now);
                    osc.frequency.exponentialRampToValueAtTime(30, now + 1.6);

                    gain.gain.setValueAtTime(0.3, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

                    osc.connect(gain);
                    gain.connect(musicGain);
                    osc.start(now);
                    osc.stop(now + 1.8);
                }
            }
        }
    };

    function playMusic(trackId) {
        if (!TRACK_DEFINITIONS[trackId]) {
            console.warn(`[SoundManager] Pista desconocida: ${trackId}`);
            return;
        }

        if (currentTrackId === trackId && isMusicPlaying) {
            return;
        }

        stopMusic();
        currentTrackId = trackId;
        const track = TRACK_DEFINITIONS[trackId];
        let currentStep = 0;

        ensureContext();
        isMusicPlaying = true;

        track.tick(currentStep);
        currentStep = (currentStep + 1) % track.steps;

        musicInterval = setInterval(() => {
            if (!isMusicPlaying) return;
            track.tick(currentStep);
            currentStep = (currentStep + 1) % track.steps;
        }, track.stepIntervalMs);
    }

    function stopMusic() {
        if (musicInterval) {
            clearInterval(musicInterval);
            musicInterval = null;
        }
        isMusicPlaying = false;
        currentTrackId = null;
    }

    // ==========================================
    // API PÚBLICA DE CONTROL DE CONFIGURACIÓN
    // ==========================================
    function toggleMute() {
        config.muted = !config.muted;
        saveConfig();
        updateVolumes();
        updateMuteButtonUI();
        return config.muted;
    }

    function setMasterVolume(vol) {
        config.masterVol = Math.max(0, Math.min(1, vol));
        saveConfig();
        updateVolumes();
    }

    function setMusicVolume(vol) {
        config.musicVol = Math.max(0, Math.min(1, vol));
        saveConfig();
        updateVolumes();
    }

    function setSfxVolume(vol) {
        config.sfxVol = Math.max(0, Math.min(1, vol));
        saveConfig();
        updateVolumes();
    }

    function getConfig() {
        return { ...config };
    }

    function updateMuteButtonUI() {
        const topBtn = document.getElementById('btn-audio-toggle');
        if (topBtn) {
            topBtn.innerHTML = config.muted 
                ? '<span class="audio-icon muted">🔇</span>' 
                : '<span class="audio-icon">🔊</span>';
            topBtn.title = config.muted ? 'Sonido Silenciado (Clic para activar)' : 'Sonido Activado (Clic para silenciar)';
        }

        const modalToggle = document.getElementById('audio-modal-mute-toggle');
        if (modalToggle) {
            modalToggle.checked = !config.muted;
        }
    }

    function openAudioSettingsModal() {
        const modal = document.getElementById('modal-audio-settings');
        if (!modal) return;
        const masterSlider = document.getElementById('audio-slider-master');
        const musicSlider = document.getElementById('audio-slider-music');
        const sfxSlider = document.getElementById('audio-slider-sfx');
        const muteToggle = document.getElementById('audio-modal-mute-toggle');
        const valMaster = document.getElementById('audio-val-master');
        const valMusic = document.getElementById('audio-val-music');
        const valSfx = document.getElementById('audio-val-sfx');

        if (masterSlider) masterSlider.value = Math.round(config.masterVol * 100);
        if (musicSlider) musicSlider.value = Math.round(config.musicVol * 100);
        if (sfxSlider) sfxSlider.value = Math.round(config.sfxVol * 100);
        if (muteToggle) muteToggle.checked = !config.muted;
        if (valMaster) valMaster.innerText = `${Math.round(config.masterVol * 100)}%`;
        if (valMusic) valMusic.innerText = `${Math.round(config.musicVol * 100)}%`;
        if (valSfx) valSfx.innerText = `${Math.round(config.sfxVol * 100)}%`;

        modal.style.display = 'flex';
        play('ui_modal_open');
    }

    function closeAudioSettingsModal() {
        const modal = document.getElementById('modal-audio-settings');
        if (modal) {
            modal.style.display = 'none';
            play('ui_modal_close');
        }
    }

    function onAudioMasterSliderChange(val) {
        const num = parseInt(val, 10) / 100;
        setMasterVolume(num);
        const valEl = document.getElementById('audio-val-master');
        if (valEl) valEl.innerText = `${val}%`;
    }

    function onAudioMusicSliderChange(val) {
        const num = parseInt(val, 10) / 100;
        setMusicVolume(num);
        const valEl = document.getElementById('audio-val-music');
        if (valEl) valEl.innerText = `${val}%`;
    }

    function onAudioSfxSliderChange(val) {
        const num = parseInt(val, 10) / 100;
        setSfxVolume(num);
        const valEl = document.getElementById('audio-val-sfx');
        if (valEl) valEl.innerText = `${val}%`;
    }

    // Auto-desbloqueo de audio en cualquier interacción inicial
    if (typeof window !== 'undefined') {
        const unlockAudio = () => {
            init();
            window.removeEventListener('pointerdown', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
            window.removeEventListener('click', unlockAudio);
        };
        window.addEventListener('pointerdown', unlockAudio, { passive: true });
        window.addEventListener('keydown', unlockAudio, { passive: true });
        window.addEventListener('click', unlockAudio, { passive: true });
    }

    return {
        init,
        play,
        playMusic,
        stopMusic,
        duckMusic,
        toggleMute,
        setMasterVolume,
        setMusicVolume,
        setSfxVolume,
        getConfig,
        updateMuteButtonUI,
        openAudioSettingsModal,
        closeAudioSettingsModal,
        onAudioMasterSliderChange,
        onAudioMusicSliderChange,
        onAudioSfxSliderChange
    };
})();

// Exportación global
window.SoundManager = SoundManager;
window.openAudioSettingsModal = SoundManager.openAudioSettingsModal;
window.closeAudioSettingsModal = SoundManager.closeAudioSettingsModal;
window.onAudioMasterSliderChange = SoundManager.onAudioMasterSliderChange;
window.onAudioMusicSliderChange = SoundManager.onAudioMusicSliderChange;
window.onAudioSfxSliderChange = SoundManager.onAudioSfxSliderChange;

