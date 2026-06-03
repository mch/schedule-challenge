/**
 * Tests for useScrollRestoration.
 *
 * The hook should:
 * - Scroll to top on mount when there is no saved scroll in history.state
 * - Restore a saved scroll position from history.state on mount
 * - Restore scroll when a popstate event fires and the new state has a saved scroll
 * - Scroll to top when a popstate event fires and the new state has no saved scroll
 */

import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useScrollRestoration } from './useScrollRestoration'

const scrollToSpy = vi.spyOn(window, 'scrollTo')

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  scrollToSpy.mockClear()
  // Simulate scrollY being 0 initially
  Object.defineProperty(window, 'scrollY', {
    value: 0,
    configurable: true,
    writable: true,
  })
})

afterEach(() => {
  window.history.replaceState(null, '', '/')
})

describe('useScrollRestoration', () => {
  it('scrolls to top on mount when history.state has no scroll', () => {
    window.history.replaceState(null, '', '/')
    renderHook(() => useScrollRestoration())
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'instant' })
  })

  it('restores scroll from history.state on mount', () => {
    window.history.replaceState({ scrollY: 350 }, '', '/')
    renderHook(() => useScrollRestoration())
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 350, behavior: 'instant' })
  })

  it('does not scroll to top when history.state has scrollY=0 (explicit zero)', () => {
    window.history.replaceState({ scrollY: 0 }, '', '/')
    renderHook(() => useScrollRestoration())
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'instant' })
  })

  it('restores scroll when popstate fires with saved scrollY', () => {
    renderHook(() => useScrollRestoration())
    scrollToSpy.mockClear()

    act(() => {
      window.history.pushState({ scrollY: 500 }, '', '/?session=1')
      window.dispatchEvent(
        new PopStateEvent('popstate', { state: { scrollY: 500 } }),
      )
    })
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 500, behavior: 'instant' })
  })

  it('scrolls to top when popstate fires with no saved scrollY', () => {
    renderHook(() => useScrollRestoration())
    scrollToSpy.mockClear()

    act(() => {
      window.history.pushState(null, '', '/?session=1')
      window.dispatchEvent(new PopStateEvent('popstate', { state: null }))
    })
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'instant' })
  })
})

describe('saveScrollToState', () => {
  it('saves current scrollY into history.state via replaceState', async () => {
    const { saveScrollToState } = await import('./useScrollRestoration')
    Object.defineProperty(window, 'scrollY', {
      value: 250,
      configurable: true,
      writable: true,
    })

    saveScrollToState()

    expect(window.history.state).toMatchObject({ scrollY: 250 })
  })

  it('preserves other state properties when saving scroll', async () => {
    const { saveScrollToState } = await import('./useScrollRestoration')
    window.history.replaceState({ someOtherKey: 'preserved' }, '', '/')
    Object.defineProperty(window, 'scrollY', {
      value: 100,
      configurable: true,
      writable: true,
    })

    saveScrollToState()

    expect(window.history.state).toMatchObject({
      someOtherKey: 'preserved',
      scrollY: 100,
    })
  })
})
