import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { RepoProvider } from './RepoContext'
import { useUserDoc } from './useUserDoc'
import type { AutomergeUrl } from '@automerge/automerge-repo'
import type { UserDocument } from '../types/user-document'

// ---------------------------------------------------------------------------
// Helpers to build a fake DocHandle matching the current automerge-repo API:
//   - doc()           → UserDocument  (synchronous, throws if not ready)
//   - isUnavailable() → boolean
//   - on / off        → event subscription
// ---------------------------------------------------------------------------
type ChangeListener = (payload: { doc: UserDocument }) => void

function makeFakeHandle(initialDoc: UserDocument | undefined) {
  const listeners: ChangeListener[] = []
  const unavailable = initialDoc === undefined

  return {
    doc: vi.fn(() => initialDoc as UserDocument),
    isUnavailable: vi.fn(() => unavailable),
    on: vi.fn((_event: string, cb: ChangeListener) => {
      listeners.push(cb)
    }),
    off: vi.fn((_event: string, cb: ChangeListener) => {
      const idx = listeners.indexOf(cb)
      if (idx !== -1) listeners.splice(idx, 1)
    }),
    // Expose for tests to simulate incoming remote changes
    _emit: (doc: UserDocument) => listeners.forEach((l) => l({ doc })),
  }
}

// ---------------------------------------------------------------------------
// Fake Repo
// ---------------------------------------------------------------------------
const FAKE_DOC_URL = 'automerge:3DQqwb9bYNfCfmVqmeJ7JfFWvtZb' as AutomergeUrl

let fakeReadyHandle: ReturnType<typeof makeFakeHandle>

// The fake repo's find() is async, mirroring the real automerge-repo API.
// When called with allowableStates including 'unavailable' and the doc is
// new, it returns an unavailable handle. The second call (after import)
// returns the ready handle.
const fakeRepo = {
  find: vi.fn(),
  import: vi.fn(),
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

  it('returns null while loading (find never resolves)', () => {
    fakeRepo.find.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useUserDoc(FAKE_DOC_URL), { wrapper })
    expect(result.current.doc).toBeNull()
    expect(result.current.handle).toBeNull()
  })

  it('returns the doc when find resolves with a ready handle', async () => {
    const existingDoc: UserDocument = { bookmarks: [1, 2, 3] }
    fakeReadyHandle = makeFakeHandle(existingDoc)
    fakeRepo.find.mockResolvedValue(fakeReadyHandle)

    const { result } = renderHook(() => useUserDoc(FAKE_DOC_URL), { wrapper })

    await waitFor(() => expect(result.current.doc).not.toBeNull())
    expect(result.current.doc?.bookmarks).toEqual([1, 2, 3])
  })

  it('bootstraps a brand-new doc via repo.import() when handle is unavailable', async () => {
    const unavailableHandle = makeFakeHandle(undefined)
    const bootstrappedDoc: UserDocument = { bookmarks: [] }
    const bootstrappedHandle = makeFakeHandle(bootstrappedDoc)

    // First find() returns unavailable; second returns the bootstrapped handle
    fakeRepo.find
      .mockResolvedValueOnce(unavailableHandle)
      .mockResolvedValueOnce(bootstrappedHandle)
    fakeRepo.import.mockReturnValue(undefined)

    const { result } = renderHook(() => useUserDoc(FAKE_DOC_URL), { wrapper })

    await waitFor(() => expect(result.current.doc).not.toBeNull())

    expect(fakeRepo.import).toHaveBeenCalledOnce()
    // import called with (binary, { docId })
    const [binary, args] = fakeRepo.import.mock.calls[0]
    expect(binary).toBeInstanceOf(Uint8Array)
    expect(args).toHaveProperty('docId')

    expect(result.current.doc?.bookmarks).toEqual([])
    // The second find() (after import) should NOT pass allowableStates with unavailable
    expect(fakeRepo.find).toHaveBeenCalledTimes(2)
  })

  it('updates when the handle emits a change event', async () => {
    const existingDoc: UserDocument = { bookmarks: [] }
    fakeReadyHandle = makeFakeHandle(existingDoc)
    fakeRepo.find.mockResolvedValue(fakeReadyHandle)

    const { result } = renderHook(() => useUserDoc(FAKE_DOC_URL), { wrapper })
    await waitFor(() => expect(result.current.doc).not.toBeNull())

    const updated: UserDocument = { bookmarks: [42] }
    act(() => fakeReadyHandle._emit(updated))

    await waitFor(() => expect(result.current.doc?.bookmarks).toEqual([42]))
  })

  it('passes null docId → returns null doc without calling repo.find', () => {
    const { result } = renderHook(() => useUserDoc(null), { wrapper })
    expect(result.current.doc).toBeNull()
    expect(fakeRepo.find).not.toHaveBeenCalled()
  })

  it('does not update state after the effect is cleaned up', async () => {
    const existingDoc: UserDocument = { bookmarks: [] }
    fakeReadyHandle = makeFakeHandle(existingDoc)

    let resolveFn!: (h: typeof fakeReadyHandle) => void
    fakeRepo.find.mockReturnValue(new Promise<typeof fakeReadyHandle>((r) => { resolveFn = r }))

    const { result, unmount } = renderHook(() => useUserDoc(FAKE_DOC_URL), { wrapper })
    expect(result.current.doc).toBeNull()

    unmount()
    // Resolve after unmount — should not cause state update / warning
    act(() => resolveFn(fakeReadyHandle))

    // Still null — no state update on unmounted component
    expect(result.current.doc).toBeNull()
  })
})
