const KINDS = ['dog', 'cat', 'fox'];
const FACES = ['sad', 'calm', 'joy'];

const PALETTE = {
  dog: { fur: '#D9B97C', dark: '#A07E4A', light: '#F3E6C8', paw: '#C9A86A' },
  cat: { fur: '#8C9476', dark: '#5F664E', light: '#DDD7C3', paw: '#7A8266' },
  fox: { fur: '#D27D3E', dark: '#5A3A22', light: '#F7EEDC', paw: '#5A3A22' },
};

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const r2 = (x) => Math.round(x * 100) / 100;

function mix(a, b, t) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

/** Sad when the gremlin is big (cloudy); being away never makes the companion sad by itself. */
export function faceFor(level, mood) {
  if (level >= 0.6) return mood === 'joy' ? 'calm' : 'sad';
  return mood === 'joy' ? 'joy' : 'calm';
}

function ears(kind, c, face) {
  if (kind === 'dog') {
    const a = face === 'joy' ? 32 : face === 'sad' ? 6 : 18;
    return `<g class="ears">
      <ellipse cx="58" cy="98" rx="15" ry="30" fill="${c.dark}" transform="rotate(${a} 58 80)"/>
      <ellipse cx="142" cy="98" rx="15" ry="30" fill="${c.dark}" transform="rotate(${-a} 142 80)"/></g>`;
  }
  const tip = kind === 'fox' ? c.dark : '#C9A0A0';
  const droop = face === 'sad' ? 8 : 0;
  return `<g class="ears">
    <polygon points="58,${80 + droop} 64,${26 + droop} 96,${58 + droop}" fill="${c.fur}"/>
    <polygon points="104,${58 + droop} 136,${26 + droop} 142,${80 + droop}" fill="${c.fur}"/>
    <polygon points="66,${70 + droop} 68,${40 + droop} 86,${58 + droop}" fill="${tip}"/>
    <polygon points="114,${58 + droop} 132,${40 + droop} 134,${70 + droop}" fill="${tip}"/></g>`;
}

function faceParts(kind, face) {
  const ink = '#2B241C';
  const eyeRy = face === 'sad' ? 10 : 12;
  const eyes = `<g class="eyes">
    <ellipse class="eye" cx="80" cy="92" rx="10" ry="${eyeRy}" fill="${ink}"/>
    <ellipse class="eye" cx="120" cy="92" rx="10" ry="${eyeRy}" fill="${ink}"/>
    <circle cx="83" cy="87" r="4" fill="#FFFFFF"/><circle cx="123" cy="87" r="4" fill="#FFFFFF"/>
    <circle cx="77" cy="96" r="1.8" fill="#FFFFFF"/><circle cx="117" cy="96" r="1.8" fill="#FFFFFF"/></g>`;
  const nose = kind === 'cat'
    ? `<polygon points="94,110 106,110 100,117" fill="#C98F86"/>`
    : `<ellipse cx="100" cy="112" rx="9" ry="6.5" fill="${ink}"/><ellipse cx="97" cy="110" rx="3" ry="1.6" fill="#6B5A4A"/>`;
  const whiskers = kind === 'cat'
    ? `<g stroke="#B9B1A0" stroke-width="1.4" stroke-linecap="round"><line x1="58" y1="114" x2="80" y2="118"/><line x1="58" y1="124" x2="80" y2="122"/><line x1="142" y1="114" x2="120" y2="118"/><line x1="142" y1="124" x2="120" y2="122"/></g>`
    : '';
  let brows = ''; let mouth = ''; let cheeks = '';
  if (face === 'sad') {
    brows = `<g class="brows sad" stroke="${ink}" stroke-width="3.5" stroke-linecap="round" fill="none">
      <path d="M68 76 Q80 74 91 67"/><path d="M132 76 Q120 74 109 67"/></g>`;
    mouth = `<path class="mouth frown" d="M90 133 Q100 125 110 133" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  } else if (face === 'joy') {
    mouth = `<path class="mouth open" d="M86 124 Q100 146 114 124 Z" fill="#7A3B33" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/>
      <path class="tongue" d="M94 132 Q100 144 106 132 Z" fill="#E07A6E"/>`;
    cheeks = `<ellipse cx="66" cy="114" rx="8" ry="4.5" fill="#E8A48A" opacity="0.7"/><ellipse cx="134" cy="114" rx="8" ry="4.5" fill="#E8A48A" opacity="0.7"/>`;
  } else {
    mouth = `<path class="mouth smile" d="M90 126 Q100 134 110 126" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    cheeks = `<ellipse cx="66" cy="114" rx="8" ry="4.5" fill="#E8A48A" opacity="0.4"/><ellipse cx="134" cy="114" rx="8" ry="4.5" fill="#E8A48A" opacity="0.4"/>`;
  }
  return eyes + brows + cheeks + nose + whiskers + mouth;
}

function tail(kind, c) {
  if (kind === 'fox') {
    return `<g class="tail"><path d="M132 180 Q196 176 182 116 Q170 160 136 160 Z" fill="${c.fur}"/><path d="M182 116 Q192 136 182 152 Q174 134 182 116 Z" fill="${c.light}"/></g>`;
  }
  if (kind === 'cat') {
    return `<g class="tail"><path d="M134 182 Q184 176 176 132 Q172 112 158 118" stroke="${c.fur}" stroke-width="12" fill="none" stroke-linecap="round"/></g>`;
  }
  return `<g class="tail"><path d="M68 176 Q44 168 50 140" stroke="#B8975F" stroke-width="12" fill="none" stroke-linecap="round"/></g>`;
}

export function companionSVG(kind, face) {
  const k = KINDS.includes(kind) ? kind : 'dog';
  const f = FACES.includes(face) ? face : 'calm';
  const c = PALETTE[k];
  const muzzle = k === 'fox'
    ? `<path d="M64 100 Q82 104 100 134 Q118 104 136 100 Q130 132 100 140 Q70 132 64 100 Z" fill="${c.light}"/>`
    : `<ellipse cx="100" cy="120" rx="25" ry="17" fill="${c.light}"/>`;
  const bandana = k === 'dog' ? `<polygon points="68,140 132,140 100,160" fill="#5B6B3E"/>` : '';
  return `<svg class="companion companion-${k} face-${f}" viewBox="0 0 200 210" role="img" aria-label="Напарник">
  ${tail(k, c)}
  <g class="body">
    <ellipse cx="100" cy="168" rx="40" ry="33" fill="${c.fur}"/>
    <ellipse cx="100" cy="175" rx="22" ry="20" fill="${c.light}"/>
    <ellipse cx="80" cy="198" rx="13" ry="8" fill="${c.paw}"/>
    <ellipse cx="120" cy="198" rx="13" ry="8" fill="${c.paw}"/>
  </g>
  <g class="head">
    ${ears(k, c, f)}
    <circle cx="100" cy="98" r="47" fill="${c.fur}"/>
    ${muzzle}
    ${faceParts(k, f)}
    ${bandana}
  </g>
</svg>`;
}

const HOME_ITEMS = [
  `<ellipse class="home-item" cx="130" cy="226" rx="86" ry="10" fill="#5B6B3E"/>`,
  `<g class="home-item lantern"><rect x="16" y="196" width="22" height="32" rx="4" fill="#6B4A2E"/><rect x="20" y="202" width="14" height="20" rx="3" fill="#F2C46B"/><rect x="22" y="190" width="10" height="7" rx="2" fill="#6B4A2E"/></g>`,
  `<path class="home-item" d="M44 230 Q44 206 70 202 L106 202 Q114 216 106 232 Z" fill="#8A7553"/>`,
  `<g class="home-item"><circle cx="336" cy="214" r="14" fill="#5B6B3E"/><circle cx="328" cy="206" r="4" fill="#E8C35A"/><circle cx="342" cy="210" r="4" fill="#E8C35A"/><circle cx="334" cy="220" r="4" fill="#E8C35A"/></g>`,
  `<g class="home-item"><polygon points="250,176 284,150 318,176" fill="#6B4A2E"/><rect x="256" y="176" width="56" height="50" fill="#8A6A44"/><path d="M274 226 L274 202 Q284 190 294 202 L294 226 Z" fill="#3A2B1E"/></g>`,
  `<g class="home-item"><rect x="20" y="120" width="8" height="80" fill="#6B4A2E"/><circle cx="24" cy="112" r="22" fill="#6B7358"/><circle cx="12" cy="128" r="14" fill="#5B6B3E"/><circle cx="38" cy="126" r="14" fill="#5B6B3E"/></g>`,
];

function smoke(level) {
  const s = r2(clamp(Number(level) || 0, 0.15, 1));
  const puffs = [
    [206, 196, 34, 0.75], [240, 186, 40, 0.8], [276, 196, 32, 0.7], [226, 150, 38, 0.8], [262, 140, 36, 0.78],
    [244, 104, 34, 0.75], [214, 112, 26, 0.6], [280, 104, 24, 0.55], [252, 66, 22, 0.45], [232, 42, 14, 0.3], [270, 36, 12, 0.25],
  ].map(([x, y, r, o]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#17181B" opacity="${o}"/>`).join('');
  return `<g class="smoke" transform="translate(240 228) scale(${s}) translate(-240 -228)">
    <g class="smoke-body">
      <g filter="url(#smoke-blur)">${puffs}</g>
      <ellipse cx="230" cy="118" rx="10" ry="3.5" fill="#D9C46B" opacity="0.9"/>
      <ellipse cx="264" cy="118" rx="10" ry="3.5" fill="#D9C46B" opacity="0.9"/>
    </g>
  </g>`;
}

/** Whole scene: weather from the gremlin level, home items, smoke gremlin behind the companion. */
export function sceneSVG({ kind, face, level, home }) {
  const lv = clamp(Number(level) || 0, 0.15, 1);
  const t = (lv - 0.15) / 0.85;
  const n = Math.max(0, Math.min(HOME_ITEMS.length, Math.floor(Number(home) || 0)));
  const cloud = mix('#F4F1E8', '#3C4046', t);
  const rain = lv > 0.75
    ? `<g class="rain" stroke="#9AA2AC" stroke-width="2" stroke-linecap="round" opacity="0.7">${[30, 80, 130, 180, 230, 280, 330]
      .map((x, i) => `<line x1="${x}" y1="${96 + (i % 2) * 14}" x2="${x - 6}" y2="${110 + (i % 2) * 14}"/>`).join('')}</g>`
    : '';
  const pet = companionSVG(kind, face).replace('<svg ', '<svg x="54" y="36" width="190" height="200" ');
  return `<svg class="scene-svg" viewBox="0 0 360 240" preserveAspectRatio="xMidYMax slice" role="img" aria-label="${lv >= 0.6 ? 'Хмарно' : lv >= 0.35 ? 'Мінлива хмарність' : 'Ясно'}">
    <defs><filter id="smoke-blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter></defs>
    <rect x="0" y="0" width="360" height="240" fill="${mix('#A9CADB', '#565B62', t)}"/>
    <g class="sun" opacity="${r2(1 - t)}">
      <circle cx="306" cy="52" r="24" fill="#F2C46B"/>
      <g stroke="#F2C46B" stroke-width="4" stroke-linecap="round"><line x1="306" y1="16" x2="306" y2="22"/><line x1="306" y1="82" x2="306" y2="88"/><line x1="270" y1="52" x2="276" y2="52"/><line x1="336" y1="52" x2="342" y2="52"/><line x1="281" y1="27" x2="285" y2="31"/><line x1="327" y1="73" x2="331" y2="77"/><line x1="281" y1="77" x2="285" y2="73"/><line x1="327" y1="31" x2="331" y2="27"/></g>
    </g>
    <g class="clouds" opacity="${r2(0.3 + 0.7 * t)}" fill="${cloud}">
      <ellipse cx="60" cy="44" rx="48" ry="18"/><ellipse cx="96" cy="36" rx="34" ry="18"/>
      <ellipse cx="190" cy="50" rx="56" ry="22"/><ellipse cx="236" cy="40" rx="36" ry="18"/>
      ${t > 0.4 ? '<ellipse cx="320" cy="62" rx="50" ry="22"/><ellipse cx="140" cy="72" rx="44" ry="16"/>' : ''}
    </g>
    ${rain}
    <path d="M0 214 Q90 194 180 206 Q270 218 360 200 L360 240 L0 240 Z" fill="${mix('#7A8A4E', '#4E5A38', t)}"/>
    ${HOME_ITEMS.slice(0, n).join('')}
    ${smoke(lv)}
    ${pet}
  </svg>`;
}
