// Слияние двух версий одного профиля (например, ребёнок играл на телефоне и на планшете).
// Главное правило: достижения никогда не теряются. Растущие счётчики — максимум, коллекции — объединение,
// а «тратящиеся» и выбранные вещи (рыбки, наряд, пруд) берутся из более новой версии.
// Чистая функция без зависимостей: работает в браузере и в Node.js (тесты в tests/unit).
'use strict';

const MERGE_MAX_FIELDS = ['xp', 'totalCorrect', 'totalWrong', 'bestCombo', 'blitzBest', 'bossWins', 'bossLevel', 'perfectCount', 'purchases'];
const MERGE_UNION_FIELDS = ['owned', 'pets', 'breedsSeen'];

function mergeProfiles(a, b) {
  const clone = x => JSON.parse(JSON.stringify(x));
  // Более новая версия — по updatedAt; при равенстве выбираем детерминированно, чтобы merge(a, b) == merge(b, a).
  const ta = a.updatedAt || 0;
  const tb = b.updatedAt || 0;
  const aNewer = ta !== tb ? ta > tb : JSON.stringify(a) >= JSON.stringify(b);
  const newer = aNewer ? a : b;
  const older = aNewer ? b : a;
  const out = clone(newer);

  for (const k of MERGE_MAX_FIELDS) out[k] = Math.max(a[k] || 0, b[k] || 0);
  out.createdAt = Math.min(a.createdAt || Infinity, b.createdAt || Infinity);
  if (out.createdAt === Infinity) delete out.createdAt;
  out.updatedAt = Math.max(ta, tb) || undefined;
  if (out.updatedAt === undefined) delete out.updatedAt;

  // Звёзды миров и уровней столбика — максимум по каждому ключу.
  for (const k of ['stars', 'colStars']) {
    const res = {};
    for (const src of [a[k] || {}, b[k] || {}]) for (const [id, v] of Object.entries(src)) res[id] = Math.max(res[id] || 0, v || 0);
    out[k] = res;
  }

  // Награды — объединение, дата получения — более ранняя.
  const ach = {};
  for (const src of [a.achievements || {}, b.achievements || {}]) {
    for (const [id, t] of Object.entries(src)) ach[id] = ach[id] ? Math.min(ach[id], t) : t;
  }
  out.achievements = ach;

  for (const k of MERGE_UNION_FIELDS) out[k] = [...new Set([...(a[k] || []), ...(b[k] || [])])].sort();

  // Выученные примеры — у какого устройства больше ответов на этот пример, тот и прав.
  const facts = {};
  for (const src of [a.facts || {}, b.facts || {}]) {
    for (const [k, f] of Object.entries(src)) {
      const cur = facts[k];
      const score = x => (x.r || 0) + (x.w || 0);
      if (!cur || score(f) > score(cur) || (score(f) === score(cur) && (f.box || 0) > (cur.box || 0))) facts[k] = clone(f);
    }
  }
  out.facts = facts;

  // Серия дней: рекорд — максимум, текущая серия — из версии с более поздним днём.
  const sa = a.streak || {};
  const sb = b.streak || {};
  const laterStreak = (sa.lastDate || '') >= (sb.lastDate || '') ? sa : sb;
  out.streak = { ...clone(laterStreak), best: Math.max(sa.best || 0, sb.best || 0) };

  // Задание дня: из более позднего дня; в один и тот же день — больше ответов, сундук открыт хотя бы раз.
  const da = a.daily || {};
  const db = b.daily || {};
  if ((da.date || '') === (db.date || '')) {
    out.daily = { date: da.date, correct: Math.max(da.correct || 0, db.correct || 0), claimed: !!(da.claimed || db.claimed) };
  } else {
    out.daily = clone((da.date || '') > (db.date || '') ? da : db);
  }

  // Ферма: пруд и корм — из новой версии, число пойманных рыб — максимум.
  if (out.farm || older.farm) {
    out.farm = { ...(out.farm || {}), harvested: Math.max((a.farm || {}).harvested || 0, (b.farm || {}).harvested || 0) };
  }
  return out;
}

if (typeof module !== 'undefined') module.exports = { mergeProfiles };
