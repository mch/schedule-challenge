/**
 * Tests for SpeakerDetailView.
 *
 * Covers:
 *   - Loading / error states from schedule context
 *   - Not found state for unknown speaker slug
 *   - Renders speaker name
 *   - Shows external link to craft-conf.com profile
 *   - Lists all sessions for the speaker across both days
 *   - Each session card shows title, time, stage, day
 *   - Shows Keynote / Workshop / Online badges on session cards
 *   - Clicking a session card calls onOpenSession with the correct slot ID
 *   - Back button calls onClose
 *   - Speaker with no sessions shows appropriate message
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SpeakerDetailView } from './SpeakerDetailView'
import { ScheduleContext } from '../schedule/ScheduleContext'
import type { Schedule } from '../types/schedule'
import type { UseScheduleResult } from '../schedule/useSchedule'

// ---------------------------------------------------------------------------
// Fixture schedule — two days, multiple speakers
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
                title: 'Opening Keynote',
                slug: 'opening-keynote',
                is_keynote: true,
                is_online: false,
                tags: [],
                speakers: [
                  { name: 'Alice Smith', slug: 'alice-smith' },
                  { name: 'Bob Jones', slug: 'bob-jones' },
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
                title: 'Remote Presentation',
                slug: 'remote-presentation',
                is_keynote: false,
                is_online: true,
                tags: [],
                speakers: [{ name: 'Carol White', slug: 'carol-white' }],
              },
            },
          ],
        },
        {
          id: 11,
          name: 'Workshop Room',
          color: '0d9488',
          slots: [
            {
              id: 103,
              type: 'workshop',
              start_time: '10:00',
              end_time: '12:00',
              workshop: {
                id: 2001,
                title: 'Hands-on TDD Workshop',
                slug: 'tdd-workshop',
                tags: [],
                speakers: [{ name: 'Alice Smith', slug: 'alice-smith' }],
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
                title: 'Day 2 Keynote',
                slug: 'day2-keynote',
                is_keynote: true,
                is_online: false,
                tags: [],
                speakers: [{ name: 'Alice Smith', slug: 'alice-smith' }],
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

function makeScheduleResult(overrides?: Partial<UseScheduleResult>): UseScheduleResult {
  return {
    schedule: FIXTURE_SCHEDULE,
    loading: false,
    error: null,
    ...overrides,
  } as UseScheduleResult
}

interface RenderOptions {
  speakerSlug?: string
  onClose?: () => void
  onOpenSession?: (id: number) => void
  scheduleResult?: UseScheduleResult
}

function renderSpeaker({
  speakerSlug = 'alice-smith',
  onClose = vi.fn(),
  onOpenSession = vi.fn(),
  scheduleResult = makeScheduleResult(),
}: RenderOptions = {}) {
  return render(
    <ScheduleContext.Provider value={scheduleResult}>
      <SpeakerDetailView
        speakerSlug={speakerSlug}
        onClose={onClose}
        onOpenSession={onOpenSession}
      />
    </ScheduleContext.Provider>,
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SpeakerDetailView', () => {
  describe('loading / error states', () => {
    it('shows loading message while schedule is loading', () => {
      renderSpeaker({ scheduleResult: { schedule: null, loading: true, error: null } })
      expect(screen.getByText(/loading schedule/i)).toBeInTheDocument()
    })

    it('shows error message when schedule fails to load', () => {
      renderSpeaker({
        scheduleResult: { schedule: null, loading: false, error: new Error('Network error') } as UseScheduleResult,
      })
      expect(screen.getByRole('alert')).toHaveTextContent(/network error/i)
    })
  })

  describe('not found', () => {
    it('shows not-found alert for unknown speaker slug', () => {
      renderSpeaker({ speakerSlug: 'does-not-exist' })
      expect(screen.getByRole('alert')).toHaveTextContent(/speaker not found/i)
    })

    it('shows back button in not-found state', () => {
      renderSpeaker({ speakerSlug: 'does-not-exist' })
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
    })

    it('calls onClose when back button is clicked in not-found state', () => {
      const onClose = vi.fn()
      renderSpeaker({ speakerSlug: 'does-not-exist', onClose })
      fireEvent.click(screen.getByRole('button', { name: /back/i }))
      expect(onClose).toHaveBeenCalledOnce()
    })
  })

  describe('speaker header', () => {
    it('renders the speaker name', () => {
      renderSpeaker()
      expect(screen.getByRole('heading', { name: 'Alice Smith' })).toBeInTheDocument()
    })

    it('renders a link to the speaker profile on craft-conf.com', () => {
      renderSpeaker()
      const link = screen.getByRole('link', { name: /full profile on craft-conf\.com/i })
      expect(link).toHaveAttribute('href', 'https://craft-conf.com/2026/speaker/alice-smith')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })

  describe('back button', () => {
    it('renders back button', () => {
      renderSpeaker()
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
    })

    it('calls onClose when back button is clicked', () => {
      const onClose = vi.fn()
      renderSpeaker({ onClose })
      fireEvent.click(screen.getByRole('button', { name: /back/i }))
      expect(onClose).toHaveBeenCalledOnce()
    })
  })

  describe('sessions list', () => {
    it('lists all sessions for alice-smith across both days (talk, workshop, day-2 talk)', () => {
      renderSpeaker()
      expect(screen.getByText('Opening Keynote')).toBeInTheDocument()
      expect(screen.getByText('Hands-on TDD Workshop')).toBeInTheDocument()
      expect(screen.getByText('Day 2 Keynote')).toBeInTheDocument()
    })

    it('does not list sessions for other speakers', () => {
      renderSpeaker()
      expect(screen.queryByText('Remote Presentation')).not.toBeInTheDocument()
    })

    it('renders time range for each session', () => {
      renderSpeaker()
      // Alice has two sessions at 09:30–10:10 (Day 1 talk + Day 2 keynote) and one at 10:00–12:00
      const times = screen.getAllByText('09:30–10:10')
      expect(times.length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('10:00–12:00')).toBeInTheDocument()
    })

    it('renders stage name for each session', () => {
      renderSpeaker()
      // Main Stage appears on two sessions (Day 1 talk + Day 2 talk)
      const mainStages = screen.getAllByText('Main Stage')
      expect(mainStages.length).toBeGreaterThanOrEqual(2)
      expect(screen.getByText('Workshop Room')).toBeInTheDocument()
    })

    it('renders day label for sessions on different days', () => {
      renderSpeaker()
      // Alice has two Day 1 sessions and one Day 2 session
      const day1Labels = screen.getAllByText('Day 1')
      expect(day1Labels.length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('Day 2')).toBeInTheDocument()
    })

    it('shows Keynote badge on keynote sessions', () => {
      renderSpeaker()
      // Opening Keynote and Day 2 Keynote are both keynotes
      const keynoteBadges = screen.getAllByText('Keynote')
      expect(keynoteBadges).toHaveLength(2)
    })

    it('shows Workshop badge on workshop sessions', () => {
      renderSpeaker()
      expect(screen.getByText('Workshop')).toBeInTheDocument()
    })

    it('shows Online badge for online sessions', () => {
      // carol-white has an online talk
      renderSpeaker({ speakerSlug: 'carol-white' })
      expect(screen.getByText('Online')).toBeInTheDocument()
    })

    it('does not show Online badge for in-person sessions', () => {
      // alice-smith has no online sessions
      renderSpeaker()
      expect(screen.queryByText('Online')).not.toBeInTheDocument()
    })

    it('calls onOpenSession with the slot ID when a session card is clicked', () => {
      const onOpenSession = vi.fn()
      renderSpeaker({ onOpenSession })
      fireEvent.click(screen.getByRole('button', { name: /view session: Opening Keynote/i }))
      expect(onOpenSession).toHaveBeenCalledWith(101)
    })

    it('calls onOpenSession for the workshop card', () => {
      const onOpenSession = vi.fn()
      renderSpeaker({ onOpenSession })
      fireEvent.click(screen.getByRole('button', { name: /view session: Hands-on TDD Workshop/i }))
      expect(onOpenSession).toHaveBeenCalledWith(103)
    })
  })
})
