class Fighter {
  constructor(def, x, facing, esIA) {
    this.def = def;
    this.x = x; this.y = GROUND; this.vx = 0; this.vy = 0;
    this.color = def.color; this.accent = def.accent;
    this.name = def.name;
    this.esIA = esIA;
    this.maxHealth = def.maxHealth;
    this.salud = def.maxHealth; this.saludGhost = def.maxHealth;
    this.meter = 0;
    this.enSuelo = true;
    this.facing = facing;
    this.estado = 'idle';
    this.estadoTimer = 0;
    this.moveActual = null; this.moveFase = null;
    this.yaGolpeo = false;
    this.crouching = false; this.blocking = false;
    this.invulnerable = 0; this.hitFlash = 0;
    this.walkCycle = 0;
    this.combo = 0; this.comboTimer = 0;
    this.slowTimer = 0;
    this.superArmorFrames = 0;
    this.healAccum = 0;
    this.hitCount = 0;
    this.doubleJumpUsed = false;
    this.dashTimer = 0;
    this.dashDir = 0;
    this.lastATap = 0;
    this.lastDTap = 0;
    // NUEVOS: bonuses con lógica
    this.bonuses = def.__bonuses || bonusesVacios();
    this.regenAccum = 0;
    this.reviviresRestantes = (this.bonuses && this.bonuses.revivir) || 0;
    this.clonesActivos = 0;
    this.sangradoTimer = 0;
    this.sangradoAplica = 0;
    this.sangradoAcum = 0;
    this.revivirUsado = false;
    this.clonTimer = 0;
    this.clonX = 0;
    this.faseActual = 1;
    this.saltosUsados = 0;
    // IA
    this.aiDecisionTimer = 0;
    this.aiAction = {move:0, jump:false, crouch:false, block:false, move_name:null};
    this.aiLastPlayerX = x;
    this.aiPlayerVelX = 0;
  }

  reset(x, facing) {
    this.x = x; this.y = GROUND; this.vx = 0; this.vy = 0;
    this.maxHealth = this.def.maxHealth;
    this.salud = this.def.maxHealth; this.saludGhost = this.def.maxHealth;
    this.meter = 0;
    this.estado = 'idle'; this.estadoTimer = 0;
    this.moveActual = null; this.moveFase = null; this.yaGolpeo = false;
    this.crouching = false; this.blocking = false;
    this.invulnerable = 0; this.hitFlash = 0;
    this.combo = 0; this.comboTimer = 0;
    this.enSuelo = true; this.facing = facing;
    this.slowTimer = 0; this.superArmorFrames = 0;
    this.healAccum = 0; this.hitCount = 0; this.doubleJumpUsed = false;
    this.dashTimer = 0; this.dashDir = 0;
    this.regenAccum = 0;
    this.reviviresRestantes = (this.bonuses && this.bonuses.revivir) || 0;
    this.clonesActivos = 0;
    this.sangradoTimer = 0;
    this.sangradoAplica = 0;
    this.sangradoAcum = 0;
    this.revivirUsado = false;
    this.clonTimer = 0;
    this.faseActual = 1;
    this.saltosUsados = 0;
    this.aiDecisionTimer = 0;
    if (this.bonuses && this.bonuses.medidorInicial > 0) {
      this.meter = Math.min(100, this.bonuses.medidorInicial * 100);
    }
  }

  puedeActuar() {
    if (this.estado === 'hit') return false;
    if (this.estado === 'attacking') {
      if (this.moveFase === 'recovery' && this.yaGolpeo &&
          this.moveActual && this.moveActual.data.cancelable) {
        return true;
      }
      return false;
    }
    return true;
  }

  iniciarMovimiento(nombre, oponente) {
    if (nombre === 'special') return this.iniciarEspecial(oponente);
    const mv = MOVES[nombre];
    if (!mv) return false;
    const estabaCancelando = this.estado === 'attacking' && this.moveFase === 'recovery';
    this.moveActual = {name:nombre, data:mv, frame:0};
    this.moveFase = 'startup';
    this.estado = 'attacking';
    this.estadoTimer = mv.startup + mv.active + mv.recovery;
    this.yaGolpeo = false;
    if (estabaCancelando) {
      spawnParticles(this.x, this.y - 40, 8, this.accent, 4, 0.1);
    }
    if (nombre === 'uppercut') SFX.upper();
    else if (nombre === 'kick' || nombre === 'sweep') SFX.kick();
    else SFX.punch();
    return true;
  }

  iniciarEspecial(oponente) {
    if (this.meter < 100) return false;
    this.meter = 0;
    const sp = this.def.special;
    const data = Object.assign({}, MOVES.special, {
      damage: sp.damage, range: sp.range, launch: sp.launch,
      skipMelee: sp.projectile || sp.lightning
    });
    this.moveActual = {name:'special', data:data, frame:0};
    this.moveFase = 'startup';
    this.estado = 'attacking';
    this.estadoTimer = data.startup + data.active + data.recovery;
    this.yaGolpeo = false;
    SFX.special();

    const id = this.def.id;
    if (id === 'rocky' && sp.superArmor) {
      this.superArmorFrames = data.startup + data.active + 20;
      spawnParticles(this.x, this.y - 50, 20, '#fbbf24', 8);
    }
    if (id === 'shadow' && sp.teleport && oponente) {
      const side = oponente.x > this.x ? 1 : -1;
      this.x = oponente.x + side * 55;
      this.facing = -side;
      spawnParticles(this.x, this.y - 50, 25, this.color, 12);
      spawnRing(this.x, this.y - 50, this.accent, 90);
    }
    if (id === 'phoenix' && sp.heal) {
      this.salud = Math.min(this.maxHealth, this.salud + sp.heal);
      spawnParticles(this.x, this.y - 50, 30, '#fb923c', 10);
      spawnRing(this.x, this.y - 50, '#fb923c', 120);
    }
    if (id === 'bolt' && sp.lightning && oponente) {
      spawnLightning(oponente.x, oponente.y - 50, this.color);
    }
    // NUEVO: clon del especial (mejora Épica de Shadow)
    if (this.bonuses && this.bonuses.clonEspecial && oponente) {
      this.clonTimer = 40;
      this.clonesActivos = this.bonuses.clonEspecial;
      spawnParticles(this.clonX, this.y - 50, 20, this.color, 10);
    }
    // NUEVO: congelar al especial (mejora Épica de Frost)
    if (this.bonuses && this.bonuses.congelarEspecial && oponente) {
      const dur = 120 + (this.bonuses.congelarEspecial - 1) * 120;
      oponente.slowTimer = Math.max(oponente.slowTimer, dur)
    }
    return true;
  }

  actualizar(oponente, permitirControl) {
    if (this.estado !== 'attacking') this.facing = oponente.x > this.x ? 1 : -1;

    // Phoenix regen base
    if (this.def.id === 'phoenix' && this.salud > 0 && this.salud < this.maxHealth) {
      this.healAccum += 0.06;
      if (this.healAccum >= 1) {
        this.salud = Math.min(this.maxHealth, this.salud + 1);
        this.healAccum -= 1;
      }
    }
    // Regeneración por mejoras
    if (this.bonuses && this.bonuses.regeneracion > 0 && this.salud > 0 && this.salud < this.maxHealth) {
      this.regenAccum += this.bonuses.regeneracion / 60;
      if (this.regenAccum >= 1) {
        this.salud = Math.min(this.maxHealth, this.salud + Math.floor(this.regenAccum));
        this.regenAccum -= Math.floor(this.regenAccum);
      }
    }

    // NUEVO: sangrado (DoT aplicado por el atacante)
    if (this.sangradoTimer > 0) {
      this.sangradoTimer--;
      this.sangradoAcum += this.sangradoAplica / 60;
      if (this.sangradoAcum >= 1) {
        const tick = Math.floor(this.sangradoAcum);
        this.salud -= tick;
        if (this.salud < 0) this.salud = 0;
        this.sangradoAcum -= tick;
        spawnDamageNumber(this.x + (Math.random() - 0.5) * 20, this.y - 80, '-' + tick, '#ef4444');
        spawnParticles(this.x, this.y - 40, 2, '#dc2626', 2, 0.3);
      }
    }

    // NUEVO: clon (mejora épica de Shadow)
       if (this.clonTimer > 0) {
      this.clonTimer--;
      if (this.clonTimer === 20 && oponente) {
        const numClones = this.clonesActivos || 1;
        const dañoTotal = 10 * numClones;
        oponente.recibirDaño(dañoTotal, this, 'clon');
        spawnParticles(oponente.x, oponente.y - 50, 15 + numClones * 5, this.color, 8);
        spawnRing(oponente.x, oponente.y - 50, this.accent, 80);
        spawnDamageNumber(oponente.x, oponente.y - 100, '×' + numClones, this.accent, true);
      }
    }
    
    if (this.slowTimer > 0) this.slowTimer--;
    if (this.superArmorFrames > 0) this.superArmorFrames--;
    if (this.dashTimer > 0) this.dashTimer--;
    if (this.enSuelo) this.saltosUsados = 0;

    let mover = 0, saltar = false, agacharse = false, bloquear = false, atacar = null;

    if (this.esIA) {
      const ia = this.decidirIA(oponente);
      mover = ia.move; saltar = ia.jump; agacharse = ia.crouch;
      bloquear = ia.block; atacar = ia.move_name;
    } else if (permitirControl) {
      if (this.puedeActuar()) {
        if (keys['a']) mover -= 1;
        if (keys['d']) mover += 1;
              if (consumePress('a')) {
          const now = performance.now();
          if (now - this.lastATap < 260) {
            this.dashDir = -1;
            this.dashTimer = 12;
            if (this.bonuses && this.bonuses.dashInvuln > 0) {
              const extra = (this.bonuses.dashInvuln - 1) * 8 + (this.bonuses.dashInvulnExtra || 0);
              this.invulnerable = Math.max(this.invulnerable, 10 + extra);
            }
            SFX.dash();
            spawnParticles(this.x, this.y - 30, 8, this.color, 4, 0.1);
          }
          this.lastATap = now;
        }
        if (consumePress('d')) {
          const now = performance.now();
          if (now - this.lastDTap < 260) {
            this.dashDir = 1;
            this.dashTimer = 12;
            if (this.bonuses && this.bonuses.dashInvuln > 0) {
              const extra = (this.bonuses.dashInvuln - 1) * 8 + (this.bonuses.dashInvulnExtra || 0);
              this.invulnerable = Math.max(this.invulnerable, 10 + extra);
            }
            SFX.dash();
            spawnParticles(this.x, this.y - 30, 8, this.color, 4, 0.1);
          }
          this.lastDTap = now;
        }
        saltar = consumePress('w');
        agacharse = keys['s'];
        bloquear = keys['l'];
        if (consumePress('i') && this.meter >= 100) atacar = 'special';
        else if (consumePress('u')) atacar = agacharse ? 'sweep' : 'uppercut';
        else if (consumePress('k')) atacar = agacharse ? 'sweep' : (this.enSuelo ? 'kick' : 'jumpAttack');
        else if (consumePress('j')) atacar = agacharse ? 'lowPunch' : (this.enSuelo ? 'punch' : 'jumpAttack');
      } else {
        consumePress('j'); consumePress('k'); consumePress('u'); consumePress('i');
      }
    }

    if (this.estado === 'hit') {
      mover = 0; saltar = false; agacharse = false; bloquear = false; atacar = null;
    }

    this.crouching = agacharse && this.enSuelo;
    this.blocking = bloquear && this.enSuelo && !this.crouching;

    let spd = this.def.speed;
    if (this.slowTimer > 0) spd *= 0.55;
    if (this.def.id === 'shadow' && mover !== 0 && mover * this.facing < 0) spd *= 1.3;
    // NUEVO: velocidad en combos (Blaze épica)
    if (this.bonuses && this.bonuses.velocidadComboPct > 0 && this.combo >= 3) {
      spd *= (1 + this.bonuses.velocidadComboPct);
    }

    if (this.dashTimer > 0) {
      const mult = 1 + ((this.bonuses && this.bonuses.dashPct) || 0);
      this.vx = this.dashDir * 14 * mult;
      if (this.dashTimer % 2 === 0) {
        spawnParticles(this.x, this.y - 40, 2, this.color, 2, 0.05);
      }
      // NUEVO: daño del dash
      if (this.bonuses && this.bonuses.dashDaño > 0 && oponente && !this.yaGolpeoDash) {
        const dist = Math.abs(this.x - oponente.x);
        if (dist < 40 && oponente.invulnerable === 0) {
          oponente.recibirDaño(this.bonuses.dashDaño, this, 'dash');
          this.yaGolpeoDash = true;
          spawnParticles(oponente.x, oponente.y - 45, 12, this.color, 6);
          spawnRing(oponente.x, oponente.y - 45, this.accent, 60);
        }
      }
      if (this.dashTimer === 0) this.yaGolpeoDash = false;
    } else {
      let targetVx = mover * spd;
      if (this.crouching) targetVx = 0;
      if (this.blocking) targetVx *= 0.3;
      this.vx = targetVx;
    }

    this.vy += GRAVITY;
    this.y += this.vy;
    if (this.y >= GROUND) {
      if (!this.enSuelo) spawnParticles(this.x, GROUND, 4, '#888', 3, 0.4);
      this.y = GROUND; this.vy = 0; this.enSuelo = true;
    }

    if (saltar) {
      const saltosPermitidos = 1 + ((this.bonuses && this.bonuses.saltosExtra) || 0);
      const esBlazeExtra = (this.def.id === 'blaze' && this.doubleJumpUsed === false);
      if (this.enSuelo && !this.crouching) {
        this.vy = this.def.jumpPower;
        this.enSuelo = false;
        this.saltosUsados = 1;
        SFX.jump();
        spawnParticles(this.x, GROUND, 5, 'rgba(200,200,200,0.6)', 4, 0.5);
      } else if (this.saltosUsados < saltosPermitidos || esBlazeExtra) {
        this.vy = this.def.jumpPower * 0.92;
        this.saltosUsados++;
        if (this.def.id === 'blaze') this.doubleJumpUsed = true;
        SFX.jump();
        spawnParticles(this.x, this.y, 12, this.color, 6, 0.1);
        spawnRing(this.x, this.y - 20, this.color, 50);
      }
    }

    this.x += this.vx;
    if (this.x < WALL_PAD) this.x = WALL_PAD;
    if (this.x > W - WALL_PAD) this.x = W - WALL_PAD;

    if (atacar && this.puedeActuar()) {
      if (!this.enSuelo && atacar !== 'special' && atacar !== 'jumpAttack') atacar = 'jumpAttack';
      this.iniciarMovimiento(atacar, oponente);
    }

    if (this.estado === 'attacking' && this.moveActual) {
      this.moveActual.frame++;
      const mv = this.moveActual.data;
      const f = this.moveActual.frame;
      if (f <= mv.startup) this.moveFase = 'startup';
      else if (f <= mv.startup + mv.active) {
        this.moveFase = 'active';

        if (mv.special && this.def.id === 'frost' && f === mv.startup && !this.yaGolpeo) {
          this.yaGolpeo = true;
          const p = this.def.special;
          projectiles.push({
            x: this.x + this.facing * 40, y: this.y - 50,
            vx: this.facing * 11, vy: 0,
            damage: p.damage, owner: this, life: 90, slow: p.slow,
            color: this.color, accent: this.accent
          });
        }
        if (mv.special && this.def.id === 'bolt' && f === mv.startup + 2 && !this.yaGolpeo) {
          this.yaGolpeo = true;
          const p = this.def.special;
          if (Math.abs(oponente.x - this.x) < 500) {
            oponente.recibirDaño(p.damage, this, 'special');
            spawnLightning(oponente.x, oponente.y - 50, this.color);
            spawnParticles(oponente.x, oponente.y - 50, 30, this.color, 14);
            spawnRing(oponente.x, oponente.y - 50, this.color, 120);
            shake(15);
            if (p.launch) { oponente.vy = -9; oponente.enSuelo = false; }
          }
        }
        if (!mv.skipMelee && !this.yaGolpeo) {
          this.intentarGolpe(oponente, mv, this.moveActual.name);
        }
      } else this.moveFase = 'recovery';

      if (f >= mv.startup + mv.active + mv.recovery) {
        this.estado = 'idle'; this.moveActual = null; this.moveFase = null;
      }
    }

    if (this.invulnerable > 0) this.invulnerable--;
    if (this.hitFlash > 0) this.hitFlash--;
    if (this.comboTimer > 0) { this.comboTimer--; if (this.comboTimer === 0) this.combo = 0; }

    if (Math.abs(this.vx) > 0.5 && this.enSuelo) this.walkCycle += 0.22;
    else if (this.estado === 'idle') this.walkCycle += 0.05;

    if (this.estado === 'idle' || this.estado === 'walk' || this.estado === 'crouch' ||
        this.estado === 'block' || this.estado === 'jump') {
      if (!this.enSuelo) this.estado = 'jump';
      else if (this.crouching) this.estado = 'crouch';
      else if (this.blocking) this.estado = 'block';
      else if (Math.abs(this.vx) > 0.5) this.estado = 'walk';
      else this.estado = 'idle';
    }
    if (this.estado === 'hit') {
      this.estadoTimer--;
      if (this.estadoTimer <= 0) this.estado = 'idle';
    }

    if (this.saludGhost > this.salud)
      this.saludGhost -= Math.max(0.4, (this.saludGhost - this.salud) * 0.06);
    else this.saludGhost = this.salud;
  }
  
  intentarGolpe(oponente, mv, nombre) {
    const dist = Math.abs(this.x - oponente.x);
    const enFrente = (oponente.x - this.x) * this.facing > 0;
    const yDiff = Math.abs(this.y - oponente.y);
    if (yDiff > 70 && !mv.jumpHit && !mv.special) return;
    if (dist > mv.range + 15 || !enFrente) return;
    if (oponente.crouching && !mv.crouchHit && !mv.special) return;
    if (!oponente.enSuelo && !mv.jumpHit && !mv.special) return;

    this.yaGolpeo = true;
    let daño = mv.damage * this.def.dmgMult;

    // Bonuses de tipo de ataque
    if (this.bonuses) {
      if (nombre === 'punch' || nombre === 'lowPunch') daño *= (1 + this.bonuses.punchPct);
      if (nombre === 'kick' || nombre === 'sweep') daño *= (1 + this.bonuses.kickPct);
      if (nombre === 'uppercut') daño *= (1 + this.bonuses.uppercutPct);
      if (this.bonuses.comboMasterPct > 0) {
        const bonus = Math.min(0.5, this.combo * this.bonuses.comboMasterPct);
        daño *= (1 + bonus);
      }
      // NUEVO: furia baja vida (Phoenix épica)
      if (this.bonuses.furiaBajaVida > 0 && (this.salud / this.maxHealth) < 0.30) {
        daño *= (1 + this.bonuses.furiaBajaVida);
      }
      // NUEVO: daño a ralentizados (Frost)
      if (this.bonuses.dañoASlow > 0 && oponente.slowTimer > 0) {
        daño *= (1 + this.bonuses.dañoASlow);
      }
    }

    if (mv.special) daño *= 1.2;
    if (this.esIA) daño *= AIS[dificultad].dmgMult;
    daño = Math.round(daño);

    // Crítico
    let esCritico = false;
    if (this.bonuses && this.bonuses.critChance > 0) {
      if (Math.random() < this.bonuses.critChance) {
        daño *= 2;
        esCritico = true;
      }
    }
    // NUEVO: crítico garantizado en combos altos
       if (this.bonuses && this.bonuses.critGarantizadoCombo > 0) {
      const umbral = Math.max(2, 6 - this.bonuses.critGarantizadoCombo);
      if (this.combo >= umbral && !esCritico) {
        daño *= 2; esCritico = true;
      }
    }

    // Bloqueo
    if (oponente.blocking && ((this.x - oponente.x) * oponente.facing > 0)) {
      let reduccionBloqueo = 0.18;
      if (oponente.bonuses && oponente.bonuses.bloqueoExtraPct > 0) {
        reduccionBloqueo += oponente.bonuses.bloqueoExtraPct;
      }
      const reducido = Math.max(1, Math.round(daño * (1 - reduccionBloqueo) * 0.3));
      oponente.salud -= reducido;
      oponente.invulnerable = 8;
      // NUEVO: reflejo (mejora épica + Rocky)
      if (oponente.bonuses && oponente.bonuses.reflejoPct > 0) {
        const reflejado = Math.round(reducido * oponente.bonuses.reflejoPct);
        if (reflejado > 0) {
          this.salud -= reflejado;
          if (this.salud < 0) this.salud = 0;
          spawnDamageNumber(this.x, this.y - 100, '-' + reflejado, '#38bdf8');
          spawnParticles(this.x, this.y - 50, 8, '#38bdf8', 5);
        }
      }
      this.meter = Math.min(100, this.meter + mv.meterGain * 0.5 * (1 + (this.bonuses ? this.bonuses.medidorPct : 0)));
      oponente.meter = Math.min(100, oponente.meter + 4);
      const hx = (this.x + oponente.x) / 2, hy = oponente.y - 55;
      spawnParticles(hx, hy, 8, '#93c5fd', 4, 0.3);
      spawnRing(hx, hy, '#93c5fd', 35);
      spawnDamageNumber(hx, hy - 20, 'BLOQ', '#93c5fd');
      SFX.block(); shake(2);
      return;
    }

    // Reducciones
    let dmgFinal = daño;
    if (oponente.def.id === 'rocky') dmgFinal = Math.round(dmgFinal * 0.85);
    if (oponente.def.id === 'titan') dmgFinal = Math.round(dmgFinal * 0.75);
    if (oponente.bonuses && oponente.bonuses.defensaPct > 0) {
      dmgFinal = Math.round(dmgFinal * (1 - oponente.bonuses.defensaPct));
    }

    oponente.salud -= dmgFinal;
    if (oponente.salud < 0) oponente.salud = 0;

    // Vampirismo
    if (this.bonuses && this.bonuses.vampirismo > 0 && this.salud > 0) {
      const curacion = Math.max(1, Math.round(dmgFinal * this.bonuses.vampirismo));
      this.salud = Math.min(this.maxHealth, this.salud + curacion);
      spawnDamageNumber(this.x, this.y - 110, '+' + curacion, '#4ade80', false);
    }

    // Super armor (frames)
    const hasArmor = oponente.superArmorFrames > 0;
    // NUEVO: super armor leve (Titan rara) - solo interrumpen ataques fuertes
    const umbralArmor = (oponente.bonuses && oponente.bonuses.superArmorLeve > 0)
      ? (8 + (oponente.bonuses.superArmorLeve - 1) * 3)
      : 8;
    const esAtaqueFuerte = dmgFinal >= umbralArmor || mv.special || mv.launch;
    const hasSuperArmorLeve = oponente.bonuses && oponente.bonuses.superArmorLeve > 0 && !esAtaqueFuerte;
    if (!hasArmor && !hasSuperArmorLeve) {
      oponente.invulnerable = 16;
      oponente.hitFlash = 10;
      oponente.estado = 'hit';
      oponente.estadoTimer = 14;
      if (oponente.def.id !== 'titan' || !oponente.enSuelo) {
        oponente.x += this.facing * mv.kb;
        if (oponente.x < WALL_PAD) oponente.x = WALL_PAD;
        if (oponente.x > W - WALL_PAD) oponente.x = W - WALL_PAD;
      }
      if (mv.launch) {
        oponente.vy = -8; oponente.enSuelo = false;
        oponente.estado = 'hit'; oponente.estadoTimer = 30;
      }
    } else {
      oponente.invulnerable = 6;
      oponente.hitFlash = 5;
    }

    const medidorMult = 1 + (this.bonuses ? this.bonuses.medidorPct : 0);
    this.meter = Math.min(100, this.meter + mv.meterGain * medidorMult);
    oponente.meter = Math.min(100, oponente.meter + mv.meterGain * 0.6);
    this.combo++; this.comboTimer = 90;

    // Frost ralentiza
    if (this.def.id === 'frost' && !mv.special) {
      let durSlow = 120;
      if (this.bonuses && this.bonuses.slowPct > 0) durSlow *= (1 + this.bonuses.slowPct);
      oponente.slowTimer = Math.max(oponente.slowTimer, durSlow);
      spawnParticles(oponente.x, oponente.y - 30, 8, '#a5f3fc', 5);
    }
    if (mv.special && this.def.id === 'frost') {
      oponente.slowTimer = Math.max(oponente.slowTimer, 200);
    }

    // NUEVO: sangrado (aplica DoT al rival)
    if (this.bonuses && this.bonuses.sangradoPct > 0) {
      oponente.sangradoTimer = 180; // 3 segundos
      oponente.sangradoAplica = Math.max(oponente.sangradoAplica, this.bonuses.sangradoPct);
    }

    // Bolt rayo extra (con frecuencia variable)
    if (this.def.id === 'bolt') {
      const freq = (this.bonuses && this.bonuses.rayoFrecuencia) ? this.bonuses.rayoFrecuencia : 4;
      this.hitCount++;
      if (this.hitCount >= freq) {
        this.hitCount = 0;
        oponente.salud -= 5;
        if (oponente.salud < 0) oponente.salud = 0;
        spawnLightning(oponente.x, oponente.y - 50, this.color);
        spawnParticles(oponente.x, oponente.y - 50, 15, this.color, 8);
        spawnDamageNumber(oponente.x, oponente.y - 100, '⚡5', this.color, true);
        SFX.hit();
      }
    }

    const hx = (this.x + oponente.x) / 2, hy = oponente.y - 55;
    spawnParticles(hx, hy, mv.special ? 30 : 14, this.accent, mv.special ? 12 : 7);
    spawnParticles(hx, hy, 6, '#fff', 5, 0.4);
    spawnRing(hx, hy, this.accent, mv.special ? 110 : 60);
    const colorDmg = esCritico ? '#ef4444' : (mv.special ? '#fbbf24' : '#fff');
    spawnDamageNumber(hx, hy - 15, (esCritico ? '¡' : '-') + dmgFinal + (esCritico ? '!' : ''), colorDmg, esCritico || dmgFinal >= 12);
    shake(esCritico ? 14 : (mv.special ? 18 : (dmgFinal >= 12 ? 9 : 5)));
    SFX.hit();
  }

  recibirDaño(daño, atacante, tipo) {
    if (this.blocking && atacante && ((atacante.x - this.x) * this.facing < 0)) {
      let reduccion = 0.15;
      if (this.bonuses && this.bonuses.bloqueoExtraPct > 0) reduccion += this.bonuses.bloqueoExtraPct;
      const reducido = Math.max(1, Math.round(daño * (1 - reduccion) * 0.3));
      this.salud -= reducido;
      this.invulnerable = 12;
      // Reflejo
      if (this.bonuses && this.bonuses.reflejoPct > 0 && atacante) {
        const reflejado = Math.round(reducido * this.bonuses.reflejoPct);
        if (reflejado > 0) {
          atacante.salud -= reflejado;
          if (atacante.salud < 0) atacante.salud = 0;
          spawnDamageNumber(atacante.x, atacante.y - 100, '-' + reflejado, '#38bdf8');
          spawnParticles(atacante.x, atacante.y - 50, 8, '#38bdf8', 5);
        }
      }
      spawnParticles(this.x + this.facing * 20, this.y - 50, 8, '#93c5fd', 4);
      SFX.block();
      spawnDamageNumber(this.x, this.y - 90, 'Bloqueado', '#93c5fd');
      shake(2);
      return;
    }

    let dañoFinal = daño;
    if (this.bonuses && this.bonuses.defensaPct > 0) {
      dañoFinal = Math.round(dañoFinal * (1 - this.bonuses.defensaPct));
    }

    // NUEVO: super armor leve (los ataques débiles no interrumpen)
       const umbralArmor = (this.bonuses && this.bonuses.superArmorLeve > 0)
      ? (8 + (this.bonuses.superArmorLeve - 1) * 3)
      : 8;
    const esAtaqueFuerte = dañoFinal >= umbralArmor;
    const tieneSuperArmorLeve = this.bonuses && this.bonuses.superArmorLeve > 0 && !esAtaqueFuerte;

    this.salud -= dañoFinal;
    if (this.salud < 0) this.salud = 0;
    this.hitFlash = 10;

    if (!tieneSuperArmorLeve) {
      this.invulnerable = 18;
      this.estado = 'hit';
      this.estadoTimer = 14;
      this.combo = 0;
    }

    const hx = this.x + (atacante ? Math.sign(this.x - atacante.x) * 15 : 0);
    const hy = this.y - 55;
    spawnParticles(hx, hy, 14, this.accent, 7);
    spawnParticles(hx, hy, 6, '#fff', 5);
    spawnDamageNumber(hx, hy - 10, '-' + dañoFinal, '#fbbf24', dañoFinal >= 12);
    shake(dañoFinal >= 12 ? 8 : 5);
    SFX.hit();

    if (atacante) {
      atacante.combo++;
      atacante.comboTimer = 90;
    }
  }

  decidirIA(oponente) {
    const cfg = AIS[dificultad];
    const pers = this.def.personality || 'balanced';
    const dist = Math.abs(oponente.x - this.x);
    const dir = Math.sign(oponente.x - this.x);
    const playerVelX = oponente.x - this.aiLastPlayerX;
    this.aiLastPlayerX = oponente.x;
    this.aiPlayerVelX = this.aiPlayerVelX * 0.7 + playerVelX * 0.3;
    const predictedX = oponente.x + this.aiPlayerVelX * (cfg.prediction * 8);
    const distPred = Math.abs(predictedX - this.x);
    const oppAttacking = oponente.estado === 'attacking' && oponente.moveFase === 'startup';
    const oppInAir = !oponente.enSuelo;

    let aggressionMod = 1, blockMod = 1, keepDist = 0;
    if (pers === 'rushdown') { aggressionMod = 1.3; blockMod = 0.6; }
    if (pers === 'defensive') { aggressionMod = 0.7; blockMod = 1.4; }
    if (pers === 'zoner') { aggressionMod = 0.6; keepDist = 140; }
    if (pers === 'trickster') { aggressionMod = 1.1; }
    if (pers === 'technical') { aggressionMod = 1.0; blockMod = 1.1; }

    this.aiDecisionTimer--;
    if (this.aiDecisionTimer <= 0) {
      this.aiDecisionTimer = cfg.reaction + Math.random() * 8;
      const saludBaja = this.salud < this.maxHealth * 0.3;
      const meterFull = this.meter >= 100;

      if (pers === 'zoner' && dist < keepDist && !meterFull) {
        if (Math.random() < 0.6) {
          this.aiAction = {move:-dir, jump:false, crouch:false, block:false, move_name:null};
          return this.aiAction;
        }
      }
      if (meterFull && Math.random() < cfg.specialUse) {
        if (this.def.id === 'bolt' || this.def.id === 'frost' || dist < 120) {
          this.aiAction = {move:dir, jump:false, crouch:false, block:false, move_name:'special'};
          return this.aiAction;
        }
      }
      if (oppAttacking && dist < 100 && Math.random() < Math.min(0.95, cfg.blockChance * blockMod)) {
        this.aiAction = {move:0, jump:false, crouch:false, block:true, move_name:null};
        return this.aiAction;
      }
      if (oppAttacking && oponente.moveActual && oponente.moveActual.data.low &&
          Math.random() < cfg.dodgeChance && this.enSuelo) {
        this.aiAction = {move:0, jump:true, crouch:false, block:false, move_name:null};
        return this.aiAction;
      }
      if (oppInAir && dist < 90 && Math.random() < 0.5) {
        this.aiAction = {move:0, jump:false, crouch:false, block:false, move_name:'uppercut'};
        return this.aiAction;
      }

      const aggr = Math.min(1, cfg.aggression * aggressionMod);

      if (distPred < 55) {
        const r = Math.random();
        if (saludBaja && r < 0.35) {
          this.aiAction = {move:-dir, jump:false, crouch:false, block:false, move_name:null};
        } else if (r < aggr) {
          const moves = (pers === 'rushdown') ? ['punch','punch','kick','uppercut'] :
                        (pers === 'defensive') ? ['punch','kick','uppercut'] :
                        ['punch','punch','uppercut','kick'];
          const m = moves[Math.floor(Math.random() * moves.length)];
          this.aiAction = {move:0, jump:false, crouch:false, block:false, move_name:m};
        } else {
          this.aiAction = {move:0, jump:false, crouch:false, block:false, move_name:null};
        }
      } else if (distPred < 90) {
        if (Math.random() < aggr * 0.9) {
          const moves = (pers === 'rushdown') ? ['kick','kick','sweep','uppercut'] :
                        (pers === 'technical') ? ['kick','sweep','uppercut','kick'] :
                        ['kick','kick','punch','uppercut','sweep'];
          const m = moves[Math.floor(Math.random() * moves.length)];
          this.aiAction = {move:dir, jump:false, crouch:false, block:false, move_name:m};
        } else {
          this.aiAction = {move:dir, jump:false, crouch:false, block:false, move_name:null};
        }
      } else {
        const r = Math.random();
        if (r < 0.15 && this.enSuelo && dist > 180) {
          this.aiAction = {move:dir, jump:true, crouch:false, block:false, move_name:null};
        } else {
          this.aiAction = {move:dir, jump:false, crouch:false, block:false, move_name:null};
        }
      }
    }

    let move = this.aiAction.move;
    if (move !== 0) move *= cfg.speedMult;
    return {
      move: move,
      jump: this.aiAction.jump && this.aiDecisionTimer === cfg.reaction + 7,
      crouch: this.aiAction.crouch,
      block: this.aiAction.block,
      move_name: this.aiAction.move_name
    };
  }

  dibujar(t) {
    // Clon (mejora épica de Shadow)
       if (this.clonTimer > 0) {
      const numClones = this.clonesActivos || 1;
      for (let ci = 0; ci < numClones; ci++) {
        const offsetX = (ci + 1) * 35 * -this.facing;
        ctx.save();
        ctx.globalAlpha = this.clonTimer / 40 * 0.6;
        ctx.translate(this.x + offsetX, this.y);
        ctx.scale(this.facing, 1);
        ctx.shadowColor = this.accent;
        ctx.shadowBlur = 20;
        ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(0, -78, 11, 0, Math.PI*2); ctx.fill();
        ctx.fillRect(-3, -68, 6, 38);
        ctx.fillRect(-15, -60, 12, 5);
        ctx.fillRect(3, -60, 12, 5);
        ctx.fillRect(-12, -30, 8, 30);
        ctx.fillRect(4, -30, 8, 30);
        ctx.restore();
      }
    }

    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#000';
    const sScale = this.enSuelo ? 1 : Math.max(0.3, 1 - (GROUND - this.y) / 200);
    ctx.beginPath(); ctx.ellipse(0, 0, 24*sScale, 6*sScale, 0, 0, Math.PI*2); ctx.fill();
    ctx.restore();

    ctx.scale(this.facing, 1);
    const flash = this.hitFlash > 0;
    const invulnBlink = this.invulnerable > 0 && Math.floor(this.invulnerable/3)%2 === 0;
    const bodyColor = flash ? '#fff' : (invulnBlink ? 'rgba(255,255,255,0.6)' : this.color);
    const accentColor = flash ? '#fff' : this.accent;
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = flash ? 25 : (this.meter >= 100 ? 20 + Math.sin(t*0.15)*8 : 8);

    const crouchOffset = (this.crouching || this.estado === 'crouch') ? 15 : 0;
    const headBob = Math.sin(t*0.08) * 1.2;

    let legFront = 0, legBack = 0, armFront = 0, armBack = 0;
    if (this.estado === 'walk') {
      legFront = Math.sin(this.walkCycle) * 13;
      legBack = -Math.sin(this.walkCycle) * 13;
      armFront = -Math.sin(this.walkCycle) * 10;
      armBack = Math.sin(this.walkCycle) * 10;
    } else if (this.estado === 'idle') {
      legFront = Math.sin(t*0.06) * 1.5;
      legBack = -Math.sin(t*0.06) * 1.5;
      armFront = Math.sin(t*0.06) * 2;
      armBack = -Math.sin(t*0.06) * 2;
    } else if (this.estado === 'jump') {
      legFront = -8; legBack = 8; armFront = 10; armBack = -10;
    }

    let moveType = null;
    if (this.estado === 'attacking' && this.moveActual) moveType = this.moveActual.name;

    let upperExtend = 0;
    if (moveType === 'uppercut')
      upperExtend = Math.min(1, this.moveActual.frame / (this.moveActual.data.startup + 4));

    let punchExtend = 0;
    if (moveType === 'punch' || moveType === 'lowPunch') {
      const f = this.moveActual.frame, st = this.moveActual.data.startup, ac = this.moveActual.data.active;
      if (f > st && f <= st + ac) punchExtend = 1;
      else if (f > st + ac) punchExtend = Math.max(0, 1 - (f - st - ac) / this.moveActual.data.recovery);
    }
    let kickExtend = 0;
    if (moveType === 'kick' || moveType === 'sweep') {
      const f = this.moveActual.frame, st = this.moveActual.data.startup, ac = this.moveActual.data.active;
      if (f > st && f <= st + ac) kickExtend = 1;
      else if (f > st + ac) kickExtend = Math.max(0, 1 - (f - st - ac) / this.moveActual.data.recovery);
    }
    let specialGlow = moveType === 'special' ? 1 : 0;

    const headY = -78 + headBob + crouchOffset;
    ctx.beginPath(); ctx.arc(0, headY, 11, 0, Math.PI*2);
    ctx.fillStyle = bodyColor; ctx.fill();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(3, headY-2, 1.8, 0, Math.PI*2);
    ctx.arc(6, headY-2, 1.8, 0, Math.PI*2);
    ctx.fill();

    ctx.lineCap = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(0, -68 + headBob + crouchOffset);
    ctx.lineTo(0, -30 + crouchOffset);
    ctx.stroke();

    ctx.strokeStyle = accentColor; ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, -60 + crouchOffset);
    ctx.quadraticCurveTo(-10 + armBack*0.4, -45 + crouchOffset, -12 + armBack, -30 + crouchOffset);
    ctx.stroke();

    ctx.strokeStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(0, -60 + crouchOffset);
    if (this.estado === 'block') {
      ctx.quadraticCurveTo(14, -55 + crouchOffset, 12, -40 + crouchOffset);
    } else if (moveType === 'uppercut') {
      const ang = -0.5 - upperExtend * 1.5;
      const hx = Math.cos(ang)*30, hy = Math.sin(ang)*30;
      ctx.quadraticCurveTo(hx*0.4, -45 + crouchOffset + hy*0.3, hx, -55 + crouchOffset + hy);
    } else if (punchExtend > 0) {
      const ext = punchExtend * 30;
      ctx.quadraticCurveTo(10 + ext*0.5, -50 + crouchOffset, 15 + ext, -45 + crouchOffset);
    } else {
      ctx.quadraticCurveTo(10 + armFront*0.5, -48 + crouchOffset, 15 + armFront, -38 + crouchOffset);
    }
    ctx.stroke();

    if (moveType === 'uppercut') {
      const ang = -0.5 - upperExtend * 1.5;
      const hx = Math.cos(ang)*30, hy = Math.sin(ang)*30;
      ctx.beginPath(); ctx.arc(hx, -55 + crouchOffset + hy, 6 + upperExtend*2, 0, Math.PI*2);
      ctx.fillStyle = upperExtend > 0.5 ? '#fbbf24' : accentColor; ctx.fill();
    } else if (punchExtend > 0) {
      const ext = punchExtend * 30;
      ctx.beginPath(); ctx.arc(15 + ext, -45 + crouchOffset, 5 + punchExtend*2, 0, Math.PI*2);
      ctx.fillStyle = accentColor; ctx.fill();
    }

    ctx.strokeStyle = accentColor;
    ctx.beginPath();
    ctx.moveTo(0, -30 + crouchOffset);
    if (this.estado === 'crouch') {
      ctx.quadraticCurveTo(-10, -15 + crouchOffset, -15, 0);
    } else {
      ctx.quadraticCurveTo(-4 + legBack*0.4, -15 + crouchOffset/2, -6 + legBack, 0);
    }
    ctx.stroke();

    ctx.strokeStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(0, -30 + crouchOffset);
    if (moveType === 'kick' || moveType === 'sweep') {
      const isLow = moveType === 'sweep';
      const ext = kickExtend * (isLow ? 35 : 40);
      const ey = isLow ? -8 : -25;
      ctx.quadraticCurveTo(15 + ext*0.4, isLow ? -20 : -30, 18 + ext, ey);
    } else if (this.estado === 'crouch') {
      ctx.quadraticCurveTo(10, -15 + crouchOffset, 15, 0);
    } else if (this.estado === 'jump') {
      ctx.quadraticCurveTo(15, -15, 22, -5);
    } else {
      ctx.quadraticCurveTo(4 + legFront*0.4, -15, 6 + legFront, 0);
    }
    ctx.stroke();

    if (kickExtend > 0) {
      const isLow = moveType === 'sweep';
      const ext = kickExtend * (isLow ? 35 : 40);
      const ey = isLow ? -8 : -25;
      ctx.beginPath(); ctx.arc(18 + ext, ey, 5 + kickExtend*2, 0, Math.PI*2);
      ctx.fillStyle = accentColor; ctx.fill();
    }

    if (specialGlow > 0) {
      const g = 0.5 + Math.sin(t*0.4)*0.5;
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = this.color; ctx.lineWidth = 2;
      ctx.shadowColor = this.color; ctx.shadowBlur = 25;
      ctx.beginPath(); ctx.arc(0, -45 + crouchOffset, 45 + g*8, 0, Math.PI*2); ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.restore();

    if (this.blocking) {
      ctx.save();
      ctx.globalAlpha = 0.65;
      ctx.strokeStyle = '#93c5fd'; ctx.lineWidth = 3;
      ctx.shadowColor = '#93c5fd'; ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.arc(this.x, this.y-45, 48, -Math.PI/2.3, Math.PI/2.3); ctx.stroke();
      ctx.restore();
    }
    if (this.meter >= 100 && this.estado !== 'attacking') {
      ctx.save();
      ctx.globalAlpha = 0.4 + Math.sin(t*0.2)*0.2;
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2;
      ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 15;
      ctx.beginPath(); ctx.arc(this.x, this.y-40, 55, 0, Math.PI*2); ctx.stroke();
      ctx.restore();
    }
    if (this.slowTimer > 0) {
      ctx.save();
      ctx.globalAlpha = 0.35 + Math.sin(t*0.15)*0.15;
      ctx.strokeStyle = '#a5f3fc'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(this.x, this.y-45, 38, 0, Math.PI*2); ctx.stroke();
      ctx.restore();
    }
    // Sangrado visual
    if (this.sangradoTimer > 0) {
      ctx.save();
      ctx.globalAlpha = 0.4 + Math.sin(t*0.3)*0.2;
      ctx.fillStyle = '#dc2626';
      for (let i = 0; i < 3; i++) {
        const dx = Math.sin(t * 0.1 + i) * 15;
        const dy = ((t * 2 + i * 30) % 40) - 20;
        ctx.fillRect(this.x + dx, this.y - 30 + dy, 2, 3);
      }
      ctx.restore();
    }
    if (this.combo >= 2) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = '900 22px Segoe UI, sans-serif';
      ctx.fillStyle = '#fbbf24';
      ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
      const txt = this.combo + ' HITS!';
      const yPos = this.y - 130 + Math.sin(t*0.3)*3;
      ctx.strokeText(txt, this.x, yPos);
      ctx.fillText(txt, this.x, yPos);
      ctx.restore();
    }
  }
}
