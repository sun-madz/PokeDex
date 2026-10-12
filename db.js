/* PokéLog — local storage layer (IndexedDB).
   Photos are large, so we use IndexedDB instead of localStorage (which caps at ~5 MB).
   Everything stays on the device in this browser. */
const DB = (() => {
  const NAME = 'pokelog';
  const VERSION = 1;
  const STORE = 'sightings';
  let dbPromise = null;

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(NAME, VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => { dbPromise = null; reject(req.error); };
    });
    return dbPromise;
  }

  async function run(mode, fn) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = fn(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req ? req.result : undefined);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  return {
    all: () => run('readonly', (s) => s.getAll()),
    get: (id) => run('readonly', (s) => s.get(id)),
    put: (entry) => run('readwrite', (s) => s.put(entry)),
    remove: (id) => run('readwrite', (s) => s.delete(id)),
    clear: () => run('readwrite', (s) => s.clear()),
  };
})();
