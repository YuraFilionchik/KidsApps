// Word Run: картинки слов, миров и Стражей.
// Если PNG лежит в img/ — берём его, иначе рисуем эмодзи-заглушку.
// Список нужных картинок: wordrun/IMAGES.md
'use strict';

const WRArt = (() => {
  const cache = {};   // path -> { img, ok }

  function load(path) {
    if (cache[path]) return cache[path];
    const rec = { img: new Image(), ok: false, waiters: [] };
    rec.promise = new Promise(res => {
      rec.img.onload = () => { rec.ok = true; res(rec); };
      rec.img.onerror = () => { rec.ok = false; res(rec); };
    });
    rec.img.src = path;
    cache[path] = rec;
    return rec;
  }

  const fileName = en => en.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const wordPath = en => `img/words/${fileName(en)}.png`;
  const worldPath = id => `img/worlds/world-${id}.png`;
  const bossPath = id => `img/bosses/boss-${id}.png`;

  // Загрузить картинки мира заранее (до старта забега), чтобы ворота сразу были с картинками.
  function preloadWorld(world) {
    const jobs = world.words.filter(w => !w.color).map(w => load(wordPath(w.en)).promise);
    jobs.push(load(bossPath(world.id)).promise);
    return Promise.all(jobs);
  }

  function preloadWords(words) {
    // у цветов вместо картинки — цветной кружок, PNG не нужен
    return Promise.all(words.filter(w => !w.color).map(w => load(wordPath(w.en)).promise));
  }

  function ready(path) {
    const rec = cache[path];
    return rec && rec.ok ? rec.img : null;
  }

  const wordImage = en => ready(wordPath(en));
  const bossImage = id => ready(bossPath(id));

  // HTML для картинки слова в интерфейсе: PNG или эмодзи.
  function wordHTML(word, cls = 'pic') {
    if (word.color) return `<span class="${cls} color-dot" style="background:${word.color}"></span>`;
    const img = wordImage(word.en);
    if (img) return `<img class="${cls}" src="${img.src}" alt="">`;
    const digit = /^\d+$/.test(word.pic);
    return `<span class="${cls} ${digit ? 'digit' : 'emoji'}">${word.pic}</span>`;
  }

  function worldHTML(world, cls = 'w-icon') {
    const rec = load(worldPath(world.id));
    if (rec.ok) return `<img class="${cls}" src="${rec.img.src}" alt="">`;
    return `<span class="${cls}">${world.icon}</span>`;
  }

  // Нарисовать картинку слова в canvas (для ворот): PNG, цветной круг, цифра или эмодзи.
  function drawWord(ctx, word, cx, cy, size) {
    if (word.color) {
      ctx.fillStyle = word.color;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = Math.max(4, size * 0.04);
      ctx.strokeStyle = '#334155';
      ctx.stroke();
      return;
    }
    const img = wordImage(word.en);
    if (img) {
      const k = Math.min(size / img.width, size / img.height);
      ctx.drawImage(img, cx - img.width * k / 2, cy - img.height * k / 2, img.width * k, img.height * k);
      return;
    }
    const digit = /^\d+$/.test(word.pic);
    ctx.fillStyle = digit ? '#1d4ed8' : '#000';
    ctx.font = digit ? `900 ${size * 0.8}px Nunito, sans-serif` : `${size * 0.8}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(word.pic, cx, cy + size * 0.04);
  }

  // Иконки миров для карты — грузим при старте, чтобы карта сразу была с картинками.
  function preloadIcons(worlds) {
    return Promise.all(worlds.map(w => load(worldPath(w.id)).promise));
  }

  return { load, preloadIcons, preloadWorld, preloadWords, wordImage, bossImage, wordHTML, worldHTML, drawWord, wordPath };
})();
