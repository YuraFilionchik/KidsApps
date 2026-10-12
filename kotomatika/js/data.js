// Игровые данные: миры, магазин, награды, подсказки.
'use strict';

const DAILY_GOAL = 20;      // сколько верных ответов нужно для сундука дня
const LEVEL_TARGET = 10;    // сколько верных ответов нужно, чтобы пройти уровень
const PIN_LENGTH = 3;

const PIN_SYMBOLS = ['🐱', '🐟', '🧶', '🐭', '⭐', '🍓', '🌈', '💎', '🎀'];

const WORLDS = [
  { id: 'w2',  tables: [2],  name: 'Котёнкин дворик', icon: '🏡', color: '#9be36d' },
  { id: 'w3',  tables: [3],  name: 'Рыбный рынок',    icon: '🐟', color: '#6dd3e3' },
  { id: 'w4',  tables: [4],  name: 'Клубочный лес',   icon: '🧶', color: '#f59bd0' },
  { id: 'w5',  tables: [5],  name: 'Мышиная шахта',   icon: '⛏️', color: '#c9a27a' },
  { id: 'w6',  tables: [6],  name: 'Молочная река',   icon: '🥛', color: '#a8d8ff' },
  { id: 'w7',  tables: [7],  name: 'Пиратская бухта', icon: '🏴‍☠️', color: '#ffb86b' },
  { id: 'w8',  tables: [8],  name: 'Снежные горы',    icon: '❄️', color: '#cfe8ff' },
  { id: 'w9',  tables: [9],  name: 'Вулкан Мурр',     icon: '🌋', color: '#ff8a7a' },
  { id: 'w10', tables: [10], name: 'Облачный замок',  icon: '🏰', color: '#d6c4ff' },
  { id: 'mix', tables: [2, 3, 4, 5, 6, 7, 8, 9, 10], name: 'Радужный микс', icon: '🌈', color: '#ffd86b' },
];

const BOSSES = [
  { name: 'Крысиный Король', icon: '🐀', crown: '👑' },
  { name: 'Пёс Барбос',      icon: '🐶', crown: '🎩' },
  { name: 'Робо-Мышь',       icon: '🤖', crown: '⚡' },
  { name: 'Призрак Бу',      icon: '👻', crown: '🕯️' },
  { name: 'Дракон Пыхтун',   icon: '🐉', crown: '🔥' },
];

// Магазин. price: 0 — есть сразу; special — не продаётся, только в награду.
const SHOP = {
  fur: {
    title: 'Шёрстка', icon: '🎨',
    items: [
      { id: 'ginger',  name: 'Рыжий',      price: 0,   color: '#f6a54a', stroke: '#c9752a' },
      { id: 'gray',    name: 'Серый',      price: 0,   color: '#a7b0bc', stroke: '#6f7884' },
      { id: 'white',   name: 'Белый',      price: 0,   color: '#fbf7f0', stroke: '#c9bfb0' },
      { id: 'black',   name: 'Чёрный',     price: 0,   color: '#3d3a4a', stroke: '#1f1d28', eye: '#a6e35a' },
      { id: 'pink',    name: 'Розовый',    price: 60,  color: '#ffb3d1', stroke: '#e07aa6' },
      { id: 'blue',    name: 'Голубой',    price: 60,  color: '#9fd3ff', stroke: '#5a9fd6' },
      { id: 'mint',    name: 'Мятный',     price: 80,  color: '#a6f0c6', stroke: '#5bbf8a' },
      { id: 'lavender',name: 'Лавандовый', price: 80,  color: '#c9b3ff', stroke: '#8f74d6' },
      { id: 'gold',    name: 'Золотой',    price: 200, color: '#ffd84a', stroke: '#d6a400' },
      { id: 'rainbow', name: 'Радужный',   price: 300, rainbow: true,   stroke: '#9a6ad6' },
    ],
  },
  hat: {
    title: 'Шапки', icon: '🎩',
    items: [
      { id: 'bow',    name: 'Бантик',     price: 25,  emoji: '🎀' },
      { id: 'cap',    name: 'Кепка',      price: 35,  emoji: '🧢' },
      { id: 'flower', name: 'Цветочек',   price: 35,  emoji: '🌸' },
      { id: 'helmet', name: 'Каска',      price: 50,  emoji: '⛑️' },
      { id: 'tophat', name: 'Цилиндр',    price: 60,  emoji: '🎩' },
      { id: 'grad',   name: 'Шапка умника', price: 80, emoji: '🎓' },
      { id: 'crown',  name: 'Корона',     price: 150, emoji: '👑' },
    ],
  },
  glasses: {
    title: 'Очки', icon: '🕶️',
    items: [
      { id: 'round', name: 'Очки',          price: 30, emoji: '👓' },
      { id: 'sun',   name: 'Тёмные очки',   price: 50, emoji: '🕶️' },
      { id: 'goggle',name: 'Очки шахтёра',  price: 70, emoji: '🥽' },
    ],
  },
  neck: {
    title: 'Шея', icon: '🔔',
    items: [
      { id: 'bell',  name: 'Колокольчик', price: 20, emoji: '🔔' },
      { id: 'scarf', name: 'Шарфик',      price: 45, emoji: '🧣' },
      { id: 'gem',   name: 'Кулон',       price: 90, emoji: '💎' },
      { id: 'medal', name: 'Медаль чемпиона', special: 'Победи босса', emoji: '🏅' },
      { id: 'star',  name: 'Звезда мира',  special: 'Пройди все миры', emoji: '🌟' },
    ],
  },
  bg: {
    title: 'Фон', icon: '🖼️',
    items: [
      { id: 'meadow', name: 'Лужайка', price: 0,   css: 'linear-gradient(#bfe9ff 0 62%, #6cc644 62% 72%, #8b5a2b 72%)' },
      { id: 'room',   name: 'Комната', price: 0,   css: 'linear-gradient(#ffe8d6 0 70%, #d9a37a 70%)' },
      { id: 'sunset', name: 'Закат',   price: 50,  css: 'linear-gradient(#ff9a8b, #ffd36e 68%, #f7b267 68%)' },
      { id: 'candy',  name: 'Конфетная страна', price: 70, css: 'repeating-linear-gradient(45deg, #ffd1ec 0 18px, #fff0f8 18px 36px)' },
      { id: 'ocean',  name: 'Океан',   price: 70,  css: 'radial-gradient(circle at 30% 20%, #b3ecff, #3fa9f5 60%, #1d6fb8)' },
      { id: 'space',  name: 'Космос',  price: 100, css: 'radial-gradient(circle, #fff 0 1.5px, transparent 2px) 0 0 / 34px 34px, radial-gradient(circle, #ffe9a8 0 1px, transparent 1.5px) 17px 11px / 47px 47px, linear-gradient(#1b1446, #3b2a7a)' },
      { id: 'nether', name: 'Лавовый мир', price: 120, css: 'linear-gradient(#5a1a1a 0 64%, #ff6a00 64% 72%, #7a2a1a 72%)' },
    ],
  },
};

const LEVEL_TITLES = [
  'Котёнок', 'Мурлыка', 'Охотник за мышками', 'Ловкий кот', 'Кот-учёный',
  'Кот-волшебник', 'Кот-ниндзя', 'Король котов', 'Кото-легенда',
];

// Хитрости для таблицы: подбираем по самому «удобному» множителю.
const TIP_PRIORITY = [10, 2, 5, 9, 4, 3, 6, 8, 7];
const TIPS = {
  2:  'Умножить на 2 — значит удвоить: сложи число с самим собой.',
  3:  'На 3: удвой число и прибавь его ещё один раз.',
  4:  'На 4: удвой число, а потом удвой ещё раз!',
  5:  'На 5: ответ всегда кончается на 0 или 5. Это половина от умножения на 10.',
  6:  'На 6: умножь на 5 и прибавь число ещё раз. 6 × 7 = 35 + 7 = 42.',
  7:  'На 7: умножь на 5, потом на 2 и сложи. 7 × 6 = 30 + 12 = 42.',
  8:  'На 8: удвой три раза подряд! 8 × 3: 3 → 6 → 12 → 24.',
  9:  'На 9: умножь на 10 и отними число. 9 × 7 = 70 − 7 = 63. Сумма цифр ответа всегда 9!',
  10: 'На 10: просто припиши 0 в конце!',
};

const PRAISE = ['Мур-р! Верно!', 'Мяу-класс!', 'Ты супер!', 'Умница!', 'Так держать!', 'Пушистый гений!', 'Отлично!', 'Мур-мяу!'];
const COMFORT = ['Ничего, разберёмся!', 'Мяу… почти!', 'Ошибаться не страшно!', 'Давай запомним!'];

// test(p) получает профиль игрока.
const ACHIEVEMENTS = [
  { id: 'first',    icon: '🐾', name: 'Первый шаг',        desc: 'Дай первый верный ответ',      test: p => p.totalCorrect >= 1 },
  { id: 'combo10',  icon: '🔥', name: 'Огненный хвост',    desc: '10 верных ответов подряд',     test: p => p.bestCombo >= 10 },
  { id: 'combo25',  icon: '☄️', name: 'Неудержимый',       desc: '25 верных ответов подряд',     test: p => p.bestCombo >= 25 },
  { id: 'c100',     icon: '💯', name: 'Сотня',             desc: '100 верных ответов',           test: p => p.totalCorrect >= 100 },
  { id: 'c500',     icon: '🐟', name: 'Рыбный улов',       desc: '500 верных ответов',           test: p => p.totalCorrect >= 500 },
  { id: 'c1000',    icon: '🐳', name: 'Кит математики',    desc: '1000 верных ответов',          test: p => p.totalCorrect >= 1000 },
  { id: 'perfect',  icon: '⭐', name: 'Идеально!',         desc: 'Пройди уровень без ошибок',     test: p => p.perfectCount >= 1 },
  { id: 'travel',   icon: '🗺️', name: 'Путешественник',    desc: 'Пройди все миры',              test: p => WORLDS.every(w => (p.stars[w.id] || 0) > 0) },
  { id: 'allstars', icon: '🌟', name: 'Звёздный кот',      desc: 'Собери все звёзды на карте',   test: p => WORLDS.every(w => (p.stars[w.id] || 0) === 3) },
  { id: 'boss1',    icon: '⚔️', name: 'Храбрый котик',     desc: 'Победи первого босса',         test: p => p.bossWins >= 1 },
  { id: 'boss5',    icon: '🛡️', name: 'Гроза злодеев',     desc: 'Победи 5 боссов',              test: p => p.bossWins >= 5 },
  { id: 'blitz20',  icon: '⚡', name: 'Молния',            desc: 'Набери 20 очков в Блице',      test: p => p.blitzBest >= 20 },
  { id: 'blitz35',  icon: '🌩️', name: 'Гроза',             desc: 'Набери 35 очков в Блице',      test: p => p.blitzBest >= 35 },
  { id: 'shop1',    icon: '🛍️', name: 'Модный котик',      desc: 'Купи первую вещь',             test: p => p.purchases >= 1 },
  { id: 'streak3',  icon: '📅', name: 'Три дня подряд',    desc: 'Выполни задание дня 3 дня подряд', test: p => p.streak.best >= 3 },
  { id: 'streak7',  icon: '🏆', name: 'Целая неделя',      desc: 'Выполни задание дня 7 дней подряд', test: p => p.streak.best >= 7 },
  { id: 'master',   icon: '🧠', name: 'Мастер таблицы',    desc: 'Выучи одну таблицу полностью', test: p => masteredTables(p).length >= 1 },
  { id: 'master9',  icon: '🎓', name: 'Профессор Мяу',     desc: 'Выучи все таблицы от 2 до 10', test: p => masteredTables(p).length >= 9 },
];
