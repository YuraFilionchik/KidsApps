// Логика заданий: выбор примеров, варианты ответов, запоминание выученного.
'use strict';

const rand = n => Math.floor(Math.random() * n);
const pick = arr => arr[rand(arr.length)];
const shuffle = arr => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

function factKey(a, b) { return a <= b ? `${a}x${b}` : `${b}x${a}`; }

// op: 'mul' — умножение, 'div' — деление. У деления свои ключи, чтобы учитывать его отдельно.
function opKey(a, b, op = 'mul') { return (op === 'div' ? 'd' : '') + factKey(a, b); }

function factOf(p, a, b, op = 'mul') { return p.facts[opKey(a, b, op)] || { box: 0, r: 0, w: 0 }; }

// Коробки Лейтнера: 0 — не знаю, 5 — знаю отлично.
function recordFact(p, key, ok) {
  const f = p.facts[key] || { box: 0, r: 0, w: 0 };
  if (ok) { f.r++; f.box = Math.min(5, f.box + 1); } else { f.w++; f.box = Math.max(0, f.box - 2); }
  p.facts[key] = f;
}

function isMastered(f) { return f.box >= 4; }

function masteredTables(p) {
  const res = [];
  for (let t = 2; t <= 10; t++) {
    let all = true;
    for (let b = 2; b <= 10; b++) if (!isMastered(factOf(p, t, b))) { all = false; break; }
    if (all) res.push(t);
  }
  return res;
}

// Выбираем пример: чем хуже знаем факт, тем чаще он попадается.
function pickQuestion(p, tables, recent = [], allowMissing = true, op = 'mul') {
  const cands = [];
  for (const t of tables) {
    for (let b = 2; b <= 10; b++) {
      const k = opKey(t, b, op);
      if (recent.includes(k)) continue;
      const f = factOf(p, t, b, op);
      const seen = f.r + f.w > 0;
      const w = seen ? 1 + (5 - f.box) * 2 : 6;
      cands.push({ t, b, w, box: f.box });
    }
  }
  if (!cands.length) return pickQuestion(p, tables, [], allowMissing, op);
  const sum = cands.reduce((s, c) => s + c.w, 0);
  let r = Math.random() * sum;
  let c = cands[0];
  for (const x of cands) { r -= x.w; if (r <= 0) { c = x; break; } }
  // В делении делитель — номер таблицы: мир «:7» — это 56 : 7.
  if (op === 'div') return makeQuestion(c.t, c.b, 'div');
  const [a, b] = Math.random() < 0.5 ? [c.t, c.b] : [c.b, c.t];
  const missing = allowMissing && c.box >= 2 && Math.random() < 0.25;
  return makeQuestion(a, b, missing ? 'missing' : 'product');
}

function makeQuestion(a, b, type = 'product') {
  const hole = '<span class="q-hole">?</span>';
  if (type === 'div') {
    return { a, b, type, key: opKey(a, b, 'div'), text: `${a * b} : ${a} = ${hole}`, answer: b };
  }
  if (type === 'missing') {
    return { a, b, type, key: factKey(a, b), text: `${a} × ${hole} = ${a * b}`, answer: b };
  }
  return { a, b, type, key: factKey(a, b), text: `${a} × ${b} = ${hole}`, answer: a * b };
}

// Правдоподобные неверные варианты — соседние ответы таблицы.
function makeChoices(q, count = 4) {
  const ans = q.answer;
  let pool;
  if (q.type === 'missing' || q.type === 'div') {
    pool = [ans - 1, ans + 1, ans - 2, ans + 2, ans + 3].filter(x => x >= 1 && x <= 12);
  } else {
    const { a, b } = q;
    pool = [a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b, ans + 1, ans - 1, ans + 10, ans - 10];
    const rev = Number(String(ans).split('').reverse().join(''));
    if (ans >= 10) pool.push(rev);
  }
  const set = [...new Set(pool.filter(x => x > 0 && x !== ans))];
  const wrong = shuffle(set).slice(0, count - 1);
  while (wrong.length < count - 1) {
    const x = ans + rand(9) - 4;
    if (x > 0 && x !== ans && !wrong.includes(x)) wrong.push(x);
  }
  return shuffle([ans, ...wrong]);
}

function tipFor(a, b) {
  const t = TIP_PRIORITY.find(x => x === a || x === b);
  return t ? TIPS[t] : '';
}

const DIV_TIPS = {
  2:  'Разделить на 2 — значит разделить пополам.',
  5:  'На 5: раздели число на 10 и умножь на 2. 35 : 5 → 3,5 × 2 = 7.',
  10: 'На 10: просто убери 0 в конце! 70 : 10 = 7.',
};

// Для деления главный секрет — вспомнить умножение.
function divTipFor(a) {
  return DIV_TIPS[a] || `Вспомни таблицу на ${a}: какое число нужно умножить на ${a}, чтобы получилось делимое?`;
}

function levelInfo(xp) {
  let level = 1, need = 20, rest = xp;
  while (rest >= need) { rest -= need; level++; need += 10; }
  return { level, cur: rest, need, title: LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)] };
}

function isWorldUnlocked(p, i) {
  return i === 0 || (p.stars[WORLDS[i - 1].id] || 0) > 0;
}

// Мир деления открыт, когда пройден такой же мир умножения и предыдущий мир деления.
function isDivWorldUnlocked(p, i) {
  const mulDone = (p.stars[WORLDS[i].id] || 0) > 0;
  return mulDone && (i === 0 || (p.stars[DIV_WORLDS[i - 1].id] || 0) > 0);
}

// Таблицы из открытых миров (для босса).
function unlockedTables(p) {
  const s = new Set();
  WORLDS.forEach((w, i) => { if (isWorldUnlocked(p, i)) w.tables.forEach(t => s.add(t)); });
  return [...s].sort((x, y) => x - y);
}

// Таблицы деления, которые уже пройдены (босс иногда спрашивает и их).
function passedDivTables(p) {
  const s = new Set();
  DIV_WORLDS.forEach(w => { if ((p.stars[w.id] || 0) > 0) w.tables.forEach(t => s.add(t)); });
  return [...s];
}

function bossFor(level) {
  const b = BOSSES[(level - 1) % BOSSES.length];
  return {
    ...b,
    level,
    hp: 8 + level * 2,
    attackMs: Math.max(5000, 12000 - level * 700),
  };
}
