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
//  HELPERS DE PISO
// ============================================================
function esJefeDeSeccion(piso) {
  return piso === 15 || piso === 45 || piso === 75 || piso === 105 || piso === 135;
}
function esMiniBoss(piso) {
  return piso === 30 || piso === 60 || piso === 90 || piso === 120;
}
function esBossReal(piso)   { return piso === 50; }
function esBossOculto(piso) { return piso === 100; }
function esBossFinal(piso)  { return piso === 150; }

function esPisoBoss(piso) {
  return esJefeDeSeccion(piso) || esMiniBoss(piso) ||
         esBossReal(piso) || esBossOculto(piso) || esBossFinal(piso);
}
function esPisoBossFinal(piso) {
  return esBossReal(piso) || esBossOculto(piso) || esBossFinal(piso);
}
function nombrePisoBoss(piso){
  if (esBossFinal(piso)) return 'BOSS FINAL';
  if (esBossOculto(piso)) return 'EL VACÍO';
  if (esBossReal(piso)) return 'SEÑOR DEL VACÍO';
  if (esMiniBoss(piso)) return 'MINI-BOSS';
  return 'JEFE DE SECCIÓN ' + piso;
}

function tipoDePiso(piso) {
  if (piso <= 0) return 'normal';
  if (esBossFinal(piso) || esBossOculto(piso) || esBossReal(piso)) return 'boss_final';
  if (esMiniBoss(piso)) return 'boss';
  if (esJefeDeSeccion(piso)) return 'boss';
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
//  BONUSES VACÍOS
// ============================================================
function bonusesVacios() {
  return {
    // Originales
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
    // Legendarias
    relojArena: 0,
    corazonTitan: 0,
    cuchilloAsesino: 0,
    espejoRoto: 0,
    ojoVacio: 0,
    coronaRey: 0,
    amuletoCazador: 0,
    monedaSuerte: 0,
    corazonTempestuoso: 0,
    plumaFenix: 0,
    cicatrizGuerra: 0,
    mantoSombras: 0,
    bolaCristal: 0,
    calaveraMaldita: 0,
    estrellaFugaz: 0,
    // Maldiciones
    sangreDiablo: 0,
    pactoVacio: 0,
    pesoMundo: 0,
    almasLlamas: 0,
    corazonHelado: 0,
    marcaCazador: 0,
    fragmentoMaldito: 0,
    cadenaPreso: 0,
    espejoQuebrado: 0,
    ojoCiego: 0,
    // Estados
    veneno: 0,
    quemadura: 0,
    congelacionEstado: 0,
    shock: 0,
    corrosion: 0,
    maldicionEstado: 0,
    bendicion: 0,
    regeneracionEstado: 0,
    escudo: 0,
    // Sinergias
    sinergiasActivas: []
  };
}

// ============================================================
//  ENTRADA
// ============================================================
const keys = {};
const justPressed = {};

document.addEventListener('keydown', function(e) {
  if (typeof initAudio === 'function') initAudio();
  const k = e.key.toLowerCase();
  if (!keys[k]) justPressed[k] = true;
  keys[k] = true;
  if (k === 'r' && typeof iniciarPartida === 'function') iniciarPartida();
  if (k === 'p' && typeof togglePausa === 'function') togglePausa();
  if (typeof estadoJuego !== 'undefined' && estadoJuego === 'boss_warning' && typeof saltarAvisoBoss === 'function') {
    if (k !== 'm') saltarAvisoBoss();
  }
  if (typeof estadoJuego !== 'undefined' && estadoJuego === 'vs_screen' && typeof saltarVSScreen === 'function') {
    if (k !== 'm') saltarVSScreen();
  }
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
