/**
 * useScrollRestoration — saves and restores window scroll position across
 * history-based navigation.
 *
 * Usage:
 *   Call `useScrollRestoration()` at the top of any "page" component.
 *   Call `saveScrollToState()` before every `pushState` call (i.e. before
 *   navigating away) so the current scroll is captured in the outgoing entry.
 *
 * Behaviour:
 * - On mount: restores scroll from `history.state.scrollY` (back navigation),
 *   or scrolls to top if absent (forward navigation to a new page).
 * - On `popstate`: restores scroll from the incoming state, or scrolls to top.
 */

import { useEffect } from 'react'

/** Persist the current window.scrollY into the current history entry's state. */
export function saveScrollToState() {
  const existing = window.history.state ?? {}
  window.history.replaceState({ ...existing, scrollY: window.scrollY }, '')
}

export function useScrollRestoration() {
  // Restore on mount (handles both fresh page loads and back-navigation)
  useEffect(() => {
    const saved = window.history.state?.scrollY
    window.scrollTo({ top: typeof saved === 'number' ? saved : 0, behavior: 'instant' })
  }, [])

  // Restore on popstate (back / forward button)
  useEffect(() => {
    function onPopState(e: PopStateEvent) {
      const saved = (e.state as { scrollY?: number } | null)?.scrollY
      window.scrollTo({ top: typeof saved === 'number' ? saved : 0, behavior: 'instant' })
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])
}
