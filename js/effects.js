// ============================================================
//  SISTEMAS DE EFECTOS VISUALES
// ============================================================

// --- PARTÍCULAS ---
const particles = [];
function spawnParticles(x, y, count, color, spread = 6, gravity = 0.35) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2, s = 1 + Math.random() * spread;
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2,
      life: 25 + Math.random() * 25, maxLife: 50, color, size: 2 + Math.random() * 4, gravity });
  }
}
function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy; p.vy += p.gravity; p.vx *= 0.97; p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}
function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

// --- NÚMEROS DE DAÑO ---
const dmgNumbers = [];
function spawnDamageNumber(x, y, value, color = '#fff', big = false) {
  dmgNumbers.push({ x, y, value, color, big, life: 55, vy: -2.2, vx: (Math.random() - 0.5) * 2.5 });
}
function updateDamageNumbers() {
  for (let i = dmgNumbers.length - 1; i >= 0; i--) {
    const d = dmgNumbers[i];
    d.x += d.vx; d.y += d.vy; d.vy += 0.08; d.life--;
    if (d.life <= 0) dmgNumbers.splice(i, 1);
  }
}
function drawDamageNumbers() {
  ctx.textAlign = 'center';
  for (const d of dmgNumbers) {
    ctx.globalAlpha = Math.min(1, d.life / 25);
    ctx.font = `900 ${d.big ? 30 : 19}px 'Segoe UI', sans-serif`;
    ctx.fillStyle = d.color;
    ctx.strokeStyle = '#000'; ctx.lineWidth = d.big ? 4 : 3;
    ctx.strokeText(d.value, d.x, d.y);
    ctx.fillText(d.value, d.x, d.y);
  }
  ctx.globalAlpha = 1;
}

// --- SCREEN SHAKE ---
let shakeAmount = 0;
function shake(a) { shakeAmount = Math.max(shakeAmount, a); }

// --- ONDAS DE IMPACTO ---
const impactRings = [];
function spawnRing(x, y, color, size = 60) {
  impactRings.push({ x, y, r: 5, maxR: size, life: 20, maxLife: 20, color });
}
function updateRings() {
  for (let i = impactRings.length - 1; i >= 0; i--) {
    const r = impactRings[i];
    r.r += (r.maxR - r.r) * 0.25; r.life--;
    if (r.life <= 0) impactRings.splice(i, 1);
  }
}
function drawRings() {
  for (const r of impactRings) {
    ctx.globalAlpha = r.life / r.maxLife * 0.7;
    ctx.strokeStyle = r.color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// --- PROYECTILES (Frost) ---
const projectiles = [];
function updateProjectiles() {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.x += p.vx; p.y += p.vy; p.life--;
    if (p.life % 2 === 0) spawnParticles(p.x, p.y, 1, p.color, 1.5, 0.05);
    const target = p.owner === jugador ? ia : jugador;
    if (target && target.invulnerable === 0 &&
        Math.abs(p.x - target.x) < 35 &&
        Math.abs(p.y - (target.y - 50)) < 60) {
      target.recibirDaño(p.damage, p.owner, 'special');
      if (p.slow) target.slowTimer = 180;
      spawnParticles(p.x, p.y, 25, p.color, 12);
      spawnRing(p.x, p.y, p.accent, 90);
      projectiles.splice(i, 1);
      continue;
    }
    if (p.life <= 0 || p.x < -50 || p.x > W + 50) projectiles.splice(i, 1);
  }
}
function drawProjectiles() {
  for (const p of projectiles) {
    ctx.save();
    ctx.shadowColor = p.color; ctx.shadowBlur = 25;
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

// --- RAYOS (Bolt) ---
const lightningBolts = [];
function spawnLightning(x, y, color) {
  const points = [];
  let cy = 0, cx = x;
  while (cy < y) {
    cy += 25 + Math.random() * 20;
    cx += (Math.random() - 0.5) * 30;
    points.push({ x: cx, y: cy });
  }
  points.push({ x, y });
  lightningBolts.push({ points, color, life: 15, maxLife: 15 });
}
function updateLightning() {
  for (let i = lightningBolts.length - 1; i >= 0; i--) {
    lightningBolts[i].life--;
    if (lightningBolts[i].life <= 0) lightningBolts.splice(i, 1);
  }
}
function drawLightning() {
  for (const b of lightningBolts) {
    ctx.save();
    ctx.globalAlpha = b.life / b.maxLife;
    ctx.strokeStyle = b.color; ctx.lineWidth = 5;
    ctx.shadowColor = b.color; ctx.shadowBlur = 30;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(b.points[0].x, b.points[0].y);
    for (const p of b.points) ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
}

// --- ACTUALIZACIÓN / DIBUJO EN LOTE ---
function updateAllEffects() {
  updateParticles();
  updateDamageNumbers();
  updateRings();
  updateProjectiles();
  updateLightning();
  if (shakeAmount > 0) {
    shakeAmount *= 0.87;
    if (shakeAmount < 0.3) shakeAmount = 0;
  }
}
function drawAllEffectsBehind() {
  drawRings();
}
function drawAllEffectsFront() {
  drawProjectiles();
  drawLightning();
  drawParticles();
  drawDamageNumbers();
}
