// ============================================================
//  DETECTOR DE ERRORES EN PANTALLA
// ============================================================
window.addEventListener('error', function(e) {
  const box = document.getElementById('errorBox');
  if (box) {
    box.style.display = 'block';
    box.textContent = '⚠ ERROR: ' + e.message + '  |  Archivo: ' + (e.filename || '?') + '  Línea: ' + (e.lineno || '?');
  }
  console.error(e);
});

// ============================================================
//  CANVAS Y CONSTANTES
// ============================================================
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;
const GROUND = H - 70;
const GRAVITY = 0.75;
const WALL_PAD = 50;
const ROUNDS_TO_WIN = 2;

// ============================================================
//  PERSONAJES (con personalidad de IA)
// ============================================================
const CHARACTERS = [
  { id:'rocky', name:'ROCKY', desc:'Tanque equilibrado', color:'#4ade80', accent:'#22c55e',
    maxHealth:115, speed:4.3, dmgMult:1.05, jumpPower:-13,
    stats:{hp:78, spd:60, pow:75, def:85},
    abilityName:'PIEL DE HIERRO', abilityDesc:'-15% daño recibido',
    specialName:'METEORO', special:{damage:32, range:80, launch:true, superArmor:true},
    personality:'balanced' },

  { id:'blaze', name:'BLAZE', desc:'Rápido y ágil', color:'#fbbf24', accent:'#f59e0b',
    maxHealth:85, speed:5.7, dmgMult:0.85, jumpPower:-14.5,
    stats:{hp:48, spd:98, pow:55, def:45},
    abilityName:'DOBLE SALTO', abilityDesc:'Salta 2 veces en el aire',
    specialName:'FURIA FUGÁZ', special:{damage:30, range:80, launch:false},
    personality:'rushdown' },

  { id:'titan', name:'TITAN', desc:'Lento y brutal', color:'#a78bfa', accent:'#8b5cf6',
    maxHealth:145, speed:3.2, dmgMult:1.35, jumpPower:-11.5,
    stats:{hp:98, spd:30, pow:98, def:95},
    abilityName:'ROCA VIVA', abilityDesc:'-25% daño, no retrocede',
    specialName:'TERREMOTO', special:{damage:36, range:110, launch:true},
    personality:'defensive' },

  { id:'shadow', name:'SHADOW', desc:'Ninja veloz', color:'#06b6d4', accent:'#0891b2',
    maxHealth:95, speed:4.6, dmgMult:1.05, jumpPower:-14,
    stats:{hp:58, spd:82, pow:72, def:55},
    abilityName:'SOMBRA VELOZ', abilityDesc:'+30% vel al retroceder',
    specialName:'CORTE UMBRÍO', special:{damage:32, range:90, launch:false, teleport:true},
    personality:'trickster' },

  { id:'frost', name:'FROST', desc:'Maestro del hielo', color:'#67e8f9', accent:'#0ea5e9',
    maxHealth:92, speed:4.5, dmgMult:0.95, jumpPower:-13.5,
    stats:{hp:55, spd:72, pow:68, def:58},
    abilityName:'TOQUE GÉLIDO', abilityDesc:'Sus golpes ralentizan 2s',
    specialName:'VENTISCA', special:{damage:24, range:9999, launch:false, projectile:true, slow:true},
    personality:'zoner' },

  { id:'bolt', name:'BOLT', desc:'Velocidad eléctrica', color:'#fde047', accent:'#eab308',
    maxHealth:88, speed:5.0, dmgMult:1.0, jumpPower:-14,
    stats:{hp:55, spd:88, pow:78, def:50},
    abilityName:'SOBRECARGA', abilityDesc:'Rayo extra cada 4 golpes',
    specialName:'TORMENTA', special:{damage:28, range:9999, launch:true, lightning:true},
    personality:'technical' },

  { id:'phoenix', name:'PHOENIX', desc:'Fénix inmortal', color:'#fb923c', accent:'#f97316',
    maxHealth:100, speed:4.2, dmgMult:1.05, jumpPower:-13,
    stats:{hp:68, spd:65, pow:78, def:62},
    abilityName:'REGENERACIÓN', abilityDesc:'Cura vida lentamente',
    specialName:'NOVA SOLAR', special:{damage:28, range:130, launch:true, heal:18},
    personality:'balanced' }
];

// ============================================================
//  ESCENARIOS
// ============================================================
const SCENARIOS = [
  { id:'noche',    name:'Noche Estrellada' },
  { id:'tormenta', name:'Tormenta Eléctrica' },
  { id:'volcan',   name:'Cráter Volcánico' }
];

// ============================================================
//  DIFICULTADES DE LA IA
// ============================================================
const AIS = {
  facil:     {name:'FÁCIL',     color:'#4ade80', reaction:26, aggression:0.35, blockChance:0.25, dodgeChance:0.15, speedMult:0.80, dmgMult:0.75, prediction:0.0, specialUse:0.3},
  normal:    {name:'NORMAL',    color:'#38bdf8', reaction:16, aggression:0.60, blockChance:0.45, dodgeChance:0.30, speedMult:0.95, dmgMult:1.00, prediction:0.2, specialUse:0.6},
  dificil:   {name:'DIFÍCIL',   color:'#fbbf24', reaction:9,  aggression:0.80, blockChance:0.65, dodgeChance:0.45, speedMult:1.10, dmgMult:1.15, prediction:0.45, specialUse:0.85},
  pesadilla: {name:'PESADILLA', color:'#ef4444', reaction:5,  aggression:0.95, blockChance:0.82, dodgeChance:0.65, speedMult:1.25, dmgMult:1.30, prediction:0.75, specialUse:1.0}
};

// ============================================================
//  MOVIMIENTOS
// ============================================================
const MOVES = {
  punch:      {startup:3,  active:4,  recovery:8,  damage:5,  range:62, kb:2,  meterGain:6,  crouchHit:false, jumpHit:false, launch:false, cancelable:true},
  kick:       {startup:6,  active:4,  recovery:12, damage:9,  range:78, kb:4,  meterGain:8,  crouchHit:false, jumpHit:false, launch:false, cancelable:true},
  uppercut:   {startup:8,  active:5,  recovery:18, damage:14, range:55, kb:6,  meterGain:12, crouchHit:true,  jumpHit:false, launch:true,  cancelable:false},
  lowPunch:   {startup:3,  active:4,  recovery:9,  damage:5,  range:55, kb:2,  meterGain:6,  crouchHit:true,  jumpHit:false, launch:false, cancelable:true},
  sweep:      {startup:7,  active:4,  recovery:16, damage:10, range:72, kb:5,  meterGain:10, crouchHit:true,  jumpHit:false, launch:true,  low:true, cancelable:false},
  jumpAttack: {startup:3,  active:8,  recovery:4,  damage:10, range:70, kb:4,  meterGain:10, crouchHit:true,  jumpHit:true,  launch:false, cancelable:false},
  special:    {startup:12, active:10, recovery:22, damage:24, range:105,kb:12, meterGain:0,  crouchHit:true,  jumpHit:true,  launch:true,  special:true, cancelable:false}
};

// ============================================================
//  AUDIO SINTETIZADO
// ============================================================
let audioCtx = null;
function initAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){}
  }
}
function beep(f1, f2, dur, type, vol) {
  if (!audioCtx) return;
  type = type || 'square'; vol = vol || 0.07;
  try {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f1, audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), audioCtx.currentTime + dur);
    g.gain.setValueAtTime(vol, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    o.connect(g).connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + dur);
  } catch(e){}
}
const SFX = {
  punch:   function(){ beep(450, 180, 0.06, 'sawtooth', 0.05); },
  kick:    function(){ beep(320, 130, 0.09, 'sawtooth', 0.07); },
  upper:   function(){ beep(220, 500, 0.12, 'square', 0.09); },
  hit:     function(){ beep(240, 60, 0.13, 'square', 0.10); },
  block:   function(){ beep(1000, 500, 0.07, 'triangle', 0.07); },
  special: function(){ beep(180, 1200, 0.4, 'sawtooth', 0.14); },
  ko:      function(){ beep(180, 40, 0.5, 'sawtooth', 0.16); },
  count:   function(){ beep(560, 560, 0.11, 'sine', 0.07); },
  fight:   function(){ beep(300, 900, 0.35, 'square', 0.13); },
  jump:    function(){ beep(600, 900, 0.06, 'sine', 0.04); },
  dash:    function(){ beep(700, 1100, 0.08, 'triangle', 0.05); }
};

// ============================================================
//  ENTRADA
// ============================================================
const keys = {};
const justPressed = {};
const lastTapTime = { a: 0, d: 0 };

document.addEventListener('keydown', function(e) {
  initAudio();
  const k = e.key.toLowerCase();
  if (!keys[k]) justPressed[k] = true;
  keys[k] = true;
  if (k === 'r' && typeof iniciarPartida === 'function') iniciarPartida();
  if (k === 'p' && typeof togglePausa === 'function') togglePausa();
  if (['arrowleft','arrowright','arrowup','arrowdown',' '].indexOf(k) !== -1) e.preventDefault();
});
document.addEventListener('keyup', function(e) {
  keys[e.key.toLowerCase()] = false;
});

function consumePress(k) {
  if (justPressed[k]) { justPressed[k] = false; return true; }
  return false;
}
function clearPresses() {
  for (const k in justPressed) justPressed[k] = false;
}

// ============================================================
//  RÉCORDS (localStorage)
// ============================================================
const RECORDS_KEY = 'stickmanFight_records_v1';
function cargarRecords() {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    if (!raw) return { victorias: 0, mejorCombo: 0, personajeFav: null, wins: {} };
    return JSON.parse(raw);
  } catch(e) {
    return { victorias: 0, mejorCombo: 0, personajeFav: null, wins: {} };
  }
}
function guardarRecords(r) {
  try { localStorage.setItem(RECORDS_KEY, JSON.stringify(r)); } catch(e){}
}
function registrarVictoria(personajeId, combo) {
  const r = cargarRecords();
  r.victorias++;
  r.wins[personajeId] = (r.wins[personajeId] || 0) + 1;
  if (combo > r.mejorCombo) r.mejorCombo = combo;
  // Personaje favorito = el más usado
  let best = 0, fav = null;
  for (const id in r.wins) {
    if (r.wins[id] > best) { best = r.wins[id]; fav = id; }
  }
  r.personajeFav = fav;
  guardarRecords(r);
}
