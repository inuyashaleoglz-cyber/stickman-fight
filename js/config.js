// ============================================================
//  CANVAS Y CONSTANTES GLOBALES
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
//  PERSONAJES
// ============================================================
const CHARACTERS = [
  { id:'rocky',  name:'ROCKY',  desc:'Tanque equilibrado', color:'#4ade80', accent:'#22c55e',
    maxHealth: 115, speed: 4.3, dmgMult: 1.05, jumpPower: -13,
    stats:{hp:78, spd:60, pow:75, def:85},
    abilityName:'PIEL DE HIERRO', abilityDesc:'-15% daño recibido',
    specialName:'METEORO', special: { damage:32, range:80, launch:true, superArmor:true } },

  { id:'blaze',  name:'BLAZE',  desc:'Rápido y ágil', color:'#fbbf24', accent:'#f59e0b',
    maxHealth: 85, speed: 5.7, dmgMult: 0.85, jumpPower: -14.5,
    stats:{hp:48, spd:98, pow:55, def:45},
    abilityName:'DOBLE SALTO', abilityDesc:'Salta 2 veces en el aire',
    specialName:'FURIA FUGÁZ', special: { damage:30, range:80, launch:false } },

  { id:'titan',  name:'TITAN',  desc:'Lento y brutal', color:'#a78bfa', accent:'#8b5cf6',
    maxHealth: 145, speed: 3.2, dmgMult: 1.35, jumpPower: -11.5,
    stats:{hp:98, spd:30, pow:98, def:95},
    abilityName:'ROCA VIVA', abilityDesc:'-25% daño, no retrocede',
    specialName:'TERREMOTO', special: { damage:36, range:110, launch:true } },

  { id:'shadow', name:'SHADOW', desc:'Ninja veloz', color:'#06b6d4', accent:'#0891b2',
    maxHealth: 95, speed: 4.6, dmgMult: 1.05, jumpPower: -14,
    stats:{hp:58, spd:82, pow:72, def:55},
    abilityName:'SOMBRA VELOZ', abilityDesc:'+30% vel al retroceder',
    specialName:'CORTE UMBRÍO', special: { damage:32, range:90, launch:false, teleport:true } },

  { id:'frost',  name:'FROST',  desc:'Maestro del hielo', color:'#67e8f9', accent:'#0ea5e9',
    maxHealth: 92, speed: 4.5, dmgMult: 0.95, jumpPower: -13.5,
    stats:{hp:55, spd:72, pow:68, def:58},
    abilityName:'TOQUE GÉLIDO', abilityDesc:'Sus golpes ralentizan 2s',
    specialName:'VENTISCA', special: { damage:24, range:9999, launch:false, projectile:true, slow:true } },

  { id:'bolt',   name:'BOLT',   desc:'Velocidad eléctrica', color:'#fde047', accent:'#eab308',
    maxHealth: 88, speed: 5.0, dmgMult: 1.0, jumpPower: -14,
    stats:{hp:55, spd:88, pow:78, def:50},
    abilityName:'SOBRECARGA', abilityDesc:'Rayo extra cada 4 golpes',
    specialName:'TORMENTA', special: { damage:28, range:9999, launch:true, lightning:true } },

  { id:'phoenix', name:'PHOENIX', desc:'Fénix inmortal', color:'#fb923c', accent:'#f97316',
    maxHealth: 100, speed: 4.2, dmgMult: 1.05, jumpPower: -13,
    stats:{hp:68, spd:65, pow:78, def:62},
    abilityName:'REGENERACIÓN', abilityDesc:'Cura vida lentamente',
    specialName:'NOVA SOLAR', special: { damage:28, range:130, launch:true, heal:18 } }
];

// ============================================================
//  DIFICULTADES DE LA IA
// ============================================================
const AIS = {
  facil:     { name:'FÁCIL',     color:'#4ade80', reaction:26, aggression:0.35, blockChance:0.25, dodgeChance:0.15, speedMult:0.80, dmgMult:0.75, prediction:0.0, specialUse:0.3 },
  normal:    { name:'NORMAL',    color:'#38bdf8', reaction:16, aggression:0.60, blockChance:0.45, dodgeChance:0.30, speedMult:0.95, dmgMult:1.00, prediction:0.2, specialUse:0.6 },
  dificil:   { name:'DIFÍCIL',   color:'#fbbf24', reaction:9,  aggression:0.80, blockChance:0.65, dodgeChance:0.45, speedMult:1.10, dmgMult:1.15, prediction:0.45, specialUse:0.85 },
  pesadilla: { name:'PESADILLA', color:'#ef4444', reaction:5,  aggression:0.95, blockChance:0.82, dodgeChance:0.65, speedMult:1.25, dmgMult:1.30, prediction:0.75, specialUse:1.0 }
};

// ============================================================
//  MOVIMIENTOS (frame data)
// ============================================================
const MOVES = {
  punch:      { startup:3,  active:4,  recovery:8,  damage:5,  range:62, kb:2,   meterGain:6,  crouchHit:false, jumpHit:false, launch:false },
  kick:       { startup:6,  active:4,  recovery:12, damage:9,  range:78, kb:4,   meterGain:8,  crouchHit:false, jumpHit:false, launch:false },
  uppercut:   { startup:8,  active:5,  recovery:18, damage:14, range:55, kb:6,   meterGain:12, crouchHit:true,  jumpHit:false, launch:true },
  lowPunch:   { startup:3,  active:4,  recovery:9,  damage:5,  range:55, kb:2,   meterGain:6,  crouchHit:true,  jumpHit:false, launch:false },
  sweep:      { startup:7,  active:4,  recovery:16, damage:10, range:72, kb:5,   meterGain:10, crouchHit:true,  jumpHit:false, launch:true, low:true },
  jumpAttack: { startup:3,  active:8,  recovery:4,  damage:10, range:70, kb:4,   meterGain:10, crouchHit:true,  jumpHit:true,  launch:false },
  special:    { startup:12, active:10, recovery:22, damage:24, range:105, kb:12, meterGain:0,  crouchHit:true,  jumpHit:true,  launch:true, special:true }
};
