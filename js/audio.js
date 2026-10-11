// ============================================================
//  SISTEMA DE AUDIO v2
//  - SFX con capas + variación aleatoria
//  - 3 pistas bien diferenciadas con variación por compás
//  - Ambiente por escenario
//  - Tecla M para mute
// ============================================================

let audioCtx = null;
let masterGain = null;
let musicGain = null;
let sfxGain = null;
let ambientGain = null;

let muted = false;
let volumenMaestro = 0.9;
let musicaActual = null;
let musicaTimer = null;
let ambientActual = null;
let ambientTimer = null;

// ------------------------------------------------------------
//  INICIALIZACIÓN
// ------------------------------------------------------------
function initAudio() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    masterGain = audioCtx.createGain();
    masterGain.gain.value = volumenMaestro;
    masterGain.connect(audioCtx.destination);

    musicGain = audioCtx.createGain();
    musicGain.gain.value = 0.38;
    musicGain.connect(masterGain);

    sfxGain = audioCtx.createGain();
    sfxGain.gain.value = 1.20;
    sfxGain.connect(masterGain);

    ambientGain = audioCtx.createGain();
    ambientGain.gain.value = 0.22;
    ambientGain.connect(masterGain);
  } catch (e) {
    console.warn('Audio no disponible:', e);
  }
}

function toggleMute() {
  muted = !muted;
  if (masterGain) masterGain.gain.value = muted ? 0 : volumenMaestro;
  return muted;
}

// ------------------------------------------------------------
//  UTILIDADES DE SÍNTESIS
// ------------------------------------------------------------
function ruidoBlanco(dur, vol, filtroFreq, gainNode, filtroTipo) {
  if (!audioCtx) return;
  vol = vol || 0.1;
  filtroFreq = filtroFreq || 2000;
  gainNode = gainNode || sfxGain;
  filtroTipo = filtroTipo || 'bandpass';
  try {
    const t = audioCtx.currentTime;
    const bufferSize = Math.max(1, Math.floor(audioCtx.sampleRate * dur));
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = filtroTipo;
    filter.frequency.value = filtroFreq;
    filter.Q.value = 1.2;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filter).connect(g).connect(gainNode);
    src.start(t);
    src.stop(t + dur);
  } catch (e) {}
}

function tono(f1, f2, dur, type, vol, gainNode, attack) {
  if (!audioCtx) return;
  type = type || 'square';
  vol = vol || 0.07;
  gainNode = gainNode || sfxGain;
  attack = attack || 0.005;
  try {
    const t = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f1, t);
    if (f2 && f2 !== f1) {
      o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
    }
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(gainNode);
    o.start(t);
    o.stop(t + dur);
  } catch (e) {}
}

// Aleatoriedad para que no suenen idénticos
function rand(min, max) { return min + Math.random() * (max - min); }

// ------------------------------------------------------------
//  SFX MEJORADOS v2 (con capas + variación)
// ------------------------------------------------------------
const SFX = {
  // PUÑETAZO: crujido seco + golpe grave + aire cortado
  punch: function() {
    const vol = rand(0.85, 1.15);
    // Capa 1: click agudo (el contacto)
    ruidoBlanco(0.02, 0.14 * vol, 3500, sfxGain, 'highpass');
    // Capa 2: impacto grave (el peso)
    tono(rand(220, 260), 90, 0.09, 'triangle', 0.12 * vol);
    // Capa 3: aire cortado
    ruidoBlanco(0.06, 0.08 * vol, 1800);
  },

  // PATADA: impacto más grave + aire largo
  kick: function() {
    const vol = rand(0.85, 1.15);
    // Capa 1: click
    ruidoBlanco(0.025, 0.12 * vol, 2500, sfxGain, 'highpass');
    // Capa 2: golpe grave potente
    tono(rand(160, 200), 60, 0.14, 'triangle', 0.16 * vol);
    tono(rand(80, 100), 40, 0.18, 'sine', 0.12 * vol);
    // Capa 3: aire largo
    ruidoBlanco(0.12, 0.07 * vol, 1200);
  },

  // UPPERCUT: barrido ascendente + impacto
  upper: function() {
    const vol = rand(0.9, 1.1);
    // Capa 1: sweep ascendente
    tono(200, rand(600, 720), 0.16, 'square', 0.11 * vol);
    tono(100, 300, 0.2, 'sine', 0.09 * vol);
    // Capa 2: aire silbando
    ruidoBlanco(0.14, 0.07 * vol, 3000);
    // Capa 3: impacto al final
    setTimeout(function() {
      ruidoBlanco(0.04, 0.1, 1500);
      tono(180, 70, 0.1, 'triangle', 0.1);
    }, 120);
  },

  // IMPACTO RECIBIDO: contundente, con peso
  hit: function() {
    const vol = rand(0.9, 1.1);
    // Capa 1: golpe grave (impacto fuerte)
    tono(rand(200, 240), 50, 0.15, 'square', 0.14 * vol);
    tono(rand(100, 130), 30, 0.22, 'sine', 0.12 * vol);
    // Capa 2: crujido
    ruidoBlanco(0.08, 0.14 * vol, 900);
    // Capa 3: golpe agudo (contacto)
    ruidoBlanco(0.02, 0.1 * vol, 4000, sfxGain, 'highpass');
  },

  // BLOQUEO: metálico + resonancia
  block: function() {
    const vol = rand(0.9, 1.1);
    // Capa 1: ting agudo
    tono(rand(1100, 1300), rand(650, 750), 0.1, 'triangle', 0.1 * vol);
    tono(rand(2200, 2600), rand(1400, 1700), 0.06, 'sine', 0.06 * vol);
    // Capa 2: siseo del roce
    ruidoBlanco(0.06, 0.08 * vol, 4500, sfxGain, 'highpass');
  },

  // ESPECIAL: power chord ascendente + distorsión
  special: function() {
    // Capa 1: sweep grave a agudo
    tono(100, 900, 0.4, 'sawtooth', 0.14);
    tono(200, 1800, 0.4, 'square', 0.09);
    tono(50, 220, 0.5, 'sine', 0.12);
    // Capa 2: crujido eléctrico
    ruidoBlanco(0.25, 0.1, 1800);
    // Capa 3: impacto de cierre
    setTimeout(function() {
      ruidoBlanco(0.1, 0.14, 800);
      tono(150, 50, 0.2, 'triangle', 0.12);
    }, 380);
  },

  // KO: caída lenta y dramática
  ko: function() {
    tono(260, 50, 0.7, 'sawtooth', 0.15);
    tono(130, 30, 1.0, 'sine', 0.13);
    ruidoBlanco(0.5, 0.12, 500);
    setTimeout(function() { tono(400, 200, 0.5, 'triangle', 0.08); }, 200);
    setTimeout(function() { tono(300, 150, 0.5, 'triangle', 0.07); }, 350);
    if (typeof ANNOUNCER_SFX !== 'undefined') setTimeout(function(){ ANNOUNCER_SFX.ko(); }, 200);
  },

  // BEEP DE CUENTA ATRÁS
  count: function() {
    tono(660, 660, 0.12, 'sine', 0.1);
    tono(1320, 1320, 0.08, 'sine', 0.05);
  },

  // ¡PELEA! — Fanfarria corta
 fight: function() {
    tono(330, 330, 0.12, 'square', 0.11);
    setTimeout(function(){ tono(440, 440, 0.12, 'square', 0.11); }, 110);
    setTimeout(function(){ tono(660, 990, 0.4, 'square', 0.13); }, 220);
    tono(165, 330, 0.5, 'sawtooth', 0.09);
    if (typeof ANNOUNCER_SFX !== 'undefined') setTimeout(function(){ ANNOUNCER_SFX.fight(); }, 100);
  },

  // SALTO: corto y aireado
  jump: function() {
    tono(rand(700, 800), rand(1000, 1200), 0.07, 'sine', 0.06);
    ruidoBlanco(0.05, 0.03, 4000, sfxGain, 'highpass');
  },

  // DASH: whoosh
  dash: function() {
    tono(500, 1400, 0.11, 'triangle', 0.07);
    ruidoBlanco(0.12, 0.09, 2200);
  },

  // MEJORA ELEGIDA: chime brillante
  upgrade: function() {
    tono(660, 1320, 0.16, 'triangle', 0.11);
    tono(880, 1760, 0.22, 'sine', 0.09);
    setTimeout(function(){ tono(1320, 2640, 0.28, 'sine', 0.06); }, 60);
  },

  // DERROTA
  defeat: function() {
    tono(340, 80, 0.8, 'sawtooth', 0.15);
    tono(220, 50, 1.1, 'sine', 0.13);
    ruidoBlanco(0.5, 0.09, 400);
    setTimeout(function(){ tono(200, 60, 0.6, 'triangle', 0.08); }, 400);
  },

  // VICTORIA: arpegio ascendente
  victory: function() {
    tono(523, 523, 0.14, 'square', 0.1);
    setTimeout(function(){ tono(659, 659, 0.14, 'square', 0.1); }, 130);
    setTimeout(function(){ tono(784, 784, 0.14, 'square', 0.1); }, 260);
    setTimeout(function(){ tono(1047, 1047, 0.5, 'square', 0.12); }, 390);
    setTimeout(function(){ tono(1319, 1319, 0.5, 'sine', 0.09); }, 390);
    if (typeof ANNOUNCER_SFX !== 'undefined') setTimeout(function(){ ANNOUNCER_SFX.winner(); }, 500);
  }
};

// ------------------------------------------------------------
//  MÚSICA SINTETIZADA v2
//  - 3 pistas bien distintas
//  - Variación por compás (fills, acentos)
// ------------------------------------------------------------

function notaFreq(nota, octava) {
  const notas = { 'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13, 'E': 329.63,
                  'F': 349.23, 'F#': 369.99, 'G': 392.00, 'G#': 415.30, 'A': 440.00,
                  'A#': 466.16, 'B': 493.88 };
  const f = notas[nota] || 261.63;
  return f * Math.pow(2, octava - 4);
}

function tocarKick(when, vol) {
  if (!audioCtx) return;
  const t = audioCtx.currentTime + when;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(150, t);
  o.frequency.exponentialRampToValueAtTime(40, t + 0.14);
  g.gain.setValueAtTime(vol || 0.35, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  o.connect(g).connect(musicGain);
  o.start(t);
  o.stop(t + 0.22);
}

function tocarSnare(when, vol) {
  if (!audioCtx) return;
  const t = audioCtx.currentTime + when;
  const bufferSize = Math.floor(audioCtx.sampleRate * 0.15);
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = audioCtx.createBufferSource();
  src.buffer = buffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 1500;
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(vol || 0.18, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
  src.connect(filter).connect(g).connect(musicGain);
  src.start(t);
  src.stop(t + 0.15);
  const o = audioCtx.createOscillator();
  const g2 = audioCtx.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(200, t);
  o.frequency.exponentialRampToValueAtTime(100, t + 0.08);
  g2.gain.setValueAtTime((vol || 0.18) * 0.5, t);
  g2.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  o.connect(g2).connect(musicGain);
  o.start(t);
  o.stop(t + 0.12);
}

function tocarHat(when, vol, abierto) {
  if (!audioCtx) return;
  const t = audioCtx.currentTime + when;
  const dur = abierto ? 0.15 : 0.04;
  const bufferSize = Math.floor(audioCtx.sampleRate * dur);
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = audioCtx.createBufferSource();
  src.buffer = buffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 6000;
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(vol || 0.06, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(filter).connect(g).connect(musicGain);
  src.start(t);
  src.stop(t + dur);
}

function tocarBajo(freq, when, dur, vol, tipo) {
  if (!audioCtx) return;
  const t = audioCtx.currentTime + when;
  const o = audioCtx.createOscillator();
  const o2 = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = tipo || 'triangle';
  o2.type = 'sawtooth';
  o.frequency.value = freq;
  o2.frequency.value = freq / 2;
  g.gain.setValueAtTime(vol || 0.18, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g);
  o2.connect(g);
  g.connect(musicGain);
  o.start(t);
  o2.start(t);
  o.stop(t + dur);
  o2.stop(t + dur);
}

function tocarLead(freq, when, dur, vol, tipo) {
  if (!audioCtx) return;
  const t = audioCtx.currentTime + when;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = tipo || 'square';
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.001, t);
  g.gain.linearRampToValueAtTime(vol || 0.05, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(musicGain);
  o.start(t);
  o.stop(t + dur);
}

function tocarPad(freq, when, dur, vol) {
  if (!audioCtx) return;
  const t = audioCtx.currentTime + when;
  const o = audioCtx.createOscillator();
  const o2 = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'sawtooth';
  o2.type = 'sawtooth';
  o.frequency.value = freq;
  o2.frequency.value = freq * 1.005;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1200;
  g.gain.setValueAtTime(0.001, t);
  g.gain.linearRampToValueAtTime(vol || 0.05, t + 0.2);
  g.gain.linearRampToValueAtTime(0.001, t + dur);
  o.connect(filter);
  o2.connect(filter);
  filter.connect(g).connect(musicGain);
  o.start(t);
  o2.start(t);
  o.stop(t + dur);
  o2.stop(t + dur);
}

// ------------------------------------------------------------
//  3 PISTAS DISTINTAS CON VARIACIÓN
// ------------------------------------------------------------
const PISTAS = {
  // ---- MENÚ: lento, jazzy, hip-hop suave con piano ----
  menu: function(compas) {
    const tempo = 84;
    const beatMs = 60000 / tempo;
    const beat = beatMs / 1000;
    const variacion = compas % 8;

    // Drums: patrón hip-hop clásico
    tocarKick(0, 0.32);
    tocarKick(beat * 2, 0.32);
    tocarKick(beat * 2.75, 0.22);
    tocarSnare(beat * 1, 0.16);
    tocarSnare(beat * 3, 0.16);

    // Hats con swing
    for (let i = 0; i < 8; i++) {
      const swing = (i % 2 === 1) ? 0.06 : 0;
      tocarHat(i * beat / 2 + swing, 0.045, i === 7);
    }

    // Fill cada 4 compases
    if (variacion === 3 || variacion === 7) {
      tocarSnare(beat * 3.5, 0.2);
      tocarSnare(beat * 3.75, 0.22);
    }

    // Progresión jazz
    const prog = [
      [notaFreq('A', 2), notaFreq('C', 3), notaFreq('E', 3), notaFreq('G', 3)],
      [notaFreq('F', 2), notaFreq('A', 2), notaFreq('C', 3), notaFreq('E', 3)],
      [notaFreq('D', 2), notaFreq('F', 2), notaFreq('A', 2), notaFreq('C', 3)],
      [notaFreq('E', 2), notaFreq('G', 2), notaFreq('B', 2), notaFreq('D', 3)]
    ];
    const acorde = prog[compas % 4];

    // Bajo caminando
    tocarBajo(acorde[0], 0, 1.0, 0.17);
    tocarBajo(acorde[1], beat * 2, 0.8, 0.14);
    if (variacion % 2 === 1) {
      tocarBajo(acorde[2], beat * 3, 0.5, 0.12);
    }

    // Lead melódico suave (notas del acorde)
    tocarLead(acorde[2], 0, 1.8, 0.04, 'triangle');
    tocarLead(acorde[3], beat * 2, 1.6, 0.035, 'triangle');
    if (variacion === 2 || variacion === 6) {
      tocarLead(acorde[3] * 2, beat * 3, 0.6, 0.03, 'sine');
    }

    // Pad atmosférico
    tocarPad(acorde[0] * 2, 0, 2.8, 0.035);
    tocarPad(acorde[2], 0, 2.8, 0.03);

    return beatMs * 4;
  },

  // ---- COMBATE: funk-rock con groove marcado ----
  combat: function(compas) {
    const tempo = 138;
    const beatMs = 60000 / tempo;
    const beat = beatMs / 1000;
    const variacion = compas % 8;

    // Batería funky
    tocarKick(0, 0.42);
    tocarKick(beat * 0.75, 0.28);
    tocarKick(beat * 2, 0.42);
    tocarKick(beat * 2.5, 0.32);
    tocarKick(beat * 3.75, 0.28);
    tocarSnare(beat * 1, 0.24);
    tocarSnare(beat * 3, 0.24);
    // Snare fantasma
    if (variacion % 2 === 1) {
      tocarSnare(beat * 2.5, 0.14);
    }
    // Hats rápidos con acento
    for (let i = 0; i < 8; i++) {
      tocarHat(i * beat / 2, i % 4 === 0 ? 0.08 : 0.05, i === 7 && variacion % 2 === 1);
    }

    // Fill de batería cada 4 compases
    if (variacion === 3 || variacion === 7) {
      tocarSnare(beat * 3.25, 0.22);
      tocarSnare(beat * 3.5, 0.24);
      tocarSnare(beat * 3.75, 0.26);
    }

    // Progresión menor
    const prog = [
      [notaFreq('E', 2), notaFreq('G', 2), notaFreq('B', 2)],
      [notaFreq('C', 2), notaFreq('E', 2), notaFreq('G', 2)],
      [notaFreq('G', 2), notaFreq('B', 2), notaFreq('D', 3)],
      [notaFreq('D', 2), notaFreq('F#', 2), notaFreq('A', 2)]
    ];
    const acorde = prog[compas % 4];

    // Línea de bajo funky (síncopas)
    tocarBajo(acorde[0], 0, 0.25, 0.2);
    tocarBajo(acorde[0], beat * 0.75, 0.15, 0.16);
    tocarBajo(acorde[1], beat * 1.5, 0.2, 0.18);
    tocarBajo(acorde[0], beat * 2, 0.22, 0.2);
    tocarBajo(acorde[2], beat * 3, 0.3, 0.19);
    if (variacion % 2 === 0) {
      tocarBajo(acorde[0] * 2, beat * 3.5, 0.15, 0.15);
    }

    // Lead riff
    const riff = [acorde[2], acorde[1], acorde[2] * 1.5, acorde[2]];
    for (let i = 0; i < 4; i++) {
      tocarLead(riff[i], i * beat, 0.2, 0.05, 'square');
    }

    // Pad rockero
    tocarPad(acorde[0] * 4, 0, 2.4, 0.03);
    tocarPad(acorde[1] * 2, 0, 2.4, 0.025);

    return beatMs * 4;
  },

  // ---- BOSS: metal industrial agresivo ----
  boss: function(compas) {
    const tempo = 155;
    const beatMs = 60000 / tempo;
    const beat = beatMs / 1000;
    const variacion = compas % 8;

    // Doble bombo industrial
    tocarKick(0, 0.5);
    tocarKick(beat * 0.25, 0.32);
    tocarKick(beat * 0.5, 0.42);
    tocarKick(beat * 1, 0.5);
    tocarKick(beat * 1.5, 0.42);
    tocarKick(beat * 2, 0.5);
    tocarKick(beat * 2.25, 0.32);
    tocarKick(beat * 2.5, 0.42);
    tocarKick(beat * 3, 0.5);
    // Snare contundente
    tocarSnare(beat * 1, 0.3);
    tocarSnare(beat * 3, 0.3);
    // Fill explosivo cada 4
    if (variacion === 3 || variacion === 7) {
      tocarSnare(beat * 3.25, 0.28);
      tocarSnare(beat * 3.5, 0.3);
      tocarSnare(beat * 3.75, 0.32);
      tocarKick(beat * 3.9, 0.4);
    }
    // Hats rígidos
    for (let i = 0; i < 8; i++) {
      tocarHat(i * beat / 2, 0.06, false);
    }

    // Power chords en 8vos
    const prog = [
      [notaFreq('E', 2), notaFreq('B', 2)],
      [notaFreq('E', 2), notaFreq('B', 2)],
      [notaFreq('G', 2), notaFreq('D', 3)],
      [notaFreq('A', 2), notaFreq('E', 3)]
    ];
    const acorde = prog[compas % 4];

    // Power chord golpeado en corcheas
    for (let i = 0; i < 8; i++) {
      const v = (i % 2 === 0) ? 0.16 : 0.11;
      tocarBajo(acorde[0], i * beat / 2, 0.2, v, 'sawtooth');
      tocarBajo(acorde[1], i * beat / 2, 0.2, v * 0.7, 'sawtooth');
    }

    // Lead agresivo
    if (variacion % 2 === 0) {
      tocarLead(acorde[1] * 2, 0, 0.3, 0.06, 'sawtooth');
      tocarLead(acorde[0] * 2, beat * 2, 0.5, 0.06, 'sawtooth');
    } else {
      tocarLead(acorde[1] * 2, beat * 1.5, 0.2, 0.05, 'sawtooth');
      tocarLead(acorde[1] * 2, beat * 2.5, 0.2, 0.05, 'sawtooth');
    }

    // Pad industrial
    tocarPad(acorde[0] * 2, 0, 2.2, 0.05);
    tocarPad(acorde[1], 0, 2.2, 0.04);

    return beatMs * 4;
  }
};

// ------------------------------------------------------------
//  REPRODUCTOR DE MÚSICA
// ------------------------------------------------------------
function playMusic(pista) {
  if (!audioCtx) return;
  if (musicaActual === pista) return;
  stopMusic();
  if (!PISTAS[pista]) return;
  musicaActual = pista;
  let compas = 0;

  // Fade in
  if (musicGain) {
    musicGain.gain.cancelScheduledValues(audioCtx.currentTime);
    musicGain.gain.setValueAtTime(0, audioCtx.currentTime);
    musicGain.gain.linearRampToValueAtTime(0.38, audioCtx.currentTime + 0.8);
  }

  const tocarSiguiente = function() {
    if (!audioCtx || musicaActual !== pista) return;
    const duracionMs = PISTAS[pista](compas);
    compas++;
    musicaTimer = setTimeout(tocarSiguiente, duracionMs);
  };
  tocarSiguiente();
}

function stopMusic() {
  if (musicaTimer) {
    clearTimeout(musicaTimer);
    musicaTimer = null;
  }
  musicaActual = null;
}

// ------------------------------------------------------------
//  AMBIENTE POR ESCENARIO
// ------------------------------------------------------------
function playAmbient(escenario) {
  if (!audioCtx) return;
  if (ambientActual === escenario) return;
  stopAmbient();
  ambientActual = escenario;

  if (escenario === 'noche') {
    ambientTimer = setInterval(function() {
      if (!audioCtx || ambientActual !== 'noche') return;
      ruidoBlanco(0.8, 0.04, 800, ambientGain, 'lowpass');
      if (Math.random() < 0.2) {
        tono(300, 200, 0.4, 'sine', 0.02, ambientGain);
      }
    }, 2200);
  } else if (escenario === 'tormenta') {
    ambientTimer = setInterval(function() {
      if (!audioCtx || ambientActual !== 'tormenta') return;
      ruidoBlanco(0.5, 0.05, 3000, ambientGain, 'lowpass');
      if (Math.random() < 0.18) {
        tono(80, 30, 0.7, 'sawtooth', 0.09, ambientGain);
        ruidoBlanco(0.4, 0.08, 600, ambientGain, 'lowpass');
      }
    }, 900);
  } else if (escenario === 'volcan') {
    ambientTimer = setInterval(function() {
      if (!audioCtx || ambientActual !== 'volcan') return;
      tono(60, 40, 0.9, 'sine', 0.06, ambientGain);
      ruidoBlanco(0.3, 0.04, 400, ambientGain, 'lowpass');
      if (Math.random() < 0.3) {
        tono(rand(200, 400), rand(80, 150), 0.15, 'triangle', 0.03, ambientGain);
      }
    }, 1400);
  }
}

function stopAmbient() {
  if (ambientTimer) {
    clearInterval(ambientTimer);
    ambientTimer = null;
  }
  ambientActual = null;
}

// ------------------------------------------------------------
//  TECLA M PARA MUTE
// ------------------------------------------------------------
document.addEventListener('keydown', function(e) {
  if (e.key.toLowerCase() === 'm') {
    const m = toggleMute();
    console.log('Audio ' + (m ? 'silenciado' : 'activado'));
  }
});
// ============================================================
//  ANNOUNCER (voces arcade)
// ============================================================
function anunciar(texto, tono, velocidad) {
  if (!audioCtx) return;
  // Default: grave y un poco lento = más arcade
  tono = (tono === undefined) ? 0.2 : tono;
  velocidad = velocidad || 0.85;
  try {
    if (typeof speechSynthesis === 'undefined') return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = 'en-US';
    u.pitch = tono;
    u.rate = velocidad;
    u.volume = 1.0;
    const voces = speechSynthesis.getVoices();
    const vozGrave = voces.find(function(v) {
      return v.lang.indexOf('en') === 0 && (
        v.name.indexOf('Google UK English Male') !== -1 ||
        v.name.indexOf('Daniel') !== -1 ||
        v.name.indexOf('Alex') !== -1 ||
        v.name.indexOf('David') !== -1 ||
        v.name.indexOf('Male') !== -1
      );
    });
    if (vozGrave) u.voice = vozGrave;
    speechSynthesis.speak(u);
  } catch (e) {}
}

// Precalentar la voz al inicio para que la primera utterance no tarde
function precalentarVoz() {
  if (typeof speechSynthesis === 'undefined') return;
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    u.rate = 10;
    speechSynthesis.speak(u);
    setTimeout(function() { speechSynthesis.cancel(); }, 50);
  } catch (e) {}
}

// Precargar voces (algunos navegadores las cargan async)
if (typeof speechSynthesis !== 'undefined') {
  speechSynthesis.onvoiceschanged = function() { speechSynthesis.getVoices(); };
}

// Sonidos cortos del announcer (sin voz, para combos rápidos)
const ANNOUNCER_SFX = {
  fight:   function() { anunciar('Fight!', 0.15, 0.95); },
  ko:      function() { anunciar('Knock out!', 0.1, 0.85); },
  perfect: function() { anunciar('Perfect!', 0.15, 0.9); },
  combo:   function() { anunciar('Combo!', 0.15, 1.0); },
  winner:  function() { anunciar('You win!', 0.15, 0.9); },
  loser:   function() { anunciar('You lose', 0.15, 0.85); }
};

