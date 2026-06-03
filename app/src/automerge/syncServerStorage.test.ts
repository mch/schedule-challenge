import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadSyncServerUrl,
  saveSyncServerUrl,
  clearSyncServerUrl,
} from './syncServerStorage'

describe('syncServerStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when nothing is stored', () => {
    expect(loadSyncServerUrl()).toBeNull()
  })

  it('saves and loads a URL', () => {
    saveSyncServerUrl('wss://example.com')
    expect(loadSyncServerUrl()).toBe('wss://example.com')
  })

  it('overwrites the previous value', () => {
    saveSyncServerUrl('wss://first.example.com')
    saveSyncServerUrl('wss://second.example.com')
    expect(loadSyncServerUrl()).toBe('wss://second.example.com')
  })

  it('returns null after clearing', () => {
    saveSyncServerUrl('wss://example.com')
    clearSyncServerUrl()
    expect(loadSyncServerUrl()).toBeNull()
  })
})
