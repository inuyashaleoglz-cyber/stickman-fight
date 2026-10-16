// ============================================================
//  RUN — Estado global + helpers de piso
// ============================================================
let run = null;

function factorPiso(piso) {
  if (piso < 35) {
    return 1 + (piso - 1) * 0.035;
  }
  const p = piso - 35;
  return 1 + (p / 100) + Math.pow(p / 30, 2) * 0.5 + (34 * 0.035);
}

function dificultadDelPiso(piso) {
  if (piso <= 6) return 'facil';
  if (piso <= 14) return 'normal';
  if (piso <= 28) return 'dificil';
  return 'pesadilla';
}

function crearRun(personajeId) {
  return {
    activo: true,
    personajeId: personajeId,
    piso: 1,
    mejorasTomadas: [],
    bonuses: bonusesVacios(),
    comboTope: 0,
    dañoTotal: 0,
    rivalesVencidos: [],
    sinergiaPendienteAviso: null,
    esBossPiso: false,
    esBossPisoFinal: false,
    esElitePiso: false,
    eleccionesRestantes: 0,
    __vidaAlEntrar: undefined,
    oro: 0,
    conquistasRealizadas: 0,
    mejorasCompradasTienda: [],
    tiendaVendidos: {}
  };
}
