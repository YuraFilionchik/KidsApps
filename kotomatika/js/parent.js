// Родительский уголок: вход в облако, резервные копии, перенос сохранения файлом.
// Вход защищён «родительским вопросом» — примером, который ребёнку решать долго.
'use strict';

let parentGate = null;
let parentBack = null;
let snapshotCache = null;
let parentKey = '';

const DATE_LOCALE = LANG === 'pl' ? 'pl-PL' : 'ru-RU';

const cloudApi = () => window.Cloud || { status: 'unavailable' };

const CLOUD_STATUS = {
  loading:     { icon: '⏳', text: t('Подключаемся…') },
  unavailable: { icon: '🚫', text: t('Облако недоступно: нет интернета или игра открыта из файла') },
  signedOut:   { icon: '☁️', text: t('Облако не подключено') },
  syncing:     { icon: '🔄', text: t('Сохраняем…') },
  synced:      { icon: '✅', text: t('Всё сохранено в облаке') },
  offline:     { icon: '📴', text: t('Нет интернета — сохраним, когда появится') },
  error:       { icon: '⚠️', text: t('Не получилось сохранить, попробуем ещё раз') },
};

function timeAgo(ms) {
  if (!ms) return t('никогда');
  const s = Math.round((Date.now() - ms) / 1000);
  if (s < 60) return t('только что');
  if (s < 3600) return t('{n} мин назад', { n: Math.round(s / 60) });
  if (s < 86400) return t('{n} ч назад', { n: Math.round(s / 3600) });
  return new Date(ms).toLocaleDateString(DATE_LOCALE);
}

// Маленький значок облака в меню (обновляется по событиям cloud.js).
function cloudBadgeHTML() {
  const st = CLOUD_STATUS[cloudApi().status] || CLOUD_STATUS.unavailable;
  if (cloudApi().status === 'unavailable' || cloudApi().status === 'signedOut') return '';
  return `<span class="cloud-badge st-${cloudApi().status}" title="${st.text}">${st.icon === '✅' ? '☁️' : st.icon}</span>`;
}

function openParentGate(back) {
  parentBack = back;
  const a = 13 + rand(27);
  const b = 6 + rand(4);
  parentGate = { answer: a * b };
  modal(`<h2>${t('👨‍👩‍👧 Для родителей')}</h2>
    <p>${t('Чтобы войти, решите пример:')}</p>
    <p class="big-eq">${a} × ${b} = ?</p>
    <input id="gateInput" class="text-input" inputmode="numeric" autocomplete="off" maxlength="4">
    <button class="btn big primary wide" data-action="parentGateOk">${t('Войти')}</button>
    <button class="btn wide ghost" data-action="closeModal">${t('Отмена')}</button>`);
  const inp = document.getElementById('gateInput');
  inp.focus();
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') actions.parentGateOk(); });
}

const parentStateKey = () => `${cloudApi().status}|${!!cloudApi().user}`;

function screenParent() {
  parentKey = parentStateKey();
  const c = cloudApi();
  const st = CLOUD_STATUS[c.status] || CLOUD_STATUS.unavailable;
  const signed = !!c.user;
  const list = Store.list();
  const names = {};
  list.forEach(p => { (names[p.name.toLowerCase()] = names[p.name.toLowerCase()] || []).push(p); });
  const dups = Object.values(names).filter(g => g.length > 1);

  let cloudCard;
  if (c.status === 'unavailable' || c.status === 'loading') {
    cloudCard = `<p>${st.icon} ${st.text}</p>`;
  } else if (!signed) {
    cloudCard = `<p>${t('Войдите, чтобы прогресс сохранялся в облаке и переносился на другие устройства. Ребёнку аккаунт не нужен — вход делает взрослый один раз на каждом устройстве.')}</p>
      <button class="btn big primary wide" data-action="cloudGoogle">${t('Войти через Google')}</button>
      <div class="email-row">
        <input id="emailInput" class="text-input" type="email" placeholder="${t('или почта для входа по ссылке')}" autocomplete="email">
        <button class="btn" data-action="cloudEmail">${t('Ссылка')}</button>
      </div>
      ${c.error ? `<p class="hint">${t('Ошибка: {err}', { err: esc(c.error) })}</p>` : ''}`;
  } else {
    cloudCard = `<p class="cloud-status st-${c.status}">${st.icon} ${st.text}${c.lastSync ? ` · ${timeAgo(c.lastSync)}` : ''}</p>
      <p>${t('Аккаунт:')} <b>${esc(c.user.email || c.user.name || t('вход выполнен'))}</b></p>
      <button class="btn wide" data-action="cloudSync">${t('🔄 Сохранить сейчас')}</button>
      <button class="btn wide ghost" data-action="cloudSignOut">${t('Выйти из аккаунта на этом устройстве')}</button>`;
  }

  show(`<div class="screen parent-screen">
    <div class="row-top"><button class="icon-btn" data-action="parentBack">←</button><h2>${t('👨‍👩‍👧 Для родителей')}</h2><div></div></div>

    <div class="card"><h3>${t('☁️ Облачное сохранение')}</h3>${cloudCard}</div>

    <div class="card"><h3>${t('👧 Игроки на этом устройстве')}</h3>
      ${list.length ? list.map(p => {
        const lv = levelInfo(p.xp);
        return `<div class="parent-player">
          <div class="pp-cat">${catHTML(p.cat, 52)}</div>
          <div class="pp-info"><b>${esc(p.name)}</b><small>${t('ур. {lv} · 🐟 {fish} · ⭐ {stars} · изменён {ago}', { lv: lv.level, fish: p.fish, stars: Object.values(p.stars).reduce((s, v) => s + v, 0), ago: timeAgo(p.updatedAt) })}</small></div>
          ${signed ? `<button class="btn small-btn" data-action="cloudSnapshots" data-id="${p.id}">${t('Копии')}</button>` : ''}
        </div>`;
      }).join('') : `<p>${t('Пока нет игроков.')}</p>`}
      ${dups.map(g => `<button class="btn wide gold-soft" data-action="mergeDup" data-ids="${g.map(p => p.id).join(',')}">${t('🔗 Объединить {n} {profiles} «{name}»', { n: g.length, profiles: tn(g.length, 'профиль|профиля|профилей'), name: esc(g[0].name) })}</button>`).join('')}
    </div>

    <div class="card"><h3>${t('💾 Сохранение в файл')}</h3>
      <p>${t('Запасной способ перенести прогресс без облака: скачайте файл и загрузите его на другом устройстве.')}</p>
      <button class="btn wide" data-action="exportSave">${t('⬇️ Скачать сохранение')}</button>
      <label class="btn wide file-btn">${t('⬆️ Загрузить из файла')}<input type="file" id="importFile" accept="application/json,.json" hidden></label>
    </div>
  </div>`);
  const fileInp = document.getElementById('importFile');
  fileInp.addEventListener('change', () => fileInp.files[0] && importSave(fileInp.files[0]));
}

function exportSave() {
  const data = { app: 'kotomatika', version: 1, exportedAt: new Date().toISOString(), profiles: Store.list() };
  const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  const names = Store.list().map(p => p.name).join('-') || t('пусто');
  a.href = URL.createObjectURL(blob);
  a.download = `kotomatika-${names}-${Store.todayStr()}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  toast(t('💾 Файл сохранения скачан'));
}

async function importSave(file) {
  let data;
  try { data = JSON.parse(await file.text()); } catch (e) { toast(t('⚠️ Это не файл сохранения')); return; }
  if (!data || data.app !== 'kotomatika' || !Array.isArray(data.profiles)) { toast(t('⚠️ Это не файл сохранения Котоматики')); return; }
  let added = 0, merged = 0;
  for (const p of data.profiles) {
    if (!p || !p.id || !p.name) continue;
    const local = Store.get(p.id);
    // Не затираем, а сливаем: так из файла нельзя случайно потерять свежий прогресс.
    Store.put(local ? mergeProfiles(local, Store.migrate(p)) : p);
    local ? merged++ : added++;
  }
  Store.save();
  // Сообщаем облаку: профили пришли не из игры, их тоже нужно отправить.
  if (window.Cloud && window.Cloud.syncNow && window.Cloud.user) window.Cloud.syncNow();
  toast(t('✅ Загружено: новых {added}, объединено {merged}', { added, merged }));
  screenParent();
}

async function showSnapshots(id) {
  const p = Store.get(id);
  modal(`<h2>${t('Резервные копии: {name}', { name: esc(p.name) })}</h2><p>${t('Загружаем…')}</p>`);
  try {
    snapshotCache = { id, list: await cloudApi().listSnapshots(id) };
  } catch (e) {
    modal(`<h2>${t('Резервные копии')}</h2><p>${t('Не получилось загрузить: {err}', { err: esc(e.code || e.message) })}</p><button class="btn wide" data-action="closeModal">${t('Закрыть')}</button>`);
    return;
  }
  const rows = snapshotCache.list.map(s => `<button class="snapshot-row" data-action="restoreAsk" data-day="${s.day}">
      <b>${new Date(s.day + 'T12:00').toLocaleDateString(DATE_LOCALE, { day: 'numeric', month: 'long' })}</b>
      <small>${t('ур. {lv} · 🐟 {fish} · ⭐ {stars}', { lv: levelInfo(s.data.xp || 0).level, fish: s.data.fish || 0, stars: Object.values(s.data.stars || {}).reduce((a, v) => a + v, 0) })}</small>
    </button>`).join('');
  modal(`<h2>${t('Резервные копии: {name}', { name: esc(p.name) })}</h2>
    <p>${t('Копия делается раз в день и хранится 30 дней.')}</p>
    <div class="snapshot-list">${rows || `<p>${t('Копий пока нет — первая появится после игры.')}</p>`}</div>
    <button class="btn wide ghost" data-action="closeModal">${t('Закрыть')}</button>`);
}

Object.assign(actions, {
  parent() { openParentGate(P ? 'hub' : 'profiles'); },
  parentGateOk() {
    const v = Number((document.getElementById('gateInput') || {}).value);
    if (v !== parentGate.answer) { toast(t('Неверно. Это раздел для взрослых 🙂')); closeModal(); return; }
    closeModal();
    S = null;
    screenParent();
  },
  parentBack() { if (parentBack === 'hub' && P) screenHub(); else screenProfiles(); },
  async cloudGoogle() {
    try { await cloudApi().signInGoogle(); } catch (e) { toast(t('⚠️ Вход не удался: {err}', { err: esc(e.code || e.message) })); }
  },
  async cloudEmail() {
    const email = (document.getElementById('emailInput').value || '').trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) { toast(t('Введите адрес почты')); return; }
    try { await cloudApi().sendEmailLink(email); toast(t('📧 Ссылка отправлена. Откройте её на этом устройстве.')); }
    catch (e) { toast(t('⚠️ Не получилось отправить: {err}', { err: esc(e.code || e.message) })); }
  },
  async cloudSync() { await cloudApi().syncNow(); toast(t('☁️ Сохранено')); },
  async cloudSignOut() { await cloudApi().signOut(); toast(t('Вы вышли. Прогресс на устройстве остался.')); },
  cloudSnapshots(el) { showSnapshots(el.dataset.id); },
  restoreAsk(el) {
    const day = el.dataset.day;
    modal(`<h2>${t('Восстановить копию?')}</h2>
      <p>${t('Прогресс игрока станет таким, каким был {date}. Всё, что сделано позже, пропадёт на всех устройствах.', { date: new Date(day + 'T12:00').toLocaleDateString(DATE_LOCALE, { day: 'numeric', month: 'long' }) })}</p>
      <button class="btn wide danger" data-action="restoreYes" data-day="${day}">${t('Да, восстановить')}</button>
      <button class="btn wide" data-action="closeModal">${t('Отмена')}</button>`);
  },
  async restoreYes(el) {
    try {
      await cloudApi().restoreSnapshot(snapshotCache.id, el.dataset.day);
      closeModal();
      toast(t('✅ Прогресс восстановлен'));
      screenParent();
    } catch (e) { toast(t('⚠️ Не получилось: {err}', { err: esc(e.code || e.message) })); }
  },
  mergeDup(el) {
    const ids = el.dataset.ids.split(',');
    const profiles = ids.map(id => Store.get(id)).filter(Boolean);
    // Оставляем самый старый профиль (его id), остальные вливаем в него.
    profiles.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    const keep = profiles[0];
    let merged = keep;
    for (const p of profiles.slice(1)) merged = mergeProfiles(merged, { ...p, id: keep.id });
    // Это два разных профиля, а не две версии одного: рыбки и корм заработаны отдельно — складываем.
    // Код из картинок и наряд оставляем от основного профиля (хэш кода привязан к его id).
    merged.id = keep.id;
    merged.name = keep.name;
    merged.pinHash = keep.pinHash;
    merged.cat = JSON.parse(JSON.stringify(keep.cat));
    merged.fish = profiles.reduce((sum, p) => sum + (p.fish || 0), 0);
    merged.farm = { ...merged.farm, food: profiles.reduce((sum, p) => sum + ((p.farm || {}).food || 0), 0) };
    Store.put(merged);
    for (const p of profiles.slice(1)) Store.remove(p.id);
    Store.save();
    if (window.Cloud && window.Cloud.user) window.Cloud.syncNow();
    toast(t('🔗 Профили «{name}» объединены', { name: esc(keep.name) }));
    screenParent();
  },
  exportSave,
});

// Облако сообщило об изменениях — обновляем экран, если это безопасно (не посреди игры).
window.addEventListener('kotomatika:cloud', e => {
  const badge = document.getElementById('cloudBadge');
  if (badge) badge.innerHTML = cloudBadgeHTML();
  if (S) return;
  if (document.querySelector('.parent-screen')) {
    // Перерисовываем, только если что-то видимое поменялось, — чтобы не сбить ввод почты.
    if (!document.getElementById('modal') && (e.detail.type === 'profiles' || parentStateKey() !== parentKey)) screenParent();
    return;
  }
  if (e.detail.type !== 'profiles') return;
  if (document.querySelector('.profiles-screen')) screenProfiles();
  else if (P && document.querySelector('.screen.hub') && e.detail.ids.includes(P.id)) screenHub();
});
