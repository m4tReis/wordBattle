'use strict';
/* ════════════════════════════════════════════════════════════════════════════
   SCENE-STORE.JS — Persistence layer for the AI's front-end changes

   The AI's backdrop changes are stored as DOCUMENTS in a NoSQL store. For now
   that store is the browser's native document database — IndexedDB — so it works
   fully on the front with zero backend and survives page reloads.

   The public API is intentionally shaped like a remote NoSQL SDK (async,
   document in / document out). When the real backend exists, only the driver
   below changes — every call site (game.js) stays identical:

     // Firestore example (later):
     //   put(word, scene, meta) -> addDoc(collection(db,'scenes'), doc)
     //   getLatest(word)        -> query(coll, where('sceneKey','==',k),
     //                                    orderBy('createdAt','desc'), limit(1))

   Document shape:
     { id, word, sceneKey, scene, source, createdAt }
   ════════════════════════════════════════════════════════════════════════════ */

const SceneStore = (() => {

  const DB_NAME    = 'word-battle-arena';
  const DB_VERSION = 1;
  const STORE      = 'scenes';

  let dbPromise = null;
  const memory  = [];   // in-memory fallback if IndexedDB is unavailable
  let memSeq    = 0;

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function normalizeWord(w) {
    return (w || '').toLowerCase().trim()
      .normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function reqP(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror   = () => reject(request.error);
    });
  }

  // ── Driver: IndexedDB (swap this block for a remote NoSQL SDK later) ─────────

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) { reject(new Error('IndexedDB unsupported')); return; }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const os = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
          os.createIndex('by_word',    'sceneKey',  { unique: false });
          os.createIndex('by_created', 'createdAt', { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    }).catch(err => {
      console.warn('[SceneStore] IndexedDB unavailable — using in-memory store:', err.message);
      return null;   // signals fallback
    });
    return dbPromise;
  }

  function store(db, mode) {
    return db.transaction(STORE, mode).objectStore(STORE);
  }

  // ── Public API (NoSQL-shaped, all async) ─────────────────────────────────────

  /**
   * Persist a scene the AI produced for a word. Returns the stored document.
   * @param {string} word
   * @param {object} scene  - { background?, filter?, particles? }
   * @param {object} [meta] - { source?: 'ai'|'demo'|'manual', createdAt?: number }
   */
  async function put(word, scene, meta = {}) {
    const doc = {
      word,
      sceneKey:  normalizeWord(word),
      scene,
      source:    meta.source    || 'ai',
      createdAt: meta.createdAt || Date.now(),
    };
    const db = await openDB();
    if (!db) { doc.id = ++memSeq; memory.push(doc); return doc; }
    doc.id = await reqP(store(db, 'readwrite').add(doc));
    return doc;
  }

  /** Most recent scene document for a word, or null. (cache-aside read) */
  async function getLatest(word) {
    const key = normalizeWord(word);
    const db  = await openDB();
    if (!db) {
      const hits = memory.filter(d => d.sceneKey === key);
      return hits.length ? hits[hits.length - 1] : null;
    }
    const docs = await reqP(store(db, 'readonly').index('by_word').getAll(key));
    if (!docs.length) return null;
    return docs.reduce((a, b) => (b.createdAt > a.createdAt ? b : a));
  }

  /** All stored versions for a word, oldest → newest. */
  async function history(word) {
    const key = normalizeWord(word);
    const db  = await openDB();
    const docs = db
      ? await reqP(store(db, 'readonly').index('by_word').getAll(key))
      : memory.filter(d => d.sceneKey === key);
    return docs.sort((a, b) => a.createdAt - b.createdAt);
  }

  /** Every document in the store (for debugging / inspection). */
  async function all() {
    const db = await openDB();
    if (!db) return memory.slice();
    return reqP(store(db, 'readonly').getAll());
  }

  /** Wipe the store. */
  async function clear() {
    const db = await openDB();
    if (!db) { memory.length = 0; memSeq = 0; return; }
    await reqP(store(db, 'readwrite').clear());
  }

  return { put, getLatest, history, all, clear };

})();
