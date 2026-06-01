/**
 * Tests for useSessionListParams.
 *
 * Covers:
 *   - Default values when URL has no params
 *   - Reading view, day, tag, stage from the URL on mount
 *   - setView updates the URL (?view omitted for default "schedule", present for "myschedule")
 *   - setDay updates the URL (?day omitted for 0)
 *   - setTag / setStage update the URL
 *   - All params are preserved when updating one at a time
 *   - popstate triggers a re-read of params
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSessionListParams } from './useSessionListParams'

beforeEach(() => {
  window.history.replaceState(null, '', '/')
})

afterEach(() => {
  window.history.replaceState(null, '', '/')
})

describe('useSessionListParams', () => {
  describe('default values', () => {
    it('returns view=schedule by default', () => {
      const { result } = renderHook(() => useSessionListParams())
      expect(result.current.params.view).toBe('schedule')
    })

    it('returns day=0 by default', () => {
      const { result } = renderHook(() => useSessionListParams())
      expect(result.current.params.day).toBe(0)
    })

    it('returns empty tag and stage by default', () => {
      const { result } = renderHook(() => useSessionListParams())
      expect(result.current.params.tag).toBe('')
      expect(result.current.params.stage).toBe('')
    })
  })

  describe('reading from URL on mount', () => {
    it('reads view=myschedule from URL', () => {
      window.history.replaceState(null, '', '/?view=myschedule')
      const { result } = renderHook(() => useSessionListParams())
      expect(result.current.params.view).toBe('myschedule')
    })

    it('treats unknown view values as schedule', () => {
      window.history.replaceState(null, '', '/?view=unknown')
      const { result } = renderHook(() => useSessionListParams())
      expect(result.current.params.view).toBe('schedule')
    })

    it('reads day from URL', () => {
      window.history.replaceState(null, '', '/?day=2')
      const { result } = renderHook(() => useSessionListParams())
      expect(result.current.params.day).toBe(2)
    })

    it('reads tag from URL', () => {
      window.history.replaceState(null, '', '/?tag=tdd')
      const { result } = renderHook(() => useSessionListParams())
      expect(result.current.params.tag).toBe('tdd')
    })

    it('reads stage from URL', () => {
      window.history.replaceState(null, '', '/?stage=Main+Stage')
      const { result } = renderHook(() => useSessionListParams())
      expect(result.current.params.stage).toBe('Main Stage')
    })
  })

  describe('setView', () => {
    it('sets view=myschedule in the URL', () => {
      const { result } = renderHook(() => useSessionListParams())
      act(() => result.current.setView('myschedule'))
      expect(result.current.params.view).toBe('myschedule')
      expect(window.location.search).toContain('view=myschedule')
    })

    it('omits view param from URL when setting to schedule (default)', () => {
      window.history.replaceState(null, '', '/?view=myschedule')
      const { result } = renderHook(() => useSessionListParams())
      act(() => result.current.setView('schedule'))
      expect(result.current.params.view).toBe('schedule')
      expect(window.location.search).not.toContain('view=')
    })

    it('preserves other params when setting view', () => {
      window.history.replaceState(null, '', '/?day=1&tag=tdd')
      const { result } = renderHook(() => useSessionListParams())
      act(() => result.current.setView('myschedule'))
      const sp = new URLSearchParams(window.location.search)
      expect(sp.get('view')).toBe('myschedule')
      expect(sp.get('day')).toBe('1')
      expect(sp.get('tag')).toBe('tdd')
    })
  })

  describe('setDay', () => {
    it('sets day in the URL', () => {
      const { result } = renderHook(() => useSessionListParams())
      act(() => result.current.setDay(1))
      expect(result.current.params.day).toBe(1)
      expect(window.location.search).toContain('day=1')
    })

    it('omits day param from URL when setting to 0 (default)', () => {
      window.history.replaceState(null, '', '/?day=2')
      const { result } = renderHook(() => useSessionListParams())
      act(() => result.current.setDay(0))
      expect(result.current.params.day).toBe(0)
      expect(window.location.search).not.toContain('day=')
    })

    it('preserves view param when setting day', () => {
      window.history.replaceState(null, '', '/?view=myschedule')
      const { result } = renderHook(() => useSessionListParams())
      act(() => result.current.setDay(1))
      const sp = new URLSearchParams(window.location.search)
      expect(sp.get('view')).toBe('myschedule')
      expect(sp.get('day')).toBe('1')
    })
  })

  describe('setTag / setStage', () => {
    it('sets tag in the URL', () => {
      const { result } = renderHook(() => useSessionListParams())
      act(() => result.current.setTag('architecture'))
      expect(result.current.params.tag).toBe('architecture')
      expect(window.location.search).toContain('tag=architecture')
    })

    it('removes tag from URL when set to empty string', () => {
      window.history.replaceState(null, '', '/?tag=tdd')
      const { result } = renderHook(() => useSessionListParams())
      act(() => result.current.setTag(''))
      expect(window.location.search).not.toContain('tag=')
    })

    it('sets stage in the URL', () => {
      const { result } = renderHook(() => useSessionListParams())
      act(() => result.current.setStage('Main Stage'))
      expect(window.location.search).toContain('stage=')
      expect(result.current.params.stage).toBe('Main Stage')
    })

    it('removes stage from URL when set to empty string', () => {
      window.history.replaceState(null, '', '/?stage=Main+Stage')
      const { result } = renderHook(() => useSessionListParams())
      act(() => result.current.setStage(''))
      expect(window.location.search).not.toContain('stage=')
    })
  })

  describe('popstate', () => {
    it('re-reads params when popstate fires', () => {
      const { result } = renderHook(() => useSessionListParams())
      act(() => {
        window.history.pushState(null, '', '/?view=myschedule&day=1')
        window.dispatchEvent(new PopStateEvent('popstate'))
      })
      expect(result.current.params.view).toBe('myschedule')
      expect(result.current.params.day).toBe(1)
    })
  })
})
