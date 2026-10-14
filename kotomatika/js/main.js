// Обработка нажатий и запуск игры. Подключается последним.
'use strict';

document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el) {
    if (e.target.id === 'modal' && !S) closeModal();
    return;
  }
  const fn = actions[el.dataset.action];
  if (fn) fn(el);
});

document.addEventListener('keydown', e => {
  if (!S || S.locked || document.getElementById('modal')) return;
  if (e.target.tagName === 'INPUT') return;
  if (S.mode === 'column') {
    if (/^[0-9]$/.test(e.key)) colPress(e.key);
  } else if (S.input === 'keypad') {
    if (/^[0-9]$/.test(e.key)) kpPress(e.key);
    else if (e.key === 'Backspace') kpPress('del');
    else if (e.key === 'Enter') kpPress('ok');
  } else if (/^[1-4]$/.test(e.key)) {
    const btn = document.querySelectorAll('.choice')[Number(e.key) - 1];
    if (btn) answer(Number(btn.dataset.v), btn);
  }
});

// ---------- Старт ----------

Store.load();
Sound.setEnabledGetter(() => !P || P.settings.sound);
Sound.setMusicGetters(() => !P || P.settings.music !== false, () => (P && P.settings.musicVol) || 2);
P = Store.current();
if (P) screenHub(); else screenProfiles();
