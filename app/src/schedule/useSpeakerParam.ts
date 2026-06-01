/**
 * Manages the `?speaker=<slug>` URL param used to show/hide the speaker
 * detail view.
 *
 * - `speakerSlug` — the current speaker slug from the URL, or `null` if absent
 * - `openSpeaker(slug)` — pushes `?speaker=<slug>` onto the history stack
 * - `closeSpeaker()` — removes the `speaker` param (back to previous view)
 *
 * All other params (day, tag, stage, session, view) are preserved.
 */

import { useCallback, useEffect, useState } from 'react'

const CHANGE_EVENT = 'session-params-change'

function readSpeakerSlug(search: string): string | null {
  const sp = new URLSearchParams(search)
  return sp.get('speaker') ?? null
}

export interface UseSpeakerParamResult {
  speakerSlug: string | null
  openSpeaker: (slug: string) => void
  closeSpeaker: () => void
}

export function useSpeakerParam(): UseSpeakerParamResult {
  const [speakerSlug, setSpeakerSlug] = useState<string | null>(() =>
    readSpeakerSlug(window.location.search),
  )

  useEffect(() => {
    function sync() {
      setSpeakerSlug(readSpeakerSlug(window.location.search))
    }
    window.addEventListener('popstate', sync)
    window.addEventListener(CHANGE_EVENT, sync)
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener(CHANGE_EVENT, sync)
    }
  }, [])

  const openSpeaker = useCallback((slug: string) => {
    const sp = new URLSearchParams(window.location.search)
    sp.set('speaker', slug)
    window.history.pushState(null, '', `${window.location.pathname}?${sp.toString()}`)
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }, [])

  const closeSpeaker = useCallback(() => {
    const sp = new URLSearchParams(window.location.search)
    sp.delete('speaker')
    const qs = sp.toString()
    window.history.pushState(null, '', window.location.pathname + (qs ? `?${qs}` : ''))
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }, [])

  return { speakerSlug, openSpeaker, closeSpeaker }
}
