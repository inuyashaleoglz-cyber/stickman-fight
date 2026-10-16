// ============================================================
//  AVISOS DE BOSS Y ELITE
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
    sub.textContent = '⚡ JEFE · MÚLTIPLES FASES ⚡';
    icon.textContent = '🔥';
  } else {
    overlay.classList.remove('final');
    title.textContent = rivalDef.name;
    sub.textContent = '⚠ MINIBOSS · RECOMPENSA DOBLE ⚠';
    icon.textContent = '⚠';
  }
  overlay.classList.add('active');

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

  if (window.__avisoTimer) clearTimeout(window.__avisoTimer);
  window.__avisoStartTime = Date.now();
  window.__avisoTimer = setTimeout(function() {
    ocultarAvisoBoss();
    if (estadoJuego === 'boss_warning') {
      estadoJuego = 'countdown';
      countdownTimer = 180;
      clearPresses();
    }
    window.__avisoStartTime = null;
  }, 2000);
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

  if (window.__avisoTimer) clearTimeout(window.__avisoTimer);
  window.__avisoStartTime = Date.now();
  window.__avisoTimer = setTimeout(function() {
    ocultarAvisoBoss();
    if (estadoJuego === 'boss_warning') {
      estadoJuego = 'countdown';
      countdownTimer = 180;
      clearPresses();
    }
    window.__avisoStartTime = null;
  }, 2000);
}

function ocultarAvisoBoss() {
  const overlay = document.getElementById('bossWarningOverlay');
  if (overlay) {
    overlay.classList.remove('active');
    overlay.classList.remove('final');
    overlay.classList.remove('elite');
  }
}
