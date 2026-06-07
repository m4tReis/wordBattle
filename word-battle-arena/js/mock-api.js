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

  /** @returns {{ imageUrl: string|null, emoji: string|null }} */
  getWordMedia(word) {
    const w = normalize(word);
    const imageUrl = WORD_IMAGES[w] || null;

    // Find emoji: exact match, then partial
    let emoji = EMOJI_MAP[w] || null;
    if (!emoji) {
      const key = Object.keys(EMOJI_MAP).find(k => w.includes(normalize(k)) || normalize(k).includes(w));
      emoji = key ? EMOJI_MAP[key] : null;
    }

    return { imageUrl, emoji };
  },

  /**
   * Judge who wins between two words.
   * @param {string} currentWord  - game's word (left fighter)
   * @param {string} playerWord   - player's input (right fighter)
   * @param {number} currentScore - current player score (affects difficulty)
   * @returns {Promise<{winner: 'player'|'game', reason: string}>}
   */
  async judgeWords(currentWord, playerWord, currentScore = 0) {
    // Simulate AI "thinking" delay
    await delay(1000 + Math.random() * 700);

    const cw = currentWord;
    const pw = playerWord;

    // Same word check
    if (wordsMatch(cw, pw)) {
      return { winner: 'game', reason: SAME_WORD_MSG };
    }

    // Too short
    if (normalize(pw).length < 2) {
      return { winner: 'game', reason: 'Resposta muito curta!' };
    }

    // Known win for player
    if (beats(pw, cw)) {
      return { winner: 'player', reason: fmt(pickRandom(WIN_MSGS), pw, cw) };
    }

    // Known win for game
    if (beats(cw, pw)) {
      return { winner: 'game', reason: fmt(pickRandom(LOSE_MSGS), cw, pw) };
    }

    // Unknown pair — probability-based, gets harder as score rises
    const winChance = Math.max(0.30, 0.70 - currentScore * 0.012);
    if (Math.random() < winChance) {
      return { winner: 'player', reason: fmt(pickRandom(CREATIVE_WIN_MSGS), pw, cw) };
    } else {
      return { winner: 'game', reason: fmt(pickRandom(LOSE_MSGS), cw, pw) };
    }
  },
};
