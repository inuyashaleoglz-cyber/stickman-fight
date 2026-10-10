// ============================================================
//  ESTADO DEL RUN
// ============================================================
let run = null;

function crearRun(personajeId) {
  return {
    activo: true,
    personajeId: personajeId,
    piso: 1,
    mejorasTomadas: [],
    bonuses: bonusesVacios(),
    comboTope: 0,
    dañoTotal: 0,
    rivalesVencidos: []
  };
}

// ============================================================
//  ESCALADO DEL RIVAL POR PISO
// ============================================================
function factorPiso(piso) {
  // Escala suave: piso 1 = 1.0, piso 30 = 2.5
  return 1 + (piso - 1) * 0.05;
}

function crearRivalDelPiso(piso, personajeJugadorId) {
  // Elegir personaje aleatorio distinto al del jugador
  const disponibles = CHARACTERS.filter(function(c){ return c.id !== personajeJugadorId; });
  const base = disponibles[Math.floor(Math.random() * disponibles.length)];
  // Clonar y escalar
  const def = JSON.parse(JSON.stringify(base));
  const factor = factorPiso(piso);
  def.maxHealth = Math.round(def.maxHealth * factor);
  def.dmgMult = def.dmgMult * (1 + (piso - 1) * 0.03); // +3% daño por piso
  def.speed = def.speed * (1 + (piso - 1) * 0.01);     // +1% velocidad por piso
  def.__piso = piso;
  return def;
}

function dificultadDelPiso(piso) {
  // Los primeros pisos son fáciles, los últimos pesadilla
  if (piso <= 5) return 'facil';
  if (piso <= 12) return 'normal';
  if (piso <= 22) return 'dificil';
  return 'pesadilla';
}

// ============================================================
//  GENERAR 3 MEJORAS ALEATORIAS
// ============================================================
function elegirMejorasAleatorias(cantidad) {
  // Filtrar mejoras disponibles para el personaje actual
  const personajeActual = run ? run.personajeId : null;
  const disponibles = MEJORAS.filter(function(m) {
    // Las mejoras sin "soloPara" son para todos
    if (!m.soloPara) return true;
    // Las que tienen "soloPara" solo aparecen si coincide con el personaje
    return m.soloPara === personajeActual;
  });

  // Agrupar por rareza
  const porRareza = { comun: [], rara: [], epica: [] };
  disponibles.forEach(function(m){
    if (porRareza[m.rarity]) porRareza[m.rarity].push(m);
  });

  const elegidas = [];
  const usadas = {};

  for (let i = 0; i < cantidad; i++) {
    const r = Math.random() * 100;
    let rareza;
    if (r < RARITY_WEIGHTS.epica) rareza = 'epica';
    else if (r < RARITY_WEIGHTS.epica + RARITY_WEIGHTS.rara) rareza = 'rara';
    else rareza = 'comun';

    let pool = porRareza[rareza].filter(function(m){ return !usadas[m.id]; });
    if (pool.length === 0) {
      // Si se agotó esta rareza, juntar todas las disponibles
      const todas = disponibles.filter(function(m){ return !usadas[m.id]; });
      if (todas.length === 0) break;
      pool = todas;
    }

    const elegida = pool[Math.floor(Math.random() * pool.length)];
    elegidas.push(elegida);
    usadas[elegida.id] = true;
  }

  return elegidas;
}

// ============================================================
//  APLICAR MEJORA AL RUN
// ============================================================
function aplicarMejora(mejora) {
  mejora.apply(run.bonuses);
  run.mejorasTomadas.push(mejora.id);

  // Revisar si se activa alguna sinergia nueva
  SINERGIAS.forEach(function(s) {
    // ¿Ya la tenemos activada? Saltar.
    if (run.bonuses.sinergiasActivas.indexOf(s.id) !== -1) return;
    // ¿Tenemos todas las mejoras requeridas?
    const tieneTodas = s.requiere.every(function(reqId) {
      return run.mejorasTomadas.indexOf(reqId) !== -1;
    });
    if (tieneTodas) {
      s.apply(run.bonuses);
      run.bonuses.sinergiasActivas.push(s.id);
      // Mostrar aviso en el HUD de la próxima pelea
      run.sinergiaPendienteAviso = s;
    }
  });
}

// ============================================================
//  CONSTRUIR FIGHTER DEL JUGADOR CON BONUSES
// ============================================================
function construirJugadorConBonuses() {
  const base = CHARACTERS.find(function(c){ return c.id === run.personajeId; });
  const def = JSON.parse(JSON.stringify(base));
  // Aplicar bonuses al def
  def.maxHealth = base.maxHealth + run.bonuses.vidaMax;
  def.speed = base.speed * (1 + run.bonuses.velocidadPct);
  def.dmgMult = base.dmgMult * (1 + run.bonuses.dañoPct);
  // Guardar bonuses por separado para lógica especial
  def.__bonuses = run.bonuses;
  return def;
}

// ============================================================
//  FLUJO DEL ROGUELIKE
// ============================================================
function roguelikeIniciar(personajeId) {
  run = crearRun(personajeId);
  roguelikeEmpezarPiso();
}

function roguelikeEmpezarPiso() {
  const jugadorDef = construirJugadorConBonuses();
  const rivalDef = crearRivalDelPiso(run.piso, run.personajeId);

  // Guardar def del jugador para reusar en todos los pisos
  personajeJugador = jugadorDef;
  personajeIA = rivalDef;

  // Ajustar dificultad global al piso
  dificultad = dificultadDelPiso(run.piso);

  // Crear fighters
  jugador = new Fighter(jugadorDef, 200, 1, false);
  ia = new Fighter(rivalDef, W - 200, -1, true);

  // Vida inicial del jugador: si no es piso 1, conservar salud previa
  if (run.piso > 1 && run.__vidaAlEntrar !== undefined) {
    jugador.salud = run.__vidaAlEntrar;
    jugador.saludGhost = run.__vidaAlEntrar;
  }
  // Medidor inicial por mejoras
  if (run.bonuses.medidorInicial > 0) {
    jugador.meter = Math.min(100, run.bonuses.medidorInicial * 100);
  }

  // Resetear banderas
  victoriasJugador = 0;
  victoriasIA = 0;
  comboTopeEstaPartida = 0;
  escenarioActual = Math.floor(Math.random() * SCENARIOS.length);
  estadoJuego = 'countdown';
  countdownTimer = 180;
  mensajeGrande = '';
  mensajeTimer = 0;
  pausado = false;

  // Limpiar efectos
  particles.length = 0;
  dmgNumbers.length = 0;
  impactRings.length = 0;
  projectiles.length = 0;
  lightningBolts.length = 0;

  clearPresses();
}

function roguelikeAlTerminarPiso(ganador) {
  // ganador: 'jugador' o 'ia'
  if (ganador === 'ia') {
    // Derrota → game over
    run.activo = false;
    registrarPisoRoguelike(run.piso);
    mostrarGameOverRoguelike();
    return;
  }

  // Ganó el piso
  run.rivalesVencidos.push(run.piso);

  // Guardar vida actual para siguiente piso
  const vidaActual = jugador.salud;
  const vidaMax = jugador.maxHealth;
  // Recuperar 20% de la vida máxima
  const recuperacion = Math.round(vidaMax * 0.20);
  const vidaSiguiente = Math.min(vidaMax, vidaActual + recuperacion);
  run.__vidaAlEntrar = vidaSiguiente;

  // ¿Era el último piso?
  if (run.piso >= MAX_PISO) {
    run.activo = false;
    registrarPisoRoguelike(MAX_PISO);
    registrarRoguelikeGanado();
    mostrarVictoriaRoguelike();
    return;
  }

  // Mostrar pantalla de mejoras
  const opciones = elegirMejorasAleatorias(3);
  mostrarPantallaMejoras(opciones);
}

function roguelikeElegirMejora(mejora) {
  aplicarMejora(mejora);
  run.piso++;
  ocultarPantallaMejoras();
  // Pequeña pausa antes de arrancar el siguiente piso
  setTimeout(function() {
    if (run && run.activo) {
      roguelikeEmpezarPiso();
    }
  }, 300);
}

// ============================================================
//  UI: PANTALLA DE MEJORAS
// ============================================================
function mostrarPantallaMejoras(opciones) {

  // Si se activó una sinergia al terminar el piso anterior, avisar
  let textoAviso = '';
  if (run.sinergiaPendienteAviso) {
    textoAviso = ' ✦ ¡SINERGIA ACTIVADA: ' + run.sinergiaPendienteAviso.nombre + '!';
    run.sinergiaPendienteAviso = null;
  }

  const overlay = document.getElementById('upgradeOverlay');
  const grid = document.getElementById('upgradeGrid');
  const sub = document.getElementById('upgradeSub');

  sub.textContent = 'Piso ' + run.piso + ' superado · Elige una mejora para el piso ' + (run.piso + 1) + textoAviso;
  grid.innerHTML = '';

  opciones.forEach(function(m) {
    const card = document.createElement('div');
    card.className = 'upgrade-card';
    card.innerHTML =
      '<span class="rarity ' + m.rarity + '">' + m.rarity + '</span>' +
      '<span class="icon">' + m.icon + '</span>' +
      '<div class="name">' + m.name + '</div>' +
      '<div class="desc">' + m.desc + '</div>';
    card.addEventListener('click', function() {
      SFX.upgrade();
      roguelikeElegirMejora(m);
    });
    grid.appendChild(card);
  });

  overlay.classList.add('active');
}

function ocultarPantallaMejoras() {
  document.getElementById('upgradeOverlay').classList.remove('active');
}

// ============================================================
//  UI: GAME OVER
// ============================================================
function mostrarGameOverRoguelike() {
  SFX.defeat();
  const overlay = document.getElementById('gameOverOverlay');
  const sub = document.getElementById('goSub');
  const stats = document.getElementById('goStats');

  sub.textContent = 'Caíste en el piso ' + run.piso;

  // Contar mejoras tomadas
  const resumen = {};
  run.mejorasTomadas.forEach(function(id) {
    resumen[id] = (resumen[id] || 0) + 1;
  });
  let listaMejoras = '';
  Object.keys(resumen).forEach(function(id) {
    const m = MEJORAS.find(function(x){ return x.id === id; });
    if (m) listaMejoras += m.icon + ' ' + m.name + ' x' + resumen[id] + '<br>';
  });
  if (!listaMejoras) listaMejoras = '<i>Sin mejoras</i>';

  const records = cargarRecords();
  const esRecord = run.piso >= records.mejorPisoRoguelike;

  stats.innerHTML =
    'Piso alcanzado: <b>' + run.piso + ' / 30</b><br>' +
    'Rivales vencidos: <b>' + run.rivalesVencidos.length + '</b><br>' +
    'Mejor combo: <b>' + run.comboTope + ' hits</b><br>' +
    '<br><b>MEJORAS:</b><br>' + listaMejoras +
    (esRecord ? '<br><span style="color:#4ade80">¡NUEVO RÉCORD!</span>' : '<br>Récord: piso ' + records.mejorPisoRoguelike);

  overlay.classList.add('active');
}

// ============================================================
//  UI: VICTORIA TOTAL
// ============================================================
function mostrarVictoriaRoguelike() {
  SFX.victory();
  const overlay = document.getElementById('victoryOverlay');
  const stats = document.getElementById('victoryStats');

  stats.innerHTML =
    '¡Has conquistado los 30 pisos!<br><br>' +
    'Personaje: <b>' + personajeJugador.name + '</b><br>' +
    'Mejor combo: <b>' + run.comboTope + ' hits</b><br>' +
    'Mejoras totales: <b>' + run.mejorasTomadas.length + '</b>';

  overlay.classList.add('active');
}
