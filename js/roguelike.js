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

// ============================================================
//  DIFICULTAD SEGÚN EL PISO
// ============================================================
function dificultadDelPiso(piso) {
  if (piso <= 5) return 'facil';
  if (piso <= 12) return 'normal';
  if (piso <= 22) return 'dificil';
  return 'pesadilla';
}

function crearRivalDelPiso(piso, personajeJugadorId) {
  const esFinal = esPisoBossFinal(piso);
  const esBoss  = esPisoBoss(piso);
  let def;

  if (esFinal) {
    // Jefe final: usar el boss definido
    def = JSON.parse(JSON.stringify(BOSSES[0]));
    const factor = 1 + (piso / 30 - 1) * 0.15; // cada 30 pisos es un poco más fuerte
    def.maxHealth = Math.round(def.maxHealth * Math.max(1, factor));
    def.dmgMult   = def.dmgMult * (1 + (piso - 30) * 0.01);
  } else if (esBoss) {
    // Miniboss: clonar un personaje y buffearlo
    const disponibles = CHARACTERS.filter(function(c){ return c.id !== personajeJugadorId; });
    const base = disponibles[Math.floor(Math.random() * disponibles.length)];
    def = JSON.parse(JSON.stringify(base));
    const factor = 1 + (piso - 1) * 0.05;
    def.maxHealth = Math.round(def.maxHealth * factor * 1.5);
    def.dmgMult   = def.dmgMult * (1 + (piso - 1) * 0.03) * 1.25;
    def.speed     = def.speed * (1 + (piso - 1) * 0.01) * 1.05;
    def.name      = 'CAMPEÓN ' + def.name;
  } else {
    // Piso normal
    const disponibles = CHARACTERS.filter(function(c){ return c.id !== personajeJugadorId; });
    const base = disponibles[Math.floor(Math.random() * disponibles.length)];
    def = JSON.parse(JSON.stringify(base));
    const factor = factorPiso(piso);
    def.maxHealth = Math.round(def.maxHealth * factor);
    def.dmgMult = def.dmgMult * (1 + (piso - 1) * 0.03);
    def.speed = def.speed * (1 + (piso - 1) * 0.01);
  }

  def.__piso = piso;
  def.__esBoss = esBoss;
  def.__esBossFinal = esFinal;
  return def;
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

  // Aplicar cura por piso si la tiene
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

  victoriasJugador = 0;
  victoriasIA = 0;
  comboTopeEstaPartida = 0;
  escenarioActual = Math.floor(Math.random() * SCENARIOS.length);
  mensajeGrande = '';
  mensajeTimer = 0;
  pausado = false;

  particles.length = 0;
  dmgNumbers.length = 0;
  impactRings.length = 0;
  projectiles.length = 0;
  lightningBolts.length = 0;

  clearPresses();

  // ¿Es piso de boss? Mostrar aviso
  if (rivalDef.__esBoss) {
    run.esBossPiso = true;
    run.esBossPisoFinal = rivalDef.__esBossFinal;
    run.eleccionesRestantes = 0; // se rellenará al ganar
    // Resetear fase del boss
    ia.faseActual = 1;
    estadoJuego = 'boss_warning';
    window.__bossWarningTimer = 150; // ~2.5 segundos
    mostrarAvisoBoss(rivalDef);
  } else {
    run.esBossPiso = false;
    run.esBossPisoFinal = false;
    run.eleccionesRestantes = 0;
    estadoJuego = 'countdown';
    countdownTimer = 180;
  }
}

// ============================================================
//  AVISO DE BOSS
// ============================================================
function mostrarAvisoBoss(rivalDef) {
  const overlay = document.getElementById('bossWarningOverlay');
  const title = document.getElementById('bossWarningTitle');
  const sub = document.getElementById('bossWarningSub');
  const icon = document.getElementById('bossWarningIcon');

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
}

function ocultarAvisoBoss() {
  const overlay = document.getElementById('bossWarningOverlay');
  if (overlay) overlay.classList.remove('active');
}
  

function roguelikeAlTerminarPiso(ganador) {
  if (ganador === 'ia') {
    run.activo = false;
    registrarPisoRoguelike(run.piso);
    mostrarGameOverRoguelike();
    return;
  }

  run.rivalesVencidos.push(run.piso);

  // Guardar vida para siguiente piso
  const vidaActual = jugador.salud;
  const vidaMax = jugador.maxHealth;
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

  // Determinar recompensa
  if (run.esBossPiso) {
    // Recompensa doble
    run.eleccionesRestantes = 2;
  } else {
    run.eleccionesRestantes = 1;
  }

  // Mostrar primera tanda de mejoras
  mostrarSiguienteTandaMejoras();
}

// ============================================================
//  TANDAS DE MEJORAS (para recompensa doble tras boss)
// ============================================================
function mostrarSiguienteTandaMejoras() {
  const opciones = elegirMejorasAleatorias(3);
  mostrarPantallaMejoras(opciones);
}

function roguelikeElegirMejora(mejora) {
  aplicarMejora(mejora);

  // ¿Quedan elecciones pendientes? (boss = 2)
  if (run.eleccionesRestantes > 1) {
    run.eleccionesRestantes--;
    ocultarPantallaMejoras();
    // Pequeña pausa y mostrar nueva tanda
    setTimeout(function() {
      if (run && run.activo) mostrarSiguienteTandaMejoras();
    }, 200);
    return;
  }

  // Ya no quedan elecciones: avanzar piso
  run.eleccionesRestantes = 0;
  run.piso++;
  ocultarPantallaMejoras();
  setTimeout(function() {
    if (run && run.activo) roguelikeEmpezarPiso();
  }, 300);
}

// ============================================================
//  UI: PANTALLA DE MEJORAS
// ============================================================
function mostrarPantallaMejoras(opciones) {
  // Aviso de sinergia
  let textoAviso = '';
  if (run.sinergiaPendienteAviso) {
    textoAviso = ' ✦ ¡SINERGIA ACTIVADA: ' + run.sinergiaPendienteAviso.nombre + '!';
    run.sinergiaPendienteAviso = null;
  }

  const overlay = document.getElementById('upgradeOverlay');
  const grid = document.getElementById('upgradeGrid');
  const sub = document.getElementById('upgradeSub');

  // Texto de cabecera según contexto
  let textoCabecera;
  if (run.eleccionesRestantes > 1) {
    textoCabecera = '🏆 ¡BOSS VENCIDO! · Elige ' + run.eleccionesRestantes + ' mejoras';
  } else if (run.esBossPiso && run.eleccionesRestantes === 1) {
    textoCabecera = '🏆 ¡BOSS VENCIDO! · Última elección';
  } else {
    textoCabecera = 'Piso ' + run.piso + ' superado · Elige una mejora para el piso ' + (run.piso + 1);
  }
  sub.textContent = textoCabecera + textoAviso;

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

  // Botón ver build
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
// ============================================================
//  OVERLAY DE BUILD (TAB)
// ============================================================
function renderBuildOverlay() {
  if (!run) return;

  document.getElementById('buildPisoNum').textContent = run.piso;

  const b = run.bonuses;

  // --- BONUS ACTIVOS ---
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
  if (b.dashInvuln)              stats.push({icon:'✨', label:'Dash invuln',    value:'Sí'});
  if (b.saltosExtra > 0)         stats.push({icon:'🕊️', label:'Saltos extra',   value:'+' + b.saltosExtra});
  if (b.curaEntrePisos > 0)      stats.push({icon:'💊', label:'Cura por piso',  value:'+' + b.curaEntrePisos});
  if (b.dañoASlow > 0)           stats.push({icon:'❄️', label:'Daño a ralentizados', value:'+' + Math.round(b.dañoASlow*100) + '%'});
  if (b.velocidadComboPct > 0)   stats.push({icon:'💫', label:'Velocidad en combo', value:'+' + Math.round(b.velocidadComboPct*100) + '%'});
  if (b.furiaBajaVida > 0)       stats.push({icon:'🦅', label:'Furia baja vida', value:'+' + Math.round(b.furiaBajaVida*100) + '%'});
  if (b.revivir)                 stats.push({icon:'♻️', label:'Revivir',        value:'1/piso'});
  if (b.congelarEspecial)        stats.push({icon:'🧊', label:'Congelar esp.',  value:'Sí'});
  if (b.clonEspecial)            stats.push({icon:'🌀', label:'Clon esp.',      value:'Sí'});
  if (b.superArmorLeve)          stats.push({icon:'💪', label:'Super armor',    value:'Sí'});
  if (b.critGarantizadoCombo)    stats.push({icon:'🎯', label:'Crit en combos', value:'5+ hits'});

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

  // --- MEJORAS AGRUPADAS ---
  const resumen = {};
  run.mejorasTomadas.forEach(function(id) {
    resumen[id] = (resumen[id] || 0) + 1;
  });
  const idsMejoras = Object.keys(resumen);

  // Ordenar por rareza (épica primero)
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
    const colorRareza = m.rarity === 'epica' ? '#a855f7' : (m.rarity === 'rara' ? '#38bdf8' : '#94a3b8');
    mejorasHtml += '<div class="mejora-item" style="border-left-color:' + colorRareza + '">' +
      '<span class="mejora-icon">' + m.icon + '</span>' +
      '<div class="mejora-info">' +
        '<div class="mejora-name">' + m.name +
          (count > 1 ? ' <span class="mejora-count">×' + count + '</span>' : '') +
        '</div>' +
        '<div class="mejora-desc">' + m.desc + '</div>' +
      '</div>' +
    '</div>';
  });
  document.getElementById('buildCountMejoras').textContent = run.mejorasTomadas.length;
  document.getElementById('buildMejoras').innerHTML = mejorasHtml || '<p style="color:#666;font-size:12px">Aún no tienes mejoras.</p>';

  // --- SINERGIAS ---
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

// Listener de TAB
document.addEventListener('keydown', function(e) {
  if (e.key === 'Tab' && typeof modoActual !== 'undefined' && modoActual === 'roguelike' && run && run.activo) {
    e.preventDefault();
    toggleBuildOverlay();
  }
});
