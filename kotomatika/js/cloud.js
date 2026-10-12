// Облачное сохранение прогресса (Firebase Auth + Firestore). ES-модуль, подключается последним.
// Игра от него не зависит: если SDK не загрузился (нет сети, файл открыт с диска),
// window.Cloud остаётся в статусе «unavailable», а прогресс живёт в localStorage как раньше.
// Схема данных и алгоритм — docs/firebase-plan.md, разделы 3–5.

const SDK_VERSION = '12.19.0';
const CDN = `https://www.gstatic.com/firebasejs/${SDK_VERSION}`;
const PUSH_DELAY = 5000;          // ждём 5 секунд тишины, чтобы серия ответов ушла одной записью
const DAILY_WRITE_LIMIT = 500;    // предохранитель от ошибки в коде, которая начнёт писать без остановки
const SNAPSHOT_DAYS = 30;
const LIMITS_KEY = 'kotomatika.cloud.limits';
const EMAIL_KEY = 'kotomatika.cloud.email';

const useEmulator = new URLSearchParams(location.search).has('emulator');

let fb = null;       // загруженные модули SDK
let auth = null;
let db = null;
let uid = null;
let unsubscribe = null;
let pushTimer = null;
const pending = new Set();
let inFlight = 0;

const Cloud = {
  status: 'loading',   // loading | unavailable | signedOut | syncing | synced | offline | error
  user: null,
  lastSync: null,
  error: null,
};
window.Cloud = Cloud;

function emit(type, ids = []) {
  window.dispatchEvent(new CustomEvent('kotomatika:cloud', { detail: { type, ids } }));
}

function setStatus(status, error = null) {
  Cloud.status = status;
  Cloud.error = error;
  if (status === 'synced') Cloud.lastSync = Date.now();
  emit('status');
}

const today = () => Store.todayStr();
const clone = x => JSON.parse(JSON.stringify(x));

// Отпечаток профиля без updatedAt: по нему понимаем, менялся ли профиль после последней синхронизации.
function fingerprint(p) {
  const { updatedAt, ...rest } = p;
  return sha256(JSON.stringify(rest));
}

// Метаданные синхронизации профиля относятся к конкретному аккаунту семьи.
function meta(id) {
  const m = Store.syncMeta(id);
  if (m.uid !== uid) { for (const k of Object.keys(m)) delete m[k]; m.uid = uid; }
  return m;
}

function profileRef(id) { return fb.doc(db, 'families', uid, 'profiles', id); }

function fromRemote(d) { return { ...d.data, pinHash: d.pinHash || '' }; }

// ---------- Ограничение числа записей ----------

function takeWriteQuota() {
  let l;
  try { l = JSON.parse(localStorage.getItem(LIMITS_KEY)) || {}; } catch (e) { l = {}; }
  if (l.day !== today()) l = { day: today(), writes: 0 };
  if (l.writes >= DAILY_WRITE_LIMIT) return false;
  l.writes++;
  try { localStorage.setItem(LIMITS_KEY, JSON.stringify(l)); } catch (e) { /* ничего */ }
  return true;
}

// ---------- Из облака на устройство ----------

function reconcile(id, remote) {
  const m = meta(id);
  const local = Store.get(id);
  const remoteData = fromRemote(remote);
  if (!local) {
    // Новое устройство или восстановление: профиль есть только в облаке.
    const p = Store.put(remoteData);
    Object.assign(m, { rev: remote.rev, hash: fingerprint(p) });
    Store.saveMeta();
    return true;
  }
  if (m.rev && remote.rev <= m.rev) return false;   // эту версию мы уже знаем
  const localChanged = !m.rev || fingerprint(local) !== m.hash;
  if (!localChanged) {
    const p = Store.put(remoteData);
    Object.assign(m, { rev: remote.rev, hash: fingerprint(p) });
    Store.saveMeta();
    return true;
  }
  // На этом устройстве тоже играли — сливаем и отправляем результат.
  Store.put(mergeProfiles(local, remoteData));
  m.rev = remote.rev;
  Store.saveMeta();
  schedulePush(id, 0);
  return true;
}

function onSnapshotChange(snap) {
  const touched = [];
  for (const ch of snap.docChanges()) {
    if (ch.doc.metadata.hasPendingWrites) continue;
    const id = ch.doc.id;
    if (ch.type === 'removed') {
      // Профиль удалили на другом устройстве.
      const m = meta(id);
      if (Store.get(id) && m.rev) { Store.remove(id); touched.push(id); }
      continue;
    }
    if (reconcile(id, ch.doc.data())) touched.push(id);
  }
  if (touched.length) emit('profiles', touched);
  if (Cloud.status !== 'syncing' && navigator.onLine) setStatus('synced');
}

// ---------- С устройства в облако ----------

function schedulePush(id, delay = PUSH_DELAY) {
  pending.add(id);
  clearTimeout(pushTimer);
  pushTimer = setTimeout(flush, delay);
}

async function flush() {
  clearTimeout(pushTimer);
  if (!uid) return;
  if (!navigator.onLine) { setStatus('offline'); return; }
  const ids = [...pending];
  pending.clear();
  for (const id of ids) {
    try {
      await push(id);
    } catch (e) {
      console.warn('[cloud] не удалось сохранить', id, e);
      pending.add(id);
      setStatus(navigator.onLine ? 'error' : 'offline', e.code || e.message);
      clearTimeout(pushTimer);
      pushTimer = setTimeout(flush, 30000);   // повторим позже
      return;
    }
  }
}

async function push(id, { force = false } = {}) {
  const local = Store.get(id);
  if (!local || !uid) return;
  const m = meta(id);
  const sentHash = fingerprint(local);
  if (!force && m.rev && sentHash === m.hash) return;   // ничего нового
  if (!takeWriteQuota()) { console.warn('[cloud] достигнут дневной лимит записей'); setStatus('error', 'daily-limit'); return; }

  inFlight++;
  setStatus('syncing');
  const ref = profileRef(id);
  const day = today();
  const deviceId = Store.deviceId();
  try {
    const res = await fb.runTransaction(db, async tx => {
      const snap = await tx.get(ref);
      const remote = snap.exists() ? snap.data() : null;
      const base = remote ? remote.rev : 0;
      let data = clone(local);
      let merged = false;
      if (remote && !force && base > (m.rev || 0)) {
        data = mergeProfiles(data, fromRemote(remote));   // кто-то записал раньше нас
        merged = true;
      }
      const { pinHash, ...rest } = data;
      const payload = clone(rest);
      tx.set(ref, {
        data: payload, rev: base + 1, updatedAt: fb.serverTimestamp(),
        updatedBy: deviceId, schemaVersion: 1, pinHash: pinHash || '',
      });
      if (m.snapDay !== day) {
        tx.set(fb.doc(ref, 'snapshots', day), {
          data: payload, rev: base + 1, pinHash: pinHash || '', createdAt: fb.serverTimestamp(),
          expireAt: fb.Timestamp.fromMillis(Date.now() + SNAPSHOT_DAYS * 864e5),
        });
      }
      return { data, rev: base + 1, merged };
    });
    let hash = sentHash;
    if (res.merged) hash = fingerprint(Store.put(res.data));
    Object.assign(meta(id), { rev: res.rev, hash, snapDay: day });
    Store.saveMeta();
    if (res.merged) emit('profiles', [id]);
    // Пока шла запись, ребёнок мог сыграть ещё — отправим и это.
    const now = Store.get(id);
    if (now && fingerprint(now) !== hash) schedulePush(id);
  } finally {
    inFlight--;
    if (inFlight === 0 && !pending.size) setStatus('synced');
  }
}

async function removeRemote(id) {
  if (!uid) return;
  try { await fb.deleteDoc(profileRef(id)); } catch (e) { console.warn('[cloud] не удалось удалить', id, e); }
}

// ---------- Вход и подписка ----------

async function onUser(user) {
  if (unsubscribe) { unsubscribe(); unsubscribe = null; }
  uid = user ? user.uid : null;
  Cloud.user = user ? { uid: user.uid, email: user.email || '', name: user.displayName || '' } : null;
  if (!user) { setStatus('signedOut'); return; }
  setStatus('syncing');
  try {
    await fb.setDoc(fb.doc(db, 'families', uid), { lastSeen: fb.serverTimestamp() }, { merge: true });
  } catch (e) { console.warn('[cloud] семья', e); }
  let first = true;
  unsubscribe = fb.onSnapshot(fb.collection(db, 'families', uid, 'profiles'), snap => {
    onSnapshotChange(snap);
    if (first) {
      first = false;
      // Первая загрузка: всё, чего ещё нет в облаке или что изменилось офлайн, — отправляем.
      for (const p of Store.list()) {
        const m = meta(p.id);
        if (!m.rev || fingerprint(p) !== m.hash) pending.add(p.id);
      }
      if (pending.size) flush(); else setStatus('synced');
    }
  }, e => { console.warn('[cloud] подписка', e); setStatus('error', e.code || e.message); });
}

async function finishEmailLink() {
  if (!fb.isSignInWithEmailLink(auth, location.href)) return;
  let email = '';
  try { email = localStorage.getItem(EMAIL_KEY) || ''; } catch (e) { /* ничего */ }
  if (!email) email = window.prompt('Для входа введите адрес почты, на который пришла ссылка') || '';
  if (!email) return;
  try {
    await fb.signInWithEmailLink(auth, email, location.href);
    try { localStorage.removeItem(EMAIL_KEY); } catch (e) { /* ничего */ }
  } catch (e) {
    Cloud.error = e.code || e.message;
  }
  history.replaceState(null, '', location.pathname);
}

// ---------- Публичные функции для игры и родительского уголка ----------

Object.assign(Cloud, {
  async signInGoogle() {
    const provider = new fb.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await fb.signInWithPopup(auth, provider);
    } catch (e) {
      if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') {
        await fb.signInWithRedirect(auth, provider);
      } else throw e;
    }
  },
  async sendEmailLink(email) {
    await fb.sendSignInLinkToEmail(auth, email, { url: location.origin + location.pathname, handleCodeInApp: true });
    try { localStorage.setItem(EMAIL_KEY, email); } catch (e) { /* ничего */ }
  },
  async signOut() {
    await flush();
    await fb.signOut(auth);
  },
  async syncNow() {
    for (const p of Store.list()) pending.add(p.id);
    await flush();
  },
  async listSnapshots(id) {
    const qs = await fb.getDocs(fb.collection(profileRef(id), 'snapshots'));
    return qs.docs.map(d => ({ day: d.id, rev: d.data().rev, data: d.data().data, pinHash: d.data().pinHash }))
      .sort((a, b) => (a.day < b.day ? 1 : -1));
  },
  // Откат к резервной копии: заменяем профиль целиком (без слияния) и записываем поверх облака.
  async restoreSnapshot(id, day) {
    const list = await Cloud.listSnapshots(id);
    const s = list.find(x => x.day === day);
    if (!s) throw new Error('snapshot-not-found');
    const current = Store.get(id);
    const restored = { ...s.data, pinHash: s.pinHash || (current && current.pinHash) || '', updatedAt: Date.now() };
    Store.put(restored);
    await push(id, { force: true });
    emit('profiles', [id]);
  },
});

// ---------- Запуск ----------

async function start() {
  const cfg = window.FIREBASE_CONFIG;
  if (!cfg) { setStatus('unavailable'); return; }
  try {
    const [appMod, authMod, fsMod] = await Promise.all([
      import(`${CDN}/firebase-app.js`),
      import(`${CDN}/firebase-auth.js`),
      import(`${CDN}/firebase-firestore.js`),
    ]);
    fb = { ...appMod, ...authMod, ...fsMod };
  } catch (e) {
    console.warn('[cloud] Firebase SDK не загрузился — играем без облака', e);
    setStatus('unavailable');
    return;
  }
  const app = fb.initializeApp(useEmulator ? { ...cfg, projectId: 'demo-kidsapp', apiKey: 'demo-key' } : cfg);
  auth = fb.getAuth(app);
  db = fb.getFirestore(app);
  if (useEmulator) {
    fb.connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    fb.connectFirestoreEmulator(db, '127.0.0.1', 8080);
    // Только для автотестов на эмуляторе: вход без окна Google.
    Cloud.testSignIn = (sub, email) => fb.signInWithCredential(auth,
      fb.GoogleAuthProvider.credential(JSON.stringify({ sub, email, email_verified: true })));
  }

  Store.onChange((type, ids) => {
    if (!uid) return;
    if (type === 'change') for (const id of ids) schedulePush(id);
    if (type === 'remove') for (const id of ids) removeRemote(id);
  });
  addEventListener('online', () => { if (uid) { for (const p of Store.list()) pending.add(p.id); flush(); } });
  addEventListener('offline', () => { if (uid) setStatus('offline'); });
  // Ребёнок закрыл вкладку или свернул браузер — отправляем сразу, не дожидаясь паузы.
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && pending.size) flush(); });
  addEventListener('pagehide', () => { if (pending.size) flush(); });

  await finishEmailLink();
  fb.getRedirectResult(auth).catch(e => { Cloud.error = e.code || e.message; });
  fb.onAuthStateChanged(auth, onUser);
}

start();
