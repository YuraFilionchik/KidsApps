// Word Run: экраны, HUD, управление и связка логики (game.js) со сценой (runner3d.js).
'use strict';

const ui = document.getElementById('ui');
const hud = document.getElementById('hud');
const toastEl = document.getElementById('toast');

let st = null;          // сохранённый прогресс
let run = null;         // текущий забег
let runner = null;      // 3D-сцена
let paused = false;
let busy = false;       // идёт отсчёт или финальная анимация — ввод не нужен
let shopTab = 'skin';
let shopTry = null;     // вещь, которую примеряем в магазине
let review = null;      // тренажёр «Мои ошибки»
let laneGates = [];     // варианты текущих ворот — показываем их на кнопках дорожек

const MODE = WRGame.MODE;
const $ = sel => document.querySelector(sel);
const wait = ms => new Promise(r => setTimeout(r, ms));
const save = () => WRStore.save();

function applySettings() {
  WRSound.setSfx(st.settings.sound);
  WRSound.setVoice(st.settings.voice);
}

function toast(html, kind = '', ms = 1400) {
  toastEl.className = `toast show ${kind}`;
  toastEl.innerHTML = html;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { toastEl.className = 'toast'; }, ms);
}

function floatText(text, cls = '') {
  const el = document.createElement('div');
  el.className = `float-text ${cls}`;
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

function heartsHTML(n, max) {
  return '❤️'.repeat(Math.max(0, n)) + '🤍'.repeat(Math.max(0, max - n));
}

function starsHTML(n) {
  return `<span class="stars">${'⭐'.repeat(n)}<span class="dim">${'⭐'.repeat(3 - n)}</span></span>`;
}

function coinPill() {
  return `<span class="pill coin">🪙 <b>${st.coins}</b></span>`;
}

// ---------- Главное меню ----------

function showMenu() {
  run = null;
  paused = false;
  busy = false;
  hud.innerHTML = '';
  runner.toMenu();
  const lastWorld = WORLDS.filter(w => WRGame.isUnlocked(st, w.id)).pop() || WORLDS[0];
  runner.setWorld(lastWorld);
  runner.setSkin(SKINS.find(s => s.id === st.skin) || SKINS[0]);
  runner.setTrail(TRAILS.find(t => t.id === st.trail));
  const mistakes = WRGame.mistakeCards(st).length;
  const chest = WRGame.chestReady(st);

  ui.innerHTML = `
    <div class="topbar">
      <a class="pill" href="../">← Все игры</a>
      <span class="pill streak" title="Дней подряд">🔥 <b>${st.daily.count}</b></span>
      ${coinPill()}
    </div>
    <div class="sheet menu">
      <h1 class="logo">WORD <span>RUN</span></h1>
      <p class="sub">Беги и выбирай правильное английское слово!</p>
      ${chest ? `<button class="btn gold wide" data-act="chest">🎁 Сундук за ${st.daily.count} дня подряд!</button>` : ''}
      <button class="btn primary big wide" data-act="map">▶ ИГРАТЬ</button>
      <div class="grid2">
        <button class="btn soft" data-act="mistakes">🩹 Мои ошибки${mistakes ? ` <span class="badge">${mistakes}</span>` : ''}
          <small>${st.bonusHeart ? '❤️ +1 сердце готово!' : 'Повтори 3 слова → +1 ❤️'}</small></button>
        <button class="btn soft" data-act="shop">🛍️ Магазин<small>Скины и следы</small></button>
      </div>
      <div class="settings">
        <button class="chip ${st.settings.sound ? 'on' : ''}" data-act="toggle-sound">${st.settings.sound ? '🔔' : '🔕'} Звуки</button>
        <button class="chip ${st.settings.voice ? 'on' : ''}" data-act="toggle-voice">${st.settings.voice ? '🗣️' : '🤐'} Голос</button>
      </div>
    </div>`;
}

// ---------- Карта миров ----------

function showMap() {
  ui.innerHTML = `
    <div class="topbar">
      <button class="pill" data-act="menu">← Меню</button>
      <b class="title">🗺️ Миры</b>
      ${coinPill()}
    </div>
    <div class="sheet tall">
      <div class="worlds">
        ${WORLDS.map(w => {
          const p = st.worlds[w.id] || { stars: 0, passes: 0, resume: null };
          const open = WRGame.isUnlocked(st, w.id);
          const resume = p.resume ? `<span class="tag blue">▶ Продолжить: осталось ${p.resume.words.length || 'только Страж'}</span>` : '';
          const pass = p.passes > 0 ? `<span class="tag">Пройден ×${p.passes}</span>` : '';
          return `
            <button class="world ${open ? '' : 'locked'}" data-act="${open ? 'start' : 'locked'}" data-id="${w.id}">
              ${WRArt.worldHTML(w)}
              <span class="w-info">
                <b>${w.id}. ${w.name}</b>
                <small>${open ? w.words.slice(0, 4).map(x => x.en).join(', ') + '…' : '🔒 Пройди предыдущий мир'}</small>
                ${resume}${pass}
              </span>
              ${open ? starsHTML(p.stars) : '<span class="lock">🔒</span>'}
            </button>`;
        }).join('')}
      </div>
    </div>`;
}

// ---------- Забег ----------

async function startWorld(id) {
  if (!WRGame.isUnlocked(st, id)) return;
  WRSound.unlock();
  const world = WRGame.world(id);
  const me = run = WRGame.createRun(st, id);
  save();
  ui.innerHTML = '';
  paused = false;
  busy = true;
  runner.clearGates();
  runner.setWorld(world);
  runner.start();
  runner.stop();   // камера уезжает за спину, но бег начнётся после отсчёта

  // Картинки мира и слов-повторов — заранее (не дольше 1.5 с).
  await Promise.race([
    Promise.all([WRArt.preloadWorld(world), WRArt.preloadWords(run.queue.map(q => q.word))]),
    wait(1500)
  ]);
  if (run !== me) return;   // за это время вышли из забега или запустили другой

  const firstTime = !Object.keys(st.worlds).some(k => st.worlds[k].passes > 0) && !run.resumed;
  for (const n of [3, 2, 1]) {
    if (run !== me) return;
    hud.innerHTML = `<div class="countdown">
      <div class="cd-world">${world.icon} ${world.name}${run.resumed ? ' · продолжаем' : ''}</div>
      <div class="cd-num">${n}</div>
      ${firstTime ? '<div class="cd-tip">Свайпай ⬅️ ➡️ или жми кнопки внизу,<br>чтобы выбрать ворота с верным словом</div>' : ''}
    </div>`;
    WRSound.countdown(false);
    await wait(firstTime ? 1100 : 750);
  }
  if (run !== me) return;
  WRSound.countdown(true);
  busy = false;
  runner.running = true;
  nextGate(true);
}

function nextGate(first = false) {
  const it = WRGame.current(run);
  if (!it) return;
  const gates = WRGame.buildGates(run);
  runner.speed = run.speed;
  laneGates = gates;
  runner.spawnGates(gates, {
    picMode: it.mode === MODE.PIC_GATES,
    boss: it.kind === 'boss',
    hint: run.hint,
    distance: first ? 66 : 56
  });
  renderHUD();
  if (it.mode === MODE.AUDIO || run.hint) setTimeout(() => run && WRSound.speak(it.word.en), 350);
}

function promptHTML(it) {
  const w = it.word;
  const say = `<button class="say" data-act="say" data-word="${w.en}" aria-label="Послушать">🔊</button>`;
  let body;
  if (it.mode === MODE.PIC) {
    body = `${WRArt.wordHTML(w, 'p-pic')}<span class="p-cap">${w.ru}</span>`;
  } else if (it.mode === MODE.RU) {
    body = `<span class="p-ask">Как по-английски?</span><span class="p-ru">${w.ru}</span>`;
  } else if (it.mode === MODE.AUDIO) {
    body = `<button class="say big" data-act="say" data-word="${w.en}">🔊 Послушай</button><span class="p-ask">и выбери слово</span>`;
  } else {
    body = `<span class="p-ask">Найди картинку</span><span class="p-en">${w.en}</span>${say}`;
  }
  const tag = it.kind === 'boss' ? '<span class="p-tag boss">👑 Страж</span>'
    : it.kind === 'review' ? '<span class="p-tag review">🔁 Повтор ошибки</span>' : '';
  const hint = run.hint ? `<div class="p-hint">Подсказка: <b>${w.en}</b> ${say}</div>` : '';
  return `<div class="prompt ${it.kind}">${tag}<div class="p-body">${body}</div>${hint}</div>`;
}

// Кнопка дорожки: вариант ворот этой дорожки крупно и цветом дорожки —
// издалека табличку в 3D не прочитать, а кнопку видно сразу.
function laneButtonHTML(lane, it) {
  const opt = laneGates.find(g => g.lane === lane);
  const arrow = lane < 0 ? '◀' : lane > 0 ? '▶' : '●';
  const cls = `lane-${lane < 0 ? 'l' : lane > 0 ? 'r' : 'c'} ${runner.lane === lane ? 'on' : ''}`;
  if (!opt) return `<button data-act="lane" data-lane="${lane}" class="${cls} empty">${arrow}</button>`;
  const body = it && it.mode === MODE.PIC_GATES
    ? WRArt.wordHTML(opt.word, 'l-pic')
    : `<span class="l-word${opt.word.en.length > 6 ? ' long' : ''}">${opt.word.en}</span>`;
  const glow = run.hint && opt.correct ? ' glow' : '';
  return `<button data-act="lane" data-lane="${lane}" class="${cls}${glow}"><span class="l-arrow">${arrow}</span>${body}</button>`;
}

function renderHUD() {
  if (!run) { hud.innerHTML = ''; return; }
  const it = WRGame.current(run);
  if (!it) return;
  const bossAt = run.queue.findIndex(q => q.kind === 'boss');
  const bossPct = bossAt >= 0 ? Math.round(bossAt / run.queue.length * 100) : 100;
  hud.innerHTML = `
    <div class="hud-top">
      <button class="round" data-act="pause" aria-label="Пауза">⏸</button>
      <span class="hearts">${heartsHTML(run.hearts, run.maxHearts)}</span>
      <span class="score">${run.score}${run.combo > 1 ? ` <i>×${run.combo}</i>` : ''}</span>
    </div>
    <div class="progress">
      <div class="bar"><i style="width:${WRGame.progressPct(run)}%"></i><em style="left:${bossPct}%">👑</em></div>
    </div>
    ${promptHTML(it)}
    <div class="lanes">${[-1, 0, 1].map(l => laneButtonHTML(l, it)).join('')}</div>`;
}

function syncLaneButtons() {
  document.querySelectorAll('.lanes button').forEach(b => b.classList.toggle('on', +b.dataset.lane === runner.lane));
}

function setLane(lane) {
  if (!run || paused || busy || !runner.running) return;
  if (runner.setLane(lane)) { WRSound.swipe(); syncLaneButtons(); }
}

function moveLane(d) {
  setLane(runner.lane + d);
}

async function onGate(hit) {
  if (!run) return;
  const me = run;
  const it = WRGame.current(run);
  laneGates = [];
  const res = WRGame.answer(st, run, hit ? hit.word.en : null);
  const w = res.target;

  if (res.status === 'miss') {
    WRSound.miss();
    toast('Выбери ворота! ⬅️ ➡️', 'info');
    nextGate();
    return;
  }
  save();

  if (res.status === 'correct') {
    WRSound.coin(run.combo);
    WRSound.speak(w.en);    // верный ответ всегда звучит — закрепляем произношение
    runner.correctFx();
    floatText(`+${res.gained}`, 'good');
    if (run.combo > 1 && run.correctStreak % 3 === 0) toast(`Комбо ×${run.combo}! 🔥`, 'good', 1000);
    if (res.bossNext) {
      WRSound.boss();
      toast('👑 Страж мира! 5 слов подряд!', 'boss', 1800);
    }
    nextGate();
    return;
  }

  if (res.status === 'wrong') {
    WRSound.splash();
    runner.splashFx();
    toast(`${WRArt.wordHTML(w, 't-pic')} <b>${w.en}</b> — ${w.ru}`, 'bad', 1700);
    setTimeout(() => WRSound.speak(w.en), 450);
    renderHUD();
    busy = true;
    await wait(900);
    if (run !== me) return;
    busy = false;
    if (WRGame.current(run) === it) nextGate();
    return;
  }

  // Конец забега: победа или закончились сердца.
  busy = true;
  if (res.status === 'win') {
    WRSound.coin(run.combo);
    WRSound.speak(w.en);
    runner.correctFx();
    runner.defeatBoss();
    renderHUD();
    await wait(700);
    WRSound.win();
    runner.burst(0xfacc15, 30, 2);
    runner.burst(0xec4899, 30, 2);
    await wait(900);
    if (run !== me) return;
  } else {
    WRSound.splash();
    runner.splashFx();
    setTimeout(() => WRSound.speak(w.en), 450);
    await wait(1000);
    if (run !== me) return;
    WRSound.lose();
  }
  runner.stop();
  showResults(res);
}

function showResults(res) {
  const won = res.status === 'win';
  const world = WRGame.world(run.worldId);
  const next = WORLDS[WORLDS.findIndex(w => w.id === world.id) + 1];
  const nextOpen = won && next && WRGame.isUnlocked(st, next.id);
  hud.innerHTML = '';
  const missed = run.missed.map(m => `
    <div class="word-row">
      ${WRArt.wordHTML(m, 'r-pic')}
      <span><b>${m.en}</b> — ${m.ru}</span>
      <button class="say" data-act="say" data-word="${m.en}">🔊</button>
    </div>`).join('');
  const learned = run.learned.length
    ? `<p class="learned">🎓 Выучено и убрано из ошибок: <b>${run.learned.map(w => w.en).join(', ')}</b></p>` : '';

  ui.innerHTML = `
    <div class="sheet tall result ${won ? 'won' : 'lost'}">
      <h2>${won ? `Мир «${world.name}» пройден!` : 'Сердечки закончились'}</h2>
      ${won ? `<div class="big-stars">${starsHTML(res.stars)}</div>` : '<div class="big-emoji">💦</div>'}
      <div class="stats">
        <span>Очки<b>${run.score}</b></span>
        <span>Монеты<b>+${res.coins} 🪙</b></span>
        <span>Серия<b>${run.bestStreak}</b></span>
      </div>
      ${won && res.perfect ? '<p class="perfect">🎉 Без единой ошибки! +50 очков</p>' : ''}
      ${!won ? `<p class="sub">Не страшно! Продолжишь с того же места — осталось ${res.resumeFrom || 'только Страж'}.</p>` : ''}
      ${won && res.firstClear && next ? `<p class="unlock">🔓 Открыт новый мир: ${next.icon} ${next.name}</p>` : ''}
      ${missed ? `<div class="words-box"><b>Повтори эти слова:</b>${missed}</div>` : ''}
      ${learned}
      ${nextOpen ? `<button class="btn primary big wide" data-act="start" data-id="${next.id}">Дальше: ${next.icon} ${next.name} ▶</button>` : ''}
      <button class="btn ${nextOpen ? 'soft' : 'primary big'} wide" data-act="start" data-id="${world.id}">${won ? '🔄 Ещё раз' : '▶ Продолжить'}</button>
      <button class="btn soft wide" data-act="map">🗺️ К мирам</button>
    </div>`;
}

function pause() {
  if (!run || busy || paused) return;
  paused = true;
  runner.stop();
  ui.innerHTML = `
    <div class="sheet pause">
      <h2>⏸ Пауза</h2>
      <button class="btn primary big wide" data-act="resume">▶ Продолжить</button>
      <button class="btn soft wide" data-act="quit">🗺️ Выйти к мирам</button>
      <p class="sub small">Если выйти, прогресс этого забега не сохранится.</p>
    </div>`;
}

function resume() {
  if (!run || !paused) return;
  paused = false;
  ui.innerHTML = '';
  runner.running = true;
}

// ---------- «Мои ошибки»: 3 карточки → +1 ❤ ----------

function showMistakes() {
  const cards = WRGame.mistakeCards(st);
  if (!cards.length) {
    ui.innerHTML = `
      <div class="sheet">
        <h2>🩹 Мои ошибки</h2>
        <p class="sub">Ошибок нет — так держать! 💪<br>Слово попадает сюда, если ошибиться в забеге, и уходит после 3 верных ответов подряд.</p>
        <button class="btn primary wide" data-act="menu">← В меню</button>
      </div>`;
    return;
  }
  review = { cards: WRGame.shuffle(cards).slice(0, 3), i: 0, wrong: false };
  WRArt.preloadWords(review.cards.map(c => c.word)).then(() => review && renderCard());
  renderCard();
}

function renderCard() {
  const { cards, i } = review;
  const c = cards[i];
  const pool = WRGame.world(c.m.worldId).words.filter(w => w.en !== c.word.en);
  review.choices = review.choices && review.choicesFor === c.word.en ? review.choices
    : WRGame.shuffle([c.word, ...WRGame.shuffle(pool).slice(0, 2)]);
  review.choicesFor = c.word.en;
  ui.innerHTML = `
    <div class="topbar">
      <button class="pill" data-act="menu">← Меню</button>
      <b class="title">Карточка ${i + 1} из ${cards.length}</b>
      <span class="pill">${st.bonusHeart ? '❤️ готово' : '+1 ❤️'}</span>
    </div>
    <div class="sheet card">
      <div class="fc">
        ${WRArt.wordHTML(c.word, 'fc-pic')}
        <div class="fc-ru">${c.word.ru}</div>
        <button class="say" data-act="say" data-word="${c.word.en}">🔊</button>
      </div>
      <div class="choices">
        ${review.choices.map(w => `<button class="btn soft wide choice" data-act="card" data-word="${w.en}">${w.en}</button>`).join('')}
      </div>
      <p class="sub small">Ошибок: ${c.m.errors} · верно подряд: ${c.m.streak} из 3</p>
    </div>`;
}

function answerCard(en, btn) {
  const c = review.cards[review.i];
  if (en !== c.word.en) {
    WRSound.splash();
    WRSound.speak(c.word.en);
    btn.classList.add('bad');
    document.querySelector(`.choice[data-word="${c.word.en}"]`)?.classList.add('good');
    return;
  }
  WRSound.coin();
  WRSound.speak(c.word.en);
  btn.classList.add('good');
  WRGame.recordRight(st, c.word);
  save();
  review.i++;
  setTimeout(() => {
    if (!review) return;
    if (review.i < review.cards.length) { renderCard(); return; }
    const had = st.bonusHeart;
    st.bonusHeart = true;
    save();
    review = null;
    WRSound.win();
    ui.innerHTML = `
      <div class="sheet">
        <h2>Отлично! 🎉</h2>
        <div class="big-emoji">❤️</div>
        <p class="sub">${had ? 'Бонусное сердце уже ждёт тебя в забеге.' : 'В следующем забеге у тебя будет +1 сердце!'}</p>
        <button class="btn primary big wide" data-act="map">▶ Играть</button>
        <button class="btn soft wide" data-act="menu">← В меню</button>
      </div>`;
  }, 700);
}

// ---------- Магазин ----------

function showShop() {
  const items = shopTab === 'skin' ? SKINS : TRAILS;
  const owned = shopTab === 'skin' ? st.ownedSkins : st.ownedTrails;
  const active = shopTab === 'skin' ? st.skin : st.trail;
  const sel = shopTry && items.find(x => x.id === shopTry);
  ui.innerHTML = `
    <div class="topbar">
      <button class="pill" data-act="shop-close">← Меню</button>
      <b class="title">🛍️ Магазин</b>
      ${coinPill()}
    </div>
    <div class="sheet shop">
      <div class="tabs">
        <button class="${shopTab === 'skin' ? 'on' : ''}" data-act="shop-tab" data-tab="skin">🧍 Скины</button>
        <button class="${shopTab === 'trail' ? 'on' : ''}" data-act="shop-tab" data-tab="trail">✨ Следы</button>
      </div>
      <div class="shop-grid">
        ${items.map(x => {
          const has = owned.includes(x.id);
          const label = active === x.id ? '✅ Надето' : has ? 'Выбрать' : `🪙 ${x.price}`;
          return `<button class="item ${active === x.id ? 'active' : ''} ${sel && sel.id === x.id ? 'try' : ''} ${!has && st.coins < x.price ? 'poor' : ''}"
            data-act="shop-item" data-id="${x.id}"><span class="i-ic">${x.icon}</span><b>${x.name}</b><small>${label}</small></button>`;
        }).join('')}
      </div>
      ${sel && !owned.includes(sel.id) ? `
        <button class="btn ${st.coins >= sel.price ? 'gold' : 'soft'} big wide" data-act="buy" data-id="${sel.id}" ${st.coins >= sel.price ? '' : 'disabled'}>
          ${st.coins >= sel.price ? `Купить «${sel.name}» за 🪙 ${sel.price}` : `Нужно ещё 🪙 ${sel.price - st.coins}`}
        </button>` : ''}
    </div>`;
}

function previewShop() {
  const skin = shopTab === 'skin' && shopTry ? SKINS.find(s => s.id === shopTry) : SKINS.find(s => s.id === st.skin);
  runner.setSkin(skin || SKINS[0]);
  if (shopTab === 'trail') {
    const tr = TRAILS.find(t => t.id === (shopTry || st.trail));
    if (tr && tr.color) runner.burst(tr.color, 24, 1.4);
  }
}

function shopItem(id) {
  const items = shopTab === 'skin' ? SKINS : TRAILS;
  const owned = shopTab === 'skin' ? st.ownedSkins : st.ownedTrails;
  const item = items.find(x => x.id === id);
  if (owned.includes(id)) {
    WRGame.buyOrEquip(st, shopTab, item);
    save();
    shopTry = null;
    WRSound.click();
    if (shopTab === 'trail') runner.setTrail(item);
  } else {
    shopTry = id;
    WRSound.click();
  }
  previewShop();
  showShop();
}

function buy(id) {
  const items = shopTab === 'skin' ? SKINS : TRAILS;
  const item = items.find(x => x.id === id);
  const r = WRGame.buyOrEquip(st, shopTab, item);
  if (r === 'bought') {
    save();
    WRSound.buy();
    toast(`Куплено: ${item.icon} ${item.name}!`, 'good');
    if (shopTab === 'trail') runner.setTrail(item);
    shopTry = null;
    previewShop();
  }
  showShop();
}

// ---------- Ввод ----------

const actions = {
  menu: showMenu,
  map: () => { WRSound.unlock(); showMap(); },
  start: el => startWorld(+el.dataset.id),
  locked: () => { WRSound.miss(); toast('🔒 Сначала пройди предыдущий мир', 'info'); },
  chest: () => {
    const got = WRGame.claimChest(st);
    if (got) { save(); WRSound.win(); toast(`🎁 +${got} 🪙`, 'good'); }
    showMenu();
  },
  mistakes: showMistakes,
  card: el => answerCard(el.dataset.word, el),
  shop: () => { shopTab = 'skin'; shopTry = null; showShop(); },
  'shop-tab': el => { shopTab = el.dataset.tab; shopTry = null; previewShop(); showShop(); },
  'shop-item': el => shopItem(el.dataset.id),
  'shop-close': () => { shopTry = null; showMenu(); },
  buy: el => buy(el.dataset.id),
  'toggle-sound': () => { st.settings.sound = !st.settings.sound; save(); applySettings(); WRSound.click(); showMenu(); },
  'toggle-voice': () => { st.settings.voice = !st.settings.voice; save(); applySettings(); WRSound.speak('Hello!'); showMenu(); },
  say: el => WRSound.speak(el.dataset.word),
  lane: el => setLane(+el.dataset.lane),
  pause,
  resume,
  quit: () => { run = null; paused = false; showMap(); runner.toMenu(); }
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = actions[el.dataset.act];
  if (fn) fn(el);
});

let touch = null;
window.addEventListener('touchstart', e => {
  if (e.touches.length === 1) touch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
}, { passive: true });
window.addEventListener('touchend', e => {
  if (!touch) return;
  const dx = e.changedTouches[0].clientX - touch.x;
  const dy = e.changedTouches[0].clientY - touch.y;
  touch = null;
  if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) moveLane(dx > 0 ? 1 : -1);
}, { passive: true });

window.addEventListener('keydown', e => {
  if (!run) return;
  const k = e.key.toLowerCase();
  if (k === 'arrowleft' || k === 'a' || k === 'ф') { moveLane(-1); e.preventDefault(); }
  else if (k === 'arrowright' || k === 'd' || k === 'в') { moveLane(1); e.preventDefault(); }
  else if (k === 'arrowup' || k === 'w' || k === 'ц') setLane(0);
  else if (k === 'escape' || k === 'p' || k === 'з' || k === ' ') { paused ? resume() : pause(); e.preventDefault(); }
});

// Свернули вкладку посреди забега — ставим на паузу.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && run && !paused && !busy) pause();
});

// ---------- Запуск ----------

function boot() {
  if (typeof THREE === 'undefined') {
    ui.innerHTML = `<div class="sheet"><h2>Не удалось загрузить 3D 😿</h2>
      <p class="sub">Для первого запуска нужен интернет. Проверь подключение и обнови страницу.</p>
      <button class="btn primary wide" onclick="location.reload()">🔄 Обновить</button></div>`;
    return;
  }
  st = WRStore.load();
  WRGame.touchDaily(st);
  save();
  applySettings();
  runner = new WordRunner3D(document.getElementById('scene'), onGate);
  WRArt.preloadIcons(WORLDS);
  showMenu();
  // Шрифт для табличек ворот рисуется в canvas — подгружаем заранее.
  if (document.fonts && document.fonts.load) document.fonts.load('900 40px Nunito').catch(() => {});
}

boot();
