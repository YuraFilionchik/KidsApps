// Рисуем котика (SVG) с нарядами поверх (эмодзи).
'use strict';

let catUid = 0;

function findItem(slot, id) {
  return SHOP[slot].items.find(i => i.id === id) || null;
}

function catSVG(furId, mood = 'normal') {
  const fur = findItem('fur', furId) || SHOP.fur.items[0];
  const gid = 'rb' + (++catUid);
  const fill = fur.rainbow ? `url(#${gid})` : fur.color;
  const s = fur.stroke;
  const eyeColor = fur.eye || '#2b2b3a';
  const defs = fur.rainbow
    ? `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#ff9a9e"/><stop offset=".25" stop-color="#ffd36e"/>
        <stop offset=".5" stop-color="#a6f0c6"/><stop offset=".75" stop-color="#9fd3ff"/>
        <stop offset="1" stop-color="#c9b3ff"/></linearGradient></defs>`
    : '';

  let eyes;
  let mouth = '<path d="M100 104 Q100 113 91 112 M100 104 Q100 113 109 112" stroke="#5a3a3a" stroke-width="3" fill="none" stroke-linecap="round"/>';
  if (mood === 'happy') {
    eyes = `<path d="M67 86 Q78 70 89 86" stroke="${eyeColor}" stroke-width="6" fill="none" stroke-linecap="round"/>
            <path d="M111 86 Q122 70 133 86" stroke="${eyeColor}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    mouth = '<path d="M90 106 Q100 120 110 106 Z" fill="#c2455f" stroke="#5a3a3a" stroke-width="2.5" stroke-linejoin="round"/>';
  } else if (mood === 'sad') {
    eyes = `<ellipse cx="78" cy="84" rx="8" ry="10" fill="${eyeColor}"/><ellipse cx="122" cy="84" rx="8" ry="10" fill="${eyeColor}"/>
            <circle cx="80" cy="80" r="3" fill="#fff"/><circle cx="124" cy="80" r="3" fill="#fff"/>
            <path d="M66 70 L88 66 M134 70 L112 66" stroke="${s}" stroke-width="4" stroke-linecap="round"/>
            <path d="M130 94 Q127 102 130 106 Q134 102 130 94 Z" fill="#7cc8ff"/>`;
    mouth = '<path d="M92 114 Q100 106 108 114" stroke="#5a3a3a" stroke-width="3" fill="none" stroke-linecap="round"/>';
  } else {
    eyes = `<ellipse cx="78" cy="82" rx="9" ry="12" fill="${eyeColor}"/><ellipse cx="122" cy="82" rx="9" ry="12" fill="${eyeColor}"/>
            <circle cx="81" cy="77" r="3.6" fill="#fff"/><circle cx="125" cy="77" r="3.6" fill="#fff"/>
            ${fur.eye ? '<ellipse cx="78" cy="83" rx="3" ry="8" fill="#1a1a22"/><ellipse cx="122" cy="83" rx="3" ry="8" fill="#1a1a22"/>' : ''}`;
  }

  return `<svg class="cat-svg" viewBox="0 0 200 200" aria-hidden="true">${defs}
    <path class="cat-tail" d="M140 168 Q192 160 182 108 Q178 94 168 100 Q176 140 136 150 Z" fill="${fill}" stroke="${s}" stroke-width="4" stroke-linejoin="round"/>
    <ellipse cx="100" cy="155" rx="52" ry="40" fill="${fill}" stroke="${s}" stroke-width="4"/>
    <ellipse cx="100" cy="163" rx="27" ry="23" fill="#fff" opacity=".5"/>
    <ellipse cx="78" cy="190" rx="16" ry="9" fill="${fill}" stroke="${s}" stroke-width="4"/>
    <ellipse cx="122" cy="190" rx="16" ry="9" fill="${fill}" stroke="${s}" stroke-width="4"/>
    <path d="M55 70 L50 16 L96 44 Z" fill="${fill}" stroke="${s}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M145 70 L150 16 L104 44 Z" fill="${fill}" stroke="${s}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M62 57 L60 31 L83 46 Z" fill="#ffb3c7"/><path d="M138 57 L140 31 L117 46 Z" fill="#ffb3c7"/>
    <ellipse cx="100" cy="86" rx="57" ry="48" fill="${fill}" stroke="${s}" stroke-width="4"/>
    ${eyes}
    <circle cx="66" cy="102" r="8" fill="#ff8fab" opacity=".55"/><circle cx="134" cy="102" r="8" fill="#ff8fab" opacity=".55"/>
    <path d="M93 96 L107 96 L100 104 Z" fill="#ff7b9c" stroke-linejoin="round"/>
    ${mouth}
    <g stroke="${s}" stroke-width="2.5" stroke-linecap="round" opacity=".8">
      <path d="M60 98 L28 92"/><path d="M60 105 L28 108"/><path d="M140 98 L172 92"/><path d="M140 105 L172 108"/>
    </g>
  </svg>`;
}

// cat: {fur, hat, glasses, neck, bg}; withBg — рисовать фон.
function catHTML(cat, size, mood = 'normal', withBg = true) {
  const bg = withBg ? (findItem('bg', cat.bg) || SHOP.bg.items[0]).css : 'transparent';
  const acc = (slot, cls, k) => {
    const it = cat[slot] && findItem(slot, cat[slot]);
    return it ? `<span class="acc ${cls}" style="font-size:${Math.round(size * k)}px">${it.emoji}</span>` : '';
  };
  return `<div class="cat ${withBg ? 'with-bg' : ''}" style="width:${size}px;height:${size}px;background:${bg}">
    ${catSVG(cat.fur, mood)}
    ${acc('neck', 'acc-neck', 0.2)}
    ${acc('glasses', 'acc-glasses', 0.34)}
    ${acc('hat', 'acc-hat', 0.33)}
  </div>`;
}
