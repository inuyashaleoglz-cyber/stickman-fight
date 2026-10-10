// ============================================================
//  ESTADO DEL JUEGO
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

// ============================================================
//  CICLO DE PARTIDA
// ============================================================
function iniciarRonda() {
  jugador.reset(200, 1);
  ia.reset(W - 200, -1);
  particles.length = 0; dmgNumbers.length = 0; impactRings.length = 0;
  projectiles.length = 0; lightningBolts.length = 0;
  estadoJuego = 'countdown';
  countdownTimer = 180;
  mensajeGrande = ''; mensajeTimer = 0;
  clearPresses();
}

function iniciarPartida() {
  const disponibles = CHARACTERS.filter(c => c.id !== personajeJugador.id);
  personajeIA = disponibles[Math.floor(Math.random() * disponibles.length)];
  jugador = new Fighter(personajeJugador, 200, 1, false);
  ia = new Fighter(personajeIA, W - 200, -1, true);
  victoriasJugador = 0; victoriasIA = 0;
  iniciarRonda();
}

// ============================================================
//  FONDO
// ============================================================
function drawBackground() {
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
  ctx.beginPath(); ctx.arc(760, 100, 80, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff8e0';
  ctx.beginPath(); ctx.arc(760, 100, 38, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(200,180,140,0.5)';
  ctx.beginPath(); ctx.arc(748, 92, 6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(775, 108, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(770, 85, 3, 0, Math.PI * 2); ctx.fill();

  for (let i = 0; i < 50; i++) {
    const sx = (i * 137.5) % W, sy = (i * 73.3) % (H * 0.55);
    const alpha = 0.3 + Math.sin(time * 0.03 + i * 1.7) * 0.3;
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillStyle = '#fff';
    ctx.fillRect(sx, sy, 1.5, 1.5);
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#150a28';
  ctx.beginPath(); ctx.moveTo(0, H - 100);
  for (let x = 0; x <= W; x += 60) {
    const h = 150 + Math.sin(x * 0.008 + 1) * 40 + Math.cos(x * 0.013) * 30;
    ctx.lineTo(x, H - h);
  }
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();

  ctx.fillStyle = '#0a0518';
  ctx.beginPath(); ctx.moveTo(0, H - 70);
  for (let x = 0; x <= W; x += 40) {
    const h = 90 + Math.sin(x * 0.02 + 3) * 25;
    ctx.lineTo(x, H - h);
  }
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();

  const groundGrad = ctx.createLinearGradient(0, GROUND, 0, H);
  groundGrad.addColorStop(0, '#1f2937');
  groundGrad.addColorStop(1, '#0a0518');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, GROUND, W, H - GROUND);

  ctx.save();
  ctx.shadowColor = '#e94560'; ctx.shadowBlur = 15;
  ctx.strokeStyle = '#e94560'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, GROUND); ctx.lineTo(W, GROUND); ctx.stroke();
  ctx.restore();
}

// ============================================================
//  HUD
// ============================================================
function drawHealthBar(x, y, ancho, alto, salud, saludGhost, maxHealth, color, invertida, nombre, meter, specialName) {
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(x - 3, y - 3, ancho + 6, alto + 6);

  const ghostW = ancho * (saludGhost / maxHealth);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  if (invertida) ctx.fillRect(x + ancho - ghostW, y, ghostW, alto);
  else ctx.fillRect(x, y, ghostW, alto);

  const w = ancho * (salud / maxHealth);
  const grad = ctx.createLinearGradient(x, y, x + ancho, y);
  if (invertida) { grad.addColorStop(0, color); grad.addColorStop(1, '#ef4444'); }
  else { grad.addColorStop(0, '#22c55e'); grad.addColorStop(1, color); }
  ctx.fillStyle = grad;
  if (invertida) ctx.fillRect(x + ancho - w, y, w, alto);
  else ctx.fillRect(x, y, w, alto);

  ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2;
  ctx.strokeRect(x, y, ancho, alto);
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(x, y, ancho, alto / 3);

  const mY = y + alto + 5, mH = 6;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(x - 2, mY - 2, ancho + 4, mH + 4);
  const mW = ancho * (meter / 100);
  const mGrad = ctx.createLinearGradient(x, mY, x + ancho, mY);
  mGrad.addColorStop(0, '#fbbf24'); mGrad.addColorStop(1, '#f59e0b');
  ctx.fillStyle = mGrad;
  if (meter >= 100) {
    ctx.globalAlpha = 0.7 + Math.sin(time * 0.3) * 0.3;
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
  ctx.fillText(nombre, nombreX, y - 10);

  if (meter >= 100) {
    ctx.font = 'bold 11px Segoe UI, sans-serif';
    ctx.fillStyle = '#fde047';
    ctx.textAlign = invertida ? 'right' : 'left';
    ctx.fillText('★ ' + specialName + ' LISTO ★', nombreX, mY + mH + 14);
  }
}

function drawHUD() {
  const barW = 350, barH = 24, y = 35;
  drawHealthBar(30, y, barW, barH, jugador.salud, jugador.saludGhost, jugador.maxHealth, jugador.color, false, jugador.name, jugador.meter, jugador.def.specialName);
  drawHealthBar(W - 30 - barW, y, barW, barH, ia.salud, ia.saludGhost, ia.maxHealth, ia.color, true, ia.name, ia.meter, ia.def.specialName);

  for (let i = 0; i < ROUNDS_TO_WIN; i++) {
    const px = 30 + barW + 25 + i * 26;
    ctx.beginPath(); ctx.arc(px, y + barH / 2, 9, 0, Math.PI * 2);
    ctx.fillStyle = i < victoriasJugador ? jugador.color : 'rgba(255,255,255,0.12)';
    ctx.fill(); ctx.strokeStyle = jugador.color; ctx.lineWidth = 2; ctx.stroke();
    const ix = W - 30 - barW - 25 - i * 26;
    ctx.beginPath(); ctx.arc(ix, y + barH / 2, 9, 0, Math.PI * 2);
    ctx.fillStyle = i < victoriasIA ? ia.color : 'rgba(255,255,255,0.12)';
    ctx.fill(); ctx.strokeStyle = ia.color; ctx.lineWidth = 2; ctx.stroke();
  }

  ctx.font = 'bold 22px Segoe UI, sans-serif';
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
  ctx.fillText('VS', W / 2, y + barH / 2 + 8);

  ctx.font = 'bold 10px Segoe UI, sans-serif';
  ctx.fillStyle = AIS[dificultad].color;
  ctx.fillText(AIS[dificultad].name, W / 2, y + barH + 28);
}

// ============================================================
//  MENSAJES Y COUNTDOWN
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
  ctx.strokeText(mensajeGrande, W / 2, H / 2 - 20);
  ctx.fillStyle = '#fff';
  ctx.fillText(mensajeGrande, W / 2, H / 2 - 20);
  ctx.restore();
}

function drawCountdown() {
  const seg = Math.ceil(countdownTimer / 60);
  const escala = 1 + Math.sin(time * 0.25) * 0.06;
  ctx.save();
  ctx.translate(W / 2, H / 2 - 20); ctx.scale(escala, escala);
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

// ============================================================
//  UPDATE
// ============================================================
function update() {
  time++;
  updateAllEffects();

  // GUARDA: sin jugadores → solo efectos
  if (!jugador || !ia) return;

  if (mensajeTimer > 0) mensajeTimer--;

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
    if (jugador.salud <= 0 || ia.salud <= 0) {
      estadoJuego = 'roundover';
      roundTimer = 170;
      SFX.ko(); shake(20);
      if (jugador.salud <= 0 && ia.salud <= 0) mensajeGrande = 'EMPATE';
      else if (jugador.salud <= 0) { mensajeGrande = 'K.O.'; victoriasIA++; }
      else { mensajeGrande = '¡K.O.!'; victoriasJugador++; }
      mensajeTimer = 170;
      const dead = jugador.salud <= 0 ? jugador : ia;
      spawnParticles(dead.x, dead.y - 55, 40, dead.accent, 12);
    }
    return;
  }

  if (estadoJuego === 'roundover') {
    roundTimer--;
    [jugador, ia].forEach(f => {
      f.vy += GRAVITY; f.y += f.vy;
      if (f.y >= GROUND) { f.y = GROUND; f.vy = 0; }
      if (f.saludGhost > f.salud) f.saludGhost -= 0.6;
    });
    if (roundTimer <= 0) {
      if (victoriasJugador >= ROUNDS_TO_WIN || victoriasIA >= ROUNDS_TO_WIN) {
        estadoJuego = 'matchover';
        mensajeGrande = victoriasJugador >= ROUNDS_TO_WIN ? '¡GANASTE!' : 'PERDISTE';
        mensajeTimer = 999999;
      } else iniciarRonda();
    }
  }
}

// ============================================================
//  RENDER
// ============================================================
function render() {
  ctx.save();
  if (shakeAmount > 0) ctx.translate((Math.random() - 0.5) * shakeAmount, (Math.random() - 0.5) * shakeAmount);

  drawBackground();
  if (jugador) jugador.dibujar(time);
  if (ia) ia.dibujar(time);
  drawAllEffectsBehind();
  drawAllEffectsFront();

  ctx.restore();

  if (jugador && ia) drawHUD();
  if (estadoJuego === 'countdown') drawCountdown();
  if (estadoJuego === 'roundover') drawBigMessage();

  if (estadoJuego === 'matchover') {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const ganaste = victoriasJugador >= ROUNDS_TO_WIN;
    ctx.font = '900 90px Segoe UI, sans-serif';
    ctx.fillStyle = ganaste ? '#4ade80' : '#f87171';
    ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 50;
    ctx.fillText(mensajeGrande, W / 2, H / 2 - 60);
    ctx.shadowBlur = 0;
    ctx.font = 'bold 24px Segoe UI, sans-serif'; ctx.fillStyle = '#fff';
    ctx.fillText(`Rondas: ${victoriasJugador} - ${victoriasIA}`, W / 2, H / 2 + 30);
    ctx.font = '18px Segoe UI, sans-serif'; ctx.fillStyle = '#aaa';
    ctx.fillText('Presiona R para jugar otra vez', W / 2, H / 2 + 80);
    ctx.fillText('o vuelve al menú para cambiar personaje', W / 2, H / 2 + 110);
  }
}

// ============================================================
//  LOOP Y ARRANQUE
// ============================================================
function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}

setupMenu();
loop();
