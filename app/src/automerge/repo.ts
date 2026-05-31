/**
 * Creates and returns a singleton Automerge Repo wired up with:
 *   - IndexedDB storage (offline persistence)
 *   - WebSocket sync to sync.home.halfbakery.xyz
 *
 * Call `createRepo()` once at app start (after the Wasm module is ready).
 */
import { Repo } from '@automerge/automerge-repo'
import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb'
import { BrowserWebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket'

export const SYNC_SERVER_URL = 'wss://sync.home.halfbakery.xyz'

export function createRepo(): Repo {
  return new Repo({
    storage: new IndexedDBStorageAdapter(),
    network: [new BrowserWebSocketClientAdapter(SYNC_SERVER_URL)],
  })
}
