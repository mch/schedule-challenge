/**
 * Reads and writes session-list filter state from/to the URL search params.
 *
 * Managed params:
 *   ?view=<view>       — active view: "schedule" (default, omitted) or "myschedule"
 *   ?day=<day-index>   — 0-based index of the selected day tab (default 0)
 *   ?tag=<tag>         — selected tag filter (default "")
 *   ?stage=<stage>     — selected stage/room filter (default "")
 *
 * Uses pushState for forward/back support. Listens to both `popstate` and a
 * custom `session-params-change` event so the component re-renders on change.
 *
 * The `view` param is omitted from the URL when it equals the default
 * ("schedule"), keeping URLs clean.
 */

import { useCallback, useEffect, useState } from 'react'

export type ScheduleView = 'schedule' | 'myschedule'

export interface SessionListParams {
  view: ScheduleView
  day: number
  tag: string
  stage: string
}

export interface UseSessionListParamsResult {
  params: SessionListParams
  setView: (view: ScheduleView) => void
  setDay: (day: number) => void
  setTag: (tag: string) => void
  setStage: (stage: string) => void
}

function readParams(search: string): SessionListParams {
  const sp = new URLSearchParams(search)
  const day = parseInt(sp.get('day') ?? '0', 10)
  const rawView = sp.get('view')
  const view: ScheduleView = rawView === 'myschedule' ? 'myschedule' : 'schedule'
  return {
    view,
    day: isNaN(day) || day < 0 ? 0 : day,
    tag: sp.get('tag') ?? '',
    stage: sp.get('stage') ?? '',
  }
}

function buildSearch(current: string, updates: Partial<SessionListParams>): string {
  const sp = new URLSearchParams(current)
  if (updates.view !== undefined) {
    if (updates.view === 'schedule') sp.delete('view')
    else sp.set('view', updates.view)
  }
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

  const setView = useCallback((view: ScheduleView) => push({ view }), [push])
  const setDay = useCallback((day: number) => push({ day }), [push])
  const setTag = useCallback((tag: string) => push({ tag }), [push])
  const setStage = useCallback((stage: string) => push({ stage }), [push])

  return { params, setView, setDay, setTag, setStage }
}
