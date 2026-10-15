// ============================================================
//  CICLO DE PARTIDA
// ============================================================
function iniciarRonda() {
  jugador.reset(200, 1);
  ia.reset(W - 200, -1);
  particles.length = 0;
  dmgNumbers.length = 0;
  impactRings.length = 0;
  projectiles.length = 0;
  lightningBolts.length = 0;
  koZoom = 1;
  koZoomTarget = 1;
  koFocusX = 0;
  koFocusY = 0;
  slowmoFactor = 1;
  slowmoTimer = 0;
  impactFrameTimer = 0;
  mensajeGrande = ''; mensajeTimer = 0;
  pausado = false;
  clearPresses();

  if (modoActual === 'rapido' && victoriasJugador === 0 && victoriasIA === 0 && !vsScreenYaMostrado) {
    mostrarVSScreen();
    vsScreenYaMostrado = true;
    return;
  }
  estadoJuego = 'countdown';
  countdownTimer = 180;
}

function iniciarPartida() {
  vsScreenYaMostrado = false;
  ultimoComboLlamado = 0;
  dañoTotalInfligido = 0;
  if (modoActual === 'roguelike') {
    if (typeof playMusic === 'function') playMusic('combat');
    roguelikeIniciar(personajeJugador.id);
    return;
  }
  if (typeof playMusic === 'function') playMusic('combat');
  const disponibles = CHARACTERS.filter(function(c) { return c.id !== personajeJugador.id; });
  personajeIA = disponibles[Math.floor(Math.random() * disponibles.length)];
  personajeJugador = CHARACTERS.find(function(c){ return c.id === personajeJugador.id; });
  jugador = new Fighter(personajeJugador, 200, 1, false);
  ia = new Fighter(personajeIA, W - 200, -1, true);
  victoriasJugador = 0; victoriasIA = 0;
  comboTopeEstaPartida = 0;
  dañoRecibidoRonda1 = 0;
  dañoRecibidoRonda2 = 0;
  esPerfectRound = false;
  escenarioActual = Math.floor(Math.random() * SCENARIOS.length);
  if (typeof playAmbient === 'function') playAmbient(SCENARIOS[escenarioActual].id);
  iniciarRonda();
}

function togglePausa() {
  if (estadoJuego !== 'fighting' && estadoJuego !== 'countdown') return;
  pausado = !pausado;
}

function saltarAvisoBoss() {
  if (window.__avisoTimer) {
    clearTimeout(window.__avisoTimer);
    window.__avisoTimer = null;
  }
  window.__avisoStartTime = null;
  ocultarAvisoBoss();
  if (estadoJuego === 'boss_warning') {
    estadoJuego = 'countdown';
    countdownTimer = 180;
    clearPresses();
  }
}

// ============================================================
//  UPDATE
// ============================================================
function update() {
  time++;
  updateAllEffects();

  if (impactFrameTimer > 0) {
    impactFrameTimer--;
    return;
  }

  if (!jugador || !ia) return;

  // Red de seguridad del aviso de boss/elite
  var _overlayAviso = document.getElementById('bossWarningOverlay');
  if (_overlayAviso && _overlayAviso.classList.contains('active')) {
    if (estadoJuego !== 'boss_warning') {
      _overlayAviso.classList.remove('active');
      _overlayAviso.classList.remove('final');
      _overlayAviso.classList.remove('elite');
      window.__avisoStartTime = null;
      if (window.__avisoTimer) { clearTimeout(window.__avisoTimer); window.__avisoTimer = null; }
    } else {
      if (!window.__avisoStartTime) window.__avisoStartTime = Date.now();
      if (Date.now() - window.__avisoStartTime > 2500) {
        _overlayAviso.classList.remove('active');
        _overlayAviso.classList.remove('final');
        _overlayAviso.classList.remove('elite');
        estadoJuego = 'countdown';
        countdownTimer = 180;
        clearPresses();
        window.__avisoStartTime = null;
        if (window.__avisoTimer) { clearTimeout(window.__avisoTimer); window.__avisoTimer = null; }
      }
    }
  }

  if (mensajeTimer > 0) mensajeTimer--;

  if (pausado) return;

  if (estadoJuego === 'evento') return;

  if (estadoJuego === 'vs_screen') {
    vsScreenTimer--;
    if (vsScreenTimer <= 0) {
      cerrarVSScreen();
    }
    return;
  }

  if (estadoJuego === 'countdown') {
    countdownTimer--;
    if (countdownTimer % 60 === 0 && countdownTimer > 0 && typeof SFX !== 'undefined') SFX.count();
    if (countdownTimer === 30 && !window.__fightAnunciado) {
      window.__fightAnunciado = true;
      if (typeof SFX !== 'undefined') SFX.fight();
    }
    if (countdownTimer <= 0) {
      estadoJuego = 'fighting';
      window.__fightAnunciado = false;
    }
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

    // Combo calls
    if (jugador.combo >= 5 && jugador.combo !== ultimoComboLlamado) {
      if (jugador.combo === 5) mostrarComboCall('¡COMBO!');
      else if (jugador.combo === 10) mostrarComboCall('¡10 HITS!');
      else if (jugador.combo === 15) mostrarComboCall('¡15 HITS!');
      else if (jugador.combo === 20) mostrarComboCall('¡INCREÍBLE!');
      ultimoComboLlamado = jugador.combo;
    }
    if (jugador.combo === 0) ultimoComboLlamado = 0;

    if (typeof shakeDirX !== 'undefined') {
      shakeDirX *= 0.85;
      if (Math.abs(shakeDirX) < 0.05) shakeDirX = 0;
    }

    // Cambio de fase del boss final
    if (modoActual === 'roguelike' && run && run.esBossPisoFinal) {
      const hpPct = ia.salud / ia.maxHealth;
      if (ia.faseActual === undefined) ia.faseActual = 1;

      if (ia.faseActual === 1 && hpPct < 0.66) {
        ia.faseActual = 2;
        ia.color = '#f97316'; ia.accent = '#fb923c';
        ia.def.dmgMult *= 1.20;
        ia.def.speed *= 1.10;
        spawnParticles(ia.x, ia.y - 55, 40, '#f97316', 14);
        spawnRing(ia.x, ia.y - 55, '#f97316', 180);
        shake(20);
        if (typeof SFX !== 'undefined') SFX.special();
        mensajeGrande = '¡FASE 2!';
        mensajeTimer = 90;
      } else if (ia.faseActual === 2 && hpPct < 0.33) {
        ia.faseActual = 3;
        ia.color = '#ef4444'; ia.accent = '#dc2626';
        ia.def.dmgMult *= 1.20;
        ia.def.speed *= 1.10;
        ia.maxHealth += 40;
        ia.salud += 40;
        ia.saludGhost += 40;
        spawnParticles(ia.x, ia.y - 55, 60, '#ef4444', 16);
        spawnRing(ia.x, ia.y - 55, '#ef4444', 220);
        shake(25);
        if (typeof SFX !== 'undefined') SFX.special();
        mensajeGrande = '¡FASE 3!';
        mensajeTimer = 90;
      }
    }

    if (jugador.salud <= 0 && modoActual === 'roguelike' && typeof intentarRevivir === 'function') {
      if (intentarRevivir()) return;
    }

    if (jugador.salud <= 0 || ia.salud <= 0) {
      estadoJuego = 'roundover';
      roundTimer = 170;
      if (typeof SFX !== 'undefined') SFX.ko();
      shake(20);

      const jugadorGano = ia.salud <= 0 && jugador.salud > 0;

      if (modoActual === 'rapido') {
        if (victoriasJugador === 0 && victoriasIA === 0) dañoRecibidoRonda1 = jugador.maxHealth - jugador.salud;
        else dañoRecibidoRonda2 = jugador.maxHealth - jugador.salud;
      }

      if (jugador.salud <= 0 && ia.salud <= 0) mensajeGrande = 'EMPATE';
      else if (jugador.salud <= 0) { mensajeGrande = 'K.O.'; victoriasIA++; }
      else { mensajeGrande = '¡K.O.!'; victoriasJugador++; }
      mensajeTimer = 170;
      const dead = jugador.salud <= 0 ? jugador : ia;
      spawnParticles(dead.x, dead.y - 55, 40, dead.accent, 12);

      if (modoActual === 'roguelike') {
        window.__roguelikeGanador = jugadorGano ? 'jugador' : 'ia';
      }
    }
    return;
  }

  if (estadoJuego === 'roundover') {
    roundTimer--;

    if (roundTimer === 169) {
      const dead = jugador.salud <= 0 ? jugador : ia;
      koZoomTarget = 1.35;
      koFocusX = dead.x;
      koFocusY = dead.y - 50;
      slowmoTimer = 30;
      slowmoFactor = 0.35;
    }

    koZoom += (koZoomTarget - koZoom) * 0.06;

    if (slowmoTimer > 0) {
      slowmoTimer--;
      if (slowmoTimer === 0) slowmoFactor = 1;
    }

    [jugador, ia].forEach(function(f) {
      f.vy += GRAVITY * slowmoFactor;
      f.y += f.vy * slowmoFactor;
      if (f.y >= GROUND) { f.y = GROUND; f.vy = 0; }
      if (f.saludGhost > f.salud) f.saludGhost -= 0.6;
    });

    if (roundTimer <= 0) {
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

      if (victoriasJugador >= ROUNDS_TO_WIN || victoriasIA >= ROUNDS_TO_WIN) {
        estadoJuego = 'matchover';
        const ganaste = victoriasJugador >= ROUNDS_TO_WIN;
        esPerfectRound = ganaste && victoriasIA === 0 &&
                         dañoRecibidoRonda1 === 0 && dañoRecibidoRonda2 === 0;
        if (esPerfectRound) {
          mensajeGrande = '¡PERFECT!';
          if (typeof ANNOUNCER_SFX !== 'undefined') setTimeout(function(){ ANNOUNCER_SFX.perfect(); }, 300);
        } else {
          mensajeGrande = ganaste ? '¡GANASTE!' : 'PERDISTE';
        }
        mensajeTimer = 999999;
        if (ganaste) {
          registrarVictoria(personajeJugador.id, comboTopeEstaPartida);
          if (typeof SFX !== 'undefined') SFX.victory();
          jugador.poseVictoria = true;
        } else {
          if (typeof SFX !== 'undefined') SFX.defeat();
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
    ctx.translate((Math.random()-0.5)*shakeAmount + (typeof shakeDirX !== 'undefined' ? shakeDirX * shakeAmount * 0.5 : 0),
                  (Math.random()-0.5)*shakeAmount);

  if (impactFrameTimer > 0) {
    ctx.fillStyle = 'rgba(255,255,255,' + (impactFrameTimer / 4 * 0.35) + ')';
    ctx.fillRect(0, 0, W, H);
  }

  if (koZoom !== 1 || koFocusX !== 0) {
    ctx.save();
    ctx.translate(koFocusX, koFocusY);
    ctx.scale(koZoom, koZoom);
    ctx.translate(-koFocusX, -koFocusY);
  }

  drawBackground();

  if (ia && ia.def && ia.def.__esElite && ia.salud > 0) {
    ctx.save();
    const pulse = 0.6 + Math.sin(time * 0.15) * 0.4;
    ctx.globalAlpha = 0.5 * pulse;
    const grad = ctx.createRadialGradient(ia.x, ia.y - 50, 20, ia.x, ia.y - 50, 100);
    grad.addColorStop(0, 'rgba(251,191,36,0.7)');
    grad.addColorStop(1, 'rgba(251,191,36,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ia.x, ia.y - 50, 100, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (jugador) jugador.dibujar(time);
  if (ia) ia.dibujar(time);

  drawRings();
  drawProjectiles();
  drawLightning();
  drawParticles();
  drawDamageNumbers();

  if (koZoom !== 1 || koFocusX !== 0) {
    ctx.restore();
  }

  ctx.restore();

  if (jugador && ia) drawHUD();
  if (estadoJuego === 'countdown') drawCountdown();
  if (estadoJuego === 'roundover') drawBigMessage();

  if (estadoJuego === 'matchover' && modoActual === 'rapido') {
    ctx.fillStyle = 'rgba(10,6,24,0.85)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const ganaste = victoriasJugador >= ROUNDS_TO_WIN;
    ctx.font = '90px "Black Ops One", sans-serif';
    ctx.fillStyle = ganaste ? '#9dffd4' : '#ff7a7a';
    ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 50;
    ctx.fillText(mensajeGrande, W/2, H/2 - 80);
    ctx.shadowBlur = 0;
    ctx.font = '13px "Press Start 2P", monospace'; ctx.fillStyle = '#f5f0ff';
    ctx.fillText('RONDAS: ' + victoriasJugador + ' - ' + victoriasIA, W/2, H/2 - 10);
    ctx.font = '12px "Press Start 2P", monospace'; ctx.fillStyle = '#fff7a1';
    ctx.fillText('MEJOR COMBO: ' + comboTopeEstaPartida, W/2, H/2 + 30);
    ctx.font = '11px "Press Start 2P", monospace'; ctx.fillStyle = '#a899c7';
    ctx.fillText('R PARA REJUGAR', W/2, H/2 + 90);
    ctx.fillText('O VUELVE AL MENÚ', W/2, H/2 + 120);
  }

  if (estadoJuego === 'matchover' && esPerfectRound) {
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '100px "Black Ops One", sans-serif';
    ctx.shadowColor = '#fff7a1'; ctx.shadowBlur = 60;
    ctx.fillStyle = '#fff7a1';
    ctx.strokeStyle = '#0a0618'; ctx.lineWidth = 10;
    ctx.strokeText('¡PERFECT!', W/2, H/2 - 130);
    ctx.fillText('¡PERFECT!', W/2, H/2 - 130);
    ctx.restore();
  }

  if (pausado) drawPausa();
}

// ============================================================
//  LOOP
// ============================================================
function loop() {
  try { update(); } catch (e) { console.error('[LOOP] Error en update:', e); }
  try { render(); } catch (e) { console.error('[LOOP] Error en render:', e); }
  requestAnimationFrame(loop);
}

function volverAlMenu() {
  if (typeof playMusic === 'function') playMusic('menu');
  if (typeof stopAmbient === 'function') stopAmbient();
  bossWarningTimer = 0;
  window.__avisoStartTime = null;
  if (window.__avisoTimer) { clearTimeout(window.__avisoTimer); window.__avisoTimer = null; }
  vsScreenYaMostrado = false;
  const overlayVS = document.getElementById('vsScreenOverlay');
  if (overlayVS) overlayVS.classList.remove('active');
  const overlayCombo = document.getElementById('comboCallOverlay');
  if (overlayCombo) overlayCombo.classList.remove('active');
  document.getElementById('gameScreen').classList.remove('active');
  document.getElementById('menu').style.display = 'flex';
  document.getElementById('upgradeOverlay').classList.remove('active');
  document.getElementById('gameOverOverlay').classList.remove('active');
  document.getElementById('victoryOverlay').classList.remove('active');
  document.getElementById('bossWarningOverlay').classList.remove('active');
  document.getElementById('bossWarningOverlay').classList.remove('final');
  document.getElementById('bossWarningOverlay').classList.remove('elite');
  document.getElementById('descansoOverlay').classList.remove('active');
  document.getElementById('conquistaOverlay').classList.remove('active');
  document.getElementById('tiendaOverlay').classList.remove('active');
  document.getElementById('buildOverlay').classList.remove('active');
  jugador = null;
  ia = null;
  run = null;
  estadoJuego = 'menu';
  pausado = false;
  impactFrameTimer = 0;
  koZoom = 1;
  koZoomTarget = 1;
  koFocusX = 0;
  koFocusY = 0;
  renderRecords();
}

// ============================================================
//  ARRANQUE
// ============================================================
setupMenu();
loop();

document.addEventListener('keydown', function arrancarMusicaOnce() {
  if (typeof initAudio === 'function') initAudio();
  if (typeof playMusic === 'function') playMusic('menu');
  document.removeEventListener('keydown', arrancarMusicaOnce);
}, { once: true });

document.addEventListener('click', function arrancarMusicaOnceClick() {
  if (typeof initAudio === 'function') initAudio();
  if (typeof playMusic === 'function') playMusic('menu');
  document.removeEventListener('click', arrancarMusicaOnceClick);
}, { once: true });
