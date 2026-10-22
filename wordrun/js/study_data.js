// Word Run, режим «Контрольная»: словарь разделов учебника.
// ipa — британская транскрипция, ex/exRu — пример с переводом, note — пояснение на карточке.
// Чтобы подогнать под конкретный учебник, достаточно поправить списки ниже.
'use strict';

const STUDY_SPORTS = [
  { en: 'football', ru: 'футбол', ipa: 'ˈfʊtbɔːl', pic: '⚽', verb: 'play', places: ['stadium', 'football pitch'],
    ex: 'I play football at the stadium.', exRu: 'Я играю в футбол на стадионе.' },
  { en: 'basketball', ru: 'баскетбол', ipa: 'ˈbɑːskɪtbɔːl', pic: '🏀', verb: 'play', places: ['gym', 'sports centre'],
    ex: 'We play basketball in the gym.', exRu: 'Мы играем в баскетбол в спортзале.' },
  { en: 'volleyball', ru: 'волейбол', ipa: 'ˈvɒlibɔːl', pic: '🏐', verb: 'play', places: ['gym', 'sports ground'],
    ex: 'They play volleyball on the sports ground.', exRu: 'Они играют в волейбол на спортплощадке.' },
  { en: 'tennis', ru: 'теннис', ipa: 'ˈtenɪs', pic: '🎾', verb: 'play', places: ['tennis court'],
    ex: 'She plays tennis on the tennis court.', exRu: 'Она играет в теннис на теннисном корте.' },
  { en: 'table tennis', ru: 'настольный теннис', ipa: 'ˈteɪbl ˌtenɪs', pic: '🏓', verb: 'play', places: ['sports centre', 'gym'],
    ex: 'My dad plays table tennis at the sports centre.', exRu: 'Мой папа играет в настольный теннис в спортивном центре.' },
  { en: 'hockey', ru: 'хоккей', ipa: 'ˈhɒki', pic: '🏒', verb: 'play', places: ['ice rink'],
    ex: 'Boys play hockey at the ice rink.', exRu: 'Мальчики играют в хоккей на катке.' },
  { en: 'badminton', ru: 'бадминтон', ipa: 'ˈbædmɪntən', pic: '🏸', verb: 'play', places: ['park', 'gym'],
    ex: 'We play badminton in the park.', exRu: 'Мы играем в бадминтон в парке.' },
  { en: 'swimming', ru: 'плавание', ipa: 'ˈswɪmɪŋ', pic: '🏊', verb: 'go', places: ['swimming pool'],
    ex: 'I go swimming in the swimming pool.', exRu: 'Я хожу плавать в бассейн.' },
  { en: 'skiing', ru: 'катание на лыжах', ipa: 'ˈskiːɪŋ', pic: '⛷️', verb: 'go', places: ['mountains', 'park'],
    ex: 'In winter we go skiing in the mountains.', exRu: 'Зимой мы катаемся на лыжах в горах.',
    note: 'Пишется с двумя i: ski + ing = skiing.' },
  { en: 'skating', ru: 'катание на коньках', ipa: 'ˈskeɪtɪŋ', pic: '⛸️', verb: 'go', places: ['ice rink'],
    ex: "Let's go skating at the ice rink!", exRu: 'Пойдём кататься на коньках на каток!',
    note: 'skate − e + ing = skating (буква e уходит).' },
  { en: 'running', ru: 'бег', ipa: 'ˈrʌnɪŋ', pic: '🏃', verb: 'go', places: ['stadium', 'park'],
    ex: 'I go running in the park.', exRu: 'Я бегаю в парке.',
    note: 'run + n + ing = running (n удваивается).' },
  { en: 'cycling', ru: 'езда на велосипеде', ipa: 'ˈsaɪklɪŋ', pic: '🚴', verb: 'go', places: ['park'],
    ex: 'We go cycling in the park.', exRu: 'Мы катаемся на велосипедах в парке.' },
  { en: 'gymnastics', ru: 'гимнастика', ipa: 'dʒɪmˈnæstɪks', pic: '🤸', verb: 'do', places: ['gym'],
    ex: 'My sister does gymnastics in the gym.', exRu: 'Моя сестра занимается гимнастикой в спортзале.' },
  { en: 'karate', ru: 'карате', ipa: 'kəˈrɑːti', pic: '🥋', verb: 'do', places: ['gym', 'sports centre'],
    ex: 'He does karate at the sports centre.', exRu: 'Он занимается карате в спортивном центре.' }
];

// prep — с каким предлогом место: «где?»
const STUDY_PLACES = [
  { en: 'stadium', ru: 'стадион', ipa: 'ˈsteɪdiəm', pic: '🏟️', prep: 'at',
    ex: 'We run at the stadium.', exRu: 'Мы бегаем на стадионе.' },
  { en: 'gym', ru: 'спортзал', ipa: 'dʒɪm', pic: '🏋️', prep: 'in',
    ex: 'We play basketball in the gym.', exRu: 'Мы играем в баскетбол в спортзале.' },
  { en: 'swimming pool', ru: 'бассейн', ipa: 'ˈswɪmɪŋ puːl', pic: '🛟', prep: 'in',
    ex: 'I swim in the swimming pool.', exRu: 'Я плаваю в бассейне.' },
  { en: 'tennis court', ru: 'теннисный корт', ipa: 'ˈtenɪs kɔːt', pic: '🎾', prep: 'on',
    ex: 'They play tennis on the tennis court.', exRu: 'Они играют в теннис на корте.' },
  { en: 'football pitch', ru: 'футбольное поле', ipa: 'ˈfʊtbɔːl pɪtʃ', pic: '🥅', prep: 'on',
    ex: 'The boys are on the football pitch.', exRu: 'Мальчики на футбольном поле.' },
  { en: 'ice rink', ru: 'каток', ipa: 'ˈaɪs rɪŋk', pic: '🧊', prep: 'at',
    ex: 'We skate at the ice rink.', exRu: 'Мы катаемся на катке.' },
  { en: 'sports ground', ru: 'спортплощадка', ipa: 'ˈspɔːts ɡraʊnd', pic: '🏐', prep: 'on',
    ex: 'We play volleyball on the sports ground.', exRu: 'Мы играем в волейбол на спортплощадке.' },
  { en: 'park', ru: 'парк', ipa: 'pɑːk', pic: '🌳', prep: 'in',
    ex: 'I ride my bike in the park.', exRu: 'Я катаюсь на велосипеде в парке.' },
  { en: 'mountains', ru: 'горы', ipa: 'ˈmaʊntɪnz', pic: '🏔️', prep: 'in',
    ex: 'We ski in the mountains.', exRu: 'Мы катаемся на лыжах в горах.' },
  { en: 'sports centre', ru: 'спортивный центр', ipa: 'ˈspɔːts ˌsentə', pic: '🏢', prep: 'at',
    ex: 'My mum goes to the sports centre.', exRu: 'Моя мама ходит в спортивный центр.',
    note: 'Британское написание — centre (re на конце).' }
];

// season — id времени года
const STUDY_MONTHS = [
  { en: 'January', ru: 'январь', ipa: 'ˈdʒænjuəri', pic: '☃️', season: 'winter', ex: 'It is very cold in January.', exRu: 'В январе очень холодно.' },
  { en: 'February', ru: 'февраль', ipa: 'ˈfebruəri', pic: '❄️', season: 'winter', ex: 'February is the shortest month.', exRu: 'Февраль — самый короткий месяц.',
    note: 'Не забудь первую r: Feb-r-uary.' },
  { en: 'March', ru: 'март', ipa: 'mɑːtʃ', pic: '🌷', season: 'spring', ex: 'Spring starts in March.', exRu: 'Весна начинается в марте.' },
  { en: 'April', ru: 'апрель', ipa: 'ˈeɪprəl', pic: '☔', season: 'spring', ex: 'It often rains in April.', exRu: 'В апреле часто идёт дождь.' },
  { en: 'May', ru: 'май', ipa: 'meɪ', pic: '🌸', season: 'spring', ex: 'My birthday is in May.', exRu: 'Мой день рождения в мае.' },
  { en: 'June', ru: 'июнь', ipa: 'dʒuːn', pic: '🍓', season: 'summer', ex: 'School ends in June.', exRu: 'Учёба заканчивается в июне.' },
  { en: 'July', ru: 'июль', ipa: 'dʒuˈlaɪ', pic: '🏖️', season: 'summer', ex: 'We swim in the sea in July.', exRu: 'В июле мы купаемся в море.',
    note: 'Ударение на конец: ju-LY.' },
  { en: 'August', ru: 'август', ipa: 'ˈɔːɡəst', pic: '🌻', season: 'summer', ex: 'It is hot in August.', exRu: 'В августе жарко.' },
  { en: 'September', ru: 'сентябрь', ipa: 'sepˈtembə', pic: '🎒', season: 'autumn', ex: 'School starts in September.', exRu: 'Учёба начинается в сентябре.' },
  { en: 'October', ru: 'октябрь', ipa: 'ɒkˈtəʊbə', pic: '🍁', season: 'autumn', ex: 'Leaves fall in October.', exRu: 'В октябре падают листья.' },
  { en: 'November', ru: 'ноябрь', ipa: 'nəʊˈvembə', pic: '🌧️', season: 'autumn', ex: 'November is cold and rainy.', exRu: 'Ноябрь холодный и дождливый.' },
  { en: 'December', ru: 'декабрь', ipa: 'dɪˈsembə', pic: '🎄', season: 'winter', ex: 'We decorate the New Year tree in December.', exRu: 'В декабре мы наряжаем ёлку.' }
];

const STUDY_SEASONS = [
  { en: 'winter', ru: 'зима', ipa: 'ˈwɪntə', pic: '☃️', ex: 'In winter we go skiing and skating.', exRu: 'Зимой мы катаемся на лыжах и коньках.' },
  { en: 'spring', ru: 'весна', ipa: 'sprɪŋ', pic: '🌷', ex: 'In spring the trees are green.', exRu: 'Весной деревья зелёные.' },
  { en: 'summer', ru: 'лето', ipa: 'ˈsʌmə', pic: '☀️', ex: 'In summer I go swimming.', exRu: 'Летом я хожу плавать.',
    note: 'Две m: su-mm-er.' },
  { en: 'autumn', ru: 'осень', ipa: 'ˈɔːtəm', pic: '🍂', ex: 'In autumn we go back to school.', exRu: 'Осенью мы возвращаемся в школу.',
    note: 'Буква n на конце не читается: [ˈɔːtəm]. В американском английском осень — fall.' }
];

// Правила и пояснения к темам (HTML). Английские примеры в <q> озвучиваются по нажатию.
const STUDY_TIPS = {
  sports: `
    <h3>play, go или do?</h3>
    <p><b>play</b> — игры с мячом, шайбой или ракеткой:</p>
    <p class="ex"><q>I play football.</q> <q>We play tennis.</q></p>
    <p><b>go</b> — занятия на <b>-ing</b>, где двигаешься:</p>
    <p class="ex"><q>I go swimming.</q> <q>We go skiing.</q></p>
    <p><b>do</b> — единоборства и гимнастика:</p>
    <p class="ex"><q>She does gymnastics.</q> <q>He does karate.</q></p>
    <h3>Частая ошибка</h3>
    <p>По-русски «играть <b>в</b> футбол», а по-английски без «в»: <q>play football</q>, не <s>play in football</s>.</p>
    <h3>Как спросить</h3>
    <p class="ex"><q>Do you like swimming?</q> — <q>Yes, I do.</q> / <q>No, I don't.</q></p>
    <p class="ex"><q>What sport do you like?</q> — <q>I like hockey.</q></p>`,
  places: `
    <h3>Где? — in, at или on</h3>
    <p><b>in</b> — внутри, в чём-то: <q>in the gym</q>, <q>in the swimming pool</q>, <q>in the park</q>, <q>in the mountains</q>.</p>
    <p><b>at</b> — в месте, куда приходят заниматься: <q>at the stadium</q>, <q>at the ice rink</q>, <q>at the sports centre</q>.</p>
    <p><b>on</b> — на площадке, на поверхности: <q>on the tennis court</q>, <q>on the football pitch</q>, <q>on the sports ground</q>.</p>
    <h3>Как спросить</h3>
    <p class="ex"><q>Where do you play tennis?</q> — <q>On the tennis court.</q></p>
    <p class="ex"><q>Where do you go swimming?</q> — <q>In the swimming pool.</q></p>`,
  months: `
    <h3>Месяцы — всегда с большой буквы</h3>
    <p><q>January</q>, <q>May</q>, <q>September</q> — даже в середине предложения.</p>
    <h3>В каком месяце? — in</h3>
    <p class="ex"><q>My birthday is in May.</q> — Мой день рождения в мае.</p>
    <h3>По порядку</h3>
    <p class="ex"><q>January</q> → <q>February</q> → <q>March</q> → <q>April</q> → <q>May</q> → <q>June</q> → <q>July</q> → <q>August</q> → <q>September</q> → <q>October</q> → <q>November</q> → <q>December</q></p>
    <p><q>January is the first month.</q> <q>December is the last month.</q></p>
    <h3>Как спросить</h3>
    <p class="ex"><q>When is your birthday?</q> — <q>It's in June.</q></p>`,
  numbers: `
    <h3>13–19: окончание -teen</h3>
    <p>Ударение в конце: thir<b>TEEN</b>, four<b>TEEN</b>. <q>thirteen</q> <q>fourteen</q> <q>fifteen</q></p>
    <h3>20–90: окончание -ty</h3>
    <p>Ударение в начале: <b>THIR</b>ty, <b>FOR</b>ty. <q>thirty</q> <q>forty</q> <q>fifty</q></p>
    <p>Слушай ударение — так <q>thirteen</q> (13) отличается от <q>thirty</q> (30).</p>
    <h3>Коварные слова</h3>
    <p><b>four</b> → fourteen, но <b>forty</b> — без u!</p>
    <p><b>five</b> → <b>fif</b>teen, <b>fif</b>ty; <b>three</b> → <b>thir</b>teen, <b>thir</b>ty.</p>
    <p><b>eight</b> → eighteen (одна t), eighty; <b>nine</b> → nineteen, <b>ninety</b> (e остаётся).</p>
    <p><b>twelve</b> — не «twoteen».</p>
    <h3>21–99 — через дефис</h3>
    <p class="ex"><q>twenty-one</q> (21), <q>forty-five</q> (45), <q>ninety-nine</q> (99)</p>
    <h3>100</h3>
    <p class="ex"><q>one hundred</q> или <q>a hundred</q></p>`,
  seasons: `
    <h3>Времена года и месяцы</h3>
    <p><q>winter</q> — <q>December</q>, <q>January</q>, <q>February</q></p>
    <p><q>spring</q> — <q>March</q>, <q>April</q>, <q>May</q></p>
    <p><q>summer</q> — <q>June</q>, <q>July</q>, <q>August</q></p>
    <p><q>autumn</q> — <q>September</q>, <q>October</q>, <q>November</q></p>
    <h3>Когда? — in</h3>
    <p class="ex"><q>In summer I go swimming.</q> <q>In winter we go skating.</q></p>
    <p>Времена года пишутся с <b>маленькой</b> буквы, в отличие от месяцев.</p>
    <h3>Как спросить</h3>
    <p class="ex"><q>What's your favourite season?</q> — <q>I like summer.</q></p>`
};

// Разделы учебника. quiz — какие типы вопросов подходят теме (см. study_game.js).
const STUDY_UNITS = [
  {
    id: 'u1', title: 'Раздел 1', subtitle: 'Спорт, места, месяцы, числа, времена года',
    topics: [
      { id: 'sports', title: 'Виды спорта', icon: '⚽', color: '#16a34a', items: STUDY_SPORTS,
        quiz: ['pic', 'ru2en', 'listen', 'en2ru', 'spell', 'verb'] },
      { id: 'places', title: 'Где занимаются', icon: '🏟️', color: '#0ea5e9', items: STUDY_PLACES,
        quiz: ['ru2en', 'listen', 'en2ru', 'spell', 'place'] },
      { id: 'months', title: 'Месяцы', icon: '📅', color: '#e11d48', items: STUDY_MONTHS,
        quiz: ['ru2en', 'listen', 'en2ru', 'spell', 'monthNext', 'monthSeason'] },
      { id: 'numbers', title: 'Числа 1–100', icon: '🔢', color: '#7c3aed', items: 'numbers',
        quiz: ['numWord', 'numListen', 'numDigits', 'numType'] },
      { id: 'seasons', title: 'Времена года', icon: '🍂', color: '#ea580c', items: STUDY_SEASONS,
        quiz: ['pic', 'ru2en', 'listen', 'spell', 'monthSeason'] }
    ]
  }
];

if (typeof module !== 'undefined') module.exports = { STUDY_UNITS, STUDY_TIPS };
