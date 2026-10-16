// ============================================================
//  MEJORAS — Elección y aplicación
// ============================================================

function elegirMejorasAleatoriasConRareza(cantidad, rarezaForzada) {
  const personajeActual = run ? run.personajeId : null;
  const disponibles = MEJORAS.filter(function(m) {
    if (m.soloPara && m.soloPara !== personajeActual) return false;
    if (run) {
      const maxStack = m.maxStack || 3;
      const tomadas = run.mejorasTomadas.filter(function(x){ return x === m.id; }).length;
      if (tomadas >= maxStack) return false;
    }
    return true;
  }).filter(function(m) { return m.rarity === rarezaForzada; });

  if (disponibles.length < cantidad) {
    return elegirMejorasAleatorias(cantidad);
  }

  const elegidas = [];
  const usadas = {};
  for (let i = 0; i < cantidad; i++) {
    const pool = disponibles.filter(function(m){ return !usadas[m.id]; });
    if (pool.length === 0) break;
    const e = pool[Math.floor(Math.random() * pool.length)];
    elegidas.push(e);
    usadas[e.id] = true;
  }
  while (elegidas.length < cantidad) {
    const relleno = MEJORAS_RELLENO[Math.floor(Math.random() * MEJORAS_RELLENO.length)];
    elegidas.push(relleno);
  }
  return elegidas;
}

function elegirMejorasAleatorias(cantidad) {
  const personajeActual = run ? run.personajeId : null;
  const disponibles = MEJORAS.filter(function(m) {
    if (m.soloPara && m.soloPara !== personajeActual) return false;
    if (run) {
      const maxStack = m.maxStack || 3;
      const tomadas = run.mejorasTomadas.filter(function(x){ return x === m.id; }).length;
      if (tomadas >= maxStack) return false;
    }
    return true;
  });

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
      const todas = disponibles.filter(function(m){ return !usadas[m.id]; });
      if (todas.length === 0) break;
      pool = todas;
    }

    const elegida = pool[Math.floor(Math.random() * pool.length)];
    elegidas.push(elegida);
    usadas[elegida.id] = true;
  }

  while (elegidas.length < cantidad) {
    const relleno = MEJORAS_RELLENO[Math.floor(Math.random() * MEJORAS_RELLENO.length)];
    elegidas.push(relleno);
  }

  return elegidas;
}

function aplicarMejora(mejora) {
  mejora.apply(run.bonuses);
  run.mejorasTomadas.push(mejora.id);

  SINERGIAS.forEach(function(s) {
    if (run.bonuses.sinergiasActivas.indexOf(s.id) !== -1) return;
    const tieneTodas = s.requiere.every(function(reqId) {
      return run.mejorasTomadas.indexOf(reqId) !== -1;
    });
    if (tieneTodas) {
      s.apply(run.bonuses);
      run.bonuses.sinergiasActivas.push(s.id);
      run.sinergiaPendienteAviso = s;
    }
  });
}

function mostrarSiguienteTandaMejoras() {
  const opciones = elegirMejorasAleatorias(3);
  mostrarPantallaMejoras(opciones);
}
