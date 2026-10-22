// Word Run, режим «Контрольная»: подготовка к контрольной по разделу учебника без бега —
// карточки с транскрипцией и озвучкой, правила, тренировка с пояснениями и пробная контрольная.
// Логика вопросов — в study_game.js, словарь — в study_data.js. Подключается после app.js.
'use strict';

const sv = {
  unitId: 'u1',
  topicId: null,
  cards: [],        // карточки текущей темы
  card: 0,
  hideEn: false,    // «проверь себя»: английское слово скрыто до нажатия
  quiz: null        // текущая тренировка/контрольная
};

const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const sayBtn = (text, label = '🔊', cls = 'say') => `<button class="${cls}" data-act="st-say" data-say="${esc(text)}" aria-label="Послушать">${label}</button>`;

function studyTopbar(back, title, right = coinPill()) {
  return `<div class="topbar">
    <button class="pill" data-act="${back}">←</button>
    <b class="title">${title}</b>
    ${right}
  </div>`;
}

// ---------- Разделы и темы ----------

function showStudyHub() {
  sv.quiz = null;
  hud.innerHTML = '';
  const u = WRStudy.unit(sv.unitId);
  const weak = u.topics.reduce((n, t) => n + WRStudy.weakItems(st, t).length, 0);
  const exam = WRStudy.ensure(st).best[`exam-${u.id}`] || 0;
  ui.innerHTML = `
    ${studyTopbar('menu', '📚 Контрольная')}
    <div class="sheet tall study">
      <div class="st-head">
        <h2>${u.title}</h2>
        <p class="sub">${u.subtitle}</p>
      </div>
      <div class="st-topics">
        ${u.topics.map(t => {
          const p = WRStudy.topicProgress(st, t);
          const pct = Math.round(p.known / p.total * 100);
          return `<button class="st-topic" style="--tc:${t.color}" data-act="st-topic" data-id="${t.id}">
            <span class="st-ic">${t.icon}</span>
            <span class="st-tt"><b>${t.title}</b>
              <small>${p.known} из ${p.total} выучено${p.best ? ` · тест ${p.best}%` : ''}</small>
              <span class="st-bar"><i style="width:${pct}%"></i></span>
            </span>
          </button>`;
        }).join('')}
      </div>
      <button class="btn gold big wide" data-act="st-exam">📝 Пробная контрольная<small>20 вопросов по всем темам${exam ? ` · лучший результат ${exam}% (оценка ${WRStudy.mark(exam)})` : ''}</small></button>
      ${weak ? `<button class="btn soft wide" data-act="st-weak">🩹 Повторить мои ошибки <span class="badge">${weak}</span></button>` : ''}
      ${voiceRow()}
    </div>`;
}

function voiceRow() {
  if (!WRSound.canSpeak()) return '<p class="sub small">⚠️ В этом браузере нет озвучки — попробуй Chrome или Safari.</p>';
  const name = WRSound.voiceName() || 'английский';
  return `<div class="st-voice">🗣️ Голос: <b>${esc(name.replace(/^Microsoft |^Google /, ''))}</b>
    <button class="chip on" data-act="st-voice">Сменить</button></div>`;
}

function nextVoice() {
  const list = WRSound.voices();
  if (!list.length) { toast('Голоса ещё загружаются…', 'info'); return; }
  const i = list.findIndex(v => v.name === WRSound.voiceName());
  const v = list[(i + 1) % list.length];
  st.settings.voiceName = v.name;
  save();
  WRSound.setVoiceName(v.name);
  WRSound.speak("Hello! Let's learn English.");
  toast(`🗣️ ${esc(v.name)} <small>(${v.lang})</small>`, 'info', 1800);
  const row = document.querySelector('.st-voice');
  if (row) row.outerHTML = voiceRow();
}

function showTopic(id) {
  sv.topicId = id;
  sv.quiz = null;
  const t = WRStudy.topic(id);
  const p = WRStudy.topicProgress(st, t);
  const weak = WRStudy.weakItems(st, t).length;
  ui.innerHTML = `
    ${studyTopbar('study', `${t.icon} ${t.title}`)}
    <div class="sheet tall study" style="--tc:${t.color}">
      <div class="st-banner"><span>${t.icon}</span><div><b>${t.title}</b><small>${p.known} из ${p.total} карточек выучено</small></div></div>
      <div class="st-steps">
        <button class="st-step" data-act="st-cards"><span>📖</span><b>Учить карточки</b><small>${p.total} слов с транскрипцией и озвучкой</small></button>
        <button class="st-step" data-act="st-tips"><span>💡</span><b>Правила</b><small>Пояснения и примеры</small></button>
        <button class="st-step" data-act="st-train"><span>🎯</span><b>Тренировка</b><small>10 вопросов с подсказками</small></button>
        <button class="st-step" data-act="st-test"><span>📝</span><b>Мини-тест</b><small>${p.best ? `Лучший: ${p.best}% · оценка ${WRStudy.mark(p.best)}` : '10 вопросов, оценка в конце'}</small></button>
      </div>
      ${weak ? `<button class="btn soft wide" data-act="st-cards-weak">🩹 Карточки с ошибками <span class="badge">${weak}</span></button>` : ''}
    </div>`;
  WRArt.preloadWords(WRStudy.items(t));
}

// ---------- Карточки ----------

function showCards(onlyWeak = false) {
  const t = WRStudy.topic(sv.topicId);
  sv.cards = onlyWeak ? WRStudy.weakItems(st, t) : WRStudy.items(t);
  if (!sv.cards.length) sv.cards = WRStudy.items(t);
  sv.card = 0;
  WRArt.preloadWords(sv.cards).then(() => { if (document.querySelector('.fcard')) renderCard(false); });
  renderCard();
}

function cardExtra(t, it) {
  if (t.id === 'sports') {
    const places = WRStudy.items('places').filter(p => it.places.includes(p.en));
    return `<div class="fc-chips">
      <span class="fc-chip verb">${it.verb} ${it.en} ${sayBtn(`${it.verb} ${it.en}`, '🔊', 'say mini')}</span>
      ${places.map(p => `<span class="fc-chip">${p.prep} the ${p.en}</span>`).join('')}
    </div>`;
  }
  if (t.id === 'places') {
    const sports = WRStudy.items('sports').filter(s => s.places.includes(it.en));
    return `<div class="fc-chips">
      <span class="fc-chip verb">${it.prep} the ${it.en} ${sayBtn(`${it.prep} the ${it.en}`, '🔊', 'say mini')}</span>
      ${sports.map(s => `<span class="fc-chip">${s.pic} ${s.en}</span>`).join('')}
    </div>`;
  }
  if (t.id === 'months') {
    const i = WRStudy.items('months').indexOf(it) + 1;
    const season = WRStudy.items('seasons').find(s => s.en === it.season);
    return `<div class="fc-chips"><span class="fc-chip">${i}-й месяц</span><span class="fc-chip verb">${season.pic} ${season.en}</span><span class="fc-chip">in ${it.en}</span></div>`;
  }
  if (t.id === 'seasons') {
    const months = WRStudy.items('months').filter(m => m.season === it.en);
    return `<div class="fc-chips">${months.map(m => `<span class="fc-chip">${m.en}</span>`).join('')}<span class="fc-chip verb">in ${it.en}</span></div>`;
  }
  if (t.id === 'numbers' && it.n > 20 && it.n % 10) {
    const tens = Math.floor(it.n / 10) * 10, u = it.n % 10;
    return `<div class="fc-chips"><span class="fc-chip">${tens} ${WRStudy.numberToWords(tens)}</span><span class="fc-chip">+</span><span class="fc-chip">${u} ${WRStudy.numberToWords(u)}</span></div>`;
  }
  return '';
}

function renderCard(speak = true) {
  const t = WRStudy.topic(sv.topicId);
  const it = sv.cards[sv.card];
  const known = WRStudy.isKnown(st, t.id, it);
  const total = sv.cards.length;
  const isNum = t.id === 'numbers';
  const word = sv.hideEn
    ? `<button class="fc-hidden" data-act="st-reveal">Нажми, чтобы увидеть 👀</button>`
    : `<div class="fc-word">${it.en}</div><div class="fc-ipa">[${it.ipa}]</div>`;
  ui.innerHTML = `
    ${studyTopbar('st-back-topic', `${sv.card + 1} / ${total}`, `<button class="pill ${sv.hideEn ? 'on' : ''}" data-act="st-hide">${sv.hideEn ? '🙈 Проверь себя' : '👀 Всё видно'}</button>`)}
    <div class="sheet tall study cardview" style="--tc:${t.color}">
      <div class="fcard ${known ? 'known' : ''}">
        <div class="fc-top">${isNum ? `<span class="fc-num">${it.n}</span>` : WRArt.wordHTML(it, 'fc-img')}
          ${known ? '<span class="fc-badge">✅ знаю</span>' : ''}</div>
        <div class="fc-body">
          ${word}
          <div class="fc-say">
            ${sayBtn(it.en, '🔊 Слушать', 'say big')}
            ${`<button class="say slow" data-act="st-slow" data-say="${esc(it.en)}" aria-label="Медленно">🐢</button>`}
          </div>
          ${isNum ? '' : `<div class="fc-ru">${it.ru}</div>`}
          ${cardExtra(t, it)}
          ${it.ex ? `<div class="fc-ex"><q>${it.ex}</q> ${sayBtn(it.ex, '🔊', 'say mini')}<small>${it.exRu}</small></div>` : ''}
          ${it.note ? `<div class="fc-note">💡 ${it.note}</div>` : ''}
        </div>
      </div>
      <div class="fc-nav">
        <button class="round big" data-act="st-prev" ${sv.card === 0 ? 'disabled' : ''} aria-label="Назад">◀</button>
        <button class="btn soft" data-act="st-unknown">🔁 Учу</button>
        <button class="btn primary" data-act="st-known">✅ Знаю</button>
        <button class="round big" data-act="st-next" aria-label="Дальше">▶</button>
      </div>
    </div>`;
  if (speak && !sv.hideEn) setTimeout(() => WRSound.speak(it.en), 150);
}

function moveCard(d) {
  const n = sv.card + d;
  if (n < 0) return;
  if (n >= sv.cards.length) { cardsDone(); return; }
  sv.card = n;
  WRSound.click();
  renderCard();
}

function markCard(on) {
  const it = sv.cards[sv.card];
  WRStudy.setKnown(st, sv.topicId, it, on);
  save();
  if (on) WRSound.coin(); else WRSound.click();
  moveCard(1);
}

function cardsDone() {
  const t = WRStudy.topic(sv.topicId);
  const p = WRStudy.topicProgress(st, t);
  WRSound.win();
  ui.innerHTML = `
    ${studyTopbar('st-back-topic', `${t.icon} ${t.title}`)}
    <div class="sheet study">
      <h2>Карточки пройдены! 🎉</h2>
      <div class="big-emoji">${t.icon}</div>
      <p class="sub">Выучено ${p.known} из ${p.total}. Теперь проверь себя в тренировке.</p>
      <button class="btn primary big wide" data-act="st-train">🎯 Тренировка</button>
      <button class="btn soft wide" data-act="st-cards">📖 Ещё раз карточки</button>
    </div>`;
}

// ---------- Правила ----------

function showTips() {
  const t = WRStudy.topic(sv.topicId);
  ui.innerHTML = `
    ${studyTopbar('st-back-topic', `💡 ${t.title}`)}
    <div class="sheet tall study" style="--tc:${t.color}">
      <p class="sub small">Нажми на английский пример — он прозвучит.</p>
      <div class="st-tips">${WRStudy.tips(t.id)}</div>
      <button class="btn primary wide" data-act="st-train">🎯 Потренироваться</button>
    </div>`;
}

// ---------- Тренировка и контрольная ----------

// mode: train — с пояснениями и повтором ошибок; test — без подсказок, оценка в конце.
function startQuiz(topicIds, count, mode, key, title) {
  const qs = WRStudy.makeSession(topicIds, count, st);
  sv.quiz = { qs, i: 0, mode, key, title, right: 0, total: qs.length, wrong: [], retried: new Set(), answered: false, tiles: [], picked: [] };
  WRArt.preloadWords(qs.map(q => q.item).filter(it => !it.n));
  renderQuestion();
}

function startWeak() {
  const u = WRStudy.unit(sv.unitId);
  const ids = u.topics.filter(t => WRStudy.weakItems(st, t).length).map(t => t.id);
  if (!ids.length) { showStudyHub(); return; }
  startQuiz(ids, 10, 'train', null, '🩹 Мои ошибки');
}

function promptHTMLStudy(q) {
  const p = q.prompt;
  const parts = [];
  if (p.num !== undefined) parts.push(`<div class="q-num">${p.num}</div>`);
  if (p.pic) parts.push(`<div class="q-pic">${WRArt.wordHTML(p.pic, 'q-img')}</div>`);
  if (p.gap) parts.push(`<div class="q-en">${p.gap.replace('___', '<span class="gap">___</span>')}</div>`);
  else if (p.en) parts.push(`<div class="q-en">${p.en} ${sayBtn(p.en, '🔊', 'say mini')}</div>`);
  if (p.ru) parts.push(`<div class="q-ru">${p.ru}</div>`);
  if (p.audio) parts.push(`<button class="say big" data-act="st-say" data-say="${esc(p.audio)}">🔊 Послушать ещё</button>
    <button class="say slow" data-act="st-slow" data-say="${esc(p.audio)}">🐢</button>`);
  return parts.join('');
}

function answerAreaHTML(q) {
  const z = sv.quiz;
  if (q.input === 'tiles') {
    const slots = [...q.answer].map((ch, i) => /[a-z]/i.test(ch)
      ? `<span class="slot ${z.picked[i] !== undefined ? 'full' : ''}">${z.picked[i] !== undefined ? q.tiles[z.picked[i]] : ''}</span>`
      : `<span class="slot sep">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('');
    const used = new Set(Object.values(z.picked));
    return `<div class="slots">${slots}</div>
      <div class="tiles">${q.tiles.map((ch, i) => `<button class="tile" data-act="st-tile" data-i="${i}" ${used.has(i) || z.answered ? 'disabled' : ''}>${ch}</button>`).join('')}
        <button class="tile back" data-act="st-untile" ${z.answered ? 'disabled' : ''}>⌫</button></div>`;
  }
  if (q.input === 'text') {
    return `<form class="q-form" data-form="st-type"><input id="st-input" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="например: twenty-one" ${z.answered ? 'disabled' : ''}>
      <button class="btn primary" ${z.answered ? 'disabled' : ''}>✔</button></form>`;
  }
  return `<div class="q-opts ${q.options.length === 3 ? 'three' : ''}">${q.options.map((o, i) =>
    `<button class="q-opt" data-act="st-opt" data-v="${esc(o)}" ${z.answered ? 'disabled' : ''}><i>${i + 1}</i>${esc(o)}</button>`).join('')}</div>`;
}

function renderQuestion() {
  const z = sv.quiz;
  const q = z.qs[z.i];
  const t = WRStudy.topic(q.topic);
  z.answered = false;
  z.picked = [];
  const pct = Math.round(z.i / z.qs.length * 100);
  ui.innerHTML = `
    ${studyTopbar('st-quit', `${z.mode === 'test' ? '📝' : '🎯'} ${z.i + 1} / ${z.qs.length}`, `<span class="pill">✅ ${z.right}</span>`)}
    <div class="sheet tall study quiz" style="--tc:${t.color}">
      <div class="q-bar"><i style="width:${pct}%"></i></div>
      <div class="qcard">
        <span class="q-topic">${t.icon} ${t.title}</span>
        <div class="q-ask">${q.ask}</div>
        <div class="q-prompt">${promptHTMLStudy(q)}</div>
      </div>
      <div class="q-answer">${answerAreaHTML(q)}</div>
      <div class="q-feedback"></div>
    </div>`;
  if (q.say) setTimeout(() => WRSound.speak(q.say), 250);
  const inp = document.getElementById('st-input');
  if (inp) setTimeout(() => inp.focus(), 50);
}

// Что проговорить после ответа: всегда правильный вариант словами.
function answerSpeech(q) {
  if (q.type === 'verb') return `${q.answer} ${q.item.en}`;
  if (q.item && q.item.n) return q.item.en;
  if (q.type === 'place') {
    const p = WRStudy.items('places').find(x => x.en === q.answer);
    return p ? `${p.prep} the ${p.en}` : q.answer;
  }
  if (q.type === 'en2ru') return q.item.en;
  return q.answer;
}

function submitAnswer(value) {
  const z = sv.quiz;
  if (!z || z.answered) return;
  const q = z.qs[z.i];
  const res = WRStudy.check(q, value);
  z.answered = true;
  WRStudy.recordAnswer(st, q, res.ok);
  const first = z.i < z.total;   // повторы ошибок в оценку не идут
  if (res.ok) {
    if (first) z.right++;
    const c = z.mode === 'test' ? 2 : 1;
    st.coins += c;
    z.coins = (z.coins || 0) + c;
  } else {
    if (first) z.wrong.push({ q, value });
    // в тренировке ошибочный вопрос вернётся в конце (один раз)
    if (z.mode === 'train' && !z.retried.has(z.i)) {
      z.retried.add(z.qs.length);
      z.qs.push(q);
    }
  }
  save();

  // подсветка вариантов
  document.querySelectorAll('.q-opt').forEach(b => {
    b.disabled = true;
    if (b.dataset.v === q.answer) b.classList.add('good');
    else if (b.dataset.v === value) b.classList.add('bad');
  });
  document.querySelectorAll('.tile, #st-input, .q-form button').forEach(b => { b.disabled = true; });
  if (q.input === 'tiles') document.querySelector('.slots')?.classList.add(res.ok ? 'good' : 'bad');
  if (q.input === 'text') document.getElementById('st-input')?.classList.add(res.ok ? 'good' : 'bad');

  if (z.mode === 'test') {
    res.ok ? WRSound.click() : WRSound.miss();
    setTimeout(nextQuestion, 500);
    return;
  }
  res.ok ? WRSound.coin() : WRSound.splash();
  setTimeout(() => WRSound.speak(answerSpeech(q)), 300);
  const fb = document.querySelector('.q-feedback');
  fb.innerHTML = `<div class="fb ${res.ok ? 'good' : 'bad'}">
      <b>${res.ok ? '✅ Верно!' : `❌ Правильно: ${esc(q.answer)}`}</b>
      ${res.note && res.note !== q.item.note ? `<div class="fb-note">💡 ${res.note}</div>` : ''}
      <div class="fb-explain">${q.explain} ${sayBtn(answerSpeech(q), '🔊', 'say mini')}</div>
    </div>
    <button class="btn primary big wide" data-act="st-next-q">Дальше ▶</button>`;
  fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function nextQuestion() {
  const z = sv.quiz;
  if (!z) return;
  z.i++;
  if (z.i >= z.qs.length) { showQuizResult(); return; }
  renderQuestion();
}

function showQuizResult() {
  const z = sv.quiz;
  const pct = Math.round(z.right / z.total * 100);
  const m = WRStudy.mark(pct);
  if (z.key) WRStudy.saveBest(st, z.key, pct);
  save();
  m >= 4 ? WRSound.win() : WRSound.lose();
  const back = sv.topicId && z.key !== `exam-${sv.unitId}` ? 'st-back-topic' : 'study';
  const wrongList = z.wrong.map(({ q, value }) => `
    <div class="word-row">
      <span><b>${esc(q.ask)}</b><br><small>Ответ: ${esc(value || '—')} → <b>${esc(q.answer)}</b></small><br><small>${q.explain}</small></span>
      ${sayBtn(answerSpeech(q), '🔊', 'say mini')}
    </div>`).join('');
  const train = z.mode === 'train';
  ui.innerHTML = `
    ${studyTopbar(back, z.title)}
    <div class="sheet tall study result">
      <h2>${m === 5 ? 'Отлично! 🎉' : m === 4 ? 'Хорошо! 👍' : m === 3 ? 'Неплохо, но надо повторить' : 'Нужно ещё потренироваться'}</h2>
      <div class="mark m${m}">${m}</div>
      <div class="stats">
        <span>Верно<b>${z.right} / ${z.total}</b></span>
        <span>Результат<b>${pct}%</b></span>
        <span>Монеты<b>+${z.coins || 0} 🪙</b></span>
      </div>
      ${train ? '<p class="sub small">В тренировке ошибочные вопросы повторяются ещё раз — оценка считается по первым ответам.</p>' : ''}
      ${wrongList ? `<div class="words-box"><b>Разбор ошибок:</b>${wrongList}</div>` : '<p class="perfect">Без единой ошибки! 🌟</p>'}
      <button class="btn primary big wide" data-act="st-again">🔄 Ещё раз</button>
      <button class="btn soft wide" data-act="${back}">← Назад</button>
    </div>`;
}

// ---------- Ввод ----------

Object.assign(actions, {
  study: () => { WRSound.unlock(); showStudyHub(); },
  'st-topic': el => showTopic(el.dataset.id),
  'st-back-topic': () => showTopic(sv.topicId),
  'st-cards': () => showCards(false),
  'st-cards-weak': () => showCards(true),
  'st-tips': showTips,
  'st-train': () => startQuiz([sv.topicId], 10, 'train', null, `🎯 ${WRStudy.topic(sv.topicId).title}`),
  'st-test': () => startQuiz([sv.topicId], 10, 'test', sv.topicId, `📝 ${WRStudy.topic(sv.topicId).title}`),
  'st-exam': () => {
    sv.topicId = null;
    startQuiz(WRStudy.unit(sv.unitId).topics.map(t => t.id), 20, 'test', `exam-${sv.unitId}`, '📝 Пробная контрольная');
  },
  'st-weak': startWeak,
  'st-again': () => {
    const z = sv.quiz;
    const ids = [...new Set(z.qs.map(q => q.topic))];
    startQuiz(ids, z.total, z.mode, z.key, z.title);
  },
  'st-quit': () => { sv.quiz = null; sv.topicId ? showTopic(sv.topicId) : showStudyHub(); },
  'st-voice': nextVoice,
  'st-say': el => WRSound.speak(el.dataset.say),
  'st-slow': el => WRSound.speakSlow(el.dataset.say),
  'st-prev': () => moveCard(-1),
  'st-next': () => moveCard(1),
  'st-known': () => markCard(true),
  'st-unknown': () => markCard(false),
  'st-hide': () => { sv.hideEn = !sv.hideEn; renderCard(false); },
  'st-reveal': () => { sv.hideEn = false; renderCard(true); sv.hideEn = true; },
  'st-opt': el => submitAnswer(el.dataset.v),
  'st-tile': el => {
    const z = sv.quiz, q = z.qs[z.i];
    const slot = [...q.answer].findIndex((ch, i) => /[a-z]/i.test(ch) && z.picked[i] === undefined);
    if (slot < 0) return;
    z.picked[slot] = +el.dataset.i;
    WRSound.click();
    document.querySelector('.q-answer').innerHTML = answerAreaHTML(q);
    if ([...q.answer].every((ch, i) => !/[a-z]/i.test(ch) || z.picked[i] !== undefined)) {
      submitAnswer([...q.answer].map((ch, i) => /[a-z]/i.test(ch) ? q.tiles[z.picked[i]] : ch).join(''));
    }
  },
  'st-untile': () => {
    const z = sv.quiz, q = z.qs[z.i];
    const filled = Object.keys(z.picked).map(Number);
    if (!filled.length) return;
    delete z.picked[Math.max(...filled)];
    document.querySelector('.q-answer').innerHTML = answerAreaHTML(q);
  },
  'st-next-q': nextQuestion
});

// Нажатие на английский пример в правилах — озвучка.
document.addEventListener('click', e => {
  const q = e.target.closest('.st-tips q, .fc-ex q');
  if (q) WRSound.speak(q.textContent);
});

document.addEventListener('submit', e => {
  if (e.target.dataset.form !== 'st-type') return;
  e.preventDefault();
  const v = document.getElementById('st-input').value;
  if (v.trim()) submitAnswer(v);
});

// Клавиатура: стрелки — карточки, 1–4 — варианты, Enter — дальше.
window.addEventListener('keydown', e => {
  if (run) return;
  if (document.querySelector('.fcard')) {
    if (e.key === 'ArrowLeft') moveCard(-1);
    if (e.key === 'ArrowRight') moveCard(1);
    if (e.key === ' ') { e.preventDefault(); WRSound.speak(sv.cards[sv.card].en); }
    return;
  }
  if (!sv.quiz || e.target.tagName === 'INPUT') return;
  const n = parseInt(e.key, 10);
  const opts = document.querySelectorAll('.q-opt');
  if (n >= 1 && n <= opts.length && !sv.quiz.answered) opts[n - 1].click();
  if (e.key === 'Enter' && sv.quiz.answered) document.querySelector('[data-act="st-next-q"]')?.click();
  if (e.key === 'Backspace' && document.querySelector('.tile.back')) actions['st-untile']();
});

// Свайп по карточке — листать.
let stTouch = null;
window.addEventListener('touchstart', e => {
  if (e.touches.length === 1 && document.querySelector('.fcard')) stTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
}, { passive: true });
window.addEventListener('touchend', e => {
  if (!stTouch) return;
  const dx = e.changedTouches[0].clientX - stTouch.x, dy = e.changedTouches[0].clientY - stTouch.y;
  stTouch = null;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) moveCard(dx < 0 ? 1 : -1);
}, { passive: true });
