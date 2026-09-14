import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import path from "node:path";
import fs from "node:fs";
import { DATA_DIR } from "./dataDir.js";

// Fork replacement for upstream's SQLite-backed kv helper (src/lib/db/helpers/kvStore.js).
// The fork rejects the SQLite state DB, so scoped kv lives in its own lowdb file —
// kept out of db.json so high-churn scopes (thought signatures) never touch app state.
const KV_FILE = path.join(DATA_DIR, "kv.json");

let kvInstance = null;
let writeChain = Promise.resolve();

async function getKvDb() {
  if (!kvInstance) {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    kvInstance = new Low(new JSONFile(KV_FILE), {});
  }
  try {
    await kvInstance.read();
  } catch {
    kvInstance.data = {};
  }
  if (!kvInstance.data || typeof kvInstance.data !== "object") kvInstance.data = {};
  return kvInstance;
}

// Serialize writes so concurrent set/remove calls can't clobber each other.
function queueWrite(mutate) {
  writeChain = writeChain.then(async () => {
    const db = await getKvDb();
    mutate(db.data);
    await db.write();
  }).catch(() => {});
  return writeChain;
}

export function makeKv(scope) {
  return {
    async get(key, fallback = null) {
      const db = await getKvDb();
      const bucket = db.data[scope];
      if (!bucket || !(key in bucket)) return fallback;
      return bucket[key];
    },
    async getAll() {
      const db = await getKvDb();
      return { ...(db.data[scope] || {}) };
    },
    async set(key, value) {
      return queueWrite(data => {
        if (!data[scope]) data[scope] = {};
        data[scope][key] = value;
      });
    },
    async setMany(obj) {
      return queueWrite(data => {
        if (!data[scope]) data[scope] = {};
        Object.assign(data[scope], obj);
      });
    },
    async remove(key) {
      return queueWrite(data => {
        if (data[scope]) delete data[scope][key];
      });
    },
    async clear() {
      return queueWrite(data => {
        delete data[scope];
      });
    },
  };
}
