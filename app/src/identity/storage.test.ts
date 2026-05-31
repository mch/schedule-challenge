import { describe, it, expect, beforeEach } from 'vitest'
import { loadPassphrase, savePassphrase, clearPassphrase } from './storage'

describe('passphrase storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('loadPassphrase returns null when nothing is stored', () => {
    expect(loadPassphrase()).toBeNull()
  })

  it('savePassphrase persists the value', () => {
    savePassphrase('word-word-word-word')
    expect(loadPassphrase()).toBe('word-word-word-word')
  })

  it('clearPassphrase removes the stored value', () => {
    savePassphrase('some-pass-phrase-here')
    clearPassphrase()
    expect(loadPassphrase()).toBeNull()
  })

  it('savePassphrase overwrites a previous value', () => {
    savePassphrase('first-pass-phrase-here')
    savePassphrase('second-pass-phrase-here')
    expect(loadPassphrase()).toBe('second-pass-phrase-here')
  })
})
