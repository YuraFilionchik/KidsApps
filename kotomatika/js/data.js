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
// Наряды рисуются внутри SVG котика. pos — координаты центра в системе котика (200×200):
// x (по умолчанию 100), y, s — размер, r — наклон. Для шеи collar — цвет ошейника, scarf — цвет шарфа.
// art — имя рисунка из art.js. Редкость вещи определяется ценой (см. itemTier).
const SHOP = {
  fur: {
    title: 'Шёрстка', icon: '🎨',
    items: [
      { id: 'ginger',  name: 'Рыжий',      price: 0,   color: '#f6a54a', stroke: '#c9752a' },
      { id: 'gray',    name: 'Серый',      price: 0,   color: '#a7b0bc', stroke: '#6f7884' },
      { id: 'white',   name: 'Белый',      price: 0,   color: '#fbf7f0', stroke: '#c9bfb0' },
      { id: 'black',   name: 'Чёрный',     price: 0,   color: '#3d3a4a', stroke: '#1f1d28', eye: '#a6e35a' },
      { id: 'cream',   name: 'Кремовый',   price: 0,   color: '#f6e3c6', stroke: '#c9a97a' },
      { id: 'peach',   name: 'Персиковый', price: 0,   color: '#f6c9b8', stroke: '#d99a86' },
      { id: 'pink',    name: 'Розовый',    price: 60,  color: '#ffb3d1', stroke: '#e07aa6' },
      { id: 'blue',    name: 'Голубой',    price: 60,  color: '#9fd3ff', stroke: '#5a9fd6' },
      { id: 'mint',    name: 'Мятный',     price: 80,  color: '#a6f0c6', stroke: '#5bbf8a' },
      { id: 'lavender',name: 'Лавандовый', price: 80,  color: '#c9b3ff', stroke: '#8f74d6' },
      { id: 'gold',    name: 'Золотой',    price: 200, color: '#ffd84a', stroke: '#d6a400' },
      { id: 'rainbow', name: 'Радужный',   price: 300, grad: ['#ff9a9e', '#ffd36e', '#a6f0c6', '#9fd3ff', '#c9b3ff'], stroke: '#9a6ad6' },
      { id: 'candyfur',name: 'Конфетный',  price: 350, grad: ['#ffb3d1', '#fff0f8', '#a6f0c6'], stroke: '#e07aa6' },
      { id: 'ice',     name: 'Ледяной',    price: 450, grad: ['#f2fbff', '#9fd3ff', '#c9b3ff'], stroke: '#5a9fd6', eye: '#2f7fd0' },
      { id: 'firefur', name: 'Огненный',   price: 600, grad: ['#ffe14a', '#ff8a3d', '#e23d4b'], stroke: '#a51f2c' },
      { id: 'galaxy',  name: 'Галактика',  price: 900, grad: ['#2a1d5c', '#7c5bd9', '#3fa9f5'], stroke: '#1a1240', eye: '#ffd84a', sparkle: true },
      { id: 'lemon',   name: 'Лимонный',   price: 60,  color: '#fff17a', stroke: '#d6c400' },
      { id: 'coral',   name: 'Коралловый', price: 80,  color: '#ff9a8b', stroke: '#d6665a' },
      { id: 'choco',   name: 'Шоколадный', price: 100, color: '#8b5a3c', stroke: '#5a3520', eye: '#ffd84a' },
      { id: 'silver',  name: 'Серебряный', price: 150, color: '#dde3ea', stroke: '#8a96a6', eye: '#4aa3ff' },
      { id: 'teal',    name: 'Бирюзовый',  price: 150, color: '#5fd6c9', stroke: '#2a9a8f' },
      { id: 'sunsetfur', name: 'Закатный', price: 400, grad: ['#ffd36e', '#ff9a8b', '#c9b3ff'], stroke: '#d6665a' },
      { id: 'seafur',  name: 'Морской',    price: 500, grad: ['#a6f0c6', '#5fd6c9', '#3f7fd6'], stroke: '#2a6fb8' },
      { id: 'neon',    name: 'Неоновый',   price: 750, grad: ['#39ff8a', '#3fd6ff', '#ff3fd6'], stroke: '#7a1fa8', eye: '#ff3fd6', sparkle: true },
      { id: 'pumpkin', name: 'Тыквенный',  price: 120, color: '#ff9a3c', stroke: '#c45a00', eye: '#8fd14a' },
      { id: 'ghost',   name: 'Привидение', price: 250, color: '#eef3ff', stroke: '#9aa8c9', eye: '#5ab0ff' },
      { id: 'witchfur',name: 'Ведьмин',    price: 500, grad: ['#1d1430', '#5b33b8', '#8fd14a'], stroke: '#0d0820', eye: '#8fd14a' },
    ],
  },
  hat: {
    title: 'Шапки', icon: '🎩',
    items: [
      { id: 'bow',    name: 'Бантик',     price: 25,  emoji: '🎀', pos: { y: 24, s: 54 } },
      { id: 'cap',    name: 'Кепка',      price: 35,  emoji: '🧢', pos: { y: 20, s: 70 } },
      { id: 'flower', name: 'Цветочек',   price: 35,  emoji: '🌸', pos: { x: 134, y: 38, s: 42, r: 15 } },
      { id: 'helmet', name: 'Каска',      price: 50,  emoji: '⛑️', pos: { y: 18, s: 70 } },
      { id: 'tophat', name: 'Цилиндр',    price: 60,  emoji: '🎩', pos: { y: 14, s: 72 } },
      { id: 'grad',   name: 'Шапка умника', price: 80, emoji: '🎓', pos: { x: 104, y: 18, s: 74 } },
      { id: 'crown',  name: 'Корона',     price: 150, emoji: '👑', pos: { y: 18, s: 68 } },
      { id: 'santa',  name: 'Колпак Деда Мороза', price: 250, art: 'santa' },
      { id: 'devil',  name: 'Рожки',      price: 300, art: 'devil' },
      { id: 'pirate', name: 'Пиратская шляпа', price: 350, art: 'pirate' },
      { id: 'halo',   name: 'Нимб',       price: 400, art: 'halo' },
      { id: 'flowers',name: 'Венок',      price: 450, art: 'flowerCrown' },
      { id: 'wizard', name: 'Шляпа волшебника', price: 550, art: 'wizard' },
      { id: 'unicorn',name: 'Рог единорога', price: 700, art: 'unicorn' },
      { id: 'diamond',name: 'Алмазный шлем', price: 900, art: 'diamondHelmet' },
      { id: 'royal',  name: 'Королевская корона', price: 1500, art: 'royalCrown' },
      { id: 'beanie', name: 'Шапка с помпоном', price: 120, art: 'beanie' },
      { id: 'chef',   name: 'Колпак повара', price: 180, art: 'chef' },
      { id: 'party',  name: 'Праздничный колпачок', price: 200, art: 'partyHat' },
      { id: 'cowboy', name: 'Ковбойская шляпа', price: 320, art: 'cowboy' },
      { id: 'pumpkinHat', name: 'Шапка-тыква', price: 200, art: 'pumpkinHat' },
      { id: 'witch',  name: 'Шляпа ведьмы', price: 380, art: 'witchHat' },
    ],
  },
  glasses: {
    title: 'Очки', icon: '🕶️',
    items: [
      { id: 'round', name: 'Очки',          price: 30, emoji: '👓', pos: { y: 84, s: 74 } },
      { id: 'sun',   name: 'Тёмные очки',   price: 50, emoji: '🕶️', pos: { y: 83, s: 76 } },
      { id: 'goggle',name: 'Очки шахтёра',  price: 70, emoji: '🥽', pos: { y: 83, s: 80 } },
      { id: 'hearts',name: 'Очки-сердечки', price: 120, art: 'heartGlasses' },
      { id: 'g3d',   name: '3D-очки',       price: 150, art: 'glasses3d' },
      { id: 'stars', name: 'Очки-звёзды',   price: 220, art: 'starGlasses' },
      { id: 'monocle',name: 'Монокль',      price: 300, art: 'monocle' },
      { id: 'pixel', name: 'Пиксельные очки', price: 450, art: 'pixelShades' },
      { id: 'visor', name: 'Кибер-визор',   price: 700, art: 'visor' },
      { id: 'catEye', name: 'Очки-кошечки', price: 180, art: 'catEyeGlasses' },
      { id: 'aviator',name: 'Очки лётчика', price: 260, art: 'aviators' },
    ],
  },
  neck: {
    title: 'Шея', icon: '🔔',
    items: [
      { id: 'bell',  name: 'Колокольчик', price: 20, emoji: '🔔', collar: '#e23d4b', pos: { y: 155, s: 28 } },
      { id: 'scarf', name: 'Шарфик',      price: 45, emoji: '🧣', scarf: '#e8434f' },
      { id: 'gem',   name: 'Кулон',       price: 90, emoji: '💎', collar: '#7c5bd9', pos: { y: 154, s: 26 } },
      { id: 'bowtie',name: 'Бабочка',     price: 80, art: 'bowtie' },
      { id: 'lei',   name: 'Гавайские бусы', price: 220, art: 'lei' },
      { id: 'pearls',name: 'Жемчуг',      price: 300, art: 'pearls' },
      { id: 'chain', name: 'Золотая цепочка', price: 500, art: 'goldChain' },
      { id: 'diamonds', name: 'Алмазное колье', price: 1000, art: 'diamonds' },
      { id: 'bandana',name: 'Бандана',     price: 120, art: 'bandana' },
      { id: 'tie',   name: 'Галстук',     price: 160, art: 'tie' },
      { id: 'spookyBow', name: 'Хэллоуинский бантик', price: 140, art: 'spookyBow' },
      { id: 'medal', name: 'Медаль чемпиона', special: 'Победи босса', emoji: '🏅', collar: '#3f7fd6', pos: { y: 158, s: 30 } },
      { id: 'star',  name: 'Звезда мира',  special: 'Пройди все миры', emoji: '🌟', collar: '#f5b800', pos: { y: 153, s: 26 } },
    ],
  },
  back: {
    title: 'Спина', icon: '🪽',
    items: [
      { id: 'cape',    name: 'Плащ супергероя', price: 250, art: 'cape' },
      { id: 'bat',     name: 'Крылья летучей мыши', price: 400, art: 'batWings' },
      { id: 'fairy',   name: 'Крылья феи',   price: 450, art: 'fairyWings' },
      { id: 'angel',   name: 'Крылья ангела', price: 550, art: 'angelWings' },
      { id: 'jetpack', name: 'Реактивный ранец', price: 750, art: 'jetpack' },
      { id: 'dragon',  name: 'Крылья дракона', price: 950, art: 'dragonWings' },
      { id: 'rainbow', name: 'Радужные крылья', price: 1500, art: 'rainbowWings' },
      { id: 'backpack',  name: 'Рюкзачок',     price: 150, art: 'backpack' },
      { id: 'butterfly', name: 'Крылья бабочки', price: 500, art: 'butterflyWings' },
      { id: 'vampire', name: 'Плащ вампира', price: 350, art: 'vampireCape' },
    ],
  },
  paw: {
    title: 'В лапке', icon: '🪄',
    items: [
      { id: 'lolly',   name: 'Леденец',      price: 40,  art: 'lollipop' },
      { id: 'icecream',name: 'Мороженое',    price: 60,  emoji: '🍦', pos: { x: 148, y: 154, s: 44, r: 12 } },
      { id: 'balloon', name: 'Воздушный шарик', price: 90, art: 'balloon' },
      { id: 'rod',     name: 'Удочка',       price: 150, art: 'rod' },
      { id: 'guitar',  name: 'Гитара',       price: 250, emoji: '🎸', pos: { x: 150, y: 160, s: 46, r: -20 } },
      { id: 'wand',    name: 'Волшебная палочка', price: 450, art: 'wand' },
      { id: 'sword',   name: 'Алмазный меч', price: 850, art: 'sword' },
      { id: 'fish',    name: 'Рыбка-вкусняшка', price: 30, art: 'fishSnack' },
      { id: 'yarn',    name: 'Клубок',       price: 45,  art: 'yarnBall' },
      { id: 'donut',   name: 'Пончик',       price: 70,  art: 'donut' },
      { id: 'watermelon', name: 'Арбуз',     price: 80,  art: 'watermelon' },
      { id: 'mouse',   name: 'Игрушечная мышка', price: 110, art: 'toyMouse' },
      { id: 'sunflower', name: 'Подсолнух',  price: 180, art: 'sunflower' },
      { id: 'candyCorn', name: 'Конфета-кукуруза', price: 50, art: 'candyCorn' },
      { id: 'candyBucket', name: 'Ведёрко сладостей', price: 160, art: 'candyBucket' },
      { id: 'trophy',  name: 'Кубок чемпиона', special: 'Победи 5 боссов', emoji: '🏆', pos: { x: 152, y: 160, s: 46 } },
    ],
  },
  aura: {
    title: 'Сияние', icon: '✨',
    items: [
      { id: 'sparkles', name: 'Искорки',      price: 300 },
      { id: 'hearts',   name: 'Сердечки',     price: 400 },
      { id: 'snow',     name: 'Снегопад',     price: 450 },
      { id: 'fire',     name: 'Огненная аура', price: 750 },
      { id: 'orbit',    name: 'Звёздная орбита', price: 1000 },
      { id: 'rainbow',  name: 'Радужное кольцо', price: 1300 },
      { id: 'gold',     name: 'Золотое сияние', price: 2000 },
      { id: 'bubbles',  name: 'Пузырьки',     price: 250 },
      { id: 'notes',    name: 'Музыка',       price: 300 },
      { id: 'petals',   name: 'Лепестки',     price: 350 },
      { id: 'leaves',   name: 'Листопад',     price: 350 },
      { id: 'butterflies', name: 'Бабочки',   price: 500 },
      { id: 'lightning',name: 'Молнии',       price: 650 },
      { id: 'coins',    name: 'Монетки',      price: 800 },
      { id: 'spooky',   name: 'Хэллоуин',     price: 600 },
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
      { id: 'sakura', name: 'Сакура',      price: 200, css: bgArt('sakura') },
      { id: 'mine',   name: 'Пиксельная деревня', price: 250, css: bgArt('mine') },
      { id: 'reef',   name: 'Коралловый риф', price: 300, css: bgArt('reef') },
      { id: 'rainbowSky', name: 'Радужное небо', price: 300, css: bgArt('rainbowSky') },
      { id: 'obby',   name: 'Небесный паркур', price: 400, css: bgArt('obby') },
      { id: 'aurora', name: 'Северное сияние', price: 500, css: bgArt('aurora') },
      { id: 'planets',name: 'Парад планет', price: 600, css: bgArt('planets') },
      { id: 'castle', name: 'Замок принцессы', price: 800, css: bgArt('castle') },
      { id: 'palace', name: 'Золотой дворец', price: 1500, css: bgArt('palace') },
      { id: 'snowyHills', name: 'Снежные холмы', price: 200, css: bgArt('snowyHills') },
      { id: 'beach',  name: 'Пляж',         price: 200, css: bgArt('beach') },
      { id: 'autumn', name: 'Осенний парк', price: 250, css: bgArt('autumn') },
      { id: 'desert', name: 'Пустыня',      price: 300, css: bgArt('desert') },
      { id: 'library',name: 'Библиотека',   price: 350, css: bgArt('library') },
      { id: 'nightCity', name: 'Ночной город', price: 450, css: bgArt('nightCity') },
      { id: 'volcanoIsle', name: 'Остров вулкана', price: 600, css: bgArt('volcanoIsle') },
      { id: 'pumpkinPatch', name: 'Тыквенное поле', price: 350, css: bgArt('pumpkinPatch') },
      { id: 'haunted', name: 'Дом с привидениями', price: 500, css: bgArt('hauntedHouse') },
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
  { id: 'div1',     icon: '🍕', name: 'Поровну!',          desc: 'Пройди первый мир деления',    test: p => DIV_WORLDS.some(w => (p.stars[w.id] || 0) > 0) },
  { id: 'divall',   icon: '🍱', name: 'Пир на весь мир',   desc: 'Пройди все миры деления',      test: p => DIV_WORLDS.every(w => (p.stars[w.id] || 0) > 0) },
  { id: 'col1',     icon: '✏️', name: 'Первый столбик',    desc: 'Пройди уровень в столбик',     test: p => Object.keys(p.colStars).length >= 1 },
  { id: 'colall',   icon: '📐', name: 'Мастер столбика',   desc: 'Пройди все уровни в столбик',  test: p => COLUMN_LEVELS.every(l => (p.colStars[l.id] || 0) > 0) },
  { id: 'farm1',    icon: '🎣', name: 'Первый улов',       desc: 'Вырасти и поймай рыбу на ферме', test: p => p.farm.harvested >= 1 },
  { id: 'farm15',   icon: '🐳', name: 'Рыбак-профи',       desc: 'Поймай 15 рыб на ферме',       test: p => p.farm.harvested >= 15 },
  { id: 'pet1',     icon: '🥚', name: 'Новый друг',        desc: 'Выведи первого питомца',       test: p => p.pets.length >= 1 },
  { id: 'petleg',   icon: '✨', name: 'Легенда',           desc: 'Найди легендарного питомца',   test: p => p.pets.some(id => PETS.find(x => x.id === id).rarity === 'legendary') },
  { id: 'breeds6',  icon: '🐈', name: 'Кошатница',         desc: 'Собери 6 пород котиков',       test: p => BREEDS.filter(b => b.test(p)).length >= 6 },
];

// ---------- Деление: «делим угощение поровну» ----------

const DIV_WORLDS = [
  { id: 'd2',   tables: [2],  name: 'Пицца пополам',     icon: '🍕', color: '#ffb38a' },
  { id: 'd3',   tables: [3],  name: 'Конфетная лавка',   icon: '🍬', color: '#f7a8d8' },
  { id: 'd4',   tables: [4],  name: 'Ягодная поляна',    icon: '🍓', color: '#ff9aa2' },
  { id: 'd5',   tables: [5],  name: 'Печенькина пекарня', icon: '🍪', color: '#e0b98a' },
  { id: 'd6',   tables: [6],  name: 'Сырная гора',       icon: '🧀', color: '#ffe17a' },
  { id: 'd7',   tables: [7],  name: 'Арбузный пляж',     icon: '🍉', color: '#9be36d' },
  { id: 'd8',   tables: [8],  name: 'Пончиковый парк',   icon: '🍩', color: '#f5b0c8' },
  { id: 'd9',   tables: [9],  name: 'Мороженое-град',    icon: '🍦', color: '#bfe3ff' },
  { id: 'd10',  tables: [10], name: 'Тортовый дворец',   icon: '🎂', color: '#d6c4ff' },
  { id: 'dmix', tables: [2, 3, 4, 5, 6, 7, 8, 9, 10], name: 'Пир на весь мир', icon: '🍱', color: '#ffd86b' },
];

// ---------- Столбик ----------

const COLUMN_PER_LEVEL = 5;
const COLUMN_LEVELS = [
  { id: 'a1', op: '+', name: 'Без перехода',   icon: '🌱', desc: '23 + 45' },
  { id: 'a2', op: '+', name: 'С переходом',    icon: '🌿', desc: '47 + 35, держим в уме' },
  { id: 'a3', op: '+', name: 'Трёхзначные',    icon: '🌳', desc: '358 + 274' },
  { id: 's1', op: '-', name: 'Без займа',      icon: '🍂', desc: '68 − 25' },
  { id: 's2', op: '-', name: 'С займом',       icon: '🍁', desc: '52 − 27, занимаем десяток' },
  { id: 's3', op: '-', name: 'Трёхзначные',    icon: '🌲', desc: '503 − 268' },
];

// ---------- Кото-ферма ----------

const FARM_SPECIES = [
  { id: 'carp',   name: 'Карасик',          icon: '🐟', price: 10,  need: 8,  reward: 20,  unlock: 0 },
  { id: 'tropic', name: 'Тропическая рыбка', icon: '🐠', price: 25,  need: 15, reward: 45,  unlock: 2 },
  { id: 'puffer', name: 'Рыба-фугу',        icon: '🐡', price: 40,  need: 25, reward: 75,  unlock: 5 },
  { id: 'squid',  name: 'Кальмарчик',       icon: '🦑', price: 60,  need: 35, reward: 110, unlock: 9 },
  { id: 'octo',   name: 'Осьминожка',       icon: '🐙', price: 80,  need: 45, reward: 150, unlock: 12 },
  { id: 'whale',  name: 'Китёнок',          icon: '🐳', price: 100, need: 60, reward: 200, unlock: 15 },
];
const POND_SLOT_PRICES = { 4: 80, 5: 150, 6: 250 }; // цена 4-го, 5-го и 6-го места в пруду
const POND_MAX = 6;

// ---------- Питомцы ----------

const RARITY = {
  common:    { name: 'Обычный',      color: '#8fd16a' },
  rare:      { name: 'Редкий',       color: '#5ab0ff' },
  legendary: { name: 'Легендарный',  color: '#ffb020' },
};

const PETS = [
  { id: 'hamster', name: 'Хомячок',      icon: '🐹', rarity: 'common',    bonus: '+1 🦐 корма за каждые 5 верных ответов' },
  { id: 'bunny',   name: 'Зайка',        icon: '🐰', rarity: 'common',    bonus: '+1 🐟 за каждые 5 ответов подряд' },
  { id: 'turtle',  name: 'Черепашка',    icon: '🐢', rarity: 'common',    bonus: 'Босс атакует на 30% медленнее' },
  { id: 'chick',   name: 'Цыплёнок',     icon: '🐥', rarity: 'common',    bonus: 'Двойной опыт за ответы' },
  { id: 'parrot',  name: 'Попугай Кеша', icon: '🦜', rarity: 'rare',      bonus: 'В приключении убирает 1 неверный вариант' },
  { id: 'puppy',   name: 'Щенок',        icon: '🐶', rarity: 'rare',      bonus: '+1 жизнь в битве с боссом' },
  { id: 'owl',     name: 'Сова',         icon: '🦉', rarity: 'rare',      bonus: '+10 секунд в Блице' },
  { id: 'axolotl', name: 'Аксолотль',    icon: '🦎', rarity: 'rare',      bonus: 'Рыбы на ферме растут в 2 раза быстрее' },
  { id: 'unicorn', name: 'Единорог',     icon: '🦄', rarity: 'legendary', bonus: '×2 рыбки за звёзды в приключении и столбике' },
  { id: 'dragon',  name: 'Дракончик',    icon: '🐲', rarity: 'legendary', bonus: '+1 урон боссу за каждый удар' },
  { id: 'fox',     name: 'Лисёнок',      icon: '🦊', rarity: 'legendary', bonus: 'Сундук дня в 2 раза больше' },
];

const EGGS = [
  { id: 'basic', name: 'Обычное яйцо', price: 60,  odds: { common: 70, rare: 25, legendary: 5 } },
  { id: 'gold',  name: 'Золотое яйцо', price: 150, odds: { common: 25, rare: 55, legendary: 20 } },
];

// ---------- Породы котиков ----------
// ears: normal | big | small | tuft | fold; pattern: none | stripes | spots | points | calico | wrinkles | stars
const BREEDS = [
  { id: 'home',    name: 'Домашний',     fur: 'ginger',   ears: 'normal', pattern: 'none',     cond: 'Твой первый котик',            test: () => true },
  { id: 'tabby',   name: 'Полосатик',    fur: 'gray',     ears: 'normal', pattern: 'stripes',  cond: 'Пройди мир ×2',                test: p => (p.stars.w2 || 0) > 0 },
  { id: 'british', name: 'Британец',     fur: 'gray',     ears: 'small',  pattern: 'none', round: true, eye: '#f0a020', cond: 'Пройди мир ×3', test: p => (p.stars.w3 || 0) > 0 },
  { id: 'siamese', name: 'Сиамский',     fur: 'cream',    ears: 'big',    pattern: 'points', eye: '#4aa3ff', cond: 'Пройди мир ×5',      test: p => (p.stars.w5 || 0) > 0 },
  { id: 'maine',   name: 'Мейн-кун',     fur: 'ginger',   ears: 'tuft',   pattern: 'stripes', fluffy: true, eye: '#8cc63f', cond: 'Пройди мир ×7', test: p => (p.stars.w7 || 0) > 0 },
  { id: 'fold',    name: 'Вислоухий',    fur: 'white',    ears: 'fold',   pattern: 'none', round: true, eye: '#f0a020', cond: 'Выполни задание дня 3 дня подряд', test: p => p.streak.best >= 3 },
  { id: 'bengal',  name: 'Бенгальский',  fur: 'ginger',   ears: 'normal', pattern: 'spots', eye: '#8cc63f', cond: 'Набери 25 очков в Блице',    test: p => p.blitzBest >= 25 },
  { id: 'sphynx',  name: 'Сфинкс',       fur: 'peach',    ears: 'big',    pattern: 'wrinkles', eye: '#8cc63f', cond: 'Победи босса',          test: p => p.bossWins >= 1 },
  { id: 'calico',  name: 'Трёхцветный',  fur: 'white',    ears: 'normal', pattern: 'calico',   cond: 'Пройди 3 уровня в столбик',    test: p => Object.keys(p.colStars).length >= 3 },
  { id: 'persian', name: 'Персидский',   fur: 'white',    ears: 'small',  pattern: 'none', fluffy: true, round: true, eye: '#f0a020', cond: 'Поймай 5 рыб на ферме', test: p => p.farm.harvested >= 5 },
  { id: 'ragdoll', name: 'Рэгдолл',      fur: 'cream',    ears: 'normal', pattern: 'points', fluffy: true, eye: '#4aa3ff', cond: 'Пройди 3 мира деления', test: p => DIV_WORLDS.filter(w => (p.stars[w.id] || 0) > 0).length >= 3 },
  { id: 'cosmo',   name: 'Космокот',     fur: 'lavender', ears: 'tuft',   pattern: 'stars', eye: '#ffd84a', cond: 'Собери 3 звезды во всех мирах умножения', test: p => WORLDS.every(w => (p.stars[w.id] || 0) === 3) },
];
