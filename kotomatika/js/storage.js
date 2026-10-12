// Хранение профилей в localStorage браузера.
'use strict';

const Store = (() => {
  const KEY = 'kotomatika.v1';
  let db = null;

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
      cat: { fur: 'ginger', breed: 'home', hat: null, glasses: null, neck: null, bg: 'meadow' },
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
    };
  }

  // Дополняем старые профили новыми полями, чтобы обновления игры не ломали сохранения.
  function migrate(p) {
    const d = defaultProfile();
    const out = Object.assign(d, p);
    for (const k of ['cat', 'daily', 'streak', 'settings', 'farm']) out[k] = Object.assign(defaultProfile()[k], p[k] || {});
    return out;
  }

  function load() {
    try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) { db = null; }
    if (!db || typeof db !== 'object' || !db.profiles) db = { profiles: {}, currentId: null };
    for (const id in db.profiles) db.profiles[id] = migrate(db.profiles[id]);
    return db;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* хранилище недоступно — играем без сохранения */ }
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
      p.pin = pin;
      p.cat.fur = fur;
      db.profiles[p.id] = p;
      save();
      return p;
    },
    remove(id) {
      delete db.profiles[id];
      if (db.currentId === id) db.currentId = null;
      save();
    },
    current: () => (db.currentId && db.profiles[db.currentId]) || null,
    setCurrent(id) { db.currentId = id; save(); },
  };
})();
