/**
 * Fetches the conference schedule from the bundled static asset
 * (`/schedule.json`, served from `public/`).
 *
 * Returns:
 *   - `{ schedule: null, loading: true, error: null }` while fetching
 *   - `{ schedule, loading: false, error: null }` on success
 *   - `{ schedule: null, loading: false, error: Error }` on failure
 */
import { useEffect, useState } from 'react'
import type { Schedule } from '../types/schedule'

export type UseScheduleResult =
  | { schedule: null; loading: true; error: null }
  | { schedule: Schedule; loading: false; error: null }
  | { schedule: null; loading: false; error: Error }

export function useSchedule(url = '/schedule.json'): UseScheduleResult {
  const [state, setState] = useState<UseScheduleResult>({
    schedule: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    setState({ schedule: null, loading: true, error: null })

    fetch(url)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load schedule: ${res.status} ${res.statusText}`)
        }
        return res.json() as Promise<Schedule>
      })
      .then((data) => {
        if (!cancelled) {
          setState({ schedule: data, loading: false, error: null })
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            schedule: null,
            loading: false,
            error: err instanceof Error ? err : new Error(String(err)),
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [url])

  return state
}
