// Рисуем котика (SVG) нужной породы с нарядами поверх (эмодзи).
'use strict';

let catUid = 0;

function findItem(slot, id) {
  return SHOP[slot].items.find(i => i.id === id) || null;
}

function findBreed(id) {
  return BREEDS.find(b => b.id === id) || BREEDS[0];
}

// Отражаем путь левого уха в правое: x → 200 − x (в путях только пары x y).
function mirrorPath(d) {
  let i = 0;
  return d.replace(/-?\d+(\.\d+)?/g, n => (i++ % 2 === 0 ? String(200 - Number(n)) : n));
}

const EARS = {
  normal: { outer: 'M55 70 L50 16 L96 44 Z', inner: 'M62 57 L60 31 L83 46 Z' },
  big:    { outer: 'M50 76 L34 4 L98 44 Z',  inner: 'M57 62 L45 22 L84 46 Z' },
  small:  { outer: 'M58 62 L58 30 L90 44 Z', inner: 'M64 54 L64 39 L82 46 Z' },
  tuft:   { outer: 'M54 70 L46 8 L96 44 Z',  inner: 'M61 57 L57 27 L83 46 Z', tuft: 'M46 8 L40 -4 M46 8 L48 -6 M46 8 L54 -2' },
  fold:   { outer: 'M50 60 Q46 32 74 34 Q90 38 88 50 Q72 42 50 60 Z', inner: '' },
};

// Ошейник или шарф по изгибу шеи, подвеска — эмодзи под ошейником.
function neckSVG(it, hrx, hry) {
  if (!it) return '';
  const dx = (hrx * 0.66).toFixed(1);
  const y0 = (86 + hry * 0.75).toFixed(1);
  const cy = 86 + hry + 18;
  const arc = `M${100 - dx} ${y0} Q100 ${cy} ${100 + +dx} ${y0}`;
  if (it.scarf) {
    const c = it.scarf;
    return `<g class="scarf">
      <path d="M108 136 L130 138 Q131 160 127 180 L106 178 Q110 158 108 136 Z" fill="${c}" stroke="#9e1f2b" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M109 150 L129 152 M108 164 L128 166" stroke="#fff" stroke-width="5" opacity=".85"/>
      <path d="M108 180 L107 186 M113 180 L112 187 M118 181 L118 187 M123 181 L123 187" stroke="${c}" stroke-width="3" stroke-linecap="round"/>
      <path d="${arc}" stroke="#9e1f2b" stroke-width="19" fill="none" stroke-linecap="round"/>
      <path d="${arc}" stroke="${c}" stroke-width="15" fill="none" stroke-linecap="round"/>
      <path d="${arc}" stroke="#fff" stroke-width="15" fill="none" stroke-dasharray="5 11" opacity=".75"/>
    </g>`;
  }
  const p = it.pos;
  return `<path d="${arc}" stroke="rgba(0,0,0,.25)" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="${arc}" stroke="${it.collar}" stroke-width="6" fill="none" stroke-linecap="round"/>
    ${emojiSVG(it.emoji, { y: p.y + (hry - 48), s: p.s })}`;
}

function emojiSVG(emoji, { x = 100, y, s, r = 0 }) {
  return `<text x="${x}" y="${y}" font-size="${s}" text-anchor="middle" dominant-baseline="central"${r ? ` transform="rotate(${r} ${x} ${y})"` : ''}>${emoji}</text>`;
}

function catSVG(furId, mood = 'normal', breedId = 'home', acc = {}) {
  const fur = findItem('fur', furId) || SHOP.fur.items[0];
  const br = findBreed(breedId);
  const id = ++catUid;
  const fill = fur.rainbow ? `url(#rb${id})` : fur.color;
  const s = fur.stroke;
  const iris = br.eye || fur.eye || null;
  const lineEye = fur.eye || '#2b2b3a';
  const pointC = '#6b4a3a';
  const pat = br.pattern;
  const hrx = br.round ? 62 : 57;
  const hry = br.round ? 50 : 48;
  const ears = EARS[br.ears] || EARS.normal;
  const earFill = pat === 'points' ? pointC : fill;

  const defs = `<defs>
    ${fur.rainbow ? `<linearGradient id="rb${id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#ff9a9e"/><stop offset=".25" stop-color="#ffd36e"/>
        <stop offset=".5" stop-color="#a6f0c6"/><stop offset=".75" stop-color="#9fd3ff"/>
        <stop offset="1" stop-color="#c9b3ff"/></linearGradient>` : ''}
    <clipPath id="hc${id}"><ellipse cx="100" cy="86" rx="${hrx}" ry="${hry}"/></clipPath>
    <clipPath id="bc${id}"><ellipse cx="100" cy="155" rx="52" ry="40"/></clipPath>
  </defs>`;

  // Узоры на теле и голове (обрезаются по контуру).
  let bodyPat = '';
  let headPat = '';
  if (pat === 'stripes') {
    bodyPat = `<g stroke="${s}" stroke-width="6" stroke-linecap="round" fill="none" opacity=".55">
      <path d="M58 135 Q70 145 62 158"/><path d="M142 135 Q130 145 138 158"/><path d="M56 160 Q66 168 60 180"/><path d="M144 160 Q134 168 140 180"/></g>`;
    headPat = `<g stroke="${s}" stroke-width="5" stroke-linecap="round" fill="none" opacity=".6">
      <path d="M86 40 Q90 50 88 60"/><path d="M100 38 L100 58"/><path d="M114 40 Q110 50 112 60"/>
      <path d="M44 82 L58 85"/><path d="M45 92 L58 93"/><path d="M156 82 L142 85"/><path d="M155 92 L142 93"/></g>`;
  } else if (pat === 'spots') {
    const spot = (x, y, r) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.8}" fill="#7a4a22" opacity=".55"/>`;
    bodyPat = spot(64, 140, 7) + spot(80, 128, 5) + spot(136, 140, 7) + spot(124, 128, 5) + spot(58, 162, 6) + spot(142, 162, 6) + spot(70, 176, 5) + spot(130, 176, 5);
    headPat = spot(82, 48, 5) + spot(100, 44, 6) + spot(118, 48, 5) + spot(54, 74, 5) + spot(146, 74, 5) + spot(60, 60, 4) + spot(140, 60, 4);
  } else if (pat === 'points') {
    headPat = `<ellipse cx="100" cy="104" rx="30" ry="24" fill="${pointC}" opacity=".7"/>`;
  } else if (pat === 'calico') {
    bodyPat = `<ellipse cx="68" cy="146" rx="24" ry="18" fill="#3d3a4a"/><ellipse cx="134" cy="162" rx="22" ry="16" fill="#f08a24"/>`;
    headPat = `<ellipse cx="66" cy="58" rx="28" ry="22" fill="#f08a24"/><ellipse cx="138" cy="62" rx="24" ry="20" fill="#3d3a4a"/>`;
  } else if (pat === 'wrinkles') {
    headPat = `<g stroke="${s}" stroke-width="2.5" stroke-linecap="round" fill="none" opacity=".6">
      <path d="M82 50 Q100 43 118 50"/><path d="M86 58 Q100 52 114 58"/><path d="M60 118 Q66 124 74 124"/><path d="M140 118 Q134 124 126 124"/></g>`;
  } else if (pat === 'stars') {
    const st = (x, y, z) => `<text x="${x}" y="${y}" font-size="${z}" fill="#fff" text-anchor="middle">✦</text>`;
    bodyPat = st(66, 145, 12) + st(136, 150, 10) + st(80, 175, 8) + st(124, 176, 12);
    headPat = st(70, 58, 10) + st(132, 56, 12) + st(100, 48, 8);
  }

  // Пушистый воротник — кружки вокруг головы, голова рисуется поверх.
  let ruff = '';
  if (br.fluffy) {
    for (let k = 0; k <= 14; k++) {
      const ang = -0.35 + (Math.PI + 0.7) * k / 14;
      const x = 100 + Math.cos(ang) * (hrx + 2);
      const y = 92 + Math.sin(ang) * (hry + 2);
      ruff += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="13" fill="${fill}" stroke="${s}" stroke-width="3"/>`;
    }
  }

  let eyes;
  let mouth = '<path d="M100 104 Q100 113 91 112 M100 104 Q100 113 109 112" stroke="#5a3a3a" stroke-width="3" fill="none" stroke-linecap="round"/>';
  if (mood === 'happy') {
    eyes = `<path d="M67 86 Q78 70 89 86" stroke="${lineEye}" stroke-width="6" fill="none" stroke-linecap="round"/>
            <path d="M111 86 Q122 70 133 86" stroke="${lineEye}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    mouth = '<path d="M90 106 Q100 120 110 106 Z" fill="#c2455f" stroke="#5a3a3a" stroke-width="2.5" stroke-linejoin="round"/>';
  } else if (mood === 'sad') {
    const c = iris || '#2b2b3a';
    eyes = `<ellipse cx="78" cy="84" rx="8" ry="10" fill="${c}"/><ellipse cx="122" cy="84" rx="8" ry="10" fill="${c}"/>
            ${iris ? '<ellipse cx="78" cy="85" rx="2.5" ry="7" fill="#1a1a22"/><ellipse cx="122" cy="85" rx="2.5" ry="7" fill="#1a1a22"/>' : ''}
            <circle cx="80" cy="80" r="3" fill="#fff"/><circle cx="124" cy="80" r="3" fill="#fff"/>
            <path d="M66 70 L88 66 M134 70 L112 66" stroke="${s}" stroke-width="4" stroke-linecap="round"/>
            <path d="M130 94 Q127 102 130 106 Q134 102 130 94 Z" fill="#7cc8ff"/>`;
    mouth = '<path d="M92 114 Q100 106 108 114" stroke="#5a3a3a" stroke-width="3" fill="none" stroke-linecap="round"/>';
  } else {
    const c = iris || '#2b2b3a';
    eyes = `<ellipse cx="78" cy="82" rx="9" ry="12" fill="${c}"/><ellipse cx="122" cy="82" rx="9" ry="12" fill="${c}"/>
            ${iris ? '<ellipse cx="78" cy="83" rx="3" ry="8" fill="#1a1a22"/><ellipse cx="122" cy="83" rx="3" ry="8" fill="#1a1a22"/>' : ''}
            <circle cx="81" cy="77" r="3.6" fill="#fff"/><circle cx="125" cy="77" r="3.6" fill="#fff"/>`;
  }

  const tailPath = br.fluffy
    ? 'M136 170 Q204 168 190 102 Q184 82 162 96 Q178 140 134 148 Z'
    : 'M140 168 Q192 160 182 108 Q178 94 168 100 Q176 140 136 150 Z';
  const tailFill = pat === 'points' ? pointC : fill;
  const pawFill = pat === 'points' ? pointC : fill;
  const ear = d => `<path d="${d}" fill="${earFill}" stroke="${s}" stroke-width="4" stroke-linejoin="round"/>`;

  return `<svg class="cat-svg" viewBox="0 -8 200 208" aria-hidden="true">${defs}
    <path class="cat-tail" d="${tailPath}" fill="${tailFill}" stroke="${s}" stroke-width="4" stroke-linejoin="round"/>
    <ellipse cx="100" cy="155" rx="52" ry="40" fill="${fill}" stroke="${s}" stroke-width="4"/>
    <g clip-path="url(#bc${id})">${bodyPat}</g>
    <ellipse cx="100" cy="163" rx="27" ry="23" fill="#fff" opacity=".5"/>
    <ellipse cx="78" cy="190" rx="16" ry="9" fill="${pawFill}" stroke="${s}" stroke-width="4"/>
    <ellipse cx="122" cy="190" rx="16" ry="9" fill="${pawFill}" stroke="${s}" stroke-width="4"/>
    ${ear(ears.outer)}${ear(mirrorPath(ears.outer))}
    ${ears.inner ? `<path d="${ears.inner}" fill="#ffb3c7"/><path d="${mirrorPath(ears.inner)}" fill="#ffb3c7"/>` : ''}
    ${ears.tuft ? `<path d="${ears.tuft} ${mirrorPath(ears.tuft)}" stroke="${s}" stroke-width="3" stroke-linecap="round"/>` : ''}
    ${ruff}
    <ellipse cx="100" cy="86" rx="${hrx}" ry="${hry}" fill="${fill}" stroke="${s}" stroke-width="4"/>
    <g clip-path="url(#hc${id})">${headPat}</g>
    ${eyes}
    <circle cx="66" cy="102" r="8" fill="#ff8fab" opacity=".55"/><circle cx="134" cy="102" r="8" fill="#ff8fab" opacity=".55"/>
    <path d="M93 96 L107 96 L100 104 Z" fill="#ff7b9c" stroke-linejoin="round"/>
    ${mouth}
    <g stroke="${s}" stroke-width="2.5" stroke-linecap="round" opacity=".8">
      <path d="M60 98 L28 92"/><path d="M60 105 L28 108"/><path d="M140 98 L172 92"/><path d="M140 105 L172 108"/>
    </g>
    ${neckSVG(findItem('neck', acc.neck), hrx, hry)}
    ${acc.glasses ? emojiSVG(findItem('glasses', acc.glasses).emoji, findItem('glasses', acc.glasses).pos) : ''}
    ${hatSVG(findItem('hat', acc.hat), hry)}
  </svg>`;
}

// Шапка садится на макушку: у круглоголовых пород макушка чуть выше.
function hatSVG(it, hry) {
  if (!it) return '';
  return emojiSVG(it.emoji, { ...it.pos, y: it.pos.y - (hry - 48) });
}

// cat: {fur, breed, hat, glasses, neck, bg}; withBg — рисовать фон.
function catHTML(cat, size, mood = 'normal', withBg = true) {
  const bg = withBg ? (findItem('bg', cat.bg) || SHOP.bg.items[0]).css : 'transparent';
  return `<div class="cat ${withBg ? 'with-bg' : ''}" style="width:${size}px;height:${size}px;background:${bg}">
    ${catSVG(cat.fur, mood, cat.breed, cat)}
  </div>`;
}

// Питомец-компаньон рядом с котиком.
function petHTML(petId, size) {
  const pet = PETS.find(p => p.id === petId);
  return pet ? `<span class="pet" style="font-size:${size}px" title="${pet.name}">${pet.icon}</span>` : '';
}
