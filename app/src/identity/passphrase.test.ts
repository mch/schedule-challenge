import { describe, expect, it } from 'vitest'
import { generatePassphrase, passphraseToDocId } from './passphrase'
import { WORDLIST } from './wordlist'

describe('generatePassphrase', () => {
  it('returns a string', () => {
    expect(typeof generatePassphrase()).toBe('string')
  })

  it('returns exactly 4 words separated by hyphens', () => {
    const parts = generatePassphrase().split('-')
    expect(parts).toHaveLength(4)
  })

  it('every word is in the wordlist', () => {
    const parts = generatePassphrase().split('-')
    for (const word of parts) {
      expect(WORDLIST).toContain(word)
    }
  })

  it('produces different passphrases on each call (with overwhelming probability)', () => {
    const results = new Set(
      Array.from({ length: 20 }, () => generatePassphrase()),
    )
    // All 20 should be unique — collision probability is negligibly small
    expect(results.size).toBe(20)
  })
})

describe('passphraseToDocId', () => {
  it('returns a string starting with "automerge:"', async () => {
    const url = await passphraseToDocId('test-passphrase')
    expect(url).toMatch(/^automerge:/)
  })

  it('is deterministic — same passphrase yields same URL', async () => {
    const a = await passphraseToDocId('word-word-word-word')
    const b = await passphraseToDocId('word-word-word-word')
    expect(a).toBe(b)
  })

  it('different passphrases yield different URLs', async () => {
    const a = await passphraseToDocId('alpha-beta-gamma-delta')
    const b = await passphraseToDocId('echo-foxtrot-golf-hotel')
    expect(a).not.toBe(b)
  })

  it('is case-sensitive', async () => {
    const a = await passphraseToDocId('Apple-Bear-Cloud-Drum')
    const b = await passphraseToDocId('apple-bear-cloud-drum')
    expect(a).not.toBe(b)
  })

  it('URL is a valid Automerge URL (parseable)', async () => {
    const { parseAutomergeUrl } = await import('@automerge/automerge-repo')
    const url = await passphraseToDocId('craft-2026-test-pass')
    expect(() => parseAutomergeUrl(url)).not.toThrow()
    const parsed = parseAutomergeUrl(url)
    expect(parsed.documentId).toBeTruthy()
  })
})
