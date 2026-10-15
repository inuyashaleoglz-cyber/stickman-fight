// ============================================================
//  MENÚ PRINCIPAL
// ============================================================

function stickSVG(color) {
  return '<svg width="54" height="68" viewBox="0 0 60 80">' +
    '<circle cx="30" cy="14" r="9" fill="' + color + '" stroke="#000" stroke-width="2"/>' +
    '<line x1="30" y1="23" x2="30" y2="50" stroke="' + color + '" stroke-width="4" stroke-linecap="round"/>' +
    '<line x1="30" y1="30" x2="14" y2="42" stroke="' + color + '" stroke-width="3" stroke-linecap="round"/>' +
    '<line x1="30" y1="30" x2="46" y2="42" stroke="' + color + '" stroke-width="3" stroke-linecap="round"/>' +
    '<line x1="30" y1="50" x2="18" y2="72" stroke="' + color + '" stroke-width="3.5" stroke-linecap="round"/>' +
    '<line x1="30" y1="50" x2="42" y2="72" stroke="' + color + '" stroke-width="3.5" stroke-linecap="round"/>' +
    '<circle cx="33" cy="13" r="1.5" fill="#000"/>' +
    '<circle cx="36" cy="13" r="1.5" fill="#000"/>' +
    '</svg>';
}

function renderMenu() {
  const grid = document.getElementById('charGrid');
  let html = '';
  for (let i = 0; i < CHARACTERS.length; i++) {
    const c = CHARACTERS[i];
    html += '<div class="char-card" data-id="' + c.id + '" style="color:' + c.color + '">' +
      stickSVG(c.color) +
      '<h3>' + c.name + '</h3>' +
      '<div class="desc">' + c.desc + '</div>' +
      '<div class="ability"><b>✦ ' + c.abilityName + '</b>' + c.abilityDesc + '<br>💥 ' + c.specialName + '</div>' +
      '<div class="stats" style="color:' + c.color + '">' +
        '<div><span>VIDA</span><div class="bar"><div class="bar-fill" style="width:' + c.stats.hp + '%"></div></div></div>' +
        '<div><span>VEL</span><div class="bar"><div class="bar-fill" style="width:' + c.stats.spd + '%"></div></div></div>' +
        '<div><span>FUERZA</span><div class="bar"><div class="bar-fill" style="width:' + c.stats.pow + '%"></div></div></div>' +
        '<div><span>DEF</span><div class="bar"><div class="bar-fill" style="width:' + c.stats.def + '%"></div></div></div>' +
      '</div>' +
    '</div>';
  }
  grid.innerHTML = html;

  const cards = grid.querySelectorAll('.char-card');
  for (let i = 0; i < cards.length; i++) {
    cards[i].addEventListener('click', function() {
      for (let j = 0; j < cards.length; j++) cards[j].classList.remove('selected');
      this.classList.add('selected');
      const id = this.dataset.id;
      personajeJugador = CHARACTERS.find(function(c) { return c.id === id; });
    });
  }
  if (cards[0]) cards[0].classList.add('selected');
}

function renderRecords() {
  const r = cargarRecords();
  const el = document.getElementById('recordsPanel');
  if (!el) return;
  if (r.victorias === 0 && r.mejorPisoRoguelike === 0) {
    el.textContent = '🏆 Sin récords todavía. ¡Gana tu primera pelea!';
  } else {
    let texto = '🏆 Duelos: ' + r.victorias + ' · Combo: ' + r.mejorCombo;
    if (r.mejorPisoRoguelike > 0) texto += ' · Roguelike: piso ' + r.mejorPisoRoguelike;
    if (r.roguelikesGanados > 0) texto += ' · 🎖️ ' + r.roguelikesGanados + ' conquistas';
    el.textContent = texto;
  }
}

function setupMenu() {
  renderMenu();
  renderRecords();

  document.getElementById('modeRow').addEventListener('click', function(e) {
    if (e.target.classList.contains('mode-btn') || e.target.parentElement.classList.contains('mode-btn')) {
      const btn = e.target.classList.contains('mode-btn') ? e.target : e.target.parentElement;
      const btns = document.querySelectorAll('.mode-btn');
      for (let i = 0; i < btns.length; i++) btns[i].classList.remove('selected');
      btn.classList.add('selected');
      modoActual = btn.dataset.mode;
      const diffRow = document.getElementById('diffRow');
      diffRow.style.opacity = (modoActual === 'roguelike') ? '0.3' : '1';
      diffRow.style.pointerEvents = (modoActual === 'roguelike') ? 'none' : 'auto';
    }
  });

  document.getElementById('diffRow').addEventListener('click', function(e) {
    if (e.target.classList.contains('diff-btn')) {
      const btns = document.querySelectorAll('.diff-btn');
      for (let i = 0; i < btns.length; i++) btns[i].classList.remove('selected');
      e.target.classList.add('selected');
      dificultad = e.target.dataset.diff;
    }
  });

  document.getElementById('startBtn').addEventListener('click', function() {
    if (typeof initAudio === 'function') initAudio();
    document.getElementById('menu').style.display = 'none';
    document.getElementById('gameScreen').classList.add('active');
    iniciarPartida();
  });

  document.getElementById('backBtn').addEventListener('click', function() {
    volverAlMenu();
  });

  document.getElementById('goMenuBtn').addEventListener('click', function() {
    document.getElementById('gameOverOverlay').classList.remove('active');
    volverAlMenu();
  });
  document.getElementById('goRetryBtn').addEventListener('click', function() {
    document.getElementById('gameOverOverlay').classList.remove('active');
    if (modoActual === 'roguelike') {
      const idPersonaje = run ? run.personajeId : personajeJugador.id;
      roguelikeIniciar(idPersonaje);
    } else {
      iniciarPartida();
    }
  });
  document.getElementById('victoryMenuBtn').addEventListener('click', function() {
    document.getElementById('victoryOverlay').classList.remove('active');
    volverAlMenu();
  });

  const btnCont = document.getElementById('conquistaContinuarBtn');
  const btnRet = document.getElementById('conquistaRetirarseBtn');
  const btnSalir = document.getElementById('tiendaSalirBtn');
  if (btnCont) btnCont.addEventListener('click', function() { conquistaContinuar(); });
  if (btnRet) btnRet.addEventListener('click', function() { conquistaRetirarse(); });
  if (btnSalir) btnSalir.addEventListener('click', function() { salirTienda(); });

  const btnSkip = document.getElementById('bossWarningSkipBtn');
  if (btnSkip) btnSkip.addEventListener('click', function() { saltarAvisoBoss(); });

  const overlayBoss = document.getElementById('bossWarningOverlay');
  if (overlayBoss) {
    overlayBoss.addEventListener('click', function(e) {
      if (e.target.id === 'bossWarningOverlay') saltarAvisoBoss();
    });
  }

  const overlayVS = document.getElementById('vsScreenOverlay');
  if (overlayVS) {
    overlayVS.addEventListener('click', function() { saltarVSScreen(); });
  }
}
