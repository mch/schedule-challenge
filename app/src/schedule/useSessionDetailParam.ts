/**
 * Manages the `?session=<slotId>` URL param used to show/hide the session
 * detail view.
 *
 * - `sessionId` — the current slot ID from the URL, or `null` if absent
 * - `openSession(id)` — pushes `?session=<id>` onto the history stack
 * - `closeSession()` — removes the `session` param (back to list view)
 *
 * All other params (day, tag, stage) are preserved.
 */

import { useCallback, useEffect, useState } from 'react'
import { saveScrollToState } from './useScrollRestoration'

const CHANGE_EVENT = 'session-params-change'

function readSessionId(search: string): number | null {
  const sp = new URLSearchParams(search)
  const raw = sp.get('session')
  if (!raw) return null
  const id = parseInt(raw, 10)
  return isNaN(id) ? null : id
}

export interface UseSessionDetailParamResult {
  sessionId: number | null
  openSession: (id: number) => void
  closeSession: () => void
}

export function useSessionDetailParam(): UseSessionDetailParamResult {
  const [sessionId, setSessionId] = useState<number | null>(() =>
    readSessionId(window.location.search),
  )

  useEffect(() => {
    function sync() {
      setSessionId(readSessionId(window.location.search))
    }
    window.addEventListener('popstate', sync)
    window.addEventListener(CHANGE_EVENT, sync)
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener(CHANGE_EVENT, sync)
    }
  }, [])

  const openSession = useCallback((id: number) => {
    saveScrollToState()
    const sp = new URLSearchParams(window.location.search)
    sp.set('session', String(id))
    window.history.pushState(null, '', `${window.location.pathname}?${sp.toString()}`)
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }, [])

  const closeSession = useCallback(() => {
    saveScrollToState()
    const sp = new URLSearchParams(window.location.search)
    sp.delete('session')
    const qs = sp.toString()
    window.history.pushState(null, '', window.location.pathname + (qs ? `?${qs}` : ''))
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }, [])

  return { sessionId, openSession, closeSession }
}
