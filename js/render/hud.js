// ============================================================
//  HUD — Barras de vida, mensajes, pausa
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

  ctx.font = 'bold 18px "Black Ops One", sans-serif';
  ctx.fillStyle = color;
  ctx.textAlign = invertida ? 'right' : 'left';
  const nombreX = invertida ? x + ancho : x;
  const textoNombre = piso ? nombre + ' · P' + piso : nombre;
  ctx.fillText(textoNombre, nombreX, y - 10);

  if (meter >= 100) {
    ctx.font = '9px "Press Start 2P", monospace';
    ctx.fillStyle = '#fff7a1';
    ctx.textAlign = invertida ? 'right' : 'left';
    ctx.fillText('★ LISTO ★', nombreX, mY + mH + 14);
  }
}

function drawHUD() {
  const barW = 350, barH = 24, y = 35;
  const piso = (modoActual === 'roguelike' && run) ? run.piso : null;
  drawHealthBar(30, y, barW, barH, jugador.salud, jugador.saludGhost, jugador.maxHealth,
    jugador.color, false, jugador.name, jugador.meter, jugador.def.specialName, piso);
  drawHealthBar(W - 30 - barW, y, barW, barH, ia.salud, ia.saludGhost, ia.maxHealth,
    ia.color, true, ia.name, ia.meter, ia.def.specialName, null);

  // Afijos del rival
  if (modoActual === 'roguelike' && ia && ia.def && ia.def.__afijos && ia.def.__afijos.length > 0) {
    ctx.save();
    ctx.textAlign = 'left';
    const afijos = ia.def.__afijos;
    const startX = W - 30 - barW;
    const startY = y + barH + 40;
    ctx.font = '10px "Press Start 2P", monospace';
    let offsetX = 0;
    afijos.forEach(function(afijo) {
      ctx.fillStyle = afijo.color;
      ctx.shadowColor = afijo.color;
      ctx.shadowBlur = 10;
      ctx.font = '20px sans-serif';
      ctx.fillText(afijo.icono, startX + offsetX, startY);
      offsetX += 30;
    });
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.shadowBlur = 0;
    const nombres = afijos.map(function(a){ return a.nombre; }).join(' · ');
    ctx.fillText(nombres, startX, startY + 14);
    ctx.restore();
  }

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
  }

  ctx.font = '20px "Black Ops One", sans-serif';
  ctx.fillStyle = '#ff9ecd';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#ff9ecd'; ctx.shadowBlur = 10;
  ctx.fillText('VS', W/2, y + barH/2 + 8);
  ctx.shadowBlur = 0;

  ctx.font = '8px "Press Start 2P", monospace';
  ctx.fillStyle = AIS[dificultad].color;
  ctx.fillText(AIS[dificultad].name, W/2, y + barH + 12);

  ctx.font = '9px "Press Start 2P", monospace';
  ctx.fillStyle = 'rgba(208,183,255,0.5)';
  ctx.fillText(SCENARIOS[escenarioActual].name, W/2, H - 15);

  if (modoActual === 'roguelike' && run && run.bonuses.sinergiasActivas.length > 0) {
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = '#d0b7ff';
    ctx.textAlign = 'left';
    ctx.shadowColor = '#d0b7ff'; ctx.shadowBlur = 8;
    let texto = '✦ ';
    run.bonuses.sinergiasActivas.forEach(function(id, idx) {
      const s = SINERGIAS.find(function(x){ return x.id === id; });
      if (s) texto += s.icon + ' ' + s.nombre + (idx < run.bonuses.sinergiasActivas.length - 1 ? ' · ' : '');
    });
    ctx.fillText(texto, 20, H - 15);
    ctx.shadowBlur = 0;
  }

  if (modoActual === 'roguelike' && run) {
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillStyle = '#fff7a1';
    ctx.textAlign = 'right';
    ctx.shadowColor = '#fff7a1'; ctx.shadowBlur = 10;
    ctx.fillText('💰 ' + run.oro, W - 20, y + barH + 55);
    ctx.shadowBlur = 0;
  }
}

function drawBigMessage() {
  if (!mensajeGrande) return;
  const alpha = Math.min(1, mensajeTimer / 20);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '100px "Black Ops One", sans-serif';
  ctx.strokeStyle = '#0a0618'; ctx.lineWidth = 8;
  ctx.shadowColor = '#ff9ecd'; ctx.shadowBlur = 40;
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
  ctx.font = '140px "Black Ops One", sans-serif';
  const texto = seg > 0 ? String(seg) : '¡PELEA!';
  const color = seg > 0 ? '#fff7a1' : '#9dffd4';
  ctx.shadowColor = color; ctx.shadowBlur = 50;
  ctx.fillStyle = color;
  ctx.strokeStyle = '#0a0618'; ctx.lineWidth = 10;
  ctx.strokeText(texto, 0, 0);
  ctx.fillText(texto, 0, 0);
  ctx.restore();
}

function drawPausa() {
  ctx.fillStyle = 'rgba(10,6,24,0.85)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '80px "Black Ops One", sans-serif';
  ctx.fillStyle = '#f5f0ff';
  ctx.shadowColor = '#9dffd4'; ctx.shadowBlur = 30;
  ctx.fillText('PAUSA', W/2, H/2 - 40);
  ctx.shadowBlur = 0;
  ctx.font = '12px "Press Start 2P", monospace';
  ctx.fillStyle = '#9dffd4';
  ctx.fillText('P — CONTINUAR', W/2, H/2 + 30);
  ctx.fillStyle = '#ff7a7a';
  ctx.fillText('R — REINICIAR', W/2, H/2 + 65);
  ctx.fillStyle = '#d0b7ff';
  ctx.fillText('M — MUTE', W/2, H/2 + 100);
}
