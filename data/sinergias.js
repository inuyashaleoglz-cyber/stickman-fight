window.SINERGIAS = [
  { id:'sin_vampiro_sangre', nombre:'VAMPIRO SANGRIENTO',
    icon:'🩸', requiere:['vampirismo','sangrado'],
    desc:'Vampirismo cura el triple y el sangrado dura 6s.',
    apply: function(b){ b.vampirismo += 0.10; b.sangradoPct += 2; } },

  { id:'sin_critico_combo', nombre:'FURIA CRÍTICA',
    icon:'⚡', requiere:['critico','combo1'],
    desc:'+15% crítico y críticos garantizados desde el 5to golpe.',
    apply: function(b){ b.critChance += 0.15; b.critGarantizadoCombo += 1; } },

  { id:'sin_regen_defensa', nombre:'FORTALEZA ETERNA',
    icon:'🛡️', requiere:['regenera','defensa1'],
    desc:'+10% defensa y +1 regeneración por segundo.',
    apply: function(b){ b.defensaPct += 0.10; b.regeneracion += 1; } },

  { id:'sin_dash_sombra', nombre:'SOMBRA LETAL',
    icon:'👻', requiere:['dash1','puño1'],
    desc:'Tu dash hace daño y los puñetazos dan +20% más.',
    apply: function(b){ b.dashDaño += 6; b.punchPct += 0.20; } },

  { id:'sin_sangrado_puño', nombre:'GOLPE CRUENTO',
    icon:'🔴', requiere:['sangrado','puño1'],
    desc:'Cada puñetazo aplica sangrado que dura 2s más.',
    apply: function(b){ b.sangradoPct += 2; } },

  { id:'sin_medidor_especial', nombre:'CORAZÓN DE ACERO',
    icon:'💥', requiere:['medidor2','medidor1'],
    desc:'Empiezas cada pelea con el especial ya cargado.',
    apply: function(b){ b.medidorInicial += 0.60; } }
];
