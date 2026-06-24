'use strict';
/* ════════════════════════════════════════════════════════════════════════════
   AI-CLIENT.JS — The SINGLE integration seam between the front-end and the
   back-end AI. The rest of the game NEVER calls the backend directly; it only
   calls AIClient.judge() and AIClient.scene(). To go from mock → real backend,
   nothing else in the front changes — only the config below.

   ▸ Full request/response contract for the backend: see ../BACKEND.md ◂

   Two operations the AI must provide:
     1. judge(matchup)  → who wins the round + a commentary line
     2. scene(word)     → the Scene object that repaints the arena backdrop

   Switching mock ↔ real:
     • Edit `config` below (useMock / baseUrl), OR
     • At runtime, append to the URL (handy for the backend dev):
         ?api=http://localhost:3000/api   → use the real backend at this URL
         ?mock=1                          → force the mock back on
   ════════════════════════════════════════════════════════════════════════════ */

const AIClient = (() => {

  // ─── Configuration ────────────────────────────────────────────────────────
  const config = {
    useMock:   true,    // ← flip to false (or pass ?api=…) to hit the real backend
    baseUrl:   '',      // e.g. 'http://localhost:3000/api' (no trailing slash)
    timeoutMs: 8000,    // request abort timeout
  };

  // Optional runtime override via query string — lets the backend dev point the
  // deployed front at their server without editing code.
  try {
    const qs = new URLSearchParams(location.search);
    if (qs.get('api'))      { config.baseUrl = qs.get('api').replace(/\/+$/, ''); config.useMock = false; }
    if (qs.get('mock') === '1') config.useMock = true;
  } catch (_) { /* location may be unavailable in some contexts */ }

  // ─── HTTP helper (used only when useMock === false) ─────────────────────────
  async function postJSON(path, body) {
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), config.timeoutMs);
    try {
      const res = await fetch(`${config.baseUrl}${path}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
        signal:  ctrl.signal,
      });
      if (!res.ok) throw new Error(`AIClient ${path} → HTTP ${res.status}`);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  // ─── Response normalisation ─────────────────────────────────────────────────
  // The internal game only needs: winner === 'player' (advance) vs anything else
  // (game over). We normalise the external contract to 'player' | 'opponent'.
  function normalizeJudge(raw = {}) {
    const winner = raw.winner === 'player' ? 'player' : 'opponent';
    const reason = (typeof raw.reason === 'string' && raw.reason.trim())
      ? raw.reason
      : (winner === 'player' ? 'Você venceu a rodada!' : 'Você foi derrotado!');
    return { winner, reason, scene: raw.scene || null };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  PUBLIC: the two calls the backend must answer
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Judge a matchup: does the player's word beat the current opponent word?
   *
   *  REQUEST  (POST {baseUrl}/judge)
   *    { currentWord, playerWord, round, score, history: string[] }
   *  RESPONSE
   *    { winner: 'player' | 'opponent', reason: string, scene?: Scene }
   *
   * @returns {Promise<{winner:'player'|'opponent', reason:string, scene:?object}>}
   */
  async function judge({ currentWord, playerWord, round = 1, score = 0, history = [] }) {
    if (config.useMock) {
      // Mock keeps the exact same output contract (maps its 'game' → 'opponent').
      const raw = await MockAPI.judgeWords(currentWord, playerWord, score);
      return normalizeJudge(raw);
    }
    const raw = await postJSON('/judge', { currentWord, playerWord, round, score, history });
    return normalizeJudge(raw);
  }

  /**
   * Get the Scene that should repaint the arena backdrop for a word.
   * (See BACKEND.md → "Scene schema" for every field. All fields are optional;
   *  any omitted field is reset/cleared by the renderer.)
   *
   *  REQUEST  (POST {baseUrl}/scene)
   *    { word, round, history: string[] }
   *  RESPONSE
   *    Scene  (e.g. { background, scenery, particles, tint, fog, flash, accent })
   *
   * @returns {Promise<object>} a Scene object
   */
  async function scene({ word, round = 1, history = [] }) {
    if (config.useMock) {
      return MockAPI.generateScene(word);
    }
    return postJSON('/scene', { word, round, history });
  }

  return { config, judge, scene };

})();
