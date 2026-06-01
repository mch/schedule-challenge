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
 *   - Filter controls: tag and stage dropdowns scoped to bookmarked sessions on selected day
 *   - Filters reflected in URL (?tag= and ?stage= params)
 *   - Clear filters button removes both filters
 *   - Filtered session count shown
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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
                tags: [{ id: 1, name: 'Architecture' }],
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
                tags: [{ id: 2, name: 'DDD' }],
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
                tags: [{ id: 3, name: 'Testing' }],
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
// Reset URL between tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  window.history.replaceState(null, '', '/')
})

afterEach(() => {
  window.history.replaceState(null, '', '/')
})

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
      // 'Main Stage' appears in both the stage filter option and the session card
      const matches = screen.getAllByText('Main Stage')
      expect(matches.length).toBeGreaterThanOrEqual(1)
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
    it('shows a tab for every conference day', () => {
      renderView({ bookmarks: [101] })
      const tabs = screen.getAllByRole('tab')
      expect(tabs).toHaveLength(2)
      expect(tabs[0]).toHaveTextContent('Day 1')
      expect(tabs[1]).toHaveTextContent('Day 2')
    })

    it('shows bookmarked session on the day tab it belongs to', () => {
      renderView({ bookmarks: [101] })
      expect(screen.getByText('Opening Keynote')).toBeInTheDocument()
    })

    it('shows session on Day 2 tab when Day 2 tab is selected', () => {
      renderView({ bookmarks: [201] })
      // Day 1 tab is selected by default — Day 2 Keynote is not visible yet
      expect(screen.queryByText('Day 2 Keynote')).not.toBeInTheDocument()
      // Switch to Day 2
      fireEvent.click(screen.getAllByRole('tab')[1])
      expect(screen.getByText('Day 2 Keynote')).toBeInTheDocument()
    })

    it('shows empty state for a day tab that has no bookmarks', () => {
      renderView({ bookmarks: [101] })
      // Switch to Day 2 — no bookmarks there
      fireEvent.click(screen.getAllByRole('tab')[1])
      expect(screen.getByText(/no bookmarks for day 2/i)).toBeInTheDocument()
    })

    it('shows sessions from both days when navigating between tabs', () => {
      renderView({ bookmarks: [101, 201] })
      // Day 1 visible by default
      expect(screen.getByText('Opening Keynote')).toBeInTheDocument()
      expect(screen.queryByText('Day 2 Keynote')).not.toBeInTheDocument()
      // Switch to Day 2
      fireEvent.click(screen.getAllByRole('tab')[1])
      expect(screen.getByText('Day 2 Keynote')).toBeInTheDocument()
      expect(screen.queryByText('Opening Keynote')).not.toBeInTheDocument()
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

  describe('filter controls', () => {
    it('renders a tag filter dropdown', () => {
      renderView({ bookmarks: [101] })
      expect(screen.getByRole('combobox', { name: /tag filter/i })).toBeInTheDocument()
    })

    it('renders a stage filter dropdown', () => {
      renderView({ bookmarks: [101] })
      expect(screen.getByRole('combobox', { name: /stage filter/i })).toBeInTheDocument()
    })

    it('tag dropdown lists tags from bookmarked sessions on the current day only', () => {
      // Bookmarks 101 (Architecture) and 102 (DDD) are on Day 1
      // 201 (no tags in fixture) is on Day 2 — not relevant for Day 1 filter
      renderView({ bookmarks: [101, 102] })
      const select = screen.getByRole('combobox', { name: /tag filter/i })
      expect(select).toContainHTML('Architecture')
      expect(select).toContainHTML('DDD')
    })

    it('stage dropdown lists stages from bookmarked sessions on the current day only', () => {
      renderView({ bookmarks: [101, 103] })
      const select = screen.getByRole('combobox', { name: /stage filter/i })
      expect(select).toContainHTML('Main Stage')
      expect(select).toContainHTML('Workshop Room')
    })

    it('filters sessions by selected tag', () => {
      renderView({ bookmarks: [101, 102] })
      const tagSelect = screen.getByRole('combobox', { name: /tag filter/i })
      fireEvent.change(tagSelect, { target: { value: 'Architecture' } })
      expect(screen.getByText('Opening Keynote')).toBeInTheDocument()
      expect(screen.queryByText('Domain-Driven Design')).not.toBeInTheDocument()
    })

    it('filters sessions by selected stage', () => {
      renderView({ bookmarks: [101, 103] })
      const stageSelect = screen.getByRole('combobox', { name: /stage filter/i })
      fireEvent.change(stageSelect, { target: { value: 'Workshop Room' } })
      expect(screen.getByText('TDD Workshop')).toBeInTheDocument()
      expect(screen.queryByText('Opening Keynote')).not.toBeInTheDocument()
    })

    it('reflects tag filter in URL as ?tag= param', () => {
      renderView({ bookmarks: [101, 102] })
      const tagSelect = screen.getByRole('combobox', { name: /tag filter/i })
      fireEvent.change(tagSelect, { target: { value: 'DDD' } })
      expect(window.location.search).toContain('tag=DDD')
    })

    it('reflects stage filter in URL as ?stage= param', () => {
      renderView({ bookmarks: [101, 103] })
      const stageSelect = screen.getByRole('combobox', { name: /stage filter/i })
      fireEvent.change(stageSelect, { target: { value: 'Main Stage' } })
      expect(window.location.search).toContain('stage=Main+Stage')
    })

    it('shows a "Clear filters" button when a filter is active', () => {
      renderView({ bookmarks: [101, 102] })
      const tagSelect = screen.getByRole('combobox', { name: /tag filter/i })
      fireEvent.change(tagSelect, { target: { value: 'DDD' } })
      expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument()
    })

    it('does not show "Clear filters" button when no filter is active', () => {
      renderView({ bookmarks: [101, 102] })
      expect(screen.queryByRole('button', { name: /clear filters/i })).not.toBeInTheDocument()
    })

    it('clear filters button resets both filters', () => {
      renderView({ bookmarks: [101, 102] })
      fireEvent.change(screen.getByRole('combobox', { name: /tag filter/i }), { target: { value: 'DDD' } })
      fireEvent.click(screen.getByRole('button', { name: /clear filters/i }))
      expect(screen.getByText('Opening Keynote')).toBeInTheDocument()
      expect(screen.getByText('Domain-Driven Design')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /clear filters/i })).not.toBeInTheDocument()
    })

    it('shows session count', () => {
      renderView({ bookmarks: [101, 102] })
      // 2 sessions on Day 1
      expect(screen.getByText(/2 sessions/i)).toBeInTheDocument()
    })

    it('shows filtered session count when filter is active', () => {
      renderView({ bookmarks: [101, 102] })
      fireEvent.change(screen.getByRole('combobox', { name: /tag filter/i }), { target: { value: 'DDD' } })
      expect(screen.getByText(/1 session/i)).toBeInTheDocument()
      expect(screen.getByText(/filtered/i)).toBeInTheDocument()
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
