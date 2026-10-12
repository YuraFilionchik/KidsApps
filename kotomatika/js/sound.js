// Звуки, синтезированные через Web Audio — без файлов.
'use strict';

const Sound = (() => {
  let ctx = null;
  let enabled = () => true;

  function ac() {
    if (!enabled()) return null;
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, start, dur, { type = 'sine', vol = 0.18, to = null } = {}) {
    const c = ac();
    if (!c) return;
    const t = c.currentTime + start;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  return {
    setEnabledGetter(fn) { enabled = fn; },
    click() { tone(520, 0, 0.06, { vol: 0.08 }); },
    correct() { tone(660, 0, 0.12); tone(990, 0.09, 0.2); },
    wrong() { tone(260, 0, 0.3, { type: 'triangle', to: 150 }); },
    coin() { tone(988, 0, 0.08, { type: 'square', vol: 0.07 }); tone(1319, 0.08, 0.25, { type: 'square', vol: 0.07 }); },
    hit() { tone(180, 0, 0.15, { type: 'square', vol: 0.12, to: 60 }); },
    hurt() { tone(400, 0, 0.35, { type: 'sawtooth', vol: 0.1, to: 120 }); },
    win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.3)); },
    meow() {
      const c = ac();
      if (!c) return;
      const t = c.currentTime;
      const o = c.createOscillator();
      const f = c.createBiquadFilter();
      const g = c.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(480, t);
      o.frequency.exponentialRampToValueAtTime(820, t + 0.15);
      o.frequency.exponentialRampToValueAtTime(520, t + 0.5);
      f.type = 'bandpass';
      f.frequency.setValueAtTime(1200, t);
      f.frequency.linearRampToValueAtTime(2000, t + 0.15);
      f.frequency.linearRampToValueAtTime(900, t + 0.5);
      f.Q.value = 3;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.35, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      o.connect(f).connect(g).connect(c.destination);
      o.start(t);
      o.stop(t + 0.6);
    },
  };
})();
