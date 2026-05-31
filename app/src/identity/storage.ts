const PASSPHRASE_KEY = 'craft2026:passphrase'

/** Reads the stored passphrase from localStorage, or null if not set. */
export function loadPassphrase(): string | null {
  return localStorage.getItem(PASSPHRASE_KEY)
}

/** Persists the passphrase to localStorage. */
export function savePassphrase(passphrase: string): void {
  localStorage.setItem(PASSPHRASE_KEY, passphrase)
}

/** Removes the passphrase from localStorage (e.g. for testing / reset). */
export function clearPassphrase(): void {
  localStorage.removeItem(PASSPHRASE_KEY)
}
