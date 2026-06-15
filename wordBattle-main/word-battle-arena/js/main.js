'use strict';
/* ════════════════════════════════════════════════════════════════════════════
   MAIN.JS — Entry point: boot animations and game initialization
   ════════════════════════════════════════════════════════════════════════════ */

window.addEventListener('DOMContentLoaded', () => {

  // ── Initialize game ──────────────────────────────────────────────────────
  Game.init();

  // ── Show intro screen ────────────────────────────────────────────────────
  const intro = document.getElementById('screen-intro');
  intro.classList.add('active');

  // ── Staggered entrance animations ────────────────────────────────────────
  const tl = gsap.timeline({ delay: 0.1 });

  tl.fromTo('.intro-logo',
    { y: -60, opacity: 0, scale: 0.85 },
    { y: 0,   opacity: 1, scale: 1,    duration: 0.7, ease: 'back.out(1.6)' }
  );
  tl.fromTo('.intro-arena',
    { y: 20, opacity: 0, letterSpacing: '40px' },
    { y: 0,  opacity: 1, letterSpacing: '22px', duration: 0.6, ease: 'power3.out' },
    '-=0.35'
  );
  tl.fromTo('.intro-desc',
    { opacity: 0, y: 10 },
    { opacity: 1, y: 0,  duration: 0.45, ease: 'power2.out' },
    '-=0.2'
  );
  tl.fromTo('.intro-rules',
    { opacity: 0, y: 10 },
    { opacity: 1, y: 0,  duration: 0.4, ease: 'power2.out' },
    '-=0.1'
  );
  tl.fromTo('#btn-start',
    { opacity: 0, y: 18, scale: 0.9 },
    { opacity: 1, y: 0,  scale: 1,    duration: 0.5, ease: 'back.out(2)' },
    '-=0.1'
  );

  // ── Intro sound ──────────────────────────────────────────────────────────
  tl.call(() => Sounds.intro(), null, 0.2);

  // ── Ambient gloves bobbing on intro (already CSS animated) ───────────────

  // ── Keyboard shortcut hint ───────────────────────────────────────────────
  // Players can press Enter to submit — already wired in game.js
  // Pressing Escape clears the input
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const input = document.getElementById('player-input');
      if (!input.disabled) {
        input.value = '';
        document.getElementById('btn-submit').disabled = true;
      }
    }
  });

});
