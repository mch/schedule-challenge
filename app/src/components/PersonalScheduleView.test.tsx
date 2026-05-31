/**
 * Tests for PersonalScheduleView.
 *
 * Covers:
 *   - Empty state (no bookmarks)
 *   - Displays bookmarked sessions grouped by day
 *   - Shows session title, time, stage, speakers
 *   - Clicking a session card calls onOpenSession
 *   - Remove bookmark button calls handle.change to remove the slotId
 *   - Overlapping sessions are flagged with an overlap indicator
 *   - Sessions sorted chronologically within each day
 *   - Loading / error states from schedule context
 *   - Sessions not in the schedule (dangling bookmarks) are ignored
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PersonalScheduleView } from './PersonalScheduleView'
import { ScheduleContext } from '../schedule/ScheduleContext'
import type { Schedule } from '../types/schedule'
import type { UseScheduleResult } from '../schedule/useSchedule'
import type { UserDocument } from '../types/user-document'
import type { DocHandle } from '@automerge/automerge-repo'

// ---------------------------------------------------------------------------
// Fixture schedule — 2 days
// ---------------------------------------------------------------------------

const FIXTURE_SCHEDULE: Schedule = {
  conference: { id: 'craft', name: 'Craft', year: 2026, date: 'June 4-5', location: 'Budapest' },
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
                speakers: [{ name: 'Alice Smith', slug: 'alice-smith' }],
              },
            },
            {
              id: 102,
              type: 'talk',
              start_time: '10:30',
              end_time: '11:10',
              talk: {
                id: 1002,
                title: 'Domain-Driven Design',
                slug: 'ddd',
                is_keynote: false,
                is_online: false,
                tags: [],
                speakers: [{ name: 'Bob Jones', slug: 'bob-jones' }],
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
              // Overlaps with slot 102 (10:30–11:10) — same time window
              id: 103,
              type: 'workshop',
              start_time: '10:00',
              end_time: '11:00',
              workshop: {
                id: 2001,
                title: 'TDD Workshop',
                slug: 'tdd-workshop',
                tags: [],
                speakers: [{ name: 'Carol White', slug: 'carol-white' }],
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
              start_time: '09:00',
              end_time: '09:45',
              talk: {
                id: 3001,
                title: 'Day 2 Keynote',
                slug: 'day2-keynote',
                is_keynote: true,
                is_online: false,
                tags: [],
                speakers: [{ name: 'Dave Brown', slug: 'dave-brown' }],
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

function makeUserDoc(bookmarks: number[]): UserDocument {
  return { bookmarks }
}

function makeFakeHandle(bookmarks: number[] = []) {
  const doc = makeUserDoc(bookmarks)
  const handle = {
    change: vi.fn((fn: (d: UserDocument) => void) => fn(doc)),
  } as unknown as DocHandle<UserDocument>
  return { handle, doc }
}

interface RenderOptions {
  bookmarks?: number[]
  handle?: DocHandle<UserDocument> | null
  userDoc?: UserDocument | null
  onOpenSession?: (slotId: number) => void
  scheduleResult?: UseScheduleResult
}

function renderView({
  bookmarks = [],
  handle = null,
  userDoc,
  onOpenSession = vi.fn(),
  scheduleResult = makeScheduleResult(),
}: RenderOptions = {}) {
  const doc = userDoc ?? makeUserDoc(bookmarks)
  return render(
    <ScheduleContext.Provider value={scheduleResult}>
      <PersonalScheduleView
        userDoc={doc}
        handle={handle}
        onOpenSession={onOpenSession}
      />
    </ScheduleContext.Provider>,
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PersonalScheduleView', () => {
  describe('loading / error states', () => {
    it('shows loading message while schedule is loading', () => {
      renderView({ scheduleResult: { schedule: null, loading: true, error: null } })
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
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

  describe('empty state', () => {
    it('shows an empty state message when no bookmarks', () => {
      renderView({ bookmarks: [] })
      expect(screen.getByText(/no bookmarks/i)).toBeInTheDocument()
    })

    it('does not render any session cards when there are no bookmarks', () => {
      renderView({ bookmarks: [] })
      expect(screen.queryByRole('article')).not.toBeInTheDocument()
    })

    it('shows empty state when all bookmarks reference unknown slot IDs', () => {
      renderView({ bookmarks: [9999, 8888] })
      expect(screen.getByText(/no bookmarks/i)).toBeInTheDocument()
    })
  })

  describe('session display', () => {
    it('renders bookmarked session title', () => {
      renderView({ bookmarks: [101] })
      expect(screen.getByText('Opening Keynote')).toBeInTheDocument()
    })

    it('renders session time', () => {
      renderView({ bookmarks: [101] })
      expect(screen.getByText('09:30–10:10')).toBeInTheDocument()
    })

    it('renders stage name', () => {
      renderView({ bookmarks: [101] })
      expect(screen.getByText('Main Stage')).toBeInTheDocument()
    })

    it('renders speaker name', () => {
      renderView({ bookmarks: [101] })
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    })

    it('renders multiple bookmarks', () => {
      renderView({ bookmarks: [101, 102] })
      expect(screen.getByText('Opening Keynote')).toBeInTheDocument()
      expect(screen.getByText('Domain-Driven Design')).toBeInTheDocument()
    })
  })

  describe('grouping by day', () => {
    it('shows day heading for bookmarked sessions', () => {
      renderView({ bookmarks: [101] })
      expect(screen.getByText('Day 1')).toBeInTheDocument()
    })

    it('shows sessions across multiple days under separate headings', () => {
      renderView({ bookmarks: [101, 201] })
      expect(screen.getByText('Day 1')).toBeInTheDocument()
      expect(screen.getByText('Day 2')).toBeInTheDocument()
      expect(screen.getByText('Opening Keynote')).toBeInTheDocument()
      expect(screen.getByText('Day 2 Keynote')).toBeInTheDocument()
    })

    it('only shows day headings for days that have bookmarks', () => {
      renderView({ bookmarks: [201] })
      expect(screen.queryByText('Day 1')).not.toBeInTheDocument()
      expect(screen.getByText('Day 2')).toBeInTheDocument()
    })
  })

  describe('chronological order', () => {
    it('sorts sessions by start time within a day', () => {
      renderView({ bookmarks: [102, 101] }) // added out of order
      const cards = screen.getAllByRole('article')
      // 09:30 (101) should come before 10:30 (102)
      expect(cards[0]).toHaveTextContent('09:30')
      expect(cards[1]).toHaveTextContent('10:30')
    })
  })

  describe('overlap detection', () => {
    it('marks overlapping sessions with an overlap warning', () => {
      // Slots 102 (10:30–11:10) and 103 (10:00–11:00) overlap
      renderView({ bookmarks: [102, 103] })
      expect(screen.getAllByText(/overlap/i).length).toBeGreaterThan(0)
    })

    it('does not show overlap warning for non-overlapping sessions', () => {
      // Slots 101 (09:30–10:10) and 102 (10:30–11:10) do NOT overlap
      renderView({ bookmarks: [101, 102] })
      expect(screen.queryByText(/overlap/i)).not.toBeInTheDocument()
    })
  })

  describe('clicking a session', () => {
    it('calls onOpenSession with the slot ID when the card is clicked', () => {
      const onOpenSession = vi.fn()
      renderView({ bookmarks: [101], onOpenSession })
      fireEvent.click(screen.getByRole('article'))
      expect(onOpenSession).toHaveBeenCalledWith(101)
    })

    it('calls onOpenSession when Enter is pressed on a card', () => {
      const onOpenSession = vi.fn()
      renderView({ bookmarks: [101], onOpenSession })
      const card = screen.getByRole('article')
      fireEvent.keyDown(card, { key: 'Enter' })
      expect(onOpenSession).toHaveBeenCalledWith(101)
    })
  })

  describe('remove bookmark button', () => {
    it('renders a remove bookmark button on each card', () => {
      renderView({ bookmarks: [101] })
      expect(
        screen.getByRole('button', { name: /remove from personal schedule/i }),
      ).toBeInTheDocument()
    })

    it('is disabled when no handle is provided', () => {
      renderView({ bookmarks: [101], handle: null })
      const btn = screen.getByRole('button', { name: /remove from personal schedule/i })
      expect(btn).toBeDisabled()
    })

    it('calls handle.change to remove the bookmark when clicked', () => {
      const { handle, doc } = makeFakeHandle([101, 102])
      renderView({ handle, userDoc: doc })
      const removeButtons = screen.getAllByRole('button', { name: /remove from personal schedule/i })
      fireEvent.click(removeButtons[0])
      expect(handle.change).toHaveBeenCalledOnce()
    })

    it('does not bubble click to onOpenSession when remove button is clicked', () => {
      const { handle, doc } = makeFakeHandle([101])
      const onOpenSession = vi.fn()
      renderView({ handle, userDoc: doc, onOpenSession })
      const btn = screen.getByRole('button', { name: /remove from personal schedule/i })
      fireEvent.click(btn)
      expect(onOpenSession).not.toHaveBeenCalled()
    })
  })
})
