import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { clearPassphrase, savePassphrase } from './storage'
import { useIdentity } from './useIdentity'

beforeEach(() => {
  localStorage.clear()
})

describe('useIdentity', () => {
  it('transitions to "new" when no passphrase is stored', async () => {
    const { result } = renderHook(() => useIdentity())
    await waitFor(() => {
      expect(result.current.identity.status).toBe('new')
    })
  })

  it('transitions to "ready" when a passphrase is already stored', async () => {
    savePassphrase('able-acid-aged-also')
    const { result } = renderHook(() => useIdentity())
    await waitFor(() => {
      expect(result.current.identity.status).toBe('ready')
    })
    if (result.current.identity.status === 'ready') {
      expect(result.current.identity.passphrase).toBe('able-acid-aged-also')
      expect(result.current.identity.docId).toMatch(/^automerge:/)
    }
  })

  it('confirm() saves passphrase and transitions to ready', async () => {
    const { result } = renderHook(() => useIdentity())
    await waitFor(() => expect(result.current.identity.status).toBe('new'))

    await act(async () => {
      await result.current.confirm('area-army-atom-aunt')
    })

    expect(result.current.identity.status).toBe('ready')
    if (result.current.identity.status === 'ready') {
      expect(result.current.identity.passphrase).toBe('area-army-atom-aunt')
      expect(result.current.identity.docId).toMatch(/^automerge:/)
    }
    // Also persisted to storage
    expect(localStorage.getItem('craft2026:passphrase')).toBe(
      'area-army-atom-aunt',
    )
  })

  it('confirm() trims whitespace from passphrase', async () => {
    const { result } = renderHook(() => useIdentity())
    await waitFor(() => expect(result.current.identity.status).toBe('new'))

    await act(async () => {
      await result.current.confirm('  baby-back-ball-band  ')
    })

    if (result.current.identity.status === 'ready') {
      expect(result.current.identity.passphrase).toBe('baby-back-ball-band')
    }
  })

  it('confirm() with same passphrase produces same docId', async () => {
    const { result: r1 } = renderHook(() => useIdentity())
    await waitFor(() => expect(r1.current.identity.status).toBe('new'))
    await act(async () => {
      await r1.current.confirm('bark-barn-base-bath')
    })

    clearPassphrase()
    const { result: r2 } = renderHook(() => useIdentity())
    await waitFor(() => expect(r2.current.identity.status).toBe('new'))
    await act(async () => {
      await r2.current.confirm('bark-barn-base-bath')
    })

    const docId1 =
      r1.current.identity.status === 'ready' ? r1.current.identity.docId : null
    const docId2 =
      r2.current.identity.status === 'ready' ? r2.current.identity.docId : null
    expect(docId1).toBe(docId2)
  })

  it('generateNew() returns a non-empty hyphenated string', () => {
    const { result } = renderHook(() => useIdentity())
    const passphrase = result.current.generateNew()
    expect(passphrase).toMatch(/\w+-\w+-\w+-\w+/)
  })
})
