// ============================================================
//  MENÚ DE SELECCIÓN
// ============================================================
function stickSVG(color) {
  return `<svg width="54" height="68" viewBox="0 0 60 80">
    <circle cx="30" cy="14" r="9" fill="${color}" stroke="#000" stroke-width="2"/>
    <line x1="30" y1="23" x2="30" y2="50" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
    <line x1="30" y1="30" x2="14" y2="42" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
    <line x1="30" y1="30" x2="46" y2="42" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
    <line x1="30" y1="50" x2="18" y2="72" stroke="${color}" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="30" y1="50" x2="42" y2="72" stroke="${color}" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="33" cy="13" r="1.5" fill="#000"/>
    <circle cx="36" cy="13" r="1.5" fill="#000"/>
  </svg>`;
}

function renderMenu() {
  const grid = document.getElementById('charGrid');
  grid.innerHTML = CHARACTERS.map(c => `
    <div class="char-card" data-id="${c.id}" style="color:${c.color}">
      ${stickSVG(c.color)}
      <h3>${c.name}</h3>
      <div class="desc">${c.desc}</div>
      <div class="ability"><b>✦ ${c.abilityName}</b>${c.abilityDesc}<br>💥 ${c.specialName}</div>
      <div class="stats" style="color:${c.color}">
        <div><span>VIDA</span><div class="bar"><div class="bar-fill" style="width:${c.stats.hp}%"></div></div></div>
        <div><span>VEL</span><div class="bar"><div class="bar-fill" style="width:${c.stats.spd}%"></div></div></div>
        <div><span>FUERZA</span><div class="bar"><div class="bar-fill" style="width:${c.stats.pow}%"></div></div></div>
        <div><span>DEF</span><div class="bar"><div class="bar-fill" style="width:${c.stats.def}%"></div></div></div>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.char-card').forEach(card => {
    card.addEventListener('click', () => {
      grid.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      personajeJugador = CHARACTERS.find(c => c.id === card.dataset.id);
    });
  });
  const first = grid.querySelector('.char-card');
  if (first) first.classList.add('selected');
}

function setupMenu() {
  renderMenu();

  document.getElementById('diffRow').addEventListener('click', e => {
    if (e.target.classList.contains('diff-btn')) {
      document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('selected'));
      e.target.classList.add('selected');
      dificultad = e.target.dataset.diff;
    }
  });

  document.getElementById('startBtn').addEventListener('click', () => {
    initAudio();
    document.getElementById('menu').style.display = 'none';
    document.getElementById('gameScreen').classList.add('active');
    iniciarPartida();
  });

  document.getElementById('backBtn').addEventListener('click', () => {
    document.getElementById('gameScreen').classList.remove('active');
    document.getElementById('menu').style.display = 'flex';
    jugador = null;
    ia = null;
    estadoJuego = 'menu';
  });
}
