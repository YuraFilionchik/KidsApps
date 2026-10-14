// Кото-ферма: верные ответы дают корм 🦐, корм растит рыб в пруду, рыбу ловим за рыбки 🐟.
'use strict';

const findSpecies = id => FARM_SPECIES.find(x => x.id === id);

function farmReadyCount() {
  return P.farm.pond.filter(f => f && f.fed >= findSpecies(f.sp).need).length;
}

function farmStatus() {
  const ready = farmReadyCount();
  if (ready) return `🎣 Готово к улову: ${ready}!`;
  return `Корм: ${P.farm.food} 🦐`;
}

function screenFarm() {
  const F = P.farm;
  while (F.pond.length < F.size) F.pond.push(null);
  let slots = '';
  for (let i = 0; i < POND_MAX; i++) {
    if (i >= F.size) {
      const price = POND_SLOT_PRICES[i + 1];
      slots += i === F.size
        ? `<button class="pond-slot locked" data-action="buySlot"><span>🔒</span><small>Место за ${price} 🐟</small></button>`
        : '<div class="pond-slot hidden"></div>';
      continue;
    }
    const f = F.pond[i];
    if (!f) {
      slots += `<button class="pond-slot empty" data-action="farmEgg" data-i="${i}"><span class="plus">+</span><small>Запустить рыбку</small></button>`;
      continue;
    }
    const sp = findSpecies(f.sp);
    const pct = Math.min(1, f.fed / sp.need);
    const ready = pct >= 1;
    const scale = f.fed === 0 ? 0 : 0.45 + 0.55 * pct;
    slots += `<button class="pond-slot ${ready ? 'ready' : ''}" data-action="${ready ? 'harvest' : 'feed'}" data-i="${i}" id="slot${i}">
      <span class="fish-sprite" style="transform:scale(${scale ? scale.toFixed(2) : 1})">${f.fed === 0 ? '🫧' : sp.icon}</span>
      ${ready ? '<small class="ready-tag">Лови! 🎣</small>' : `<div class="mini-bar"><i style="width:${pct * 100}%"></i></div><small>${f.fed}/${sp.need} 🦐</small>`}
    </button>`;
  }
  const nextSp = FARM_SPECIES.find(sp => sp.unlock > F.harvested);
  show(`<div class="screen farm">
    <div class="row-top"><button class="icon-btn" data-action="hub">←</button><h2>🎣 Кото-ферма</h2><div class="pill fish">🐟 ${P.fish}</div></div>
    <div class="card farm-food">
      <div class="food-count">🦐 <b>${F.food}</b> <small>корма</small></div>
      <div class="food-help">Каждый верный ответ — 1 🦐, пример в столбик — 2 🦐. Нажимай на рыбку, чтобы покормить!
        ${hasPet('axolotl') ? '<br>🦎 Аксолотль помогает: рыбы растут вдвое быстрее!' : ''}</div>
    </div>
    <div class="pond">${slots}</div>
    <div class="farm-info">
      <span>🎣 Поймано рыб: <b>${F.harvested}</b></span>
      ${nextSp ? `<span>Новая рыба ${nextSp.icon} откроется после ${nextSp.unlock} улова</span>` : '<span>Открыты все виды рыб! 🐳</span>'}
    </div>
    ${F.food === 0 && F.pond.some(Boolean) ? '<button class="btn big primary wide" data-action="map">Добыть корм в Приключении →</button>' : ''}
  </div>`);
}

function farmEggModal(i) {
  const F = P.farm;
  modal(`<h2>Какую рыбку запустим?</h2>
    <div class="species-list">
      ${FARM_SPECIES.map(sp => {
        const open = F.harvested >= sp.unlock;
        return `<button class="species ${open ? '' : 'locked'}" data-action="${open ? 'plantFish' : 'lockedSpecies'}" data-i="${i}" data-sp="${sp.id}">
          <span class="sp-icon">${open ? sp.icon : '🔒'}</span>
          <span class="sp-text"><b>${sp.name}</b><small>${open ? `корм: ${sp.need} 🦐 · улов: ${sp.reward} 🐟` : `после ${sp.unlock} улова`}</small></span>
          <span class="tag price ${P.fish >= sp.price ? '' : 'poor'}">🐟 ${sp.price}</span>
        </button>`;
      }).join('')}
    </div>
    <button class="btn wide ghost" data-action="closeModal">Закрыть</button>`);
}

function feedFish(i) {
  const F = P.farm;
  const f = F.pond[i];
  const sp = findSpecies(f.sp);
  if (F.food <= 0) { toast('🦐 Корм закончился! Реши примеры — и он появится.'); Sound.wrong(); return; }
  const mult = hasPet('axolotl') ? 2 : 1;
  const needFood = Math.ceil((sp.need - f.fed) / mult);
  // За одно нажатие — до 5 порций, чтобы было видно, как рыбка растёт.
  const give = Math.min(F.food, needFood, 5);
  F.food -= give;
  f.fed = Math.min(sp.need, f.fed + give * mult);
  Sound.munch();
  save();
  screenFarm();
  const slot = document.getElementById('slot' + i);
  if (slot) {
    const pop = document.createElement('span');
    pop.className = 'heart-pop';
    pop.textContent = '🦐';
    slot.appendChild(pop);
    if (f.fed >= sp.need) { Sound.coin(); toast(`${sp.icon} ${sp.name} выросла! Лови её!`); }
  }
}

function harvestFish(i) {
  const F = P.farm;
  const sp = findSpecies(F.pond[i].sp);
  F.pond[i] = null;
  F.harvested++;
  P.fish += sp.reward;
  const newSp = FARM_SPECIES.find(x => x.unlock === F.harvested);
  checkAchievements();
  save();
  Sound.splash();
  Sound.win();
  confetti([sp.icon, '🐟', '💦', '⭐']);
  screenFarm();
  toast(`🎣 Улов: ${sp.icon} ${sp.name}! +${sp.reward} 🐟`);
  if (newSp) toast(`✨ Новая рыба на ферме: ${newSp.icon} ${newSp.name}!`);
}

Object.assign(actions, {
  farm() { S = null; screenFarm(); },
  farmEgg(el) { farmEggModal(Number(el.dataset.i)); },
  plantFish(el) {
    const sp = findSpecies(el.dataset.sp);
    if (P.fish < sp.price) { toast(`Не хватает ${sp.price - P.fish} 🐟`); Sound.wrong(); return; }
    P.fish -= sp.price;
    P.farm.pond[Number(el.dataset.i)] = { sp: sp.id, fed: 0 };
    Sound.splash();
    save();
    screenFarm();
    toast(`🫧 Икринка ${sp.icon} в пруду! Покорми её.`);
  },
  lockedSpecies() { toast('🔒 Поймай больше рыб, чтобы открыть этот вид!'); },
  feed(el) { feedFish(Number(el.dataset.i)); },
  harvest(el) { harvestFish(Number(el.dataset.i)); },
  buySlot() {
    const F = P.farm;
    const price = POND_SLOT_PRICES[F.size + 1];
    if (P.fish < price) { toast(`Не хватает ${price - P.fish} 🐟 на новое место в пруду`); Sound.wrong(); return; }
    P.fish -= price;
    F.size++;
    F.pond.push(null);
    Sound.splash();
    save();
    screenFarm();
    toast('🌊 Пруд стал больше!');
  },
});
