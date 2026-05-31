import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useSchedule } from './useSchedule'
import type { Schedule } from '../types/schedule'

// Minimal valid schedule fixture used across tests
const MOCK_SCHEDULE: Schedule = {
  conference: {
    id: 'craft',
    name: 'Craft',
    year: 2026,
    date: 'June 4-5',
    location: 'Budapest | Hungarian Railway Museum',
    domain: 'craft-conf.com',
  },
  days: [
    {
      id: 1,
      name: 'Day 1',
      date: '2026-06-04',
      global_slots: [],
      stages: [
        {
          id: 10,
          name: 'Main Stage',
          color: 'ff4d00',
          slots: [
            {
              id: 100,
              type: 'talk',
              start_time: '09:00',
              end_time: '10:00',
              talk: {
                id: 200,
                title: 'Example Talk',
                slug: 'example-talk',
                is_keynote: true,
                is_online: false,
                tags: [],
                speakers: [{ name: 'Jane Doe', slug: 'jane-doe' }],
              },
              workshop: null,
            },
          ],
        },
      ],
    },
  ],
}

describe('useSchedule', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('starts in loading state', () => {
    // fetch that never resolves
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useSchedule('/schedule.json'))

    expect(result.current.loading).toBe(true)
    expect(result.current.schedule).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('returns schedule data on successful fetch', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => MOCK_SCHEDULE,
    } as Response)

    const { result } = renderHook(() => useSchedule('/schedule.json'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBeNull()
    expect(result.current.schedule).not.toBeNull()
    expect(result.current.schedule?.conference.name).toBe('Craft')
    expect(result.current.schedule?.days).toHaveLength(1)
    expect(result.current.schedule?.days[0].stages[0].slots[0].talk?.title).toBe('Example Talk')
  })

  it('returns an error when the server responds with a non-ok status', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as Response)

    const { result } = renderHook(() => useSchedule('/schedule.json'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.schedule).toBeNull()
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toMatch(/404/)
  })

  it('returns an error when fetch rejects (network failure)', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useSchedule('/schedule.json'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.schedule).toBeNull()
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('Network error')
  })

  it('re-fetches when the url changes', async () => {
    const schedule2 = { ...MOCK_SCHEDULE, conference: { ...MOCK_SCHEDULE.conference, year: 2027 } }

    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => MOCK_SCHEDULE } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => schedule2 } as Response)

    const { result, rerender } = renderHook(({ url }) => useSchedule(url), {
      initialProps: { url: '/schedule.json' },
    })

    await waitFor(() => expect(result.current.schedule?.conference.year).toBe(2026))

    rerender({ url: '/schedule-v2.json' })

    await waitFor(() => expect(result.current.schedule?.conference.year).toBe(2027))
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('uses /schedule.json as the default url', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => MOCK_SCHEDULE,
    } as Response)

    renderHook(() => useSchedule())

    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/schedule.json'))
  })
})
