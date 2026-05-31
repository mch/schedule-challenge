import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { RepoProvider } from './RepoContext'
import { useUserDoc } from './useUserDoc'
import type { AutomergeUrl } from '@automerge/automerge-repo'
import type { UserDocument } from '../types/user-document'

// ---------------------------------------------------------------------------
// Helpers to build a fake DocHandle
// ---------------------------------------------------------------------------
type ChangeListener = (payload: { doc: UserDocument }) => void

function makeFakeHandle(initialDoc: UserDocument | undefined) {
  const listeners: ChangeListener[] = []
  let current = initialDoc

  return {
    doc: vi.fn(async () => current),
    change: vi.fn((fn: (d: UserDocument) => void) => {
      if (current === undefined) {
        current = { bookmarks: [] }
      }
      fn(current)
      listeners.forEach((l) => l({ doc: current! }))
    }),
    on: vi.fn((_event: string, cb: ChangeListener) => {
      listeners.push(cb)
    }),
    off: vi.fn((_event: string, cb: ChangeListener) => {
      const idx = listeners.indexOf(cb)
      if (idx !== -1) listeners.splice(idx, 1)
    }),
    // expose for tests
    _emit: (doc: UserDocument) => listeners.forEach((l) => l({ doc })),
  }
}

// ---------------------------------------------------------------------------
// Fake Repo
// ---------------------------------------------------------------------------
const FAKE_DOC_URL = 'automerge:abc123' as AutomergeUrl

let fakeHandle: ReturnType<typeof makeFakeHandle>

const fakeRepo = {
  find: vi.fn(() => fakeHandle),
}

function wrapper({ children }: { children: ReactNode }) {
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <RepoProvider repo={fakeRepo as any}>{children}</RepoProvider>
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('useUserDoc', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null while loading', () => {
    // doc() will never resolve in this tick
    fakeHandle = makeFakeHandle(undefined)
    fakeHandle.doc = vi.fn(() => new Promise(() => {}))

    const { result } = renderHook(() => useUserDoc(FAKE_DOC_URL), { wrapper })
    expect(result.current.doc).toBeNull()
    expect(result.current.handle).toBeNull()
  })

  it('returns the doc once loaded', async () => {
    const existingDoc: UserDocument = { bookmarks: [1, 2, 3] }
    fakeHandle = makeFakeHandle(existingDoc)

    const { result } = renderHook(() => useUserDoc(FAKE_DOC_URL), { wrapper })

    await waitFor(() => expect(result.current.doc).not.toBeNull())
    expect(result.current.doc?.bookmarks).toEqual([1, 2, 3])
  })

  it('initialises a brand-new doc with empty bookmarks when doc() returns undefined', async () => {
    fakeHandle = makeFakeHandle(undefined)

    const { result } = renderHook(() => useUserDoc(FAKE_DOC_URL), { wrapper })

    await waitFor(() => expect(result.current.doc).not.toBeNull())
    expect(result.current.doc?.bookmarks).toEqual([])
    expect(fakeHandle.change).toHaveBeenCalledOnce()
  })

  it('updates when the handle emits a change event', async () => {
    const existingDoc: UserDocument = { bookmarks: [] }
    fakeHandle = makeFakeHandle(existingDoc)

    const { result } = renderHook(() => useUserDoc(FAKE_DOC_URL), { wrapper })
    await waitFor(() => expect(result.current.doc).not.toBeNull())

    const updated: UserDocument = { bookmarks: [42] }
    act(() => fakeHandle._emit(updated))

    await waitFor(() => expect(result.current.doc?.bookmarks).toEqual([42]))
  })

  it('passes null docId → returns null doc without calling repo.find', () => {
    fakeHandle = makeFakeHandle(undefined)

    const { result } = renderHook(() => useUserDoc(null), { wrapper })
    expect(result.current.doc).toBeNull()
    expect(fakeRepo.find).not.toHaveBeenCalled()
  })
})
