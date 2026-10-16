// ============================================================
//  PISOS — Crear rival, escalado, construir jugador
// ============================================================

function crearRivalDelPiso(piso, personajeJugadorId) {
  const tipo = tipoDePiso(piso);
  let def;

  if (esBossFinal(piso) || esBossOculto(piso) || esBossReal(piso)) {
    def = JSON.parse(JSON.stringify(BOSSES[0]));
    let factor = 1;
    if (esBossReal(piso)) factor = 1.0;
    if (esBossOculto(piso)) factor = 1.5;
    if (esBossFinal(piso)) factor = 2.2;
    def.maxHealth = Math.round(def.maxHealth * factor);
    def.dmgMult = def.dmgMult * factor;
    def.__esBoss = true; def.__esBossFinal = true; def.__esElite = false;
    if (esBossFinal(piso)) def.name = 'EL ARQUITECTO';
    else if (esBossOculto(piso)) def.name = 'EL VACÍO';
    else def.name = 'SEÑOR DEL VACÍO';
  } else if (esPisoBoss(piso)) {
    const disponibles = CHARACTERS.filter(function(c){ return c.id !== personajeJugadorId; });
    const base = disponibles[Math.floor(Math.random() * disponibles.length)];
    def = JSON.parse(JSON.stringify(base));
    const factor = factorPiso(piso);
    if (esMiniBoss(piso)) {
      def.maxHealth = Math.round(def.maxHealth * factor * 1.30);
      def.dmgMult = def.dmgMult * (1 + (piso - 1) * 0.045) * 1.15;
      def.speed = def.speed * (1 + (piso - 1) * 0.010) * 1.03;
      if (piso >= 35) {
        const p = piso - 35;
        def.dmgMult *= (1 + p / 100 + Math.pow(p / 40, 2) * 0.4);
      }
      def.name = 'MINI-BOSS ' + def.name;
      def.__esBoss = true; def.__esBossFinal = true; def.__esElite = false;
    } else {
      def.maxHealth = Math.round(def.maxHealth * factor * 1.15);
      def.dmgMult = def.dmgMult * (1 + (piso - 1) * 0.040) * 1.10;
      def.speed = def.speed * (1 + (piso - 1) * 0.008) * 1.02;
      if (piso >= 35) {
        const p = piso - 35;
        def.dmgMult *= (1 + p / 100 + Math.pow(p / 40, 2) * 0.4);
      }
      def.name = 'JEFE ' + def.name;
      def.__esBoss = true; def.__esBossFinal = false; def.__esElite = false;
    }
  } else if (tipo === 'elite') {
    const disponibles = CHARACTERS.filter(function(c){ return c.id !== personajeJugadorId; });
    const base = disponibles[Math.floor(Math.random() * disponibles.length)];
    def = JSON.parse(JSON.stringify(base));
    const factor = factorPiso(piso);
    def.maxHealth = Math.round(def.maxHealth * factor * 1.20);
    def.dmgMult = def.dmgMult * (1 + (piso - 1) * 0.045) * 1.12;
    def.speed = def.speed * (1 + (piso - 1) * 0.010) * 1.03;
    if (piso >= 35) {
      const p = piso - 35;
      def.dmgMult *= (1 + p / 100 + Math.pow(p / 40, 2) * 0.4);
    }
    def.name = '★ ' + def.name;
    def.__esBoss = false; def.__esBossFinal = false; def.__esElite = true;
  } else {
    const disponibles = CHARACTERS.filter(function(c){ return c.id !== personajeJugadorId; });
    const base = disponibles[Math.floor(Math.random() * disponibles.length)];
    def = JSON.parse(JSON.stringify(base));
    const factor = factorPiso(piso);
    def.maxHealth = Math.round(def.maxHealth * factor);
    def.dmgMult = def.dmgMult * (1 + (piso - 1) * 0.045);
    def.speed = def.speed * (1 + (piso - 1) * 0.010);
    if (piso >= 35) {
      const p = piso - 35;
      def.dmgMult *= (1 + p / 100 + Math.pow(p / 40, 2) * 0.4);
    }
    def.__esBoss = false; def.__esBossFinal = false; def.__esElite = false;
  }

  def.__piso = piso;
  const afijos = elegirAfijosParaPiso(piso);
  def.__afijos = afijos;
  afijos.forEach(function(afijo) {
    def['__afijo_' + afijo.id] = true;
    if (afijo.tipo === 'estatico' && afijo.aplicarEstatico) {
      afijo.aplicarEstatico(def);
    }
  });
  def.__afijoCrit = def.__afijoCrit || 0;
  return def;
}

function construirJugadorConBonuses() {
  const base = CHARACTERS.find(function(c){ return c.id === run.personajeId; });
  const def = JSON.parse(JSON.stringify(base));
  def.maxHealth = base.maxHealth + run.bonuses.vidaMax;
  def.speed = base.speed * (1 + run.bonuses.velocidadPct);
  def.dmgMult = base.dmgMult * (1 + run.bonuses.dañoPct);
  def.__bonuses = run.bonuses;
  return def;
}
