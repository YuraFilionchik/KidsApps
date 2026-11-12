// Язык интерфейса: русский (исходный) или польский.
// Тексты в коде пишутся по-русски и оборачиваются в t('…'); польский перевод ищется
// по русской строке в словаре I18N_PL (файлы js/i18n/pl-*.js).
// Язык выбирается на экране входа и применяется перезагрузкой страницы,
// поэтому данные (миры, магазин, награды) переводятся один раз — при загрузке.
'use strict';

const LANG_KEY = 'kotomatika.lang';
const LANGS = [
  { id: 'ru', flag: '🇷🇺', name: 'Русский' },
  { id: 'pl', flag: '🇵🇱', name: 'Polski' },
];
const LANG = (() => {
  try { return localStorage.getItem(LANG_KEY) === 'pl' ? 'pl' : 'ru'; } catch (e) { return 'ru'; }
})();
const I18N_PL = {};

// t('Привет, {name}!', { name }) — перевод строки с подстановкой {параметров}.
function t(s, params) {
  let r = (LANG === 'pl' && I18N_PL[s]) || s;
  if (params) r = r.replace(/\{(\w+)\}/g, (m, k) => (k in params ? params[k] : m));
  return r;
}

// tn(5, 'рыбка|рыбки|рыбок') → «рыбок»; в словаре: 'рыбка|рыбки|рыбок': 'rybka|rybki|rybek'.
// Формы: одна / несколько (2–4) / много (5+). Правила русского и польского различаются только для 1 в составных числах (21, 31…).
function tn(n, forms) {
  const f = t(forms).split('|');
  const a = Math.abs(n), d = a % 10, h = a % 100;
  let i;
  if (LANG === 'pl') i = a === 1 ? 0 : d >= 2 && d <= 4 && (h < 12 || h > 14) ? 1 : 2;
  else i = d === 1 && h !== 11 ? 0 : d >= 2 && d <= 4 && (h < 12 || h > 14) ? 1 : 2;
  return f[i] || f[f.length - 1];
}

function setLang(id) {
  try { localStorage.setItem(LANG_KEY, id === 'pl' ? 'pl' : 'ru'); } catch (e) { /* без хранилища язык не запомнится */ }
  location.reload();
}

document.documentElement.lang = LANG;
