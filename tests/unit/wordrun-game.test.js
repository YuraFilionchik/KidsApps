// Юнит-тесты логики Word Run: node --test tests/unit/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../../wordrun/js/game.js');
const { WORLDS } = require('../../wordrun/js/data.js');

// Детерминированный генератор, чтобы тесты не зависели от случайности.
function seeded(seed = 1) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function answerRight(state, run) {
  return G.answer(state, run, G.current(run).word.en);
}

function answerWrong(state, run) {
  const it = G.current(run);
  const other = G.world(it.worldId).words.find(w => w.en !== it.word.en);
  return G.answer(state, run, other.en);
}

test('забег: 10 слов мира + 5 слов Стража, режим 1 при первом прохождении', () => {
  const st = G.defaultState();
  const run = G.createRun(st, 1, seeded());
  assert.equal(run.queue.filter(q => q.kind === 'main').length, 10);
  assert.equal(run.queue.filter(q => q.kind === 'boss').length, 5);
  assert.ok(run.queue.filter(q => q.kind === 'main').every(q => q.mode === G.MODE.PIC));
  assert.equal(run.hearts, 3);
  assert.equal(run.gateCount, 2);
});

test('режим 2 при повторном прохождении, аудио у Стража только с 3-го мира', () => {
  const st = G.defaultState();
  st.worlds[1] = { stars: 1, passes: 1, resume: null };
  const run = G.createRun(st, 1, seeded(3));
  assert.ok(run.queue.filter(q => q.kind === 'main').every(q => q.mode === G.MODE.RU));
  assert.ok(run.queue.every(q => q.mode !== G.MODE.AUDIO));
});

test('ворота: верное слово + дистракторы из того же мира, без повторов', () => {
  const st = G.defaultState();
  const run = G.createRun(st, 2, seeded());
  run.gateCount = 3;
  const gates = G.buildGates(run, seeded(7));
  assert.equal(gates.length, 3);
  assert.equal(gates.filter(g => g.correct).length, 1);
  assert.deepEqual(gates.map(g => g.lane), [-1, 0, 1]);
  const ens = gates.map(g => g.word.en);
  assert.equal(new Set(ens).size, 3);
  const pool = WORLDS[1].words.map(w => w.en);
  assert.ok(ens.every(e => pool.includes(e)));
});

test('при 2 воротах центр пустой, проход мимо — без штрафа', () => {
  const st = G.defaultState();
  const run = G.createRun(st, 1, seeded());
  const gates = G.buildGates(run, seeded());
  assert.deepEqual(gates.map(g => g.lane), [-1, 1]);
  const res = G.answer(st, run, null);
  assert.equal(res.status, 'miss');
  assert.equal(run.hearts, 3);
  assert.equal(run.step, 0);
});

test('очки и комбо: ×2 после 3 верных подряд', () => {
  const st = G.defaultState();
  const run = G.createRun(st, 1, seeded());
  answerRight(st, run); answerRight(st, run);
  assert.equal(run.score, 20);
  const r = answerRight(st, run);
  assert.equal(r.gained, 20);
  assert.equal(run.combo, 2);
});

test('ошибка: −1 ❤, тот же шаг, слово в очереди ошибок, комбо сбрасывается', () => {
  const st = G.defaultState();
  const run = G.createRun(st, 1, seeded());
  answerRight(st, run); answerRight(st, run); answerRight(st, run);
  const word = G.current(run).word;
  const res = answerWrong(st, run);
  assert.equal(res.status, 'wrong');
  assert.equal(run.hearts, 2);
  assert.equal(run.step, 3);
  assert.equal(run.combo, 1);
  assert.equal(st.mistakes[word.en].errors, 1);
});

test('адаптивность: 2 ошибки подряд — 2 ворот и −20% скорости; 3 ошибки на слове — подсказка', () => {
  const st = G.defaultState();
  const run = G.createRun(st, 1, seeded());
  run.gateCount = 3;
  run.hearts = 10;
  answerWrong(st, run); answerWrong(st, run);
  assert.equal(run.gateCount, 2);
  assert.equal(run.speed, 0.8);
  assert.equal(run.hint, false);
  answerWrong(st, run);
  assert.equal(run.hint, true);
});

test('адаптивность: 8 верных подряд — 3 ворот и +20% скорости', () => {
  const st = G.defaultState();
  const run = G.createRun(st, 1, seeded());
  for (let i = 0; i < 8; i++) answerRight(st, run);
  assert.equal(run.gateCount, 3);
  assert.equal(run.speed, 1.2);
});

test('слово уходит из ошибок после 3 верных подряд', () => {
  const st = G.defaultState();
  const w = WORLDS[0].words[0];
  G.recordMistake(st, w, 1);
  G.recordRight(st, w); G.recordRight(st, w);
  assert.ok(st.mistakes[w.en]);
  G.recordMistake(st, w, 1);
  assert.equal(st.mistakes[w.en].streak, 0);
  G.recordRight(st, w); G.recordRight(st, w);
  assert.equal(G.recordRight(st, w), true);
  assert.equal(st.mistakes[w.en], undefined);
});

test('ошибки из других миров вставляются в забег, но не больше 3', () => {
  const st = G.defaultState();
  WORLDS[1].words.slice(0, 5).forEach(w => G.recordMistake(st, w, 2));
  const run = G.createRun(st, 1, seeded());
  const reviews = run.queue.filter(q => q.kind === 'review');
  assert.equal(reviews.length, 3);
  assert.ok(reviews.every(r => r.worldId === 2));
  const idx = run.queue.findIndex(q => q.kind === 'review');
  assert.equal(idx, 3);
});

test('победа без ошибок: 3 звезды, +50 очков, мир открывает следующий', () => {
  const st = G.defaultState();
  const run = G.createRun(st, 1, seeded());
  assert.equal(G.isUnlocked(st, 2), false);
  let res;
  while (G.current(run)) res = answerRight(st, run);
  assert.equal(res.status, 'win');
  assert.equal(res.stars, 3);
  assert.ok(res.perfect);
  assert.ok(st.coins > 0);
  assert.equal(st.worlds[1].passes, 1);
  assert.equal(G.isUnlocked(st, 2), true);
});

test('0 ❤ — забег окончен, прогресс сохранён с того же слова', () => {
  const st = G.defaultState();
  const run = G.createRun(st, 1, seeded());
  answerRight(st, run); answerRight(st, run);
  const stuck = G.current(run).word.en;
  let res;
  for (let i = 0; i < 3; i++) res = answerWrong(st, run);
  assert.equal(res.status, 'gameover');
  assert.equal(st.worlds[1].resume.words.length, 8);
  assert.equal(st.worlds[1].resume.words[0], stuck);

  const again = G.createRun(st, 1, seeded(9));
  assert.ok(again.resumed);
  assert.equal(G.current(again).word.en, stuck);
  assert.equal(again.queue.filter(q => q.kind === 'main').length, 8);
});

test('смерть на Страже — следующий забег начинается сразу со Стража', () => {
  const st = G.defaultState();
  const run = G.createRun(st, 1, seeded());
  while (G.current(run).kind !== 'boss') answerRight(st, run);
  for (let i = 0; i < 3; i++) answerWrong(st, run);
  assert.deepEqual(st.worlds[1].resume, { words: [], boss: true });
  const again = G.createRun(st, 1, seeded());
  assert.ok(again.queue.every(q => q.kind === 'boss'));
});

test('бонусное сердце даёт 4 ❤ и тратится', () => {
  const st = G.defaultState();
  st.bonusHeart = true;
  const run = G.createRun(st, 1, seeded());
  assert.equal(run.hearts, 4);
  assert.equal(st.bonusHeart, false);
});

test('стрик: сундук на 3-й день подряд, один раз в день', () => {
  const st = G.defaultState();
  G.touchDaily(st, new Date(2026, 9, 1));
  G.touchDaily(st, new Date(2026, 9, 2));
  assert.equal(G.chestReady(st, new Date(2026, 9, 2)), false);
  G.touchDaily(st, new Date(2026, 9, 3));
  const day3 = new Date(2026, 9, 3);
  assert.equal(G.chestReady(st, day3), true);
  assert.equal(G.claimChest(st, day3), 40);
  assert.equal(G.claimChest(st, day3), 0);
  G.touchDaily(st, new Date(2026, 9, 5));
  assert.equal(st.daily.count, 1);
});

test('магазин: не хватает монет — нельзя; купил — надето', () => {
  const st = G.defaultState();
  const cat = { id: 'cat', price: 60 };
  assert.equal(G.buyOrEquip(st, 'skin', cat), 'poor');
  st.coins = 100;
  assert.equal(G.buyOrEquip(st, 'skin', cat), 'bought');
  assert.equal(st.coins, 40);
  assert.equal(st.skin, 'cat');
  assert.equal(G.buyOrEquip(st, 'skin', { id: 'block', price: 0 }), 'equipped');
});

test('у каждого мира хватает слов на 3 ворот и на Стража, слова уникальны', () => {
  const all = new Set();
  for (const w of WORLDS) {
    assert.ok(w.words.length >= 5, w.name);
    for (const x of w.words) {
      assert.ok(!all.has(x.en), `повтор слова ${x.en}`);
      all.add(x.en);
      assert.ok(x.ru && x.pic, x.en);
    }
  }
});

test('битое сохранение не ломает игру', () => {
  const st = G.normalizeState({ coins: 5, ownedSkins: 'x', daily: null });
  assert.equal(st.coins, 5);
  assert.ok(st.ownedSkins.includes('block'));
  assert.equal(st.daily.count, 0);
  assert.equal(G.normalizeState('garbage').coins, 0);
});
