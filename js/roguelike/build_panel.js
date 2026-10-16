// ============================================================
//  PANEL DE BUILD (TAB)
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
    : '<p style="color:#666;font-size:12px">Aún no tienes bonus.</p>';
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
    const maxStack = m.maxStack || '∞';
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

document.addEventListener('keydown', function(e) {
  if (e.key === 'Tab' && typeof modoActual !== 'undefined' && modoActual === 'roguelike' && run && run.activo) {
    e.preventDefault();
    toggleBuildOverlay();
  }
});
