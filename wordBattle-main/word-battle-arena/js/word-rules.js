'use strict';
/* ════════════════════════════════════════════════════════════════════════════
   WORD-RULES.JS — Player input validation

   Enforced client-side in game.js BEFORE a round starts, so an invalid word
   never triggers the fight. Three rules:
     1. Blocklist  — words in DISALLOWED_WORDS are rejected.
     2. No opponent match — can't type the current opponent's word.
     3. No repeats — can't reuse a word already played in the sequence.

   ▸▸ THE DISALLOWED-WORDS LIST IS RIGHT BELOW (DISALLOWED_WORDS). ◂◂
      Edit that array to add/remove blocked words. Matching ignores case and
      accents, so "Pôrra" / "PORRA" / "porra" are all caught by one entry.
   ════════════════════════════════════════════════════════════════════════════ */

const WordRules = (() => {

  // ─── Disallowed words (edit freely) ───────────────────────────────────────
  const DISALLOWED_WORDS = [
    // profanity / offensive (PT-BR)
    'merda', 'bosta', 'porra', 'caralho', 'cu', 'buceta', 'puta', 'puta que pariu',
    'piranha', 'viado', 'veado', 'foda', 'foder', 'fodase', 'cacete', 'arrombado',
    'desgraca', 'corno', 'otario', 'babaca', 'idiota', 'imbecil',
    // meta / placeholder / nonsense
    'palavra', 'teste', 'asdf', 'aaa', 'nada',
  ];

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function normalize(word) {
    return (word || '').toLowerCase().trim()
      .normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  const blocked = new Set(DISALLOWED_WORDS.map(normalize));

  /**
   * Validate a player's word.
   * @param {string} word
   * @param {object} ctx
   * @param {string}   [ctx.current] - the current opponent's word
   * @param {string[]} [ctx.used]    - every word already played this run
   * @returns {{ ok: boolean, reason?: string }}
   */
  function check(word, ctx = {}) {
    const w = normalize(word);

    if (w.length < 2) {
      return { ok: false, reason: 'Digite uma palavra com pelo menos 2 letras!' };
    }
    if (blocked.has(w)) {
      return { ok: false, reason: 'Essa palavra não é permitida!' };
    }
    if (ctx.current && w === normalize(ctx.current)) {
      return { ok: false, reason: 'Você não pode usar a mesma palavra do oponente!' };
    }
    if ((ctx.used || []).map(normalize).includes(w)) {
      return { ok: false, reason: 'Você já usou essa palavra! Sem repetições.' };
    }
    return { ok: true };
  }

  /** True if a word is on the blocklist (case/accent-insensitive). */
  function isDisallowed(word) {
    return blocked.has(normalize(word));
  }

  return { check, isDisallowed, DISALLOWED_WORDS };

})();
