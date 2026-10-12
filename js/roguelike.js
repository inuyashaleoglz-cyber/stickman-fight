// ============================================================
//  ESTADO DEL RUN
// ============================================================
let run = null;

// ============================================================
//  HELPERS DE PISO
// ============================================================
function factorPiso(piso) {
  // Escalado lineal suave hasta el piso 34
  if (piso < 35) {
    return 1 + (piso - 1) * 0.035;
  }
  // Escalado exponencial desde el piso 35
  const p = piso - 35;
  return 1 + (p / 100) + Math.pow(p / 30, 2) * 0.5 + (34 * 0.035);
}

function dificultadDelPiso(piso) {
  if (piso <= 6) return 'facil';
  if (piso <= 14) return 'normal';
  if (piso <= 28) return 'dificil';
  return 'pesadilla';
}

// ============================================================
//  ELECCIÓN DE MEJORAS (con maxStack)
// ============================================================
function elegirMejorasAleatoriasConRareza(cantidad, rarezaForzada) {
  const personajeActual = run ? run.personajeId : null;
  const disponibles = MEJORAS.filter(function(m) {
    if (m.soloPara && m.soloPara !== personajeActual) return false;
    if (run) {
      const maxStack = m.maxStack || 3;
      const tomadas = run.mejorasTomadas.filter(function(x){ return x === m.id; }).length;
      if (tomadas >= maxStack) return false;
    }
    return true;
  }).filter(function(m) { return m.rarity === rarezaForzada; });

  if (disponibles.length < cantidad) {
    return elegirMejorasAleatorias(cantidad);
  }

  const elegidas = [];
  const usadas = {};
  for (let i = 0; i < cantidad; i++) {
    const pool = disponibles.filter(function(m){ return !usadas[m.id]; });
    if (pool.length === 0) break;
    const e = pool[Math.floor(Math.random() * pool.length)];
    elegidas.push(e);
    usadas[e.id] = true;
  }
  return elegidas;
}

function elegirMejorasAleatorias(cantidad) {
  const personajeActual = run ? run.personajeId : null;
  const disponibles = MEJORAS.filter(function(m) {
    if (m.soloPara && m.soloPara !== personajeActual) return false;
    if (run) {
      const maxStack = m.maxStack || 3;
      const tomadas = run.mejorasTomadas.filter(function(x){ return x === m.id; }).length;
      if (tomadas >= maxStack) return false;
    }
    return true;
  });

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
//  CREAR RUN
// ============================================================
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

// ============================================================
//  CREAR RIVAL DEL PISO
// ============================================================
function crearRivalDelPiso(piso, personajeJugadorId) {
  const tipo = tipoDePiso(piso);
  let def;

  if (esBossFinal(piso) || esBossOculto(piso) || esBossReal(piso)) {
    // Bosses mayores: usan el personaje especial BOSSES[0]
    def = JSON.parse(JSON.stringify(BOSSES[0]));
    // Escalado especial según piso
    let factor = 1;
    if (esBossReal(piso)) factor = 1.0;
    if (esBossOculto(piso)) factor = 1.5;
    if (esBossFinal(piso)) factor = 2.2;
    def.maxHealth = Math.round(def.maxHealth * factor);
    def.dmgMult = def.dmgMult * factor;
    def.__esBoss = true; def.__esBossFinal = true; def.__esElite = false;
    if (esBossFinal(piso)) def.name = 'EL ARQUITECTO';
    else if (esBossOculto(piso)) def.name = 'EL VACÍO';
    else def.name = 'SEÑOR DEL VACÍO';
  } else if (esPisoBoss(piso)) {

       // Mini-boss (30, 60, 90, 120) o Jefe de Sección (15, 45, 75, 105, 135)
    const disponibles = CHARACTERS.filter(function(c){ return c.id !== personajeJugadorId; });
    const base = disponibles[Math.floor(Math.random() * disponibles.length)];
    def = JSON.parse(JSON.stringify(base));
    const factor = factorPiso(piso);
    if (esMiniBoss(piso)) {
      // Mini-Boss: 2 fases, más fuerte
      def.maxHealth = Math.round(def.maxHealth * factor * 1.30);
      def.dmgMult = def.dmgMult * (1 + (piso - 1) * 0.025) * 1.12;
      def.speed = def.speed * (1 + (piso - 1) * 0.008) * 1.03;
      def.name = 'MINI-BOSS ' + def.name;
      def.__esBoss = true; def.__esBossFinal = true; def.__esElite = false;
    } else {
      // Jefe de Sección: más fuerte que elite pero sin multi-fase
      def.maxHealth = Math.round(def.maxHealth * factor * 1.15);
      def.dmgMult = def.dmgMult * (1 + (piso - 1) * 0.022) * 1.08;
      def.speed = def.speed * (1 + (piso - 1) * 0.006) * 1.02;
      def.name = 'JEFE ' + def.name;
      def.__esBoss = true; def.__esBossFinal = false; def.__esElite = false;
    }
  } else if (tipo === 'elite') {
    
    const disponibles = CHARACTERS.filter(function(c){ return c.id !== personajeJugadorId; });
    const base = disponibles[Math.floor(Math.random() * disponibles.length)];
    def = JSON.parse(JSON.stringify(base));
    const factor = factorPiso(piso);
    def.maxHealth = Math.round(def.maxHealth * factor * 1.20);
    def.dmgMult = def.dmgMult * (1 + (piso - 1) * 0.025) * 1.12;
    def.speed = def.speed * (1 + (piso - 1) * 0.008) * 1.03;
    def.name = '★ ' + def.name;
    def.__esBoss = false; def.__esBossFinal = false; def.__esElite = true;
  } else {
    const disponibles = CHARACTERS.filter(function(c){ return c.id !== personajeJugadorId; });
    const base = disponibles[Math.floor(Math.random() * disponibles.length)];
    def = JSON.parse(JSON.stringify(base));
    const factor = factorPiso(piso);
    def.maxHealth = Math.round(def.maxHealth * factor);
    def.dmgMult = def.dmgMult * (1 + (piso - 1) * 0.025);
    def.speed = def.speed * (1 + (piso - 1) * 0.008);
    def.__esBoss = false; def.__esBossFinal = false; def.__esElite = false;
  }

  def.__piso = piso;
  // Asignar afijos según el piso
  const afijos = elegirAfijosParaPiso(piso);
  def.__afijos = afijos;
  // Aplicar los afijos estáticos inmediatamente al def
  afijos.forEach(function(afijo) {
    if (afijo.tipo === 'estatico' && afijo.aplicarEstatico) {
      afijo.aplicarEstatico(def);
    }
  });
  return def;
}

// ============================================================
//  CONSTRUIR JUGADOR CON BONUSES
// ============================================================
function construirJugadorConBonuses() {
  const base = CHARACTERS.find(function(c){ return c.id === run.personajeId; });
  const def = JSON.parse(JSON.stringify(base));
  def.maxHealth = base.maxHealth + run.bonuses.vidaMax;
  def.speed = base.speed * (1 + run.bonuses.velocidadPct);
  def.dmgMult = base.dmgMult * (1 + run.bonuses.dañoPct);
  def.__bonuses = run.bonuses;
  return def;
}

// ============================================================
//  APLICAR MEJORA (+ sinergias)
// ============================================================
function aplicarMejora(mejora) {
  mejora.apply(run.bonuses);
  run.mejorasTomadas.push(mejora.id);

  SINERGIAS.forEach(function(s) {
    if (run.bonuses.sinergiasActivas.indexOf(s.id) !== -1) return;
    const tieneTodas = s.requiere.every(function(reqId) {
      return run.mejorasTomadas.indexOf(reqId) !== -1;
    });
    if (tieneTodas) {
      s.apply(run.bonuses);
      run.bonuses.sinergiasActivas.push(s.id);
      run.sinergiaPendienteAviso = s;
    }
  });
}

// ============================================================
//  FLUJO DEL ROGUELIKE
// ============================================================
function roguelikeIniciar(personajeId) {
  run = crearRun(personajeId);
  roguelikeEmpezarPiso();
}

function roguelikeEmpezarPiso() {
  const tipo = tipoDePiso(run.piso);

  if (tipo === 'descanso' || tipo === 'tesoro') {
    iniciarEvento(tipo);
    estadoJuego = 'evento';
    return;
  }
  if (tipo === 'tienda') {
    mostrarTienda();
    estadoJuego = 'evento';
    return;
  }

  const jugadorDef = construirJugadorConBonuses();
  const rivalDef = crearRivalDelPiso(run.piso, run.personajeId);

  if (run.bonuses.curaEntrePisos > 0 && run.piso > 1 && run.__vidaAlEntrar !== undefined) {
    run.__vidaAlEntrar = Math.min(jugadorDef.maxHealth, run.__vidaAlEntrar + run.bonuses.curaEntrePisos);
  }

  personajeJugador = jugadorDef;
  personajeIA = rivalDef;
  dificultad = dificultadDelPiso(run.piso);
  jugador = new Fighter(jugadorDef, 200, 1, false);
  ia = new Fighter(rivalDef, W - 200, -1, true);

  if (run.piso > 1 && run.__vidaAlEntrar !== undefined) {
    jugador.salud = run.__vidaAlEntrar;
    jugador.saludGhost = run.__vidaAlEntrar;
  }
  if (run.bonuses.medidorInicial > 0) {
    jugador.meter = Math.min(100, run.bonuses.medidorInicial * 100);
  }
  // Inicializar revivires
  jugador.reviviresRestantes = run.bonuses.revivir || 0;

  victoriasJugador = 0;
  victoriasIA = 0;
  comboTopeEstaPartida = 0;
  escenarioActual = Math.floor(Math.random() * SCENARIOS.length);
    if (typeof playAmbient === 'function') {
    playAmbient(SCENARIOS[escenarioActual].id);
  }
  mensajeGrande = '';
  mensajeTimer = 0;
  pausado = false;

  particles.length = 0;
  dmgNumbers.length = 0;
  impactRings.length = 0;
  projectiles.length = 0;
  lightningBolts.length = 0;

  if (typeof koZoom !== 'undefined') {
    koZoom = 1;
    koZoomTarget = 1;
    koFocusX = 0;
    koFocusY = 0;
    slowmoFactor = 1;
    slowmoTimer = 0;
    impactFrameTimer = 0;
  }

  clearPresses();

  if (rivalDef.__esBoss) {
    run.esBossPiso = true;
    run.esBossPisoFinal = rivalDef.__esBossFinal;
    run.esElitePiso = false;
    run.eleccionesRestantes = 0;
    ia.faseActual = 1;
    estadoJuego = 'boss_warning';
    bossWarningTimer = 120;
    mostrarAvisoBoss(rivalDef);
    if (typeof playMusic === 'function') playMusic('boss');
  } else if (rivalDef.__esElite) {
    run.esBossPiso = false;
    run.esBossPisoFinal = false;
    run.esElitePiso = true;
    run.eleccionesRestantes = 0;
    estadoJuego = 'boss_warning';
    bossWarningTimer = 120;
    mostrarAvisoElite(rivalDef);
  } else {
    run.esBossPiso = false;
    run.esBossPisoFinal = false;
    run.esElitePiso = false;
    run.eleccionesRestantes = 0;
    estadoJuego = 'countdown';
    countdownTimer = 180;
    if (typeof playMusic === 'function') playMusic('combat');
  }

  if (typeof ultimoComboLlamado !== 'undefined') ultimoComboLlamado = 0;
}

// ============================================================
//  AVISOS
// ============================================================
function mostrarAvisoBoss(rivalDef) {
  const overlay = document.getElementById('bossWarningOverlay');
  const title = document.getElementById('bossWarningTitle');
  const sub = document.getElementById('bossWarningSub');
  const icon = document.getElementById('bossWarningIcon');
  overlay.classList.remove('elite');
  if (rivalDef.__esBossFinal) {
    overlay.classList.add('final');
    title.textContent = rivalDef.name;
    sub.textContent = '⚡ JEFE FINAL · 3 FASES ⚡';
    icon.textContent = '🔥';
  } else {
    overlay.classList.remove('final');
    title.textContent = rivalDef.name;
    sub.textContent = '⚠ MINIBOSS · RECOMPENSA DOBLE ⚠';
    icon.textContent = '⚠';
  }
  overlay.classList.add('active');
  // Marcar tiempo real de inicio para el cierre por update()
  window.__avisoStartTime = Date.now();
  // Capa 1: setTimeout por si update() falla
  if (window.__avisoTimer) clearTimeout(window.__avisoTimer);
  window.__avisoTimer = setTimeout(function() {
    ocultarAvisoBoss();
    if (estadoJuego === 'boss_warning') {
      estadoJuego = 'countdown';
      countdownTimer = 180;
      clearPresses();
    }
    window.__avisoStartTime = null;
  }, 2000);
    // Mostrar afijos si los tiene
  const sub2 = document.getElementById('bossWarningSub');
  if (rivalDef.__afijos && rivalDef.__afijos.length > 0 && sub2) {
    let texto = sub2.textContent;
    texto += ' · ';
    rivalDef.__afijos.forEach(function(a, i) {
      texto += a.icono + ' ' + a.nombre + (i < rivalDef.__afijos.length - 1 ? ' · ' : '');
    });
    sub2.textContent = texto;
    sub2.style.fontSize = '9px';
  }
}

function mostrarAvisoElite(rivalDef) {
  const overlay = document.getElementById('bossWarningOverlay');
  const title = document.getElementById('bossWarningTitle');
  const sub = document.getElementById('bossWarningSub');
  const icon = document.getElementById('bossWarningIcon');
  overlay.classList.remove('final');
  overlay.classList.add('elite');
  title.textContent = '¡ELITE!';
  sub.textContent = '★ RECOMPENSA ÉPICA ASEGURADA ★';
  icon.textContent = '⚔';
  overlay.classList.add('active');
  // Marcar tiempo real de inicio para el cierre por update()
  window.__avisoStartTime = Date.now();
  // Capa 1: setTimeout por si update() falla
  if (window.__avisoTimer) clearTimeout(window.__avisoTimer);
  window.__avisoTimer = setTimeout(function() {
    ocultarAvisoBoss();
    if (estadoJuego === 'boss_warning') {
      estadoJuego = 'countdown';
      countdownTimer = 180;
      clearPresses();
    }
    window.__avisoStartTime = null;
  }, 2000);
  const sub3 = document.getElementById('bossWarningSub');
  if (rivalDef && rivalDef.__afijos && rivalDef.__afijos.length > 0 && sub3) {
    let texto = sub3.textContent;
    texto += ' · ';
    rivalDef.__afijos.forEach(function(a, i) {
      texto += a.icono + ' ' + a.nombre + (i < rivalDef.__afijos.length - 1 ? ' · ' : '');
    });
    sub3.textContent = texto;
    sub3.style.fontSize = '9px';
  }
}

function ocultarAvisoBoss() {
  const overlay = document.getElementById('bossWarningOverlay');
  if (overlay) {
    overlay.classList.remove('active');
    overlay.classList.remove('final');
    overlay.classList.remove('elite');
  }
}

// ============================================================
//  TERMINAR PISO
// ============================================================
function roguelikeAlTerminarPiso(ganador) {
  if (ganador === 'ia') {
    run.activo = false;
    registrarPisoRoguelike(run.piso);
    mostrarGameOverRoguelike();
    return;
  }

  run.rivalesVencidos.push(run.piso);

  let oroGanado = 10 + run.piso * 2;
  if (run.esElitePiso) oroGanado += 30;
  if (run.esBossPiso) oroGanado += 60;
  run.oro += oroGanado;

  const vidaActual = jugador.salud;
  const vidaMax = jugador.maxHealth;
  // Curación progresiva: baja a medida que subes de piso
  let porcentajeCura = 0.30;
  if (run.piso >= 31 && run.piso <= 50) porcentajeCura = 0.28;
  else if (run.piso >= 51 && run.piso <= 70) porcentajeCura = 0.25;
  else if (run.piso >= 71 && run.piso <= 100) porcentajeCura = 0.22;
  else if (run.piso >= 101 && run.piso <= 130) porcentajeCura = 0.18;
  else if (run.piso >= 131) porcentajeCura = 0.15;
  const recuperacion = Math.round(vidaMax * porcentajeCura);
  const vidaSiguiente = Math.min(vidaMax, vidaActual + recuperacion);
  run.__vidaAlEntrar = vidaSiguiente;

  const esConquista = (run.piso % 30 === 0);
  if (esConquista) {
    run.conquistasRealizadas++;
    run.oro += 200;
    window.__pendienteConquista = true;
  } else {
    window.__pendienteConquista = false;
  }

  if (run.esBossPiso) {
    run.eleccionesRestantes = 2;
    mostrarSiguienteTandaMejoras();
  } else if (run.esElitePiso) {
    run.eleccionesRestantes = 1;
    const opciones = elegirMejorasAleatoriasConRareza(3, 'epica');
    mostrarPantallaMejoras(opciones);
  } else {
    run.eleccionesRestantes = 1;
    mostrarSiguienteTandaMejoras();
  }
}

function mostrarSiguienteTandaMejoras() {
  const opciones = elegirMejorasAleatorias(3);
  mostrarPantallaMejoras(opciones);
}

// ============================================================
//  ELEGIR MEJORA
// ============================================================
function roguelikeElegirMejora(mejora) {
  aplicarMejora(mejora);

  if (run.eleccionesRestantes > 1) {
    run.eleccionesRestantes--;
    ocultarPantallaMejoras();
    setTimeout(function() {
      if (run && run.activo) mostrarSiguienteTandaMejoras();
    }, 200);
    return;
  }

  run.eleccionesRestantes = 0;
  ocultarPantallaMejoras();

  if (window.__pendienteConquista) {
    window.__pendienteConquista = false;
    setTimeout(function() {
      if (run && run.activo) mostrarConquista();
    }, 300);
    return;
  }

  run.piso++;
  setTimeout(function() {
    if (run && run.activo) roguelikeEmpezarPiso();
  }, 300);
}

// ============================================================
//  UI: PANTALLA DE MEJORAS
// ============================================================
function mostrarPantallaMejoras(opciones, textoCustom) {
  let textoAviso = '';
  if (run.sinergiaPendienteAviso) {
    textoAviso = ' ✦ ¡SINERGIA ACTIVADA: ' + run.sinergiaPendienteAviso.nombre + '!';
    run.sinergiaPendienteAviso = null;
  }

  const overlay = document.getElementById('upgradeOverlay');
  const grid = document.getElementById('upgradeGrid');
  const sub = document.getElementById('upgradeSub');

  let textoCabecera;
  if (textoCustom) {
    textoCabecera = textoCustom;
  } else if (run.eleccionesRestantes > 1) {
    textoCabecera = '🏆 ¡BOSS VENCIDO! · Elige ' + run.eleccionesRestantes + ' mejoras';
  } else if (run.esBossPiso && run.eleccionesRestantes === 1) {
    textoCabecera = '🏆 ¡BOSS VENCIDO! · Última elección';
  } else if (run.esElitePiso) {
    textoCabecera = '⚔ ¡ELITE VENCIDO! · Mejora épica garantizada';
  } else {
    textoCabecera = 'Piso ' + run.piso + ' superado · Elige una mejora para el piso ' + (run.piso + 1);
  }
  sub.textContent = textoCabecera + textoAviso;

  grid.innerHTML = '';

  opciones.forEach(function(m) {
    const card = document.createElement('div');
    card.className = 'upgrade-card';
    // Contador de stacks actuales
    const stacksActuales = run.mejorasTomadas.filter(function(x){ return x === m.id; }).length;
    const maxStack = m.maxStack || 3;
    card.innerHTML =
      '<span class="rarity ' + m.rarity + '">' + m.rarity + '</span>' +
      '<span class="icon">' + m.icon + '</span>' +
      '<div class="name">' + m.name + '</div>' +
      '<div class="desc">' + m.desc + '</div>' +
      '<div style="font-size:10px;color:#fbbf24;margin-top:6px">Stack ' + (stacksActuales + 1) + '/' + maxStack + '</div>';
    card.addEventListener('click', function() {
      SFX.upgrade();
      roguelikeElegirMejora(m);
    });
    grid.appendChild(card);
  });

  overlay.classList.add('active');

  let btnBuild = document.getElementById('btnVerBuild');
  if (!btnBuild) {
    btnBuild = document.createElement('button');
    btnBuild.id = 'btnVerBuild';
    btnBuild.className = 'overlay-btn';
    btnBuild.textContent = '📊 VER BUILD (TAB)';
    btnBuild.style.background = 'linear-gradient(135deg, #38bdf8, #0ea5e9)';
    btnBuild.addEventListener('click', function(){ toggleBuildOverlay(); });
    document.getElementById('upgradeOverlay').appendChild(btnBuild);
  }
}

function ocultarPantallaMejoras() {
  document.getElementById('upgradeOverlay').classList.remove('active');
  cerrarBuildOverlay();
}

// ============================================================
//  UI: GAME OVER
// ============================================================
function mostrarGameOverRoguelike() {
  if (typeof stopMusic === 'function') stopMusic();
  if (typeof stopAmbient === 'function') stopAmbient();
  SFX.defeat();
  const overlay = document.getElementById('gameOverOverlay');
  const sub = document.getElementById('goSub');
  const stats = document.getElementById('goStats');

  sub.textContent = 'Caíste en el piso ' + run.piso;

  const resumen = {};
  run.mejorasTomadas.forEach(function(id) {
    resumen[id] = (resumen[id] || 0) + 1;
  });

  let listaMejoras = '<div class="mejoras-resumen">';
  const idsOrdenados = Object.keys(resumen).sort(function(a,b) {
    const ma = MEJORAS.find(function(x){ return x.id === a; });
    const mb = MEJORAS.find(function(x){ return x.id === b; });
    if (!ma || !mb) return 0;
    return (mb.rarity === 'epica') - (ma.rarity === 'epica');
  });
  idsOrdenados.forEach(function(id) {
    const m = MEJORAS.find(function(x){ return x.id === id; });
    if (!m) return;
    listaMejoras += '<span title="' + m.desc + '">' +
      m.icon + ' ' + m.name +
      (resumen[id] > 1 ? ' <span class="count">×' + resumen[id] + '</span>' : '') +
      '</span>';
  });
  listaMejoras += '</div>';
  if (idsOrdenados.length === 0) listaMejoras = '<i>Sin mejoras</i>';

  const records = cargarRecords();
  const esRecord = run.piso >= records.mejorPisoRoguelike;

  stats.innerHTML =
    'Piso alcanzado: <b>' + run.piso + '</b><br>' +
    'Rivales vencidos: <b>' + run.rivalesVencidos.length + '</b><br>' +
    'Oro acumulado: <b>' + run.oro + '</b><br>' +
    'Mejor combo: <b>' + run.comboTope + ' hits</b>' +
    (esRecord ? '<br><span style="color:#4ade80">¡NUEVO RÉCORD!</span>' : '<br>Récord: piso ' + records.mejorPisoRoguelike) +
    '<br><br><b>MEJORAS (' + run.mejorasTomadas.length + '):</b>' + listaMejoras;

  overlay.classList.add('active');
}

// ============================================================
//  UI: VICTORIA
// ============================================================
function mostrarVictoriaRoguelike() {
  if (typeof stopMusic === 'function') stopMusic();
  if (typeof stopAmbient === 'function') stopAmbient();
  SFX.victory();
  const overlay = document.getElementById('victoryOverlay');
  const stats = document.getElementById('victoryStats');

  stats.innerHTML =
    'Te retiras en el piso <b>' + run.piso + '</b><br><br>' +
    'Personaje: <b>' + personajeJugador.name + '</b><br>' +
    'Conquistas: <b>' + run.conquistasRealizadas + '</b><br>' +
    'Rivales vencidos: <b>' + run.rivalesVencidos.length + '</b><br>' +
    'Mejor combo: <b>' + run.comboTope + ' hits</b><br>' +
    'Oro total: <b>' + run.oro + '</b><br>' +
    'Mejoras: <b>' + run.mejorasTomadas.length + '</b>';

  overlay.classList.add('active');
}

// ============================================================
//  EVENTOS
// ============================================================
function iniciarEvento(tipo) {
  if (tipo === 'descanso') mostrarDescanso();
  else if (tipo === 'tesoro') mostrarTesoro();
}

function mostrarDescanso() {
  const overlay = document.getElementById('descansoOverlay');
  const grid = document.getElementById('descansoGrid');
  grid.innerHTML = '';

  const opciones = [
    {
      icon: '💚', name: 'RECUPERAR VIDA',
      desc: 'Recuperas un porcentaje de tu vida máxima (baja con el piso).',
      apply: function() {
        const vidaMax = construirJugadorConBonuses().maxHealth;
        const vidaActual = (run.__vidaAlEntrar !== undefined) ? run.__vidaAlEntrar : vidaMax;
        let pct = 0.50;
        if (run.piso >= 31 && run.piso <= 50) pct = 0.45;
        else if (run.piso >= 51 && run.piso <= 70) pct = 0.40;
        else if (run.piso >= 71 && run.piso <= 100) pct = 0.35;
        else if (run.piso >= 101 && run.piso <= 130) pct = 0.28;
        else if (run.piso >= 131) pct = 0.22;
        const curacion = Math.round(vidaMax * pct);
        run.__vidaAlEntrar = Math.min(vidaMax, vidaActual + curacion);
      }
    },
    {
      icon: '❤️', name: 'CORAZÓN DE HIERRO',
      desc: '+40 de vida máxima permanente.',
      apply: function() {
        run.bonuses.vidaMax += 40;
        const vidaMax = construirJugadorConBonuses().maxHealth;
        const vidaActual = (run.__vidaAlEntrar !== undefined) ? run.__vidaAlEntrar : vidaMax;
        run.__vidaAlEntrar = Math.min(vidaMax, vidaActual + 40);
      }
    },
    {
      icon: '🎁', name: 'OBSEQUIO DEL DESTINO',
      desc: 'Recibes 2 mejoras aleatorias al azar.',
      apply: function() {
        const aleatorias = elegirMejorasAleatorias(2);
        aleatorias.forEach(function(m) { aplicarMejora(m); });
      }
    }
  ];

  opciones.forEach(function(op) {
    const card = document.createElement('div');
    card.className = 'descanso-card';
    card.innerHTML =
      '<span class="icon">' + op.icon + '</span>' +
      '<div class="name">' + op.name + '</div>' +
      '<div class="desc">' + op.desc + '</div>';
    card.addEventListener('click', function() {
      SFX.upgrade();
      op.apply();
      ocultarDescanso();
      run.piso++;
      setTimeout(function() {
        if (run && run.activo) roguelikeEmpezarPiso();
      }, 300);
    });
    grid.appendChild(card);
  });

  overlay.classList.add('active');
}

function ocultarDescanso() {
  const el = document.getElementById('descansoOverlay');
  if (el) el.classList.remove('active');
}

function mostrarTesoro() {
  run.eleccionesRestantes = 1;
  const opciones = elegirMejorasAleatoriasConRareza(3, 'epica');
  mostrarPantallaMejoras(opciones, '💎 TESORO · Elige una mejora épica');
}

// ============================================================
//  CONQUISTA
// ============================================================
function mostrarConquista() {
  const overlay = document.getElementById('conquistaOverlay');
  const sub = document.getElementById('conquistaSub');
  const stats = document.getElementById('conquistaStats');

  sub.textContent = '¡Has superado ' + run.piso + ' pisos!';
  stats.innerHTML =
    'Rivales vencidos: <b>' + run.rivalesVencidos.length + '</b><br>' +
    'Oro total: <b>' + run.oro + '</b><br>' +
    'Mejoras: <b>' + run.mejorasTomadas.length + '</b><br>' +
    '<br><span style="color:#fde047">🎁 +200 oro de bonus</span>';

  overlay.classList.add('active');
  estadoJuego = 'evento';
}

function conquistaContinuar() {
  document.getElementById('conquistaOverlay').classList.remove('active');
  run.piso++;
  roguelikeEmpezarPiso();
}

function conquistaRetirarse() {
  document.getElementById('conquistaOverlay').classList.remove('active');
  run.activo = false;
  registrarPisoRoguelike(run.piso);
  mostrarVictoriaRoguelike();
}

// ============================================================
//  TIENDA
// ============================================================
function mostrarTienda() {
  const overlay = document.getElementById('tiendaOverlay');
  const grid = document.getElementById('tiendaGrid');
  const oroEl = document.getElementById('tiendaOroActual');
  oroEl.textContent = run.oro;
  grid.innerHTML = '';

  if (!run.tiendaVendidos) run.tiendaVendidos = {};

  SHOP_ITEMS.forEach(function(item) {
    const card = document.createElement('div');
    card.className = 'tienda-card';
    if (run.tiendaVendidos[item.id]) card.classList.add('vendido');
    else if (run.oro < item.precio) card.classList.add('sin-oro');

    card.innerHTML =
      '<span class="icon">' + item.icon + '</span>' +
      '<div class="name">' + item.name + '</div>' +
      '<div class="desc">' + item.desc + '</div>' +
      '<div class="precio">' + (run.tiendaVendidos[item.id] ? '✓ COMPRADO' : item.precio + ' oro') + '</div>';

    card.addEventListener('click', function() {
      if (run.tiendaVendidos[item.id]) return;
      if (run.oro < item.precio) return;
      comprarItem(item);
      mostrarTienda();
    });
    grid.appendChild(card);
  });

  overlay.classList.add('active');
}

function comprarItem(item) {
  run.oro -= item.precio;
  run.tiendaVendidos[item.id] = true;
  SFX.upgrade();

  switch (item.id) {
    case 'mejora_random': {
      const opciones = elegirMejorasAleatorias(1);
      if (opciones[0]) aplicarMejora(opciones[0]);
      break;
    }
    case 'mejora_epica': {
      const opciones = elegirMejorasAleatoriasConRareza(1, 'epica');
      if (opciones[0]) aplicarMejora(opciones[0]);
      break;
    }
    case 'cura_total': {
      const vidaMax = construirJugadorConBonuses().maxHealth;
      run.__vidaAlEntrar = vidaMax;
      break;
    }
    case 'vida_max': {
      run.bonuses.vidaMax += 40;
      const vidaMax = construirJugadorConBonuses().maxHealth;
      const vidaActual = (run.__vidaAlEntrar !== undefined) ? run.__vidaAlEntrar : vidaMax;
      run.__vidaAlEntrar = Math.min(vidaMax, vidaActual + 40);
      break;
    }
    case 'medidor_lleno': {
      run.bonuses.medidorInicial = Math.max(run.bonuses.medidorInicial, 1.0);
      break;
    }
  }
}

function salirTienda() {
  document.getElementById('tiendaOverlay').classList.remove('active');
  run.tiendaVendidos = {};
  run.piso++;
  roguelikeEmpezarPiso();
}

// ============================================================
//  REVIVIR (Phoenix épica, apilable)
// ============================================================
function intentarRevivir() {
  if (!jugador || !run || !run.bonuses) return false;
  if (!run.bonuses.revivir) return false;
  if (jugador.reviviresRestantes <= 0) return false;
  if (jugador.salud > 0) return false;
  jugador.reviviresRestantes--;
  jugador.salud = Math.round(jugador.maxHealth * 0.40);
  jugador.saludGhost = jugador.salud;
  jugador.invulnerable = 90;
  jugador.estado = 'idle';
  spawnParticles(jugador.x, jugador.y - 55, 60, '#fb923c', 15);
  spawnRing(jugador.x, jugador.y - 55, '#fb923c', 200);
  shake(25);
  mensajeGrande = '¡RENACER!';
  mensajeTimer = 100;
  SFX.victory();
  return true;
}

// ============================================================
//  OVERLAY DE BUILD (TAB)
// ============================================================
function renderBuildOverlay() {
  if (!run) return;

  document.getElementById('buildPisoNum').textContent = run.piso;

  const b = run.bonuses;

  const stats = [];
  if (b.dañoPct > 0)             stats.push({icon:'💥', label:'Daño',           value:'+' + Math.round(b.dañoPct*100) + '%'});
  if (b.vidaMax > 0)             stats.push({icon:'❤️', label:'Vida máx',       value:'+' + b.vidaMax});
  if (b.defensaPct > 0)          stats.push({icon:'🛡️', label:'Defensa',        value:'+' + Math.round(b.defensaPct*100) + '%'});
  if (b.velocidadPct > 0)        stats.push({icon:'💨', label:'Velocidad',      value:'+' + Math.round(b.velocidadPct*100) + '%'});
  if (b.critChance > 0)          stats.push({icon:'🎯', label:'Crítico',        value:Math.round(b.critChance*100) + '%'});
  if (b.vampirismo > 0)          stats.push({icon:'🩸', label:'Vampirismo',     value:Math.round(b.vampirismo*100) + '%'});
  if (b.regeneracion > 0)        stats.push({icon:'🌿', label:'Regeneración',   value:b.regeneracion.toFixed(1) + '/s'});
  if (b.medidorPct > 0)          stats.push({icon:'⚡', label:'Medidor',        value:'+' + Math.round(b.medidorPct*100) + '%'});
  if (b.medidorInicial > 0)      stats.push({icon:'🔥', label:'Medidor inicial',value:Math.round(b.medidorInicial*100) + '%'});
  if (b.punchPct > 0)            stats.push({icon:'👊', label:'Puñetazos',      value:'+' + Math.round(b.punchPct*100) + '%'});
  if (b.kickPct > 0)             stats.push({icon:'🦵', label:'Patadas',        value:'+' + Math.round(b.kickPct*100) + '%'});
  if (b.uppercutPct > 0)         stats.push({icon:'🚀', label:'Uppercut',       value:'+' + Math.round(b.uppercutPct*100) + '%'});
  if (b.comboMasterPct > 0)      stats.push({icon:'🌀', label:'Por combo',      value:'+' + Math.round(b.comboMasterPct*100) + '%'});
  if (b.bloqueoExtraPct > 0)     stats.push({icon:'🧱', label:'Bloqueo extra',  value:'+' + Math.round(b.bloqueoExtraPct*100) + '%'});
  if (b.reflejoPct > 0)          stats.push({icon:'🪞', label:'Reflejo',        value:Math.round(b.reflejoPct*100) + '%'});
  if (b.sangradoPct > 0)         stats.push({icon:'🔴', label:'Sangrado',       value:b.sangradoPct + '/s'});
  if (b.dashPct > 0)             stats.push({icon:'👻', label:'Dash',           value:'+' + Math.round(b.dashPct*100) + '%'});
  if (b.dashDaño > 0)            stats.push({icon:'💨', label:'Daño dash',      value:b.dashDaño});
  if (b.dashInvuln > 0)          stats.push({icon:'✨', label:'Dash invuln',    value:'+' + (b.dashInvuln * 8) + 'f'});
  if (b.saltosExtra > 0)         stats.push({icon:'🕊️', label:'Saltos extra',   value:'+' + b.saltosExtra});
  if (b.curaEntrePisos > 0)      stats.push({icon:'💊', label:'Cura por piso',  value:'+' + b.curaEntrePisos});
  if (b.dañoASlow > 0)           stats.push({icon:'❄️', label:'Daño a ralentizados', value:'+' + Math.round(b.dañoASlow*100) + '%'});
  if (b.velocidadComboPct > 0)   stats.push({icon:'💫', label:'Velocidad en combo', value:'+' + Math.round(b.velocidadComboPct*100) + '%'});
  if (b.furiaBajaVida > 0)       stats.push({icon:'🦅', label:'Furia baja vida', value:'+' + Math.round(b.furiaBajaVida*100) + '%'});
  if (b.revivir > 0)             stats.push({icon:'♻️', label:'Revivir',        value:b.revivir + '/piso'});
  if (b.congelarEspecial > 0)    stats.push({icon:'🧊', label:'Congelar esp.',  value:(b.congelarEspecial * 2) + 's'});
  if (b.clonEspecial > 0)        stats.push({icon:'🌀', label:'Clones esp.',    value:b.clonEspecial});
  if (b.superArmorLeve > 0)      stats.push({icon:'💪', label:'Super armor',    value:'+' + (b.superArmorLeve * 3) + ' dmg'});
  if (b.critGarantizadoCombo > 0)stats.push({icon:'🎯', label:'Crit en combos', value:'Desde 6-' + b.critGarantizadoCombo});
  if (b.rayoFrecuencia < 4)      stats.push({icon:'⚡', label:'Rayo cada',      value:b.rayoFrecuencia + ' golpes'});

  const statsHtml = stats.length
    ? stats.map(function(s) {
        return '<div class="stat-chip">' +
          '<span class="stat-icon">' + s.icon + '</span>' +
          '<span class="stat-label">' + s.label + '</span>' +
          '<span class="stat-value">' + s.value + '</span>' +
        '</div>';
      }).join('')
    : '<p style="color:#666;font-size:12px">Aún no tienes bonus. Elige mejoras al terminar cada piso.</p>';
  document.getElementById('buildStats').innerHTML = statsHtml;

  const resumen = {};
  run.mejorasTomadas.forEach(function(id) {
    resumen[id] = (resumen[id] || 0) + 1;
  });
  const idsMejoras = Object.keys(resumen);

  const ordenRareza = { epica: 0, rara: 1, comun: 2 };
  idsMejoras.sort(function(a, b) {
    const ma = MEJORAS.find(function(x){ return x.id === a; });
    const mb = MEJORAS.find(function(x){ return x.id === b; });
    if (!ma || !mb) return 0;
    return (ordenRareza[ma.rarity] || 9) - (ordenRareza[mb.rarity] || 9);
  });

  let mejorasHtml = '';
  idsMejoras.forEach(function(id) {
    const m = MEJORAS.find(function(x){ return x.id === id; });
    if (!m) return;
    const count = resumen[id];
    const maxStack = m.maxStack || 3;
    const colorRareza = m.rarity === 'epica' ? '#a855f7' : (m.rarity === 'rara' ? '#38bdf8' : '#94a3b8');
    mejorasHtml += '<div class="mejora-item" style="border-left-color:' + colorRareza + '">' +
      '<span class="mejora-icon">' + m.icon + '</span>' +
      '<div class="mejora-info">' +
        '<div class="mejora-name">' + m.name +
          ' <span class="mejora-count">' + count + '/' + maxStack + '</span>' +
        '</div>' +
        '<div class="mejora-desc">' + m.desc + '</div>' +
      '</div>' +
    '</div>';
  });
  document.getElementById('buildCountMejoras').textContent = run.mejorasTomadas.length;
  document.getElementById('buildMejoras').innerHTML = mejorasHtml || '<p style="color:#666;font-size:12px">Aún no tienes mejoras.</p>';

  let sinHtml = '';
  SINERGIAS.forEach(function(s) {
    const activa = run.bonuses.sinergiasActivas.indexOf(s.id) !== -1;
    const tiene = s.requiere.filter(function(r){ return run.mejorasTomadas.indexOf(r) !== -1; }).length;
    const total = s.requiere.length;

    if (activa) {
      sinHtml += '<div class="sinergia-item activa">' +
        '<div class="sinergia-header">' +
          '<span class="sinergia-icon">' + s.icon + '</span>' +
          '<span class="sinergia-name">' + s.nombre + '</span>' +
          '<span class="sinergia-badge activa">ACTIVA</span>' +
        '</div>' +
        '<div class="sinergia-desc">' + s.desc + '</div>' +
      '</div>';
    } else if (tiene > 0) {
      const faltan = s.requiere.filter(function(r){ return run.mejorasTomadas.indexOf(r) === -1; });
      const nombresFaltan = faltan.map(function(fid) {
        const m = MEJORAS.find(function(x){ return x.id === fid; });
        return m ? m.icon + ' ' + m.name : fid;
      }).join(', ');
      sinHtml += '<div class="sinergia-item posible">' +
        '<div class="sinergia-header">' +
          '<span class="sinergia-icon">' + s.icon + '</span>' +
          '<span class="sinergia-name">' + s.nombre + '</span>' +
          '<span class="sinergia-badge">' + tiene + '/' + total + '</span>' +
        '</div>' +
        '<div class="sinergia-desc">' + s.desc + '</div>' +
        '<div class="sinergia-falta">Falta: ' + nombresFaltan + '</div>' +
      '</div>';
    } else {
      const nombresReq = s.requiere.map(function(fid) {
        const m = MEJORAS.find(function(x){ return x.id === fid; });
        return m ? m.name : fid;
      }).join(' + ');
      sinHtml += '<div class="sinergia-item oculta">' +
        '<div class="sinergia-header">' +
          '<span class="sinergia-icon">' + s.icon + '</span>' +
          '<span class="sinergia-name">' + s.nombre + '</span>' +
          '<span class="sinergia-badge">0/' + total + '</span>' +
        '</div>' +
        '<div class="sinergia-desc">' + s.desc + '</div>' +
        '<div class="sinergia-falta">Requiere: ' + nombresReq + '</div>' +
      '</div>';
    }
  });
  document.getElementById('buildSinergias').innerHTML = sinHtml;
}

function toggleBuildOverlay() {
  const el = document.getElementById('buildOverlay');
  if (!el) return;
  if (el.classList.contains('active')) {
    el.classList.remove('active');
  } else {
    renderBuildOverlay();
    el.classList.add('active');
  }
}

function cerrarBuildOverlay() {
  const el = document.getElementById('buildOverlay');
  if (el) el.classList.remove('active');
}

// ============================================================
//  LISTENERS
// ============================================================
document.addEventListener('keydown', function(e) {
  if (e.key === 'Tab' && typeof modoActual !== 'undefined' && modoActual === 'roguelike' && run && run.activo) {
    e.preventDefault();
    toggleBuildOverlay();
  }
});

window.addEventListener('load', function() {
  const btnCont = document.getElementById('conquistaContinuarBtn');
  const btnRet = document.getElementById('conquistaRetirarseBtn');
  const btnSalir = document.getElementById('tiendaSalirBtn');
  if (btnCont) btnCont.addEventListener('click', conquistaContinuar);
  if (btnRet) btnRet.addEventListener('click', conquistaRetirarse);
  if (btnSalir) btnSalir.addEventListener('click', salirTienda);
});
