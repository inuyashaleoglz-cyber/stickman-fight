// ============================================================
//  EVENTOS — Descanso, tesoro, tienda, conquista
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

// ----- CONQUISTA -----
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

// ----- TIENDA -----
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
