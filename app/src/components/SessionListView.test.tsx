/**
 * Tests for SessionListView.
 *
 * Uses a minimal in-memory schedule fixture with 2 days, multiple stages,
 * sessions with tags — covering:
 *   - Day tabs render
 *   - Sessions displayed (title, time, stage, speaker)
 *   - Switching day tabs
 *   - Tag filter
 *   - Stage filter
 *   - Clear filters button
 *   - Empty state
 *   - URL params round-trip
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SessionListView } from './SessionListView'
import { ScheduleContext } from '../schedule/ScheduleContext'
import type { Schedule } from '../types/schedule'
import type { UseScheduleResult } from '../schedule/useSchedule'
import type { UserDocument } from '../types/user-document'
import type { DocHandle } from '@automerge/automerge-repo'

// --------------------------------------------------------------------------
// Fixture
// --------------------------------------------------------------------------

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
                tags: [{ id: 1, name: 'architecture' }],
                speakers: [{ name: 'Alice Smith', slug: 'alice-smith' }],
              },
            },
            {
              id: 102,
              type: 'talk',
              start_time: '10:30',
              end_time: '11:00',
              talk: {
                id: 1002,
                title: 'Deep Dive into DDD',
                slug: 'deep-dive-ddd',
                is_keynote: false,
                is_online: false,
                tags: [
                  { id: 2, name: 'domain-driven design' },
                  { id: 3, name: 'architecture' },
                ],
                speakers: [{ name: 'Bob Jones', slug: 'bob-jones' }],
              },
            },
          ],
        },
        {
          id: 11,
          name: 'Yellow Stage',
          color: 'ffcc00',
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
                tags: [{ id: 4, name: 'tdd' }, { id: 5, name: 'hands-on' }],
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
                tags: [{ id: 6, name: 'ai' }],
                speakers: [{ name: 'Dave Brown', slug: 'dave-brown' }],
              },
            },
          ],
        },
      ],
    },
  ],
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function makeResult(overrides?: Partial<UseScheduleResult>): UseScheduleResult {
  return {
    schedule: FIXTURE_SCHEDULE,
    loading: false,
    error: null,
    ...overrides,
  } as UseScheduleResult
}

function makeUserDoc(bookmarks: number[] = [], hidePastEvents = false): UserDocument {
  return { bookmarks, hidePastEvents }
}

function makeFakeHandle(bookmarks: number[] = [], hidePastEvents = false) {
  const doc = makeUserDoc(bookmarks, hidePastEvents)
  const handle = {
    change: vi.fn((fn: (d: UserDocument) => void) => fn(doc)),
  } as unknown as DocHandle<UserDocument>
  return { handle, doc }
}

interface RenderOptions {
  result?: UseScheduleResult
  handle?: DocHandle<UserDocument> | null
  userDoc?: UserDocument | null
  onOpenSession?: (slotId: number) => void
  nowMs?: number
}

function renderView({
  result = makeResult(),
  handle = null,
  userDoc = null,
  onOpenSession,
  nowMs,
}: RenderOptions = {}) {
  return render(
    <ScheduleContext.Provider value={result}>
      <SessionListView handle={handle} userDoc={userDoc} onOpenSession={onOpenSession} nowMs={nowMs} />
    </ScheduleContext.Provider>,
  )
}

/** Legacy helper for tests that only pass a schedule result */
function renderViewWithResult(result: UseScheduleResult = makeResult()) {
  return renderView({ result })
}

// --------------------------------------------------------------------------
// Reset URL between tests
// --------------------------------------------------------------------------

beforeEach(() => {
  window.history.replaceState(null, '', '/')
})

afterEach(() => {
  window.history.replaceState(null, '', '/')
})

// --------------------------------------------------------------------------
// Tests
// --------------------------------------------------------------------------

describe('SessionListView', () => {
  describe('loading / error states', () => {
    it('shows loading message while schedule is loading', () => {
      renderViewWithResult({ schedule: null, loading: true, error: null })
      expect(screen.getByText(/loading schedule/i)).toBeInTheDocument()
    })

    it('shows error message when schedule fails to load', () => {
      renderViewWithResult({ schedule: null, loading: false, error: new Error('Network error') } as UseScheduleResult)
      expect(screen.getByRole('alert')).toHaveTextContent(/network error/i)
    })
  })

  describe('day tabs', () => {
    it('renders a tab for each day', () => {
      renderViewWithResult()
      const tabs = screen.getAllByRole('tab')
      expect(tabs).toHaveLength(2)
      expect(tabs[0]).toHaveTextContent('Day 1')
      expect(tabs[1]).toHaveTextContent('Day 2')
    })

    it('first tab is selected by default', () => {
      renderViewWithResult()
      const tabs = screen.getAllByRole('tab')
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
      expect(tabs[1]).toHaveAttribute('aria-selected', 'false')
    })

    it('shows Day 1 sessions on first tab', () => {
      renderViewWithResult()
      expect(screen.getByText('Opening Keynote')).toBeInTheDocument()
      expect(screen.getByText('Deep Dive into DDD')).toBeInTheDocument()
      expect(screen.getByText('Hands-on TDD Workshop')).toBeInTheDocument()
    })

    it('switches to Day 2 when tab is clicked', () => {
      renderViewWithResult()
      fireEvent.click(screen.getAllByRole('tab')[1])
      expect(screen.getByText('Day 2 Keynote')).toBeInTheDocument()
      expect(screen.queryByText('Opening Keynote')).not.toBeInTheDocument()
    })

    it('marks selected tab as active after click', () => {
      renderViewWithResult()
      fireEvent.click(screen.getAllByRole('tab')[1])
      const tabs = screen.getAllByRole('tab')
      expect(tabs[0]).toHaveAttribute('aria-selected', 'false')
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true')
    })
  })

  describe('session cards', () => {
    it('shows session title', () => {
      renderViewWithResult()
      expect(screen.getByText('Opening Keynote')).toBeInTheDocument()
    })

    it('shows session times', () => {
      renderViewWithResult()
      expect(screen.getByText('09:30–10:10')).toBeInTheDocument()
    })

    it('shows speaker names', () => {
      renderViewWithResult()
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
      expect(screen.getByText('Bob Jones')).toBeInTheDocument()
    })

    it('shows stage name', () => {
      renderViewWithResult()
      const stageLabels = screen.getAllByText('Main Stage')
      expect(stageLabels.length).toBeGreaterThan(0)
    })

    it('shows tags', () => {
      renderViewWithResult()
      expect(screen.getAllByText('architecture').length).toBeGreaterThan(0)
    })

    it('shows Keynote badge for keynote sessions', () => {
      renderViewWithResult()
      expect(screen.getByText('Keynote')).toBeInTheDocument()
    })

    it('shows Workshop badge for workshop sessions', () => {
      renderViewWithResult()
      expect(screen.getByText('Workshop')).toBeInTheDocument()
    })

    it('sessions are sorted by start time', () => {
      renderViewWithResult()
      const cards = screen.getAllByRole('button', { name: /view details for/i })
      const times = cards.map((c) => c.querySelector('.session-card__time')?.textContent ?? '')
      // First card should be 09:30 (Opening Keynote), then 10:00 (Workshop), then 10:30 (DDD)
      expect(times[0]).toContain('09:30')
      expect(times[1]).toContain('10:00')
      expect(times[2]).toContain('10:30')
    })
  })

  describe('tag filter', () => {
    it('renders tag filter select', () => {
      renderViewWithResult()
      expect(screen.getByRole('combobox', { name: /^tag$/i })).toBeInTheDocument()
    })

    it('populates tag options from current day', () => {
      renderViewWithResult()
      const select = screen.getByRole('combobox', { name: /^tag$/i }) as HTMLSelectElement
      const options = Array.from(select.options).map((o) => o.value)
      expect(options).toContain('architecture')
      expect(options).toContain('tdd')
    })

    it('filters sessions by selected tag', () => {
      renderViewWithResult()
      const select = screen.getByRole('combobox', { name: /^tag$/i })
      fireEvent.change(select, { target: { value: 'tdd' } })
      expect(screen.getByText('Hands-on TDD Workshop')).toBeInTheDocument()
      expect(screen.queryByText('Opening Keynote')).not.toBeInTheDocument()
      expect(screen.queryByText('Deep Dive into DDD')).not.toBeInTheDocument()
    })

    it('shows empty state when no sessions match the combined filters', () => {
      // Set up a combination that results in no matches: architecture tag + Yellow Stage
      // architecture is only on Main Stage sessions, not Yellow Stage
      window.history.replaceState(null, '', '/?tag=architecture&stage=Yellow+Stage')
      renderView()
      expect(screen.getByText(/no sessions match/i)).toBeInTheDocument()
    })
  })

  describe('stage filter', () => {
    it('renders stage filter select', () => {
      renderViewWithResult()
      expect(screen.getByRole('combobox', { name: /stage/i })).toBeInTheDocument()
    })

    it('populates stage options from current day', () => {
      renderViewWithResult()
      const select = screen.getByRole('combobox', { name: /stage/i }) as HTMLSelectElement
      const options = Array.from(select.options).map((o) => o.value)
      expect(options).toContain('Main Stage')
      expect(options).toContain('Yellow Stage')
    })

    it('filters sessions by selected stage', () => {
      renderViewWithResult()
      const select = screen.getByRole('combobox', { name: /stage/i })
      fireEvent.change(select, { target: { value: 'Yellow Stage' } })
      expect(screen.getByText('Hands-on TDD Workshop')).toBeInTheDocument()
      expect(screen.queryByText('Opening Keynote')).not.toBeInTheDocument()
    })
  })

  describe('clear filters', () => {
    it('does not show clear button when no filters active', () => {
      renderViewWithResult()
      expect(screen.queryByText(/clear filters/i)).not.toBeInTheDocument()
    })

    it('shows clear button when a filter is active', () => {
      renderViewWithResult()
      fireEvent.change(screen.getByRole('combobox', { name: /^tag$/i }), { target: { value: 'tdd' } })
      expect(screen.getByText(/clear filters/i)).toBeInTheDocument()
    })

    it('clears both filters when clear is clicked', () => {
      renderViewWithResult()
      fireEvent.change(screen.getByRole('combobox', { name: /^tag$/i }), { target: { value: 'tdd' } })
      fireEvent.change(screen.getByRole('combobox', { name: /stage/i }), { target: { value: 'Yellow Stage' } })
      fireEvent.click(screen.getByText(/clear filters/i))
      // All Day 1 sessions visible again
      expect(screen.getByText('Opening Keynote')).toBeInTheDocument()
      expect(screen.getByText('Deep Dive into DDD')).toBeInTheDocument()
      expect(screen.getByText('Hands-on TDD Workshop')).toBeInTheDocument()
    })
  })

  describe('session count', () => {
    it('shows total session count for the day', () => {
      renderViewWithResult()
      expect(screen.getByText('3 sessions')).toBeInTheDocument()
    })

    it('shows filtered count with "(filtered)" label', () => {
      renderViewWithResult()
      fireEvent.change(screen.getByRole('combobox', { name: /^tag$/i }), { target: { value: 'tdd' } })
      expect(screen.getByText('1 session (filtered)')).toBeInTheDocument()
    })
  })

  describe('URL param persistence', () => {
    it('updates URL when a filter changes', async () => {
      renderViewWithResult()
      fireEvent.change(screen.getByRole('combobox', { name: /^tag$/i }), { target: { value: 'tdd' } })
      await waitFor(() => {
        expect(window.location.search).toContain('tag=tdd')
      })
    })

    it('updates URL when day tab changes', async () => {
      renderViewWithResult()
      fireEvent.click(screen.getAllByRole('tab')[1])
      await waitFor(() => {
        expect(window.location.search).toContain('day=1')
      })
    })

    it('reads initial day from URL', () => {
      window.history.replaceState(null, '', '/?day=1')
      renderViewWithResult()
      const tabs = screen.getAllByRole('tab')
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByText('Day 2 Keynote')).toBeInTheDocument()
    })

    it('reads initial tag filter from URL', () => {
      window.history.replaceState(null, '', '/?tag=tdd')
      renderViewWithResult()
      expect(screen.getByText('Hands-on TDD Workshop')).toBeInTheDocument()
      expect(screen.queryByText('Opening Keynote')).not.toBeInTheDocument()
    })

    it('reads initial stage filter from URL', () => {
      window.history.replaceState(null, '', '/?stage=Yellow+Stage')
      renderViewWithResult()
      expect(screen.getByText('Hands-on TDD Workshop')).toBeInTheDocument()
      expect(screen.queryByText('Opening Keynote')).not.toBeInTheDocument()
    })
  })

  describe('bookmark buttons in session cards', () => {
    it('shows a bookmark button on each session card', () => {
      renderViewWithResult()
      const bookmarkBtns = screen.getAllByRole('button', { name: /personal schedule/i })
      // 3 sessions on Day 1
      expect(bookmarkBtns).toHaveLength(3)
    })

    it('bookmark button shows unbookmarked state when session is not bookmarked', () => {
      const { handle, doc } = makeFakeHandle([])
      renderView({ handle, userDoc: doc })
      const btn = screen.getAllByRole('button', { name: /add to personal schedule/i })
      expect(btn.length).toBeGreaterThan(0)
      expect(btn[0]).toHaveAttribute('aria-pressed', 'false')
    })

    it('bookmark button shows bookmarked state when session IS bookmarked', () => {
      const { handle, doc } = makeFakeHandle([101])
      renderView({ handle, userDoc: doc })
      // Slot 101 should now show "remove" label
      expect(
        screen.getByRole('button', { name: /remove from personal schedule/i }),
      ).toHaveAttribute('aria-pressed', 'true')
    })

    it('bookmark button is disabled when no handle provided', () => {
      renderViewWithResult()
      const btns = screen.getAllByRole('button', { name: /personal schedule/i })
      btns.forEach((btn) => expect(btn).toBeDisabled())
    })

    it('calls handle.change to add bookmark when clicked on unbookmarked session', () => {
      const { handle, doc } = makeFakeHandle([])
      renderView({ handle, userDoc: doc })
      const addBtns = screen.getAllByRole('button', { name: /add to personal schedule/i })
      fireEvent.click(addBtns[0]) // click bookmark on first card (slot 101)
      expect(handle.change).toHaveBeenCalledOnce()
    })

    it('calls handle.change to remove bookmark when clicked on bookmarked session', () => {
      const { handle, doc } = makeFakeHandle([101])
      renderView({ handle, userDoc: doc })
      const removeBtn = screen.getByRole('button', { name: /remove from personal schedule/i })
      fireEvent.click(removeBtn)
      expect(handle.change).toHaveBeenCalledOnce()
      // Verify the mutation logic removes slot 101
      const callArg = vi.mocked(handle.change).mock.calls[0][0]
      const mutDoc = makeUserDoc([101])
      callArg(mutDoc)
      expect(mutDoc.bookmarks).not.toContain(101)
    })

  describe('hide past events toggle', () => {
    // Day 1 date is 2026-06-04; sessions end at 10:10, 12:00, 11:00.
    // "now" set to 10:05 on that day → Opening Keynote (ends 10:10) is still future.
    // "now" set to 11:30 on that day → Opening Keynote (10:10) and DDD (11:00) are past.

    const DAY1_DATE = '2026-06-04'
    function dayMs(timeHHMM: string) {
      const [h, m] = timeHHMM.split(':').map(Number)
      const d = new Date(DAY1_DATE)
      d.setHours(h, m, 0, 0)
      return d.getTime()
    }

    it('renders the "Hide past events" checkbox', () => {
      renderView()
      expect(screen.getByRole('checkbox', { name: /hide past events/i })).toBeInTheDocument()
    })

    it('checkbox is unchecked when hidePastEvents is false', () => {
      const { doc } = makeFakeHandle([], false)
      renderView({ userDoc: doc })
      expect(screen.getByRole('checkbox', { name: /hide past events/i })).not.toBeChecked()
    })

    it('checkbox is checked when hidePastEvents is true', () => {
      const { handle, doc } = makeFakeHandle([], true)
      renderView({ handle, userDoc: doc })
      expect(screen.getByRole('checkbox', { name: /hide past events/i })).toBeChecked()
    })

    it('checkbox is disabled when no handle is provided', () => {
      renderView()
      expect(screen.getByRole('checkbox', { name: /hide past events/i })).toBeDisabled()
    })

    it('hides sessions that ended before now when hidePastEvents is true', () => {
      // now = 11:30 → Opening Keynote (ends 10:10) and DDD (ends 11:00) are past
      const { handle, doc } = makeFakeHandle([], true)
      renderView({ handle, userDoc: doc, nowMs: dayMs('11:30') })
      expect(screen.queryByText('Opening Keynote')).not.toBeInTheDocument()
      expect(screen.queryByText('Deep Dive into DDD')).not.toBeInTheDocument()
      // Workshop ends at 12:00 — still future
      expect(screen.getByText('Hands-on TDD Workshop')).toBeInTheDocument()
    })

    it('shows all sessions when hidePastEvents is false even if they are past', () => {
      const { doc } = makeFakeHandle([], false)
      renderView({ userDoc: doc, nowMs: dayMs('23:59') })
      expect(screen.getByText('Opening Keynote')).toBeInTheDocument()
      expect(screen.getByText('Deep Dive into DDD')).toBeInTheDocument()
      expect(screen.getByText('Hands-on TDD Workshop')).toBeInTheDocument()
    })

    it('calls handle.change to toggle hidePastEvents when checkbox is clicked', () => {
      const { handle, doc } = makeFakeHandle([], false)
      renderView({ handle, userDoc: doc })
      fireEvent.click(screen.getByRole('checkbox', { name: /hide past events/i }))
      expect(handle.change).toHaveBeenCalledOnce()
      // Verify mutation flips the flag
      const callArg = vi.mocked(handle.change).mock.calls[0][0]
      const mutDoc = makeUserDoc([], false)
      callArg(mutDoc)
      expect(mutDoc.hidePastEvents).toBe(true)
    })
  })

    it('does not bubble bookmark click to onOpenSession', () => {
      const { handle, doc } = makeFakeHandle([])
      const onOpenSession = vi.fn()
      renderView({ handle, userDoc: doc, onOpenSession })
      const addBtns = screen.getAllByRole('button', { name: /add to personal schedule/i })
      fireEvent.click(addBtns[0])
      expect(onOpenSession).not.toHaveBeenCalled()
    })
  })
})
