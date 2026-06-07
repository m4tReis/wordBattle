'use strict';
/* ════════════════════════════════════════════════════════════════════════════
   FIGHTERS.JS — Fighter class with GSAP animations + particle effects

   ARM GEOMETRY (pivot = top / shoulder):
   • 0° = arm pointing straight DOWN
   • Positive rotation (clockwise) swings the glove toward the RIGHT
   • For left fighter facing right → positive rotation → glove toward opponent ✓
   • Right fighter body has scaleX:-1 set via GSAP, so in that mirrored space,
     the same positive rotation appears counterclockwise on screen,
     meaning glove goes toward the LEFT (opponent) ✓
   ════════════════════════════════════════════════════════════════════════════ */

// Boxing guard angles (degrees, top/shoulder pivot via CSS/GSAP rotate).
// In CSS rotate(θ) with transform-origin: top center:
//   Negative θ = glove swings to the RIGHT from straight-down
//   Positive θ = glove swings to the LEFT  from straight-down
// LEFT fighter  faces RIGHT → needs glove going RIGHT → negative values ✓
// RIGHT fighter body has scaleX:-1 → same negative values appear mirrored → glove goes LEFT ✓
const ARM_LEAD = -82;   // lead arm nearly horizontal toward opponent
const ARM_REAR = -52;   // rear arm in guard, slightly less extended

class Fighter {
  constructor(side) {
    this.side  = side;
    this.homeX = side === 'left' ? -240 : 240;

    // DOM refs
    this.root    = document.getElementById(`fc-${side}`);
    this.label   = document.getElementById(`label-${side}`);
    this.body    = document.getElementById(`body-${side}`);
    this.head    = document.getElementById(`head-${side}`);
    this.display = document.getElementById(`display-${side}`);
    this.armLead = document.getElementById(`arm-lead-${side}`);
    this.armRear = document.getElementById(`arm-rear-${side}`);
    this.legA    = document.getElementById(`leg-a-${side}`);
    this.legB    = document.getElementById(`leg-b-${side}`);
    this.shadow  = this.root.querySelector('.fighter-shadow');

    // Media sub-elements
    this.qMark   = document.getElementById(`q-${side}`);
    this.mediaEl = document.getElementById(`media-${side}`);
    this.imgEl   = document.getElementById(`img-${side}`);
    this.emojiEl = document.getElementById(`emoji-${side}`);
    this.wordLbl = document.getElementById(`wlabel-${side}`);

    // Tween refs
    this._idle  = null;
    this._idleL = null;
    this._idleR = null;
    this._walk  = null;

    this._initPosition();
  }

  // ─────────────────────────────────────────────────────────────── Init ────

  _initPosition() {
    // Position the root container
    gsap.set(this.root, {
      xPercent: -50, x: this.homeX, y: 0, rotation: 0, opacity: 0,
    });

    // RIGHT fighter: GSAP owns the scaleX:-1 so subsequent body tweens
    // (y, rotation) preserve it without fighting the CSS.
    // LEFT fighter: explicit scaleX:1 so GSAP tracks it too.
    gsap.set(this.body, {
      scaleX: this.side === 'right' ? -1 : 1,
      y: 0, rotation: 0,
    });

    // Arms in boxing guard (pivot at top/shoulder)
    gsap.set(this.armLead, {
      rotation: ARM_LEAD, y: 0, transformOrigin: 'top center',
    });
    gsap.set(this.armRear, {
      rotation: ARM_REAR, y: 0, transformOrigin: 'top center',
    });
  }

  // ────────────────────────────────────────────────────── Appearance ────

  enter(delay = 0) {
    const fromX = this.side === 'left' ? this.homeX - 380 : this.homeX + 380;
    gsap.set(this.root, { x: fromX, opacity: 0 });
    return new Promise(resolve =>
      gsap.to(this.root, {
        x: this.homeX, opacity: 1, duration: 0.65,
        ease: 'back.out(1.5)', delay, onComplete: resolve,
      })
    );
  }

  exit(delay = 0) {
    return new Promise(resolve =>
      gsap.to(this.root, { opacity: 0, duration: 0.3, delay, onComplete: resolve })
    );
  }

  // ─────────────────────────────────────────── Idle (boxing bob) ────

  startIdle() {
    this.stopIdle();

    // Head bobs up/down gently
    this._idle = gsap.to(this.head, {
      y: -5, duration: 0.52, repeat: -1, yoyo: true, ease: 'sine.inOut',
    });

    // Lead arm oscillates loosely around guard position
    // (ARM_LEAD = -82, oscillate toward -72 = slightly less extended)
    this._idleL = gsap.to(this.armLead, {
      rotation: ARM_LEAD + 10, duration: 0.65,
      repeat: -1, yoyo: true, ease: 'sine.inOut',
    });

    // Rear arm subtle guard movement, offset phase
    this._idleR = gsap.to(this.armRear, {
      rotation: ARM_REAR + 8, duration: 0.80,
      repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 0.2,
    });

    // Shadow breathes with body
    gsap.to(this.shadow, {
      scaleX: 1.1, scaleY: 0.9, opacity: 0.5,
      duration: 0.52, repeat: -1, yoyo: true, ease: 'sine.inOut',
    });
  }

  stopIdle() {
    if (this._idle)  { this._idle.kill();  this._idle  = null; }
    if (this._idleL) { this._idleL.kill(); this._idleL = null; }
    if (this._idleR) { this._idleR.kill(); this._idleR = null; }
    if (this._walk)  { this._walk.kill();  this._walk  = null; }
    gsap.killTweensOf(this.shadow);

    gsap.set(this.head,    { y: 0, rotation: 0, clearProps: 'filter' });
    gsap.set(this.armLead, { rotation: ARM_LEAD,  y: 0 });
    gsap.set(this.armRear, { rotation: ARM_REAR, y: 0 });
    gsap.set(this.shadow,  { scaleX: 1, scaleY: 1, opacity: 0.7 });
  }

  // ───────────────────────────────────────────── Walk / Faceoff ────

  walkToCenter(duration = 0.72) {
    this.stopIdle();
    const targetX = this.side === 'left' ? -70 : 70;
    this._walk = gsap.timeline();

    // Body glide
    this._walk.to(this.root, {
      x: targetX, duration: duration, ease: 'power2.inOut',
    }, 0);

    // Alternating legs (scale to fit duration)
    // E.g., if duration is 2.4s, we might want more steps, but we can just stretch the time
    // Let's dynamically calculate step length so they always take 4 steps
    const stepDur = duration / 8;
    for (let i = 0; i < 4; i++) {
      const t = i * stepDur * 2;
      this._walk.to(this.legA, { rotation:  20, duration: stepDur, ease: 'sine.inOut' }, t);
      this._walk.to(this.legA, { rotation: -10, duration: stepDur, ease: 'sine.inOut' }, t + stepDur);
      this._walk.to(this.legB, { rotation: -10, duration: stepDur, ease: 'sine.inOut' }, t);
      this._walk.to(this.legB, { rotation:  20, duration: stepDur, ease: 'sine.inOut' }, t + stepDur);
    }

    // Arms pump in guard while walking
    this._walk.to(this.armLead, {
      rotation: ARM_LEAD - 15,
      duration: duration / 2, yoyo: true, repeat: 1, ease: 'sine.inOut',
    }, 0);

    // Body bob
    this._walk.to(this.body, {
      y: -4, duration: duration / 6, yoyo: true, repeat: 5, ease: 'sine.inOut',
    }, 0);

    return new Promise(resolve => {
      this._walk.eventCallback('onComplete', resolve);
    });
  }

  walkHome() {
    this.stopIdle();
    return new Promise(resolve => {
      const tl = gsap.timeline({ onComplete: resolve });
      tl.to(this.root, { x: this.homeX, duration: 0.45, ease: 'power2.inOut' });
      tl.to([this.legA, this.legB], { rotation: 0, duration: 0.2 }, 0);
      tl.to(this.body, { y: 0, duration: 0.2 }, 0);
    });
  }

  // ────────────────────────────────────── Hook Punch (Gancho) ────

  punch() {
    return new Promise(resolve => {
      const tl = gsap.timeline({ onComplete: resolve });

      // 1. Wind-up: pull arm back from guard (less negative = less extended toward opponent)
      tl.to(this.armLead, {
        rotation: ARM_LEAD + 18,   // e.g. -82+18 = -64 (arm pulled back)
        duration: 0.10, ease: 'power2.in',
      });

      // 2. Hook SWEEP: arm arcs all the way inward past center (gancho)
      //    Goes from pulled-back (-64) sweeping clockwise to +35 (glove crosses to other side)
      //    This is a ~100° arc = visually convincing hook
      tl.to(this.armLead, {
        rotation: 35,              // glove swings past body center — full hook arc
        duration: 0.18, ease: 'power3.out',
      });

      // Lean body into the hook simultaneously
      tl.to(this.body, {
        rotation: 16,
        duration: 0.18, ease: 'power3.out',
      }, '-=0.18');

      // Rear arm tucks as hook mechanics require
      tl.to(this.armRear, {
        rotation: ARM_REAR + 12,
        duration: 0.14, ease: 'power2.out',
      }, '-=0.18');

      // 3. Smooth return to guard
      tl.to(this.armLead, {
        rotation: ARM_LEAD,
        duration: 0.26, ease: 'back.out(1.8)',
      });
      tl.to(this.body, {
        rotation: 0,
        duration: 0.22, ease: 'power2.out',
      }, '-=0.24');
      tl.to(this.armRear, {
        rotation: ARM_REAR,
        duration: 0.20, ease: 'power2.out',
      }, '-=0.22');
    });
  }

  // ──────────────────────────────────────── Receive Damage ────
  //
  //  Only moves this.root (pushed back) and this.head.
  //  Arms flail — same on both fighters, independent of attacker.

  getHit() {
    return new Promise(resolve => {
      const dir = this.side === 'left' ? -1 : 1;
      const cx  = this.side === 'left' ? -70 : 70;
      const tl  = gsap.timeline({ onComplete: resolve });

      // Pushed back on impact
      tl.to(this.root, {
        x: cx + dir * 34,
        duration: 0.06, ease: 'power4.out',
      });

      // Head snaps sideways + white flash
      tl.to(this.head, {
        rotation: dir * 20, y: -10, duration: 0.06,
      }, 0);
      tl.to(this.head, {
        filter: 'brightness(6) contrast(2) saturate(0)', duration: 0.04,
      }, 0);
      tl.to(this.head, {
        filter: 'brightness(1) contrast(1) saturate(1)', duration: 0.20,
      });

      // Arms flail from impact
      tl.to(this.armLead, { rotation: ARM_LEAD + 40, duration: 0.06 }, 0);
      tl.to(this.armRear, { rotation: ARM_REAR + 30, duration: 0.06 }, 0);

      // Recover root
      tl.to(this.root, {
        x: cx, duration: 0.28, ease: 'elastic.out(1.1, 0.4)',
      });
      tl.to(this.head, {
        rotation: 0, y: 0, duration: 0.22, ease: 'power2.out',
      }, '-=0.26');

      // Arms return to guard
      tl.to(this.armLead, {
        rotation: ARM_LEAD, duration: 0.24, ease: 'back.out(1.5)',
      }, '-=0.24');
      tl.to(this.armRear, {
        rotation: ARM_REAR, duration: 0.22, ease: 'back.out(1.5)',
      }, '-=0.22');
    });
  }

  // ──────────────────────────────────────────────── Knockout ────

  knockout() {
    this.stopIdle();
    return new Promise(resolve => {
      const flyX = this.side === 'left' ? -1400 : 1400;
      const spin = this.side === 'left' ? -300  : 300;
      const cx   = this.side === 'left' ? -70   : 70;
      const tl   = gsap.timeline({ onComplete: resolve });

      // Stagger back
      tl.to(this.root, {
        x: cx + (this.side === 'left' ? -22 : 22),
        duration: 0.07, ease: 'power2.out',
      });
      tl.to(this.head, {
        rotation: this.side === 'left' ? -24 : 24, y: -14, duration: 0.07,
      }, 0);

      // Arms fling up on KO
      tl.to([this.armLead, this.armRear], {
        rotation: 0, y: -20, duration: 0.08, ease: 'power4.out',
      }, 0);

      // Fly off screen
      tl.to(this.root, {
        x: flyX, y: 120, rotation: spin,
        duration: 0.72, ease: 'power3.in',
      });
      tl.to(this.root, { opacity: 0, duration: 0.22 }, '-=0.22');
    });
  }

  // ──────────────────────────────────────────────── Celebrate ────

  celebrate() {
    return new Promise(resolve => {
      const tl = gsap.timeline({ onComplete: resolve });

      // Jump with arms raised high in a "V" victory pose
      // 0 = down, -180 = straight up.
      // -150 = up and forward, +150 = up and backward
      tl.to(this.root,    { y: -55, duration: 0.28, ease: 'power2.out' });
      tl.to(this.armLead, { rotation: -150, y: 0, duration: 0.22 }, 0);
      tl.to(this.armRear, { rotation: 150,  y: 0, duration: 0.22 }, 0);

      // Land
      tl.to(this.root, { y: 0, duration: 0.38, ease: 'bounce.out' });

      // Second smaller jump
      tl.to(this.root, { y: -22, duration: 0.15, ease: 'power2.out', yoyo: true, repeat: 1 });

      // Return arms to guard
      tl.to(this.armLead, {
        rotation: ARM_LEAD, duration: 0.28, ease: 'back.out(1.5)',
      }, '-=0.28');
      tl.to(this.armRear, {
        rotation: ARM_REAR, duration: 0.28, ease: 'back.out(1.5)',
      }, '-=0.28');
    });
  }

  // ──────────────────────────────────── Block-Head content ────

  showQuestion() {
    gsap.killTweensOf(this.qMark);
    this.qMark.style.display = 'flex';
    this.mediaEl.classList.add('hidden');
    this.label.textContent = '?';
    gsap.to(this.qMark, {
      scale: 1.1, duration: 0.5, repeat: -1, yoyo: true, ease: 'sine.inOut',
    });
  }

  showWord(word, media) {
    gsap.killTweensOf(this.qMark);
    this.label.textContent = word.toUpperCase();
    return new Promise(resolve => {
      const tl = gsap.timeline({ onComplete: resolve });
      tl.to(this.head, { scaleX: 0, duration: 0.13, ease: 'power2.in' });
      tl.call(() => this._applyMedia(word, media));
      tl.to(this.head, { scaleX: 1, duration: 0.18, ease: 'back.out(2)' });
    });
  }

  setWordInstant(word, media) {
    this.label.textContent = word.toUpperCase();
    this._applyMedia(word, media);
  }

  _applyMedia(word, media) {
    this.qMark.style.display = 'none';
    this.mediaEl.classList.remove('hidden');
    this.imgEl.style.display   = 'none';
    this.emojiEl.style.display = 'none';
    this.wordLbl.style.display = 'none';

    if (media?.imageUrl) {
      this.imgEl.src           = media.imageUrl;
      this.imgEl.style.display = 'block';
    } else if (media?.emoji) {
      this.emojiEl.textContent   = media.emoji;
      this.emojiEl.style.display = 'flex';
      this.wordLbl.textContent   = word.toUpperCase();
      this.wordLbl.style.display = 'block';
    } else {
      this.emojiEl.textContent   = '❓';
      this.emojiEl.style.display = 'flex';
      this.wordLbl.textContent   = word.toUpperCase();
      this.wordLbl.style.display = 'block';
    }
  }

  // ─────────────────────────────────────────────────── Reset ────

  reset() {
    this.stopIdle();
    gsap.killTweensOf(this.root);
    gsap.killTweensOf(this.head);
    gsap.killTweensOf(this.armLead);
    gsap.killTweensOf(this.armRear);
    gsap.killTweensOf([this.legA, this.legB]);
    gsap.killTweensOf(this.body);

    // Root position
    gsap.set(this.root, {
      xPercent: -50, x: this.homeX, y: 0, rotation: 0, opacity: 1,
    });

    // Body — preserve scaleX so GSAP keeps tracking it
    gsap.set(this.body, {
      scaleX: this.side === 'right' ? -1 : 1,
      y: 0, rotation: 0,
    });

    gsap.set(this.head, { y: 0, rotation: 0, scaleX: 1, filter: 'none' });

    // Arms back to boxing guard
    gsap.set(this.armLead, { rotation: ARM_LEAD, y: 0, transformOrigin: 'top center' });
    gsap.set(this.armRear, { rotation: ARM_REAR, y: 0, transformOrigin: 'top center' });

    gsap.set(this.legA,   { rotation: 0 });
    gsap.set(this.legB,   { rotation: 0 });
    gsap.set(this.shadow, { scaleX: 1, scaleY: 1, opacity: 0.7 });
  }
}

// ══════════════════════════════════════════════════════ PARTICLES ════

function spawnParticles(x, y, color = '#ff3060', count = 14) {
  const container = document.getElementById('particles');
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'particle';
    const size = 4 + Math.random() * 9;
    el.style.cssText = `
      width:${size}px; height:${size}px;
      background:${color};
      left:${x}px; top:${y}px;
      box-shadow:0 0 6px ${color};
    `;
    container.appendChild(el);
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const dist  = 50 + Math.random() * 130;
    gsap.to(el, {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist - 30,
      opacity: 0, scale: 0,
      duration: 0.55 + Math.random() * 0.35,
      ease: 'power2.out',
      onComplete: () => el.remove(),
    });
  }
}

function spawnStars(x, y, count = 7) {
  const container = document.getElementById('particles');
  const EMOJIS = ['💥', '⭐', '✨', '⚡', '💫'];
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'particle-star';
    el.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    el.style.cssText = `
      font-size:${18 + Math.random() * 22}px;
      left:${x - 16}px; top:${y - 16}px;
      position:absolute; pointer-events:none; user-select:none; z-index:200;
    `;
    container.appendChild(el);
    const angle = (Math.PI * 2 * i) / count;
    gsap.to(el, {
      x: Math.cos(angle) * (55 + Math.random() * 100),
      y: Math.sin(angle) * (55 + Math.random() * 100) - 20,
      opacity: 0, scale: 0.5,
      rotation: (Math.random() - 0.5) * 360,
      duration: 0.7 + Math.random() * 0.4,
      ease: 'power2.out',
      onComplete: () => el.remove(),
    });
  }
}

function screenFlash() {
  const el = document.createElement('div');
  el.className = 'screen-flash';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 350);
}
