import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the heavy adapters so the test doesn't need real IndexedDB or WebSockets.
// The implementations must use `function` (not arrow functions) so they work as `new`-able constructors.
vi.mock('@automerge/automerge-repo-storage-indexeddb', () => ({
  IndexedDBStorageAdapter: vi.fn(function (this: object) {
    Object.assign(this, { type: 'storage' })
  }),
}))

vi.mock('@automerge/automerge-repo-network-websocket', () => ({
  BrowserWebSocketClientAdapter: vi.fn(function (this: object, url: string) {
    Object.assign(this, { type: 'network', url })
  }),
}))

vi.mock('@automerge/automerge-repo', () => ({
  Repo: vi.fn(function (this: object, opts: unknown) {
    Object.assign(this, { opts })
  }),
}))

import {
  createRepo,
  SYNC_SERVER_URL,
  PUBLIC_SYNC_SERVER_URL,
  HALFBAKERY_SYNC_SERVER_URL,
} from './repo'
import { Repo } from '@automerge/automerge-repo'
import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb'
import { BrowserWebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket'

describe('createRepo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns a Repo instance', () => {
    const { repo } = createRepo()
    expect(Repo).toHaveBeenCalledOnce()
    expect(repo).toBeDefined()
  })

  it('returns the network adapter', () => {
    const { networkAdapter } = createRepo()
    expect(networkAdapter).toBeDefined()
  })

  it('creates a Repo with IndexedDB storage', () => {
    createRepo()
    expect(IndexedDBStorageAdapter).toHaveBeenCalledOnce()
    const opts = (Repo as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(opts.storage).toBeDefined()
  })

  it('defaults to the public sync server when no URL is given', () => {
    createRepo()
    expect(BrowserWebSocketClientAdapter).toHaveBeenCalledWith(PUBLIC_SYNC_SERVER_URL)
    const opts = (Repo as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(opts.network).toHaveLength(1)
  })

  it('uses a custom URL when one is provided', () => {
    createRepo('wss://custom.example.com')
    expect(BrowserWebSocketClientAdapter).toHaveBeenCalledWith('wss://custom.example.com')
  })

  it('uses the halfbakery server when that constant is passed', () => {
    createRepo(HALFBAKERY_SYNC_SERVER_URL)
    expect(BrowserWebSocketClientAdapter).toHaveBeenCalledWith(HALFBAKERY_SYNC_SERVER_URL)
  })

  it('PUBLIC_SYNC_SERVER_URL points at the public Automerge server', () => {
    expect(PUBLIC_SYNC_SERVER_URL).toBe('wss://sync.automerge.org')
  })

  it('HALFBAKERY_SYNC_SERVER_URL points at the halfbakery server', () => {
    expect(HALFBAKERY_SYNC_SERVER_URL).toBe('wss://sync.home.halfbakery.xyz')
  })

  it('SYNC_SERVER_URL (deprecated) still resolves to the halfbakery server', () => {
    expect(SYNC_SERVER_URL).toBe('wss://sync.home.halfbakery.xyz')
  })
})
