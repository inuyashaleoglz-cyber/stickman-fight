// ============================================================
//  SISTEMA DE AUDIO
//  - SFX con capas
//  - Ambiente por escenario
//  - Música sintetizada con 3 pistas
//  - Tecla M para mute
// ============================================================

let audioCtx = null;
let masterGain = null;
let musicGain = null;
let sfxGain = null;
let ambientGain = null;

let muted = false;
let volumenMaestro = 0.7;
let musicaActual = null;
let musicaTimer = null;
let ambientActual = null;

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
    musicGain.gain.value = 0.32;
    musicGain.connect(masterGain);

    sfxGain = audioCtx.createGain();
    sfxGain.gain.value = 1.0;
    sfxGain.connect(masterGain);

    ambientGain = audioCtx.createGain();
    ambientGain.gain.value = 0.18;
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
//  BEEP BASE (para SFX)
// ------------------------------------------------------------
function beep(f1, f2, dur, type, vol, gainNode) {
  if (!audioCtx) return;
  type = type || 'square';
  vol = vol || 0.07;
  gainNode = gainNode || sfxGain;
  try {
    const t = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f1, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(gainNode);
    o.start(t);
    o.stop(t + dur);
  } catch (e) {}
}

// Ruido blanco (para impactos secos y crujidos)
function ruidoBlanco(dur, vol, filtroFreq, gainNode) {
  if (!audioCtx) return;
  vol = vol || 0.1;
  filtroFreq = filtroFreq || 2000;
  gainNode = gainNode || sfxGain;
  try {
    const t = audioCtx.currentTime;
    const bufferSize = Math.floor(audioCtx.sampleRate * dur);
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filtroFreq;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filter).connect(g).connect(gainNode);
    src.start(t);
    src.stop(t + dur);
  } catch (e) {}
}

// ------------------------------------------------------------
//  SFX MEJORADOS (con capas)
// ------------------------------------------------------------
const SFX = {
  // Golpes ligeros: tap + aire
  punch: function() {
    beep(500, 220, 0.04, 'square', 0.06);
    ruidoBlanco(0.05, 0.08, 2500);
  },
  // Patadas: impacto más grave + crujido
  kick: function() {
    beep(340, 120, 0.07, 'sawtooth', 0.08);
    beep(180, 90, 0.1, 'sine', 0.06);
    ruidoBlanco(0.09, 0.09, 1200);
  },
  // Uppercut: barrido ascendente
  upper: function() {
    beep(200, 600, 0.15, 'square', 0.1);
    beep(120, 320, 0.18, 'sine', 0.08);
    ruidoBlanco(0.08, 0.07, 3000);
  },
  // Impacto general: golpe pesado + crujido
  hit: function() {
    beep(220, 80, 0.12, 'square', 0.1);
    beep(110, 50, 0.18, 'sine', 0.08);
    ruidoBlanco(0.1, 0.12, 800);
  },
  // Bloqueo: metal + resonancia
  block: function() {
    beep(1200, 700, 0.08, 'triangle', 0.08);
    beep(2400, 1600, 0.05, 'triangle', 0.05);
    ruidoBlanco(0.06, 0.06, 4000);
  },
  // Especial: power chord ascendente + ruido
  special: function() {
    beep(120, 900, 0.35, 'sawtooth', 0.13);
    beep(240, 1800, 0.35, 'square', 0.08);
    beep(60, 240, 0.45, 'sine', 0.1);
    ruidoBlanco(0.2, 0.1, 1500);
  },
  // KO: caída dramática
  ko: function() {
    beep(220, 60, 0.6, 'sawtooth', 0.14);
    beep(110, 30, 0.9, 'sine', 0.12);
    ruidoBlanco(0.4, 0.12, 500);
  },
  // Countdown beep
  count: function() {
    beep(660, 660, 0.1, 'sine', 0.09);
    beep(1320, 1320, 0.06, 'sine', 0.04);
  },
  // ¡PELEA!
  fight: function() {
    beep(330, 990, 0.3, 'square', 0.12);
    beep(165, 495, 0.35, 'sawtooth', 0.1);
  },
  // Salto: ligero y corto
  jump: function() {
    beep(700, 1100, 0.06, 'sine', 0.05);
  },
  // Dash: whoosh
  dash: function() {
    beep(500, 1400, 0.1, 'triangle', 0.06);
    ruidoBlanco(0.1, 0.06, 3000);
  },
  // Mejora elegida: chime brillante
  upgrade: function() {
    beep(660, 1320, 0.15, 'triangle', 0.1);
    beep(880, 1760, 0.2, 'sine', 0.08);
    beep(1320, 2640, 0.25, 'sine', 0.05);
  },
  // Derrota
  defeat: function() {
    beep(330, 80, 0.7, 'sawtooth', 0.14);
    beep(220, 50, 1.0, 'sine', 0.12);
    ruidoBlanco(0.5, 0.08, 400);
  },
  // Victoria
  victory: function() {
    beep(523, 523, 0.15, 'square', 0.1);
    setTimeout(function(){ beep(659, 659, 0.15, 'square', 0.1); }, 120);
    setTimeout(function(){ beep(784, 784, 0.15, 'square', 0.1); }, 240);
    setTimeout(function(){ beep(1047, 1047, 0.4, 'square', 0.12); }, 360);
  }
};

// ------------------------------------------------------------
//  MÚSICA SINTETIZADA
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
  o.frequency.setValueAtTime(140, t);
  o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
  g.gain.setValueAtTime(vol || 0.35, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
  o.connect(g).connect(musicGain);
  o.start(t);
  o.stop(t + 0.2);
}

function tocarSnare(when, vol) {
  if (!audioCtx) return;
  const t = audioCtx.currentTime + when;
  // Ruido
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
  // Tono
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

function tocarBajo(freq, when, dur, vol) {
  if (!audioCtx) return;
  const t = audioCtx.currentTime + when;
  const o = audioCtx.createOscillator();
  const o2 = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'triangle';
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

function tocarPad(freq, when, dur, vol) {
  if (!audioCtx) return;
  const t = audioCtx.currentTime + when;
  const o = audioCtx.createOscillator();
  const o2 = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'sawtooth';
  o2.type = 'sawtooth';
  o.frequency.value = freq;
  o2.frequency.value = freq * 1.005; // detune sutil
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1200;
  g.gain.setValueAtTime(0.001, t);
  g.gain.linearRampToValueAtTime(vol || 0.05, t + 0.15);
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
//  PISTAS
// ------------------------------------------------------------
// Cada pista es una función que toca un compás y programa el siguiente
const PISTAS = {
  menu: function(compas) {
    // Loop lento y chill, hip-hop suave
    const tempo = 90;
    const beatMs = 60000 / tempo;
    // Batería suave
    tocarKick(0, 0.28);
    tocarKick(beatMs * 0.5 / 1000, 0.18);
    tocarKick(beatMs * 2 / 1000, 0.28);
    tocarSnare(beatMs * 1 / 1000, 0.14);
    tocarSnare(beatMs * 3 / 1000, 0.14);
    for (let i = 0; i < 8; i++) {
      tocarHat(i * beatMs / 2 / 1000, 0.04, i % 4 === 3);
    }
    // Bajo
    const prog = [
      [notaFreq('A', 2), notaFreq('C', 3), notaFreq('E', 3)],
      [notaFreq('F', 2), notaFreq('A', 2), notaFreq('C', 3)],
      [notaFreq('G', 2), notaFreq('B', 2), notaFreq('D', 3)],
      [notaFreq('E', 2), notaFreq('G', 2), notaFreq('B', 2)]
    ];
    const acorde = prog[compas % 4];
    tocarBajo(acorde[0], 0, 1.2, 0.16);
    tocarBajo(acorde[1], beatMs * 2 / 1000, 0.8, 0.13);
    // Pad atmosférico
    tocarPad(acorde[0] * 2, 0, 2.4, 0.04);
    tocarPad(acorde[2], 0, 2.4, 0.035);

    return beatMs * 4;
  },

  combat: function(compas) {
    // Ritmo marcado, hip-hop-rock
    const tempo = 128;
    const beatMs = 60000 / tempo;
    // Drums
    tocarKick(0, 0.4);
    tocarKick(beatMs * 1.5 / 1000, 0.3);
    tocarKick(beatMs * 2.5 / 1000, 0.4);
    tocarSnare(beatMs * 1 / 1000, 0.22);
    tocarSnare(beatMs * 3 / 1000, 0.22);
    tocarHat(beatMs * 0.5 / 1000, 0.07, false);
    tocarHat(beatMs * 1.5 / 1000, 0.07, false);
    tocarHat(beatMs * 2.5 / 1000, 0.07, false);
    tocarHat(beatMs * 3.5 / 1000, 0.07, true);
    // Bajo línea con groove
    const prog = [
      [notaFreq('E', 2), notaFreq('E', 2), notaFreq('G', 2), notaFreq('B', 2)],
      [notaFreq('C', 2), notaFreq('C', 2), notaFreq('E', 2), notaFreq('G', 2)],
      [notaFreq('D', 2), notaFreq('D', 2), notaFreq('F#', 2), notaFreq('A', 2)],
      [notaFreq('B', 1), notaFreq('B', 1), notaFreq('D', 2), notaFreq('F#', 2)]
    ];
    const acorde = prog[compas % 4];
    tocarBajo(acorde[0], 0, 0.3, 0.2);
    tocarBajo(acorde[1], beatMs * 1 / 1000, 0.25, 0.18);
    tocarBajo(acorde[2], beatMs * 2 / 1000, 0.3, 0.2);
    tocarBajo(acorde[3], beatMs * 3 / 1000, 0.35, 0.22);
    // Pad sutil
    tocarPad(acorde[0] * 4, 0, 2.2, 0.03);
    return beatMs * 4;
  },

  boss: function(compas) {
    // Más agresivo, power chords distorsionados
    const tempo = 145;
    const beatMs = 60000 / tempo;
    // Drums más intensos
    tocarKick(0, 0.45);
    tocarKick(beatMs * 0.5 / 1000, 0.35);
    tocarKick(beatMs * 2 / 1000, 0.45);
    tocarKick(beatMs * 2.5 / 1000, 0.35);
    tocarSnare(beatMs * 1 / 1000, 0.28);
    tocarSnare(beatMs * 3 / 1000, 0.28);
    for (let i = 0; i < 8; i++) {
      tocarHat(i * beatMs / 2 / 1000, 0.06, i === 7);
    }
    // Power chords (bajo + quinta)
    const prog = [
      [notaFreq('E', 2), notaFreq('B', 2)],
      [notaFreq('E', 2), notaFreq('B', 2)],
      [notaFreq('C', 2), notaFreq('G', 2)],
      [notaFreq('D', 2), notaFreq('A', 2)]
    ];
    const acorde = prog[compas % 4];
    // Power chord distorsionado en negras
    for (let i = 0; i < 4; i++) {
      const when = i * beatMs / 1000;
      tocarBajo(acorde[0], when, 0.22, 0.16);
      tocarBajo(acorde[1], when, 0.22, 0.12);
    }
    // Pad agresivo
    tocarPad(acorde[0] * 4, 0, 2.0, 0.04);
    return beatMs * 4;
  }
};

// ------------------------------------------------------------
//  REPRODUCTOR DE MÚSICA
// ------------------------------------------------------------
function playMusic(pista) {
  if (!audioCtx) return;
  stopMusic();
  if (!PISTAS[pista]) return;
  musicaActual = pista;
  let compas = 0;

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
  stopAmbient();
  ambientActual = escenario;

  if (escenario === 'noche') {
    // Viento suave
    const interval = setInterval(function() {
      if (!audioCtx || ambientActual !== 'noche') return;
      ruidoBlanco(0.8, 0.04, 800, ambientGain);
    }, 2000);
    ambientTimer = interval;
  } else if (escenario === 'tormenta') {
    // Lluvia + truenos ocasionales
    const interval = setInterval(function() {
      if (!audioCtx || ambientActual !== 'tormenta') return;
      ruidoBlanco(0.5, 0.05, 3000, ambientGain);
      if (Math.random() < 0.15) {
        beep(80, 30, 0.6, 'sawtooth', 0.08, ambientGain);
      }
    }, 900);
    ambientTimer = interval;
  } else if (escenario === 'volcan') {
    // Lava burbujeante + retumbo
    const interval = setInterval(function() {
      if (!audioCtx || ambientActual !== 'volcan') return;
      beep(60, 40, 0.8, 'sine', 0.06, ambientGain);
      ruidoBlanco(0.3, 0.03, 400, ambientGain);
    }, 1400);
    ambientTimer = interval;
  }
}

let ambientTimer = null;
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
    const muted = toggleMute();
    console.log('Audio ' + (muted ? 'silenciado' : 'activado'));
  }
});
