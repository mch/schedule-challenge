import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, renderHook, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { ScheduleProvider, useScheduleContext } from './ScheduleContext'
import type { Schedule } from '../types/schedule'

const MOCK_SCHEDULE: Schedule = {
  conference: {
    id: 'craft',
    name: 'Craft',
    year: 2026,
    date: 'June 4-5',
    location: 'Budapest | Hungarian Railway Museum',
  },
  days: [],
}

function wrapper({ children }: { children: ReactNode }) {
  return (
    <ScheduleProvider url="/test-schedule.json">{children}</ScheduleProvider>
  )
}

describe('ScheduleProvider / useScheduleContext', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('throws when used outside a provider', () => {
    // suppress React error boundary noise in test output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useScheduleContext())).toThrow(
      'useScheduleContext must be used within a <ScheduleProvider>'
    )
    consoleSpy.mockRestore()
  })

  it('provides loading state initially', () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useScheduleContext(), { wrapper })

    expect(result.current.loading).toBe(true)
    expect(result.current.schedule).toBeNull()
  })

  it('provides schedule data after fetch completes', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => MOCK_SCHEDULE,
    } as Response)

    const { result } = renderHook(() => useScheduleContext(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.schedule?.conference.name).toBe('Craft')
  })

  it('provides error state on fetch failure', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Offline'))

    const { result } = renderHook(() => useScheduleContext(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('Offline')
    expect(result.current.schedule).toBeNull()
  })

  it('makes schedule data available to child components', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => MOCK_SCHEDULE,
    } as Response)

    function Child() {
      const { schedule, loading } = useScheduleContext()
      if (loading) return <p>Loading…</p>
      return <p data-testid="conf-name">{schedule?.conference.name}</p>
    }

    render(
      <ScheduleProvider url="/test-schedule.json">
        <Child />
      </ScheduleProvider>
    )

    await waitFor(() => screen.getByTestId('conf-name'))
    expect(screen.getByTestId('conf-name').textContent).toBe('Craft')
  })
})
