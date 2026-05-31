/**
 * Provides the conference schedule to the component tree via React context.
 *
 * Usage:
 *   <ScheduleProvider>
 *     <App />
 *   </ScheduleProvider>
 *
 * Then in any component:
 *   const { schedule, loading, error } = useScheduleContext()
 *
 * The provider fetches `/schedule.json` once on mount. An optional `url` prop
 * allows overriding the source (useful in tests).
 */
import { createContext, useContext, type ReactNode } from 'react'
import { useSchedule, type UseScheduleResult } from './useSchedule'

export const ScheduleContext = createContext<UseScheduleResult | null>(null)

export interface ScheduleProviderProps {
  children: ReactNode
  /** Override the schedule URL — defaults to '/schedule.json'. */
  url?: string
}

export function ScheduleProvider({ children, url }: ScheduleProviderProps) {
  const value = useSchedule(url)
  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>
}

/**
 * Returns schedule state from the nearest <ScheduleProvider>.
 * Throws if called outside one.
 */
export function useScheduleContext(): UseScheduleResult {
  const ctx = useContext(ScheduleContext)
  if (ctx === null) {
    throw new Error('useScheduleContext must be used within a <ScheduleProvider>')
  }
  return ctx
}
