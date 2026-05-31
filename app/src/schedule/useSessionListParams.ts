/**
 * Reads and writes session-list filter state from/to the URL search params.
 *
 * Managed params:
 *   ?day=<day-index>   — 0-based index of the selected day tab (default 0)
 *   ?tag=<tag>         — selected tag filter (default "")
 *   ?stage=<stage>     — selected stage/room filter (default "")
 *
 * Uses pushState for forward/back support. Listens to both `popstate` and a
 * custom `session-params-change` event so the component re-renders on change.
 */

import { useCallback, useEffect, useState } from 'react'

export interface SessionListParams {
  day: number
  tag: string
  stage: string
}

export interface UseSessionListParamsResult {
  params: SessionListParams
  setDay: (day: number) => void
  setTag: (tag: string) => void
  setStage: (stage: string) => void
}

function readParams(search: string): SessionListParams {
  const sp = new URLSearchParams(search)
  const day = parseInt(sp.get('day') ?? '0', 10)
  return {
    day: isNaN(day) || day < 0 ? 0 : day,
    tag: sp.get('tag') ?? '',
    stage: sp.get('stage') ?? '',
  }
}

function buildSearch(current: string, updates: Partial<SessionListParams>): string {
  const sp = new URLSearchParams(current)
  if (updates.day !== undefined) {
    if (updates.day === 0) sp.delete('day')
    else sp.set('day', String(updates.day))
  }
  if (updates.tag !== undefined) {
    if (updates.tag === '') sp.delete('tag')
    else sp.set('tag', updates.tag)
  }
  if (updates.stage !== undefined) {
    if (updates.stage === '') sp.delete('stage')
    else sp.set('stage', updates.stage)
  }
  const s = sp.toString()
  return s ? `?${s}` : ''
}

const CHANGE_EVENT = 'session-params-change'

export function useSessionListParams(): UseSessionListParamsResult {
  const [params, setParams] = useState<SessionListParams>(() =>
    readParams(window.location.search),
  )

  useEffect(() => {
    function sync() {
      setParams(readParams(window.location.search))
    }
    window.addEventListener('popstate', sync)
    window.addEventListener(CHANGE_EVENT, sync)
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener(CHANGE_EVENT, sync)
    }
  }, [])

  const push = useCallback((updates: Partial<SessionListParams>) => {
    const next = buildSearch(window.location.search, updates)
    window.history.pushState(null, '', window.location.pathname + next)
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }, [])

  const setDay = useCallback((day: number) => push({ day }), [push])
  const setTag = useCallback((tag: string) => push({ tag }), [push])
  const setStage = useCallback((stage: string) => push({ stage }), [push])

  return { params, setDay, setTag, setStage }
}
