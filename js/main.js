// ============================================================
//  ESTADO GLOBAL
// ============================================================
let jugador = null;
let ia = null;
let dificultad = 'normal';
let personajeJugador = CHARACTERS[0];
let personajeIA = CHARACTERS[1];
let estadoJuego = 'menu';
let countdownTimer = 180;
let roundTimer = 0;
let victoriasJugador = 0;
let victoriasIA = 0;
let mensajeGrande = '';
let mensajeTimer = 0;
let time = 0;
let pausado = false;
let escenarioActual = 0;
let comboTopeEstaPartida = 0;
let modoActual = 'rapido'; // 'rapido' | 'roguelike'

// ============================================================
//  CICLO DE PARTIDA (DUELO RÁPIDO)
// ============================================================
function iniciarRonda() {
  jugador.reset(200, 1);
  ia.reset(W - 200, -1);
  particles.length = 0;
  dmgNumbers.length = 0;
  impactRings.length = 0;
  projectiles.length = 0;
  lightningBolts.length = 0;
  estadoJuego = 'countdown';
  countdownTimer = 180;
  mensajeGrande = ''; mensajeTimer = 0;
  pausado = false;
  clearPresses();
}

function iniciarPartida() {
  // Si estamos en roguelike y hay un run activo, reiniciar el run
  if (modoActual === 'roguelike') {
    roguelikeIniciar(personajeJugador.id);
    return;
  }
  // Duelo rápido normal
  const disponibles = CHARACTERS.filter(function(c) { return c.id !== personajeJugador.id; });
  personajeIA = disponibles[Math.floor(Math.random() * disponibles.length)];
  personajeJugador = CHARACTERS.find(function(c){ return c.id === personajeJugador.id; }); // sin bonuses
  jugador = new Fighter(personajeJugador, 200, 1, false);
  ia = new Fighter(personajeIA, W - 200, -1, true);
  victoriasJugador = 0; victoriasIA = 0;
  comboTopeEstaPartida = 0;
  escenarioActual = Math.floor(Math.random() * SCENARIOS.length);
  iniciarRonda();
}

function togglePausa() {
  if (estadoJuego !== 'fighting' && estadoJuego !== 'countdown') return;
  pausado = !pausado;
}

// ============================================================
//  FONDO
// ============================================================
function dibujarSuelo(colorTop, colorBottom, lineaColor) {
  const groundGrad = ctx.createLinearGradient(0, GROUND, 0, H);
  groundGrad.addColorStop(0, colorTop);
  groundGrad.addColorStop(1, colorBottom);
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, GROUND, W, H - GROUND);
  ctx.save();
  ctx.shadowColor = lineaColor; ctx.shadowBlur = 15;
  ctx.strokeStyle = lineaColor; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, GROUND); ctx.lineTo(W, GROUND); ctx.stroke();
  ctx.restore();
}

function dibujarMontanas(color1, color2) {
  ctx.fillStyle = color1;
  ctx.beginPath(); ctx.moveTo(0, H-100);
  for (let x = 0; x <= W; x += 60) {
    const h = 150 + Math.sin(x*0.008 + 1)*40 + Math.cos(x*0.013)*30;
    ctx.lineTo(x, H - h);
  }
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();

  ctx.fillStyle = color2;
  ctx.beginPath(); ctx.moveTo(0, H-70);
  for (let x = 0; x <= W; x += 40) {
    const h = 90 + Math.sin(x*0.02 + 3)*25;
    ctx.lineTo(x, H - h);
  }
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
}

function drawBgNoche() {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#1a0f2e');
  sky.addColorStop(0.5, '#2a1a4a');
  sky.addColorStop(1, '#0d0618');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

  const moonGrad = ctx.createRadialGradient(760, 100, 10, 760, 100, 80);
  moonGrad.addColorStop(0, '#fff8e0');
  moonGrad.addColorStop(0.4, '#e8d5a0');
  moonGrad.addColorStop(1, 'rgba(255,248,224,0)');
  ctx.fillStyle = moonGrad;
  ctx.beginPath(); ctx.arc(760, 100, 80, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fff8e0';
  ctx.beginPath(); ctx.arc(760, 100, 38, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = 'rgba(200,180,140,0.5)';
  ctx.beginPath(); ctx.arc(748, 92, 6, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(775, 108, 4, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(770, 85, 3, 0, Math.PI*2); ctx.fill();

  for (let i = 0; i < 50; i++) {
    const sx = (i*137.5) % W, sy = (i*73.3) % (H*0.55);
    const alpha = 0.3 + Math.sin(time*0.03 + i*1.7)*0.3;
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillStyle = '#fff';
    ctx.fillRect(sx, sy, 1.5, 1.5);
  }
  ctx.globalAlpha = 1;

  dibujarMontanas('#150a28', '#0a0518');
  dibujarSuelo('#1f2937', '#0a0518', '#e94560');
}

function drawBgTormenta() {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#0a1128');
  sky.addColorStop(0.5, '#1a2540');
  sky.addColorStop(1, '#050810');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 8; i++) {
    const cx = (i * 140 + time * 0.3) % (W + 200) - 100;
    const cy = 60 + (i % 3) * 30;
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#2a3a5a';
    ctx.beginPath(); ctx.ellipse(cx, cy, 90, 30, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 40, cy - 10, 70, 25, 0, 0, Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  if (Math.floor(time / 90) % 3 === 0 && time % 90 < 5) {
    ctx.fillStyle = 'rgba(150,200,255,' + (0.3 - (time % 90) * 0.06) + ')';
    ctx.fillRect(0, 0, W, H * 0.6);
  }

  ctx.strokeStyle = 'rgba(150,180,220,0.4)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 60; i++) {
    const rx = (i * 37 + time * 4) % W;
    const ry = (i * 73 + time * 8) % H;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx - 2, ry + 12);
    ctx.stroke();
  }

  dibujarMontanas('#0d1a2e', '#050810');
  dibujarSuelo('#1a2540', '#050810', '#38bdf8');
}

function drawBgVolcan() {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#2a0a08');
  sky.addColorStop(0.5, '#4a1510');
  sky.addColorStop(1, '#0d0303');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(200, 120, 10, 200, 120, 100);
  glow.addColorStop(0, 'rgba(255,120,40,0.8)');
  glow.addColorStop(0.4, 'rgba(200,60,20,0.3)');
  glow.addColorStop(1, 'rgba(255,80,20,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(200, 120, 100, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#ff8a3c';
  ctx.beginPath(); ctx.arc(200, 120, 40, 0, Math.PI*2); ctx.fill();

  for (let i = 0; i < 30; i++) {
    const bx = (i * 73 + Math.sin(time * 0.02 + i) * 20) % W;
    const by = (H - (time * 0.5 + i * 40) % H);
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#ff6a2a';
    ctx.fillRect(bx, by, 2, 2);
  }
  ctx.globalAlpha = 1;

  dibujarMontanas('#1a0505', '#0a0202');
  dibujarSuelo('#3a1010', '#0a0202', '#f97316');
}

function drawBackground() {
  const id = SCENARIOS[escenarioActual].id;
  if (id === 'noche') drawBgNoche();
  else if (id === 'tormenta') drawBgTormenta();
  else drawBgVolcan();
}

// ============================================================
//  HUD
// ============================================================
function drawHealthBar(x, y, ancho, alto, salud, saludGhost, maxHealth, color, invertida, nombre, meter, specialName, piso) {
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(x-3, y-3, ancho+6, alto+6);

  const ghostW = ancho * (saludGhost / maxHealth);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  if (invertida) ctx.fillRect(x + ancho - ghostW, y, ghostW, alto);
  else ctx.fillRect(x, y, ghostW, alto);

  const w = ancho * (salud / maxHealth);
  const grad = ctx.createLinearGradient(x, y, x+ancho, y);
  if (invertida) { grad.addColorStop(0, color); grad.addColorStop(1, '#ef4444'); }
  else { grad.addColorStop(0, '#22c55e'); grad.addColorStop(1, color); }
  ctx.fillStyle = grad;
  if (invertida) ctx.fillRect(x + ancho - w, y, w, alto);
  else ctx.fillRect(x, y, w, alto);

  ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2;
  ctx.strokeRect(x, y, ancho, alto);
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(x, y, ancho, alto/3);

  const mY = y + alto + 5, mH = 6;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(x-2, mY-2, ancho+4, mH+4);
  const mW = ancho * (meter / 100);
  const mGrad = ctx.createLinearGradient(x, mY, x+ancho, mY);
  mGrad.addColorStop(0, '#fbbf24'); mGrad.addColorStop(1, '#f59e0b');
  ctx.fillStyle = mGrad;
  if (meter >= 100) {
    ctx.globalAlpha = 0.7 + Math.sin(time*0.3)*0.3;
    ctx.fillStyle = '#fde047';
    ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 15;
  }
  if (invertida) ctx.fillRect(x + ancho - mW, mY, mW, mH);
  else ctx.fillRect(x, mY, mW, mH);
  ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1;
  ctx.strokeRect(x, mY, ancho, mH);

  ctx.font = 'bold 17px Segoe UI, sans-serif';
  ctx.fillStyle = color;
  ctx.textAlign = invertida ? 'right' : 'left';
  const nombreX = invertida ? x + ancho : x;
  const textoNombre = piso ? nombre + ' — Piso ' + piso : nombre;
  ctx.fillText(textoNombre, nombreX, y - 10);

  if (meter >= 100) {
    ctx.font = 'bold 11px Segoe UI, sans-serif';
    ctx.fillStyle = '#fde047';
    ctx.textAlign = invertida ? 'right' : 'left';
    ctx.fillText('★ ' + specialName + ' LISTO ★', nombreX, mY + mH + 14);
  }
}

function drawHUD() {
  const barW = 350, barH = 24, y = 35;
  const piso = (modoActual === 'roguelike' && run) ? run.piso : null;
  drawHealthBar(30, y, barW, barH, jugador.salud, jugador.saludGhost, jugador.maxHealth,
    jugador.color, false, jugador.name, jugador.meter, jugador.def.specialName, piso);
  drawHealthBar(W - 30 - barW, y, barW, barH, ia.salud, ia.saludGhost, ia.maxHealth,
    ia.color, true, ia.name, ia.meter, ia.def.specialName, null);

  // En duelo rápido mostramos rondas ganadas; en roguelike mostramos el piso
  if (modoActual === 'rapido') {
    for (let i = 0; i < ROUNDS_TO_WIN; i++) {
      const px = 30 + barW + 25 + i*26;
      ctx.beginPath(); ctx.arc(px, y + barH/2, 9, 0, Math.PI*2);
      ctx.fillStyle = i < victoriasJugador ? jugador.color : 'rgba(255,255,255,0.12)';
      ctx.fill(); ctx.strokeStyle = jugador.color; ctx.lineWidth = 2; ctx.stroke();
      const ix = W - 30 - barW - 25 - i*26;
      ctx.beginPath(); ctx.arc(ix, y + barH/2, 9, 0, Math.PI*2);
      ctx.fillStyle = i < victoriasIA ? ia.color : 'rgba(255,255,255,0.12)';
      ctx.fill(); ctx.strokeStyle = ia.color; ctx.lineWidth = 2; ctx.stroke();
    }
  } else if (modoActual === 'roguelike' && run) {
    // Mostrar progreso de pisos
    ctx.font = 'bold 13px Segoe UI, sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'center';
    ctx.fillText('PISO ' + run.piso + ' / ' + MAX_PISO, W/2, y + barH + 26);
  }

  ctx.font = 'bold 22px Segoe UI, sans-serif';
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
  ctx.fillText('VS', W/2, y + barH/2 + 8);

  ctx.font = 'bold 10px Segoe UI, sans-serif';
  ctx.fillStyle = AIS[dificultad].color;
  ctx.fillText(AIS[dificultad].name, W/2, y + barH + 12);

  ctx.font = 'bold 10px Segoe UI, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillText(SCENARIOS[escenarioActual].name, W/2, H - 15);
}

// ============================================================
//  MENSAJES Y PAUSA
// ============================================================
function drawBigMessage() {
  if (!mensajeGrande) return;
  const alpha = Math.min(1, mensajeTimer / 20);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '900 100px Segoe UI, sans-serif';
  ctx.strokeStyle = '#000'; ctx.lineWidth = 8;
  ctx.shadowColor = '#e94560'; ctx.shadowBlur = 40;
  ctx.strokeText(mensajeGrande, W/2, H/2 - 20);
  ctx.fillStyle = '#fff';
  ctx.fillText(mensajeGrande, W/2, H/2 - 20);
  ctx.restore();
}

function drawCountdown() {
  const seg = Math.ceil(countdownTimer/60);
  const escala = 1 + Math.sin(time*0.25)*0.06;
  ctx.save();
  ctx.translate(W/2, H/2 - 20); ctx.scale(escala, escala);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '900 140px Segoe UI, sans-serif';
  const texto = seg > 0 ? String(seg) : '¡PELEA!';
  const color = seg > 0 ? '#fbbf24' : '#4ade80';
  ctx.shadowColor = color; ctx.shadowBlur = 50;
  ctx.fillStyle = color;
  ctx.strokeStyle = '#000'; ctx.lineWidth = 10;
  ctx.strokeText(texto, 0, 0);
  ctx.fillText(texto, 0, 0);
  ctx.restore();
}

function drawPausa() {
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '900 80px Segoe UI, sans-serif';
  ctx.fillStyle = '#fff';
  ctx.shadowColor = '#4ade80'; ctx.shadowBlur = 30;
  ctx.fillText('PAUSA', W/2, H/2 - 40);
  ctx.shadowBlur = 0;
  ctx.font = 'bold 20px Segoe UI, sans-serif';
  ctx.fillStyle = '#4ade80';
  ctx.fillText('P — Continuar', W/2, H/2 + 30);
  ctx.fillStyle = '#f87171';
  ctx.fillText('R — Reiniciar', W/2, H/2 + 65);
}

// ============================================================
//  UPDATE
// ============================================================
function update() {
  time++;
  updateAllEffects();

  if (!jugador || !ia) return;

  if (mensajeTimer > 0) mensajeTimer--;

  if (pausado) return;

  if (estadoJuego === 'countdown') {
    countdownTimer--;
    if (countdownTimer % 60 === 0 && countdownTimer > 0) SFX.count();
    if (countdownTimer <= 0) { estadoJuego = 'fighting'; SFX.fight(); }
    jugador.facing = ia.x > jugador.x ? 1 : -1;
    ia.facing = jugador.x > ia.x ? 1 : -1;
    return;
  }

  if (estadoJuego === 'fighting') {
    jugador.actualizar(ia, true);
    ia.actualizar(jugador, false);

    if (jugador.combo > comboTopeEstaPartida) comboTopeEstaPartida = jugador.combo;
    if (modoActual === 'roguelike' && run && jugador.combo > run.comboTope) {
      run.comboTope = jugador.combo;
    }

    if (jugador.salud <= 0 || ia.salud <= 0) {
      estadoJuego = 'roundover';
      roundTimer = 170;
      SFX.ko(); shake(20);

      const jugadorGano = ia.salud <= 0 && jugador.salud > 0;

      if (jugador.salud <= 0 && ia.salud <= 0) mensajeGrande = 'EMPATE';
      else if (jugador.salud <= 0) { mensajeGrande = 'K.O.'; victoriasIA++; }
      else { mensajeGrande = '¡K.O.!'; victoriasJugador++; }
      mensajeTimer = 170;
      const dead = jugador.salud <= 0 ? jugador : ia;
      spawnParticles(dead.x, dead.y - 55, 40, dead.accent, 12);

      // En roguelike, guardar resultado para procesarlo al terminar el roundover
      if (modoActual === 'roguelike') {
        window.__roguelikeGanador = jugadorGano ? 'jugador' : 'ia';
      }
    }
    return;
  }

  if (estadoJuego === 'roundover') {
    roundTimer--;
    [jugador, ia].forEach(function(f) {
      f.vy += GRAVITY; f.y += f.vy;
      if (f.y >= GROUND) { f.y = GROUND; f.vy = 0; }
      if (f.saludGhost > f.salud) f.saludGhost -= 0.6;
    });
    if (roundTimer <= 0) {
      // MODO ROGUELIKE: procesar fin de piso
      if (modoActual === 'roguelike' && run && run.activo) {
        const ganador = window.__roguelikeGanador;
        window.__roguelikeGanador = null;
        estadoJuego = 'roguelike_pause';
        if (ganador === 'jugador') {
          roguelikeAlTerminarPiso('jugador');
        } else {
          roguelikeAlTerminarPiso('ia');
        }
        return;
      }

      // DUELO RÁPIDO: flujo normal
      if (victoriasJugador >= ROUNDS_TO_WIN || victoriasIA >= ROUNDS_TO_WIN) {
        estadoJuego = 'matchover';
        mensajeGrande = victoriasJugador >= ROUNDS_TO_WIN ? '¡GANASTE!' : 'PERDISTE';
        mensajeTimer = 999999;
        if (victoriasJugador >= ROUNDS_TO_WIN) {
          registrarVictoria(personajeJugador.id, comboTopeEstaPartida);
        }
      } else iniciarRonda();
    }
  }
}

// ============================================================
//  RENDER
// ============================================================
function render() {
  ctx.save();
  if (shakeAmount > 0)
    ctx.translate((Math.random()-0.5)*shakeAmount, (Math.random()-0.5)*shakeAmount);

  drawBackground();
  if (jugador) jugador.dibujar(time);
  if (ia) ia.dibujar(time);
  drawRings();
  drawProjectiles();
  drawLightning();
  drawParticles();
  drawDamageNumbers();

  ctx.restore();

  if (jugador && ia) drawHUD();
  if (estadoJuego === 'countdown') drawCountdown();
  if (estadoJuego === 'roundover') drawBigMessage();

  if (estadoJuego === 'matchover' && modoActual === 'rapido') {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const ganaste = victoriasJugador >= ROUNDS_TO_WIN;
    ctx.font = '900 90px Segoe UI, sans-serif';
    ctx.fillStyle = ganaste ? '#4ade80' : '#f87171';
    ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 50;
    ctx.fillText(mensajeGrande, W/2, H/2 - 80);
    ctx.shadowBlur = 0;
    ctx.font = 'bold 24px Segoe UI, sans-serif'; ctx.fillStyle = '#fff';
    ctx.fillText('Rondas: ' + victoriasJugador + ' - ' + victoriasIA, W/2, H/2 - 10);
    ctx.font = 'bold 18px Segoe UI, sans-serif'; ctx.fillStyle = '#fbbf24';
    ctx.fillText('Mejor combo: ' + comboTopeEstaPartida + ' golpes', W/2, H/2 + 30);
    ctx.font = '18px Segoe UI, sans-serif'; ctx.fillStyle = '#aaa';
    ctx.fillText('Presiona R para jugar otra vez', W/2, H/2 + 90);
    ctx.fillText('o vuelve al menú para cambiar personaje', W/2, H/2 + 120);
  }

  if (pausado) drawPausa();
}

// ============================================================
//  LOOP
// ============================================================
function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}

// ============================================================
//  MENÚ
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
    const fav = r.personajeFav ? CHARACTERS.find(function(c){return c.id === r.personajeFav;}) : null;
    const favName = fav ? fav.name : '—';
    let texto = '🏆 Duelos ganados: ' + r.victorias + '  ·  Mejor combo: ' + r.mejorCombo;
    if (r.mejorPisoRoguelike > 0) {
      texto += '  ·  Roguelike: piso ' + r.mejorPisoRoguelike + '/30';
    }
    if (r.roguelikesGanados > 0) {
      texto += '  ·  🎖️ ' + r.roguelikesGanados + ' conquistas';
    }
    el.textContent = texto;
  }
}

function setupMenu() {
  renderMenu();
  renderRecords();

  // Selector de modo
  document.getElementById('modeRow').addEventListener('click', function(e) {
    if (e.target.classList.contains('mode-btn')) {
      const btns = document.querySelectorAll('.mode-btn');
      for (let i = 0; i < btns.length; i++) btns[i].classList.remove('selected');
      e.target.classList.add('selected');
      modoActual = e.target.dataset.mode;
      // Ocultar/mostrar dificultad (en roguelike la controla el piso)
      const diffRow = document.getElementById('diffRow');
      diffRow.style.opacity = (modoActual === 'roguelike') ? '0.3' : '1';
      diffRow.style.pointerEvents = (modoActual === 'roguelike') ? 'none' : 'auto';
    }
  });

  // Selector de dificultad
  document.getElementById('diffRow').addEventListener('click', function(e) {
    if (e.target.classList.contains('diff-btn')) {
      const btns = document.querySelectorAll('.diff-btn');
      for (let i = 0; i < btns.length; i++) btns[i].classList.remove('selected');
      e.target.classList.add('selected');
      dificultad = e.target.dataset.diff;
    }
  });

  // Botón empezar
  document.getElementById('startBtn').addEventListener('click', function() {
    initAudio();
    document.getElementById('menu').style.display = 'none';
    document.getElementById('gameScreen').classList.add('active');
    iniciarPartida();
  });

  // Botón volver
  document.getElementById('backBtn').addEventListener('click', function() {
    volverAlMenu();
  });

  // Botones de overlay
  document.getElementById('goMenuBtn').addEventListener('click', function() {
    document.getElementById('gameOverOverlay').classList.remove('active');
    volverAlMenu();
  });
  document.getElementById('victoryMenuBtn').addEventListener('click', function() {
    document.getElementById('victoryOverlay').classList.remove('active');
    volverAlMenu();
  });
}

function volverAlMenu() {
  document.getElementById('gameScreen').classList.remove('active');
  document.getElementById('menu').style.display = 'flex';
  document.getElementById('upgradeOverlay').classList.remove('active');
  document.getElementById('gameOverOverlay').classList.remove('active');
  document.getElementById('victoryOverlay').classList.remove('active');
  jugador = null;
  ia = null;
  run = null;
  estadoJuego = 'menu';
  pausado = false;
  renderRecords();
}

// ============================================================
//  ARRANQUE
// ============================================================
setupMenu();
loop();
