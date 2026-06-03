import type { AutomergeUrl } from '@automerge/automerge-repo'
import { useEffect, useState } from 'react'
import { generatePassphrase, passphraseToDocId } from './passphrase'
import { loadPassphrase, savePassphrase } from './storage'

export type IdentityState =
  | { status: 'loading' }
  | { status: 'new' }
  | { status: 'ready'; passphrase: string; docId: AutomergeUrl }

/**
 * Manages passphrase-based identity.
 *
 * - On mount, checks localStorage for an existing passphrase.
 * - If found, derives the doc ID and transitions to 'ready'.
 * - If not found, transitions to 'new' (prompts user to create or enter one).
 *
 * Returns the current identity state plus helpers:
 * - `confirm(passphrase)` — saves the passphrase and derives the doc ID.
 */
export function useIdentity(): {
  identity: IdentityState
  confirm: (passphrase: string) => Promise<void>
  generateNew: () => string
} {
  const [identity, setIdentity] = useState<IdentityState>({ status: 'loading' })

  useEffect(() => {
    const stored = loadPassphrase()
    if (stored) {
      passphraseToDocId(stored).then((docId) => {
        setIdentity({ status: 'ready', passphrase: stored, docId })
      })
    } else {
      setIdentity({ status: 'new' })
    }
  }, [])

  async function confirm(passphrase: string): Promise<void> {
    const trimmed = passphrase.trim()
    const docId = await passphraseToDocId(trimmed)
    savePassphrase(trimmed)
    setIdentity({ status: 'ready', passphrase: trimmed, docId })
  }

  function generateNew(): string {
    return generatePassphrase()
  }

  return { identity, confirm, generateNew }
}
