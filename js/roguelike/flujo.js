// ============================================================
//  FLUJO — Iniciar run, empezar piso, terminar piso
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
  jugador.reviviresRestantes = run.bonuses.revivir || 0;

  victoriasJugador = 0;
  victoriasIA = 0;
  comboTopeEstaPartida = 0;
  escenarioActual = Math.floor(Math.random() * SCENARIOS.length);
  mensajeGrande = '';
  mensajeTimer = 0;
  pausado = false;

  if (typeof koZoom !== 'undefined') {
    koZoom = 1;
    koZoomTarget = 1;
    koFocusX = 0;
    koFocusY = 0;
    slowmoFactor = 1;
    slowmoTimer = 0;
    impactFrameTimer = 0;
  }

  particles.length = 0;
  dmgNumbers.length = 0;
  impactRings.length = 0;
  projectiles.length = 0;
  lightningBolts.length = 0;

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

function roguelikeAlTerminarPiso(ganador) {
  if (ganador === 'ia') {
    run.activo = false;
    registrarPisoRoguelike(run.piso);
    mostrarGameOverRoguelike();
    return;
  }

  run.rivalesVencidos.push(run.piso);

  let oroGanado = 10 + run.piso * 3;
  if (run.esElitePiso) oroGanado += 30;
  if (run.esBossPiso) oroGanado += 60;
  // MONEDA DE LA SUERTE
  if (run.bonuses.monedaSuerte) oroGanado *= 2;
  // FRAGMENTO MALDITO
  if (run.bonuses.fragmentoMaldito) oroGanado += 100;
  run.oro += oroGanado;

  const vidaActual = jugador.salud;
  const vidaMax = jugador.maxHealth;
  let porcentajeCura = 0.30;
  if (run.piso >= 31 && run.piso <= 50) porcentajeCura = 0.28;
  else if (run.piso >= 51 && run.piso <= 70) porcentajeCura = 0.25;
  else if (run.piso >= 71 && run.piso <= 100) porcentajeCura = 0.22;
  else if (run.piso >= 101 && run.piso <= 130) porcentajeCura = 0.18;
  else if (run.piso >= 131) porcentajeCura = 0.15;
  // CORAZÓN DEL TITÁN: no cura nunca
  if (run.bonuses.corazonTitan) {
    run.__vidaAlEntrar = Math.min(vidaMax, vidaActual);
  } else {
    const recuperacion = Math.round(vidaMax * porcentajeCura);
    const vidaSiguiente = Math.min(vidaMax, vidaActual + recuperacion);
    run.__vidaAlEntrar = vidaSiguiente;
  };

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
    const stacksActuales = run.mejorasTomadas.filter(function(x){ return x === m.id; }).length;
    const maxStack = m.maxStack || '∞';
    const esRelleno = (MEJORAS_RELLENO.indexOf(m) !== -1);
    card.innerHTML =
      '<span class="rarity ' + m.rarity + '">' + m.rarity + '</span>' +
      '<span class="icon">' + m.icon + '</span>' +
      '<div class="name">' + m.name + '</div>' +
      '<div class="desc">' + m.desc + '</div>' +
      '<div style="font-size:10px;color:#fbbf24;margin-top:6px">' +
        (esRelleno ? 'Relleno' : ('Stack ' + (stacksActuales + 1) + '/' + maxStack)) +
      '</div>';
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

window.addEventListener('load', function() {
  const btnCont = document.getElementById('conquistaContinuarBtn');
  const btnRet = document.getElementById('conquistaRetirarseBtn');
  const btnSalir = document.getElementById('tiendaSalirBtn');
  if (btnCont) btnCont.addEventListener('click', conquistaContinuar);
  if (btnRet) btnRet.addEventListener('click', conquistaRetirarse);
  if (btnSalir) btnSalir.addEventListener('click', salirTienda);
});
