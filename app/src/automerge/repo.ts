/**
 * Creates and returns a singleton Automerge Repo wired up with:
 *   - IndexedDB storage (offline persistence)
 *   - WebSocket sync to a configurable sync server
 *
 * Call `createRepo(url)` once at app start (after the Wasm module is ready).
 * If no URL is provided the public Automerge sync server is used.
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
import { BrowserWebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket'
import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb'

/** The public Automerge sync server — free to use but data is not encrypted. */
export const PUBLIC_SYNC_SERVER_URL = 'wss://sync.automerge.org'

/** The private halfbakery sync server. */
export const HALFBAKERY_SYNC_SERVER_URL = 'wss://sync.home.halfbakery.xyz'

/**
 * @deprecated Use PUBLIC_SYNC_SERVER_URL or HALFBAKERY_SYNC_SERVER_URL instead.
 * Kept for backwards compatibility with existing tests.
 */
export const SYNC_SERVER_URL = HALFBAKERY_SYNC_SERVER_URL

/** IndexedDB database name — distinct from the library default to avoid stale schema issues. */
export const IDB_DATABASE_NAME = 'craft2026'

export interface RepoWithAdapter {
  repo: Repo
  /** The WebSocket network adapter wired to the repo (can be queried for connection status). */
  networkAdapter: BrowserWebSocketClientAdapter
}

/**
 * Creates a Repo using the given sync server URL.
 * Defaults to the public Automerge sync server if no URL is supplied.
 * Returns both the Repo and the network adapter so callers can observe connection status.
 */
export function createRepo(
  syncServerUrl: string = PUBLIC_SYNC_SERVER_URL,
): RepoWithAdapter {
  const networkAdapter = new BrowserWebSocketClientAdapter(syncServerUrl)
  const repo = new Repo({
    storage: new IndexedDBStorageAdapter(IDB_DATABASE_NAME),
    network: [networkAdapter],
  })
  return { repo, networkAdapter }
}
