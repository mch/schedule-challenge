/**
 * Tests for useSessionDetailParam.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSessionDetailParam } from './useSessionDetailParam'

beforeEach(() => {
  window.history.replaceState(null, '', '/')
})

afterEach(() => {
  window.history.replaceState(null, '', '/')
})

describe('useSessionDetailParam', () => {
  it('returns null when no session param in URL', () => {
    const { result } = renderHook(() => useSessionDetailParam())
    expect(result.current.sessionId).toBeNull()
  })

  it('reads session ID from URL on mount', () => {
    window.history.replaceState(null, '', '/?session=42')
    const { result } = renderHook(() => useSessionDetailParam())
    expect(result.current.sessionId).toBe(42)
  })

  it('openSession sets the session param in the URL', () => {
    const { result } = renderHook(() => useSessionDetailParam())
    act(() => {
      result.current.openSession(101)
    })
    expect(result.current.sessionId).toBe(101)
    expect(window.location.search).toContain('session=101')
  })

  it('openSession preserves other URL params', () => {
    window.history.replaceState(null, '', '/?day=1&tag=tdd')
    const { result } = renderHook(() => useSessionDetailParam())
    act(() => {
      result.current.openSession(101)
    })
    const sp = new URLSearchParams(window.location.search)
    expect(sp.get('session')).toBe('101')
    expect(sp.get('day')).toBe('1')
    expect(sp.get('tag')).toBe('tdd')
  })

  it('closeSession removes the session param', () => {
    window.history.replaceState(null, '', '/?session=101')
    const { result } = renderHook(() => useSessionDetailParam())
    act(() => {
      result.current.closeSession()
    })
    expect(result.current.sessionId).toBeNull()
    expect(window.location.search).not.toContain('session')
  })

  it('closeSession preserves other URL params', () => {
    window.history.replaceState(null, '', '/?session=101&day=1&tag=tdd')
    const { result } = renderHook(() => useSessionDetailParam())
    act(() => {
      result.current.closeSession()
    })
    const sp = new URLSearchParams(window.location.search)
    expect(sp.get('session')).toBeNull()
    expect(sp.get('day')).toBe('1')
    expect(sp.get('tag')).toBe('tdd')
  })

  it('updates sessionId when popstate fires', () => {
    const { result } = renderHook(() => useSessionDetailParam())
    act(() => {
      window.history.pushState(null, '', '/?session=55')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    expect(result.current.sessionId).toBe(55)
  })
})
