// Word Run: озвучка слов (speechSynthesis) и звуки на Web Audio — без файлов.
'use strict';

const WRSound = (() => {
  let ctx = null;
  let sfxOn = true;
  let voiceOn = true;
  let voice = null;

  function ac() {
    if (!sfxOn) return null;
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, start, dur, { type = 'sine', vol = 0.15, to = null } = {}) {
    const c = ac();
    if (!c) return;
    const t = c.currentTime + start;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  // Голоса подгружаются асинхронно: выбираем британский, потом американский, потом любой английский.
  function pickVoice() {
    if (!('speechSynthesis' in window)) return;
    const all = window.speechSynthesis.getVoices();
    const en = all.filter(v => /^en[-_]/i.test(v.lang) || v.lang === 'en');
    voice = en.find(v => /en[-_]GB/i.test(v.lang) && /Google|Natural|Online/i.test(v.name))
      || en.find(v => /en[-_]GB/i.test(v.lang))
      || en.find(v => /en[-_]US/i.test(v.lang))
      || en[0] || null;
  }
  if ('speechSynthesis' in window) {
    pickVoice();
    window.speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
  }

  function speak(text, rate = 0.85) {
    if (!voiceOn || !text || !('speechSynthesis' in window)) return;
    try {
      const s = window.speechSynthesis;
      s.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (!voice) pickVoice();
      if (voice) u.voice = voice;
      u.lang = voice ? voice.lang : 'en-GB';
      u.rate = rate;
      s.speak(u);
    } catch (e) { /* без озвучки игра всё равно работает */ }
  }

  const canSpeak = () => 'speechSynthesis' in window;

  return {
    setSfx(on) { sfxOn = on; },
    setVoice(on) { voiceOn = on; if (!on && canSpeak()) window.speechSynthesis.cancel(); },
    canSpeak,
    speak,
    unlock() { ac(); },
    click() { tone(620, 0, 0.05, { type: 'triangle', vol: 0.07 }); },
    swipe() { tone(420, 0, 0.09, { type: 'sine', vol: 0.06, to: 760 }); },
    coin(combo = 1) {
      const k = Math.pow(2, Math.min(combo - 1, 4) / 12);
      tone(988 * k, 0, 0.08, { type: 'square', vol: 0.07 });
      tone(1319 * k, 0.07, 0.2, { type: 'square', vol: 0.07 });
    },
    splash() {
      tone(360, 0, 0.14, { type: 'sine', vol: 0.22, to: 110 });
      tone(160, 0.11, 0.22, { type: 'triangle', vol: 0.18, to: 520 });
      tone(700, 0.3, 0.06, { type: 'sine', vol: 0.06, to: 900 });
    },
    miss() { tone(300, 0, 0.12, { type: 'triangle', vol: 0.08, to: 240 }); },
    countdown(last) { tone(last ? 880 : 520, 0, last ? 0.3 : 0.12, { type: 'triangle', vol: 0.12 }); },
    boss() {
      [196, 247, 294, 392].forEach((f, i) => tone(f, i * 0.12, 0.28, { type: 'sawtooth', vol: 0.07 }));
    },
    win() {
      [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.11, 0.32, { type: 'triangle', vol: 0.13 }));
    },
    lose() {
      [392, 330, 262].forEach((f, i) => tone(f, i * 0.16, 0.3, { type: 'triangle', vol: 0.11 }));
    },
    buy() {
      [784, 988, 1175].forEach((f, i) => tone(f, i * 0.07, 0.15, { type: 'square', vol: 0.06 }));
    }
  };
})();
