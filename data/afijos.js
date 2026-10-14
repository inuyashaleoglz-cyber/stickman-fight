window.AFIJOS = [
  { id:'blindado', nombre:'BLINDADO', icono:'🛡️', color:'#9de6ff',
    descripcion:'-25% daño recibido',
    tipo:'estatico',
    aplicarEstatico: function(def){ def.__afijoBlindado = true; } },

  { id:'berserker', nombre:'BERSERKER', icono:'🔥', color:'#ff9ecd',
    descripcion:'+30% daño, -20% defensa',
    tipo:'estatico',
    aplicarEstatico: function(def){
      def.dmgMult *= 1.30;
      def.__afijoBerserker = true;
    } },

  { id:'regenerador', nombre:'REGENERADOR', icono:'💚', color:'#9dffd4',
    descripcion:'+2 vida/segundo',
    tipo:'dinamico' },

  { id:'veloz', nombre:'VELOZ', icono:'⚡', color:'#fff7a1',
    descripcion:'+25% velocidad y ataque',
    tipo:'estatico',
    aplicarEstatico: function(def){ def.speed *= 1.25; } },

  { id:'vampirico', nombre:'VAMPÍRICO', icono:'🩸', color:'#ef4444',
    descripcion:'Se cura 15% del daño infligido',
    tipo:'dinamico' },

  { id:'reflejo', nombre:'REFLEJO', icono:'🪞', color:'#9de6ff',
    descripcion:'Devuelve 20% del daño recibido',
    tipo:'dinamico' },

  { id:'congelante', nombre:'CONGELANTE', icono:'🧊', color:'#67e8f9',
    descripcion:'Sus golpes ralentizan 1s',
    tipo:'dinamico' },

  { id:'espectral', nombre:'ESPECTRAL', icono:'💀', color:'#d0b7ff',
    descripcion:'20% de probabilidad de esquivar',
    tipo:'dinamico' },

  { id:'preciso', nombre:'PRECISO', icono:'🎯', color:'#ffb894',
    descripcion:'+15% de crítico',
    tipo:'estatico',
    aplicarEstatico: function(def){ def.__afijoCrit = (def.__afijoCrit || 0) + 0.15; } },

  { id:'explosivo', nombre:'EXPLOSIVO', icono:'💥', color:'#ff9ecd',
    descripcion:'Al morir, explota y hace daño',
    tipo:'dinamico' },

  { id:'caotico', nombre:'CAÓTICO', icono:'🌪️', color:'#d0b7ff',
    descripcion:'Cada 10 segundos cambia de posición',
    tipo:'dinamico' },

  { id:'elite', nombre:'ÉLITE', icono:'👑', color:'#fff7a1',
    descripcion:'+50% vida, -10% velocidad',
    tipo:'estatico',
    aplicarEstatico: function(def){
      def.maxHealth = Math.round(def.maxHealth * 1.5);
      def.speed *= 0.90;
    } }
];

window.cantidadAfijosPorPiso = function(piso) {
  if (piso < 31) return 0;
  if (piso <= 60) return 1;
  if (piso <= 90) return 2;
  if (piso <= 120) return 3;
  return 4;
};

window.elegirAfijosParaPiso = function(piso) {
  const n = cantidadAfijosPorPiso(piso);
  if (n === 0) return [];
  const pool = AFIJOS.slice();
  const elegidos = [];
  for (let i = 0; i < n && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    elegidos.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return elegidos;
};
