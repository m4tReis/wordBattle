'use strict';
/* ════════════════════════════════════════════════════════════════════════════
   AI-CLIENT.JS — The SINGLE integration seam between the front-end and the
   back-end AI. The rest of the game NEVER calls the backend directly; it only
   calls AIClient.judge() and AIClient.scene(). To go from mock → real backend,
   nothing else in the front changes — only the config below.

   ▸ Full request/response contract for the backend: see ../BACKEND.md ◂

   Two operations the AI must provide:
     1. judge(matchup)  → who wins the round + a commentary line (+ the player
                          word's face emoji)
     2. scene(word)     → the Scene object that repaints the arena backdrop
                          (carries the reigning word's face emoji too)

   Configuração (resolvida em camadas — vence o primeiro encontrado):
     1. Query string:  ?api=http://host/api  |  ?mock=1  |  ?mock=0
     2. localStorage:  AIClient.setBackend('http://host/api') / setMock(true)
     3. js/config.js:  window.WBA_CONFIG = { useMock, baseUrl }   ← por ambiente
     4. DEFAULTS abaixo (fallback)
   Detalhes completos em ../BACKEND.md (§1).
   ════════════════════════════════════════════════════════════════════════════ */

const AIClient = (() => {

  // ─── Configuration ────────────────────────────────────────────────────────
  // Built-in fallback (último recurso, caso js/config.js não seja carregado).
  // ► Para configurar por ambiente, edite js/config.js — NÃO precise mexer aqui.
  const DEFAULTS = {
    useMock:   false,
    baseUrl:   'http://localhost:8081/api',
    timeoutMs: 8000,
  };
  const LS_API = 'wba_api', LS_MOCK = 'wba_mock';

  // Resolve a config em CAMADAS (vence o primeiro encontrado):
  //   1. query string  (?api=… / ?mock=1|0)   — pontual, por aba
  //   2. localStorage  (setBackend / setMock)  — persistente, por navegador
  //   3. window.WBA_CONFIG (js/config.js)       — por ambiente
  //   4. DEFAULTS                               — fallback embutido
  function resolveConfig() {
    const cfg = { ...DEFAULTS, ...(window.WBA_CONFIG || {}) };
    try {
      const a = localStorage.getItem(LS_API), m = localStorage.getItem(LS_MOCK);
      if (a)        { cfg.baseUrl = a; cfg.useMock = false; }
      if (m === '1') cfg.useMock = true;
      if (m === '0') cfg.useMock = false;
    } catch (_) { /* localStorage may be blocked */ }
    try {
      const qs = new URLSearchParams(location.search);
      if (qs.get('api'))          { cfg.baseUrl = qs.get('api'); cfg.useMock = false; }
      if (qs.get('mock') === '1')   cfg.useMock = true;
      if (qs.get('mock') === '0')   cfg.useMock = false;
    } catch (_) { /* location may be unavailable */ }

    if (cfg.baseUrl) cfg.baseUrl = String(cfg.baseUrl).replace(/\/+$/, '');
    if (!cfg.useMock && !cfg.baseUrl) {
      console.warn('[AIClient] useMock=false sem baseUrl — voltando ao mock.');
      cfg.useMock = true;
    }
    return cfg;
  }

  const config = resolveConfig();

  // Helpers de conveniência (persistem no localStorage e valem na hora):
  //   AIClient.setBackend('http://host/api')  → usa esse back, desliga o mock
  //   AIClient.setMock(true|false)            → liga/desliga o mock
  //   AIClient.clearConfig()                  → remove overrides salvos
  function setBackend(url) {
    try { localStorage.setItem(LS_API, url); localStorage.removeItem(LS_MOCK); } catch (_) {}
    config.baseUrl = String(url).replace(/\/+$/, ''); config.useMock = false;
    return config;
  }
  function setMock(on = true) {
    try { localStorage.setItem(LS_MOCK, on ? '1' : '0'); } catch (_) {}
    config.useMock = !!on;
    return config;
  }
  function clearConfig() {
    try { localStorage.removeItem(LS_API); localStorage.removeItem(LS_MOCK); } catch (_) {}
    Object.assign(config, resolveConfig());
    return config;
  }

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
    return { winner, reason, scene: raw.scene || null, playerEmoji: raw.playerEmoji || null };
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
   *    { winner: 'player' | 'opponent', reason: string, playerEmoji?: string, scene?: Scene }
   *
   * @returns {Promise<{winner:'player'|'opponent', reason:string, playerEmoji:?string, scene:?object}>}
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

  return { config, judge, scene, setBackend, setMock, clearConfig };

})();
