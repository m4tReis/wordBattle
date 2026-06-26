'use strict';
/* ════════════════════════════════════════════════════════════════════════════
   GAME.JS — Main game state machine
   ════════════════════════════════════════════════════════════════════════════

   State flow:
     INTRO → [start] → IDLE
     IDLE  → [submit] → REVEALING → FACEOFF → JUDGING → WIN | LOSE
     WIN   → [transition] → IDLE (next round)
     LOSE  → GAMEOVER
     GAMEOVER → [revanche] → IDLE (reset)
   ════════════════════════════════════════════════════════════════════════════ */

const GAME_STATE = {
  INTRO:     'intro',
  IDLE:      'idle',
  BUSY:      'busy',    // any animation in progress
  GAMEOVER:  'gameover',
};

const Game = (() => {

  // ── State ──────────────────────────────────────────────────────────────────
  let state       = GAME_STATE.INTRO;
  let score       = 0;
  let bestScore   = 0;
  let round       = 1;
  let currentWord = '';
  let wordHistory = [];  // palavras já usadas (para validação de repetição)
  let roundLog    = [];  // [{ roundNum, opponent, player }] — log visual de combate

  /** @type {Fighter} */
  let leftFighter  = null;
  /** @type {Fighter} */
  let rightFighter = null;

  // ── Init ───────────────────────────────────────────────────────────────────
  function init() {
    leftFighter  = new Fighter('left');
    rightFighter = new Fighter('right');

    bestScore = parseInt(localStorage.getItem('wba_best') || '0', 10);
    document.getElementById('best-value').textContent = bestScore;

    // Button listeners
    document.getElementById('btn-start').addEventListener('click',   onStartClick);
    document.getElementById('btn-revenge').addEventListener('click', onStartClick);
    document.getElementById('btn-submit').addEventListener('click',  onSubmit);
    document.getElementById('btn-history').addEventListener('click', openDrawer);
    document.getElementById('btn-close-drawer').addEventListener('click', closeDrawer);
    document.getElementById('history-overlay').addEventListener('click', closeDrawer);

    // Keyboard: ESC closes drawer
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeDrawer();
    });

    // Input listeners
    const input = document.getElementById('player-input');
    input.addEventListener('keydown', e => { if (e.key === 'Enter') onSubmit(); });
    input.addEventListener('input',   () => {
      Sounds.type();
      hideVerdict();   // clear any rule warning as the player retypes
      // Enable submit only when there's content
      document.getElementById('btn-submit').disabled = (input.value.trim().length < 2);
    });
  }

  // ── Screen transitions ─────────────────────────────────────────────────────
  function showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(`screen-${name}`);
    if (el) el.classList.add('active');
  }

  // ── Start / Restart ────────────────────────────────────────────────────────
  async function onStartClick() {
    Sounds.click();

    // Reset state
    score       = 0;
    round       = 1;
    wordHistory = [];
    currentWord = MockAPI.getStartWord();

    // Reset UI
    roundLog = [];
    clearHistory();
    updateHUD();
    hideVerdict();
    hideKO();
    document.getElementById('player-input').value = '';
    document.getElementById('btn-submit').disabled = true;

    showScreen('game');
    await sleep(200); // let screen fade in

    // Reset fighters
    leftFighter.reset();
    rightFighter.reset();

    // Set initial word on left fighter
    const media = MockAPI.getWordMedia(currentWord);
    leftFighter.setWordInstant(currentWord, media);
    rightFighter.showQuestion();

    // Paint the AI backdrop for the reigning word (immune elements stay put).
    // Non-blocking on purpose: a slow/offline backend must NEVER delay the
    // fighters' entrance — the scene pops in once it resolves.
    paintSceneFor(currentWord);

    // Fighters enter
    await Promise.all([
      leftFighter.enter(0),
      rightFighter.enter(0.18),
    ]);

    // Idle animations
    leftFighter.startIdle();
    rightFighter.startIdle();

    updatePrompt();
    enableInput();

    Sounds.crowd();
    state = GAME_STATE.IDLE;
  }

  // ── Submit Handler ─────────────────────────────────────────────────────────
  async function onSubmit() {
    if (state !== GAME_STATE.IDLE) return;

    const input      = document.getElementById('player-input');
    const playerWord = input.value.trim();

    // ── Input rules: blocklist, no opponent match, no repeats ──────────────
    // used = the opponent's word + every word already played this run
    const verdict = WordRules.check(playerWord, {
      current: currentWord,
      used:    [...wordHistory, currentWord],
    });
    if (!verdict.ok) {
      showVerdict(verdict.reason, 'warn');
      shakeInput();
      return;
    }

    state = GAME_STATE.BUSY;
    disableInput();
    input.value = '';
    document.getElementById('btn-submit').disabled = true;

    Sounds.submit();

    // ── Phase 1: Reveal player's word in right block ──────────────────────
    const media = MockAPI.getWordMedia(playerWord);
    await rightFighter.showWord(playerWord, media);
    Sounds.reveal();

    await sleep(350);

    // ── Phase 2: VS text + faceoff walk (Tension building) ───────────────
    showVS();
    Sounds.drumRoll(); // War drums beating
    
    // Start the AI judging process CONCURRENTLY with the walk
    // This eliminates the 3-second delay after they meet!
    // (Single integration point — see js/ai-client.js + BACKEND.md)
    // If the backend call fails (down / CORS / endpoint missing), fall back to
    // the local mock judge so the round still resolves. The error is logged so
    // the back-end problem stays visible in the console.
    const judgePromise = AIClient.judge({
      currentWord, playerWord, round, score,
      history: [...wordHistory],
    }).catch(async (err) => {
      console.warn('[Game] AIClient.judge falhou — usando mock como fallback:', err);
      const raw = await MockAPI.judgeWords(currentWord, playerWord, score);
      return { winner: raw.winner === 'player' ? 'player' : 'opponent', reason: raw.reason, scene: null };
    });

    // Slow, tense walk to the center
    await Promise.all([
      leftFighter.walkToCenter(2.4),
      rightFighter.walkToCenter(2.4),
    ]);

    // ── Phase 3: Judge ────────────────────────────────────────────────────
    // Wait for the AI result (it likely finished during the 2.4s walk)
    // result = { winner: 'player' | 'opponent', reason, scene? }
    const result = await judgePromise;

    hideVS();

    // ── Phase 4: Outcome ──────────────────────────────────────────────────
    if (result.winner === 'player') {
      await handleWin(playerWord, result, media);
    } else {
      await handleLose(playerWord, result);
    }
  }

  // ── Player Wins ────────────────────────────────────────────────────────────
  async function handleWin(playerWord, result, media) {
    showVerdict(result.reason, 'win');

    // Impact position (center of ring)
    const { cx, cy } = ringCenter();

    // Right fighter punches left fighter simultaneously
    Sounds.heavyPunch();
    await Promise.all([
      rightFighter.punch(),
      leftFighter.getHit(),
    ]);

    // Particles + screen flash
    screenFlash();
    spawnParticles(cx, cy, '#00d4ff', 18);
    spawnStars(cx, cy, 8);
    showImpactWord(['POW!', 'CRACK!', 'BANG!', 'WHAM!']);

    Sounds.knockout();
    await sleep(120);

    // Left fighter KO
    await leftFighter.knockout();
    showKO();

    Sounds.crowdCheer();
    Sounds.victory();

    await sleep(300);

    // Score update
    score++;
    round++;
    Sounds.scoreUp();
    animateScorePop();
    addToHistory(currentWord, playerWord, score);

    await sleep(400);

    // Celebrate
    await rightFighter.celebrate();

    await sleep(300);

    // ── Transition to next round ──────────────────────────────────────────
    hideKO();
    hideVerdict();
    hideImpactWord();

    await transitionToNextRound(playerWord, media);

    state = GAME_STATE.IDLE;
    updatePrompt();
    enableInput();
  }

  // ── Player Loses ───────────────────────────────────────────────────────────
  async function handleLose(playerWord, result) {
    showVerdict(result.reason, 'lose');

    const { cx, cy } = ringCenter();

    Sounds.heavyPunch();
    await Promise.all([
      leftFighter.punch(),
      rightFighter.getHit(),
    ]);

    screenFlash();
    spawnParticles(cx, cy, '#ff3060', 18);
    spawnStars(cx, cy, 8);
    showImpactWord(['KO!', 'OUT!', 'BOOM!', 'MISS!']);

    Sounds.knockout();
    await sleep(120);

    await rightFighter.knockout();
    showKO();

    Sounds.lose();
    await sleep(900);

    // Save best score
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem('wba_best', bestScore);
    }

    showGameOver(result.reason);
    state = GAME_STATE.GAMEOVER;
  }

  // ── Transition to next round ───────────────────────────────────────────────
  async function transitionToNextRound(playerWord, media) {
    // Stop idle
    leftFighter.stopIdle();
    rightFighter.stopIdle();

    // Fade both fighters out
    await Promise.all([
      new Promise(r => gsap.to(leftFighter.root,  { opacity: 0, duration: 0.25, onComplete: r })),
      new Promise(r => gsap.to(rightFighter.root, { opacity: 0, duration: 0.25, delay: 0.1, onComplete: r })),
    ]);

    // Update left fighter to show the player's winning word
    leftFighter.reset();
    leftFighter.setWordInstant(playerWord, media);

    // Reset right fighter to "?"
    rightFighter.reset();
    rightFighter.showQuestion();

    // Update current word
    currentWord = playerWord;
    updateHUD();

    // The winning word now reigns — repaint the backdrop (non-blocking, same
    // reason as in onStartClick: never block the round on backend latency).
    paintSceneFor(playerWord);

    // Fade both back in
    await Promise.all([
      new Promise(r => gsap.to(leftFighter.root,  { opacity: 1, duration: 0.35, onComplete: r })),
      new Promise(r => gsap.to(rightFighter.root, { opacity: 1, duration: 0.35, delay: 0.1, onComplete: r })),
    ]);

    // Resume idle
    leftFighter.startIdle();
    rightFighter.startIdle();
  }

  // ── UI Helpers ─────────────────────────────────────────────────────────────

  function updateHUD() {
    document.getElementById('score-value').textContent = score;
    document.getElementById('best-value').textContent  = Math.max(bestScore, score);
    document.getElementById('round-display').textContent = `ROUND ${round}`;

    const streak = document.getElementById('streak-display');
    if (score >= 10) streak.textContent = `🔥 ${score} em sequência!`;
    else if (score >= 5) streak.textContent = `⚡ ${score} em sequência!`;
    else if (score > 0) streak.textContent = `${score} em sequência`;
    else streak.textContent = '';
  }

  function updatePrompt() {
    document.getElementById('prompt-word').textContent = currentWord;
    const input = document.getElementById('player-input');
    input.placeholder = `O que vence ${currentWord}?`;
  }

  function enableInput() {
    const input = document.getElementById('player-input');
    input.disabled = false;
    input.focus();
  }

  function disableInput() {
    document.getElementById('player-input').disabled = true;
    document.getElementById('btn-submit').disabled   = true;
  }

  function shakeInput() {
    const el = document.getElementById('player-input');
    gsap.fromTo(el,
      { x: -8 },
      { x: 8, duration: 0.07, yoyo: true, repeat: 5, ease: 'none',
        onComplete: () => gsap.set(el, { x: 0 }) }
    );
    Sounds.click();
  }

  // ── Ring Overlays ──────────────────────────────────────────────────────────

  function showVS() {
    const el = document.getElementById('vs-text');
    el.classList.remove('hidden');
    gsap.fromTo(el,
      { scale: 2.5, opacity: 0, letterSpacing: '30px' },
      { scale: 1,   opacity: 1, letterSpacing: '10px', duration: 0.35, ease: 'back.out(2)' }
    );
  }

  function hideVS() {
    const el = document.getElementById('vs-text');
    gsap.to(el, {
      opacity: 0, scale: 0.8, duration: 0.2,
      onComplete: () => el.classList.add('hidden'),
    });
  }

  function showKO() {
    const el = document.getElementById('ko-banner');
    el.classList.remove('hidden');
    gsap.fromTo(el,
      { scale: 3.5, opacity: 0, rotation: -12 },
      { scale: 1,   opacity: 1, rotation: 0,  duration: 0.45, ease: 'back.out(2)' }
    );
  }

  function hideKO() {
    const el = document.getElementById('ko-banner');
    gsap.to(el, {
      opacity: 0, duration: 0.2,
      onComplete: () => {
        el.classList.add('hidden');
        gsap.set(el, { scale: 1, rotation: 0 });
      },
    });
  }

  const IMPACT_COLORS = {
    'POW!':  '#ffd426', 'CRACK!': '#ff3060',
    'BANG!': '#00d4ff', 'WHAM!':  '#c040ff',
    'KO!':   '#ff3060', 'OUT!':   '#ffd426',
    'BOOM!': '#ff6020', 'MISS!':  '#888888',
  };

  function showImpactWord(options) {
    const word = options[Math.floor(Math.random() * options.length)];
    const el   = document.getElementById('impact-word');
    el.textContent = word;
    el.style.color = IMPACT_COLORS[word] || '#ffffff';
    el.style.textShadow = `0 0 30px ${IMPACT_COLORS[word] || '#fff'}`;
    el.classList.remove('hidden');
    // reset so animation re-triggers
    el.style.animation = 'none';
    void el.offsetWidth; // reflow
    el.style.animation = '';
  }

  function hideImpactWord() {
    document.getElementById('impact-word').classList.add('hidden');
  }

  function showVerdict(text, type) {
    const el = document.getElementById('judge-verdict');
    // Rule warnings show plain; judge verdicts are quoted like a commentator line
    el.textContent = type === 'warn' ? text : `"${text}"`;
    el.className   = `judge-verdict v-${type}`;
    gsap.fromTo(el, { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.35, ease: 'back.out(1.7)' });
  }

  function hideVerdict() {
    const el = document.getElementById('judge-verdict');
    el.className = 'judge-verdict hidden';
  }

  function animateScorePop() {
    const el = document.getElementById('score-value');
    el.textContent = score;
    gsap.fromTo(el,
      { scale: 1.8, color: '#1fe874' },
      { scale: 1,   color: '#ffd426', duration: 0.55, ease: 'back.out(2)' }
    );
  }

  // ── History ────────────────────────────────────────────────────────────────

  // opponentWord = palavra que o jogador teve de vencer
  // playerWord   = resposta digitada pelo jogador
  // roundNum     = número da rodada concluída (score após o ponto)
  function addToHistory(opponentWord, playerWord, roundNum) {
    // 1. Guarda para validação de repetição (a palavra que o jogador usou)
    wordHistory.push(playerWord);

    // 2. Registra o round no log visual
    roundLog.push({ roundNum, opponent: opponentWord, player: playerWord });

    // 3. Atualiza a barra de sequência — mostra só a resposta do jogador
    const chips = document.getElementById('history-chips');

    if (wordHistory.length > 1) {
      const arrow = document.createElement('span');
      arrow.className = 'history-arrow';
      arrow.textContent = '›';
      chips.appendChild(arrow);
    }

    chips.querySelectorAll('.chip-current').forEach(c => c.classList.remove('chip-current'));

    const chip = document.createElement('div');
    chip.className = 'history-chip chip-current';
    chip.textContent = playerWord;
    chips.appendChild(chip);

    gsap.fromTo(chip,
      { opacity: 0, scale: 0.7, y: 5 },
      { opacity: 1, scale: 1,   y: 0, duration: 0.28, ease: 'back.out(2)' }
    );

    chips.scrollLeft = chips.scrollWidth;

    // Trim da barra visual a 7 itens
    const allChips  = chips.querySelectorAll('.history-chip');
    const allArrows = chips.querySelectorAll('.history-arrow');
    if (allChips.length > 7) {
      allChips[0].remove();
      if (allArrows[0]) allArrows[0].remove();
    }

    // 4. Atualiza o contador do botão
    updateHistoryCount();
  }

  function clearHistory() {
    document.getElementById('history-chips').innerHTML = '';
    updateHistoryCount();
    closeDrawer();
  }

  function updateHistoryCount() {
    const total = roundLog.length;
    document.getElementById('history-count').textContent = total;
    const badge = document.getElementById('history-count');
    gsap.fromTo(badge, { scale: 1.5 }, { scale: 1, duration: 0.3, ease: 'back.out(2)' });
  }

  // ── Battle Log Drawer ──────────────────────────────────────────────────────

  function openDrawer() {
    const overlay = document.getElementById('history-overlay');
    const drawer  = document.getElementById('history-drawer');

    renderRoundLog();

    overlay.classList.remove('hidden');
    drawer.classList.remove('hidden');

    requestAnimationFrame(() => {
      overlay.classList.add('visible');
      drawer.classList.add('visible');
    });
  }

  function closeDrawer() {
    const overlay = document.getElementById('history-overlay');
    const drawer  = document.getElementById('history-drawer');

    overlay.classList.remove('visible');
    drawer.classList.remove('visible');

    setTimeout(() => {
      overlay.classList.add('hidden');
      drawer.classList.add('hidden');
    }, 300);
  }

  function renderRoundLog() {
    const container = document.getElementById('drawer-rounds');
    const emptyEl   = document.getElementById('drawer-empty');
    const subtitle  = document.getElementById('drawer-subtitle');

    container.innerHTML = '';

    const total = roundLog.length;

    if (total === 0) {
      subtitle.textContent = 'Nenhuma rodada ainda';
      emptyEl.classList.remove('hidden');
      container.classList.add('hidden');
      return;
    }

    const rodadas = total === 1 ? '1 rodada' : `${total} rodadas`;
    subtitle.textContent = `${rodadas} disputadas`;
    emptyEl.classList.add('hidden');
    container.classList.remove('hidden');

    // Exibe do mais recente para o mais antigo
    [...roundLog].reverse().forEach((entry, i) => {
      const row = document.createElement('div');
      row.className = 'round-entry';

      // Número do round
      const numEl = document.createElement('div');
      numEl.className = 'round-entry-num';
      numEl.innerHTML = `<strong>${entry.roundNum}</strong>RD`;

      // Slot oponente
      const oppSlot = document.createElement('div');
      oppSlot.className = 'round-entry-slot slot-opponent';
      oppSlot.innerHTML =
        `<span class="round-entry-slot-label">Oponente</span>` +
        `<span class="round-entry-slot-word">${entry.opponent}</span>`;

      // VS
      const vsEl = document.createElement('div');
      vsEl.className = 'round-entry-vs';
      vsEl.textContent = 'VS';

      // Slot jogador
      const plySlot = document.createElement('div');
      plySlot.className = 'round-entry-slot slot-player';
      plySlot.innerHTML =
        `<span class="round-entry-slot-label">Sua resposta</span>` +
        `<span class="round-entry-slot-word">${entry.player}</span>`;

      row.appendChild(numEl);
      row.appendChild(oppSlot);
      row.appendChild(vsEl);
      row.appendChild(plySlot);
      container.appendChild(row);

      // Animação escalonada
      gsap.fromTo(row,
        { opacity: 0, x: -16 },
        { opacity: 1, x: 0, duration: 0.25, delay: i * 0.04, ease: 'power2.out' }
      );
    });
  }

  // ── Game Over ──────────────────────────────────────────────────────────────

  function showGameOver(reason) {
    document.getElementById('final-score').textContent = score;

    const rounds = score === 1 ? '1 rodada' : `${score} rodadas`;
    document.getElementById('gameover-info').innerHTML =
      `Você sobreviveu <strong>${rounds}</strong> sem levar KO!<br>
       <em style="color:var(--text-dim);font-size:12px">${reason}</em>`;

    // Animate score reveal
    document.getElementById('final-score').style.transform = 'scale(0)';

    showScreen('gameover');

    gsap.fromTo('#final-score',
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(2)', delay: 0.5 }
    );
  }

  // ── Scene orchestration (cache-aside over the NoSQL store) ──────────────────
  //
  //   1. Read the latest stored scene for the word (SceneStore → IndexedDB).
  //   2. Miss? Ask the AI (AIClient.scene → backend, or mock) and persist it.
  //   3. Render it (Stage). Persistence/backend never block or break gameplay.
  //
  async function paintSceneFor(word) {
    try {
      let doc = await SceneStore.getLatest(word);
      if (!doc) {
        const scene = await AIClient.scene({ word, round, history: [...wordHistory] });
        doc = await SceneStore.put(word, scene, { source: AIClient.config.useMock ? 'mock' : 'ai' });
      }
      Stage.applyScene(doc.scene);
    } catch (err) {
      // Backend/storage hiccup must never stop the match — fall back to the
      // local mock scene (no network), which always resolves synchronously.
      console.warn('[Game] scene fetch/store failed, using local fallback:', err);
      Stage.applyScene(MockAPI.generateScene(word));
    }
  }

  // ── Misc Helpers ───────────────────────────────────────────────────────────

  function ringCenter() {
    const ring = document.getElementById('ring');
    const r    = ring.getBoundingClientRect();
    return { cx: r.left + r.width / 2, cy: r.top + r.height * 0.42 };
  }

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  // ── Public ─────────────────────────────────────────────────────────────────
  return { init };

})();
