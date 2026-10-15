// Word Run: миры, слова, скины и следы.
// pic — картинка-подсказка (эмодзи или цифра), color — цвет для мира «Цвета».
// Подпись на русском показывается рядом с картинкой всегда, поэтому
// неоднозначные эмодзи (мама/сестра) не путают.
'use strict';

const WORLDS = [
  {
    id: 1, name: 'Цвета', icon: '🎨', sky: 0x7dd3fc, ground: 0x60a5fa,
    words: [
      { en: 'red', ru: 'красный', pic: '🔴', color: '#ef4444' },
      { en: 'blue', ru: 'синий', pic: '🔵', color: '#3b82f6' },
      { en: 'green', ru: 'зелёный', pic: '🟢', color: '#22c55e' },
      { en: 'yellow', ru: 'жёлтый', pic: '🟡', color: '#facc15' },
      { en: 'black', ru: 'чёрный', pic: '⚫', color: '#1e293b' },
      { en: 'white', ru: 'белый', pic: '⚪', color: '#ffffff' },
      { en: 'orange', ru: 'оранжевый', pic: '🟠', color: '#f97316' },
      { en: 'pink', ru: 'розовый', pic: '🌸', color: '#f9a8d4' },
      { en: 'purple', ru: 'фиолетовый', pic: '🟣', color: '#a855f7' },
      { en: 'brown', ru: 'коричневый', pic: '🟤', color: '#92400e' }
    ]
  },
  {
    id: 2, name: 'Животные', icon: '🐾', sky: 0xa7f3d0, ground: 0x4ade80,
    words: [
      { en: 'cat', ru: 'кошка', pic: '🐱' },
      { en: 'dog', ru: 'собака', pic: '🐶' },
      { en: 'fish', ru: 'рыба', pic: '🐟' },
      { en: 'bird', ru: 'птица', pic: '🐦' },
      { en: 'frog', ru: 'лягушка', pic: '🐸' },
      { en: 'rabbit', ru: 'кролик', pic: '🐰' },
      { en: 'horse', ru: 'лошадь', pic: '🐴' },
      { en: 'cow', ru: 'корова', pic: '🐮' },
      { en: 'pig', ru: 'свинья', pic: '🐷' },
      { en: 'duck', ru: 'утка', pic: '🦆' }
    ]
  },
  {
    id: 3, name: 'Еда', icon: '🍎', sky: 0xfef08a, ground: 0xfbbf24,
    words: [
      { en: 'apple', ru: 'яблоко', pic: '🍎' },
      { en: 'banana', ru: 'банан', pic: '🍌' },
      { en: 'milk', ru: 'молоко', pic: '🥛' },
      { en: 'bread', ru: 'хлеб', pic: '🍞' },
      { en: 'cheese', ru: 'сыр', pic: '🧀' },
      { en: 'egg', ru: 'яйцо', pic: '🥚' },
      { en: 'cake', ru: 'торт', pic: '🎂' },
      { en: 'soup', ru: 'суп', pic: '🍲' },
      { en: 'juice', ru: 'сок', pic: '🧃' },
      { en: 'carrot', ru: 'морковь', pic: '🥕' }
    ]
  },
  {
    id: 4, name: 'Семья', icon: '👪', sky: 0xfbcfe8, ground: 0xf472b6,
    words: [
      { en: 'mum', ru: 'мама', pic: '👩' },
      { en: 'dad', ru: 'папа', pic: '👨' },
      { en: 'sister', ru: 'сестра', pic: '👧' },
      { en: 'brother', ru: 'брат', pic: '👦' },
      { en: 'grandma', ru: 'бабушка', pic: '👵' },
      { en: 'grandpa', ru: 'дедушка', pic: '👴' },
      { en: 'baby', ru: 'малыш', pic: '👶' },
      { en: 'family', ru: 'семья', pic: '👪' }
    ]
  },
  {
    id: 5, name: 'Школа', icon: '🎒', sky: 0xc7d2fe, ground: 0x818cf8,
    words: [
      { en: 'pen', ru: 'ручка', pic: '🖊️' },
      { en: 'pencil', ru: 'карандаш', pic: '✏️' },
      { en: 'book', ru: 'книга', pic: '📕' },
      { en: 'bag', ru: 'рюкзак', pic: '🎒' },
      { en: 'ruler', ru: 'линейка', pic: '📏' },
      { en: 'scissors', ru: 'ножницы', pic: '✂️' },
      { en: 'school', ru: 'школа', pic: '🏫' },
      { en: 'teacher', ru: 'учитель', pic: '🧑‍🏫' }
    ]
  },
  {
    id: 6, name: 'Тело', icon: '👃', sky: 0xfed7aa, ground: 0xfb923c,
    words: [
      { en: 'head', ru: 'голова', pic: '🙂' },
      { en: 'eye', ru: 'глаз', pic: '👁️' },
      { en: 'ear', ru: 'ухо', pic: '👂' },
      { en: 'nose', ru: 'нос', pic: '👃' },
      { en: 'mouth', ru: 'рот', pic: '👄' },
      { en: 'hand', ru: 'рука (кисть)', pic: '✋' },
      { en: 'leg', ru: 'нога', pic: '🦵' },
      { en: 'foot', ru: 'ступня', pic: '🦶' }
    ]
  },
  {
    id: 7, name: 'Числа', icon: '🔢', sky: 0x99f6e4, ground: 0x2dd4bf,
    words: [
      { en: 'one', ru: 'один', pic: '1' },
      { en: 'two', ru: 'два', pic: '2' },
      { en: 'three', ru: 'три', pic: '3' },
      { en: 'four', ru: 'четыре', pic: '4' },
      { en: 'five', ru: 'пять', pic: '5' },
      { en: 'six', ru: 'шесть', pic: '6' },
      { en: 'seven', ru: 'семь', pic: '7' },
      { en: 'eight', ru: 'восемь', pic: '8' },
      { en: 'nine', ru: 'девять', pic: '9' },
      { en: 'ten', ru: 'десять', pic: '10' }
    ]
  },
  {
    id: 8, name: 'Одежда', icon: '👕', sky: 0xe9d5ff, ground: 0xc084fc,
    words: [
      { en: 'hat', ru: 'шапка, шляпа', pic: '👒' },
      { en: 'T-shirt', ru: 'футболка', pic: '👕' },
      { en: 'dress', ru: 'платье', pic: '👗' },
      { en: 'shoes', ru: 'туфли, обувь', pic: '👟' },
      { en: 'socks', ru: 'носки', pic: '🧦' },
      { en: 'coat', ru: 'пальто', pic: '🧥' },
      { en: 'scarf', ru: 'шарф', pic: '🧣' },
      { en: 'jeans', ru: 'джинсы', pic: '👖' }
    ]
  },
  {
    id: 9, name: 'Природа', icon: '🌦️', sky: 0xbae6fd, ground: 0x34d399,
    words: [
      { en: 'sun', ru: 'солнце', pic: '☀️' },
      { en: 'rain', ru: 'дождь', pic: '🌧️' },
      { en: 'snow', ru: 'снег', pic: '❄️' },
      { en: 'wind', ru: 'ветер', pic: '💨' },
      { en: 'cloud', ru: 'облако', pic: '☁️' },
      { en: 'tree', ru: 'дерево', pic: '🌳' },
      { en: 'flower', ru: 'цветок', pic: '🌷' },
      { en: 'rainbow', ru: 'радуга', pic: '🌈' }
    ]
  },
  {
    id: 10, name: 'Действия', icon: '🏃', sky: 0xfecdd3, ground: 0xfb7185,
    words: [
      { en: 'run', ru: 'бегать', pic: '🏃' },
      { en: 'jump', ru: 'прыгать', pic: '🤸' },
      { en: 'swim', ru: 'плавать', pic: '🏊' },
      { en: 'sing', ru: 'петь', pic: '🎤' },
      { en: 'dance', ru: 'танцевать', pic: '💃' },
      { en: 'read', ru: 'читать', pic: '📖' },
      { en: 'write', ru: 'писать', pic: '✍️' },
      { en: 'sleep', ru: 'спать', pic: '😴' }
    ]
  }
];

// Блочные человечки. hat — аксессуар, который рисует runner3d.js.
const SKINS = [
  { id: 'block', name: 'Блоки', icon: '🟨', price: 0, head: 0xfacc15, torso: 0x2563eb, legs: 0x16a34a, hat: null },
  { id: 'cat', name: 'Кот', icon: '🐱', price: 60, head: 0xfb923c, torso: 0xf97316, legs: 0xfff7ed, hat: 'ears' },
  { id: 'ninja', name: 'Ниндзя', icon: '🥷', price: 120, head: 0x334155, torso: 0x0f172a, legs: 0x1e293b, hat: 'band' },
  { id: 'robot', name: 'Робот', icon: '🤖', price: 180, head: 0xcbd5e1, torso: 0x64748b, legs: 0x38bdf8, hat: 'antenna' },
  { id: 'knight', name: 'Рыцарь', icon: '🛡️', price: 250, head: 0xe2e8f0, torso: 0x94a3b8, legs: 0x475569, hat: 'plume' },
  { id: 'princess', name: 'Принцесса', icon: '👑', price: 300, head: 0xfde68a, torso: 0xec4899, legs: 0xf9a8d4, hat: 'crown' }
];

const TRAILS = [
  { id: 'none', name: 'Без следа', icon: '⚪', price: 0, color: null },
  { id: 'gold', name: 'Золотые искры', icon: '✨', price: 50, color: 0xfacc15 },
  { id: 'ice', name: 'Ледяной', icon: '💎', price: 90, color: 0x38bdf8 },
  { id: 'fire', name: 'Огненный', icon: '🔥', price: 140, color: 0xf97316 },
  { id: 'magic', name: 'Волшебный', icon: '🔮', price: 200, color: 0xc084fc },
  { id: 'rainbow', name: 'Радужный', icon: '🌈', price: 320, color: 'rainbow' }
];

if (typeof module !== 'undefined') module.exports = { WORLDS, SKINS, TRAILS };
