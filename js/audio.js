// ============================================================
//  AUDIO SINTETIZADO (sin archivos externos)
// ============================================================
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
  }
}

function beep(f1, f2, dur, type = 'square', vol = 0.07) {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f1, audioCtx.currentTime);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), audioCtx.currentTime + dur);
  g.gain.setValueAtTime(vol, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  o.connect(g).connect(audioCtx.destination);
  o.start();
  o.stop(audioCtx.currentTime + dur);
}

const SFX = {
  punch:   () => beep(450, 180, 0.06, 'sawtooth', 0.05),
  kick:    () => beep(320, 130, 0.09, 'sawtooth', 0.07),
  upper:   () => beep(220, 500, 0.12, 'square', 0.09),
  hit:     () => beep(240, 60, 0.13, 'square', 0.10),
  block:   () => beep(1000, 500, 0.07, 'triangle', 0.07),
  special: () => beep(180, 1200, 0.4, 'sawtooth', 0.14),
  ko:      () => beep(180, 40, 0.5, 'sawtooth', 0.16),
  count:   () => beep(560, 560, 0.11, 'sine', 0.07),
  fight:   () => beep(300, 900, 0.35, 'square', 0.13),
  jump:    () => beep(600, 900, 0.06, 'sine', 0.04)
};
