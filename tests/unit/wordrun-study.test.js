// Юнит-тесты режима «Контрольная» Word Run: node --test tests/unit/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../../wordrun/js/study_game.js');

function seeded(seed = 1) {
  let s = seed;
  const next = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  for (let i = 0; i < 5; i++) next();   // первые значения у малых seed слишком малы
  return next;
}

test('числа словами: 1–20, десятки, составные через дефис, 100', () => {
  assert.equal(S.numberToWords(1), 'one');
  assert.equal(S.numberToWords(12), 'twelve');
  assert.equal(S.numberToWords(14), 'fourteen');
  assert.equal(S.numberToWords(15), 'fifteen');
  assert.equal(S.numberToWords(18), 'eighteen');
  assert.equal(S.numberToWords(40), 'forty');
  assert.equal(S.numberToWords(50), 'fifty');
  assert.equal(S.numberToWords(21), 'twenty-one');
  assert.equal(S.numberToWords(45), 'forty-five');
  assert.equal(S.numberToWords(99), 'ninety-nine');
  assert.equal(S.numberToWords(100), 'one hundred');
});

test('транскрипция составного числа: главное ударение на единицах', () => {
  assert.equal(S.numberIpa(13), 'ˌθɜːˈtiːn');
  assert.equal(S.numberIpa(30), 'ˈθɜːti');
  assert.equal(S.numberIpa(27), 'ˌtwenti ˈsevn');
  assert.equal(S.numberIpa(41), 'ˌfɔːti ˈwʌn');
});

test('похожие числа: 13 ↔ 30, 47 ↔ 74, без самого числа и в пределах 1–100', () => {
  assert.ok(S.confusableNumbers(13).includes(30));
  assert.ok(S.confusableNumbers(30).includes(13));
  assert.ok(S.confusableNumbers(47).includes(74));
  for (let n = 1; n <= 100; n++) {
    const c = S.confusableNumbers(n);
    assert.ok(!c.includes(n), `n=${n}`);
    assert.ok(c.every(x => x >= 1 && x <= 100), `n=${n}`);
    assert.ok(c.length >= 2, `n=${n}`);
  }
});

test('типичные ошибки написания для неверных вариантов', () => {
  assert.equal(S.misspell('forty'), 'fourty');
  assert.equal(S.misspell('forty-five'), 'fourty-five');
  assert.equal(S.misspell('fifteen'), 'fiveteen');
  assert.equal(S.misspell('sixty-two'), 'sixtytwo');
});

test('каждый тип вопроса каждой темы строится: 4 разных варианта, верный среди них', () => {
  const st = { study: {} };
  for (const u of S.units()) {
    for (const t of u.topics) {
      for (const type of t.quiz) {
        for (let k = 0; k < 25; k++) {
          const rng = seeded(k + 7);
          const it = t.items === 'numbers' ? S.numberItem(1 + Math.floor(rng() * 100)) : S.items(t)[k % S.items(t).length];
          const q = S.makeQuestion(t, type, it, rng);
          assert.ok(q.answer, `${t.id}/${type}`);
          assert.ok(q.explain, `${t.id}/${type}`);
          if (q.input) {
            if (q.input === 'tiles') {
              assert.equal(q.tiles.join('').length, q.answer.replace(/[^a-z]/gi, '').length);
            }
            continue;
          }
          assert.ok(q.options.includes(q.answer), `${t.id}/${type}: ${q.answer} not in ${q.options}`);
          assert.equal(new Set(q.options).size, q.options.length, `${t.id}/${type}: дубли ${q.options}`);
          assert.ok(q.options.length >= 3, `${t.id}/${type}`);
        }
      }
    }
  }
});

test('вопрос «где занимаются»: неверные места действительно не подходят', () => {
  const t = S.topic('sports');
  for (const it of S.items(t)) {
    for (let k = 0; k < 10; k++) {
      const q = S.makeQuestion(t, 'place', it, seeded(k + 1));
      assert.ok(it.places.includes(q.answer));
      assert.equal(q.options.filter(o => it.places.includes(o)).length, 1);
    }
  }
});

test('все места из видов спорта есть в теме «места»', () => {
  const places = S.items('places').map(p => p.en);
  for (const it of S.items('sports')) for (const p of it.places) assert.ok(places.includes(p), p);
});

test('после декабря — январь, перед январём — декабрь', () => {
  const t = S.topic('months');
  const dec = S.items(t)[11];
  const jan = S.items(t)[0];
  let after, before;
  for (let k = 1; k < 40 && (!after || !before); k++) {
    const q = S.makeQuestion(t, 'monthNext', dec, seeded(k));
    if (q.ask.includes('после')) after = q.answer;
    const q2 = S.makeQuestion(t, 'monthNext', jan, seeded(k));
    if (q2.ask.includes('перед')) before = q2.answer;
  }
  assert.equal(after, 'January');
  assert.equal(before, 'December');
});

test('проверка ответа: регистр и пробелы не важны, дефис в числах — важен', () => {
  const q = S.makeQuestion(S.topic('numbers'), 'numType', S.numberItem(45));
  assert.equal(S.check(q, ' Forty-Five ').ok, true);
  assert.equal(S.check(q, 'forty–five').ok, true);          // длинное тире тоже дефис
  const noHyphen = S.check(q, 'forty five');
  assert.equal(noHyphen.ok, false);
  assert.match(noHyphen.note, /дефис/);
  const fourty = S.check(q, 'fourty-five');
  assert.equal(fourty.ok, false);
  assert.match(fourty.note, /без u/);
  const hundred = S.makeQuestion(S.topic('numbers'), 'numType', S.numberItem(100));
  assert.equal(S.check(hundred, 'a hundred').ok, true);
});

test('набор вопросов: нужное число, без повторов слов, темы чередуются', () => {
  const ids = ['sports', 'places', 'months', 'numbers', 'seasons'];
  const qs = S.makeSession(ids, 20, { study: {} }, seeded(3));
  assert.equal(qs.length, 20);
  const nonNum = qs.filter(q => q.topic !== 'numbers').map(q => q.id);
  assert.ok(new Set(nonNum).size >= nonNum.length - 2);
  for (const id of ids) assert.ok(qs.some(q => q.topic === id), id);
});

test('слабые слова попадаются чаще', () => {
  const st = { study: { weak: { 'sports:hockey': 3 } } };
  let hockey = 0;
  for (let k = 1; k <= 200; k++) {
    const qs = S.makeSession(['sports'], 1, st, seeded(k));
    if (qs[0].item.en === 'hockey') hockey++;
  }
  assert.ok(hockey > 200 / 14 * 2, `hockey ${hockey}`);
});

test('прогресс: «знаю», слабые слова, лучший результат', () => {
  const st = {};
  const t = S.topic('seasons');
  const winter = S.items(t)[0];
  S.setKnown(st, 'seasons', winter, true);
  assert.equal(S.topicProgress(st, t).known, 1);
  const q = S.makeQuestion(t, 'ru2en', winter);
  S.recordAnswer(st, q, false);
  S.recordAnswer(st, q, false);
  assert.equal(S.weakItems(st, t).length, 1);
  S.recordAnswer(st, q, true);
  S.recordAnswer(st, q, true);
  assert.equal(S.weakItems(st, t).length, 0);
  S.saveBest(st, 'seasons', 70);
  S.saveBest(st, 'seasons', 60);
  assert.equal(S.topicProgress(st, t).best, 70);
});

test('оценка как в школе', () => {
  assert.equal(S.mark(100), 5);
  assert.equal(S.mark(90), 5);
  assert.equal(S.mark(80), 4);
  assert.equal(S.mark(60), 3);
  assert.equal(S.mark(30), 2);
});

test('у всех слов есть транскрипция, перевод и пример', () => {
  for (const u of S.units()) for (const t of u.topics) {
    for (const it of S.items(t)) {
      assert.ok(it.ipa, `${t.id}/${it.en} ipa`);
      assert.ok(it.ru, `${t.id}/${it.en} ru`);
      if (t.items !== 'numbers') assert.ok(it.ex && it.exRu, `${t.id}/${it.en} ex`);
    }
  }
});
