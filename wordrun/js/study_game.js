// Word Run, режим «Контрольная»: логика без DOM — числа словами, вопросы, проверка ответов,
// оценка и прогресс. Тесты: tests/unit/wordrun-study.test.js
'use strict';

const WRStudy = (() => {
  const D = (typeof STUDY_UNITS !== 'undefined')
    ? { STUDY_UNITS, STUDY_TIPS }
    : require('./study_data.js');

  // ---------- Числа ----------

  const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const ONES_IPA = ['', 'wʌn', 'tuː', 'θriː', 'fɔː', 'faɪv', 'sɪks', 'ˈsevn', 'eɪt', 'naɪn', 'ten',
    'ɪˈlevn', 'twelv', 'ˌθɜːˈtiːn', 'ˌfɔːˈtiːn', 'ˌfɪfˈtiːn', 'ˌsɪksˈtiːn', 'ˌsevnˈtiːn', 'ˌeɪˈtiːn', 'ˌnaɪnˈtiːn'];
  const TENS_IPA = ['', '', 'ˈtwenti', 'ˈθɜːti', 'ˈfɔːti', 'ˈfɪfti', 'ˈsɪksti', 'ˈsevnti', 'ˈeɪti', 'ˈnaɪnti'];

  // Типичные ошибки в написании — ими же делаем неверные варианты ответа.
  const MISSPELL = {
    forty: 'fourty', fourteen: 'forteen', fifteen: 'fiveteen', fifty: 'fivety', ninety: 'ninty',
    nineteen: 'ninteen', eighteen: 'eightteen', eighty: 'eightty', twelve: 'twelf',
    thirteen: 'threeteen', thirty: 'threety', twenty: 'twoty'
  };

  function numberToWords(n) {
    if (n === 100) return 'one hundred';
    if (n < 20) return ONES[n];
    const t = Math.floor(n / 10), u = n % 10;
    return u ? `${TENS[t]}-${ONES[u]}` : TENS[t];
  }

  function numberIpa(n) {
    if (n === 100) return 'wʌn ˈhʌndrəd';
    if (n < 20) return ONES_IPA[n];
    const t = Math.floor(n / 10), u = n % 10;
    if (!u) return TENS_IPA[t];
    // двадцать один: вторичное ударение на десятках, главное — на единицах
    return `${TENS_IPA[t].replace('ˈ', 'ˌ')} ˈ${ONES_IPA[u].replace(/^[ˈˌ]/, '')}`;
  }

  function numberNote(n) {
    const w = numberToWords(n);
    if (n === 4) return 'four — с u. Но forty (40) пишется без u!';
    if (n === 14) return 'fourteen — u остаётся: four + teen.';
    if (n === 40 || (n > 40 && n < 50)) return 'forty — без u! Не путай с four и fourteen.';
    if (n === 5 || n === 15 || (n >= 50 && n < 60)) return 'five → fifteen, fifty: пишется fif-, а не five-.';
    if (n === 3 || n === 13 || (n >= 30 && n < 40)) return 'three → thirteen, thirty: пишется thir-.';
    if (n === 18) return 'eighteen — одна t: eight + een.';
    if (n >= 80 && n < 90) return 'eighty — eight + y.';
    if (n === 19 || (n >= 90 && n < 100)) return 'nineteen, ninety — буква e после nin остаётся.';
    if (n === 11 || n === 12) return `${w} — особое слово, его нужно запомнить.`;
    if (n === 100) return 'Можно сказать one hundred или a hundred.';
    if (n > 12 && n < 20) return '-teen: ударение на конец слова.';
    if (n >= 20 && n % 10 === 0) return '-ty: ударение на начало слова.';
    if (n > 20) return 'Десятки и единицы пишутся через дефис.';
    return '';
  }

  function numberItem(n) {
    return { en: numberToWords(n), ru: String(n), ipa: numberIpa(n), pic: String(n), n, note: numberNote(n) };
  }

  // Карточки для заучивания: 1–20, десятки, 100 и примеры составных чисел.
  const NUMBER_CARDS = [...Array(20)].map((_, i) => i + 1).concat([30, 40, 50, 60, 70, 80, 90, 100, 21, 37, 45, 99]);

  // ---------- Темы ----------

  function units() { return D.STUDY_UNITS; }
  function unit(id) { return D.STUDY_UNITS.find(u => u.id === id) || D.STUDY_UNITS[0]; }
  function tips(topicId) { return D.STUDY_TIPS[topicId] || ''; }

  function topic(id) {
    for (const u of D.STUDY_UNITS) {
      const t = u.topics.find(x => x.id === id);
      if (t) return t;
    }
    return null;
  }

  function items(t) {
    const tp = typeof t === 'string' ? topic(t) : t;
    if (tp.items === 'numbers') return NUMBER_CARDS.map(numberItem);
    return tp.items;
  }

  const itemId = (topicId, it) => `${topicId}:${it.en}`;

  // ---------- Случайности ----------

  function shuffle(arr, rng = Math.random) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const pick = (arr, rng = Math.random) => arr[Math.floor(rng() * arr.length)];

  // Числа для тренировки: чаще «коварные» — 11–19, десятки и с ними составные.
  function randomNumber(rng = Math.random) {
    const r = rng();
    if (r < 0.3) return 11 + Math.floor(rng() * 9);
    if (r < 0.55) return (2 + Math.floor(rng() * 8)) * 10;
    if (r < 0.9) return 21 + Math.floor(rng() * 79);
    return 1 + Math.floor(rng() * 10);
  }

  // Похожие числа: 13 ↔ 30, 47 ↔ 74, соседи.
  function confusableNumbers(n, rng = Math.random) {
    const set = new Set();
    if (n >= 13 && n <= 19) set.add((n - 10) * 10);
    if (n >= 30 && n <= 90 && n % 10 === 0) set.add(n / 10 + 10);
    if (n > 20 && n < 100 && n % 10) {
      const rev = (n % 10) * 10 + Math.floor(n / 10);
      if (rev !== n && rev <= 100) set.add(rev);
      const t = Math.floor(n / 10);
      if (t >= 3) set.add(t + 10);
    }
    set.add(n + 1 <= 100 ? n + 1 : n - 2);
    set.add(n - 1 >= 1 ? n - 1 : n + 2);
    set.delete(n);
    return shuffle([...set], rng).filter(x => x >= 1 && x <= 100);
  }

  function misspell(word) {
    if (MISSPELL[word]) return MISSPELL[word];
    const [t, u] = word.split('-');
    if (u && MISSPELL[t]) return `${MISSPELL[t]}-${u}`;
    if (u && MISSPELL[u]) return `${t}-${MISSPELL[u]}`;
    if (u) return `${t}${u}`;   // без дефиса
    return null;
  }

  // ---------- Вопросы ----------

  const VERB_RULE = {
    play: 'play — игры с мячом, шайбой или ракеткой',
    go: 'go — занятия на -ing, где двигаешься',
    do: 'do — единоборства и гимнастика'
  };

  const SEASON_RU = { winter: 'зима', spring: 'весна', summer: 'лето', autumn: 'осень' };

  function options(correct, pool, n = 4, rng = Math.random) {
    const others = shuffle([...new Set(pool.filter(x => x !== correct))], rng).slice(0, n - 1);
    return shuffle([correct, ...others], rng);
  }

  function baseExplain(it) {
    const ipa = it.ipa ? ` <span class="ipa">[${it.ipa}]</span>` : '';
    return `<b>${it.en}</b>${ipa} — ${it.ru}${it.note ? `<br><small>${it.note}</small>` : ''}`;
  }

  // Буквы для сборки слова: пробелы и дефисы стоят на месте, буквы перемешаны.
  function tilesFor(word, rng = Math.random) {
    const letters = [...word].filter(ch => /[a-z]/i.test(ch));
    let mixed = shuffle(letters, rng);
    for (let k = 0; k < 5 && letters.length > 1 && mixed.join('') === letters.join(''); k++) mixed = shuffle(letters, rng);
    return mixed;
  }

  // forced — нужный верный ответ (для вопроса «где занимаются» из темы «места»)
  function makeQuestion(t, type, it, rng = Math.random, forced = null) {
    const all = items(t);
    const enPool = all.map(x => x.en);
    const q = { type, topic: t.id, item: it, id: itemId(t.id, it) };
    switch (type) {
      case 'pic':
        return { ...q, ask: 'Что на картинке?', prompt: { pic: it }, options: options(it.en, enPool, 4, rng), answer: it.en, explain: baseExplain(it) };
      case 'ru2en':
        return { ...q, ask: 'Как по-английски?', prompt: { ru: it.ru }, options: options(it.en, enPool, 4, rng), answer: it.en, explain: baseExplain(it) };
      case 'en2ru':
        return { ...q, ask: 'Как переводится?', prompt: { en: it.en }, say: it.en, options: options(it.ru, all.map(x => x.ru), 4, rng), answer: it.ru, explain: baseExplain(it) };
      case 'listen':
        return { ...q, ask: 'Послушай и выбери слово', prompt: { audio: it.en }, say: it.en, options: options(it.en, enPool, 4, rng), answer: it.en, explain: baseExplain(it) };
      case 'spell':
        return { ...q, ask: 'Собери слово из букв', prompt: { pic: it, ru: it.ru }, input: 'tiles', tiles: tilesFor(it.en, rng), answer: it.en, explain: baseExplain(it) };
      case 'verb':
        return { ...q, ask: 'Какой глагол нужен?', prompt: { gap: `___ ${it.en}`, pic: it }, options: ['play', 'go', 'do'], answer: it.verb,
          say: null, explain: `<b>${it.verb} ${it.en}</b><br><small>${VERB_RULE[it.verb]}</small>` };
      case 'place': {
        // В теме «места» на вход приходит место: берём вид спорта, которым там занимаются.
        if (!it.places) {
          const sport = pick(items(topic('sports')).filter(s => s.places.includes(it.en)), rng);
          const pq = makeQuestion(topic('sports'), 'place', sport, rng, it.en);
          return { ...pq, topic: t.id, item: it, id: itemId(t.id, it) };
        }
        const placeTopic = topic('places');
        const right = forced || pick(it.places, rng);
        const wrong = items(placeTopic).map(p => p.en).filter(p => !it.places.includes(p));
        const pl = items(placeTopic).find(p => p.en === right);
        const list = it.places.map(p => {
          const x = items(placeTopic).find(y => y.en === p);
          return `${x.prep} the ${p}`;
        }).join(' / ');
        return { ...q, ask: `Где занимаются: ${it.en}?`, prompt: { pic: it, en: it.en }, options: options(right, [right, ...wrong], 4, rng), answer: right,
          explain: `<b>${it.verb} ${it.en}</b> — ${list}<br><small>${pl.en} — ${pl.ru}</small>` };
      }
      case 'monthNext': {
        const months = items(topic('months'));
        const i = months.indexOf(it);
        const after = rng() < 0.6;
        const target = months[(i + (after ? 1 : 11)) % 12];
        return { ...q, ask: after ? `Какой месяц идёт после ${it.en}?` : `Какой месяц идёт перед ${it.en}?`, prompt: { en: it.en }, say: it.en,
          options: options(target.en, months.map(m => m.en), 4, rng), answer: target.en, item: target, id: itemId('months', target),
          explain: after ? `После <b>${it.en}</b> идёт <b>${target.en}</b> (${target.ru}).` : `Перед <b>${it.en}</b> идёт <b>${target.en}</b> (${target.ru}).` };
      }
      case 'monthSeason': {
        const months = items(topic('months'));
        const month = it.season ? it : pick(months.filter(m => m.season === it.en), rng);
        const seasons = items(topic('seasons'));
        const season = seasons.find(s => s.en === month.season);
        return { ...q, ask: `Какое время года: ${month.en}?`, prompt: { en: month.en }, say: month.en,
          options: shuffle(seasons.map(s => s.en), rng), answer: season.en, item: it.season ? it : season,
          id: it.season ? itemId('months', it) : itemId('seasons', season),
          explain: `<b>${month.en}</b> (${month.ru}) — <b>${season.en}</b> (${season.ru})` };
      }
      case 'numWord': {
        const n = it.n;
        const pool = confusableNumbers(n, rng).map(numberToWords);
        const bad = misspell(it.en);
        const opts = options(it.en, bad ? [bad, ...pool] : pool, 4, rng);
        return { ...q, ask: 'Как пишется число?', prompt: { num: n }, options: opts, answer: it.en, explain: `${n} = ${baseExplain(it)}` };
      }
      case 'numListen': {
        const n = it.n;
        return { ...q, ask: 'Послушай и выбери число', prompt: { audio: it.en }, say: it.en,
          options: options(String(n), confusableNumbers(n, rng).map(String), 4, rng), answer: String(n), explain: `${n} = ${baseExplain(it)}` };
      }
      case 'numDigits': {
        const n = it.n;
        return { ...q, ask: 'Какое это число?', prompt: { en: it.en }, say: it.en,
          options: options(String(n), confusableNumbers(n, rng).map(String), 4, rng), answer: String(n), explain: `${n} = ${baseExplain(it)}` };
      }
      case 'numType':
        return { ...q, ask: 'Напиши число словами', prompt: { num: it.n }, input: 'text', answer: it.en, explain: `${it.n} = ${baseExplain(it)}` };
      default:
        throw new Error(`unknown question type ${type}`);
    }
  }

  // Слова, в которых чаще ошибались, попадаются чаще.
  function pickItem(t, st, used, rng = Math.random) {
    if (t.items === 'numbers') {
      let n;
      for (let k = 0; k < 10; k++) { n = randomNumber(rng); if (!used.has(`numbers:${numberToWords(n)}`)) break; }
      return numberItem(n);
    }
    const list = items(t);
    const weak = (st && st.study && st.study.weak) || {};
    const weighted = [];
    for (const it of list) {
      if (used.has(itemId(t.id, it))) continue;
      const w = 1 + Math.min(3, weak[itemId(t.id, it)] || 0) * 2;
      for (let k = 0; k < w; k++) weighted.push(it);
    }
    return pick(weighted.length ? weighted : list, rng);
  }

  // Набор вопросов: темы по кругу, типы вопросов темы — по кругу.
  function makeSession(topicIds, count, st, rng = Math.random) {
    const topics = topicIds.map(topic);
    const typeIdx = {};
    topics.forEach(t => { typeIdx[t.id] = Math.floor(rng() * t.quiz.length); });
    const used = new Set();
    const out = [];
    const order = shuffle(topics, rng);
    for (let i = 0; i < count; i++) {
      const t = order[i % order.length];
      const type = t.quiz[typeIdx[t.id]++ % t.quiz.length];
      const it = pickItem(t, st, used, rng);
      const q = makeQuestion(t, type, it, rng);
      used.add(q.id);
      out.push(q);
    }
    return out;
  }

  // ---------- Проверка ----------

  const norm = s => String(s || '').toLowerCase().trim()
    .replace(/[‐-―−]/g, '-').replace(/\s*-\s*/g, '-').replace(/\s+/g, ' ');

  function check(q, value) {
    const got = norm(value);
    const want = norm(q.answer);
    if (got === want) return { ok: true };
    if (q.type === 'numType') {
      if (q.item.n === 100 && got === 'a hundred') return { ok: true };
      if (got.replace(/[\s-]/g, '') === want.replace(/[\s-]/g, '')) {
        return { ok: false, note: 'Почти! Числа от 21 до 99 пишутся через дефис: ' + q.answer };
      }
      if (MISSPELL[want.split('-')[0]] && got.startsWith(MISSPELL[want.split('-')[0]])) {
        return { ok: false, note: numberNote(q.item.n) };
      }
    }
    return { ok: false };
  }

  // Оценка как в школе.
  function mark(pct) {
    if (pct >= 90) return 5;
    if (pct >= 75) return 4;
    if (pct >= 50) return 3;
    return 2;
  }

  // ---------- Прогресс ----------

  function ensure(st) {
    if (!st.study || typeof st.study !== 'object') st.study = {};
    st.study.known = st.study.known || {};
    st.study.weak = st.study.weak || {};
    st.study.best = st.study.best || {};
    return st.study;
  }

  function setKnown(st, topicId, it, on) {
    const s = ensure(st);
    if (on) s.known[itemId(topicId, it)] = true;
    else delete s.known[itemId(topicId, it)];
  }

  function isKnown(st, topicId, it) {
    return !!ensure(st).known[itemId(topicId, it)];
  }

  // Ошибка — слово «слабое»; верный ответ понемногу его «вылечивает».
  function recordAnswer(st, q, ok) {
    const s = ensure(st);
    const cur = s.weak[q.id] || 0;
    if (ok) { if (cur > 1) s.weak[q.id] = cur - 1; else delete s.weak[q.id]; }
    else s.weak[q.id] = cur + 1;
  }

  function topicProgress(st, t) {
    const tp = typeof t === 'string' ? topic(t) : t;
    const list = items(tp);
    const known = list.filter(it => isKnown(st, tp.id, it)).length;
    return { known, total: list.length, best: ensure(st).best[tp.id] || 0 };
  }

  function saveBest(st, key, pct) {
    const s = ensure(st);
    s.best[key] = Math.max(s.best[key] || 0, pct);
  }

  function weakItems(st, t) {
    const tp = typeof t === 'string' ? topic(t) : t;
    const weak = ensure(st).weak;
    return items(tp).filter(it => weak[itemId(tp.id, it)]);
  }

  return {
    numberToWords, numberIpa, numberNote, numberItem, confusableNumbers, misspell, units, unit, topic, items, tips, itemId,
    makeQuestion, makeSession, check, mark, ensure, setKnown, isKnown, recordAnswer, topicProgress, saveBest, weakItems, shuffle
  };
})();

if (typeof module !== 'undefined') module.exports = WRStudy;
