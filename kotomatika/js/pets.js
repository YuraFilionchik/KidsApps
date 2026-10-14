// Питомцы-компаньоны (выводятся из яиц) и коллекция пород котиков.
'use strict';

const findPet = id => PETS.find(p => p.id === id);

function screenPets() {
  const cur = findPet(P.pet);
  show(`<div class="screen pets">
    <div class="row-top"><button class="icon-btn" data-action="hub">←</button><h2>🥚 Питомцы</h2><div class="pill fish">🐟 ${P.fish}</div></div>
    <div class="card companion">
      <div class="cat-with-pet">${catHTML(P.cat, 110, 'happy')}${cur ? petHTML(cur.id, 46) : ''}</div>
      <div>${cur
        ? `<b>${cur.icon} ${cur.name}</b> играет с тобой<br><small>✨ ${cur.bonus}</small>`
        : '<b>У котика пока нет друга</b><br><small>Выведи питомца из яйца — он будет помогать в игре!</small>'}</div>
    </div>
    <h3>Яйца</h3>
    <div class="eggs">
      ${EGGS.map(e => `<button class="egg-card" data-action="buyEgg" data-id="${e.id}">
        <span class="egg ${e.id === 'gold' ? 'egg-gold' : ''}">🥚</span>
        <b>${e.name}</b>
        <small>${Object.entries(e.odds).map(([r, v]) => `<span style="color:${RARITY[r].color}">●</span> ${v}%`).join(' ')}</small>
        <span class="tag price ${P.fish >= e.price ? '' : 'poor'}">🐟 ${e.price}</span>
      </button>`).join('')}
    </div>
    <h3>Мои питомцы · ${P.pets.length} из ${PETS.length}</h3>
    <div class="pet-grid">
      ${PETS.map(p => {
        const have = P.pets.includes(p.id);
        const on = P.pet === p.id;
        return `<button class="pet-card ${have ? '' : 'unknown'} ${on ? 'on' : ''}" style="--rc:${RARITY[p.rarity].color}"
          data-action="${have ? 'equipPet' : 'unknownPet'}" data-id="${p.id}">
          <span class="pet-icon">${have ? p.icon : '❓'}</span>
          <b>${have ? p.name : '???'}</b>
          <small>${RARITY[p.rarity].name}</small>
          ${have ? `<small class="bonus">${p.bonus}</small>` : ''}
          ${on ? '<span class="tag on">С тобой</span>' : ''}
        </button>`;
      }).join('')}
    </div>
  </div>`);
}

// Выбираем питомца: сначала редкость по шансам яйца, потом ещё не найденного питомца.
function rollPet(egg) {
  const r = Math.random() * 100;
  let acc = 0;
  let rarity = 'common';
  for (const [k, v] of Object.entries(egg.odds)) { acc += v; if (r < acc) { rarity = k; break; } }
  const missing = PETS.filter(p => !P.pets.includes(p.id));
  if (!missing.length) return null;
  const same = missing.filter(p => p.rarity === rarity);
  return pick(same.length ? same : missing);
}

function hatchEgg(egg) {
  if (P.pets.length >= PETS.length) { toast('У тебя уже есть все питомцы! 🎉'); return; }
  if (P.fish < egg.price) { toast(`Не хватает ${egg.price - P.fish} 🐟. Решай примеры!`); Sound.wrong(); return; }
  P.fish -= egg.price;
  const pet = rollPet(egg);
  P.pets.push(pet.id);
  if (!P.pet) P.pet = pet.id;
  checkAchievements();
  save();
  Sound.click();
  modal(`<div class="hatch"><span class="egg big wobble ${egg.id === 'gold' ? 'egg-gold' : ''}">🥚</span></div>
    <h2>Кто же там?..</h2>`, 'hatch-modal');
  [350, 850, 1300].forEach(ms => setTimeout(() => { if (document.getElementById('modal')) Sound.crack(); }, ms));
  setTimeout(() => {
    if (!document.getElementById('modal')) return;
    const rar = RARITY[pet.rarity];
    Sound.hatch(['common', 'rare', 'legendary'].indexOf(pet.rarity));
    confetti([pet.icon, '✨', '⭐', '💖']);
    modal(`<div class="hatch revealed" style="--rc:${rar.color}"><span class="pet-big">${pet.icon}</span></div>
      <div class="rarity" style="background:${rar.color}">${rar.name}</div>
      <h2>${pet.name}!</h2>
      <p>✨ ${pet.bonus}</p>
      <button class="btn big primary wide" data-action="equipPet" data-id="${pet.id}">Взять с собой!</button>
      <button class="btn wide ghost" data-action="pets">Потом</button>`, 'hatch-modal');
  }, 1700);
}

// ---------- Коллекция пород ----------

function screenCollection() {
  const got = BREEDS.filter(b => b.test(P));
  show(`<div class="screen">
    <div class="row-top"><button class="icon-btn" data-action="hub">←</button><h2>🐈 Коллекция</h2><div class="pill">${got.length}/${BREEDS.length}</div></div>
    <p class="subtitle">Открывай новые породы за успехи в игре. Нажми на котика, чтобы играть им!</p>
    <div class="breed-grid">
      ${BREEDS.map(b => {
        const open = b.test(P);
        const on = P.cat.breed === b.id;
        return `<button class="breed-card ${open ? '' : 'locked'} ${on ? 'on' : ''}" data-action="${open ? 'pickBreed' : 'lockedBreed'}" data-id="${b.id}">
          <div class="${open ? '' : 'silhouette'}">${catHTML({ fur: b.fur, breed: b.id, bg: 'room' }, 96, open ? 'happy' : 'normal')}</div>
          <b>${open ? b.name : '???'}</b>
          <small>${on ? '✅ Это ты!' : open ? 'Выбрать' : '🔒 ' + b.cond}</small>
        </button>`;
      }).join('')}
    </div>
  </div>`);
}

Object.assign(actions, {
  pets() { S = null; screenPets(); },
  buyEgg(el) { hatchEgg(EGGS.find(e => e.id === el.dataset.id)); },
  equipPet(el) {
    const id = el.dataset.id;
    P.pet = P.pet === id && !document.getElementById('modal') ? null : id;
    save();
    Sound.click();
    screenPets();
    if (P.pet) heroFx('twirl', document.querySelector('.companion'));
  },
  unknownPet() { toast('❓ Этого питомца можно найти в яйце!'); },
  collection() { S = null; screenCollection(); },
  pickBreed(el) {
    const b = BREEDS.find(x => x.id === el.dataset.id);
    P.cat.breed = b.id;
    P.cat.fur = b.fur;
    if (!P.owned.includes('fur:' + b.fur)) P.owned.push('fur:' + b.fur); // окрас породы — в подарок
    save();
    Sound.meow();
    screenCollection();
  },
  lockedBreed(el) { toast('🔒 ' + BREEDS.find(x => x.id === el.dataset.id).cond); },
});
