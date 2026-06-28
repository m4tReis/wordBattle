'use strict';
/* ════════════════════════════════════════════════════════════════════════════
   MOCK-API.JS — Simulates AI judge and image/media resolution
   ════════════════════════════════════════════════════════════════════════════ */

// ─── Word Relationship Database ──────────────────────────────────────────────
// Format: 'word' → array of things it can beat
const BEATS = {
  'papel':        ['pedra', 'rocha', 'granito', 'pedregulho', 'calhaus', 'ardosia', 'marmore'],
  'tesoura':      ['papel', 'folha', 'tecido', 'plastico', 'pano', 'corda', 'cabelo', 'fita'],
  'pedra':        ['tesoura', 'faca', 'vidro', 'inseto', 'cobra', 'lagarto'],
  'agua':         ['fogo', 'chama', 'brasa', 'fumaça', 'cinza', 'sal', 'areia', 'poeira', 'acucar'],
  'fogo':         ['gelo', 'neve', 'madeira', 'arvore', 'palha', 'papel', 'vampiro', 'lobo', 'demonio'],
  'gelo':         ['pedra', 'rocha', 'terra', 'flor', 'planta'],
  'vento':        ['fogo', 'nuvem', 'fumaça', 'balao', 'folha', 'pluma'],
  'sol':          ['gelo', 'neve', 'vampiro', 'escuridao', 'cogumelo', 'fungo', 'trevas'],
  'trovao':       ['arvore', 'madeira', 'eletronico', 'computador', 'metal'],
  'chuva':        ['fogo', 'poeira', 'sujeira', 'sal', 'acucar', 'terra seca'],
  'lava':         ['pedra', 'gelo', 'terra', 'metal', 'madeira', 'arvore', 'areia', 'rocha'],
  'mago':         ['guerreiro', 'cavaleiro', 'faca', 'espada'],
  'dragao':       ['cavaleiro', 'flechas', 'humano', 'boi', 'cavalo'],
  'bomba':        ['pedra', 'muro', 'castelo', 'metal', 'tanque', 'rocha'],
  'acido':        ['metal', 'pedra', 'osso', 'plastico', 'tecido', 'madeira'],
  'espada':       ['escudo', 'madeira', 'rope', 'tecido'],
  'escudo':       ['espada', 'flecha', 'pedra', 'faca'],
  'flecha':       ['vampiro', 'lobisomem', 'guerreiro'],
  'bala':         ['vidro', 'madeira', 'metal fino'],
  'laser':        ['metal', 'pedra', 'vidro', 'rocha'],
  'tempo':        ['metal', 'pedra', 'montanha', 'rocha', 'edificio'],
  'amor':         ['odio', 'maldade', 'escuridao', 'tristeza'],
  'ciencia':      ['superstição', 'ignorancia', 'mito', 'doença'],
  'virus':        ['humano', 'animal', 'bactéria'],
  'medicina':     ['virus', 'doença', 'fraqueza', 'veneno'],
  'gravidade':    ['vento', 'balao', 'pluma', 'foguete'],
  'terremoto':    ['edificio', 'muro', 'ponte', 'montanha'],
  'tornado':      ['carro', 'casa', 'arvore', 'madeira', 'vento'],
  'tsunami':      ['cidade', 'praia', 'carro', 'arvore', 'edificio'],
  'relampago':    ['arvore', 'metal', 'agua', 'eletronico', 'computador'],
  'gelo seco':    ['fogo', 'chama', 'calor', 'inseto'],
  'vampiro':      ['humano', 'sangue', 'noite'],
  'lobisomem':    ['humano', 'carneiro', 'boi'],
  'martelo':      ['prego', 'pedra', 'vidro', 'osso'],
  'machado':      ['madeira', 'arvore', 'corda', 'escudo'],
  'chave inglesa':['porca', 'parafuso', 'metal'],
};

// ─── Emoji Map (display in block head) ───────────────────────────────────────
const EMOJI_MAP = {
  'pedra': '🪨',   'rocha': '🪨',    'granito': '🪨',
  'papel': '📄',   'folha': '🍃',
  'tesoura': '✂️',
  'fogo': '🔥',    'chama': '🔥',    'brasa': '🔥',
  'agua': '💧',    'chuva': '🌧️',    'mar': '🌊',
  'gelo': '🧊',    'neve': '❄️',     'geada': '❄️',
  'vento': '💨',   'ar': '💨',       'fumaça': '💨',
  'trovao': '⚡',  'relampago': '⚡',
  'sol': '☀️',     'calor': '🌡️',
  'lua': '🌙',
  'terra': '🌍',   'areia': '🏜️',    'lama': '🟤',
  'madeira': '🪵', 'arvore': '🌳',   'floresta': '🌲',
  'faca': '🔪',    'espada': '⚔️',   'machado': '🪓',
  'escudo': '🛡️',  'armadura': '🛡️',
  'mago': '🧙',    'bruxo': '🧙',
  'vampiro': '🧛', 'lobisomem': '🐺',
  'dragao': '🐉',  'serpente': '🐍',
  'bomba': '💣',   'explosao': '💥',
  'bala': '🔫',    'tiro': '🔫',
  'laser': '🔆',   'luz': '💡',
  'tempo': '⏳',   'relogio': '⏰',
  'amor': '❤️',    'coracao': '💖',
  'ciencia': '🔬', 'quimica': '⚗️',
  'virus': '🦠',   'bacteria': '🦠',
  'medicina': '💊','cura': '💊',
  'gravidade': '🌌', 'planeta': '🪐',
  'terremoto': '🌋','vulcao': '🌋',
  'tornado': '🌪️', 'furacao': '🌀',
  'tsunami': '🌊', 'onda': '🌊',
  'acido': '⚗️',
  'lava': '🌋',
  'martelo': '🔨', 'ferreiro': '⚒️',
  'humano': '👤',  'pessoa': '👤',
  'cavaleiro': '🏇','guerreiro': '⚔️',
  'computador': '💻','eletronico': '📱',
  'metal': '⚙️',   'ferro': '🔩',
  'vidro': '🪟',   'cristal': '💎',
  'escuridao': '🌑','trevas': '🌑',
  'sal': '🧂',
  'plastico': '🧴',
  'default': '❓',
};

// ─── Pre-defined Image Paths ─────────────────────────────────────────────────
const WORD_IMAGES = {
  'pedra':   'assets/images/pedra.png',
  'papel':   'assets/images/papel.png',
  'tesoura': 'assets/images/tesoura.png',
  'fogo':    'assets/images/fogo.png',
  'agua':    'assets/images/agua.png',
  'gelo':    'assets/images/gelo.png',
};

// ─── Starting Words ───────────────────────────────────────────────────────────
const START_WORDS = ['Pedra', 'Fogo', 'Água', 'Gelo', 'Ar', 'Terra'];

// ─── Scene Library (stand-in for the AI's backdrop generation) ────────────────
// Each entry is a Scene document: { background, filter?, particles? } — exactly
// the shape Stage.applyScene() renders and SceneStore persists. Replacing this
// with a real AI call later changes nothing downstream.
// Each Scene is a full CSS-only landscape: a sky gradient + positioned "scenery"
// shapes (mountains, sun, clouds…) + particles + mood (tint/fog/flash/accent).
// No images — every shape is a div with gradients / clip-path, so it stays light.
const SCENES = {

  // ── FOGO — erupting volcano at night ──────────────────────────────────────
  fogo: {
    emoji: '🔥',
    background: 'linear-gradient(180deg, #1c0600 0%, #320d02 45%, #4a1403 72%, #1a0700 100%)',
    accent: '#ff5a1e',
    scenery: [
      { css: 'left:0; right:0; bottom:18%; height:18%; background:radial-gradient(ellipse 70% 100% at 50% 100%, rgba(255,90,0,0.40), transparent 72%);' },
      { css: 'left:16%; bottom:20%; width:48%; height:30%; background:linear-gradient(180deg,#2a0f08,#120503); clip-path:polygon(50% 0,100% 100%,0 100%);' },
      { css: 'right:6%; bottom:20%; width:36%; height:22%; background:linear-gradient(180deg,#220a06,#100402); clip-path:polygon(50% 0,100% 100%,0 100%);' },
      { css: 'left:38%; bottom:46%; width:9%; height:7%; border-radius:50%; background:radial-gradient(ellipse,#ffe080,#ff5a00 55%,transparent 80%);', pulse: { to: 0.65, dur: 2.4 } },
      { css: 'left:41%; bottom:22%; width:1.3%; height:26%; background:linear-gradient(180deg,#ff8a00,#ff2200); border-radius:2px; opacity:0.85;' },
    ],
    tint: { color: 'radial-gradient(ellipse at 50% 100%, #ff5a00, #1a0500)', blend: 'soft-light', opacity: 0.8 },
    fog:  { color: 'rgba(90,30,8,0.5)', opacity: 0.4, speed: 1.4 },
    particles: { emoji: '🔥', count: 12, drift: 'up', speed: 1.3, size: [10, 20] },
  },

  // ── ÁGUA — sunlit ocean floor ─────────────────────────────────────────────
  agua: {
    emoji: '💧',
    background: 'linear-gradient(180deg, #073a5c 0%, #052b46 50%, #02141f 100%)',
    accent: '#23b6ff',
    scenery: [
      { css: 'left:0; right:0; top:0; height:20%; background:radial-gradient(ellipse 80% 100% at 50% 0%, rgba(120,220,255,0.20), transparent 70%);' },
      { css: 'left:24%; top:-12%; width:10%; height:95%; background:linear-gradient(180deg, rgba(150,225,255,0.16), transparent 70%); transform:skewX(-14deg);' },
      { css: 'left:54%; top:-12%; width:7%; height:95%; background:linear-gradient(180deg, rgba(150,225,255,0.12), transparent 65%); transform:skewX(-10deg);' },
      { css: 'left:0; right:0; bottom:18%; height:16%; background:linear-gradient(180deg,transparent,#063048); clip-path:polygon(0 60%,25% 42%,55% 66%,80% 40%,100% 58%,100% 100%,0 100%);' },
    ],
    tint: { color: 'linear-gradient(180deg, #0a8bd0, #021a33)', blend: 'soft-light', opacity: 0.7 },
    fog:  { color: 'rgba(40,120,180,0.4)', opacity: 0.4, speed: 0.7 },
    particles: { color: '#9fe8ff', count: 20, drift: 'up', speed: 0.8, size: [3, 9] },
  },

  // ── GELO — frozen peaks under a full moon ─────────────────────────────────
  gelo: {
    emoji: '🧊',
    background: 'linear-gradient(180deg, #05131f 0%, #0a2236 50%, #0d2a40 100%)',
    accent: '#8fe6ff',
    scenery: [
      { css: 'right:16%; top:9%; width:80px; height:80px; border-radius:50%; background:radial-gradient(circle at 38% 36%, #f2faff, #bcd9ee 70%, #9cc0db); box-shadow:0 0 50px rgba(190,225,255,0.45);' },
      { css: 'left:0; right:0; top:18%; height:18%; background:linear-gradient(180deg, rgba(120,255,215,0.10), transparent); ', drift: { x: 30, dur: 18 } },
      { css: 'left:-4%; bottom:22%; width:66%; height:26%; background:#13344c; clip-path:polygon(0 100%,18% 35%,38% 70%,60% 18%,82% 60%,100% 30%,100% 100%);' },
      { css: 'right:-4%; bottom:20%; width:62%; height:22%; background:linear-gradient(180deg,#2a5772,#16364c); clip-path:polygon(0 70%,22% 26%,46% 62%,70% 20%,100% 55%,100% 100%,0 100%);' },
    ],
    tint: { color: 'linear-gradient(180deg, #bfeeff, #0a2233)', blend: 'soft-light', opacity: 0.55 },
    fog:  { color: 'rgba(190,225,255,0.5)', opacity: 0.5, speed: 0.5 },
    particles: { emoji: '❄️', count: 16, drift: 'down', speed: 0.7, size: [8, 16] },
  },

  // ── PEDRA — rocky cavern ──────────────────────────────────────────────────
  pedra: {
    emoji: '🪨',
    background: 'linear-gradient(180deg, #1c1a18 0%, #2a2622 45%, #14110e 100%)',
    accent: '#c8a878',
    scenery: [
      { css: 'left:0; right:0; top:0; height:22%; background:#0e0c0a; clip-path:polygon(0 0,100% 0,100% 25%,93% 70%,86% 22%,78% 60%,70% 14%,61% 55%,52% 8%,44% 52%,36% 16%,28% 62%,20% 12%,13% 55%,6% 24%,0 58%);' },
      { css: 'left:0; right:0; bottom:18%; height:16%; background:#221d18; clip-path:polygon(0 100%,12% 48%,30% 74%,50% 44%,70% 72%,88% 46%,100% 68%,100% 100%);' },
      { css: 'left:0; right:0; bottom:18%; height:10%; background:radial-gradient(ellipse 60% 100% at 50% 100%, rgba(200,168,120,0.18), transparent 70%);' },
    ],
    tint: { color: 'linear-gradient(180deg, #6b5a3a, #1a140a)', blend: 'soft-light', opacity: 0.5 },
    particles: { color: '#b39c70', count: 10, drift: 'float', size: [3, 8] },
  },

  // ── RAIO — thunderstorm over a skyline ────────────────────────────────────
  raio: {
    emoji: '⚡',
    background: 'linear-gradient(180deg, #0a0a1c 0%, #161334 55%, #0a0818 100%)',
    accent: '#c9a8ff',
    scenery: [
      { css: 'left:-5%; top:5%; width:112%; height:24%; background:radial-gradient(ellipse 30% 80% at 18% 55%, #2a2748, transparent 70%), radial-gradient(ellipse 28% 90% at 50% 45%, #322d55, transparent 70%), radial-gradient(ellipse 32% 80% at 82% 58%, #262240, transparent 70%);', drift: { x: 26, dur: 22 } },
      { css: 'left:0; right:0; bottom:19%; height:18%; background:#0a0814; clip-path:polygon(0 100%,0 55%,7% 55%,7% 32%,13% 32%,13% 60%,21% 60%,21% 22%,28% 22%,28% 64%,38% 64%,38% 40%,46% 40%,46% 18%,54% 18%,54% 58%,64% 58%,64% 34%,72% 34%,72% 62%,82% 62%,82% 26%,90% 26%,90% 56%,100% 56%,100% 100%);' },
    ],
    tint: { color: 'linear-gradient(180deg, #7a5cff, #0a0818)', blend: 'soft-light', opacity: 0.6 },
    flash: { color: '#dfe6ff', every: 2600 },
    particles: { color: '#c9d2ff', count: 34, drift: 'down', speed: 2.4, size: [2, 4] },
  },

  // ── TERRA — canyon mesas at dusk ──────────────────────────────────────────
  terra: {
    emoji: '🌍',
    background: 'linear-gradient(180deg, #3a2a14 0%, #4a3417 38%, #2a1d0c 70%, #160f06 100%)',
    accent: '#d98a3c',
    scenery: [
      { css: 'left:46%; top:16%; width:72px; height:72px; border-radius:50%; background:radial-gradient(circle,#ffd27a,#ff9a3c 60%,transparent 76%); box-shadow:0 0 50px rgba(255,160,60,0.4);', pulse: { to: 0.7, dur: 4 } },
      { css: 'left:-2%; bottom:24%; width:52%; height:16%; background:#3a2614; clip-path:polygon(0 100%,0 30%,40% 30%,40% 62%,72% 62%,72% 18%,100% 18%,100% 100%);' },
      { css: 'right:-2%; bottom:20%; width:48%; height:20%; background:#241608; clip-path:polygon(0 100%,0 52%,30% 52%,30% 24%,66% 24%,66% 56%,100% 56%,100% 100%);' },
    ],
    tint: { color: 'linear-gradient(180deg, #c87a2e, #160f06)', blend: 'soft-light', opacity: 0.5 },
    particles: { color: '#caa86a', count: 12, drift: 'up', speed: 0.7, size: [3, 8] },
  },

  // ── AR — bright cloudy sky ────────────────────────────────────────────────
  ar: {
    emoji: '💨',
    background: 'linear-gradient(180deg, #244a6a 0%, #356a90 45%, #5a90b0 100%)',
    accent: '#bfe6ff',
    scenery: [
      { css: 'right:18%; top:10%; width:64px; height:64px; border-radius:50%; background:radial-gradient(circle,#fffbe6,#ffe79a 60%,transparent 78%); box-shadow:0 0 60px rgba(255,235,150,0.5);', pulse: { to: 0.8, dur: 5 } },
      { css: 'left:10%; top:24%; width:30%; height:14%; border-radius:50%; background:radial-gradient(ellipse, rgba(255,255,255,0.85), rgba(255,255,255,0) 70%);', drift: { x: 40, dur: 20 } },
      { css: 'left:52%; top:16%; width:24%; height:11%; border-radius:50%; background:radial-gradient(ellipse, rgba(255,255,255,0.7), rgba(255,255,255,0) 70%);', drift: { x: -34, dur: 24 } },
      { css: 'left:30%; top:38%; width:34%; height:13%; border-radius:50%; background:radial-gradient(ellipse, rgba(255,255,255,0.6), rgba(255,255,255,0) 72%);', drift: { x: 28, dur: 26 } },
    ],
    tint: { color: 'linear-gradient(180deg, #cdeeff, #0a1822)', blend: 'soft-light', opacity: 0.45 },
    particles: { color: '#eaf6ff', count: 16, drift: 'float', speed: 0.8, size: [3, 7] },
  },
};

// ─── Verdict Messages ─────────────────────────────────────────────────────────
const WIN_MSGS = [
  '{pw} derrota {cw}!',
  '{pw} é mais forte que {cw}!',
  '{pw} supera {cw} com facilidade!',
  'Incrível! {pw} vence {cw}!',
  '{pw} domina {cw}!',
  'A IA confirma: {pw} vence {cw}!',
];

const CREATIVE_WIN_MSGS = [
  'Hmm... de alguma forma {pw} vence {cw}!',
  'A IA ficou confusa, mas {pw} ganhou!',
  '{pw} encontra uma maneira criativa de superar {cw}!',
  'Questionável, mas a IA aceitou: {pw} vence!',
  'Uau, {pw} contra {cw}? A IA disse sim!',
];

const LOSE_MSGS = [
  '{cw} resiste a {pw}!',
  '{pw} não consegue superar {cw}!',
  '{cw} é mais forte! {pw} perde!',
  '{pw} falhou! {cw} vence!',
  'A IA julgou: {cw} derrota {pw}!',
];

const SAME_WORD_MSG = 'Não pode usar a mesma palavra!';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fmt(tpl, pw, cw) {
  return tpl
    .replace('{pw}', `"${pw}"`)
    .replace('{cw}', `"${cw}"`);
}

function normalize(word) {
  return word
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // remove accents for matching
}

function wordsMatch(a, b) {
  return normalize(a) === normalize(b);
}

// Resolve the emoji for a word: exact match in EMOJI_MAP, then a partial match.
// Returns null when nothing matches (callers decide their own fallback).
function findEmoji(word) {
  const w = normalize(word);
  if (EMOJI_MAP[w]) return EMOJI_MAP[w];
  const key = Object.keys(EMOJI_MAP).find(k => w.includes(normalize(k)) || normalize(k).includes(w));
  return key ? EMOJI_MAP[key] : null;
}

function beats(winner, loser) {
  const w = normalize(winner);
  const l = normalize(loser);
  const list = BEATS[w];
  if (!list) return false;
  return list.some(item => {
    const n = normalize(item);
    return l.includes(n) || n.includes(l);
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Public API ───────────────────────────────────────────────────────────────
const MockAPI = {

  getStartWord() {
    return pickRandom(START_WORDS);
  },

  /**
   * Generate a backdrop Scene for a word. Stand-in for the future AI:
   * swap the body for an API call that returns the same { background, filter,
   * particles } shape. Unknown words get a neutral, deterministically-tinted scene.
   * @param {string} word
   * @returns {{background?: string, filter?: string, particles?: object}}
   */
  generateScene(word) {
    const key = normalize(word);
    const exact = SCENES[key];
    if (exact) return exact;

    const partial = Object.entries(SCENES).find(([k]) => key.includes(k));
    if (partial) return partial[1];

    // Unknown word → procedurally build a stable landscape from the word itself.
    // Same shape as the curated scenes, so unknown words feel just as authored.
    const hue  = (key.length * 47 + key.charCodeAt(0) * 7) % 360;
    const hue2 = (hue + 40) % 360;
    const emoji = findEmoji(key) || EMOJI_MAP.default;
    return {
      emoji,
      background: `linear-gradient(180deg, hsl(${hue},45%,10%) 0%, hsl(${hue},50%,16%) 45%, hsl(${hue},45%,7%) 100%)`,
      accent: `hsl(${hue}, 90%, 62%)`,
      scenery: [
        { css: `left:44%; top:14%; width:66px; height:66px; border-radius:50%; background:radial-gradient(circle, hsl(${hue},95%,75%), hsl(${hue2},90%,50%) 60%, transparent 78%); box-shadow:0 0 50px hsla(${hue},90%,60%,0.4);`, pulse: { to: 0.7, dur: 4 } },
        { css: `left:-4%; bottom:22%; width:64%; height:24%; background:hsl(${hue},40%,14%); clip-path:polygon(0 100%,20% 40%,42% 68%,64% 28%,86% 58%,100% 38%,100% 100%);` },
        { css: `right:-4%; bottom:20%; width:60%; height:20%; background:hsl(${hue2},38%,11%); clip-path:polygon(0 64%,24% 30%,48% 60%,72% 24%,100% 52%,100% 100%,0 100%);` },
      ],
      tint: { color: `linear-gradient(180deg, hsl(${hue},80%,45%), #0a0a14)`, blend: 'soft-light', opacity: 0.5 },
      particles: { color: `hsl(${hue}, 90%, 70%)`, count: 12, drift: 'float', speed: 0.8, size: [3, 8] },
    };
  },

  /** @returns {{ imageUrl: string|null, emoji: string|null }} */
  getWordMedia(word) {
    return {
      imageUrl: WORD_IMAGES[normalize(word)] || null,
      emoji:    findEmoji(word),
    };
  },

  /**
   * Judge who wins between two words.
   * @param {string} currentWord  - game's word (left fighter)
   * @param {string} playerWord   - player's input (right fighter)
   * @param {number} currentScore - current player score (affects difficulty)
   * @returns {Promise<{winner: 'player'|'game', reason: string, playerEmoji: ?string}>}
   */
  async judgeWords(currentWord, playerWord, currentScore = 0) {
    // Simulate AI "thinking" delay
    await delay(1000 + Math.random() * 700);

    const cw = currentWord;
    const pw = playerWord;

    // The player word's face emoji travels with the verdict (the front shows it
    // on the right fighter), mirroring how the scene carries the reigning word's.
    const playerEmoji = findEmoji(pw);

    // Same word check
    if (wordsMatch(cw, pw)) {
      return { winner: 'game', reason: SAME_WORD_MSG, playerEmoji };
    }

    // Too short
    if (normalize(pw).length < 2) {
      return { winner: 'game', reason: 'Resposta muito curta!', playerEmoji };
    }

    // Known win for player
    if (beats(pw, cw)) {
      return { winner: 'player', reason: fmt(pickRandom(WIN_MSGS), pw, cw), playerEmoji };
    }

    // Known win for game
    if (beats(cw, pw)) {
      return { winner: 'game', reason: fmt(pickRandom(LOSE_MSGS), cw, pw), playerEmoji };
    }

    // Unknown pair — probability-based, gets harder as score rises
    const winChance = Math.max(0.30, 0.70 - currentScore * 0.012);
    if (Math.random() < winChance) {
      return { winner: 'player', reason: fmt(pickRandom(CREATIVE_WIN_MSGS), pw, cw), playerEmoji };
    } else {
      return { winner: 'game', reason: fmt(pickRandom(LOSE_MSGS), cw, pw), playerEmoji };
    }
  },
};
