// Игровые данные: миры, магазин, награды, подсказки.
'use strict';

const DAILY_GOAL = 20;      // сколько верных ответов нужно для сундука дня
const LEVEL_TARGET = 10;    // сколько верных ответов нужно, чтобы пройти уровень
const PIN_LENGTH = 3;

const PIN_SYMBOLS = ['🐱', '🐟', '🧶', '🐭', '⭐', '🍓', '🌈', '💎', '🎀'];

const WORLDS = [
  { id: 'w2',  tables: [2],  name: t('Котёнкин дворик'), icon: '🏡', color: '#9be36d' },
  { id: 'w3',  tables: [3],  name: t('Рыбный рынок'),    icon: '🐟', color: '#6dd3e3' },
  { id: 'w4',  tables: [4],  name: t('Клубочный лес'),   icon: '🧶', color: '#f59bd0' },
  { id: 'w5',  tables: [5],  name: t('Мышиная шахта'),   icon: '⛏️', color: '#c9a27a' },
  { id: 'w6',  tables: [6],  name: t('Молочная река'),   icon: '🥛', color: '#a8d8ff' },
  { id: 'w7',  tables: [7],  name: t('Пиратская бухта'), icon: '🏴‍☠️', color: '#ffb86b' },
  { id: 'w8',  tables: [8],  name: t('Снежные горы'),    icon: '❄️', color: '#cfe8ff' },
  { id: 'w9',  tables: [9],  name: t('Вулкан Мурр'),     icon: '🌋', color: '#ff8a7a' },
  { id: 'w10', tables: [10], name: t('Облачный замок'),  icon: '🏰', color: '#d6c4ff' },
  { id: 'mix', tables: [2, 3, 4, 5, 6, 7, 8, 9, 10], name: t('Радужный микс'), icon: '🌈', color: '#ffd86b' },
];

const BOSSES = [
  { name: t('Крысиный Король'), icon: '🐀', crown: '👑' },
  { name: t('Пёс Барбос'),      icon: '🐶', crown: '🎩' },
  { name: t('Робо-Мышь'),       icon: '🤖', crown: '⚡' },
  { name: t('Призрак Бу'),      icon: '👻', crown: '🕯️' },
  { name: t('Дракон Пыхтун'),   icon: '🐉', crown: '🔥' },
];

// Магазин. price: 0 — есть сразу; special — не продаётся, только в награду.
// Наряды рисуются внутри SVG котика. pos — координаты центра в системе котика (200×200):
// x (по умолчанию 100), y, s — размер, r — наклон. Для шеи collar — цвет ошейника, scarf — цвет шарфа.
// art — имя рисунка из art.js. Редкость вещи определяется ценой (см. itemTier).
const SHOP = {
  fur: {
    title: t('Шёрстка'), icon: '🎨',
    items: [
      { id: 'ginger',  name: t('Рыжий'),      price: 0,   color: '#f6a54a', stroke: '#c9752a' },
      { id: 'gray',    name: t('Серый'),      price: 0,   color: '#a7b0bc', stroke: '#6f7884' },
      { id: 'white',   name: t('Белый'),      price: 0,   color: '#fbf7f0', stroke: '#c9bfb0' },
      { id: 'black',   name: t('Чёрный'),     price: 0,   color: '#3d3a4a', stroke: '#1f1d28', eye: '#a6e35a' },
      { id: 'cream',   name: t('Кремовый'),   price: 0,   color: '#f6e3c6', stroke: '#c9a97a' },
      { id: 'peach',   name: t('Персиковый'), price: 0,   color: '#f6c9b8', stroke: '#d99a86' },
      { id: 'pink',    name: t('Розовый'),    price: 60,  color: '#ffb3d1', stroke: '#e07aa6' },
      { id: 'blue',    name: t('Голубой'),    price: 60,  color: '#9fd3ff', stroke: '#5a9fd6' },
      { id: 'mint',    name: t('Мятный'),     price: 80,  color: '#a6f0c6', stroke: '#5bbf8a' },
      { id: 'lavender',name: t('Лавандовый'), price: 80,  color: '#c9b3ff', stroke: '#8f74d6' },
      { id: 'gold',    name: t('Золотой'),    price: 200, color: '#ffd84a', stroke: '#d6a400' },
      { id: 'rainbow', name: t('Радужный'),   price: 300, grad: ['#ff9a9e', '#ffd36e', '#a6f0c6', '#9fd3ff', '#c9b3ff'], stroke: '#9a6ad6' },
      { id: 'candyfur',name: t('Конфетный'),  price: 350, grad: ['#ffb3d1', '#fff0f8', '#a6f0c6'], stroke: '#e07aa6' },
      { id: 'ice',     name: t('Ледяной'),    price: 450, grad: ['#f2fbff', '#9fd3ff', '#c9b3ff'], stroke: '#5a9fd6', eye: '#2f7fd0' },
      { id: 'firefur', name: t('Огненный'),   price: 600, grad: ['#ffe14a', '#ff8a3d', '#e23d4b'], stroke: '#a51f2c' },
      { id: 'galaxy',  name: t('Галактика'),  price: 900, grad: ['#2a1d5c', '#7c5bd9', '#3fa9f5'], stroke: '#1a1240', eye: '#ffd84a', sparkle: true },
      { id: 'lemon',   name: t('Лимонный'),   price: 60,  color: '#fff17a', stroke: '#d6c400' },
      { id: 'coral',   name: t('Коралловый'), price: 80,  color: '#ff9a8b', stroke: '#d6665a' },
      { id: 'choco',   name: t('Шоколадный'), price: 100, color: '#8b5a3c', stroke: '#5a3520', eye: '#ffd84a' },
      { id: 'silver',  name: t('Серебряный'), price: 150, color: '#dde3ea', stroke: '#8a96a6', eye: '#4aa3ff' },
      { id: 'teal',    name: t('Бирюзовый'),  price: 150, color: '#5fd6c9', stroke: '#2a9a8f' },
      { id: 'sunsetfur', name: t('Закатный'), price: 400, grad: ['#ffd36e', '#ff9a8b', '#c9b3ff'], stroke: '#d6665a' },
      { id: 'seafur',  name: t('Морской'),    price: 500, grad: ['#a6f0c6', '#5fd6c9', '#3f7fd6'], stroke: '#2a6fb8' },
      { id: 'neon',    name: t('Неоновый'),   price: 750, grad: ['#39ff8a', '#3fd6ff', '#ff3fd6'], stroke: '#7a1fa8', eye: '#ff3fd6', sparkle: true },
      { id: 'pumpkin', name: t('Тыквенный'),  price: 120, color: '#ff9a3c', stroke: '#c45a00', eye: '#8fd14a' },
      { id: 'ghost',   name: t('Привидение'), price: 250, color: '#eef3ff', stroke: '#9aa8c9', eye: '#5ab0ff' },
      { id: 'witchfur',name: t('Ведьмин'),    price: 500, grad: ['#1d1430', '#5b33b8', '#8fd14a'], stroke: '#0d0820', eye: '#8fd14a' },
    ],
  },
  hat: {
    title: t('Шапки'), icon: '🎩',
    items: [
      { id: 'bow',    name: t('Бантик'),     price: 25,  emoji: '🎀', pos: { y: 24, s: 54 } },
      { id: 'cap',    name: t('Кепка'),      price: 35,  emoji: '🧢', pos: { y: 20, s: 70 } },
      { id: 'flower', name: t('Цветочек'),   price: 35,  emoji: '🌸', pos: { x: 134, y: 38, s: 42, r: 15 } },
      { id: 'helmet', name: t('Каска'),      price: 50,  emoji: '⛑️', pos: { y: 18, s: 70 } },
      { id: 'tophat', name: t('Цилиндр'),    price: 60,  emoji: '🎩', pos: { y: 14, s: 72 } },
      { id: 'grad',   name: t('Шапка умника'), price: 80, emoji: '🎓', pos: { x: 104, y: 18, s: 74 } },
      { id: 'crown',  name: t('Корона'),     price: 150, emoji: '👑', pos: { y: 18, s: 68 } },
      { id: 'santa',  name: t('Колпак Деда Мороза'), price: 250, art: 'santa' },
      { id: 'devil',  name: t('Рожки'),      price: 300, art: 'devil' },
      { id: 'pirate', name: t('Пиратская шляпа'), price: 350, art: 'pirate' },
      { id: 'halo',   name: t('Нимб'),       price: 400, art: 'halo' },
      { id: 'flowers',name: t('Венок'),      price: 450, art: 'flowerCrown' },
      { id: 'wizard', name: t('Шляпа волшебника'), price: 550, art: 'wizard' },
      { id: 'unicorn',name: t('Рог единорога'), price: 700, art: 'unicorn' },
      { id: 'diamond',name: t('Алмазный шлем'), price: 900, art: 'diamondHelmet' },
      { id: 'royal',  name: t('Королевская корона'), price: 1500, art: 'royalCrown' },
      { id: 'beanie', name: t('Шапка с помпоном'), price: 120, art: 'beanie' },
      { id: 'chef',   name: t('Колпак повара'), price: 180, art: 'chef' },
      { id: 'party',  name: t('Праздничный колпачок'), price: 200, art: 'partyHat' },
      { id: 'cowboy', name: t('Ковбойская шляпа'), price: 320, art: 'cowboy' },
      { id: 'pumpkinHat', name: t('Шапка-тыква'), price: 200, art: 'pumpkinHat' },
      { id: 'witch',  name: t('Шляпа ведьмы'), price: 380, art: 'witchHat' },
      { id: 'beret',         name: t('Берет'),              price: 140, img: 'img/updates/items/beret.png',          pos: { x: 26, y: -43, w: 147, h: 147 } },
      { id: 'strawberryHat', name: t('Шапка-клубника'),     price: 240, img: 'img/updates/items/strawberry_hat.png', pos: { x: 37, y: -32, w: 126, h: 126 } },
      { id: 'mushroomHat',   name: t('Шапка-мухомор'),      price: 260, img: 'img/updates/items/mushroom_hat.png',   pos: { x: 34, y: -35, w: 133, h: 133 } },
      { id: 'frogHood',      name: t('Капюшон-лягушка'),    price: 340, img: 'img/updates/items/frog_hood.png',      pos: { x: 42, y: -26, w: 115, h: 115 } },
      { id: 'sunHat',        name: t('Шляпа от солнца'),    price: 200, img: 'img/updates/items/sun_hat.png',        pos: { x: 38, y: -28, w: 123, h: 123 } },
      { id: 'foxHood',       name: t('Капюшон-лис'),        price: 400, img: 'img/updates/items/fox_hood.png',       pos: { x: 40, y: -29, w: 120, h: 120 } },
    ],
  },
  glasses: {
    title: t('Очки'), icon: '🕶️',
    items: [
      { id: 'round', name: t('Очки'),          price: 30, emoji: '👓', pos: { y: 84, s: 74 } },
      { id: 'sun',   name: t('Тёмные очки'),   price: 50, emoji: '🕶️', pos: { y: 83, s: 76 } },
      { id: 'goggle',name: t('Очки шахтёра'),  price: 70, emoji: '🥽', pos: { y: 83, s: 80 } },
      { id: 'hearts',name: t('Очки-сердечки'), price: 120, art: 'heartGlasses' },
      { id: 'g3d',   name: t('3D-очки'),       price: 150, art: 'glasses3d' },
      { id: 'stars', name: t('Очки-звёзды'),   price: 220, art: 'starGlasses' },
      { id: 'monocle',name: t('Монокль'),      price: 300, art: 'monocle' },
      { id: 'pixel', name: t('Пиксельные очки'), price: 450, art: 'pixelShades' },
      { id: 'visor', name: t('Кибер-визор'),   price: 700, art: 'visor' },
      { id: 'catEye', name: t('Очки-кошечки'), price: 180, art: 'catEyeGlasses' },
      { id: 'aviator',name: t('Очки лётчика'), price: 260, art: 'aviators' },
    ],
  },
  neck: {
    title: t('Шея'), icon: '🔔',
    items: [
      { id: 'bell',  name: t('Колокольчик'), price: 20, emoji: '🔔', collar: '#e23d4b', pos: { y: 155, s: 28 } },
      { id: 'scarf', name: t('Шарфик'),      price: 45, emoji: '🧣', scarf: '#e8434f' },
      { id: 'gem',   name: t('Кулон'),       price: 90, emoji: '💎', collar: '#7c5bd9', pos: { y: 154, s: 26 } },
      { id: 'bowtie',name: t('Бабочка'),     price: 80, art: 'bowtie' },
      { id: 'lei',   name: t('Гавайские бусы'), price: 220, art: 'lei' },
      { id: 'pearls',name: t('Жемчуг'),      price: 300, art: 'pearls' },
      { id: 'chain', name: t('Золотая цепочка'), price: 500, art: 'goldChain' },
      { id: 'diamonds', name: t('Алмазное колье'), price: 1000, art: 'diamonds' },
      { id: 'bandana',name: t('Бандана'),     price: 120, art: 'bandana' },
      { id: 'tie',   name: t('Галстук'),     price: 160, art: 'tie' },
      { id: 'spookyBow', name: t('Хэллоуинский бантик'), price: 140, art: 'spookyBow' },
      { id: 'medal', name: t('Медаль чемпиона'), special: t('Победи босса'), emoji: '🏅', collar: '#3f7fd6', pos: { y: 158, s: 30 } },
      { id: 'star',  name: t('Звезда мира'),  special: t('Пройди все миры'), emoji: '🌟', collar: '#f5b800', pos: { y: 153, s: 26 } },
    ],
  },
  back: {
    title: t('Спина'), icon: '🪽',
    items: [
      { id: 'cape',    name: t('Плащ супергероя'), price: 250, art: 'cape' },
      { id: 'bat',     name: t('Крылья летучей мыши'), price: 400, art: 'batWings' },
      { id: 'fairy',   name: t('Крылья феи'),   price: 450, art: 'fairyWings' },
      { id: 'angel',   name: t('Крылья ангела'), price: 550, art: 'angelWings' },
      { id: 'jetpack', name: t('Реактивный ранец'), price: 750, art: 'jetpack' },
      { id: 'dragon',  name: t('Крылья дракона'), price: 950, art: 'dragonWings' },
      { id: 'rainbow', name: t('Радужные крылья'), price: 1500, art: 'rainbowWings' },
      { id: 'backpack',  name: t('Рюкзачок'),     price: 150, art: 'backpack' },
      { id: 'butterfly', name: t('Крылья бабочки'), price: 500, art: 'butterflyWings' },
      { id: 'vampire', name: t('Плащ вампира'), price: 350, art: 'vampireCape' },
    ],
  },
  paw: {
    title: t('В лапке'), icon: '🪄',
    items: [
      { id: 'lolly',   name: t('Леденец'),      price: 40,  art: 'lollipop' },
      { id: 'icecream',name: t('Мороженое'),    price: 60,  emoji: '🍦', pos: { x: 148, y: 154, s: 44, r: 12 } },
      { id: 'balloon', name: t('Воздушный шарик'), price: 90, art: 'balloon' },
      { id: 'rod',     name: t('Удочка'),       price: 150, art: 'rod' },
      { id: 'guitar',  name: t('Гитара'),       price: 250, emoji: '🎸', pos: { x: 150, y: 160, s: 46, r: -20 } },
      { id: 'wand',    name: t('Волшебная палочка'), price: 450, art: 'wand' },
      { id: 'sword',   name: t('Алмазный меч'), price: 850, art: 'sword' },
      { id: 'fish',    name: t('Рыбка-вкусняшка'), price: 30, art: 'fishSnack' },
      { id: 'yarn',    name: t('Клубок'),       price: 45,  art: 'yarnBall' },
      { id: 'donut',   name: t('Пончик'),       price: 70,  art: 'donut' },
      { id: 'watermelon', name: t('Арбуз'),     price: 80,  art: 'watermelon' },
      { id: 'mouse',   name: t('Игрушечная мышка'), price: 110, art: 'toyMouse' },
      { id: 'sunflower', name: t('Подсолнух'),  price: 180, art: 'sunflower' },
      { id: 'candyCorn', name: t('Конфета-кукуруза'), price: 50, art: 'candyCorn' },
      { id: 'candyBucket', name: t('Ведёрко сладостей'), price: 160, art: 'candyBucket' },
      { id: 'trophy',  name: t('Кубок чемпиона'), special: t('Победи 5 боссов'), emoji: '🏆', pos: { x: 152, y: 160, s: 46 } },
      { id: 'pawBell',      name: t('Колокольчик-лапка'), price: 50,  img: 'img/updates/items/paw_bell.png',      pos: { x: 119, y: 118, w: 82, h: 82 } },
      { id: 'cupcake',      name: t('Кексочка'),          price: 80,  img: 'img/updates/items/cupcake.png',       pos: { x: 121, y: 120, w: 79, h: 79 } },
      { id: 'honeyDipper',  name: t('Ложка для мёда'),    price: 110, img: 'img/updates/items/honey_dipper.png',  pos: { x: 122, y: 121, w: 76, h: 76 } },
      { id: 'paintbrush',   name: t('Кисточка'),          price: 140, img: 'img/updates/items/paintbrush.png',    pos: { x: 120, y: 118, w: 81, h: 81 } },
      { id: 'daisyBouquet', name: t('Букет ромашек'),     price: 200, img: 'img/updates/items/daisy_bouquet.png', pos: { x: 122, y: 121, w: 77, h: 77 } },
      { id: 'starWand',     name: t('Звёздная палочка'),  price: 280, img: 'img/updates/items/star_wand.png',     pos: { x: 121, y: 120, w: 79, h: 79 } },
    ],
  },
  aura: {
    title: t('Сияние'), icon: '✨',
    items: [
      { id: 'sparkles', name: t('Искорки'),      price: 300 },
      { id: 'hearts',   name: t('Сердечки'),     price: 400 },
      { id: 'snow',     name: t('Снегопад'),     price: 450 },
      { id: 'fire',     name: t('Огненная аура'), price: 750 },
      { id: 'orbit',    name: t('Звёздная орбита'), price: 1000 },
      { id: 'rainbow',  name: t('Радужное кольцо'), price: 1300 },
      { id: 'gold',     name: t('Золотое сияние'), price: 2000 },
      { id: 'bubbles',  name: t('Пузырьки'),     price: 250 },
      { id: 'notes',    name: t('Музыка'),       price: 300 },
      { id: 'petals',   name: t('Лепестки'),     price: 350 },
      { id: 'leaves',   name: t('Листопад'),     price: 350 },
      { id: 'butterflies', name: t('Бабочки'),   price: 500 },
      { id: 'lightning',name: t('Молнии'),       price: 650 },
      { id: 'coins',    name: t('Монетки'),      price: 800 },
      { id: 'spooky',   name: t('Хэллоуин'),     price: 600 },
    ],
  },
  bg: {
    title: t('Фон'), icon: '🖼️',
    items: [
      { id: 'meadow', name: t('Лужайка'), price: 0,   css: 'linear-gradient(#bfe9ff 0 62%, #6cc644 62% 72%, #8b5a2b 72%)' },
      { id: 'room',   name: t('Комната'), price: 0,   css: 'linear-gradient(#ffe8d6 0 70%, #d9a37a 70%)' },
      { id: 'sunset', name: t('Закат'),   price: 50,  css: 'linear-gradient(#ff9a8b, #ffd36e 68%, #f7b267 68%)' },
      { id: 'candy',  name: t('Конфетная страна'), price: 70, css: 'repeating-linear-gradient(45deg, #ffd1ec 0 18px, #fff0f8 18px 36px)' },
      { id: 'ocean',  name: t('Океан'),   price: 70,  css: 'radial-gradient(circle at 30% 20%, #b3ecff, #3fa9f5 60%, #1d6fb8)' },
      { id: 'space',  name: t('Космос'),  price: 100, css: 'radial-gradient(circle, #fff 0 1.5px, transparent 2px) 0 0 / 34px 34px, radial-gradient(circle, #ffe9a8 0 1px, transparent 1.5px) 17px 11px / 47px 47px, linear-gradient(#1b1446, #3b2a7a)' },
      { id: 'nether', name: t('Лавовый мир'), price: 120, css: 'linear-gradient(#5a1a1a 0 64%, #ff6a00 64% 72%, #7a2a1a 72%)' },
      { id: 'sakura', name: t('Сакура'),      price: 200, css: bgArt('sakura') },
      { id: 'mine',   name: t('Пиксельная деревня'), price: 250, css: bgArt('mine') },
      { id: 'reef',   name: t('Коралловый риф'), price: 300, css: bgArt('reef') },
      { id: 'rainbowSky', name: t('Радужное небо'), price: 300, css: bgArt('rainbowSky') },
      { id: 'obby',   name: t('Небесный паркур'), price: 400, css: bgArt('obby') },
      { id: 'aurora', name: t('Северное сияние'), price: 500, css: bgArt('aurora') },
      { id: 'planets',name: t('Парад планет'), price: 600, css: bgArt('planets') },
      { id: 'castle', name: t('Замок принцессы'), price: 800, css: bgArt('castle') },
      { id: 'palace', name: t('Золотой дворец'), price: 1500, css: bgArt('palace') },
      { id: 'snowyHills', name: t('Снежные холмы'), price: 200, css: bgArt('snowyHills') },
      { id: 'beach',  name: t('Пляж'),         price: 200, css: bgArt('beach') },
      { id: 'autumn', name: t('Осенний парк'), price: 250, css: bgArt('autumn') },
      { id: 'desert', name: t('Пустыня'),      price: 300, css: bgArt('desert') },
      { id: 'library',name: t('Библиотека'),   price: 350, css: bgArt('library') },
      { id: 'nightCity', name: t('Ночной город'), price: 450, css: bgArt('nightCity') },
      { id: 'volcanoIsle', name: t('Остров вулкана'), price: 600, css: bgArt('volcanoIsle') },
      { id: 'pumpkinPatch', name: t('Тыквенное поле'), price: 350, css: bgArt('pumpkinPatch') },
      { id: 'haunted', name: t('Дом с привидениями'), price: 500, css: bgArt('hauntedHouse') },
    ],
  },
};

const LEVEL_TITLES = [
  t('Котёнок'), t('Мурлыка'), t('Охотник за мышками'), t('Ловкий кот'), t('Кот-учёный'),
  t('Кот-волшебник'), t('Кот-ниндзя'), t('Король котов'), t('Кото-легенда'),
];

// Хитрости для таблицы: подбираем по самому «удобному» множителю.
const TIP_PRIORITY = [10, 2, 5, 9, 4, 3, 6, 8, 7];
const TIPS = {
  2:  t('Умножить на 2 — значит удвоить: сложи число с самим собой.'),
  3:  t('На 3: удвой число и прибавь его ещё один раз.'),
  4:  t('На 4: удвой число, а потом удвой ещё раз!'),
  5:  t('На 5: ответ всегда кончается на 0 или 5. Это половина от умножения на 10.'),
  6:  t('На 6: умножь на 5 и прибавь число ещё раз. 6 × 7 = 35 + 7 = 42.'),
  7:  t('На 7: умножь на 5, потом на 2 и сложи. 7 × 6 = 30 + 12 = 42.'),
  8:  t('На 8: удвой три раза подряд! 8 × 3: 3 → 6 → 12 → 24.'),
  9:  t('На 9: умножь на 10 и отними число. 9 × 7 = 70 − 7 = 63. Сумма цифр ответа всегда 9!'),
  10: t('На 10: просто припиши 0 в конце!'),
};

const PRAISE = [t('Мур-р! Верно!'), t('Мяу-класс!'), t('Ты супер!'), t('Умница!'), t('Так держать!'), t('Пушистый гений!'), t('Отлично!'), t('Мур-мяу!')];
const COMFORT = [t('Ничего, разберёмся!'), t('Мяу… почти!'), t('Ошибаться не страшно!'), t('Давай запомним!')];

// test(p) получает профиль игрока.
const ACHIEVEMENTS = [
  { id: 'first',    icon: '🐾', name: t('Первый шаг'),        desc: t('Дай первый верный ответ'),      test: p => p.totalCorrect >= 1 },
  { id: 'combo10',  icon: '🔥', name: t('Огненный хвост'),    desc: t('10 верных ответов подряд'),     test: p => p.bestCombo >= 10 },
  { id: 'combo25',  icon: '☄️', name: t('Неудержимый'),       desc: t('25 верных ответов подряд'),     test: p => p.bestCombo >= 25 },
  { id: 'c100',     icon: '💯', name: t('Сотня'),             desc: t('100 верных ответов'),           test: p => p.totalCorrect >= 100 },
  { id: 'c500',     icon: '🐟', name: t('Рыбный улов'),       desc: t('500 верных ответов'),           test: p => p.totalCorrect >= 500 },
  { id: 'c1000',    icon: '🐳', name: t('Кит математики'),    desc: t('1000 верных ответов'),          test: p => p.totalCorrect >= 1000 },
  { id: 'perfect',  icon: '⭐', name: t('Идеально!'),         desc: t('Пройди уровень без ошибок'),     test: p => p.perfectCount >= 1 },
  { id: 'travel',   icon: '🗺️', name: t('Путешественник'),    desc: t('Пройди все миры'),              test: p => WORLDS.every(w => (p.stars[w.id] || 0) > 0) },
  { id: 'allstars', icon: '🌟', name: t('Звёздный кот'),      desc: t('Собери все звёзды на карте'),   test: p => WORLDS.every(w => (p.stars[w.id] || 0) === 3) },
  { id: 'boss1',    icon: '⚔️', name: t('Храбрый котик'),     desc: t('Победи первого босса'),         test: p => p.bossWins >= 1 },
  { id: 'boss5',    icon: '🛡️', name: t('Гроза злодеев'),     desc: t('Победи 5 боссов'),              test: p => p.bossWins >= 5 },
  { id: 'blitz20',  icon: '⚡', name: t('Молния'),            desc: t('Набери 20 очков в Блице'),      test: p => p.blitzBest >= 20 },
  { id: 'blitz35',  icon: '🌩️', name: t('Гроза'),             desc: t('Набери 35 очков в Блице'),      test: p => p.blitzBest >= 35 },
  { id: 'shop1',    icon: '🛍️', name: t('Модный котик'),      desc: t('Купи первую вещь'),             test: p => p.purchases >= 1 },
  { id: 'streak3',  icon: '📅', name: t('Три дня подряд'),    desc: t('Выполни задание дня 3 дня подряд'), test: p => p.streak.best >= 3 },
  { id: 'streak7',  icon: '🏆', name: t('Целая неделя'),      desc: t('Выполни задание дня 7 дней подряд'), test: p => p.streak.best >= 7 },
  { id: 'master',   icon: '🧠', name: t('Мастер таблицы'),    desc: t('Выучи одну таблицу полностью'), test: p => masteredTables(p).length >= 1 },
  { id: 'master9',  icon: '🎓', name: t('Профессор Мяу'),     desc: t('Выучи все таблицы от 2 до 10'), test: p => masteredTables(p).length >= 9 },
  { id: 'div1',     icon: '🍕', name: t('Поровну!'),          desc: t('Пройди первый мир деления'),    test: p => DIV_WORLDS.some(w => (p.stars[w.id] || 0) > 0) },
  { id: 'divall',   icon: '🍱', name: t('Пир на весь мир'),   desc: t('Пройди все миры деления'),      test: p => DIV_WORLDS.every(w => (p.stars[w.id] || 0) > 0) },
  { id: 'col1',     icon: '✏️', name: t('Первый столбик'),    desc: t('Пройди уровень в столбик'),     test: p => Object.keys(p.colStars).length >= 1 },
  { id: 'colall',   icon: '📐', name: t('Мастер столбика'),   desc: t('Пройди все уровни в столбик'),  test: p => COLUMN_LEVELS.every(l => (p.colStars[l.id] || 0) > 0) },
  { id: 'farm1',    icon: '🎣', name: t('Первый улов'),       desc: t('Вырасти и поймай рыбу на ферме'), test: p => p.farm.harvested >= 1 },
  { id: 'farm15',   icon: '🐳', name: t('Рыбак-профи'),       desc: t('Поймай 15 рыб на ферме'),       test: p => p.farm.harvested >= 15 },
  { id: 'pet1',     icon: '🥚', name: t('Новый друг'),        desc: t('Выведи первого питомца'),       test: p => p.pets.length >= 1 },
  { id: 'petleg',   icon: '✨', name: t('Легенда'),           desc: t('Найди легендарного питомца'),   test: p => p.pets.some(id => PETS.find(x => x.id === id).rarity === 'legendary') },
  { id: 'breeds6',  icon: '🐈', name: t('Кошатница'),         desc: t('Собери 6 пород котиков'),       test: p => BREEDS.filter(b => b.test(p)).length >= 6 },
];

// ---------- Деление: «делим угощение поровну» ----------

const DIV_WORLDS = [
  { id: 'd2',   tables: [2],  name: t('Пицца пополам'),     icon: '🍕', color: '#ffb38a' },
  { id: 'd3',   tables: [3],  name: t('Конфетная лавка'),   icon: '🍬', color: '#f7a8d8' },
  { id: 'd4',   tables: [4],  name: t('Ягодная поляна'),    icon: '🍓', color: '#ff9aa2' },
  { id: 'd5',   tables: [5],  name: t('Печенькина пекарня'), icon: '🍪', color: '#e0b98a' },
  { id: 'd6',   tables: [6],  name: t('Сырная гора'),       icon: '🧀', color: '#ffe17a' },
  { id: 'd7',   tables: [7],  name: t('Арбузный пляж'),     icon: '🍉', color: '#9be36d' },
  { id: 'd8',   tables: [8],  name: t('Пончиковый парк'),   icon: '🍩', color: '#f5b0c8' },
  { id: 'd9',   tables: [9],  name: t('Мороженое-град'),    icon: '🍦', color: '#bfe3ff' },
  { id: 'd10',  tables: [10], name: t('Тортовый дворец'),   icon: '🎂', color: '#d6c4ff' },
  { id: 'dmix', tables: [2, 3, 4, 5, 6, 7, 8, 9, 10], name: t('Пир на весь мир'), icon: '🍱', color: '#ffd86b' },
];

// ---------- Столбик ----------

const COLUMN_PER_LEVEL = 5;
const COLUMN_LEVELS = [
  { id: 'a1', op: '+', name: t('Без перехода'),   icon: '🌱', desc: '23 + 45' },
  { id: 'a2', op: '+', name: t('С переходом'),    icon: '🌿', desc: t('47 + 35, держим в уме') },
  { id: 'a3', op: '+', name: t('Трёхзначные'),    icon: '🌳', desc: '358 + 274' },
  { id: 's1', op: '-', name: t('Без займа'),      icon: '🍂', desc: '68 − 25' },
  { id: 's2', op: '-', name: t('С займом'),       icon: '🍁', desc: t('52 − 27, занимаем десяток') },
  { id: 's3', op: '-', name: t('Трёхзначные'),    icon: '🌲', desc: '503 − 268' },
];

// ---------- Кото-ферма ----------

const FARM_SPECIES = [
  { id: 'carp',   name: t('Карасик'),          icon: '🐟', price: 10,  need: 8,  reward: 20,  unlock: 0 },
  { id: 'tropic', name: t('Тропическая рыбка'), icon: '🐠', price: 25,  need: 15, reward: 45,  unlock: 2 },
  { id: 'puffer', name: t('Рыба-фугу'),        icon: '🐡', price: 40,  need: 25, reward: 75,  unlock: 5 },
  { id: 'squid',  name: t('Кальмарчик'),       icon: '🦑', price: 60,  need: 35, reward: 110, unlock: 9 },
  { id: 'octo',   name: t('Осьминожка'),       icon: '🐙', price: 80,  need: 45, reward: 150, unlock: 12 },
  { id: 'whale',  name: t('Китёнок'),          icon: '🐳', price: 100, need: 60, reward: 200, unlock: 15 },
];
const POND_SLOT_PRICES = { 4: 80, 5: 150, 6: 250 }; // цена 4-го, 5-го и 6-го места в пруду
const POND_MAX = 6;

// ---------- Питомцы ----------

const RARITY = {
  common:    { name: t('Обычный'),      color: '#8fd16a' },
  rare:      { name: t('Редкий'),       color: '#5ab0ff' },
  legendary: { name: t('Легендарный'),  color: '#ffb020' },
};

const PETS = [
  { id: 'hamster', name: t('Хомячок'),      icon: '🐹', rarity: 'common',    bonus: t('+1 🦐 корма за каждые 5 верных ответов') },
  { id: 'bunny',   name: t('Зайка'),        icon: '🐰', rarity: 'common',    bonus: t('+1 🐟 за каждые 5 ответов подряд') },
  { id: 'turtle',  name: t('Черепашка'),    icon: '🐢', rarity: 'common',    bonus: t('Босс атакует на 30% медленнее') },
  { id: 'chick',   name: t('Цыплёнок'),     icon: '🐥', rarity: 'common',    bonus: t('Двойной опыт за ответы') },
  { id: 'parrot',  name: t('Попугай Кеша'), icon: '🦜', rarity: 'rare',      bonus: t('В приключении убирает 1 неверный вариант') },
  { id: 'puppy',   name: t('Щенок'),        icon: '🐶', rarity: 'rare',      bonus: t('+1 жизнь в битве с боссом') },
  { id: 'owl',     name: t('Сова'),         icon: '🦉', rarity: 'rare',      bonus: t('+10 секунд в Блице') },
  { id: 'axolotl', name: t('Аксолотль'),    icon: '🦎', rarity: 'rare',      bonus: t('Рыбы на ферме растут в 2 раза быстрее') },
  { id: 'panda',   name: t('Пандочка Бамбу'), icon: '🐼', img: (typeof HOUSE_ASSETS !== 'undefined' && HOUSE_ASSETS.panda_pet) || 'img/house/panda_pet.png', rarity: 'rare', bonus: t('+2 🦐 корма за каждые 3 ответа подряд') },
  { id: 'unicorn', name: t('Единорог'),     icon: '🦄', rarity: 'legendary', bonus: t('×2 рыбки за звёзды в приключении и столбике') },
  { id: 'dragon',  name: t('Дракончик'),    icon: '🐲', rarity: 'legendary', bonus: t('+1 урон боссу за каждый удар') },
  { id: 'fox',     name: t('Лисёнок'),      icon: '🦊', rarity: 'legendary', bonus: t('Сундук дня в 2 раза больше') },
];

const EGGS = [
  { id: 'basic', name: t('Обычное яйцо'), price: 60,  odds: { common: 70, rare: 25, legendary: 5 } },
  { id: 'gold',  name: t('Золотое яйцо'), price: 150, odds: { common: 25, rare: 55, legendary: 20 } },
];

// ---------- Породы котиков ----------
// ears: normal | big | small | tuft | fold; pattern: none | stripes | spots | points | calico | wrinkles | stars
const BREEDS = [
  { id: 'home',    name: t('Домашний'),     fur: 'ginger',   ears: 'normal', pattern: 'none',     cond: t('Твой первый котик'),            test: () => true },
  { id: 'tabby',   name: t('Полосатик'),    fur: 'gray',     ears: 'normal', pattern: 'stripes',  cond: t('Пройди мир ×2'),                test: p => (p.stars.w2 || 0) > 0 },
  { id: 'british', name: t('Британец'),     fur: 'gray',     ears: 'small',  pattern: 'none', round: true, eye: '#f0a020', cond: t('Пройди мир ×3'), test: p => (p.stars.w3 || 0) > 0 },
  { id: 'siamese', name: t('Сиамский'),     fur: 'cream',    ears: 'big',    pattern: 'points', eye: '#4aa3ff', cond: t('Пройди мир ×5'),      test: p => (p.stars.w5 || 0) > 0 },
  { id: 'maine',   name: t('Мейн-кун'),     fur: 'ginger',   ears: 'tuft',   pattern: 'stripes', fluffy: true, eye: '#8cc63f', cond: t('Пройди мир ×7'), test: p => (p.stars.w7 || 0) > 0 },
  { id: 'fold',    name: t('Вислоухий'),    fur: 'white',    ears: 'fold',   pattern: 'none', round: true, eye: '#f0a020', cond: t('Выполни задание дня 3 дня подряд'), test: p => p.streak.best >= 3 },
  { id: 'bengal',  name: t('Бенгальский'),  fur: 'ginger',   ears: 'normal', pattern: 'spots', eye: '#8cc63f', cond: t('Набери 25 очков в Блице'),    test: p => p.blitzBest >= 25 },
  { id: 'sphynx',  name: t('Сфинкс'),       fur: 'peach',    ears: 'big',    pattern: 'wrinkles', eye: '#8cc63f', cond: t('Победи босса'),          test: p => p.bossWins >= 1 },
  { id: 'calico',  name: t('Трёхцветный'),  fur: 'white',    ears: 'normal', pattern: 'calico',   cond: t('Пройди 3 уровня в столбик'),    test: p => Object.keys(p.colStars).length >= 3 },
  { id: 'persian', name: t('Персидский'),   fur: 'white',    ears: 'small',  pattern: 'none', fluffy: true, round: true, eye: '#f0a020', cond: t('Поймай 5 рыб на ферме'), test: p => p.farm.harvested >= 5 },
  { id: 'ragdoll', name: t('Рэгдолл'),      fur: 'cream',    ears: 'normal', pattern: 'points', fluffy: true, eye: '#4aa3ff', cond: t('Пройди 3 мира деления'), test: p => DIV_WORLDS.filter(w => (p.stars[w.id] || 0) > 0).length >= 3 },
  { id: 'panda',   name: t('Пандочка'),     fur: 'white',    ears: 'round',  pattern: 'panda', round: true, eye: '#4aa3ff', cond: t('Обустрой Кото-домик (купи 3 предмета)'), test: p => (p.houseOwned || []).length >= 11 },
  { id: 'cosmo',   name: t('Космокот'),     fur: 'lavender', ears: 'tuft',   pattern: 'stars', eye: '#ffd84a', cond: t('Собери 3 звезды во всех мирах умножения'), test: p => WORLDS.every(w => (p.stars[w.id] || 0) === 3) },
];

// ---------- Кото-домик ----------
const HOUSE_CATEGORIES = {
  wallpaper: { title: t('Обои'), icon: '🎨' },
  floor:     { title: t('Пол'), icon: '🪵' },
  rug:       { title: t('Коврик'), icon: '🧶' },
  bed:       { title: t('Лежанка'), icon: '🛏️' },
  scratcher: { title: t('Игры'), icon: '🌵' },
  window:    { title: t('Окно'), icon: '🪟' },
  decor:     { title: t('Декор'), icon: '🖼️' },
  bowl:      { title: t('Мисочка'), icon: '🥛' },
};

const HOUSE_ITEMS = {
  wallpaper: [
    { id: 'peach',   name: t('Персиковый уют'), price: 0,   css: 'linear-gradient(180deg, #ffe5ec, #fad2e1)' },
    { id: 'mint',    name: t('Мятная пастель'), price: 0,   css: 'linear-gradient(180deg, #e8f5e9, #c8e6c9)' },
    { id: 'cream',   name: t('Кремовый лофт'),  price: 30,  css: 'linear-gradient(180deg, #fff3e0, #ffe0b2)' },
    { id: 'cottage', name: t('Уютный домик'),   price: 50,  css: 'repeating-linear-gradient(45deg, #fdf2e9 0 20px, #fae5d3 20px 40px)' },
    { id: 'wood',    name: t('Тёплое дерево'),  price: 60,  css: 'repeating-linear-gradient(90deg, #d7ccc8 0 24px, #bcaaa4 24px 26px)' },
    { id: 'candy',   name: t('Конфетные полоски'), price: 70, css: 'repeating-linear-gradient(45deg, #fce4ec 0 16px, #fff 16px 32px)' },
    { id: 'space',   name: t('Звёздная ночь'),  price: 80,  css: 'radial-gradient(circle at 50% 20%, #2a1b4e, #0f0a20)' },
    { id: 'catpaws', name: t('Лапки на обоях'), price: 80,  css: 'radial-gradient(circle at 20% 20%, #ffd6e0 10px, transparent 11px), radial-gradient(circle at 80% 80%, #ffd6e0 10px, transparent 11px), linear-gradient(180deg, #fff0f5, #ffe4ec)' },
    { id: 'sky',     name: t('Небесная лазурь'), price: 90,  css: 'linear-gradient(180deg, #e1f5fe, #b3e5fc)' },
    { id: 'sakura',  name: t('Цветущая сакура'), price: 120, css: 'linear-gradient(180deg, #f8bbd0, #f48fb1)' },
  ],
  floor: [
    { id: 'oak',     name: t('Тёплый дуб'),     price: 0,   css: 'linear-gradient(180deg, #c89666, #8f5c38)' },
    { id: 'birch',   name: t('Светлый паркет'), price: 40,  css: 'linear-gradient(180deg, #e2cca8, #bba27e)' },
    { id: 'checker', name: t('Ретро-плитка'),   price: 60,  css: 'repeating-conic-gradient(#f5f5f5 0% 25%, #424242 0% 50%) 50% / 32px 32px' },
    { id: 'carpet',  name: t('Мягкий ковролин'), price: 70, css: 'linear-gradient(180deg, #a5d6a7, #81c784)' },
    { id: 'blue',    name: t('Морской настил'), price: 90,  css: 'linear-gradient(180deg, #81d4fa, #4fc3f7)' },
  ],
  rug: [
    { id: 'braided', name: t('Узорчатый коврик'), price: 0,   img: (typeof HOUSE_ASSETS !== 'undefined' && HOUSE_ASSETS.cat_rug) || 'img/house/cat_rug.png' },
    { id: 'paw',     name: t('Кошачья лапка'),   price: 40,  img: (typeof HOUSE_ASSETS !== 'undefined' && HOUSE_ASSETS.rug_paw) || 'img/house/rug_paw.png' },
    { id: 'rainbow', name: t('Радужный овал'),   price: 60,  img: (typeof HOUSE_ASSETS !== 'undefined' && HOUSE_ASSETS.rainbow_rug) || 'img/house/rainbow_rug.png' },
    { id: 'cloud',   name: t('Облачко'),         price: 70,  img: (typeof HOUSE_ASSETS !== 'undefined' && HOUSE_ASSETS.cloud_rug) || 'img/house/cloud_rug.png' },
    { id: 'fish',    name: t('Рыбий коврик'),    price: 80,  img: (typeof HOUSE_ASSETS !== 'undefined' && HOUSE_ASSETS.fish_rug) || 'img/house/fish_rug.png' },
  ],
  bed: [
    { id: 'sofa',     name: t('Большой диванчик'),   price: 0,   img: (typeof HOUSE_ASSETS !== 'undefined' && HOUSE_ASSETS.cat_sofa) || 'img/house/cat_sofa.png' },
    { id: 'cushion',  name: t('Мягкая подушка'),     price: 40,  img: (typeof HOUSE_ASSETS !== 'undefined' && HOUSE_ASSETS.cat_cushion) || 'img/house/cat_cushion.png' },
    { id: 'princess', name: t('Кроватка принцессы'), price: 100, img: (typeof HOUSE_ASSETS !== 'undefined' && HOUSE_ASSETS.princess_bed) || 'img/house/princess_bed.png' },
    { id: 'tent',     name: t('Вигвам-палатка'),     price: 90,  img: (typeof HOUSE_ASSETS !== 'undefined' && HOUSE_ASSETS.cat_tent) || 'img/house/cat_tent.png' },
    { id: 'basket',   name: t('Плетёная корзинка'),  price: 60,  img: (typeof HOUSE_ASSETS !== 'undefined' && HOUSE_ASSETS.cat_basket) || 'img/house/cat_basket.png' },
    { id: 'box',      name: t('Коробка из картона'), price: 30,  img: (typeof HOUSE_ASSETS !== 'undefined' && HOUSE_ASSETS.cat_box) || 'img/house/cat_box.png' },
  ],
  scratcher: [
    { id: 'cat_tree', name: t('Кошачье дерево'), price: 0,   img: (typeof HOUSE_ASSETS !== 'undefined' && HOUSE_ASSETS.cat_tree) || 'img/house/cat_tree.png' },
    { id: 'cactus',  name: t('Кактус-когтеточка'), price: 30, img: (typeof HOUSE_ASSETS !== 'undefined' && HOUSE_ASSETS.cactus_scratcher) || 'img/house/cactus_scratcher.png' },
    { id: 'castle',  name: t('Кошачий замок'),   price: 130, img: (typeof HOUSE_ASSETS !== 'undefined' && HOUSE_ASSETS.cat_castle) || 'img/house/cat_castle.png' },
    { id: 'wheel',   name: t('Беговое колесо'),  price: 160, img: (typeof HOUSE_ASSETS !== 'undefined' && HOUSE_ASSETS.cat_wheel) || 'img/house/cat_wheel.png' },
  ],
  window: [
    { id: 'cozy',    name: t('Цветущий сад'),    price: 0,   img: (typeof HOUSE_ASSETS !== 'undefined' && HOUSE_ASSETS.cozy_window) || 'img/house/cozy_window.png' },
    { id: 'sunny',   name: t('Солнечный день'),  price: 35,  img: (typeof HOUSE_ASSETS !== 'undefined' && HOUSE_ASSETS.window_sunny) || 'img/house/window_sunny.png' },
    { id: 'night',   name: t('Звёзды и луна'),   price: 50,  img: (typeof HOUSE_ASSETS !== 'undefined' && HOUSE_ASSETS.window_night) || 'img/house/window_night.png' },
    { id: 'aquarium',name: t('Подводный риф'),   price: 90,  img: (typeof HOUSE_ASSETS !== 'undefined' && HOUSE_ASSETS.window_aquarium) || 'img/house/window_aquarium.png' },
  ],
  decor: [
    { id: 'shelf',   name: t('Цветок на полке'), price: 0,   img: (typeof HOUSE_ASSETS !== 'undefined' && HOUSE_ASSETS.cat_shelf_plant) || 'img/house/cat_shelf_plant.png' },
    { id: 'portrait',name: t('Портрет котика'),  price: 50,  img: (typeof HOUSE_ASSETS !== 'undefined' && HOUSE_ASSETS.cat_portrait) || 'img/house/cat_portrait.png' },
    { id: 'clock',   name: t('Часы с хвостиком'),price: 60,  img: (typeof HOUSE_ASSETS !== 'undefined' && HOUSE_ASSETS.cat_clock) || 'img/house/cat_clock.png' },
  ],
  bowl: [
    { id: 'milk',    name: t('Блюдце с молоком'), price: 0,  img: (typeof HOUSE_ASSETS !== 'undefined' && HOUSE_ASSETS.bowl_milk) || 'img/house/bowl_milk.png' },
    { id: 'station', name: t('Столик с мисочками'), price: 40, img: (typeof HOUSE_ASSETS !== 'undefined' && HOUSE_ASSETS.cat_bowl_station) || 'img/house/cat_bowl_station.png' },
    { id: 'fish',    name: t('Рыбка на тарелке'), price: 45, img: (typeof HOUSE_ASSETS !== 'undefined' && HOUSE_ASSETS.bowl_fish) || 'img/house/bowl_fish.png' },
    { id: 'fountain',name: t('Золотой фонтан'),   price: 120, img: (typeof HOUSE_ASSETS !== 'undefined' && HOUSE_ASSETS.gold_fountain) || 'img/house/gold_fountain.png' },
  ],
};
