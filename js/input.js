// ============================================================
//  ENTRADA DE TECLADO
// ============================================================
const keys = {};
const justPressed = {};

document.addEventListener('keydown', e => {
  initAudio();
  const k = e.key.toLowerCase();
  if (!keys[k]) justPressed[k] = true;
  keys[k] = true;
  if (k === 'r' && typeof iniciarPartida === 'function') iniciarPartida();
  if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' '].includes(k)) e.preventDefault();
});

document.addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
});

function consumePress(k) {
  if (justPressed[k]) { justPressed[k] = false; return true; }
  return false;
}

function clearPresses() {
  for (const k in justPressed) justPressed[k] = false;
}
