// Word Run: логика забега без DOM и 3D — план слов, ворота, ответы, очки,
// адаптивная сложность и очередь ошибок. Тесты: tests/unit/wordrun-game.test.js
'use strict';

const WRGame = (() => {
  const W = (typeof WORLDS !== 'undefined') ? WORLDS : require('./data.js').WORLDS;

  // Режимы подачи слова (раздел 4 ТЗ).
  const MODE = { PIC: 1, RU: 2, AUDIO: 3, PIC_GATES: 4 };
  const BOSS_WORDS = 5;
  const REVIEW_EVERY = 3;       // слово из очереди ошибок — после каждых 3 новых
  const REVIEW_MAX = 3;         // не больше 3 повторов за забег
  const MISTAKE_CLEAR_STREAK = 3;
  const AUDIO_FROM_WORLD = 3;

  function shuffle(arr, rng = Math.random) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pick(arr, rng = Math.random) {
    return arr[Math.floor(rng() * arr.length)];
  }

  function world(id) {
    return W.find(w => w.id === id) || null;
  }

  function findWord(en, worldId) {
    const w = world(worldId);
    return (w && w.words.find(x => x.en === en)) || null;
  }

  // ---------- Прогресс ----------

  function defaultState() {
    return {
      v: 1,
      coins: 0,
      bestScore: 0,
      bonusHeart: false,
      skin: 'block',
      trail: 'none',
      ownedSkins: ['block'],
      ownedTrails: ['none'],
      worlds: {},       // { [id]: { stars, passes, resume: { words: [en], boss: bool } | null } }
      mistakes: {},     // { [en]: { en, worldId, streak, errors } }
      words: {},        // { [en]: { right, wrong } } — статистика для будущего режима учителя
      daily: { last: null, count: 0, chestDay: null },
      settings: { sound: true, voice: true, voiceName: '' },
      study: { known: {}, weak: {}, best: {} }   // режим «Контрольная»
    };
  }

  function normalizeState(raw) {
    const d = defaultState();
    const s = Object.assign(d, raw && typeof raw === 'object' ? raw : {});
    s.daily = Object.assign(defaultState().daily, s.daily || {});
    s.settings = Object.assign(defaultState().settings, s.settings || {});
    if (!Array.isArray(s.ownedSkins) || !s.ownedSkins.includes('block')) s.ownedSkins = ['block', ...(s.ownedSkins || [])];
    if (!Array.isArray(s.ownedTrails) || !s.ownedTrails.includes('none')) s.ownedTrails = ['none', ...(s.ownedTrails || [])];
    return s;
  }

  function worldProgress(state, id) {
    if (!state.worlds[id]) state.worlds[id] = { stars: 0, passes: 0, resume: null };
    return state.worlds[id];
  }

  function isUnlocked(state, id) {
    if (id === W[0].id) return true;
    const idx = W.findIndex(w => w.id === id);
    if (idx <= 0) return false;
    const prev = state.worlds[W[idx - 1].id];
    return !!(prev && prev.passes > 0);
  }

  function dayStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // Ежедневный стрик: зашёл 3 дня подряд — сундук (раздел 9 ТЗ).
  function touchDaily(state, now = new Date()) {
    const today = dayStr(now);
    if (state.daily.last === today) return;
    const y = new Date(now); y.setDate(y.getDate() - 1);
    state.daily.count = state.daily.last === dayStr(y) ? state.daily.count + 1 : 1;
    state.daily.last = today;
  }

  function chestReady(state, now = new Date()) {
    return state.daily.count > 0 && state.daily.count % 3 === 0 && state.daily.chestDay !== dayStr(now);
  }

  function claimChest(state, now = new Date()) {
    if (!chestReady(state, now)) return 0;
    const reward = 40 + Math.min(60, (state.daily.count / 3 - 1) * 10);
    state.coins += reward;
    state.daily.chestDay = dayStr(now);
    return reward;
  }

  // ---------- Очередь ошибок ----------

  function recordMistake(state, word, worldId) {
    const m = state.mistakes[word.en];
    if (m) { m.streak = 0; m.errors++; }
    else state.mistakes[word.en] = { en: word.en, worldId, streak: 0, errors: 1 };
    const st = state.words[word.en] || (state.words[word.en] = { right: 0, wrong: 0 });
    st.wrong++;
  }

  // Слово уходит из очереди после 3 верных ответов подряд (раздел 6 ТЗ).
  function recordRight(state, word) {
    const st = state.words[word.en] || (state.words[word.en] = { right: 0, wrong: 0 });
    st.right++;
    const m = state.mistakes[word.en];
    if (!m) return false;
    m.streak++;
    if (m.streak >= MISTAKE_CLEAR_STREAK) { delete state.mistakes[word.en]; return true; }
    return false;
  }

  function mistakeCards(state) {
    return Object.values(state.mistakes)
      .map(m => ({ m, word: findWord(m.en, m.worldId) }))
      .filter(x => x.word)
      .sort((a, b) => b.m.errors - a.m.errors);
  }

  // ---------- План забега ----------

  function modeForMain(passes, worldId, rng) {
    if (passes === 0) return MODE.PIC;
    if (passes === 1) return MODE.RU;
    const pool = [MODE.RU, MODE.PIC_GATES];
    if (worldId >= AUDIO_FROM_WORLD) pool.push(MODE.AUDIO);
    return pick(pool, rng);
  }

  function modeForBoss(worldId, rng) {
    return rng() < 0.5 ? MODE.PIC : (worldId >= AUDIO_FROM_WORLD ? MODE.AUDIO : MODE.RU);
  }

  function createRun(state, worldId, rng = Math.random) {
    const w = world(worldId) || W[0];
    const prog = worldProgress(state, w.id);
    const resume = prog.resume;

    let main;
    if (resume) {
      main = resume.words.map(en => w.words.find(x => x.en === en)).filter(Boolean);
    } else {
      main = shuffle(w.words, rng);
    }

    // Повтор ошибок из других миров (слова этого мира и так будут в забеге).
    const reviews = mistakeCards(state)
      .filter(x => x.m.worldId !== w.id)
      .slice(0, REVIEW_MAX);

    const queue = [];
    main.forEach((word, i) => {
      queue.push({ word, worldId: w.id, kind: 'main', mode: modeForMain(prog.passes, w.id, rng) });
      if ((i + 1) % REVIEW_EVERY === 0 && reviews.length && i < main.length - 1) {
        const r = reviews.shift();
        queue.push({ word: r.word, worldId: r.m.worldId, kind: 'review', mode: MODE.PIC });
      }
    });

    // «Страж» в конце мира: 5 слов подряд вперемешку.
    shuffle(w.words, rng).slice(0, BOSS_WORDS).forEach(word => {
      queue.push({ word, worldId: w.id, kind: 'boss', mode: modeForBoss(w.id, rng) });
    });

    const hearts = 3 + (state.bonusHeart ? 1 : 0);
    state.bonusHeart = false;

    return {
      worldId: w.id,
      passes: prog.passes,
      resumed: !!resume,
      queue,
      step: 0,
      hearts,
      maxHearts: hearts,
      score: 0,
      combo: 1,
      correctStreak: 0,
      wrongStreak: 0,
      bestStreak: 0,
      errorsOnWord: 0,
      totalErrors: 0,
      gateCount: 2,         // MVP: на старте 2 ворот
      speed: 1,
      hint: false,
      missed: [],           // слова с ошибками в этом забеге
      learned: []           // слова, ушедшие из очереди ошибок
    };
  }

  function current(run) {
    return run.queue[run.step] || null;
  }

  function isBossStart(run) {
    const it = current(run);
    return !!it && it.kind === 'boss' && (run.step === 0 || run.queue[run.step - 1].kind !== 'boss');
  }

  // Ворота: верное слово + дистракторы из того же мира, дорожки перемешаны.
  // lane: -1 левая, 0 центр, 1 правая. При 2 воротах центр пустой — надо выбрать сторону.
  function buildGates(run, rng = Math.random) {
    const it = current(run);
    if (!it) return [];
    const count = it.kind === 'boss' ? Math.max(3, run.gateCount) : run.gateCount;
    const pool = (world(it.worldId) || W[0]).words.filter(w => w.en !== it.word.en);
    const options = shuffle([it.word, ...shuffle(pool, rng).slice(0, count - 1)], rng);
    const lanes = options.length === 2 ? [-1, 1] : [-1, 0, 1];
    return options.map((word, i) => ({ lane: lanes[i], word, correct: word.en === it.word.en }));
  }

  // chosenEn === null — пробежал мимо ворот (пустая дорожка): без штрафа, ворота заново.
  function answer(state, run, chosenEn) {
    const it = current(run);
    if (!it) return { status: 'done' };
    const target = it.word;

    if (chosenEn === null || chosenEn === undefined) return { status: 'miss', target };

    if (chosenEn === target.en) {
      run.correctStreak++;
      run.bestStreak = Math.max(run.bestStreak, run.correctStreak);
      run.wrongStreak = 0;
      run.errorsOnWord = 0;
      run.hint = false;
      run.combo = Math.min(5, 1 + Math.floor(run.correctStreak / 3));
      const gained = 10 * run.combo;
      run.score += gained;

      // Адаптивная сложность (раздел 6 ТЗ).
      if (run.correctStreak >= 8) { run.gateCount = 3; run.speed = 1.2; }
      else if (run.correctStreak >= 4) { run.gateCount = 3; run.speed = Math.max(run.speed, 1); }
      else if (run.correctStreak >= 2 && run.speed < 1) run.speed = 1;

      if (recordRight(state, target)) run.learned.push(target);
      run.step++;

      if (run.step >= run.queue.length) return { status: 'win', gained, target, ...finishWin(state, run) };
      return { status: 'correct', gained, target, bossNext: isBossStart(run) };
    }

    run.hearts--;
    run.totalErrors++;
    run.wrongStreak++;
    run.correctStreak = 0;
    run.combo = 1;
    run.errorsOnWord++;
    if (!run.missed.some(w => w.en === target.en)) run.missed.push(target);
    recordMistake(state, target, it.worldId);

    if (run.wrongStreak >= 2) { run.gateCount = 2; run.speed = 0.8; }
    if (run.errorsOnWord >= 3) run.hint = true;

    if (run.hearts <= 0) return { status: 'gameover', target, ...finishLose(state, run) };
    return { status: 'wrong', target, hint: run.hint };
  }

  function starsFor(errors) {
    return errors === 0 ? 3 : errors <= 2 ? 2 : 1;
  }

  function finishWin(state, run) {
    const perfect = run.totalErrors === 0;
    if (perfect) run.score += 50;
    const stars = starsFor(run.totalErrors);
    const prog = worldProgress(state, run.worldId);
    const firstClear = prog.passes === 0;
    prog.stars = Math.max(prog.stars, stars);
    prog.passes++;
    prog.resume = null;
    const coins = Math.max(5, Math.round(run.score / 5));
    state.coins += coins;
    state.bestScore = Math.max(state.bestScore, run.score);
    return { stars, coins, perfect, firstClear };
  }

  // 0 ❤ — забег окончен, но прогресс мира сохраняется (продолжить с того же слова).
  function finishLose(state, run) {
    const prog = worldProgress(state, run.worldId);
    const rest = run.queue.slice(run.step).filter(q => q.kind === 'main').map(q => q.word.en);
    prog.resume = { words: rest, boss: rest.length === 0 };
    const coins = Math.max(2, Math.round(run.score / 8));
    state.coins += coins;
    state.bestScore = Math.max(state.bestScore, run.score);
    return { coins, resumeFrom: rest.length };
  }

  function progressPct(run) {
    return Math.round((run.step / run.queue.length) * 100);
  }

  // ---------- Магазин ----------

  function buyOrEquip(state, kind, item) {
    const owned = kind === 'skin' ? state.ownedSkins : state.ownedTrails;
    const key = kind === 'skin' ? 'skin' : 'trail';
    if (owned.includes(item.id)) { state[key] = item.id; return 'equipped'; }
    if (state.coins < item.price) return 'poor';
    state.coins -= item.price;
    owned.push(item.id);
    state[key] = item.id;
    return 'bought';
  }

  return {
    MODE, shuffle, world, findWord, defaultState, normalizeState, worldProgress, isUnlocked,
    touchDaily, chestReady, claimChest, recordMistake, recordRight, mistakeCards,
    createRun, current, isBossStart, buildGates, answer, starsFor, progressPct, buyOrEquip
  };
})();

if (typeof module !== 'undefined') module.exports = WRGame;
