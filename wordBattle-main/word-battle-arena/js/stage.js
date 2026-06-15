'use strict';
/* ════════════════════════════════════════════════════════════════════════════
   STAGE.JS — The AI-controlled backdrop layer

   This is the ONLY surface the AI is allowed to modify. Everything it generates
   is written inside #ai-stage, which lives at the bottom of the z-index stack
   (var(--z-ai-stage)). Every "immune" element — the ring structure, the two
   fighters and the HUD — sits on a HIGHER layer, so AI changes can NEVER overlap
   or cover them. The AI does not touch the DOM directly; it calls Stage.*.

   Future AI integration (replacing the demo):
     const scene = await AI.describeScene(word);   // AI returns a Scene object
     Stage.applyScene(scene);
   ════════════════════════════════════════════════════════════════════════════ */

const Stage = (() => {

  // ── Protected handles (only these are ever mutated) ─────────────────────────
  const bgEl      = document.getElementById('ai-stage-bg');
  const sceneryEl = document.getElementById('ai-stage-scenery');
  const fogEl     = document.getElementById('ai-stage-fog');
  const fxEl      = document.getElementById('ai-stage-fx');
  const tintEl    = document.getElementById('ai-stage-tint');
  const flashEl   = document.getElementById('ai-stage-flash');
  const root      = document.documentElement;   // holds the --ai-accent token

  // Default backdrop = the original arena image (set in ring.css).
  // reset() restores this exact look.
  const DEFAULT_BG     = "url('assets/images/background.jpg') center 30% / cover no-repeat";
  const DEFAULT_FILTER = 'none';
  const DEFAULT_ACCENT = '#00d4ff';

  // Track spawned nodes so we can kill their GSAP tweens on clear.
  let fxNodes = [];
  let sceneryNodes = [];
  let flashTween = null;

  // ── Backdrop control ────────────────────────────────────────────────────────

  /** Replace the backdrop with any CSS background value (gradient, color, image). */
  function setBackground(css) {
    bgEl.style.background = css;
  }

  /** Apply a CSS filter to the backdrop only (hue-rotate, blur, brightness…). */
  function setFilter(css) {
    bgEl.style.filter = css || 'none';
  }

  // ── Ambient colour wash ─────────────────────────────────────────────────────

  /**
   * Recolour the whole arena mood. Contained to the AI layer (cannot tint the
   * fighters/ring/HUD).
   * @param {object|null} t  - { color, blend?, opacity? } ; null clears it
   */
  function setTint(t) {
    if (!t) { gsap.to(tintEl, { opacity: 0, duration: 0.5 }); return; }
    tintEl.style.background   = t.color;
    tintEl.style.mixBlendMode = t.blend || 'soft-light';
    gsap.to(tintEl, { opacity: t.opacity ?? 0.6, duration: 0.6 });
  }

  // ── Drifting fog / mist ─────────────────────────────────────────────────────

  /** @param {object|null} f - { color, opacity?, speed? } ; null clears it */
  function setFog(f) {
    if (!f) {
      gsap.to(fogEl, { opacity: 0, duration: 0.5,
        onComplete: () => fogEl.classList.remove('is-on') });
      return;
    }
    const c = f.color || 'rgba(180,200,255,0.5)';
    fogEl.style.backgroundImage =
      `radial-gradient(ellipse at center, ${c} 0%, transparent 65%),` +
      `radial-gradient(ellipse at center, ${c} 0%, transparent 60%),` +
      `radial-gradient(ellipse at center, ${c} 0%, transparent 70%)`;
    fogEl.style.animationDuration = `${f.speed ? 30 / f.speed : 30}s`;
    fogEl.classList.add('is-on');
    gsap.to(fogEl, { opacity: f.opacity ?? 0.5, duration: 0.8 });
  }

  // ── Lightning / flash pulses ────────────────────────────────────────────────

  /** @param {object|null} fl - { color?, every? ms } ; null stops it */
  function setFlash(fl) {
    if (flashTween) { flashTween.kill(); flashTween = null; }
    gsap.set(flashEl, { opacity: 0 });
    if (!fl) return;
    flashEl.style.background = fl.color || '#ffffff';
    const every = (fl.every || 3500) / 1000;
    // double-blink, then wait — like a lightning strike
    flashTween = gsap.timeline({ repeat: -1, repeatDelay: every })
      .to(flashEl, { opacity: 0.9, duration: 0.06 })
      .to(flashEl, { opacity: 0.1, duration: 0.06 })
      .to(flashEl, { opacity: 0.7, duration: 0.05 })
      .to(flashEl, { opacity: 0,   duration: 0.35 });
  }

  // ── AI palette token (immune elements opt in to read it) ────────────────────

  /** @param {string|null} color - hex/rgb; null restores the default accent */
  function setAccent(color) {
    root.style.setProperty('--ai-accent', color || DEFAULT_ACCENT);
  }

  // ── CSS scenery (the actual "landscape": mountains, sun, clouds…) ────────────

  /**
   * Build a CSS-only scene out of positioned shapes. No images — every shape is
   * a div styled with gradients / clip-path, so it's cheap to render.
   * @param {Array<object>|null} items  Each item:
   *   { css: string,            // full cssText for the shape (position, size, background…)
   *     drift?: {x?,y?,dur?},   // optional gentle GSAP loop (clouds, haze…)
   *     pulse?: {to?,dur?} }    // optional opacity pulse (glows, suns…)
   */
  function setScenery(items) {
    clearScenery();
    if (!items) return;
    items.forEach(it => {
      const el = document.createElement('div');
      el.style.cssText = it.css;
      sceneryEl.appendChild(el);
      sceneryNodes.push(el);
      if (it.drift) {
        gsap.to(el, {
          x: it.drift.x || 0, y: it.drift.y || 0,
          duration: it.drift.dur || 12, repeat: -1, yoyo: true, ease: 'sine.inOut',
        });
      }
      if (it.pulse) {
        gsap.to(el, {
          opacity: it.pulse.to ?? 0.6,
          duration: it.pulse.dur || 3, repeat: -1, yoyo: true, ease: 'sine.inOut',
        });
      }
    });
  }

  function clearScenery() {
    sceneryNodes.forEach(n => { gsap.killTweensOf(n); n.remove(); });
    sceneryNodes = [];
  }

  // ── Scene elements (floating particles, shapes…) ────────────────────────────

  /**
   * Spawn drifting elements inside the FX layer.
   * @param {object} p
   * @param {number}  [p.count=14]
   * @param {string}  [p.emoji]            - if set, renders this emoji…
   * @param {string}  [p.color='#ffffff']  - …otherwise a glowing dot of this color
   * @param {number[]}[p.size=[6,16]]       - [min,max] px
   * @param {'up'|'down'|'float'} [p.drift='float']
   * @param {number}  [p.speed=1]           - multiplier on drift duration
   */
  function spawnParticles(p = {}) {
    const {
      count = 14, emoji = null, color = '#ffffff',
      size = [6, 16], drift = 'float', speed = 1,
    } = p;

    const W = fxEl.clientWidth || window.innerWidth;
    const H = fxEl.clientHeight || window.innerHeight;

    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      const s  = size[0] + Math.random() * (size[1] - size[0]);
      const x  = Math.random() * W;
      const y  = Math.random() * H;

      if (emoji) {
        el.textContent = emoji;
        el.style.cssText = `font-size:${s * 1.6}px; left:${x}px; top:${y}px; opacity:0;`;
      } else {
        el.style.cssText =
          `width:${s}px; height:${s}px; border-radius:50%;` +
          `background:${color}; box-shadow:0 0 ${s}px ${color};` +
          `left:${x}px; top:${y}px; opacity:0;`;
      }
      fxEl.appendChild(el);
      fxNodes.push(el);

      const dy = drift === 'up' ? -(60 + Math.random() * 120)
               : drift === 'down' ? (60 + Math.random() * 120)
               : (Math.random() - 0.5) * 80;
      const dx = (Math.random() - 0.5) * 60;
      const dur = (3 + Math.random() * 3) / speed;

      gsap.to(el, {
        opacity: 0.7, duration: 0.8,
        onComplete: () => gsap.to(el, { opacity: 0.25, duration: dur, repeat: -1, yoyo: true }),
      });
      gsap.to(el, {
        x: dx, y: dy, duration: dur, repeat: -1, yoyo: true, ease: 'sine.inOut',
        delay: Math.random() * dur,
      });
    }
  }

  // ── Declarative scene application (the main AI entry point) ──────────────────

  /**
   * Apply a full scene. This is what the AI calls. Any system the scene omits is
   * cleared, so each scene fully describes the arena.
   * @param {object} scene
   * @param {string} [scene.background] - CSS background for the backdrop
   * @param {string} [scene.filter]     - CSS filter for the backdrop
   * @param {object} [scene.particles]  - see spawnParticles()
   * @param {object} [scene.tint]       - see setTint()
   * @param {object} [scene.fog]        - see setFog()
   * @param {object} [scene.flash]      - see setFlash()
   * @param {string} [scene.accent]     - palette colour read by immune accents
   */
  function applyScene(scene = {}) {
    clearFx();
    if (scene.background !== undefined) setBackground(scene.background);
    setFilter(scene.filter || 'none');
    setScenery(scene.scenery || null);
    setTint(scene.tint   || null);
    setFog(scene.fog     || null);
    setFlash(scene.flash || null);
    setAccent(scene.accent || null);
    if (scene.particles) spawnParticles(scene.particles);
  }

  // ── Clearing / reset ────────────────────────────────────────────────────────

  /** Remove all spawned scene elements (keeps the current backdrop). */
  function clearFx() {
    fxNodes.forEach(n => { gsap.killTweensOf(n); n.remove(); });
    fxNodes = [];
  }

  /** Restore the original arena backdrop and clear every effect. */
  function reset() {
    clearFx();
    clearScenery();
    setBackground(DEFAULT_BG);
    setFilter(DEFAULT_FILTER);
    setTint(null);
    setFog(null);
    setFlash(null);
    setAccent(null);
  }

  // ── Public API ────────────────────────────────────────────────────────────
  // Stage is a PURE RENDERER. It does not decide WHAT to show (that's the AI /
  // MockAPI.generateScene) nor WHERE scenes are stored (that's SceneStore).
  // It only knows how to paint a Scene object onto #ai-stage.
  return {
    setBackground, setFilter, setScenery, setTint, setFog, setFlash, setAccent,
    spawnParticles, applyScene,
    clearFx, reset,
  };

})();
