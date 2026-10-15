// Word Run: сохранение прогресса в localStorage.
'use strict';

const WRStore = (() => {
  const KEY = 'wordrun.v1';
  let state = null;

  function load() {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(KEY)); } catch (e) { raw = null; }
    state = WRGame.normalizeState(raw);
    return state;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* приватный режим — играем без сохранения */ }
  }

  return {
    load,
    save,
    get: () => state || load()
  };
})();
