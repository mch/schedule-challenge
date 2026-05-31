/**
 * Creates and returns a singleton Automerge Repo wired up with:
 *   - IndexedDB storage (offline persistence)
 *   - WebSocket sync to sync.home.halfbakery.xyz
 *
 * Call `createRepo()` once at app start (after the Wasm module is ready).
 *
 * ### Database naming
 * We use "craft2026" as the IndexedDB database name (rather than the default
 * "automerge") to avoid collisions with a stale "automerge" DB that may exist
 * in the browser from an earlier run before the schema was established.
 * The adapter always opens at version 1; if the DB already exists at v1
 * without the "documents" store, `onupgradeneeded` never fires and every
 * transaction throws. A distinct name ensures a fresh DB is created with the
 * correct schema.
 */
import { Repo } from '@automerge/automerge-repo'
import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb'
import { BrowserWebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket'

export const SYNC_SERVER_URL = 'wss://sync.home.halfbakery.xyz'

/** IndexedDB database name — distinct from the library default to avoid stale schema issues. */
export const IDB_DATABASE_NAME = 'craft2026'

export function createRepo(): Repo {
  return new Repo({
    storage: new IndexedDBStorageAdapter(IDB_DATABASE_NAME),
    network: [new BrowserWebSocketClientAdapter(SYNC_SERVER_URL)],
  })
}
