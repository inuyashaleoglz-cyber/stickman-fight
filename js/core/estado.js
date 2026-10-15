// ============================================================
//  ESTADO GLOBAL DEL JUEGO
// ============================================================
let jugador = null;
let ia = null;
let dificultad = 'normal';
let personajeJugador = CHARACTERS[0];
let personajeIA = CHARACTERS[1];
let estadoJuego = 'menu';
let countdownTimer = 180;
let roundTimer = 0;
let victoriasJugador = 0;
let victoriasIA = 0;
let mensajeGrande = '';
let mensajeTimer = 0;
let time = 0;
let pausado = false;
let escenarioActual = 0;
let comboTopeEstaPartida = 0;
let modoActual = 'rapido';
let bossWarningTimer = 0;
let impactFrameTimer = 0;
let koZoom = 1;
let koZoomTarget = 1;
let koFocusX = 0;
let koFocusY = 0;
let slowmoFactor = 1;
let slowmoTimer = 0;
// VS Screen
let vsScreenTimer = 0;
let vsScreenYaMostrado = false;
// PERFECT
let dañoRecibidoRonda1 = 0;
let dañoRecibidoRonda2 = 0;
let esPerfectRound = false;
// Combo calls
let ultimoComboLlamado = 0;
let dañoTotalInfligido = 0;
