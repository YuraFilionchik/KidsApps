// Кото-домик: уютная персональная комната котика с мебелью, декором и питомцами.
// Мобильно-адаптированный интерфейс с уникальными иллюстрированными ассетами и выверенной глубиной.
'use strict';

let houseTab = 'bed';

function screenHouse() {
  if (!P.house) {
    P.house = { wallpaper: 'peach', floor: 'oak', rug: 'braided', bed: 'sofa', scratcher: 'cat_tree', window: 'cozy', decor: 'garland', bowl: 'milk' };
  }
  if (!P.houseOwned) {
    P.houseOwned = ['wallpaper:peach', 'floor:oak', 'rug:braided', 'bed:sofa', 'scratcher:cat_tree', 'window:cozy', 'decor:garland', 'bowl:milk'];
  }

  const curPet = findPet(P.pet);
  const wp = HOUSE_ITEMS.wallpaper.find(w => w.id === P.house.wallpaper) || HOUSE_ITEMS.wallpaper[0];
  const fl = HOUSE_ITEMS.floor.find(f => f.id === P.house.floor) || HOUSE_ITEMS.floor[0];
  const rg = HOUSE_ITEMS.rug.find(r => r.id === P.house.rug) || HOUSE_ITEMS.rug[0];
  const bd = HOUSE_ITEMS.bed.find(b => b.id === P.house.bed) || HOUSE_ITEMS.bed[0];
  const sc = HOUSE_ITEMS.scratcher.find(s => s.id === P.house.scratcher) || HOUSE_ITEMS.scratcher[0];
  const wn = HOUSE_ITEMS.window.find(w => w.id === P.house.window) || HOUSE_ITEMS.window[0];
  const dc = HOUSE_ITEMS.decor.find(d => d.id === P.house.decor) || HOUSE_ITEMS.decor[0];
  const bw = HOUSE_ITEMS.bowl.find(b => b.id === P.house.bowl) || HOUSE_ITEMS.bowl[0];

  const catPhrases = [
    'Мурр! Какой уютный диванчик!',
    'Как здесь тепло и мягко 🐾',
    'Моя любимая комната!',
    'Почеши за ушком!',
    curPet ? `Мы с ${curPet.name} здесь играем!` : 'Здесь так спокойно!'
  ];

  show(`<div class="screen house-screen">
    <!-- Верхняя панель -->
    <div class="row-top">
      <button class="icon-btn" data-action="hub" title="В меню">←</button>
      <h2>🏡 Кото-домик</h2>
      <div class="pill fish" id="houseFishBadge">🐟 ${P.fish}</div>
    </div>

    <!-- Интерактивная сцена комнаты: открытая глубина без обрезки ушей и с крупной мебелью -->
    <div class="house-stage-wrapper">
      <div class="house-room" id="houseRoom">
        
        <!-- Слой 1: Стена с обоями -->
        <div class="room-wall" style="background:${wp.css};">
          <!-- Окно с видом (иллюстрация или эмодзи) -->
          <div class="room-window-frame" data-action="tapWindow" title="${wn.name}">
            ${wn.img ? `
              <img src="${wn.img}" class="room-window-img" alt="${wn.name}">
            ` : `
              <div class="room-window-sky" style="background:${wn.sky};">
                <span class="room-window-sun">${wn.sun}</span>
                <div class="room-window-glass"></div>
              </div>
            `}
          </div>

          <!-- Настенный декор -->
          ${dc.img ? `
            <div class="room-wall-art" data-action="tapDecor" title="${dc.name}">
              <img src="${dc.img}" class="room-decor-img" alt="${dc.name}">
            </div>
          ` : dc.id === 'garland' ? `
            <div class="room-garland" data-action="tapDecor" title="Гирлянда">
              <span>💡</span><span>✨</span><span>💡</span><span>✨</span><span>💡</span>
            </div>` : `
            <div class="room-wall-art" data-action="tapDecor" title="${dc.name}">
              <span class="decor-art-icon">${dc.icon}</span>
            </div>
          `}
        </div>

        <!-- Слой 2: Разделительный плинтус -->
        <div class="room-baseboard"></div>

        <!-- Слой 3: Пол комнаты -->
        <div class="room-floor" style="background:${fl.css};"></div>

        <!-- Слой 4: Широкий коврик (лежит на полу под мебелью) -->
        <div class="room-layer-rug" data-action="tapRug" title="${rg.name}">
          ${rg.img ? `
            <img src="${rg.img}" class="room-rug-img" alt="${rg.name}">
          ` : `
            <div class="room-rug-css" style="background:${rg.css};">
              <span class="rug-pattern-left">${rg.icon || '🐾'}</span>
              <span class="rug-pattern-right">${rg.icon || '🐾'}</span>
            </div>
          `}
        </div>

        <!-- Слой 5: Задний план мебели (возле стены) -->
        <!-- Большой диван / Кроватка на заднем фоне возле стены поверх коврика -->
        <div class="room-layer-bed" data-action="tapBed" title="${bd.name}">
          ${bd.img ? `
            <img src="${bd.img}" class="room-bed-img" alt="${bd.name}">
          ` : `
            <span class="room-bed-emoji-big">${bd.icon}</span>
          `}
        </div>

        <!-- Слой 6: Высокое кошачье дерево-когтеточка справа -->
        <div class="room-layer-scratcher" data-action="tapScratcher" title="${sc.name}">
          ${sc.img ? `
            <img src="${sc.img}" class="room-scratcher-img" alt="${sc.name}">
          ` : `
            <span class="room-scratcher-emoji-big">${sc.icon}</span>
          `}
        </div>

        <!-- Слой 7: Мисочка с угощением -->
        <div class="room-layer-bowl" data-action="tapBowl" title="${bw.name}">
          ${bw.img ? `
            <img src="${bw.img}" class="room-bowl-img" alt="${bw.name}">
          ` : `
            <span class="room-bowl-emoji">${bw.icon}</span>
          `}
        </div>

        <!-- Слой 7: Котик в центре (уши полностью открыты, поверх стены и пола) -->
        <div class="room-layer-cat" data-action="tapHouseCat" title="Погладить котика">
          <div class="cat-floor-shadow"></div>
          ${catHTML(P.cat, 126, 'happy', false)}
          <div class="room-cat-bubble" id="houseCatBubble">${pick(catPhrases)}</div>
        </div>

        <!-- Слой 8: Питомец рядом с котиком (Пандочка с уникальной иллюстрацией) -->
        ${curPet ? `
          <div class="room-layer-pet" data-action="tapHousePet" title="Поиграть с ${curPet.name}">
            <div class="pet-floor-shadow"></div>
            ${curPet.img ? `
              <img src="${curPet.img}" class="room-pet-img ${curPet.id === 'panda' ? 'panda-wiggle' : ''}" alt="${curPet.name}">
            ` : `
              <span class="room-pet-icon">${curPet.icon}</span>
            `}
          </div>
        ` : `
          <button class="room-pet-invite" data-action="pets" title="Позвать питомца в комнату">
            <span class="invite-plus">➕</span>
            <small>Друг</small>
          </button>
        `}

      </div>

      <!-- Кнопка смены питомца в комнате -->
      <div class="room-pet-bar">
        <span class="pet-bar-title">${curPet ? `${curPet.icon} <b>${curPet.name}</b>` : '🐾 Без питомца'}</span>
        <button class="btn ghost small" data-action="pets" style="padding:4px 10px;font-size:0.85rem;">Сменить друга 🥚</button>
      </div>
    </div>

    <!-- Панель магазина мебели и декора для комнаты -->
    <div class="house-shop-card card">
      <div class="house-tabs-container">
        <button class="house-tab-scroll-btn" data-action="scrollHouseTabsLeft" title="Влево">‹</button>
        <div class="house-tabs-scroll" id="houseTabsScroll">
          ${Object.entries(HOUSE_CATEGORIES).map(([id, cat]) => `
            <button class="house-tab-btn ${houseTab === id ? 'active' : ''}" data-action="houseTab" data-tab="${id}">
              <span class="tab-i">${cat.icon}</span>
              <span>${cat.title}</span>
            </button>
          `).join('')}
        </div>
        <button class="house-tab-scroll-btn" data-action="scrollHouseTabsRight" title="Вправо">›</button>
      </div>

      <!-- Сетка предметов текущей категории -->
      <div class="house-items-grid">
        ${(HOUSE_ITEMS[houseTab] || []).map(item => {
          const key = houseTab + ':' + item.id;
          const isOwned = item.price === 0 || P.houseOwned.includes(key);
          const isEquipped = P.house[houseTab] === item.id;
          const canBuy = P.fish >= item.price;

          let previewHTML = '';
          if (item.img) {
            previewHTML = `<img src="${item.img}" class="item-grid-img" alt="${item.name}">`;
          } else if (houseTab === 'wallpaper' || houseTab === 'floor') {
            previewHTML = `<div class="item-grid-fill" style="background:${item.css};"></div>`;
          } else if (houseTab === 'rug') {
            previewHTML = `<div class="item-grid-fill" style="background:${item.css};"><span class="grid-rug-icon">${item.icon || ''}</span></div>`;
          } else if (houseTab === 'window') {
            previewHTML = `<div class="item-grid-fill" style="background:${item.sky};"><span class="grid-rug-icon">${item.sun}</span></div>`;
          } else {
            previewHTML = `<span class="preview-emoji">${item.icon || '🛋️'}</span>`;
          }

          return `
            <div class="house-item-card ${isEquipped ? 'equipped' : ''}" data-action="${isEquipped ? '' : isOwned ? 'equipHouseItem' : 'buyHouseItem'}" data-slot="${houseTab}" data-id="${item.id}">
              <div class="house-item-preview">
                ${previewHTML}
                ${isEquipped ? '<span class="equipped-badge">✓ В комнате</span>' : ''}
              </div>
              <div class="house-item-info">
                <b class="house-item-name">${item.name}</b>
                ${isEquipped ? '<span class="house-item-status active">Выбрано</span>'
                  : isOwned ? '<span class="house-item-status owned">Надеть</span>'
                  : `<span class="house-item-price ${canBuy ? '' : 'poor'}">🐟 ${item.price}</span>`}
              </div>
            </div>
          `;
        }).join('')}
      </div>
  </div>`);

  const tabsScrollEl = document.getElementById('houseTabsScroll');
  if (tabsScrollEl) {
    tabsScrollEl.addEventListener('wheel', (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        tabsScrollEl.scrollLeft += e.deltaY;
      }
    }, { passive: false });
    const activeTab = tabsScrollEl.querySelector('.house-tab-btn.active');
    if (activeTab) {
      activeTab.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    }
  }
}

// Покупка предмета для дома
function buyHouseItem(slot, id) {
  const item = (HOUSE_ITEMS[slot] || []).find(i => i.id === id);
  if (!item) return;

  if (P.fish < item.price) {
    toast(`Не хватает ${item.price - P.fish} 🐟. Решай примеры, чтобы заработать!`);
    Sound.wrong();
    return;
  }

  const visual = item.img ? `<img src="${item.img}" style="max-height:90px;margin:8px auto;display:block;" alt="${item.name}">` : `<div style="font-size:3.5rem;margin:12px 0;">${item.icon || '🛋️'}</div>`;

  modal(`<h2>Купить для домика?</h2>
    ${visual}
    <p><b>${item.name}</b></p>
    <p>Цена: <b>${item.price} 🐟</b></p>
    <button class="btn big primary wide" data-action="confirmBuyHouseItem" data-slot="${slot}" data-id="${id}">Купить и поставить!</button>
    <button class="btn wide ghost" data-action="closeModal">Позже</button>`);
}

function confirmBuyHouseItem(slot, id) {
  const item = (HOUSE_ITEMS[slot] || []).find(i => i.id === id);
  if (!item || P.fish < item.price) return;

  const key = slot + ':' + id;
  P.fish -= item.price;
  if (!P.houseOwned.includes(key)) P.houseOwned.push(key);
  P.house[slot] = id;
  P.purchases = (P.purchases || 0) + 1;
  checkAchievements();
  save();

  closeModal();
  Sound.coin();
  confetti(['✨', '🏡', '💖', '🐟']);
  toast(`🎉 ${item.name} теперь в твоей комнате!`);
  screenHouse();
}

function equipHouseItem(slot, id) {
  P.house[slot] = id;
  save();
  Sound.click();
  screenHouse();
}

// Реакции на прикосновения в комнате
function popHeartInRoom(x, y, emoji = '💖') {
  const room = document.getElementById('houseRoom');
  if (!room) return;
  const h = document.createElement('span');
  h.className = 'room-heart-pop';
  h.textContent = emoji;
  h.style.left = x + '%';
  h.style.top = y + '%';
  room.appendChild(h);
  setTimeout(() => h.remove(), 950);
}

Object.assign(actions, {
  house() { S = null; screenHouse(); },
  houseTab(el) {
    houseTab = el.dataset.tab;
    screenHouse();
  },
  scrollHouseTabsLeft() {
    const el = document.getElementById('houseTabsScroll');
    if (el) el.scrollBy({ left: -140, behavior: 'smooth' });
  },
  scrollHouseTabsRight() {
    const el = document.getElementById('houseTabsScroll');
    if (el) el.scrollBy({ left: 140, behavior: 'smooth' });
  },
  equipHouseItem(el) { equipHouseItem(el.dataset.slot, el.dataset.id); },
  buyHouseItem(el) { buyHouseItem(el.dataset.slot, el.dataset.id); },
  confirmBuyHouseItem(el) { confirmBuyHouseItem(el.dataset.slot, el.dataset.id); },

  tapHouseCat() {
    const isPandaCat = P.cat && P.cat.breed === 'panda';
    if (isPandaCat) {
      if (Sound.crunch) Sound.crunch(); else Sound.meow();
    } else {
      Sound.meow();
    }
    const cat = document.querySelector('.room-layer-cat .cat');
    if (cat) {
      cat.classList.remove('wiggle');
      void cat.offsetWidth;
      cat.classList.add('wiggle');
    }
    popHeartInRoom(50, 42, isPandaCat ? pick(['🎋', '🐼', '✨', '💖']) : pick(['💖', '🐾', '😻', '✨']));
    const bubble = document.getElementById('houseCatBubble');
    if (bubble) {
      const phrases = isPandaCat
        ? ['Хрусь! Бамбук такой вкусный! 🎋', 'Мурр! Я самая пушистая пандочка!', 'Спасибо за чудесный домик! 🐼', 'Люблю отдыхать на диванчике! ✨']
        : ['Мур-мур! Я обожаю этот диванчик!', 'Спасибо за уют! 🐾', 'Ты самый лучший хозяин!', 'Мяу-мяу! У меня самая красивая комната!'];
      bubble.textContent = pick(phrases);
      bubble.classList.remove('pop');
      void bubble.offsetWidth;
      bubble.classList.add('pop');
    }
  },

  tapHousePet() {
    const isPanda = P.pet === 'panda';
    if (isPanda && Sound.crunch) Sound.crunch(); else Sound.correct();
    const petEl = document.querySelector('.room-layer-pet');
    if (petEl) {
      petEl.classList.remove('bounce-tap');
      void petEl.offsetWidth;
      petEl.classList.add('bounce-tap');
    }
    popHeartInRoom(70, 50, isPanda ? pick(['🎍', '🐼', '✨', '💖']) : pick(['✨', '💖', '⭐']));
    toast(isPanda ? '🐼 Пандочка с аппетитом хрустит бамбуком!' : '🐾 Твой питомец счастлив играть в комнате!');
  },

  tapBed() {
    Sound.click();
    popHeartInRoom(20, 52, '💤');
    toast('🛋️ Просторный мягкий диванчик возле стены!');
  },

  tapScratcher() {
    Sound.click();
    popHeartInRoom(84, 46, '🪵');
    toast('🌳 Большое кошачье дерево: котик залезает на самый верх!');
  },

  tapWindow() {
    Sound.click();
    popHeartInRoom(20, 24, '☀️');
    toast('🪟 За окном чудесный цветущий сад!');
  },

  tapDecor() {
    Sound.coin();
    popHeartInRoom(50, 16, '✨');
    toast('💡 Тёплый свет гирлянды!');
  },

  tapBowl() {
    Sound.coin();
    popHeartInRoom(28, 65, '😋');
    toast('🥛 Ням! Вкусное угощение для котика!');
  },

  tapRug() {
    Sound.click();
    popHeartInRoom(50, 62, '🧶');
  }
});
