'use strict';
/* ════════════════════════════════════════════════════════════════════════════
   SOUNDS.JS — Synthesized sound effects via Web Audio API
   ════════════════════════════════════════════════════════════════════════════ */

const Sounds = (() => {
  let _ctx = null;
  let _master = null;
  let _enabled = true;

  function ctx() {
    if (!_ctx) {
      _ctx = new (window.AudioContext || window.webkitAudioContext)();
      _master = _ctx.createGain();
      _master.gain.value = 0.65;
      _master.connect(_ctx.destination);
    }
    if (_ctx.state === 'suspended') _ctx.resume();
    return _ctx;
  }

  // ── Primitive builders ──────────────────────────────────────────────────────
  function tone({ freq = 440, type = 'sine', vol = 0.5, dur = 0.3,
                  freqEnd = null, delay = 0, attack = 0.01 } = {}) {
    if (!_enabled) return;
    const c = ctx();
    const t = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(_master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function noise({ vol = 0.3, dur = 0.2, delay = 0, filterFreq = 1200,
                   filterType = 'lowpass' } = {}) {
    if (!_enabled) return;
    const c = ctx();
    const t = c.currentTime + delay;
    const size = Math.ceil(c.sampleRate * dur);
    const buf = c.createBuffer(1, size, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const filt = c.createBiquadFilter();
    filt.type = filterType;
    filt.frequency.value = filterFreq;
    const gain = c.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filt);
    filt.connect(gain);
    gain.connect(_master);
    src.start(t);
    src.stop(t + dur);
  }

  // ── Sound effects ───────────────────────────────────────────────────────────
  return {
    setEnabled(v) { _enabled = v; },
    toggle() { _enabled = !_enabled; return _enabled; },

    /** Startup / logo hit */
    intro() {
      noise({ vol: 0.4, dur: 0.4, filterFreq: 600 });
      tone({ freq: 180, type: 'sine', vol: 0.5, dur: 0.6, freqEnd: 60 });
    },

    /** UI click */
    click() {
      tone({ freq: 900, type: 'sine', vol: 0.25, dur: 0.06 });
    },

    /** Input submit (player sends word) */
    submit() {
      tone({ freq: 360, type: 'sine', vol: 0.3, dur: 0.1 });
      tone({ freq: 540, type: 'sine', vol: 0.2, dur: 0.1, delay: 0.08 });
    },

    /** Block flip reveal */
    reveal() {
      noise({ vol: 0.15, dur: 0.12, filterFreq: 3000 });
      tone({ freq: 280, type: 'sine', vol: 0.15, dur: 0.18, freqEnd: 560 });
    },

    /** Tense faceoff sting */
    faceoff() {
      tone({ freq: 100, type: 'sawtooth', vol: 0.2, dur: 0.5 });
      tone({ freq: 50,  type: 'sine',     vol: 0.3, dur: 0.5 });
    },

    /** Tension drum roll for slow walk */
    drumRoll() {
      // Simulate heartbeat/war drums getting faster
      for (let i = 0; i < 8; i++) {
        const delay = i * 0.3; 
        noise({ vol: 0.5, dur: 0.15, filterFreq: 150 + i * 20, delay: delay });
        tone({ freq: 60, type: 'sine', vol: 0.6, dur: 0.2, delay: delay });
      }
    },

    /** Regular punch */
    punch() {
      noise({ vol: 0.6, dur: 0.14, filterFreq: 500 });
      tone({ freq: 90, type: 'sine', vol: 0.5, dur: 0.18, freqEnd: 45 });
    },

    /** Heavy KO punch */
    heavyPunch() {
      noise({ vol: 0.9, dur: 0.22, filterFreq: 700 });
      tone({ freq: 70,  type: 'sine',     vol: 0.7, dur: 0.3, freqEnd: 30 });
      tone({ freq: 200, type: 'sawtooth', vol: 0.2, dur: 0.1, delay: 0.04 });
    },

    /** Hit reaction */
    hit() {
      noise({ vol: 0.45, dur: 0.08, filterFreq: 900 });
      tone({ freq: 160, type: 'square', vol: 0.3, dur: 0.1, freqEnd: 80 });
    },

    /** KO impact + crowd react */
    knockout() {
      noise({ vol: 0.9, dur: 0.35, filterFreq: 1200 });
      tone({ freq: 110, type: 'sine',     vol: 0.8, dur: 0.6, freqEnd: 25 });
      // Crowd "Ohhh"
      tone({ freq: 380, type: 'sine', vol: 0.12, dur: 1.2, freqEnd: 200, delay: 0.3 });
      tone({ freq: 420, type: 'sine', vol: 0.10, dur: 1.0, freqEnd: 180, delay: 0.4 });
    },

    /** Victory fanfare */
    victory() {
      const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
      notes.forEach((f, i) => {
        tone({ freq: f, type: 'triangle', vol: 0.45, dur: 0.35, delay: i * 0.1 });
      });
    },

    /** Crowd cheer burst */
    crowdCheer() {
      for (let i = 0; i < 10; i++) {
        const f = 180 + Math.random() * 700;
        noise({ vol: 0.12, dur: 0.08 + Math.random() * 0.18, filterFreq: f, delay: i * 0.04 });
      }
    },

    /** Ambient crowd murmur */
    crowd() {
      [150, 190, 230, 290].forEach((f, i) => {
        tone({ freq: f, type: 'sine', vol: 0.05, dur: 2.5, delay: i * 0.12 });
      });
    },

    /** Score increases */
    scoreUp() {
      tone({ freq: 880,  type: 'sine', vol: 0.3, dur: 0.1 });
      tone({ freq: 1100, type: 'sine', vol: 0.25, dur: 0.12, delay: 0.1 });
    },

    /** Game over / losing */
    lose() {
      const notes = [523, 440, 370, 311];
      notes.forEach((f, i) => {
        tone({ freq: f, type: 'triangle', vol: 0.38, dur: 0.45, delay: i * 0.22 });
      });
    },

    /** Per-keystroke tick */
    type() {
      tone({ freq: 550 + Math.random() * 180, type: 'sine', vol: 0.07, dur: 0.04 });
    },
  };
})();
