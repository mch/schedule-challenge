import { WORDLIST } from './wordlist'
import { stringifyAutomergeUrl } from '@automerge/automerge-repo'
import type { AutomergeUrl, BinaryDocumentId } from '@automerge/automerge-repo'

const WORD_COUNT = 4

/**
 * Returns a random human-readable passphrase made of WORD_COUNT words
 * chosen uniformly from the wordlist using the Web Crypto API.
 */
export function generatePassphrase(): string {
  const randomValues = new Uint32Array(WORD_COUNT)
  crypto.getRandomValues(randomValues)
  return Array.from(randomValues)
    .map((v) => WORDLIST[v % WORDLIST.length])
    .join('-')
}

/**
 * Deterministically derives an Automerge document URL from a passphrase.
 * Uses SHA-256 of the UTF-8 passphrase; takes the first 16 bytes as the
 * binary document ID and encodes it as a bs58check-based Automerge URL.
 */
export async function passphraseToDocId(passphrase: string): Promise<AutomergeUrl> {
  const encoder = new TextEncoder()
  const data = encoder.encode(passphrase)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  // Use first 16 bytes as document ID (same size as a UUID)
  const binaryDocId = new Uint8Array(hashBuffer, 0, 16) as unknown as BinaryDocumentId
  return stringifyAutomergeUrl(binaryDocId)
}
