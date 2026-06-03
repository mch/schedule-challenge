/**
 * Tests for SpeakersListView.
 *
 * Covers:
 *   - Loading / error states from schedule context
 *   - Renders all speakers sorted alphabetically
 *   - Shows total speaker count in the subtitle
 *   - Each speaker card shows the speaker name
 *   - Each speaker card shows the session count
 *   - Clicking a speaker card calls onOpenSpeaker with the correct slug
 *   - Search input filters speakers by name (case-insensitive)
 *   - Empty search result shows the no-match message
 *   - Search is scoped to the input value (clearing search restores full list)
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ScheduleContext } from '../schedule/ScheduleContext'
import type { UseScheduleResult } from '../schedule/useSchedule'
import type { Schedule } from '../types/schedule'
import { SpeakersListView } from './SpeakersListView'

// ---------------------------------------------------------------------------
// Fixture schedule
// ---------------------------------------------------------------------------

const FIXTURE_SCHEDULE: Schedule = {
  conference: {
    id: 'craft',
    name: 'Craft',
    year: 2026,
    date: 'June 4-5',
    location: 'Budapest',
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
              id: 101,
              type: 'talk',
              start_time: '09:30',
              end_time: '10:10',
              talk: {
                id: 1001,
                title: 'Alpha Talk',
                slug: 'alpha-talk',
                is_keynote: false,
                is_online: false,
                tags: [],
                speakers: [
                  { name: 'Zara Young', slug: 'zara-young' },
                  { name: 'Alice Smith', slug: 'alice-smith' },
                ],
              },
            },
            {
              id: 102,
              type: 'talk',
              start_time: '11:00',
              end_time: '11:40',
              talk: {
                id: 1002,
                title: 'Beta Talk',
                slug: 'beta-talk',
                is_keynote: false,
                is_online: false,
                tags: [],
                speakers: [{ name: 'Bob Jones', slug: 'bob-jones' }],
              },
            },
          ],
        },
      ],
    },
    {
      id: 2,
      name: 'Day 2',
      date: '2026-06-05',
      global_slots: [],
      stages: [
        {
          id: 20,
          name: 'Main Stage',
          color: 'ff4d00',
          slots: [
            {
              id: 201,
              type: 'talk',
              start_time: '09:30',
              end_time: '10:10',
              talk: {
                id: 2001,
                title: 'Gamma Talk',
                slug: 'gamma-talk',
                is_keynote: false,
                is_online: false,
                tags: [],
                speakers: [
                  // Alice appears again on day 2
                  { name: 'Alice Smith', slug: 'alice-smith' },
                ],
              },
            },
          ],
        },
      ],
    },
  ],
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeResult(overrides?: Partial<UseScheduleResult>): UseScheduleResult {
  return {
    schedule: FIXTURE_SCHEDULE,
    loading: false,
    error: null,
    ...overrides,
  } as UseScheduleResult
}

interface RenderOptions {
  onOpenSpeaker?: (slug: string) => void
  scheduleResult?: UseScheduleResult
}

function renderView({
  onOpenSpeaker = vi.fn(),
  scheduleResult = makeResult(),
}: RenderOptions = {}) {
  return render(
    <ScheduleContext.Provider value={scheduleResult}>
      <SpeakersListView onOpenSpeaker={onOpenSpeaker} />
    </ScheduleContext.Provider>,
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SpeakersListView', () => {
  describe('loading / error states', () => {
    it('shows loading message while schedule is loading', () => {
      renderView({
        scheduleResult: {
          schedule: null,
          loading: true,
          error: null,
        } as UseScheduleResult,
      })
      expect(screen.getByText(/loading schedule/i)).toBeInTheDocument()
    })

    it('shows error message when schedule fails to load', () => {
      renderView({
        scheduleResult: {
          schedule: null,
          loading: false,
          error: new Error('Network error'),
        } as UseScheduleResult,
      })
      expect(screen.getByRole('alert')).toHaveTextContent(/network error/i)
    })
  })

  describe('speaker list', () => {
    it('renders the speakers list heading', () => {
      renderView()
      expect(
        screen.getByRole('heading', { name: /speakers/i }),
      ).toBeInTheDocument()
    })

    it('shows the total speaker count in the subtitle', () => {
      renderView()
      // 3 unique speakers in fixture
      expect(screen.getByText(/3 speakers/i)).toBeInTheDocument()
    })

    it('renders all unique speakers', () => {
      renderView()
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
      expect(screen.getByText('Bob Jones')).toBeInTheDocument()
      expect(screen.getByText('Zara Young')).toBeInTheDocument()
    })

    it('renders speakers sorted alphabetically', () => {
      renderView()
      const buttons = screen.getAllByRole('button')
      const names = buttons
        .map(
          (btn) => btn.querySelector('.speaker-list-card__name')?.textContent,
        )
        .filter(Boolean)
      expect(names).toEqual(['Alice Smith', 'Bob Jones', 'Zara Young'])
    })

    it('shows session count for each speaker', () => {
      renderView()
      // Alice has 2 sessions (Day 1 + Day 2)
      expect(screen.getByLabelText('2 sessions')).toBeInTheDocument()
      // Bob and Zara each have 1
      expect(screen.getAllByLabelText('1 session').length).toBe(2)
    })

    it('calls onOpenSpeaker with the correct slug when a card is clicked', () => {
      const onOpenSpeaker = vi.fn()
      renderView({ onOpenSpeaker })
      fireEvent.click(screen.getByRole('button', { name: /view alice smith/i }))
      expect(onOpenSpeaker).toHaveBeenCalledWith('alice-smith')
    })

    it('calls onOpenSpeaker for a different speaker', () => {
      const onOpenSpeaker = vi.fn()
      renderView({ onOpenSpeaker })
      fireEvent.click(screen.getByRole('button', { name: /view bob jones/i }))
      expect(onOpenSpeaker).toHaveBeenCalledWith('bob-jones')
    })
  })

  describe('search', () => {
    it('renders the search input', () => {
      renderView()
      expect(
        screen.getByRole('searchbox', { name: /search speakers/i }),
      ).toBeInTheDocument()
    })

    it('filters speakers by name (case-insensitive)', () => {
      renderView()
      fireEvent.change(screen.getByRole('searchbox'), {
        target: { value: 'alice' },
      })
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
      expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument()
      expect(screen.queryByText('Zara Young')).not.toBeInTheDocument()
    })

    it('shows all speakers when search is cleared', () => {
      renderView()
      const input = screen.getByRole('searchbox')
      fireEvent.change(input, { target: { value: 'alice' } })
      fireEvent.change(input, { target: { value: '' } })
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
      expect(screen.getByText('Bob Jones')).toBeInTheDocument()
      expect(screen.getByText('Zara Young')).toBeInTheDocument()
    })

    it('shows no-match message when search has no results', () => {
      renderView()
      fireEvent.change(screen.getByRole('searchbox'), {
        target: { value: 'zzz-no-match' },
      })
      expect(screen.getByText(/no speakers match/i)).toBeInTheDocument()
    })

    it('does not show the list when search has no results', () => {
      renderView()
      fireEvent.change(screen.getByRole('searchbox'), {
        target: { value: 'zzz-no-match' },
      })
      expect(
        screen.queryByRole('list', { name: /speakers/i }),
      ).not.toBeInTheDocument()
    })
  })
})
