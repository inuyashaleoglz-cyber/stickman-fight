window.SCENARIOS = [
  { id:'noche',    name:'Noche Estrellada' },
  { id:'tormenta', name:'Tormenta Eléctrica' },
  { id:'volcan',   name:'Cráter Volcánico' }
];

window.AIS = {
  facil:     {name:'FÁCIL',     color:'#4ade80', reaction:26, aggression:0.35, blockChance:0.25, dodgeChance:0.15, speedMult:0.80, dmgMult:0.75, prediction:0.0, specialUse:0.3},
  normal:    {name:'NORMAL',    color:'#38bdf8', reaction:16, aggression:0.60, blockChance:0.45, dodgeChance:0.30, speedMult:0.95, dmgMult:1.00, prediction:0.2, specialUse:0.6},
  dificil:   {name:'DIFÍCIL',   color:'#fbbf24', reaction:9,  aggression:0.80, blockChance:0.65, dodgeChance:0.45, speedMult:1.10, dmgMult:1.15, prediction:0.45, specialUse:0.85},
  pesadilla: {name:'PESADILLA', color:'#ef4444', reaction:9,  aggression:0.82, blockChance:0.68, dodgeChance:0.55, speedMult:1.12, dmgMult:1.18, prediction:0.55, specialUse:0.85}
};

window.RARITY_WEIGHTS = { comun: 55, rara: 30, epica: 10, legendaria: 5 };
