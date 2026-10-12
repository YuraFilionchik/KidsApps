// Режим «Столбик»: сложение и вычитание в столбик, цифры вводятся справа налево.
'use strict';

const colRand = (min, max) => min + rand(max - min + 1);
const digitsOf = n => String(n).split('').reverse().map(Number);

// Генерируем пример под уровень (перебором, пока не подойдёт под условие).
function genColumn(levelId) {
  for (let k = 0; k < 1000; k++) {
    let a, b;
    if (levelId === 'a1' || levelId === 'a2') { a = colRand(11, 89); b = colRand(11, 89); }
    else if (levelId === 'a3') { a = colRand(101, 899); b = colRand(101, 899); }
    else if (levelId === 's1' || levelId === 's2') { a = colRand(20, 99); b = colRand(10, a - 1); }
    else { a = colRand(200, 999); b = colRand(100, a - 1); }
    const da = digitsOf(a), db = digitsOf(b);
    const op = levelId[0] === 'a' ? '+' : '-';
    if (levelId === 'a1' && !(da[0] + db[0] < 10 && da[1] + db[1] < 10)) continue;
    if (levelId === 'a2' && !(da[0] + db[0] >= 10)) continue;
    if (levelId === 'a3' && !(da[0] + db[0] >= 10 || da[1] + db[1] >= 10)) continue;
    if (levelId === 's1' && !(da[0] >= db[0] && da[1] >= db[1])) continue;
    if (levelId === 's2' && !(da[0] < db[0])) continue;
    if (levelId === 's3' && !(da[0] < db[0] || da[1] < db[1])) continue;
    return { a, b, op };
  }
  return { a: 23, b: 45, op: '+' };
}

// Разбиваем пример на шаги по разрядам: что пишем и что «держим в уме» / занимаем.
function columnSteps(a, b, op) {
  const res = op === '+' ? a + b : a - b;
  const da = digitsOf(a), db = digitsOf(b);
  const resLen = String(res).length;
  const steps = [];
  let carry = 0;
  for (let i = 0; i < resLen; i++) {
    const x = da[i] || 0, y = db[i] || 0;
    if (op === '+') {
      const val = x + y + carry;
      steps.push({ x, y, cin: carry, val, digit: val % 10, cout: val >= 10 ? 1 : 0, lead: i >= Math.max(da.length, db.length) });
      carry = val >= 10 ? 1 : 0;
    } else {
      let d = x - carry - y;
      const bor = d < 0 ? 1 : 0;
      if (bor) d += 10;
      steps.push({ x, y, cin: carry, digit: d, cout: bor });
      carry = bor;
    }
  }
  return { res, steps, width: Math.max(da.length, db.length, resLen) };
}

function columnHint(st, op) {
  if (op === '+') {
    if (st.lead) return 'Остался 1 в уме — пиши его впереди!';
    const sum = `${st.x} + ${st.y}${st.cin ? ' + 1 (в уме)' : ''} = ${st.val}`;
    return st.val >= 10 ? `${sum}. Пиши <b>${st.digit}</b>, а 1 держим в уме!` : `${sum}. Пиши <b>${st.digit}</b>.`;
  }
  const top = st.x - st.cin;
  let pre = st.cin ? `Здесь заняли 1, стало ${st.x} − 1 = ${top}. ` : '';
  if (top < 0) pre = 'Здесь 0, а мы заняли 1 — снова занимаем десяток! ';
  if (top < st.y) {
    const big = top + 10;
    return `${pre}Из ${Math.max(top, 0)} не вычесть ${st.y} — занимаем десяток у соседа: ${big} − ${st.y} = <b>${st.digit}</b>.`;
  }
  return `${pre}${top} − ${st.y} = <b>${st.digit}</b>.`;
}

function isColLevelOpen(i) {
  const l = COLUMN_LEVELS[i];
  const prev = COLUMN_LEVELS[i - 1];
  return !prev || prev.op !== l.op || (P.colStars[prev.id] || 0) > 0;
}

function screenColumnMenu() {
  const card = (l, i) => {
    const open = isColLevelOpen(i);
    const st = P.colStars[l.id] || 0;
    return `<button class="col-level ${open ? '' : 'locked'}" data-action="${open ? 'startColumn' : 'lockedCol'}" data-i="${i}">
      <span class="cl-icon">${open ? l.icon : '🔒'}</span>
      <span class="cl-text"><b>${l.name}</b><small>${l.desc}</small></span>
      <span class="stars">${'⭐'.repeat(st)}${'☆'.repeat(3 - st)}</span>
    </button>`;
  };
  const group = op => COLUMN_LEVELS.map((l, i) => (l.op === op ? card(l, i) : '')).join('');
  show(`<div class="screen">
    <div class="row-top"><button class="icon-btn" data-action="hub">←</button><h2>✏️ Столбик</h2><div class="pill fish">🐟 ${P.fish}</div></div>
    <p class="subtitle">Пиши ответ справа налево — с единиц. Котик подскажет, что держать в уме.</p>
    <h3>➕ Сложение</h3>${group('+')}
    <h3>➖ Вычитание</h3>${group('-')}
  </div>`);
}

function startColumn(i) {
  const level = COLUMN_LEVELS[i];
  S = { mode: 'column', levelIdx: i, level, n: 0, solved: 0, mistakes: 0, combo: 0, mood: 'normal', locked: false };
  show(`<div class="screen quiz mode-column">
    <div class="quiz-top">
      <button class="icon-btn" data-action="quitQuiz">✕</button>
      <div class="qprogress" id="qprogress"></div>
      <div class="pill fish" id="qfish">🐟 ${P.fish}</div>
    </div>
    <div class="stage" id="stage"></div>
    <div class="col-box" id="colBox"></div>
    <div class="answers keypad col-keypad" id="answers">
      ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-action="colKey" data-v="${n}">${n}</button>`).join('')}
      <button class="kp-del" data-action="colHelp">💡</button>
      <button data-action="colKey" data-v="0">0</button>
      <span></span>
    </div>
  </div>`);
  nextColumn();
}

function nextColumn() {
  const p = genColumn(S.level.id);
  Object.assign(S, p, columnSteps(p.a, p.b, p.op), { col: 0, ans: [], marks: {}, bad: false, locked: false });
  S.say = S.n === 0 ? 'Начинаем с единиц — с правого края! 👉' : 'Следующий пример!';
  S.mood = 'normal';
  renderColumn();
}

function renderColumn() {
  const w = S.width;
  const cell = (content, cls = '') => `<span class="cc ${cls}">${content}</span>`;
  const row = (fn, first = '') => {
    let h = cell(first, 'sign');
    for (let pos = w - 1; pos >= 0; pos--) h += fn(pos);
    return h;
  };
  const da = digitsOf(S.a), db = digitsOf(S.b);
  const marks = row(pos => cell(S.marks[pos] || '', 'mark'));
  const ra = row(pos => cell(da[pos] !== undefined ? da[pos] : ''));
  const rb = row(pos => cell(db[pos] !== undefined ? db[pos] : ''), S.op === '+' ? '+' : '−');
  const ans = row(pos => {
    if (pos >= S.steps.length) return cell('');
    if (S.ans[pos] !== undefined) return cell(S.ans[pos], 'ans done');
    return cell(pos === S.col ? '?' : '', 'ans' + (pos === S.col ? ' active' + (S.bad ? ' bad' : '') : ''));
  });
  document.getElementById('colBox').innerHTML = `<div class="col-grid" style="grid-template-columns:repeat(${w + 1}, var(--cw))">
    ${marks}${ra}${rb}<span class="col-line" style="grid-column:1 / span ${w + 1}"></span>${ans}
  </div>`;
  document.getElementById('stage').innerHTML = `<div class="adv-stage">
    <div class="cat-with-pet">${catHTML(P.cat, 96, S.mood)}${petHTML(P.pet, 28)}</div>
    <div class="bubble">${S.say}</div>
  </div>`;
  let paws = '';
  for (let i = 0; i < COLUMN_PER_LEVEL; i++) paws += `<span class="${i < S.solved ? 'on' : ''}">🐾</span>`;
  document.getElementById('qprogress').innerHTML = `<div class="paws">${paws}</div>`;
}

function colPress(v) {
  if (!S || S.mode !== 'column' || S.locked) return;
  const st = S.steps[S.col];
  const d = Number(v);
  if (d === st.digit) {
    S.ans[S.col] = d;
    S.bad = false;
    Sound.click();
    if (st.cout) {
      S.marks[S.col + 1] = S.op === '+' ? '1' : '•';
      S.say = S.op === '+' ? `Пишем ${st.digit}, а 1 держим в уме ☝️` : `Заняли десяток — ставим точку над соседом •`;
    } else {
      S.say = pick(['Верно!', 'Так!', 'Дальше влево 👈', 'Мур, правильно!']);
    }
    S.mood = 'happy';
    S.col++;
    if (S.col >= S.steps.length) return columnSolved();
  } else {
    S.mistakes++;
    S.bad = true;
    S.mood = 'sad';
    S.say = columnHint(st, S.op);
    Sound.wrong();
    P.totalWrong++;
    save();
  }
  renderColumn();
}

function columnSolved() {
  S.locked = true;
  S.solved++;
  S.n++;
  S.say = `Верно! ${S.a} ${S.op === '+' ? '+' : '−'} ${S.b} = ${S.res} 🎉`;
  Sound.correct();
  addFish(2);
  P.farm.food++; // за пример в столбик корма больше
  onAnyCorrect();
  save();
  renderColumn();
  later(() => (S.solved >= COLUMN_PER_LEVEL ? finishColumn() : nextColumn()), 1300);
}

function finishColumn() {
  const l = S.level;
  const stars = S.mistakes === 0 ? 3 : S.mistakes <= 2 ? 2 : 1;
  const prev = P.colStars[l.id] || 0;
  const first = prev === 0;
  P.colStars[l.id] = Math.max(prev, stars);
  if (stars === 3) P.perfectCount++;
  const bonus = stars * 5 * (hasPet('unicorn') ? 2 : 1) + (first ? 10 : 0);
  P.fish += bonus;
  checkAchievements();
  save();
  Sound.win();
  confetti(['✏️', '⭐', '🐟', '📐']);
  const next = COLUMN_LEVELS[S.levelIdx + 1];
  const canNext = next && isColLevelOpen(S.levelIdx + 1);
  screenResult({
    title: stars === 3 ? 'Идеально!' : stars === 2 ? 'Отлично!' : 'Уровень пройден!',
    stars, mood: 'happy',
    lines: [`Ошибок: ${S.mistakes}`, `Бонус: +${bonus} 🐟`],
    buttons: [
      canNext ? `<button class="btn big primary" data-action="startColumn" data-i="${S.levelIdx + 1}">Дальше: ${next.name} →</button>` : '',
      `<button class="btn" data-action="startColumn" data-i="${S.levelIdx}">Ещё раз</button>`,
      `<button class="btn" data-action="columnMenu">К уровням</button>`,
    ],
  });
}

Object.assign(actions, {
  columnMenu() { S = null; screenColumnMenu(); },
  startColumn(el) { startColumn(Number(el.dataset.i)); },
  lockedCol() { toast('🔒 Сначала пройди предыдущий уровень!'); },
  colKey(el) { colPress(el.dataset.v); },
  colHelp() {
    if (!S || S.locked) return;
    S.say = '💡 ' + columnHint(S.steps[S.col], S.op);
    renderColumn();
  },
});
