// ============================================================
//  FONDOS DE LOS 3 ESCENARIOS
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
