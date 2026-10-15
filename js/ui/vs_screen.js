// ============================================================
//  VS SCREEN + COMBOS + PORTRAITS
// ============================================================

function mostrarVSScreen() {
  const overlay = document.getElementById('vsScreenOverlay');
  const p1Port = document.getElementById('vsP1Portrait');
  const p2Port = document.getElementById('vsP2Portrait');
  const p1Name = document.getElementById('vsP1Name');
  const p2Name = document.getElementById('vsP2Name');

  p1Port.style.color = jugador.color;
  p2Port.style.color = ia.color;
  p1Port.innerHTML = portraitSVG(jugador.color);
  p2Port.innerHTML = portraitSVG(ia.color);
  p1Name.textContent = jugador.name;
  p2Name.textContent = ia.name;
  p1Name.style.color = jugador.color;
  p2Name.style.color = ia.color;

  overlay.classList.add('active');
  estadoJuego = 'vs_screen';
  vsScreenTimer = 90;

  if (typeof SFX !== 'undefined' && SFX.upgrade) SFX.upgrade();
}

function cerrarVSScreen() {
  const overlay = document.getElementById('vsScreenOverlay');
  if (overlay) overlay.classList.remove('active');
  if (estadoJuego === 'vs_screen') {
    estadoJuego = 'countdown';
    countdownTimer = 180;
  }
}

function saltarVSScreen() {
  if (estadoJuego !== 'vs_screen') return;
  cerrarVSScreen();
}

function portraitSVG(color) {
  return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' +
    '<circle cx="50" cy="38" r="20" fill="' + color + '" stroke="#0a0618" stroke-width="3"/>' +
    '<line x1="30" y1="38" x2="42" y2="38" stroke="#0a0618" stroke-width="4" stroke-linecap="round"/>' +
    '<line x1="58" y1="38" x2="70" y2="38" stroke="#0a0618" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M 20 95 Q 50 60 80 95" fill="' + color + '" stroke="#0a0618" stroke-width="3"/>' +
    '</svg>';
}

function mostrarComboCall(texto) {
  const el = document.getElementById('comboCallOverlay');
  const txt = document.getElementById('comboCallText');
  if (!el || !txt) return;
  txt.textContent = texto;
  el.classList.remove('active');
  void el.offsetWidth;
  el.classList.add('active');
  if (typeof ANNOUNCER_SFX !== 'undefined') ANNOUNCER_SFX.combo();
}
