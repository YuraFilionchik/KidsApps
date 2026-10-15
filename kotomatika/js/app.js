// Экраны и игровые режимы «Котоматики».
// Файлы подключаются обычными <script>, поэтому функции верхнего уровня видны во всех файлах.
'use strict';

const app = document.getElementById('app');
let P = null;          // текущий игрок
let S = null;          // текущая игровая сессия
let draft = null;      // создание нового игрока
let pinState = null;   // ввод кода
let timers = [];

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const save = () => Store.save();

function every(fn, ms) { const id = setInterval(fn, ms); timers.push(() => clearInterval(id)); }
function later(fn, ms) { const id = setTimeout(fn, ms); timers.push(() => clearTimeout(id)); }
function stopTimers() { timers.forEach(f => f()); timers = []; }

function show(html) {
  stopTimers();
  closeModal();
  Sound.music(S && S.mode === 'blitz' ? 'blitz' : S && S.mode === 'boss' ? 'boss' : 'calm');
  app.innerHTML = html;
  window.scrollTo(0, 0);
}

// ---------- Всплывашки, окна, конфетти ----------

function toast(text) {
  let box = document.getElementById('toasts');
  if (!box) { box = document.createElement('div'); box.id = 'toasts'; document.body.appendChild(box); }
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = text;
  box.appendChild(el);
  setTimeout(() => el.classList.add('out'), 2600);
  setTimeout(() => el.remove(), 3100);
}

function modal(html, cls = '') {
  closeModal();
  const el = document.createElement('div');
  el.id = 'modal';
  el.className = 'modal-bg';
  el.innerHTML = `<div class="modal ${cls}">${html}</div>`;
  document.body.appendChild(el);
}
function closeModal() { const m = document.getElementById('modal'); if (m) m.remove(); }

function confetti(symbols = ['🐟', '⭐', '🐾', '🎉', '💖']) {
  const layer = document.createElement('div');
  layer.className = 'confetti';
  for (let i = 0; i < 36; i++) {
    const s = document.createElement('span');
    s.textContent = pick(symbols);
    s.style.left = Math.random() * 100 + '%';
    s.style.animationDuration = 1.6 + Math.random() * 1.6 + 's';
    s.style.animationDelay = Math.random() * 0.5 + 's';
    s.style.fontSize = 18 + rand(22) + 'px';
    layer.appendChild(s);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 4000);
}

// ---------- Награды игроку ----------

function addFish(n) {
  if (n <= 0) return;
  P.fish += n;
  const el = document.getElementById('qfish');
  if (el) { el.textContent = '🐟 ' + P.fish; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
}

function ensureDaily() {
  const t = Store.todayStr();
  if (P.daily.date !== t) P.daily = { date: t, correct: 0, claimed: false };
}

const hasPet = id => P.pet === id;

function onAnyCorrect() {
  ensureDaily();
  const lvBefore = levelInfo(P.xp).level;
  P.xp += hasPet('chick') ? 2 : 1;
  P.totalCorrect++;
  P.daily.correct++;
  // Каждый верный ответ — корм для рыб на ферме.
  P.farm.food++;
  if (hasPet('hamster') && P.totalCorrect % 5 === 0) P.farm.food++;
  if (hasPet('panda') && P.totalCorrect % 3 === 0) {
    P.farm.food += 2;
    toast('🐼 Пандочка нашла +2 🦐 корма!');
  }
  if (P.daily.correct === DAILY_GOAL) {
    updateStreak();
    toast('🎁 Задание дня выполнено! Открой сундук в меню');
  }
  const lv = levelInfo(P.xp);
  if (lv.level > lvBefore) {
    toast(`🎉 Новый уровень ${lv.level}: <b>${lv.title}</b>!`);
    Sound.levelUp();
  }
  checkAchievements();
}

function updateStreak() {
  const t = Store.todayStr();
  const y = new Date(); y.setDate(y.getDate() - 1);
  const ys = Store.todayStr(y);
  if (P.streak.lastDate === t) return;
  P.streak.count = P.streak.lastDate === ys ? P.streak.count + 1 : 1;
  P.streak.lastDate = t;
  P.streak.best = Math.max(P.streak.best, P.streak.count);
}

function checkAchievements() {
  for (const a of ACHIEVEMENTS) {
    if (!P.achievements[a.id] && a.test(P)) {
      P.achievements[a.id] = Date.now();
      P.fish += 10;
      toast(`🏆 Новая награда: ${a.icon} <b>${a.name}</b> (+10 🐟)`);
      Sound.achieve();
    }
  }
  for (const b of BREEDS) {
    if (!P.breedsSeen.includes(b.id) && b.test(P)) {
      P.breedsSeen.push(b.id);
      toast(`🐈 Новый котик в коллекции: <b>${b.name}</b>!`);
    }
  }
}

function owns(slot, item) {
  return item.price === 0 || P.owned.includes(slot + ':' + item.id);
}

function grantSpecial(slot, id, text) {
  const key = slot + ':' + id;
  if (P.owned.includes(key)) return;
  P.owned.push(key);
  toast(text);
}

// ---------- Вход: выбор игрока ----------

function screenProfiles() {
  const list = Store.list();
  show(`<div class="screen center profiles-screen">
    <h1 class="logo">Кото<span>матика</span></h1>
    <p class="subtitle">Учим таблицу умножения вместе с котиками</p>
    ${list.length ? `
      <h2>Кто играет?</h2>
      <div class="profiles">
        ${list.map(p => `<button class="profile-card" data-action="pickProfile" data-id="${p.id}">
            ${catHTML(p.cat, 88)}<b>${esc(p.name)}</b><small>ур. ${levelInfo(p.xp).level} · 🐟 ${p.fish}</small>
          </button>`).join('')}
        <button class="profile-card add" data-action="newProfile"><span class="plus">+</span><b>Новый игрок</b></button>
      </div>` : `
      <div class="hello">
        ${catHTML({ fur: 'ginger', hat: 'bow', bg: 'meadow' }, 170, 'happy')}
        <div class="bubble">Привет! Я котик Мурчик. Давай вместе выучим таблицу умножения и соберём кучу рыбок! 🐾</div>
        <button class="btn big primary" data-action="newProfile">Начать игру!</button>
      </div>`}
    <button class="btn ghost parent-link" data-action="parent">👨‍👩‍👧 Для родителей · ☁️ сохранения в облаке</button>
  </div>`);
}

function screenNewProfile() {
  if (!draft) draft = { step: 'name', name: '', fur: 'ginger', pin: [] };
  if (draft.step === 'name') {
    const starters = SHOP.fur.items.filter(i => i.price === 0);
    show(`<div class="screen center">
      <div class="row-top"><button class="icon-btn" data-action="toProfiles">←</button></div>
      <h2>Как тебя зовут?</h2>
      <input id="nameInput" class="text-input" maxlength="14" placeholder="Твоё имя" value="${esc(draft.name)}" autocomplete="off">
      <h2>Выбери котика</h2>
      <div class="fur-pick">
        ${starters.map(f => `<button class="fur-opt ${draft.fur === f.id ? 'sel' : ''}" data-action="draftFur" data-id="${f.id}">
          ${catHTML({ fur: f.id, bg: 'room' }, 78, 'happy')}<small>${f.name}</small></button>`).join('')}
      </div>
      <button class="btn big primary" data-action="draftNext">Дальше →</button>
    </div>`);
    const inp = document.getElementById('nameInput');
    inp.addEventListener('input', () => { draft.name = inp.value; });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') actions.draftNext(); });
  } else {
    const done = draft.pin.length === PIN_LENGTH;
    show(`<div class="screen center">
      <div class="row-top"><button class="icon-btn" data-action="draftBack">←</button></div>
      <h2>Придумай секретный код</h2>
      <p class="subtitle">Нажми ${PIN_LENGTH} картинки. Код нужен, чтобы никто другой не играл за тебя.</p>
      ${pinSlots(draft.pin, true)}
      ${done ? `<div class="bubble small">Запомни свой код: <b class="big-emoji">${draft.pin.map(i => PIN_SYMBOLS[i]).join(' ')}</b></div>
        <button class="btn big primary" data-action="draftCreate">Готово! 🎉</button>
        <button class="btn ghost" data-action="pinClear">Стереть</button>`
      : pinPad('draftPin')}
    </div>`);
  }
}

function pinSlots(arr, visible) {
  let html = '<div class="pin-slots">';
  for (let i = 0; i < PIN_LENGTH; i++) {
    const v = arr[i];
    html += `<span class="${v !== undefined ? 'on' : ''}">${v !== undefined ? (visible ? PIN_SYMBOLS[v] : '🐾') : ''}</span>`;
  }
  return html + '</div>';
}

function pinPad(action) {
  return `<div class="pin-pad">${PIN_SYMBOLS.map((s, i) => `<button data-action="${action}" data-i="${i}">${s}</button>`).join('')}</div>`;
}

function screenPin() {
  const p = Store.get(pinState.id);
  const first = pinState.fails >= 2 ? Store.pinFirstSymbol(p) : null;
  const hint = first !== null ? `<p class="hint">Подсказка: код начинается с ${PIN_SYMBOLS[first]}</p>` : '';
  show(`<div class="screen center">
    <div class="row-top"><button class="icon-btn" data-action="toProfiles">←</button></div>
    ${catHTML(p.cat, 120)}
    <h2>Привет, ${esc(p.name)}!</h2>
    <p class="subtitle">Введи свой секретный код</p>
    <div id="pinSlotsBox">${pinSlots(pinState.entered, false)}</div>
    ${hint}
    ${pinPad('pinTap')}
  </div>`);
}

function login(p) {
  P = p;
  Store.setCurrent(p.id);
  ensureDaily();
  Sound.musicChanged();
  Sound.meow();
  screenHub();
}

// ---------- Главное меню ----------

function screenHub() {
  ensureDaily();
  const lv = levelInfo(P.xp);
  const d = P.daily;
  const dPct = Math.min(100, d.correct / DAILY_GOAL * 100);
  const boss = bossFor(P.bossLevel);
  const achCount = Object.keys(P.achievements).length;
  const greet = pick(['Мяу! Во что поиграем?', 'Привет! Я соскучился 🐾', 'Мур! Готов к приключениям!', 'Давай заработаем рыбок!']);
  show(`<div class="screen hub">
    <header class="topbar">
      <button class="avatar-btn" data-action="shop" title="Мой котик">${catHTML(P.cat, 58)}</button>
      <div class="who">
        <b>${esc(P.name)}</b>
        <small>${lv.title} · ур. ${lv.level}</small>
        <div class="xpbar"><i style="width:${lv.cur / lv.need * 100}%"></i></div>
      </div>
      <div class="pill fish">🐟 ${P.fish}</div>
      <span id="cloudBadge">${cloudBadgeHTML()}</span>
      <button class="icon-btn" data-action="settings" title="Настройки">⚙️</button>
    </header>

    <div class="hub-cat">
      <button class="cat-pet" data-action="petCat">${catHTML(P.cat, 150, 'happy')}${petHTML(P.pet, 48)}</button>
      <div class="bubble">${greet}</div>
    </div>

    <div class="card daily">
      <div class="daily-head"><b>🎯 Задание дня</b><span class="streak" title="Дней подряд">🔥 ${P.streak.count}</span></div>
      <div class="daily-text">Реши ${DAILY_GOAL} примеров правильно</div>
      <div class="bar"><i style="width:${dPct}%"></i><span>${Math.min(d.correct, DAILY_GOAL)} / ${DAILY_GOAL}</span></div>
      ${d.correct >= DAILY_GOAL && !d.claimed ? '<button class="btn gold wide" data-action="claimDaily">🎁 Открыть сундук!</button>'
        : d.claimed ? '<div class="done">✅ Сундук открыт. Приходи завтра!</div>' : ''}
    </div>

    <div class="tiles">
      <button class="tile t-adv wide" data-action="map"><span class="ti">🗺️</span><span class="tw"><b>Приключение</b><small>Умножение × и деление : — путешествуй по мирам</small></span></button>
      <button class="tile t-col" data-action="columnMenu"><span class="ti">✏️</span><b>Столбик</b><small>Сложение и вычитание</small></button>
      <button class="tile t-blitz" data-action="blitzSetup"><span class="ti">⚡</span><b>Блиц</b><small>60 секунд на скорость</small></button>
      <button class="tile t-boss" data-action="bossIntro"><span class="ti">${boss.icon}</span><b>Битва с боссом</b><small>${boss.name}, ур. ${boss.level}</small></button>
      <button class="tile t-house" data-action="house"><span class="ti">🏡</span><b>Кото-домик</b><small>Комната твоего котика</small></button>
      <button class="tile t-farm" data-action="farm"><span class="ti">🎣</span><b>Кото-ферма</b><small>${farmStatus()}</small></button>
      <button class="tile t-pets" data-action="pets"><span class="ti">🥚</span><b>Питомцы</b><small>${P.pets.length} из ${PETS.length} друзей</small></button>
      <button class="tile t-coll" data-action="collection"><span class="ti">🐈</span><b>Коллекция</b><small>${BREEDS.filter(b => b.test(P)).length} из ${BREEDS.length} пород</small></button>
      <button class="tile t-shop" data-action="shop"><span class="ti">🛍️</span><b>Наряды</b><small>Одень своего котика</small></button>
      <button class="tile t-ach" data-action="achievements"><span class="ti">🏆</span><b>Награды</b><small>${achCount} из ${ACHIEVEMENTS.length}</small></button>
    </div>
  </div>`);
}

function settingsModal() {
  modal(`<h2>Настройки</h2>
    <button class="btn wide" data-action="toggleSound">${P.settings.sound ? '🔊 Звуки включены' : '🔇 Звуки выключены'}</button>
    <button class="btn wide" data-action="toggleMusic">${P.settings.music !== false ? '🎵 Музыка включена' : '🔇 Музыка выключена'}</button>
    ${P.settings.music !== false ? `<div class="chips music-vol">${['🔈 Тихо', '🔉 Средне', '🔊 Громко'].map((t, i) =>
      `<button class="chip ${(P.settings.musicVol || 2) === i + 1 ? 'sel' : ''}" data-action="musicVol" data-v="${i + 1}">${t}</button>`).join('')}</div>` : ''}
    <button class="btn wide" data-action="logout">👥 Сменить игрока</button>
    <button class="btn wide" data-action="parent">👨‍👩‍👧 Для родителей</button>
    <button class="btn wide danger" data-action="deleteProfile">🗑️ Удалить игрока</button>
    <button class="btn wide ghost" data-action="closeModal">Закрыть</button>`);
}

// ---------- Карта приключений ----------

let mapOp = 'mul';

function screenMap() {
  const offsets = [0, 1, 2, 1, 0, -1, -2, -1];
  const isDiv = mapOp === 'div';
  const list = isDiv ? DIV_WORLDS : WORLDS;
  const sign = isDiv ? ':' : '×';
  const nodes = list.map((w, i) => {
    const open = isDiv ? isDivWorldUnlocked(P, i) : isWorldUnlocked(P, i);
    const st = P.stars[w.id] || 0;
    const isNext = open && st === 0;
    return `<div class="map-step" style="--x:${offsets[i % offsets.length]}">
      <button class="map-node ${open ? '' : 'locked'} ${isNext ? 'next' : ''}" style="--c:${w.color}"
        data-action="${open ? 'startAdventure' : 'lockedWorld'}" data-i="${i}" data-op="${mapOp}">
        <span class="mn-icon">${open ? w.icon : '🔒'}</span>
        <span class="mn-table">${w.tables.length > 1 ? 'микс' : sign + w.tables[0]}</span>
      </button>
      <div class="map-label"><b>${w.name}</b><span class="stars">${'⭐'.repeat(st)}${'☆'.repeat(3 - st)}</span></div>
      ${isNext ? `<div class="map-cat">${catHTML(P.cat, 54, 'happy', false)}</div>` : ''}
    </div>${i < list.length - 1 ? '<div class="map-paws">🐾</div>' : ''}`;
  }).join('');
  show(`<div class="screen map">
    <div class="row-top"><button class="icon-btn" data-action="hub">←</button><h2>Карта миров</h2><button class="icon-btn" data-action="knowledge" title="Карта знаний">📊</button></div>
    <div class="seg">
      <button class="${isDiv ? '' : 'sel'}" data-action="mapOp" data-op="mul">× Умножение</button>
      <button class="${isDiv ? 'sel' : ''}" data-action="mapOp" data-op="div">: Деление</button>
    </div>
    <p class="subtitle">${isDiv
      ? 'Делим угощение поровну между котиками! Мир деления открывается, когда пройден такой же мир умножения.'
      : 'Пройди мир, чтобы открыть следующий. Без ошибок — 3 звезды!'}</p>
    <div class="map-path">${nodes}</div>
  </div>`);
}

// ---------- Общий экран игры ----------

function quizLayout() {
  return `<div class="screen quiz mode-${S.mode}">
    <div class="quiz-top">
      <button class="icon-btn" data-action="quitQuiz">✕</button>
      <div class="qprogress" id="qprogress"></div>
      <div class="pill fish" id="qfish">🐟 ${P.fish}</div>
    </div>
    <div class="stage" id="stage"></div>
    <div class="question" id="question"></div>
    <div class="answers" id="answers"></div>
  </div>`;
}

function nextQuestion() {
  let q = null;
  if (S.retry) {
    S.retry.forEach(r => r.wait--);
    const idx = S.retry.findIndex(r => r.wait <= 0);
    if (idx >= 0) {
      const r = S.retry.splice(idx, 1)[0];
      q = makeQuestion(r.a, r.b, r.type);
    }
  }
  if (!q && S.divTables && S.divTables.length && Math.random() < 0.3) q = pickQuestion(P, S.divTables, S.recent, false, 'div');
  if (!q) q = pickQuestion(P, S.tables, S.recent, S.mode !== 'adventure' || S.qn > 2, S.op || 'mul');
  S.recent = [q.key, ...S.recent].slice(0, 3);
  S.q = q;
  S.qn++;
  S.typed = '';
  S.locked = false;
  S.qStart = performance.now();
  const qEl = document.getElementById('question');
  qEl.innerHTML = q.text;
  qEl.classList.remove('pop'); void qEl.offsetWidth; qEl.classList.add('pop');
  renderAnswers();
}

function renderAnswers() {
  const box = document.getElementById('answers');
  if (S.input === 'keypad') {
    box.className = 'answers keypad';
    box.innerHTML = `<div class="kp-display" id="kpDisplay">&nbsp;</div>
      ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-action="kp" data-v="${n}">${n}</button>`).join('')}
      <button class="kp-del" data-action="kp" data-v="del">⌫</button>
      <button data-action="kp" data-v="0">0</button>
      <button class="kp-ok" data-action="kp" data-v="ok">✓</button>`;
  } else {
    const count = S.mode === 'adventure' && hasPet('parrot') ? 3 : 4;
    box.className = 'answers choices' + (count === 3 ? ' three' : '');
    box.innerHTML = makeChoices(S.q, count).map(v => `<button class="choice" data-action="choose" data-v="${v}">${v}</button>`).join('');
  }
}

function kpPress(v) {
  if (S.locked) return;
  if (v === 'del') S.typed = S.typed.slice(0, -1);
  else if (v === 'ok') { if (S.typed) answer(Number(S.typed)); return; }
  else if (S.typed.length < 3) S.typed += v;
  document.getElementById('kpDisplay').innerHTML = S.typed || '&nbsp;';
  const need = String(S.q.answer).length;
  if (Number(S.typed) === S.q.answer) answer(S.q.answer);
  else if (S.typed.length >= need && S.mode === 'blitz') answer(Number(S.typed));
}

function answer(val, btn) {
  if (S.locked) return;
  S.locked = true;
  const q = S.q;
  const ok = val === q.answer;
  const dt = (performance.now() - S.qStart) / 1000;
  recordFact(P, q.key, ok);
  const qEl = document.getElementById('question');
  if (ok) {
    S.combo++;
    S.correct++;
    P.bestCombo = Math.max(P.bestCombo, S.combo);
    qEl.innerHTML = q.text.replace('<span class="q-hole">?</span>', `<span class="q-ok">${q.answer}</span>`);
    if (btn) btn.classList.add('ok');
    Sound.correct(S.combo);
    addFish(1);
    if (hasPet('bunny') && S.combo % 5 === 0) addFish(1);
    onAnyCorrect();
  } else {
    S.combo = 0;
    S.mistakes++;
    P.totalWrong++;
    qEl.innerHTML = q.text.replace('<span class="q-hole">?</span>', `<span class="q-bad">${q.answer}</span>`);
    if (btn) btn.classList.add('bad');
    document.querySelectorAll('.choice').forEach(b => { if (Number(b.dataset.v) === q.answer) b.classList.add('ok'); });
    Sound.wrong();
  }
  save();
  MODES[S.mode].after(ok, dt);
}

function comboBadge() {
  return S.combo >= 3 ? `<div class="combo">🔥 ×${S.combo}</div>` : '';
}

// ---------- Режим: приключение ----------

const MODES = {};

const worldsFor = op => (op === 'div' ? DIV_WORLDS : WORLDS);
const worldOpen = (op, i) => (op === 'div' ? isDivWorldUnlocked(P, i) : isWorldUnlocked(P, i));

function startAdventure(i, op = 'mul') {
  const w = worldsFor(op)[i];
  const say = op === 'div' ? `${w.icon} Делим угощение поровну! Поехали!` : `Мир «${w.name}»! Поехали! 🐾`;
  S = { mode: 'adventure', op, world: i, tables: w.tables, input: 'choices', retry: [], recent: [], qn: 0, correct: 0, mistakes: 0, combo: 0, mood: 'normal', say };
  show(quizLayout());
  document.querySelector('.quiz').style.setProperty('--world', w.color);
  renderAdvStage();
  nextQuestion();
}

function renderAdvStage() {
  document.getElementById('stage').innerHTML = `<div class="adv-stage">
    <div class="cat-with-pet">${catHTML(P.cat, 120, S.mood)}${petHTML(P.pet, 34)}</div>
    <div class="bubble">${S.say}</div>
    ${comboBadge()}
  </div>`;
  let paws = '';
  for (let i = 0; i < LEVEL_TARGET; i++) paws += `<span class="${i < S.correct ? 'on' : ''}">🐾</span>`;
  document.getElementById('qprogress').innerHTML = `<div class="paws">${paws}</div>`;
}

MODES.adventure = {
  after(ok) {
    if (ok) {
      S.mood = 'happy';
      S.say = S.combo >= 5 ? `${S.combo} подряд! Ты огонь! 🔥` : pick(PRAISE);
      renderAdvStage();
      heroFx(S.combo % 5 === 0 ? 'combo' : 'hop');
      later(() => {
        if (S.correct >= LEVEL_TARGET) finishAdventure();
        else { S.mood = 'normal'; renderAdvStage(); nextQuestion(); }
      }, 700);
    } else {
      S.mood = 'sad';
      S.say = pick(COMFORT);
      S.retry.push({ a: S.q.a, b: S.q.b, type: S.q.type, wait: 3 });
      renderAdvStage();
      heroFx('droop');
      later(() => hintModal(S.q), 600);
    }
  },
};

function hintModal(q) {
  const { a, b } = q;
  let dots = '';
  for (let r = 0; r < b; r++) for (let c = 0; c < a; c++) dots += `<i class="r${r % 2}"></i>`;
  const sum = Array(b).fill(a).join(' + ');
  const treat = S.op === 'div' ? DIV_WORLDS[S.world].icon : '🐟';
  const main = q.type === 'div'
    ? `<p class="big-eq">${a * b} : ${a} = <b>${b}</b></p>
       <p>Раздели ${a * b} ${treat} поровну: сколько раз по <b>${a}</b> помещается в <b>${a * b}</b>?</p>
       <p>Проверяем умножением: ${a} × ${b} = ${a * b} ✔️</p>`
    : q.type === 'missing'
    ? `<p>Сколько раз нужно взять по <b>${a}</b>, чтобы получилось <b>${a * b}</b>?</p><p class="big-eq">${a * b} : ${a} = <b>${b}</b></p>`
    : `<p class="big-eq">${a} × ${b} = <b>${a * b}</b></p><p>Это по <b>${a}</b> взять <b>${b}</b> раз:<br>${sum} = ${a * b}</p>`;
  const tip = q.type === 'div' ? divTipFor(a) : tipFor(a, b);
  modal(`<h2>Давай разберёмся 🐾</h2>
    ${main}
    <div class="dots" style="grid-template-columns:repeat(${a}, var(--dot))">${dots}</div>
    ${tip ? `<p class="tip">💡 ${tip}</p>` : ''}
    <button class="btn big primary wide" data-action="hintOk">Понятно! 👍</button>`, 'hint-modal');
}

function finishAdventure() {
  const list = worldsFor(S.op);
  const w = list[S.world];
  const stars = S.mistakes === 0 ? 3 : S.mistakes <= 2 ? 2 : 1;
  const prev = P.stars[w.id] || 0;
  const first = prev === 0;
  P.stars[w.id] = Math.max(prev, stars);
  if (stars === 3) P.perfectCount++;
  const bonus = stars * 5 * (hasPet('unicorn') ? 2 : 1) + (first ? 10 : 0);
  P.fish += bonus;
  const lines = [`Ошибок: ${S.mistakes}`, `Бонус: +${bonus} 🐟`];
  const nextW = list[S.world + 1];
  if (first && nextW) lines.push(`Открыт новый мир: ${nextW.icon} <b>${nextW.name}</b>!`);
  if (WORLDS.every(x => (P.stars[x.id] || 0) > 0)) grantSpecial('neck', 'star', '🌟 Ты получила «Звезду мира» для котика!');
  checkAchievements();
  save();
  Sound.win();
  confetti();
  screenResult({
    title: stars === 3 ? 'Идеально!' : stars === 2 ? 'Отлично!' : 'Уровень пройден!',
    stars, mood: 'happy', lines,
    buttons: [
      nextW && worldOpen(S.op, S.world + 1) ? `<button class="btn big primary" data-action="startAdventure" data-i="${S.world + 1}" data-op="${S.op}">Следующий мир →</button>` : '',
      `<button class="btn" data-action="startAdventure" data-i="${S.world}" data-op="${S.op}">Ещё раз</button>`,
      `<button class="btn" data-action="map">На карту</button>`,
    ],
  });
}

function screenResult(r) {
  const starsHtml = r.stars !== undefined
    ? `<div class="result-stars">${[0, 1, 2].map(i => `<span class="${i < r.stars ? 'on' : ''}" style="animation-delay:${i * 0.25}s">⭐</span>`).join('')}</div>` : '';
  show(`<div class="screen center result">
    <h1>${r.title}</h1>
    ${starsHtml}
    ${r.big || ''}
    <div class="cat-with-pet ${r.mood === 'sad' ? 'fx-sulk' : 'fx-dance'}">${catHTML(P.cat, 150, r.mood)}${petHTML(P.pet, 44)}</div>
    <div class="result-lines">${r.lines.map(l => `<div>${l}</div>`).join('')}</div>
    <div class="result-btns">${r.buttons.join('')}</div>
  </div>`);
  Sound.music('calm');
}

// ---------- Режим: блиц ----------

let blitzTables = null;

function screenBlitzSetup() {
  if (!blitzTables) blitzTables = [2, 3, 4, 5, 6, 7, 8, 9, 10];
  show(`<div class="screen center">
    <div class="row-top"><button class="icon-btn" data-action="hub">←</button><h2>⚡ Блиц</h2><div class="pill">🏅 ${P.blitzBest}</div></div>
    <p class="subtitle">60 секунд. Вводи ответы как можно быстрее! Каждый верный ответ — рыбка.</p>
    <h3>Какие таблицы?</h3>
    <div class="chips">
      ${[2, 3, 4, 5, 6, 7, 8, 9, 10].map(t => `<button class="chip ${blitzTables.includes(t) ? 'sel' : ''}" data-action="blitzChip" data-t="${t}">×${t}</button>`).join('')}
    </div>
    <button class="btn ghost" data-action="blitzAll">Выбрать все</button>
    <button class="btn big primary" data-action="startBlitz">Старт! ⚡</button>
  </div>`);
}

function startBlitz() {
  if (!blitzTables.length) { toast('Выбери хотя бы одну таблицу'); return; }
  const total = hasPet('owl') ? 70000 : 60000;
  S = { mode: 'blitz', tables: [...blitzTables], input: 'keypad', recent: [], qn: 0, correct: 0, mistakes: 0, combo: 0, timeLeft: total, total };
  show(quizLayout());
  renderBlitzStage();
  nextQuestion();
  const t0 = performance.now();
  every(() => {
    S.timeLeft = Math.max(0, S.total - (performance.now() - t0));
    const bar = document.getElementById('timebar');
    if (bar) bar.style.width = (S.timeLeft / S.total * 100) + '%';
    const sec = document.getElementById('timesec');
    const left = Math.ceil(S.timeLeft / 1000);
    if (sec) sec.textContent = left;
    if (left <= 10 && left > 0 && left !== S.tickSec) { S.tickSec = left; Sound.tick(left <= 3); }
    if (S.timeLeft <= 0) finishBlitz();
  }, 100);
}

function renderBlitzStage() {
  document.getElementById('qprogress').innerHTML = `<div class="timebar"><i id="timebar" style="width:${S.timeLeft / S.total * 100}%"></i><span id="timesec">${Math.ceil(S.timeLeft / 1000)}</span></div>`;
  document.getElementById('stage').innerHTML = `<div class="blitz-stage">
    <div class="score"><small>Очки</small><b>${S.correct}</b></div>
    <div class="cat-with-pet">${catHTML(P.cat, 90, S.combo >= 3 ? 'happy' : 'normal')}</div>
    <div class="score"><small>Рекорд</small><b>${Math.max(P.blitzBest, S.correct)}</b></div>
    ${comboBadge()}
  </div>`;
}

MODES.blitz = {
  after(ok) {
    if (ok) {
      if (S.combo > 0 && S.combo % 5 === 0) addFish(1);
      renderBlitzStage();
      heroFx(S.combo % 5 === 0 ? 'combo' : 'nod');
      later(nextQuestion, 250);
    } else {
      const d = document.getElementById('kpDisplay');
      if (d) { d.innerHTML = `<s>${esc(S.typed)}</s> → ${S.q.answer}`; d.classList.add('bad'); }
      renderBlitzStage();
      heroFx('droop');
      later(nextQuestion, 1100);
    }
  },
};

function finishBlitz() {
  stopTimers();
  S.locked = true;
  const record = S.correct > P.blitzBest;
  if (record) { P.blitzBest = S.correct; P.fish += 10; }
  checkAchievements();
  save();
  Sound.win();
  if (record) confetti(['⚡', '🏅', '🐟', '⭐']);
  screenResult({
    title: record ? 'Новый рекорд! 🏅' : 'Время вышло!',
    mood: 'happy',
    big: `<div class="big-score">${S.correct}</div>`,
    lines: [`Верных ответов: ${S.correct}`, `Ошибок: ${S.mistakes}`, record ? 'Бонус за рекорд: +10 🐟' : `Рекорд: ${P.blitzBest}`],
    buttons: [
      `<button class="btn big primary" data-action="startBlitz">Ещё раз ⚡</button>`,
      `<button class="btn" data-action="hub">В меню</button>`,
    ],
  });
}

// ---------- Режим: битва с боссом ----------

function bossIntro() {
  const boss = bossFor(P.bossLevel);
  const tables = unlockedTables(P);
  modal(`<div class="boss-big">${boss.icon}<span>${boss.crown}</span></div>
    <h2>${boss.name}</h2>
    <p>Уровень ${boss.level} · ❤️ ${boss.hp} ударов</p>
    <p>Отвечай правильно, чтобы бить босса. Быстрый ответ — <b>критический удар</b>!
    Если долго думать, босс атакует. У тебя 3 жизни.</p>
    <p class="tip">Примеры из открытых миров: ${tables.map(t => '×' + t).join(' ')}</p>
    <button class="btn big danger wide" data-action="startBoss">В бой! ⚔️</button>
    <button class="btn ghost wide" data-action="closeModal">Не сейчас</button>`);
}

function startBoss() {
  const boss = bossFor(P.bossLevel);
  if (hasPet('turtle')) boss.attackMs = Math.round(boss.attackMs * 1.3);
  const hearts = hasPet('puppy') ? 4 : 3;
  S = { mode: 'boss', boss, hp: boss.hp, hearts, maxHearts: hearts, tables: unlockedTables(P), divTables: passedDivTables(P), input: 'choices', recent: [], qn: 0, correct: 0, mistakes: 0, combo: 0, attackLeft: boss.attackMs };
  show(quizLayout());
  renderBossStage();
  nextQuestion();
  let last = performance.now();
  every(() => {
    const now = performance.now();
    const dt = now - last;
    last = now;
    if (S.locked || S.over) return;
    S.attackLeft -= dt;
    // Босс замахивается — предупреждаем; на последней жизни слышно сердце.
    const part = S.attackLeft / S.boss.attackMs;
    if (part < 0.3 && !S.warned) { S.warned = true; Sound.warn(); }
    if (part > 0.5) S.warned = false;
    if (S.hearts === 1 && (S.beat = (S.beat || 0) + dt) > 1100) { S.beat = 0; Sound.heartbeat(); }
    const bar = document.getElementById('attackbar');
    if (bar) bar.style.width = Math.max(0, S.attackLeft / S.boss.attackMs * 100) + '%';
    if (S.attackLeft <= 0) bossAttack();
  }, 100);
}

function renderBossStage(fx = '') {
  let hearts = '';
  for (let i = 0; i < S.maxHearts; i++) hearts += i < S.hearts ? '❤️' : '🤍';
  document.getElementById('qprogress').innerHTML = `<div class="hearts">${hearts}</div>`;
  document.getElementById('stage').innerHTML = `<div class="boss-stage">
    <div class="boss-name">${S.boss.name} · ур. ${S.boss.level}</div>
    <div class="hpbar"><i style="width:${S.hp / S.boss.hp * 100}%"></i><span>${S.hp} / ${S.boss.hp}</span></div>
    <div class="boss-row">
      <div class="cat-with-pet">${catHTML(P.cat, 96, S.mood || 'normal')}${petHTML(P.pet, 30)}</div>
      <div class="vs">VS</div>
      <div class="boss-big ${fx}" id="bossBig">${S.boss.icon}<span>${S.boss.crown}</span></div>
    </div>
    <div class="attack"><small>Атака босса</small><div class="attackbar"><i id="attackbar" style="width:${Math.max(0, S.attackLeft / S.boss.attackMs * 100)}%"></i></div></div>
    ${comboBadge()}
  </div>`;
}

function floatText(text, cls) {
  const st = document.getElementById('stage');
  if (!st) return;
  const el = document.createElement('div');
  el.className = 'float ' + cls;
  el.textContent = text;
  st.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

MODES.boss = {
  after(ok, dt) {
    if (ok) {
      const crit = dt < 3.5;
      const dmg = (crit ? 2 : 1) + (hasPet('dragon') ? 1 : 0);
      S.hp = Math.max(0, S.hp - dmg);
      S.attackLeft = S.boss.attackMs;
      S.mood = 'happy';
      if (crit) Sound.crit(); else Sound.hit();
      renderBossStage('shake');
      heroFx(crit ? 'crit' : 'pounce');
      floatText(crit ? `КРИТ! −${dmg}` : `−${dmg}`, crit ? 'crit' : 'dmg');
      if (S.hp <= 0) { S.over = true; later(() => finishBoss(true), 700); return; }
      later(() => { S.mood = 'normal'; nextQuestion(); }, 600);
    } else {
      loseHeart();
      if (S.over) return;
      later(nextQuestion, 1200);
    }
  },
};

function loseHeart() {
  S.hearts--;
  S.mood = 'sad';
  S.attackLeft = S.boss.attackMs;
  Sound.hurt();
  document.body.classList.add('flash');
  setTimeout(() => document.body.classList.remove('flash'), 350);
  renderBossStage('attack');
  heroFx('hurt');
  floatText('−❤️', 'hurt');
  if (S.hearts <= 0) { S.over = true; S.locked = true; later(() => finishBoss(false), 900); }
}

function bossAttack() {
  if (S.over) return;
  loseHeart();
  if (!S.over) {
    // Показываем правильный ответ и даём новый пример.
    S.locked = true;
    const qEl = document.getElementById('question');
    qEl.innerHTML = S.q.text.replace('<span class="q-hole">?</span>', `<span class="q-bad">${S.q.answer}</span>`);
    later(() => { S.mood = 'normal'; nextQuestion(); }, 1200);
  }
}

function finishBoss(win) {
  stopTimers();
  const boss = S.boss;
  if (win) {
    const reward = 20 + boss.level * 10;
    P.fish += reward;
    P.bossWins++;
    P.bossLevel++;
    if (P.bossWins === 1) grantSpecial('neck', 'medal', '🏅 Ты получила «Медаль чемпиона» для котика!');
    if (P.bossWins === 5) grantSpecial('paw', 'trophy', '🏆 Ты получила «Кубок чемпиона» для котика!');
    checkAchievements();
    save();
    Sound.win();
    confetti(['⚔️', '🏆', '🐟', '⭐', boss.icon]);
    const nb = bossFor(P.bossLevel);
    screenResult({
      title: 'Победа! 🏆', mood: 'happy',
      big: `<div class="boss-big defeated">${boss.icon}</div>`,
      lines: [`${boss.name} побеждён!`, `Награда: +${reward} 🐟`, `Следующий соперник: ${nb.icon} ${nb.name}`],
      buttons: [`<button class="btn big danger" data-action="bossIntro">Следующий бой ⚔️</button>`, `<button class="btn" data-action="hub">В меню</button>`],
    });
  } else {
    save();
    screenResult({
      title: 'Босс оказался сильнее…', mood: 'sad',
      lines: [`Ты нанесла ${boss.hp - S.hp} из ${boss.hp} ударов`, 'Потренируйся в Приключении и возвращайся!', `Рыбок собрано: ${S.correct} 🐟`],
      buttons: [`<button class="btn big danger" data-action="startBoss">Реванш! ⚔️</button>`, `<button class="btn" data-action="hub">В меню</button>`],
    });
  }
}

// ---------- Мой котик / магазин ----------

let shopTab = 'fur';

const TIERS = {
  rare:   { name: 'Редкое' },
  epic:   { name: 'Эпическое' },
  legend: { name: 'Легендарное' },
};

// Редкость вещи по цене: чем дороже, тем круче рамка.
function itemTier(it) {
  if (it.special) return 'epic';
  if (it.price >= 1000) return 'legend';
  if (it.price >= 400) return 'epic';
  if (it.price >= 150) return 'rare';
  return '';
}

// Котик в карточке примеряет одну вещь.
function itemPreview(slot, it, size) {
  if (slot === 'bg') return `<div class="bg-swatch" style="background:${it.css};width:${size}px;height:${size}px"></div>`;
  const cat = { fur: P.cat.fur, breed: P.cat.breed, bg: 'room' };
  cat[slot] = it.id;
  return catHTML(cat, size, 'normal');
}

function screenShop() {
  const slot = SHOP[shopTab];
  const sorted = [...slot.items].sort((x, y) => (x.special ? 1e6 : x.price) - (y.special ? 1e6 : y.price));
  const items = sorted.map(it => {
    const have = owns(shopTab, it);
    const on = P.cat[shopTab] === it.id;
    const tier = itemTier(it);
    let label;
    if (on) label = '<span class="tag on">Надето</span>';
    else if (have) label = '<span class="tag">Надеть</span>';
    else if (it.special) label = `<span class="tag special">🔒 ${it.special}</span>`;
    else label = `<span class="tag price ${P.fish >= it.price ? '' : 'poor'}">🐟 ${it.price}</span>`;
    return `<button class="item tier-${tier || 'common'} ${on ? 'on' : ''} ${!have ? 'not-owned' : ''}" data-action="shopItem" data-id="${it.id}">
      ${tier ? `<span class="tier-badge">${TIERS[tier].name}</span>` : ''}
      ${itemPreview(shopTab, it, 76)}<b>${it.name}</b>${label}</button>`;
  }).join('');
  const own = slot.items.filter(it => owns(shopTab, it)).length;
  show(`<div class="screen shop">
    <div class="row-top"><button class="icon-btn" data-action="hub">←</button><h2>Мой котик</h2><div class="pill fish">🐟 ${P.fish}</div></div>
    <div class="shop-preview"><button class="cat-pet" data-action="petCat">${catHTML(P.cat, 190, 'happy')}</button></div>
    <div class="tabs">${Object.entries(SHOP).map(([k, s]) => `<button class="tab ${k === shopTab ? 'sel' : ''}" data-action="shopTab" data-tab="${k}">${s.icon}<small>${s.title}</small></button>`).join('')}</div>
    <p class="subtitle shop-count">${slot.title}: собрано ${own} из ${slot.items.length}</p>
    <div class="items">${items}</div>
  </div>`);
}

function shopItem(id) {
  const it = findItem(shopTab, id);
  const removable = ['hat', 'glasses', 'neck', 'back', 'paw', 'aura'].includes(shopTab);
  if (owns(shopTab, it)) {
    P.cat[shopTab] = (removable && P.cat[shopTab] === id) ? null : id;
    Sound.click();
    save();
    screenShop();
    if (P.cat[shopTab]) heroFx('twirl', document.querySelector('.shop-preview'));
  } else if (it.special) {
    toast(`🔒 Эту вещь нельзя купить. ${it.special}!`);
  } else {
    // Сначала примерка: котик показывает вещь на себе, покупка — только по кнопке.
    const tryCat = { ...P.cat, [shopTab]: id };
    const tier = itemTier(it);
    const enough = P.fish >= it.price;
    modal(`${tier ? `<div class="tier-badge big tier-${tier}">${TIERS[tier].name}</div>` : ''}
      <div class="try-on"><div class="cat-with-pet">${catHTML(tryCat, 200, 'happy')}</div></div>
      <h2>${it.name}</h2>
      <p>Цена: <b>🐟 ${it.price}</b> · у тебя 🐟 ${P.fish}</p>
      ${enough
        ? `<button class="btn big primary wide" data-action="buyItem" data-id="${id}">Купить!</button>`
        : `<p class="hint">Не хватает ${it.price - P.fish} 🐟 — решай примеры и лови рыбу на ферме!</p>`}
      <button class="btn wide ghost" data-action="closeModal">${enough ? 'Не сейчас' : 'Понятно'}</button>`, 'try-modal');
    heroFx('twirl', document.getElementById('modal'));
  }
}

function buyItem(id) {
  const it = findItem(shopTab, id);
  if (owns(shopTab, it) || P.fish < it.price) return;
  P.fish -= it.price;
  P.owned.push(shopTab + ':' + id);
  P.purchases++;
  P.cat[shopTab] = id;
  Sound.register();
  if (itemTier(it) === 'legend' || itemTier(it) === 'epic') confetti(['✨', '⭐', '💎', '🐟']);
  toast(`🛍️ Куплено: <b>${it.name}</b>!`);
  checkAchievements();
  save();
  screenShop();
  heroFx('twirl', document.querySelector('.shop-preview'));
}

// ---------- Карта знаний ----------

let knowOp = 'mul';

function screenKnowledge() {
  const nums = [2, 3, 4, 5, 6, 7, 8, 9, 10];
  const op = knowOp;
  let grid = `<div class="kg"><span class="kh">${op === 'div' ? ':' : '×'}</span>` + nums.map(n => `<span class="kh">${n}</span>`).join('');
  let learned = 0;
  const seenKeys = new Set();
  for (const a of nums) {
    grid += `<span class="kh">${a}</span>`;
    for (const b of nums) {
      const f = factOf(P, a, b, op);
      const seen = f.r + f.w > 0;
      const lvl = !seen ? 'none' : 'b' + f.box;
      const k = opKey(a, b, op);
      if (!seenKeys.has(k)) { seenKeys.add(k); if (isMastered(f)) learned++; }
      grid += `<button class="kc ${lvl}" data-action="factInfo" data-a="${a}" data-b="${b}">${a * b}</button>`;
    }
  }
  grid += '</div>';
  const total = seenKeys.size;
  const mt = op === 'mul' ? masteredTables(P) : [];
  show(`<div class="screen knowledge">
    <div class="row-top"><button class="icon-btn" data-action="hub">←</button><h2>Карта знаний</h2><div></div></div>
    <div class="seg">
      <button class="${op === 'mul' ? 'sel' : ''}" data-action="knowOp" data-op="mul">× Умножение</button>
      <button class="${op === 'div' ? 'sel' : ''}" data-action="knowOp" data-op="div">: Деление</button>
    </div>
    <div class="card center">
      <div class="big-score small">${learned} <small>из ${total}</small></div>
      <div>примеров выучено ${mt.length ? `· таблицы: ${mt.map(t => '×' + t).join(', ')}` : ''}</div>
      <div class="bar"><i style="width:${learned / total * 100}%"></i></div>
    </div>
    ${grid}
    <div class="legend">
      <span><i class="none"></i>ещё не было</span><span><i class="b0"></i>учим</span>
      <span><i class="b2"></i>почти</span><span><i class="b3"></i>хорошо</span><span><i class="b5"></i>выучено!</span>
    </div>
    <p class="subtitle">Нажми на клетку, чтобы узнать подробнее. Красные примеры будут попадаться чаще — так они быстрее запомнятся.</p>
  </div>`);
}

// ---------- Награды ----------

function screenAchievements() {
  show(`<div class="screen">
    <div class="row-top"><button class="icon-btn" data-action="hub">←</button><h2>Награды</h2><div class="pill">${Object.keys(P.achievements).length}/${ACHIEVEMENTS.length}</div></div>
    <div class="ach-list">
      ${ACHIEVEMENTS.map(a => {
        const got = !!P.achievements[a.id];
        return `<div class="ach ${got ? 'got' : ''}"><span class="ach-icon">${got ? a.icon : '🔒'}</span><div><b>${a.name}</b><small>${a.desc}</small></div></div>`;
      }).join('')}
    </div>
  </div>`);
}

// ---------- Действия по нажатию ----------

const actions = {
  toProfiles() { draft = null; pinState = null; screenProfiles(); },
  newProfile() { draft = null; screenNewProfile(); },
  pickProfile(el) { pinState = { id: el.dataset.id, entered: [], fails: 0 }; screenPin(); },
  draftFur(el) { draft.fur = el.dataset.id; Sound.meow(); screenNewProfile(); },
  draftNext() {
    const name = (draft.name || '').trim();
    if (!name) { toast('Напиши своё имя 🙂'); return; }
    if (Store.list().some(p => p.name.toLowerCase() === name.toLowerCase())) { toast('Такое имя уже есть. Придумай другое!'); return; }
    draft.name = name;
    draft.step = 'pin';
    draft.pin = [];
    screenNewProfile();
  },
  draftBack() { draft.step = 'name'; screenNewProfile(); },
  draftPin(el) { if (draft.pin.length < PIN_LENGTH) { draft.pin.push(Number(el.dataset.i)); Sound.click(); screenNewProfile(); } },
  pinClear() { draft.pin = []; screenNewProfile(); },
  draftCreate() {
    const p = Store.create(draft.name, draft.pin.join(','), draft.fur);
    draft = null;
    p.fish = 10;
    toast('🎁 Подарок новичку: 10 рыбок!');
    login(p);
    confetti();
  },
  pinTap(el) {
    pinState.entered.push(Number(el.dataset.i));
    Sound.click();
    document.getElementById('pinSlotsBox').innerHTML = pinSlots(pinState.entered, false);
    if (pinState.entered.length < PIN_LENGTH) return;
    const p = Store.get(pinState.id);
    if (Store.checkPin(p, pinState.entered.join(','))) {
      pinState = null;
      login(p);
    } else {
      pinState.fails++;
      pinState.entered = [];
      Sound.wrong();
      document.querySelector('.pin-slots').classList.add('shake');
      setTimeout(screenPin, 450);
    }
  },
  hub() { S = null; screenHub(); },
  map() { S = null; screenMap(); },
  settings: settingsModal,
  closeModal,
  toggleSound() { P.settings.sound = !P.settings.sound; save(); settingsModal(); Sound.click(); },
  toggleMusic() { P.settings.music = P.settings.music === false; save(); Sound.musicChanged(); settingsModal(); },
  musicVol(el) { P.settings.musicVol = Number(el.dataset.v); save(); Sound.musicChanged(); settingsModal(); },
  logout() { Store.setCurrent(null); P = null; Sound.musicChanged(); screenProfiles(); },
  deleteProfile() {
    modal(`<h2>Удалить игрока ${esc(P.name)}?</h2><p>Все звёзды, рыбки и наряды пропадут навсегда.</p>
      <button class="btn wide danger" data-action="deleteYes">Да, удалить</button>
      <button class="btn wide" data-action="closeModal">Нет, оставить</button>`);
  },
  deleteYes() { Store.remove(P.id); P = null; screenProfiles(); },
  petCat(el) {
    if (Math.random() < 0.4) Sound.purr(); else Sound.meow();
    const c = el.querySelector('.cat');
    c.classList.remove('wiggle'); void c.offsetWidth; c.classList.add('wiggle');
    const h = document.createElement('span');
    h.className = 'heart-pop';
    h.textContent = pick(['💖', '💕', '😻', '✨']);
    el.appendChild(h);
    setTimeout(() => h.remove(), 900);
  },
  claimDaily() {
    ensureDaily();
    if (P.daily.claimed || P.daily.correct < DAILY_GOAL) return;
    const reward = (15 + Math.min(P.streak.count, 7) * 5) * (hasPet('fox') ? 2 : 1);
    P.daily.claimed = true;
    P.fish += reward;
    checkAchievements();
    save();
    Sound.chest();
    confetti(['🐟', '🎁', '💎']);
    modal(`<div class="chest">🎁</div><h2>Сундук дня!</h2><p>Внутри <b>${reward} 🐟</b></p>
      <p>Серия: 🔥 ${P.streak.count} дн. Чем длиннее серия, тем больше рыбок в сундуке!</p>
      <button class="btn big primary wide" data-action="hub">Ура!</button>`);
  },
  lockedWorld(el) { toast(el.dataset.op === 'div' ? '🔒 Сначала пройди такой же мир умножения и предыдущий мир деления!' : '🔒 Сначала пройди предыдущий мир!'); },
  startAdventure(el) { startAdventure(Number(el.dataset.i), el.dataset.op || 'mul'); },
  mapOp(el) { mapOp = el.dataset.op; screenMap(); },
  choose(el) { answer(Number(el.dataset.v), el); },
  kp(el) { kpPress(el.dataset.v); },
  hintOk() { closeModal(); if (S && S.mode === 'adventure') { S.mood = 'normal'; S.say = 'Пробуем дальше! 💪'; renderAdvStage(); nextQuestion(); } },
  quitQuiz() {
    const paused = S.locked;
    S.locked = true;
    modal(`<h2>Выйти из игры?</h2><p>Рыбки останутся у тебя, а уровень придётся начать заново.</p>
      <button class="btn wide danger" data-action="quitYes">Выйти</button>
      <button class="btn wide primary" data-action="quitNo" data-p="${paused ? 1 : 0}">Играть дальше</button>`);
  },
  quitYes() { S = null; screenHub(); },
  quitNo(el) { closeModal(); if (S) S.locked = el.dataset.p === '1'; },
  blitzSetup: screenBlitzSetup,
  blitzChip(el) {
    const t = Number(el.dataset.t);
    blitzTables = blitzTables.includes(t) ? blitzTables.filter(x => x !== t) : [...blitzTables, t].sort((x, y) => x - y);
    screenBlitzSetup();
  },
  blitzAll() { blitzTables = [2, 3, 4, 5, 6, 7, 8, 9, 10]; screenBlitzSetup(); },
  startBlitz,
  bossIntro,
  startBoss,
  shop() { S = null; screenShop(); },
  shopTab(el) { shopTab = el.dataset.tab; screenShop(); },
  shopItem(el) { shopItem(el.dataset.id); },
  buyItem(el) { buyItem(el.dataset.id); },
  knowledge: screenKnowledge,
  factInfo(el) {
    const a = Number(el.dataset.a), b = Number(el.dataset.b);
    const f = factOf(P, a, b, knowOp);
    const status = f.r + f.w === 0 ? 'ещё не встречался' : isMastered(f) ? 'выучен! 🌟' : 'учим 💪';
    const eq = knowOp === 'div' ? `${a * b} : ${a} = <b>${b}</b>` : `${a} × ${b} = <b>${a * b}</b>`;
    modal(`<p class="big-eq">${eq}</p>
      <p>Пример ${status}</p><p>✅ Верно: ${f.r} · ❌ Ошибок: ${f.w}</p>
      <p class="tip">💡 ${knowOp === 'div' ? divTipFor(a) : tipFor(a, b)}</p>
      <button class="btn wide primary" data-action="closeModal">Понятно</button>`);
  },
  achievements: screenAchievements,
  knowOp(el) { knowOp = el.dataset.op; screenKnowledge(); },
};
