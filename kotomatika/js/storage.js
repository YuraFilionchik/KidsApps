// Хранение профилей в localStorage браузера. Облачная синхронизация (cloud.js) подписывается
// на изменения через Store.onChange и не нужна для работы игры.
'use strict';

// Компактный SHA-256 (синхронный, работает и на file://, где нет crypto.subtle).
function sha256(str) {
  const K = [];
  const H = [];
  let n = 2;
  for (let found = 0; found < 64; n++) {
    let prime = true;
    for (let d = 2; d * d <= n; d++) if (n % d === 0) { prime = false; break; }
    if (!prime) continue;
    if (found < 8) H[found] = (Math.pow(n, 1 / 2) * 2 ** 32) | 0;
    K[found++] = (Math.pow(n, 1 / 3) * 2 ** 32) | 0;
  }
  const bytes = Array.from(new TextEncoder().encode(str));
  const bitLen = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  for (let i = 7; i >= 0; i--) bytes.push(i >= 4 ? 0 : (bitLen >>> (i * 8)) & 0xff);
  const rotr = (x, r) => (x >>> r) | (x << (32 - r));
  for (let off = 0; off < bytes.length; off += 64) {
    const w = [];
    for (let i = 0; i < 16; i++) w[i] = (bytes[off + i * 4] << 24) | (bytes[off + i * 4 + 1] << 16) | (bytes[off + i * 4 + 2] << 8) | bytes[off + i * 4 + 3];
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const t1 = (h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      [h, g, f, e, d, c, b, a] = [g, f, e, (d + t1) | 0, c, b, a, (t1 + t2) | 0];
    }
    H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
  }
  return H.map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
}

const Store = (() => {
  const KEY = 'kotomatika.v1';
  let db = null;
  const lastJson = {};      // как профиль выглядел при прошлом сохранении — чтобы понять, что изменилось
  const listeners = [];

  // Код из картинок не храним открытым текстом. Это защита от подглядывания, а не шифр:
  // настоящую защиту данных в облаке дают правила доступа Firestore.
  const hashPin = (id, pin) => sha256(id + ':' + pin);

  function todayStr(d = new Date()) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function defaultProfile() {
    return {
      id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: '',
      pin: '',
      createdAt: Date.now(),
      fish: 0,
      xp: 0,
      cat: { fur: 'ginger', breed: 'home', hat: null, glasses: null, neck: null, back: null, paw: null, aura: null, bg: 'meadow' },
      owned: [],
      stars: {},
      facts: {},
      blitzBest: 0,
      bossLevel: 1,
      bossWins: 0,
      daily: { date: todayStr(), correct: 0, claimed: false },
      streak: { count: 0, best: 0, lastDate: null },
      bestCombo: 0,
      totalCorrect: 0,
      totalWrong: 0,
      perfectCount: 0,
      purchases: 0,
      achievements: {},
      settings: { sound: true },
      colStars: {},
      farm: { food: 0, size: 3, pond: [null, null, null], harvested: 0 },
      pets: [],
      pet: null,
      breedsSeen: ['home'],
      updatedAt: Date.now(),
    };
  }

  // Дополняем старые профили новыми полями, чтобы обновления игры не ломали сохранения.
  function migrate(p) {
    const d = defaultProfile();
    const out = Object.assign(d, p);
    for (const k of ['cat', 'daily', 'streak', 'settings', 'farm']) out[k] = Object.assign(defaultProfile()[k], p[k] || {});
    if (out.pin && !out.pinHash) out.pinHash = hashPin(out.id, out.pin);
    delete out.pin;
    return out;
  }

  function load() {
    try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) { db = null; }
    if (!db || typeof db !== 'object' || !db.profiles) db = { profiles: {}, currentId: null };
    if (!db.deviceId) db.deviceId = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    if (!db.sync) db.sync = {};
    for (const id in db.profiles) {
      db.profiles[id] = migrate(db.profiles[id]);
      const { updatedAt, ...rest } = db.profiles[id];
      lastJson[id] = JSON.stringify(rest);
    }
    write();
    return db;
  }

  function write() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* хранилище недоступно — играем без сохранения */ }
  }

  function emit(type, ids) {
    for (const cb of listeners) { try { cb(type, ids); } catch (e) { console.error(e); } }
  }

  // Сохраняем всё; профилям, которые реально изменились, ставим updatedAt и сообщаем подписчикам.
  function save({ silent = false } = {}) {
    const changed = [];
    for (const id in db.profiles) {
      const p = db.profiles[id];
      const before = lastJson[id];
      const { updatedAt, ...rest } = p;
      const now = JSON.stringify(rest);
      if (before !== now) {
        if (!silent) p.updatedAt = Date.now();
        lastJson[id] = now;
        changed.push(id);
      }
    }
    write();
    if (changed.length && !silent) emit('change', changed);
  }

  return {
    todayStr,
    load,
    save,
    list: () => Object.values(db.profiles).sort((a, b) => a.createdAt - b.createdAt),
    get: id => db.profiles[id] || null,
    create(name, pin, fur) {
      const p = defaultProfile();
      p.name = name;
      p.pinHash = hashPin(p.id, pin);
      p.cat.fur = fur;
      db.profiles[p.id] = p;
      save();
      return p;
    },
    remove(id) {
      delete db.profiles[id];
      delete lastJson[id];
      delete db.sync[id];
      if (db.currentId === id) db.currentId = null;
      write();
      emit('remove', [id]);
    },
    current: () => (db.currentId && db.profiles[db.currentId]) || null,
    setCurrent(id) { db.currentId = id; write(); },

    // ---- Код из картинок ----
    hashPin,
    checkPin: (p, pin) => p.pinHash === hashPin(p.id, pin),
    // Для подсказки перебираем все 729 вариантов — так и видно, что хэш лишь от подглядывания.
    pinFirstSymbol(p) {
      const n = PIN_SYMBOLS.length;
      for (let i = 0; i < n ** PIN_LENGTH; i++) {
        const digits = [];
        for (let k = 0, x = i; k < PIN_LENGTH; k++, x = Math.floor(x / n)) digits.unshift(x % n);
        if (hashPin(p.id, digits.join(',')) === p.pinHash) return digits[0];
      }
      return null;
    },

    // ---- Для облачной синхронизации и импорта ----
    onChange(cb) { listeners.push(cb); },
    deviceId: () => db.deviceId,
    syncMeta: id => db.sync[id] || (db.sync[id] = {}),
    saveMeta: write,
    // Записать профиль, пришедший извне (облако, файл). Объект текущего игрока обновляем на месте,
    // чтобы ссылки в игре (P) остались рабочими.
    put(data) {
      const p = migrate(JSON.parse(JSON.stringify(data)));
      const existing = db.profiles[p.id];
      if (existing) {
        for (const k of Object.keys(existing)) delete existing[k];
        Object.assign(existing, p);
      } else {
        db.profiles[p.id] = p;
      }
      const { updatedAt, ...rest } = p;
      lastJson[p.id] = JSON.stringify(rest);
      write();
      emit('external', [p.id]);
      return db.profiles[p.id];
    },
    migrate,
  };
})();
