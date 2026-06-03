const SYNC_SERVER_KEY = 'craft2026:syncServer'

/** Reads the stored sync server URL from localStorage, or null if not set. */
export function loadSyncServerUrl(): string | null {
  return localStorage.getItem(SYNC_SERVER_KEY)
}

/** Persists the sync server URL to localStorage. */
export function saveSyncServerUrl(url: string): void {
  localStorage.setItem(SYNC_SERVER_KEY, url)
}

/** Removes the stored sync server URL from localStorage. */
export function clearSyncServerUrl(): void {
  localStorage.removeItem(SYNC_SERVER_KEY)
}
