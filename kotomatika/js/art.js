// Нарисованные вещи для котика и фоны (SVG). Подключается до data.js.
// Координаты вещей — в системе котика: голова в центре (100, 86), глаза на y≈82, шея на y≈135.
'use strict';

let artUid = 0;

// Рисуем левую половину и отражаем её вправо.
const mirrorG = inner => `${inner}<g transform="matrix(-1 0 0 1 200 0)">${inner}</g>`;

// Точка на дуге ошейника (квадратичная кривая), t от 0 до 1.
function arcPoint(c, t) {
  const u = 1 - t;
  return [u * u * c.x0 + 2 * u * t * 100 + t * t * c.x1, u * u * c.y0 + 2 * u * t * c.cy + t * t * c.y0];
}

function starPoints(cx, cy, R, r, n = 5) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + i * Math.PI / n;
    const rad = i % 2 ? r : R;
    pts.push(`${(cx + Math.cos(a) * rad).toFixed(1)},${(cy + Math.sin(a) * rad).toFixed(1)}`);
  }
  return pts.join(' ');
}

function flower(x, y, color, r = 5) {
  let h = '';
  for (let k = 0; k < 5; k++) {
    const a = k * Math.PI * 2 / 5;
    h += `<circle cx="${(x + Math.cos(a) * r).toFixed(1)}" cy="${(y + Math.sin(a) * r).toFixed(1)}" r="${r * 0.8}" fill="${color}"/>`;
  }
  return h + `<circle cx="${x}" cy="${y}" r="${r * 0.6}" fill="#ffd84a"/>`;
}

function heartPath(cx, cy, k = 1) {
  return `M${cx} ${cy + 10 * k} C${cx - 18 * k} ${cy - 2 * k} ${cx - 12 * k} ${cy - 16 * k} ${cx} ${cy - 6 * k} C${cx + 12 * k} ${cy - 16 * k} ${cx + 18 * k} ${cy - 2 * k} ${cx} ${cy + 10 * k} Z`;
}

function rainbowGrad(id, vertical = false) {
  const cols = ['#ff6b6b', '#ffb020', '#ffe14a', '#5bd96b', '#4aa3ff', '#a78bfa'];
  return `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}">${cols.map((c, i) => `<stop offset="${i / (cols.length - 1)}" stop-color="${c}"/>`).join('')}</linearGradient>`;
}

// ctx: { top — верх головы, arc — дуга шеи {x0, x1, y0, cy, d} }
const ART = {
  // ---------- Шапки ----------
  santa: ({ top: t }) => `
    <path d="M54 ${t + 10} Q66 ${t - 26} 118 ${t - 30} Q152 ${t - 30} 160 ${t + 2} Q144 ${t - 12} 130 ${t - 8} Q146 ${t + 2} 146 ${t + 10} Z" fill="#e23d4b" stroke="#a51f2c" stroke-width="3" stroke-linejoin="round"/>
    <rect x="50" y="${t + 3}" width="100" height="17" rx="8.5" fill="#fff" stroke="#d9d9d9" stroke-width="2"/>
    <circle cx="160" cy="${t + 4}" r="10" fill="#fff" stroke="#d9d9d9" stroke-width="2"/>`,
  pirate: ({ top: t }) => `
    <path d="M40 ${t + 14} Q100 ${t - 44} 160 ${t + 14} Q100 ${t - 4} 40 ${t + 14} Z" fill="#2b2b3a" stroke="#ffd84a" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="100" cy="${t - 10}" r="7.5" fill="#fff"/><circle cx="97" cy="${t - 11}" r="1.8" fill="#2b2b3a"/><circle cx="103" cy="${t - 11}" r="1.8" fill="#2b2b3a"/>
    <path d="M90 ${t - 2} L110 ${t + 6} M110 ${t - 2} L90 ${t + 6}" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
  devil: ({ top: t }) => mirrorG(`<path d="M72 ${t + 14} Q56 ${t - 4} 66 ${t - 20} Q72 ${t - 2} 88 ${t + 8} Z" fill="#e23d4b" stroke="#8f1520" stroke-width="2.5" stroke-linejoin="round"/>`),
  halo: ({ top: t }) => `
    <ellipse cx="100" cy="${t - 12}" rx="32" ry="8" fill="none" stroke="#fff3b0" stroke-width="12" opacity=".5"/>
    <ellipse cx="100" cy="${t - 12}" rx="32" ry="8" fill="none" stroke="#ffd84a" stroke-width="5"/>`,
  wizard: ({ top: t }) => `
    <path d="M66 ${t + 8} Q94 ${t - 18} 112 ${t - 44} Q108 ${t - 12} 134 ${t + 8} Z" fill="#5b33b8" stroke="#3a1f7a" stroke-width="3" stroke-linejoin="round"/>
    <path d="M70 ${t + 2} Q100 ${t - 8} 130 ${t + 2}" stroke="#ffd84a" stroke-width="6" fill="none"/>
    <ellipse cx="100" cy="${t + 9}" rx="52" ry="10" fill="#4a2a9a" stroke="#3a1f7a" stroke-width="3"/>
    <polygon points="${starPoints(98, t - 14, 7, 3)}" fill="#ffd84a"/><polygon points="${starPoints(110, t - 30, 4.5, 2)}" fill="#ffd84a"/>
    <polygon points="${starPoints(84, t - 2, 4, 1.8)}" fill="#fff3b0"/>`,
  flowerCrown: ({ top: t }) => {
    const cols = ['#ff7eb6', '#ffffff', '#ffb020', '#a78bfa', '#ff7eb6', '#ffffff', '#5ab0ff'];
    let h = '';
    cols.forEach((c, k) => {
      const a = (200 + k * (140 / 6)) * Math.PI / 180;
      const x = 100 + Math.cos(a) * 50, y = t + 22 + Math.sin(a) * 26;
      h += `<ellipse cx="${(x + 6).toFixed(1)}" cy="${(y + 3).toFixed(1)}" rx="6" ry="3" fill="#5bbf8a"/>`;
      h += flower(+x.toFixed(1), +y.toFixed(1), c, 5.5);
    });
    return h;
  },
  unicorn: ({ top: t }) => {
    const id = 'uh' + (++artUid);
    return `<defs><linearGradient id="${id}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffc8ec"/><stop offset=".5" stop-color="#c9b3ff"/><stop offset="1" stop-color="#fff3b0"/></linearGradient></defs>
      <path d="M89 ${t + 10} L100 ${t - 38} L111 ${t + 10} Z" fill="url(#${id})" stroke="#c78fd6" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M91 ${t + 1} L108 ${t - 5} M93 ${t - 10} L106 ${t - 15} M96 ${t - 21} L104 ${t - 25}" stroke="#c78fd6" stroke-width="2.2" stroke-linecap="round"/>
      ${flower(82, t + 12, '#ff9ad5', 4.5)}${flower(118, t + 12, '#a6f0c6', 4.5)}`;
  },
  diamondHelmet: ({ top: t }) => {
    // Пиксельный шлем в стиле Minecraft: 12 клеток по 8 пикселей.
    const C = ['#4de8e0', '#2bc4bd', '#b7fffb'];
    let h = '';
    const y0 = t - 14;
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 12; c++) {
        if (r >= 4 && c > 1 && c < 10) continue;
        const shade = (r * 7 + c * 3) % 5 === 0 ? 1 : (r * 3 + c * 5) % 7 === 0 ? 2 : 0;
        h += `<rect x="${52 + c * 8}" y="${y0 + r * 8}" width="8" height="8" fill="${C[shade]}"/>`;
      }
    }
    return `<g stroke="#127a75" stroke-width=".6">${h}</g>
      <path d="M52 ${y0} H148 V${y0 + 56} H132 V${y0 + 32} H68 V${y0 + 56} H52 Z" fill="none" stroke="#0d5d59" stroke-width="2.5"/>`;
  },
  royalCrown: ({ top: t }) => {
    const id = 'rc' + (++artUid);
    return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3a0"/><stop offset=".5" stop-color="#ffcf2e"/><stop offset="1" stop-color="#e09a00"/></linearGradient></defs>
      <path d="M60 ${t + 12} L56 ${t - 24} L78 ${t - 4} L100 ${t - 34} L122 ${t - 4} L144 ${t - 24} L140 ${t + 12} Z" fill="url(#${id})" stroke="#a86b00" stroke-width="3" stroke-linejoin="round"/>
      <rect x="58" y="${t + 2}" width="84" height="11" rx="3" fill="#e09a00" stroke="#a86b00" stroke-width="2"/>
      <circle cx="56" cy="${t - 26}" r="4.5" fill="#fff"/><circle cx="100" cy="${t - 36}" r="5" fill="#fff"/><circle cx="144" cy="${t - 26}" r="4.5" fill="#fff"/>
      <polygon points="100,${t - 18} 107,${t - 9} 100,${t} 93,${t - 9}" fill="#e23d4b" stroke="#8f1520" stroke-width="1.5"/>
      <circle cx="74" cy="${t + 7.5}" r="3.5" fill="#4aa3ff"/><circle cx="100" cy="${t + 7.5}" r="3.5" fill="#5bd96b"/><circle cx="126" cy="${t + 7.5}" r="3.5" fill="#4aa3ff"/>
      <polygon points="${starPoints(128, t - 14, 5, 1.6, 4)}" fill="#fff"/>`;
  },

  // ---------- Очки (глаза на 78/122, y 82) ----------
  heartGlasses: () => `<path d="M88 79 Q100 73 112 79" stroke="#c2185b" stroke-width="3" fill="none"/>
    <path d="M62 78 L46 74 M138 78 L154 74" stroke="#c2185b" stroke-width="3" stroke-linecap="round"/>
    <path d="${heartPath(78, 82, 1.1)}" fill="#ff5fa2" fill-opacity=".85" stroke="#c2185b" stroke-width="2.5"/>
    <path d="${heartPath(122, 82, 1.1)}" fill="#ff5fa2" fill-opacity=".85" stroke="#c2185b" stroke-width="2.5"/>`,
  starGlasses: () => `<path d="M90 80 Q100 74 110 80" stroke="#d69a00" stroke-width="3" fill="none"/>
    <path d="M62 78 L46 74 M138 78 L154 74" stroke="#d69a00" stroke-width="3" stroke-linecap="round"/>
    <polygon points="${starPoints(78, 83, 17, 8)}" fill="#ffd84a" fill-opacity=".9" stroke="#d69a00" stroke-width="2.5" stroke-linejoin="round"/>
    <polygon points="${starPoints(122, 83, 17, 8)}" fill="#ffd84a" fill-opacity=".9" stroke="#d69a00" stroke-width="2.5" stroke-linejoin="round"/>`,
  glasses3d: () => `<rect x="54" y="71" width="92" height="22" rx="4" fill="#fff" stroke="#333" stroke-width="2.5"/>
    <rect x="59" y="75" width="35" height="14" rx="2" fill="#ff3d55" fill-opacity=".8"/>
    <rect x="106" y="75" width="35" height="14" rx="2" fill="#2fd6ff" fill-opacity=".8"/>
    <path d="M54 78 L44 74 M146 78 L156 74" stroke="#333" stroke-width="3" stroke-linecap="round"/>`,
  monocle: () => `<circle cx="122" cy="82" r="15" fill="#d8f0ff" fill-opacity=".35" stroke="#d4a017" stroke-width="3.5"/>
    <path d="M135 90 Q152 112 140 132" stroke="#d4a017" stroke-width="2.5" fill="none" stroke-dasharray="4 2"/>`,
  pixelShades: () => `<g fill="#111">
    <rect x="50" y="72" width="100" height="7"/><rect x="56" y="79" width="36" height="9"/><rect x="108" y="79" width="36" height="9"/>
    <rect x="62" y="88" width="26" height="5"/><rect x="114" y="88" width="26" height="5"/><rect x="92" y="79" width="16" height="4"/></g>
    <g fill="#fff"><rect x="60" y="80" width="6" height="3"/><rect x="66" y="83" width="5" height="3"/><rect x="112" y="80" width="6" height="3"/><rect x="118" y="83" width="5" height="3"/></g>`,
  visor: () => {
    const id = 'vs' + (++artUid);
    return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2fd6ff"/><stop offset=".5" stop-color="#a78bfa"/><stop offset="1" stop-color="#ff5fa2"/></linearGradient></defs>
      <rect x="48" y="71" width="104" height="22" rx="11" fill="url(#${id})" fill-opacity=".9" stroke="#2b2540" stroke-width="3"/>
      <path d="M60 77 H120" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>`;
  },

  // ---------- Шея ----------
  bowtie: ({ arc }) => {
    const [x, y] = arcPoint(arc, 0.5);
    return `<path d="M${x} ${y} L${x - 20} ${y - 11} L${x - 20} ${y + 11} Z M${x} ${y} L${x + 20} ${y - 11} L${x + 20} ${y + 11} Z" fill="#e23d4b" stroke="#8f1520" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="${x}" cy="${y}" r="5.5" fill="#c62839" stroke="#8f1520" stroke-width="2"/>`;
  },
  pearls: ({ arc }) => {
    let h = '';
    for (let i = 0; i <= 12; i++) {
      const [x, y] = arcPoint(arc, i / 12);
      h += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.6" fill="#fffaf0" stroke="#cfc6b6" stroke-width="1.5"/><circle cx="${(x - 1.3).toFixed(1)}" cy="${(y - 1.5).toFixed(1)}" r="1.3" fill="#fff"/>`;
    }
    return h;
  },
  lei: ({ arc }) => {
    const cols = ['#ff7eb6', '#ffb020', '#ffffff', '#ff5d6c', '#a78bfa'];
    let h = '';
    for (let i = 0; i <= 9; i++) {
      const [x, y] = arcPoint(arc, i / 9);
      h += flower(+x.toFixed(1), +y.toFixed(1), cols[i % cols.length], 4.6);
    }
    return h;
  },
  goldChain: ({ arc }) => {
    const [x, y] = arcPoint(arc, 0.5);
    return `<path d="${arc.d}" stroke="#a86b00" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="${arc.d}" stroke="#ffd84a" stroke-width="5" fill="none" stroke-dasharray="7 3"/>
      <path d="${heartPath(x, y + 9, 0.75)}" fill="#ffcf2e" stroke="#a86b00" stroke-width="2"/>`;
  },
  diamonds: ({ arc }) => {
    let h = '';
    for (let i = 0; i <= 10; i++) {
      const [x, y] = arcPoint(arc, i / 10);
      h += `<polygon points="${x},${y - 5} ${x + 4},${y} ${x},${y + 5} ${x - 4},${y}" fill="#bff6ff" stroke="#3fb7d6" stroke-width="1.5"/>`;
    }
    const [x, y] = arcPoint(arc, 0.5);
    return `<path d="${arc.d}" stroke="#d9e6f2" stroke-width="2" fill="none"/>${h}
      <polygon points="${x - 10},${y + 6} ${x + 10},${y + 6} ${x + 14},${y + 11} ${x},${y + 28} ${x - 14},${y + 11}" fill="#7fe9ff" stroke="#1f8fb0" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M${x - 14} ${y + 11} H${x + 14} M${x - 5} ${y + 6} L${x} ${y + 28} L${x + 5} ${y + 6}" stroke="#1f8fb0" stroke-width="1.5" fill="none"/>`;
  },

  // ---------- Спина (рисуется позади котика) ----------
  cape: () => `<path d="M64 124 Q100 140 136 124 L170 196 Q100 208 30 196 Z" fill="#e23d4b" stroke="#a51f2c" stroke-width="3" stroke-linejoin="round"/>
    <path d="M64 124 L44 192 M136 124 L156 192" stroke="#ffd84a" stroke-width="3" opacity=".8"/>`,
  angelWings: () => mirrorG(`<g fill="#fff" stroke="#c3d2e6" stroke-width="3">
    <ellipse cx="36" cy="136" rx="26" ry="10" transform="rotate(-15 36 136)"/>
    <ellipse cx="30" cy="114" rx="32" ry="12" transform="rotate(-35 30 114)"/>
    <ellipse cx="34" cy="92" rx="38" ry="14" transform="rotate(-55 34 92)"/></g>`),
  fairyWings: () => mirrorG(`<g fill="#ffc8f0" fill-opacity=".7" stroke="#e07ad0" stroke-width="2.5">
    <ellipse cx="32" cy="90" rx="36" ry="20" transform="rotate(-50 32 90)"/>
    <ellipse cx="34" cy="146" rx="24" ry="13" transform="rotate(20 34 146)"/></g>
    <path d="M58 128 Q40 104 20 66 M60 138 Q44 146 22 152" stroke="#fff" stroke-width="2" fill="none" opacity=".8"/>`),
  batWings: () => mirrorG(`<path d="M70 128 L16 62 Q24 84 6 94 Q26 100 14 120 Q34 118 28 140 Q46 134 62 146 Z" fill="#5b3a8a" stroke="#2e1a4f" stroke-width="3" stroke-linejoin="round"/>
    <path d="M68 130 L16 62 M66 136 L8 96 M64 142 L16 122" stroke="#2e1a4f" stroke-width="2" fill="none"/>`),
  dragonWings: () => mirrorG(`<path d="M72 126 L8 34 Q18 64 0 78 Q22 84 8 106 Q30 106 18 132 Q40 128 36 152 Q54 142 66 148 Z" fill="#3fb06a" stroke="#1f6b3c" stroke-width="3" stroke-linejoin="round"/>
    <path d="M70 128 L8 34 M68 134 L2 80 M66 140 L10 108 M64 146 L20 134" stroke="#1f6b3c" stroke-width="2" fill="none"/>
    <circle cx="8" cy="34" r="4" fill="#ffd84a"/>`),
  jetpack: () => mirrorG(`<rect x="32" y="110" width="22" height="54" rx="11" fill="#c5d0e0" stroke="#6b7a90" stroke-width="3"/>
    <rect x="32" y="124" width="22" height="6" fill="#ff5d6c"/>
    <path class="flame" d="M36 166 Q43 196 50 166 Q43 176 36 166 Z" fill="#ffb020" stroke="#ff5d1f" stroke-width="2"/>`),
  rainbowWings: () => {
    const id = 'rw' + (++artUid);
    return `<defs>${rainbowGrad(id, true)}</defs>` + mirrorG(`<g fill="url(#${id})" stroke="#fff" stroke-width="3">
    <ellipse cx="36" cy="136" rx="26" ry="10" transform="rotate(-15 36 136)"/>
    <ellipse cx="30" cy="114" rx="32" ry="12" transform="rotate(-35 30 114)"/>
    <ellipse cx="34" cy="92" rx="38" ry="14" transform="rotate(-55 34 92)"/></g>`);
  },

  // ---------- В лапке (правая лапа около 122, 186) ----------
  lollipop: () => `<path d="M124 186 L150 140" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M124 186 L150 140" stroke="#ddd" stroke-width="1.5"/>
    <circle cx="153" cy="132" r="16" fill="#ff7eb6" stroke="#d6337f" stroke-width="2.5"/>
    <path d="M153 132 m0 -9 a9 9 0 1 1 -9 9 a6 6 0 1 1 6 -6 a3 3 0 1 1 -3 3" stroke="#fff" stroke-width="3" fill="none"/>`,
  balloon: () => `<path d="M124 184 Q150 150 158 118 Q164 96 168 84" stroke="#888" stroke-width="1.6" fill="none"/>
    <ellipse cx="170" cy="58" rx="20" ry="24" fill="#ff5d6c" stroke="#c62839" stroke-width="2.5"/>
    <path d="M166 82 L174 82 L170 86 Z" fill="#c62839"/><ellipse cx="163" cy="48" rx="5" ry="8" fill="#fff" opacity=".6"/>`,
  rod: () => `<path d="M122 188 L176 40" stroke="#8b5a2b" stroke-width="5" stroke-linecap="round"/>
    <path d="M176 40 Q190 70 186 112" stroke="#888" stroke-width="1.4" fill="none"/>
    <circle cx="140" cy="140" r="5" fill="#666"/>
    <text x="186" y="122" font-size="20" text-anchor="middle" dominant-baseline="central" transform="rotate(80 186 122)">🐟</text>`,
  wand: () => `<path d="M124 186 L162 126" stroke="#3a2a5a" stroke-width="6" stroke-linecap="round"/>
    <path d="M124 186 L134 170" stroke="#fff" stroke-width="6" stroke-linecap="round"/>
    <polygon points="${starPoints(165, 120, 15, 6.5)}" fill="#ffd84a" stroke="#d69a00" stroke-width="2.5" stroke-linejoin="round"/>
    <polygon points="${starPoints(184, 104, 5, 2, 4)}" fill="#fff3b0"/><polygon points="${starPoints(150, 100, 4, 1.6, 4)}" fill="#fff3b0"/>`,
  sword: () => `<g transform="translate(126 188) rotate(28)" stroke="#0d3f3d" stroke-width="1.2">
    <rect x="-3" y="-16" width="6" height="16" fill="#6b4423"/>
    <rect x="-11" y="-21" width="22" height="6" fill="#1f8f8a"/>
    <rect x="-5" y="-66" width="10" height="46" fill="#4de8e0"/>
    <rect x="-5" y="-66" width="3.5" height="46" fill="#b7fffb" stroke="none"/>
    <polygon points="-5,-66 0,-75 5,-66" fill="#4de8e0"/></g>`,
};

// ---------- Фоны (SVG-картинки) ----------

function bgCss(svg) {
  const doc = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">${svg}</svg>`;
  return `url('data:image/svg+xml,${encodeURIComponent(doc)}') center / cover no-repeat`;
}

// Детерминированный «случайный» генератор, чтобы фон всегда выглядел одинаково.
function seeded(seed) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function starsSvg(n, seed, maxY = 200, color = '#fff') {
  const r = seeded(seed);
  let h = '';
  for (let i = 0; i < n; i++) h += `<circle cx="${(r() * 200).toFixed(1)}" cy="${(r() * maxY).toFixed(1)}" r="${(0.5 + r() * 1.4).toFixed(1)}" fill="${color}" opacity="${(0.5 + r() * 0.5).toFixed(2)}"/>`;
  return h;
}

const cloud = (x, y, k = 1, c = '#fff') => `<g fill="${c}"><circle cx="${x}" cy="${y}" r="${12 * k}"/><circle cx="${x + 14 * k}" cy="${y - 6 * k}" r="${14 * k}"/><circle cx="${x + 28 * k}" cy="${y}" r="${11 * k}"/><rect x="${x}" y="${y}" width="${28 * k}" height="${10 * k}"/></g>`;

const BG_ART = {
  // Пиксельная деревня в стиле Minecraft
  mine: () => {
    const r = seeded(7);
    let h = '<rect width="200" height="200" fill="#8fd3ff"/><rect x="150" y="18" width="26" height="26" fill="#ffe14a"/><rect x="154" y="22" width="18" height="18" fill="#fff3a0"/>';
    h += '<g fill="#fff"><rect x="20" y="30" width="40" height="10"/><rect x="30" y="22" width="20" height="8"/><rect x="90" y="46" width="36" height="9"/></g>';
    for (let x = 0; x < 200; x += 10) {
      h += `<rect x="${x}" y="130" width="10" height="10" fill="${r() < 0.3 ? '#4ea52f' : '#5dbb3b'}"/>`;
      h += `<rect x="${x}" y="140" width="10" height="4" fill="#5dbb3b"/>`;
      for (let y = 144; y < 200; y += 10) h += `<rect x="${x}" y="${y}" width="10" height="10" fill="${r() < 0.25 ? '#7a4e25' : r() < 0.1 ? '#9a9a9a' : '#8b5a2b'}"/>`;
    }
    h += '<rect x="22" y="86" width="12" height="44" fill="#6b4423"/>';
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) h += `<rect x="${4 + i * 12}" y="${54 + j * 12}" width="12" height="12" fill="${(i + j) % 3 ? '#3f9b2f' : '#4fb43a'}"/>`;
    h += '<rect x="132" y="96" width="44" height="34" fill="#c8a165"/><rect x="128" y="88" width="52" height="10" fill="#8b5a2b"/><rect x="148" y="110" width="12" height="20" fill="#6b4423"/><rect x="136" y="104" width="8" height="8" fill="#9fd3ff"/><rect x="164" y="104" width="8" height="8" fill="#9fd3ff"/>';
    return h;
  },
  sakura: () => {
    const r = seeded(3);
    let h = '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe9ff"/><stop offset="1" stop-color="#ffe4f1"/></linearGradient></defs><rect width="200" height="200" fill="url(#g)"/>';
    h += '<ellipse cx="100" cy="196" rx="150" ry="40" fill="#bfe8a8"/>';
    h += '<path d="M-10 40 Q50 50 90 30 Q120 18 150 26 M40 46 Q50 70 40 90 M90 30 Q100 50 120 60" stroke="#7a4e3a" stroke-width="6" fill="none" stroke-linecap="round"/>';
    for (let i = 0; i < 40; i++) {
      const x = r() * 160, y = 15 + r() * 70;
      h += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(4 + r() * 5).toFixed(1)}" fill="${r() < 0.5 ? '#ffb7d5' : '#ff9ac6'}" opacity=".9"/>`;
    }
    for (let i = 0; i < 18; i++) h += `<ellipse cx="${(r() * 200).toFixed(1)}" cy="${(90 + r() * 100).toFixed(1)}" rx="3" ry="1.8" fill="#ff9ac6" transform="rotate(${(r() * 180).toFixed(0)})" opacity=".8"/>`;
    return h;
  },
  reef: () => {
    const r = seeded(11);
    let h = '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fe0ff"/><stop offset="1" stop-color="#1767b8"/></linearGradient></defs><rect width="200" height="200" fill="url(#g)"/>';
    h += '<g fill="#fff" opacity=".12"><polygon points="40,0 70,0 20,200 0,200"/><polygon points="110,0 130,0 110,200 80,200"/><polygon points="170,0 190,0 200,120 200,200 180,200"/></g>';
    h += '<path d="M0 176 Q50 166 100 176 T200 172 V200 H0 Z" fill="#f2d79b"/>';
    h += '<path d="M20 180 Q10 150 24 130 Q34 110 22 92 M30 180 Q42 160 34 140" stroke="#2fae6a" stroke-width="6" fill="none" stroke-linecap="round"/>';
    h += '<path d="M170 180 Q182 150 172 124 Q164 104 176 86" stroke="#3bc47a" stroke-width="6" fill="none" stroke-linecap="round"/>';
    h += '<g fill="#ff7e8a"><circle cx="140" cy="176" r="9"/><circle cx="150" cy="168" r="7"/><circle cx="132" cy="168" r="6"/></g><g fill="#ffb020"><circle cx="60" cy="178" r="7"/><circle cx="68" cy="172" r="5"/></g>';
    for (let i = 0; i < 14; i++) h += `<circle cx="${(r() * 200).toFixed(1)}" cy="${(r() * 160).toFixed(1)}" r="${(2 + r() * 5).toFixed(1)}" fill="none" stroke="#fff" stroke-width="1.4" opacity=".7"/>`;
    return h;
  },
  rainbowSky: () => {
    let h = '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc8ff"/><stop offset="1" stop-color="#d9f1ff"/></linearGradient></defs><rect width="200" height="200" fill="url(#g)"/>';
    ['#ff6b6b', '#ffb020', '#ffe14a', '#5bd96b', '#4aa3ff', '#a78bfa'].forEach((c, i) => {
      h += `<circle cx="100" cy="200" r="${150 - i * 12}" fill="none" stroke="${c}" stroke-width="12"/>`;
    });
    h += cloud(-6, 186, 1.6) + cloud(150, 188, 1.6) + cloud(30, 40, 1) + cloud(130, 60, 0.8);
    return h;
  },
  obby: () => {
    // Парящие блоки-платформы, как в паркуре Roblox
    const block = (x, y, w, c, d) => `<rect x="${x}" y="${y}" width="${w}" height="12" fill="${c}"/><rect x="${x}" y="${y + 12}" width="${w}" height="6" fill="${d}"/>`;
    let h = '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5aa9ff"/><stop offset="1" stop-color="#bfe3ff"/></linearGradient></defs><rect width="200" height="200" fill="url(#g)"/>';
    h += cloud(10, 30, 0.9) + cloud(140, 20, 1.1);
    h += block(8, 70, 34, '#ff5d6c', '#c62839') + block(150, 60, 40, '#5bd96b', '#2f9a4b') + block(60, 40, 28, '#ffe14a', '#d69a00');
    h += block(158, 120, 34, '#a78bfa', '#7c5bd9') + block(4, 128, 30, '#ffb020', '#c98000');
    h += '<rect x="0" y="176" width="200" height="24" fill="#ff5d1f"/><path d="M0 176 Q20 168 40 176 T80 176 T120 176 T160 176 T200 176" fill="#ffb020"/>';
    h += '<g><rect x="30" y="160" width="140" height="14" fill="#9aa3ad"/><rect x="30" y="174" width="140" height="6" fill="#6f7884"/>';
    for (let i = 0; i < 7; i++) h += `<rect x="${30 + i * 20}" y="160" width="10" height="7" fill="#fff"/><rect x="${40 + i * 20}" y="167" width="10" height="7" fill="#fff"/>`;
    return h + '</g>';
  },
  aurora: () => {
    let h = '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#071433"/><stop offset="1" stop-color="#1c3b6b"/></linearGradient>';
    h += '<linearGradient id="a1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5bffb0" stop-opacity="0"/><stop offset=".6" stop-color="#5bffb0" stop-opacity=".7"/><stop offset="1" stop-color="#5bffb0" stop-opacity="0"/></linearGradient>';
    h += '<linearGradient id="a2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c77dff" stop-opacity="0"/><stop offset=".6" stop-color="#c77dff" stop-opacity=".6"/><stop offset="1" stop-color="#c77dff" stop-opacity="0"/></linearGradient></defs>';
    h += '<rect width="200" height="200" fill="url(#g)"/>' + starsSvg(50, 5, 120);
    h += '<path d="M-10 70 Q40 20 90 60 T200 40 L200 110 Q150 90 100 120 T-10 110 Z" fill="url(#a1)"/>';
    h += '<path d="M-10 40 Q60 10 110 40 T210 30 L210 80 Q150 60 100 80 T-10 80 Z" fill="url(#a2)"/>';
    h += '<path d="M0 160 Q60 130 120 158 T200 150 V200 H0 Z" fill="#e8f2ff"/>';
    for (const [x, s] of [[20, 1], [42, 0.8], [160, 1.1], [182, 0.8]]) h += `<polygon points="${x},${150 - 36 * s} ${x - 12 * s},${160} ${x + 12 * s},${160}" fill="#163a2e"/>`;
    return h;
  },
  planets: () => {
    let h = '<defs><radialGradient id="g" cx=".3" cy=".3"><stop offset="0" stop-color="#3b2a7a"/><stop offset="1" stop-color="#0b0a26"/></radialGradient>';
    h += '<radialGradient id="p1" cx=".35" cy=".35"><stop offset="0" stop-color="#ffd9a0"/><stop offset="1" stop-color="#e07a3a"/></radialGradient>';
    h += '<radialGradient id="p2" cx=".35" cy=".35"><stop offset="0" stop-color="#b3f0ff"/><stop offset="1" stop-color="#2f7fd0"/></radialGradient></defs>';
    h += '<rect width="200" height="200" fill="url(#g)"/>' + starsSvg(70, 9);
    h += '<circle cx="152" cy="48" r="22" fill="url(#p1)"/>';
    h += '<ellipse cx="152" cy="48" rx="40" ry="10" fill="none" stroke="#ffe0b0" stroke-width="5" transform="rotate(-18 152 48)" opacity=".85"/>';
    h += '<circle cx="34" cy="160" r="16" fill="url(#p2)"/><circle cx="30" cy="46" r="10" fill="#d9d9e8"/><circle cx="27" cy="43" r="2.5" fill="#b8b8cc"/><circle cx="33" cy="50" r="2" fill="#b8b8cc"/>';
    h += '<path d="M70 20 L110 40" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/><circle cx="110" cy="40" r="2.5" fill="#fff"/>';
    return h;
  },
  castle: () => {
    let h = '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb3d1"/><stop offset=".7" stop-color="#ffe0c2"/><stop offset="1" stop-color="#c9f0b0"/></linearGradient></defs><rect width="200" height="200" fill="url(#g)"/>';
    h += cloud(10, 40, 0.9) + cloud(150, 30, 0.8);
    const tower = (x, w, top) => `<rect x="${x}" y="${top}" width="${w}" height="${150 - top}" fill="#f4e6ff" stroke="#c9a8f0" stroke-width="2"/><polygon points="${x - 4},${top} ${x + w / 2},${top - 28} ${x + w + 4},${top}" fill="#a78bfa" stroke="#7c5bd9" stroke-width="2"/><path d="M${x + w / 2} ${top - 28} V${top - 40} L${x + w / 2 + 10} ${top - 36} L${x + w / 2} ${top - 32}" stroke="#7c5bd9" stroke-width="1.5" fill="#ff7eb6"/><rect x="${x + w / 2 - 3}" y="${top + 12}" width="6" height="10" rx="3" fill="#ffd84a"/>`;
    h += tower(30, 22, 80) + tower(148, 22, 80) + tower(86, 28, 50);
    h += '<rect x="44" y="100" width="112" height="50" fill="#f4e6ff" stroke="#c9a8f0" stroke-width="2"/><path d="M88 150 V128 Q100 114 112 128 V150 Z" fill="#7c5bd9"/>';
    h += '<path d="M0 150 Q100 140 200 150 V200 H0 Z" fill="#a6e38a"/>';
    return h;
  },
  palace: () => {
    let h = '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3c4"/><stop offset="1" stop-color="#e0a83a"/></linearGradient>';
    h += '<linearGradient id="c" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e0a83a"/><stop offset=".5" stop-color="#fff3a0"/><stop offset="1" stop-color="#c98a1a"/></linearGradient></defs>';
    h += '<rect width="200" height="200" fill="url(#g)"/>';
    for (const x of [8, 52, 136, 180]) h += `<rect x="${x}" y="30" width="14" height="140" fill="url(#c)"/><rect x="${x - 4}" y="24" width="22" height="8" fill="#c98a1a"/><rect x="${x - 4}" y="168" width="22" height="8" fill="#c98a1a"/>`;
    h += '<path d="M0 0 H200 V18 Q150 34 100 18 Q50 34 0 18 Z" fill="#c62839"/>';
    h += '<polygon points="70,200 130,200 112,150 88,150" fill="#c62839"/>';
    h += '<g fill="#fff">' + [[30, 60], [170, 80], [100, 30], [40, 140], [160, 140]].map(([x, y]) => `<polygon points="${starPoints(x, y, 5, 1.5, 4)}"/>`).join('') + '</g>';
    return h;
  },
};

const bgArt = name => bgCss(BG_ART[name]());
