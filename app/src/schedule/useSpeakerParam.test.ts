/**
 * Tests for useSpeakerParam.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSpeakerParam } from './useSpeakerParam'

beforeEach(() => {
  window.history.replaceState(null, '', '/')
})

afterEach(() => {
  window.history.replaceState(null, '', '/')
})

describe('useSpeakerParam', () => {
  it('returns null when no speaker param in URL', () => {
    const { result } = renderHook(() => useSpeakerParam())
    expect(result.current.speakerSlug).toBeNull()
  })

  it('reads speaker slug from URL on mount', () => {
    window.history.replaceState(null, '', '/?speaker=gergely-orosz')
    const { result } = renderHook(() => useSpeakerParam())
    expect(result.current.speakerSlug).toBe('gergely-orosz')
  })

  it('openSpeaker sets the speaker param in the URL', () => {
    const { result } = renderHook(() => useSpeakerParam())
    act(() => {
      result.current.openSpeaker('alice-smith')
    })
    expect(result.current.speakerSlug).toBe('alice-smith')
    expect(window.location.search).toContain('speaker=alice-smith')
  })

  it('openSpeaker preserves other URL params', () => {
    window.history.replaceState(null, '', '/?day=1&tag=tdd&session=42')
    const { result } = renderHook(() => useSpeakerParam())
    act(() => {
      result.current.openSpeaker('bob-jones')
    })
    const sp = new URLSearchParams(window.location.search)
    expect(sp.get('speaker')).toBe('bob-jones')
    expect(sp.get('day')).toBe('1')
    expect(sp.get('tag')).toBe('tdd')
    expect(sp.get('session')).toBe('42')
  })

  it('closeSpeaker removes the speaker param', () => {
    window.history.replaceState(null, '', '/?speaker=alice-smith')
    const { result } = renderHook(() => useSpeakerParam())
    act(() => {
      result.current.closeSpeaker()
    })
    expect(result.current.speakerSlug).toBeNull()
    expect(window.location.search).not.toContain('speaker')
  })

  it('closeSpeaker preserves other URL params', () => {
    window.history.replaceState(null, '', '/?speaker=alice-smith&day=1&session=42')
    const { result } = renderHook(() => useSpeakerParam())
    act(() => {
      result.current.closeSpeaker()
    })
    const sp = new URLSearchParams(window.location.search)
    expect(sp.get('speaker')).toBeNull()
    expect(sp.get('day')).toBe('1')
    expect(sp.get('session')).toBe('42')
  })

  it('updates speakerSlug when popstate fires', () => {
    const { result } = renderHook(() => useSpeakerParam())
    act(() => {
      window.history.pushState(null, '', '/?speaker=gregor-hohpe')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    expect(result.current.speakerSlug).toBe('gregor-hohpe')
  })
})
