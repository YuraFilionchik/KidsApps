// Юнит-тесты слияния профилей: node --test tests/unit/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { mergeProfiles } = require('../../kotomatika/js/merge.js');

function profile(over = {}) {
  return {
    id: 'p1', name: 'Маша', pinHash: 'h', createdAt: 1000, updatedAt: 2000,
    fish: 50, xp: 100, totalCorrect: 80, totalWrong: 10, bestCombo: 5, blitzBest: 12,
    bossLevel: 2, bossWins: 1, perfectCount: 1, purchases: 2,
    cat: { fur: 'ginger', breed: 'home', hat: 'bow', bg: 'meadow' },
    owned: ['hat:bow'], pets: ['puppy'], pet: 'puppy', breedsSeen: ['home'],
    stars: { w2: 3, w3: 1 }, colStars: { a1: 2 },
    facts: { '2x3': { box: 3, r: 4, w: 1 } },
    achievements: { first: 500 },
    daily: { date: '2026-10-12', correct: 10, claimed: false },
    streak: { count: 2, best: 4, lastDate: '2026-10-11' },
    farm: { food: 5, size: 3, pond: [null, null, null], harvested: 2 },
    settings: { sound: true },
    ...over,
  };
}

test('слияние с самим собой ничего не меняет', () => {
  const p = profile();
  const m = mergeProfiles(p, JSON.parse(JSON.stringify(p)));
  assert.deepEqual({ ...m, owned: m.owned, pets: m.pets }, { ...p, owned: [...p.owned].sort(), pets: [...p.pets].sort(), breedsSeen: [...p.breedsSeen].sort() });
});

test('порядок аргументов не влияет на результат', () => {
  const a = profile({ updatedAt: 3000, fish: 10, stars: { w2: 1, w4: 2 } });
  const b = profile({ updatedAt: 2500, fish: 99, xp: 500, owned: ['hat:cap'] });
  assert.deepEqual(mergeProfiles(a, b), mergeProfiles(b, a));
  // и при одинаковом времени тоже
  const c = profile({ updatedAt: 3000, fish: 1 });
  assert.deepEqual(mergeProfiles(a, c), mergeProfiles(c, a));
});

test('достижения из обеих версий сохраняются', () => {
  const phone = profile({ updatedAt: 3000, stars: { w2: 3, w3: 1 }, colStars: { a1: 1 }, achievements: { first: 500, boss1: 900 }, pets: ['puppy'], owned: ['hat:bow'], breedsSeen: ['home', 'tabby'] });
  const tablet = profile({ updatedAt: 2500, stars: { w2: 1, w3: 3, w4: 2 }, colStars: { a1: 3, a2: 1 }, achievements: { first: 400, c100: 800 }, pets: ['owl'], owned: ['hat:cap'], breedsSeen: ['home', 'british'] });
  const m = mergeProfiles(phone, tablet);
  assert.deepEqual(m.stars, { w2: 3, w3: 3, w4: 2 });
  assert.deepEqual(m.colStars, { a1: 3, a2: 1 });
  assert.deepEqual(m.achievements, { first: 400, boss1: 900, c100: 800 });
  assert.deepEqual(m.pets, ['owl', 'puppy']);
  assert.deepEqual(m.owned, ['hat:bow', 'hat:cap']);
  assert.deepEqual(m.breedsSeen, ['british', 'home', 'tabby']);
});

test('растущие счётчики — максимум', () => {
  const a = profile({ updatedAt: 3000, xp: 100, totalCorrect: 80, blitzBest: 30, bossWins: 1, farm: { food: 1, size: 3, pond: [], harvested: 2 } });
  const b = profile({ updatedAt: 2000, xp: 250, totalCorrect: 60, blitzBest: 12, bossWins: 4, farm: { food: 9, size: 4, pond: [], harvested: 7 } });
  const m = mergeProfiles(a, b);
  assert.equal(m.xp, 250);
  assert.equal(m.totalCorrect, 80);
  assert.equal(m.blitzBest, 30);
  assert.equal(m.bossWins, 4);
  assert.equal(m.farm.harvested, 7);
});

test('рыбки, наряд, питомец и пруд — из более новой версии', () => {
  const newer = profile({ updatedAt: 5000, fish: 7, cat: { fur: 'galaxy', hat: 'royal' }, pet: 'owl', farm: { food: 1, size: 4, pond: [{ sp: 'carp', fed: 3 }], harvested: 1 } });
  const older = profile({ updatedAt: 4000, fish: 900, cat: { fur: 'gray', hat: null }, pet: 'puppy', farm: { food: 50, size: 3, pond: [], harvested: 3 } });
  const m = mergeProfiles(older, newer);
  assert.equal(m.fish, 7);
  assert.deepEqual(m.cat, { fur: 'galaxy', hat: 'royal' });
  assert.equal(m.pet, 'owl');
  assert.equal(m.farm.food, 1);
  assert.equal(m.farm.size, 4);
  assert.deepEqual(m.farm.pond, [{ sp: 'carp', fed: 3 }]);
  assert.equal(m.farm.harvested, 3);
  assert.equal(m.updatedAt, 5000);
});

test('выученные примеры: побеждает версия с большим числом ответов', () => {
  const a = profile({ facts: { '2x3': { box: 5, r: 9, w: 0 }, '4x7': { box: 1, r: 1, w: 2 } } });
  const b = profile({ facts: { '2x3': { box: 2, r: 3, w: 1 }, '4x7': { box: 3, r: 5, w: 1 }, d6x8: { box: 1, r: 1, w: 0 } } });
  const m = mergeProfiles(a, b);
  assert.deepEqual(m.facts, { '2x3': { box: 5, r: 9, w: 0 }, '4x7': { box: 3, r: 5, w: 1 }, d6x8: { box: 1, r: 1, w: 0 } });
});

test('серия дней и задание дня', () => {
  const a = profile({ streak: { count: 1, best: 3, lastDate: '2026-10-12' }, daily: { date: '2026-10-12', correct: 5, claimed: false } });
  const b = profile({ streak: { count: 6, best: 6, lastDate: '2026-10-09' }, daily: { date: '2026-10-12', correct: 20, claimed: true } });
  const m = mergeProfiles(a, b);
  assert.deepEqual(m.streak, { count: 1, best: 6, lastDate: '2026-10-12' });
  assert.deepEqual(m.daily, { date: '2026-10-12', correct: 20, claimed: true });
  const c = profile({ daily: { date: '2026-10-13', correct: 1, claimed: false } });
  assert.deepEqual(mergeProfiles(b, c).daily, { date: '2026-10-13', correct: 1, claimed: false });
});

test('профиль старого формата без новых полей сливается без ошибок', () => {
  const old = { id: 'p1', name: 'Маша', fish: 5, xp: 10, stars: { w2: 1 }, cat: { fur: 'ginger' } };
  const m = mergeProfiles(old, profile());
  assert.equal(m.stars.w2, 3);
  assert.deepEqual(m.pets, ['puppy']);
  assert.equal(m.xp, 100);
});
