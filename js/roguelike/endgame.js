// ============================================================
//  ENDGAME — Game over, victoria, revivir
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
