// ============================================================
//  DETECTOR DE ERRORES
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
const MAX_PISO = 999;

// ============================================================
//  PERSONAJES
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
//  DIFICULTADES DE LA IA (pesadilla suavizada)
// ============================================================
const AIS = {
  facil:     {name:'FÁCIL',     color:'#4ade80', reaction:26, aggression:0.35, blockChance:0.25, dodgeChance:0.15, speedMult:0.80, dmgMult:0.75, prediction:0.0, specialUse:0.3},
  normal:    {name:'NORMAL',    color:'#38bdf8', reaction:16, aggression:0.60, blockChance:0.45, dodgeChance:0.30, speedMult:0.95, dmgMult:1.00, prediction:0.2, specialUse:0.6},
  dificil:   {name:'DIFÍCIL',   color:'#fbbf24', reaction:9,  aggression:0.80, blockChance:0.65, dodgeChance:0.45, speedMult:1.10, dmgMult:1.15, prediction:0.45, specialUse:0.85},
  pesadilla: {name:'PESADILLA', color:'#ef4444', reaction:9,  aggression:0.82, blockChance:0.68, dodgeChance:0.55, speedMult:1.12, dmgMult:1.18, prediction:0.55, specialUse:0.85}
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
//  MEJORAS CON MAXSTACK
// ============================================================
const MEJORAS = [
  // ---- COMUNES ----
  { id:'daño1', maxStack:5, name:'FILO AFILADO', icon:'🗡️', rarity:'comun',
    desc:'+15% de daño con todos tus ataques.',
    apply: function(b){ b.dañoPct += 0.15; } },
  { id:'vida1', maxStack:5, name:'CORAZÓN EXTRA', icon:'❤️', rarity:'comun',
    desc:'+25 de vida máxima y te cura esa cantidad.',
    apply: function(b){ b.vidaMax += 25; } },
  { id:'medidor1', maxStack:3, name:'FLUJO RÁPIDO', icon:'⚡', rarity:'comun',
    desc:'Tu medidor de especial se llena 30% más rápido.',
    apply: function(b){ b.medidorPct += 0.30; } },
  { id:'defensa1', maxStack:3, name:'PIEL DURA', icon:'🛡️', rarity:'comun',
    desc:'Recibes 12% menos daño.',
    apply: function(b){ b.defensaPct += 0.12; } },
  { id:'velocidad1', maxStack:3, name:'PIES LIGEROS', icon:'💨', rarity:'comun',
    desc:'+12% velocidad de movimiento.',
    apply: function(b){ b.velocidadPct += 0.12; } },
  { id:'cura1', maxStack:3, name:'BOTIQUÍN', icon:'💊', rarity:'comun',
    desc:'Al empezar cada piso, +15 de vida extra.',
    apply: function(b){ b.curaEntrePisos += 15; } },
  { id:'medidor2', maxStack:3, name:'CORAZÓN DE FUEGO', icon:'🔥', rarity:'comun',
    desc:'Empiezas cada pelea con 20% del medidor lleno.',
    apply: function(b){ b.medidorInicial += 0.20; } },

  // ---- RARAS ----
  { id:'critico', maxStack:3, name:'GOLPE CRÍTICO', icon:'🎯', rarity:'rara',
    desc:'15% de probabilidad de hacer daño x2.',
    apply: function(b){ b.critChance += 0.15; } },
  { id:'vampirismo', maxStack:3, name:'VAMPIRISMO', icon:'🩸', rarity:'rara',
    desc:'Te curas 5% del daño que infliges.',
    apply: function(b){ b.vampirismo += 0.05; } },
  { id:'regenera', maxStack:3, name:'REGENERACIÓN', icon:'🌿', rarity:'rara',
    desc:'Recuperas 1.5 de vida por segundo.',
    apply: function(b){ b.regeneracion += 1.5; } },
  { id:'bloqueo', maxStack:2, name:'MURO DE HIERRO', icon:'🧱', rarity:'rara',
    desc:'Bloquear reduce el daño un 40% adicional.',
    apply: function(b){ b.bloqueoExtraPct += 0.40; } },
  { id:'puño1', maxStack:2, name:'PUÑOS DE ACERO', icon:'👊', rarity:'rara',
    desc:'+40% de daño con puñetazos.',
    apply: function(b){ b.punchPct += 0.40; } },
  { id:'patada1', maxStack:2, name:'PIERNAS DE HIERRO', icon:'🦵', rarity:'rara',
    desc:'+35% de daño con patadas y barridos.',
    apply: function(b){ b.kickPct += 0.35; } },
  { id:'uppercut1', maxStack:2, name:'COHETE', icon:'🚀', rarity:'rara',
    desc:'+50% de daño con uppercut.',
    apply: function(b){ b.uppercutPct += 0.50; } },
  { id:'combo1', maxStack:5, name:'ESPÍRITU DE COMBO', icon:'🌀', rarity:'rara',
    desc:'Cada golpe del combo suma +5% de daño (max +50%).',
    apply: function(b){ b.comboMasterPct += 0.05; } },
  { id:'sangrado', maxStack:3, name:'FILO SANGRANTE', icon:'🔴', rarity:'rara',
    desc:'Tus golpes aplican sangrado: 1 daño/segundo durante 3s.',
    apply: function(b){ b.sangradoPct += 1; } },

  // ---- ÉPICAS ----
  { id:'dash1', maxStack:3, name:'SOMBRA FANTASMA', icon:'👻', rarity:'epica',
    desc:'Tu dash es más largo. Cada stack suma +8 frames de invulnerabilidad.',
    apply: function(b){ b.dashPct += 0.5; b.dashInvuln += 1; } },
  { id:'espejo', maxStack:2, name:'ESCUDO ESPEJO', icon:'🪞', rarity:'epica',
    desc:'Reflejas el 15% del daño bloqueado al atacante.',
    apply: function(b){ b.reflejoPct += 0.15; } },

  // ---- ROCKY ----
  { id:'rocky1', maxStack:2, name:'MURO ETERNO', icon:'🏔️', rarity:'rara', soloPara:'rocky',
    desc:'+20% de reducción de daño adicional.',
    apply: function(b){ b.defensaPct += 0.20; } },
  { id:'rocky2', maxStack:2, name:'CONTRAATAQUE', icon:'↩️', rarity:'rara', soloPara:'rocky',
    desc:'Al bloquear un golpe, devuelves 25% del daño.',
    apply: function(b){ b.reflejoPct += 0.25; } },
  { id:'rocky3', maxStack:2, name:'CORAZÓN DE PIEDRA', icon:'🪨', rarity:'epica', soloPara:'rocky',
    desc:'+60 de vida máxima y +10% defensa.',
    apply: function(b){ b.vidaMax += 60; b.defensaPct += 0.10; } },

  // ---- BLAZE ----
  { id:'blaze1', maxStack:2, name:'VIENTO CORTANTE', icon:'🌪️', rarity:'rara', soloPara:'blaze',
    desc:'Tu dash es 50% más rápido y hace daño al pasar.',
    apply: function(b){ b.dashPct += 0.5; b.dashDaño += 4; } },
  { id:'blaze2', maxStack:2, name:'TRIPLE SALTO', icon:'🕊️', rarity:'rara', soloPara:'blaze',
    desc:'Puedes hacer un salto extra en el aire.',
    apply: function(b){ b.saltosExtra += 1; } },
  { id:'blaze3', maxStack:2, name:'FURIA INCESANTE', icon:'⚡', rarity:'epica', soloPara:'blaze',
    desc:'+25% velocidad y +20% daño en combos de 3 o más.',
    apply: function(b){ b.velocidadPct += 0.25; b.velocidadComboPct += 0.20; } },

  // ---- TITAN ----
  { id:'titan1', maxStack:3, name:'PIEL DE ROCA', icon:'🛡️', rarity:'rara', soloPara:'titan',
    desc:'+80 de vida máxima.',
    apply: function(b){ b.vidaMax += 80; } },
  { id:'titan2', maxStack:3, name:'SUPER ARMOR', icon:'💪', rarity:'rara', soloPara:'titan',
    desc:'Los golpes débiles no te interrumpen. Cada stack sube el umbral.',
    apply: function(b){ b.superArmorLeve += 1; } },
  { id:'titan3', maxStack:2, name:'PUÑOS MONTAÑA', icon:'🏔️', rarity:'epica', soloPara:'titan',
    desc:'+60% daño con puñetazos y +30% daño con patadas.',
    apply: function(b){ b.punchPct += 0.60; b.kickPct += 0.30; } },

  // ---- SHADOW ----
  { id:'shadow1', maxStack:2, name:'HOJA SOMBRÍA', icon:'🗡️', rarity:'rara', soloPara:'shadow',
    desc:'+30% de daño con puñetazos y patadas.',
    apply: function(b){ b.punchPct += 0.30; b.kickPct += 0.30; } },
  { id:'shadow2', maxStack:3, name:'PASO FANTASMA', icon:'👤', rarity:'rara', soloPara:'shadow',
    desc:'Tu dash te da invulnerabilidad 0.3s más larga.',
    apply: function(b){ b.dashInvuln += 1; b.dashInvulnExtra += 18; } },
  { id:'shadow3', maxStack:3, name:'KAGE BUNSHIN', icon:'🌀', rarity:'epica', soloPara:'shadow',
    desc:'Al usar especial, dejas un clon que golpea. Cada stack = +1 clon.',
    apply: function(b){ b.clonEspecial += 1; } },

  // ---- FROST ----
  { id:'frost1', maxStack:2, name:'ESCARCHA PROFUNDA', icon:'❄️', rarity:'rara', soloPara:'frost',
    desc:'Tus golpes ralentizan al rival el doble.',
    apply: function(b){ b.slowPct += 1; } },
  { id:'frost2', maxStack:2, name:'VIENTO HELADO', icon:'🌬️', rarity:'rara', soloPara:'frost',
    desc:'Ralentizar al rival te da +15% daño sobre él.',
    apply: function(b){ b.dañoASlow += 0.15; } },
  { id:'frost3', maxStack:3, name:'CERO ABSOLUTO', icon:'🧊', rarity:'epica', soloPara:'frost',
    desc:'Tus especiales congelan más tiempo. Cada stack = +2 segundos.',
    apply: function(b){ b.congelarEspecial += 1; } },

  // ---- BOLT ----
  { id:'bolt1', maxStack:2, name:'RAYO CONTINUO', icon:'⚡', rarity:'rara', soloPara:'bolt',
    desc:'Sobrecarga cae cada 3 golpes en vez de cada 4.',
    apply: function(b){ b.rayoFrecuencia = Math.max(2, b.rayoFrecuencia - 1); } },
  { id:'bolt2', maxStack:3, name:'VOLTAJE', icon:'🔋', rarity:'rara', soloPara:'bolt',
    desc:'+30% daño cuando tu combo es de 4 o más.',
    apply: function(b){ b.comboMasterPct += 0.08; } },
  { id:'bolt3', maxStack:2, name:'TORMENTA PERPETUA', icon:'⛈️', rarity:'epica', soloPara:'bolt',
    desc:'+25% de probabilidad de crítico.',
    apply: function(b){ b.critChance += 0.25; } },

  // ---- PHOENIX ----
  { id:'phoenix1', maxStack:3, name:'FUEGO SAGRADO', icon:'🔥', rarity:'rara', soloPara:'phoenix',
    desc:'+2 de regeneración por segundo.',
    apply: function(b){ b.regeneracion += 2; } },
  { id:'phoenix2', maxStack:2, name:'AVE FÉNIX', icon:'🦅', rarity:'rara', soloPara:'phoenix',
    desc:'Al 30% de vida, ganas +30% de daño.',
    apply: function(b){ b.furiaBajaVida += 0.30; } },
  { id:'phoenix3', maxStack:3, name:'RENACIMIENTO', icon:'♻️', rarity:'epica', soloPara:'phoenix',
    desc:'Revives con 40% de vida. Cada stack = +1 revivir por piso.',
    apply: function(b){ b.revivir += 1; } }
];

// ============================================================
//  SINERGIAS
// ============================================================
const SINERGIAS = [
  { id:'sin_vampiro_sangre', nombre:'VAMPIRO SANGRIENTO',
    icon:'🩸', requiere:['vampirismo','sangrado'],
    desc:'Vampirismo cura el triple y el sangrado dura 6s.',
    apply: function(b){ b.vampirismo += 0.10; b.sangradoPct += 2; } },

  { id:'sin_critico_combo', nombre:'FURIA CRÍTICA',
    icon:'⚡', requiere:['critico','combo1'],
    desc:'+15% crítico y críticos garantizados desde el 5to golpe.',
    apply: function(b){ b.critChance += 0.15; b.critGarantizadoCombo += 1; } },

  { id:'sin_regen_defensa', nombre:'FORTALEZA ETERNA',
    icon:'🛡️', requiere:['regenera','defensa1'],
    desc:'+10% defensa y +1 regeneración por segundo.',
    apply: function(b){ b.defensaPct += 0.10; b.regeneracion += 1; } },

  { id:'sin_dash_sombra', nombre:'SOMBRA LETAL',
    icon:'👻', requiere:['dash1','puño1'],
    desc:'Tu dash hace daño y los puñetazos dan +20% más.',
    apply: function(b){ b.dashDaño += 6; b.punchPct += 0.20; } },

  { id:'sin_sangrado_puño', nombre:'GOLPE CRUENTO',
    icon:'🔴', requiere:['sangrado','puño1'],
    desc:'Cada puñetazo aplica sangrado que dura 2s más.',
    apply: function(b){ b.sangradoPct += 2; } },

  { id:'sin_medidor_especial', nombre:'CORAZÓN DE ACERO',
    icon:'💥', requiere:['medidor2','medidor1'],
    desc:'Empiezas cada pelea con el especial ya cargado.',
    apply: function(b){ b.medidorInicial += 0.60; } }
];

const RARITY_WEIGHTS = { comun: 60, rara: 32, epica: 8 };

// ============================================================
//  TIENDA
// ============================================================
const SHOP_ITEMS = [
  { id:'mejora_random', name:'MEJORA ALEATORIA', icon:'🎁', precio:60,
    desc:'Una mejora aleatoria (común, rara o épica).' },
  { id:'mejora_epica',  name:'MEJORA ÉPICA',     icon:'💎', precio:150,
    desc:'Una mejora épica garantizada.' },
  { id:'cura_total',    name:'CURA COMPLETA',    icon:'💚', precio:50,
    desc:'Recuperas toda tu vida máxima.' },
  { id:'vida_max',      name:'+40 VIDA MÁXIMA',  icon:'❤️', precio:80,
    desc:'Aumenta tu vida máxima permanentemente.' },
  { id:'medidor_lleno', name:'MEDIDOR CARGADO',  icon:'⚡', precio:40,
    desc:'Empiezas cada pelea con el especial listo.' }
];

// ============================================================
//  BOSSES
// ============================================================
const BOSSES = [
  { id:'void_lord', name:'SEÑOR DEL VACÍO', desc:'El devorador de mundos',
    color:'#7c3aed', accent:'#a855f7',
    maxHealth: 180, speed: 5.2, dmgMult: 1.3, jumpPower: -14,
    stats:{hp:100, spd:88, pow:100, def:90},
    abilityName:'', abilityDesc:'',
    specialName:'APOCALIPSIS',
    special:{damage:42, range:130, launch:true, teleport:true},
    personality:'rushdown',
    bossOnly: true }
];

// ============================================================
//  HELPERS DE PISO
// ============================================================
function esPisoBoss(piso)     { return piso > 0 && piso % 15 === 0; }
function esPisoBossFinal(piso){ return piso > 0 && piso % 30 === 0; }
function nombrePisoBoss(piso){
  if (esPisoBossFinal(piso)) return BOSSES[0].name;
  return 'CAMPEÓN DEL PISO ' + piso;
}

function tipoDePiso(piso) {
  if (piso <= 0) return 'normal';
  if (piso % 30 === 0) return 'boss_final';
  if (piso % 15 === 0) return 'boss';
  if (piso % 7 === 0) return 'tienda';
  if (piso % 4 === 0) return 'elite';
  if (piso % 5 === 0) {
    const n = piso / 5;
    return (n % 2 === 1) ? 'descanso' : 'tesoro';
  }
  return 'normal';
}

function esPisoElite(piso)   { return tipoDePiso(piso) === 'elite'; }
function esPisoEvento(piso)  {
  const t = tipoDePiso(piso);
  return t === 'descanso' || t === 'tesoro';
}

// ============================================================
//  BONUSES VACÍOS (booleanas convertidas a números)
// ============================================================
function bonusesVacios() {
  return {
    vidaMax: 0,
    dañoPct: 0,
    medidorPct: 0,
    defensaPct: 0,
    velocidadPct: 0,
    critChance: 0,
    vampirismo: 0,
    regeneracion: 0,
    medidorInicial: 0,
    bloqueoExtraPct: 0,
    punchPct: 0,
    kickPct: 0,
    uppercutPct: 0,
    comboMasterPct: 0,
    dashPct: 0,
    dashInvuln: 0,
    curaEntrePisos: 0,
    sangradoPct: 0,
    reflejoPct: 0,
    dashDaño: 0,
    dashInvulnExtra: 0,
    saltosExtra: 0,
    velocidadComboPct: 0,
    superArmorLeve: 0,
    clonEspecial: 0,
    slowPct: 0,
    dañoASlow: 0,
    congelarEspecial: 0,
    rayoFrecuencia: 4,
    furiaBajaVida: 0,
    revivir: 0,
    critGarantizadoCombo: 0,
    sinergiasActivas: []
  };
}

// ============================================================
//  AUDIO
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
  dash:    function(){ beep(700, 1100, 0.08, 'triangle', 0.05); },
  upgrade: function(){ beep(600, 1400, 0.35, 'triangle', 0.12); },
  defeat:  function(){ beep(300, 80, 0.8, 'sawtooth', 0.15); },
  victory: function(){ beep(500, 1500, 0.8, 'square', 0.15); }
};

// ============================================================
//  ENTRADA
// ============================================================
const keys = {};
const justPressed = {};

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
//  RÉCORDS
// ============================================================
const RECORDS_KEY = 'stickmanFight_records_v2';
function cargarRecords() {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    if (!raw) return { victorias: 0, mejorCombo: 0, personajeFav: null, wins: {},
                        mejorPisoRoguelike: 0, roguelikesGanados: 0 };
    const r = JSON.parse(raw);
    if (r.mejorPisoRoguelike === undefined) r.mejorPisoRoguelike = 0;
    if (r.roguelikesGanados === undefined) r.roguelikesGanados = 0;
    return r;
  } catch(e) {
    return { victorias: 0, mejorCombo: 0, personajeFav: null, wins: {},
             mejorPisoRoguelike: 0, roguelikesGanados: 0 };
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
  let best = 0, fav = null;
  for (const id in r.wins) {
    if (r.wins[id] > best) { best = r.wins[id]; fav = id; }
  }
  r.personajeFav = fav;
  guardarRecords(r);
}
function registrarPisoRoguelike(piso) {
  const r = cargarRecords();
  if (piso > r.mejorPisoRoguelike) r.mejorPisoRoguelike = piso;
  guardarRecords(r);
}
function registrarRoguelikeGanado() {
  const r = cargarRecords();
  r.roguelikesGanados++;
  guardarRecords(r);
}
