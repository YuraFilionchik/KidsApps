// Звуки и фоновая музыка, синтезированные через Web Audio — без файлов.
// Всё идёт через общую цепочку: эффекты и музыка → лёгкое эхо → компрессор → динамики.
'use strict';

const Sound = (() => {
  let ctx = null;
  let bus = null;
  let sfxOn = () => true;
  let musicOn = () => true;
  let musicLevel = () => 2;
  let noiseBuf = null;

  const MUSIC_VOL = [0, 0.22, 0.38, 0.6]; // тихо / средне / громко
  const mf = m => 440 * 2 ** ((m - 69) / 12); // номер ноты MIDI → частота
  const jit = () => 1 + (Math.random() - 0.5) * 0.06; // ±3%, чтобы звук не приедался

  // ---------- Цепочка ----------

  function buildBus(c) {
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 10;
    comp.ratio.value = 4;
    comp.attack.value = 0.004;
    comp.release.value = 0.2;
    const master = c.createGain();
    master.gain.value = 0.9;
    master.connect(comp).connect(c.destination);
    const sfx = c.createGain();
    sfx.connect(master);
    const music = c.createGain();
    music.gain.value = 0;
    music.connect(master);
    // Эхо: свёртка с затухающим шумом — звуки становятся объёмнее.
    const reverb = c.createConvolver();
    const len = Math.floor(c.sampleRate * 1.6);
    const ir = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
    }
    reverb.buffer = ir;
    const wet = c.createGain();
    wet.gain.value = 0.3;
    reverb.connect(wet).connect(master);
    const nb = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    noiseBuf = nb;
    return { sfx, music, reverb };
  }

  function init() {
    if (ctx) return ctx;
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    bus = buildBus(ctx);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) ctx.suspend();
      else if (sfxOn() || musicOn()) ctx.resume();
    });
    return ctx;
  }

  // Контекст для эффекта или null, если звук выключен.
  function fx() {
    if (!sfxOn() || !init()) return null;
    if (ctx.state === 'suspended') ctx.resume();
    duck();
    return ctx;
  }

  // ---------- Кирпичики ----------

  // Нота из двух чуть расстроенных генераторов: звучит теплее одного.
  function note(freq, at, dur, o = {}) {
    const { type = 'sine', vol = 0.15, to = null, detune = 7, attack = 0.012, wet = 0.2, out = 'sfx' } = o;
    const t = at;
    const g = silentGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    for (const d of detune ? [-detune, detune] : [0]) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
      osc.detune.value = d;
      osc.connect(g);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    }
    send(g, out, wet);
  }

  // Колокольчик/маримба: основной тон + быстро гаснущий звонкий обертон.
  function bell(freq, at, dur = 0.5, vol = 0.14, out = 'sfx', wet = 0.3) {
    note(freq, at, dur, { vol, detune: 3, attack: 0.005, out, wet });
    note(freq * 4, at, Math.min(0.12, dur), { vol: vol * 0.25, detune: 0, attack: 0.002, out, wet });
    note(freq * 2, at, dur * 0.6, { vol: vol * 0.2, detune: 0, attack: 0.004, out, wet });
  }

  // Шум через фильтр: свист, всплеск, хруст, удар.
  function noise(at, dur, o = {}) {
    const { vol = 0.15, type = 'bandpass', f0 = 1000, f1 = null, q = 1, wet = 0.1, out = 'sfx', attack = 0.005 } = o;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(f0, at);
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, at + dur);
    const g = silentGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(f).connect(g);
    send(g, out, wet);
    src.start(at, Math.random() * 0.5);
    src.stop(at + dur + 0.05);
  }

  // Громкость с нуля: иначе в первый отсчёт звука проскакивает щелчок.
  function silentGain() {
    const g = ctx.createGain();
    g.gain.value = 0;
    return g;
  }

  function send(node, out, wet) {
    node.connect(bus[out]);
    if (wet) {
      const s = ctx.createGain();
      s.gain.value = wet;
      node.connect(s).connect(bus.reverb);
    }
  }

  // Мажорная пентатоника: любые ноты из неё звучат вместе красиво.
  const PENTA = [72, 74, 76, 79, 81, 84, 86, 88, 91, 93, 96];

  // ---------- Эффекты ----------

  const SFX = {
    click(t) { note(880 * jit(), t, 0.06, { type: 'triangle', vol: 0.06, detune: 0, wet: 0 }); },
    // Серия верных ответов: каждый следующий звучит на ступеньку выше.
    correct(t, streak = 1) {
      const m = PENTA[Math.min(Math.max(streak, 1) - 1, 7)];
      bell(mf(m), t, 0.35);
      bell(mf(m + 7), t + 0.08, 0.5);
      if (streak >= 5 && streak % 5 === 0) PENTA.slice(3, 8).forEach((n, i) => bell(mf(n + 12), t + 0.18 + i * 0.05, 0.3, 0.07));
    },
    digit(t, i = 0) { bell(mf(PENTA[Math.min(i, 6)]), t, 0.25, 0.1); },
    wrong(t) {
      note(330, t, 0.18, { type: 'triangle', vol: 0.12, to: 300, wet: 0.1 });
      note(247, t + 0.15, 0.4, { type: 'triangle', vol: 0.12, to: 196, wet: 0.1 });
    },
    coin(t) {
      bell(988 * jit(), t, 0.12, 0.1);
      bell(1319 * jit(), t + 0.08, 0.35, 0.1);
    },
    // Покупка: «дзынь» кассы и россыпь монеток.
    register(t) {
      noise(t, 0.08, { type: 'highpass', f0: 3000, vol: 0.1 });
      [1319, 1568, 2093, 2637].forEach((f, i) => bell(f, t + 0.05 + i * 0.06, 0.4, 0.09));
    },
    chest(t) {
      SFX.crack(t);
      for (let i = 0; i < 7; i++) bell(mf(PENTA[2 + (i % 5)] + 12) * jit(), t + 0.2 + i * 0.07, 0.3, 0.07);
    },
    hit(t) {
      noise(t, 0.12, { type: 'lowpass', f0: 900, vol: 0.22, wet: 0 });
      note(170, t, 0.18, { vol: 0.22, to: 50, detune: 0, wet: 0 });
    },
    crit(t) {
      SFX.hit(t);
      noise(t + 0.02, 0.5, { type: 'highpass', f0: 4000, f1: 2000, vol: 0.12, wet: 0.4 });
      bell(1568, t + 0.05, 0.6, 0.1);
      bell(2093, t + 0.12, 0.7, 0.1);
    },
    hurt(t) {
      noise(t, 0.15, { type: 'lowpass', f0: 500, vol: 0.2, wet: 0 });
      note(520, t, 0.38, { type: 'triangle', vol: 0.12, to: 170, wet: 0.15 });
    },
    whoosh(t, len = 0.3) { noise(t, len, { f0: 400, f1: 2600, q: 2, vol: 0.12, attack: len * 0.6 }); },
    flip(t) {
      SFX.whoosh(t, 0.45);
      [0, 2, 4].forEach((k, i) => bell(mf(PENTA[k] + 12), t + 0.15 + i * 0.08, 0.3, 0.07));
    },
    sparkle(t) {
      for (let i = 0; i < 5; i++) bell(mf(PENTA[3 + Math.floor(Math.random() * 7)] + 12), t + i * 0.07, 0.4, 0.06);
    },
    win(t) {
      [60, 64, 67, 72].forEach((m, i) => bell(mf(m + 12), t + i * 0.12, 0.5, 0.13));
      [60, 64, 67].forEach(m => note(mf(m), t + 0.48, 1.2, { type: 'triangle', vol: 0.06, attack: 0.05, wet: 0.4 }));
      SFX.sparkle(t + 0.55);
    },
    // Новый уровень игрока: быстрый пробег вверх и аккорд.
    levelUp(t) {
      PENTA.slice(0, 8).forEach((m, i) => bell(mf(m), t + i * 0.05, 0.25, 0.09));
      [72, 76, 79, 84].forEach(m => bell(mf(m), t + 0.45, 0.9, 0.08));
    },
    achieve(t) { [76, 79, 84].forEach((m, i) => bell(mf(m + 12), t + i * 0.09, 0.45, 0.08)); },
    // Тиканье в последние секунды блица.
    tick(t, urgent = false) {
      note(urgent ? 1760 : 1320, t, 0.05, { type: 'triangle', vol: urgent ? 0.11 : 0.07, detune: 0, wet: 0 });
      noise(t, 0.03, { type: 'highpass', f0: 5000, vol: 0.05, wet: 0 });
    },
    // Босс готовится атаковать.
    warn(t) { note(300, t, 0.45, { type: 'triangle', vol: 0.08, to: 620, attack: 0.3, wet: 0.2 }); },
    heartbeat(t) {
      note(75, t, 0.14, { vol: 0.28, to: 50, detune: 0, wet: 0 });
      note(70, t + 0.2, 0.14, { vol: 0.2, to: 48, detune: 0, wet: 0 });
    },
    crack(t) {
      noise(t, 0.06, { type: 'highpass', f0: 2500, vol: 0.16, wet: 0.05 });
      noise(t + 0.03, 0.05, { type: 'bandpass', f0: 1200 * jit(), q: 4, vol: 0.12, wet: 0.05 });
    },
    // Питомец вылупился: чем реже, тем пышнее фанфары. lvl: 0 обычный, 1 редкий, 2 легендарный.
    hatch(t, lvl = 0) {
      SFX.win(t);
      if (lvl >= 1) SFX.sparkle(t + 0.9);
      if (lvl >= 2) [48, 55, 60, 64, 67].forEach(m => note(mf(m), t + 0.6, 2, { type: 'triangle', vol: 0.05, attack: 0.4, wet: 0.5 }));
    },
    splash(t) {
      noise(t, 0.45, { f0: 1400, f1: 300, q: 0.8, vol: 0.18, wet: 0.3 });
      for (let i = 0; i < 3; i++) note(600 + Math.random() * 500, t + 0.15 + i * 0.09, 0.08, { vol: 0.06, to: 1400, detune: 0, wet: 0.2 });
    },
    munch(t) {
      for (let i = 0; i < 3; i++) noise(t + i * 0.11, 0.06, { type: 'lowpass', f0: 1800 * jit(), vol: 0.14, wet: 0 });
    },
    pop(t) { note(400 * jit(), t, 0.1, { vol: 0.12, to: 900, detune: 0, wet: 0.15 }); },
    meow(t) {
      const o = ctx.createOscillator();
      const f = ctx.createBiquadFilter();
      const g = silentGain();
      const k = jit();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(480 * k, t);
      o.frequency.exponentialRampToValueAtTime(820 * k, t + 0.15);
      o.frequency.exponentialRampToValueAtTime(520 * k, t + 0.5);
      f.type = 'bandpass';
      f.frequency.setValueAtTime(1200, t);
      f.frequency.linearRampToValueAtTime(2000, t + 0.15);
      f.frequency.linearRampToValueAtTime(900, t + 0.5);
      f.Q.value = 3;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.35, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      o.connect(f).connect(g);
      send(g, 'sfx', 0.15);
      o.start(t);
      o.stop(t + 0.6);
    },
    // Мурчание: низкий шум, который «пульсирует» 25 раз в секунду.
    purr(t) {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 260;
      const am = ctx.createGain();
      am.gain.value = 0.5;
      const lfo = ctx.createOscillator();
      const lfoAmt = ctx.createGain();
      lfo.frequency.value = 24;
      lfoAmt.gain.value = 0.5;
      lfo.connect(lfoAmt).connect(am.gain);
      const g = silentGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.5, t + 0.2);
      g.gain.setValueAtTime(0.5, t + 0.9);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
      src.connect(f).connect(am).connect(g);
      send(g, 'sfx', 0);
      src.start(t);
      lfo.start(t);
      src.stop(t + 1.4);
      lfo.stop(t + 1.4);
    },
  };

  // ---------- Фоновая музыка ----------
  // Мелодия сочиняется на ходу: каждые 4 такта новый мотив из пентатоники,
  // повторённый с небольшой вариацией, — бесконечно и не надоедает.

  const MAJ = [0, 2, 4, 7, 9];
  const MIN = [0, 3, 5, 7, 10];
  const MOODS = {
    // Меню, приключение, ферма: спокойная колыбельная.
    calm:  { bpm: 80, root: 60, scale: MAJ, prog: [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14]], density: 0.42, bass: [0, 4], pad: 0.035, drums: null },
    // Блиц: бодро и весело.
    blitz: { bpm: 128, root: 62, scale: MAJ, prog: [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]], density: 0.55, bass: [0, 2, 4, 6], pad: 0.02, drums: { kick: [0, 4], hat: [2, 6] } },
    // Босс: приключенческий минор, без страшилок.
    boss:  { bpm: 112, root: 57, scale: MIN, prog: [[0, 3, 7], [8, 12, 15], [10, 14, 17], [7, 11, 14]], density: 0.45, bass: [0, 1, 3, 4, 5, 7], pad: 0.03, drums: { kick: [0, 3, 4], hat: [1, 2, 3, 5, 6, 7] } },
  };

  const M = { want: 'calm', mood: null, playing: false, timer: null, next: 0, step: 0, bar: 0, motif: null, last: 0 };

  function musicVol() { return MUSIC_VOL[musicLevel()] ?? MUSIC_VOL[2]; }

  // Мотив на 2 такта: в каждой восьмой — номер ступени пентатоники или пауза.
  function makeMotif(md) {
    const notes = [];
    let pos = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < 16; i++) {
      const strong = i % 4 === 0;
      if (Math.random() < (strong ? md.density + 0.25 : md.density)) {
        pos = Math.max(0, Math.min(9, pos + [-2, -1, -1, 0, 1, 1, 2][Math.floor(Math.random() * 7)]));
        notes.push(pos);
      } else notes.push(null);
    }
    return notes;
  }

  function degree(md, pos) { return md.root + 12 + md.scale[pos % 5] + 12 * Math.floor(pos / 5); }

  function scheduleStep(t) {
    // Смена настроения — только с начала такта, чтобы не обрывать музыку.
    if (M.step % 8 === 0 && M.want !== M.mood) { M.mood = M.want; M.bar = 0; M.motif = null; }
    const md = MOODS[M.mood];
    const s = M.step % 8;
    const bar = M.bar;
    const chord = md.prog[bar % 4];
    const eighth = 30 / md.bpm;
    if (bar % 4 === 0 && s === 0) M.motif = makeMotif(md);
    const out = 'music';

    // Бас и мягкий аккорд-подложка.
    if (md.bass.includes(s)) {
      const oct = s % 4 === 0 ? 0 : (s % 2 ? 12 : 7);
      note(mf(md.root - 24 + chord[0] + oct), t, eighth * (s === 0 ? 1.8 : 0.9), { type: 'triangle', vol: 0.16, detune: 0, wet: 0.05, out });
    }
    if (s === 0) chord.forEach(n => note(mf(md.root + n), t, eighth * 8, { type: 'triangle', vol: md.pad, attack: 0.4, wet: 0.5, out }));

    // Мелодия: такты 3–4 повторяют мотив, а последнюю ноту тянем к аккорду.
    const idx = (bar % 2) * 8 + s;
    let pos = M.motif[idx];
    if (pos !== null && bar % 4 === 3 && s >= 6) pos = md.scale.indexOf(chord[0] % 12) >= 0 ? md.scale.indexOf(chord[0] % 12) + 5 : pos;
    if (pos !== null && bar % 4 >= 2 && Math.random() < 0.15) pos = Math.max(0, pos + (Math.random() < 0.5 ? -1 : 1));
    if (pos !== null) bell(mf(degree(md, pos)), t, eighth * 2.2, 0.09, out, 0.35);

    // Ударные — только в бодрых режимах.
    if (md.drums) {
      if (md.drums.kick.includes(s)) note(110, t, 0.16, { vol: 0.22, to: 45, detune: 0, wet: 0, out });
      if (md.drums.hat.includes(s)) noise(t, 0.04, { type: 'highpass', f0: 7000, vol: 0.05, wet: 0, out });
    }

    M.step++;
    if (M.step % 8 === 0) M.bar++;
    return eighth;
  }

  function pump() {
    while (M.next < ctx.currentTime + 0.3) M.next += scheduleStep(M.next);
  }

  function startMusic() {
    if (!musicOn() || !init()) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (M.playing) return;
    M.playing = true;
    M.step = 0;
    M.bar = 0;
    M.mood = null;
    M.next = ctx.currentTime + 0.1;
    const g = bus.music.gain;
    g.cancelScheduledValues(ctx.currentTime);
    g.setValueAtTime(0.0001, ctx.currentTime);
    g.linearRampToValueAtTime(musicVol(), ctx.currentTime + 2);
    M.timer = setInterval(pump, 80);
    pump();
  }

  function stopMusic() {
    if (!M.playing) return;
    M.playing = false;
    clearInterval(M.timer);
    const g = bus.music.gain;
    g.cancelScheduledValues(ctx.currentTime);
    g.setValueAtTime(g.value, ctx.currentTime);
    g.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
  }

  // Музыка тише, пока звучит эффект, — эффекты всегда слышно.
  function duck() {
    if (!M.playing) return;
    const now = ctx.currentTime;
    if (now - M.last < 0.05) return;
    M.last = now;
    const g = bus.music.gain;
    const v = musicVol();
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(v * 0.45, now + 0.04);
    g.linearRampToValueAtTime(v, now + 0.7);
  }

  // Браузеры разрешают звук только после касания: заводим музыку на первом же нажатии.
  ['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, () => startMusic(), true));

  const api = {
    setEnabledGetter(fn) { sfxOn = fn; },
    setMusicGetters(on, level) { musicOn = on; musicLevel = level; },
    // Настроение музыки: 'calm', 'blitz' или 'boss'.
    music(mood) { if (MOODS[mood]) M.want = mood; },
    // Вызвать после смены настроек музыки.
    musicChanged() {
      if (!musicOn()) { stopMusic(); return; }
      if (!M.playing) { startMusic(); return; }
      const g = bus.music.gain;
      g.cancelScheduledValues(ctx.currentTime);
      g.setValueAtTime(g.value, ctx.currentTime);
      g.linearRampToValueAtTime(musicVol(), ctx.currentTime + 0.3);
    },
    // Для проверки в тестах: записать звук в буфер без динамиков.
    async renderOffline(seconds, play) {
      const saved = [ctx, bus, noiseBuf, { ...M }];
      const oc = new OfflineAudioContext(2, Math.ceil(44100 * seconds), 44100);
      ctx = oc;
      bus = buildBus(oc);
      M.playing = false;
      try {
        play({
          sfx: (name, at, ...a) => SFX[name](at, ...a),
          music: (mood, level = 2) => {
            bus.music.gain.value = MUSIC_VOL[level];
            Object.assign(M, { want: mood, mood: null, step: 0, bar: 0, next: 0 });
            while (M.next < seconds) M.next += scheduleStep(M.next);
          },
        });
      } finally {
        [ctx, bus, noiseBuf] = saved;
        Object.assign(M, saved[3]);
      }
      return oc.startRendering();
    },
  };
  for (const name of Object.keys(SFX)) api[name] = (...a) => { if (fx()) SFX[name](ctx.currentTime + 0.01, ...a); };
  return api;
})();
