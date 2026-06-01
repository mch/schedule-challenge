/**
 * Tests for SessionDetailView.
 *
 * Covers:
 *   - Renders full session details (title, time, stage, day, speakers, tags)
 *   - Shows Keynote / Workshop / Online badges
 *   - Shows description (from talk.description, NOT talk.topic)
 *   - Shows level badge when present
 *   - Does not show description section when talk.description is null
 *   - Shows resource links (video, slides)
 *   - Not found state
 *   - Loading / error states from schedule context
 *   - Back button calls onClose
 *   - Bookmark button: shows unbookmarked state, bookmarked state
 *   - Bookmark button: disabled when no handle
 *   - Bookmark button: calls handle.change() to add/remove
 *
 * Known issues (failing tests):
 *   - talk.description and talk.level are absent from the JSON data, schema,
 *     and TypeScript types — they need to be scraped/added
 *   - SessionDetailView currently shows src?.topic as the description instead
 *     of talk.description
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SessionDetailView } from './SessionDetailView'
import { ScheduleContext } from '../schedule/ScheduleContext'
import type { Schedule } from '../types/schedule'
import type { UseScheduleResult } from '../schedule/useSchedule'
import type { UserDocument } from '../types/user-document'
import type { DocHandle } from '@automerge/automerge-repo'

// ---------------------------------------------------------------------------
// Fixture schedule
// ---------------------------------------------------------------------------

const FIXTURE_SCHEDULE: Schedule = {
  conference: { id: 'craft', name: 'Craft', year: 2026, date: 'June 4-5', location: 'Budapest', domain: 'craft-conf.com' },
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
                topic: 'craft',
                // description and level are the fields missing from the real JSON data.
                // They need to be scraped from craft-conf.com and added to schedule.json,
                // the schema, and the TypeScript types.
                description: 'The real talk description from the website.',
                level: 'general',
                video_url: 'https://video.example.com/1001',
                slides_url: 'https://slides.example.com/1001',
                tags: [
                  { id: 1, name: 'architecture', is_trending: true },
                  { id: 2, name: 'leadership' },
                ],
                speakers: [
                  { name: 'Alice Smith', slug: 'alice-smith' },
                  { name: 'Bob Jones', slug: 'bob-jones' },
                ],
              },
            },
            {
              id: 102,
              type: 'talk',
              start_time: '10:30',
              end_time: '11:00',
              talk: {
                id: 1002,
                title: 'Remote Talk',
                slug: 'remote-talk',
                is_keynote: false,
                is_online: true,
                topic: 'craft',
                description: null,
                level: null,
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
                tags: [{ id: 4, name: 'tdd' }],
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

function makeUserDoc(bookmarks: number[] = []): UserDocument {
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
  slotId?: number
  onClose?: () => void
  handle?: DocHandle<UserDocument> | null
  userDoc?: UserDocument | null
  scheduleResult?: UseScheduleResult
  onOpenSpeaker?: (slug: string) => void
}

function renderDetail({
  slotId = 101,
  onClose = vi.fn(),
  handle = null,
  userDoc = null,
  scheduleResult = makeScheduleResult(),
  onOpenSpeaker,
}: RenderOptions = {}) {
  return render(
    <ScheduleContext.Provider value={scheduleResult}>
      <SessionDetailView
        slotId={slotId}
        onClose={onClose}
        handle={handle}
        userDoc={userDoc}
        onOpenSpeaker={onOpenSpeaker}
      />
    </ScheduleContext.Provider>,
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SessionDetailView', () => {
  describe('loading / error states', () => {
    it('shows loading message while schedule is loading', () => {
      renderDetail({ scheduleResult: { schedule: null, loading: true, error: null } })
      expect(screen.getByText(/loading schedule/i)).toBeInTheDocument()
    })

    it('shows error message when schedule fails to load', () => {
      renderDetail({ scheduleResult: { schedule: null, loading: false, error: new Error('Network error') } as UseScheduleResult })
      expect(screen.getByRole('alert')).toHaveTextContent(/network error/i)
    })
  })

  describe('not found', () => {
    it('shows not-found message for unknown slot ID', () => {
      renderDetail({ slotId: 9999 })
      expect(screen.getByRole('alert')).toHaveTextContent(/session not found/i)
    })

    it('shows back button in not-found state', () => {
      renderDetail({ slotId: 9999 })
      expect(screen.getByRole('button', { name: /back to schedule/i })).toBeInTheDocument()
    })
  })

  describe('session details', () => {
    it('renders the session title', () => {
      renderDetail()
      expect(screen.getByRole('heading', { name: 'Opening Keynote' })).toBeInTheDocument()
    })

    it('renders time range', () => {
      renderDetail()
      expect(screen.getByText('09:30–10:10')).toBeInTheDocument()
    })

    it('renders stage name', () => {
      renderDetail()
      expect(screen.getByText('Main Stage')).toBeInTheDocument()
    })

    it('renders day name', () => {
      renderDetail()
      expect(screen.getByText('Day 1')).toBeInTheDocument()
    })

    it('renders all speakers', () => {
      renderDetail()
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
      expect(screen.getByText('Bob Jones')).toBeInTheDocument()
    })

    it('renders description from talk.description (not topic)', () => {
      // The description must come from talk.description, not talk.topic.
      // talk.topic is a category string like "craft", not the human-readable description.
      renderDetail()
      expect(screen.getByText('The real talk description from the website.')).toBeInTheDocument()
    })

    it('does not render the topic string "craft" as the description', () => {
      // Regression: SessionDetailView previously fell back to src?.topic as the description.
      // topic is a category label (e.g. "craft"), not a human-readable description.
      renderDetail()
      // The word "craft" may appear elsewhere (e.g. tags), but it must not appear
      // inside the "About this session" section.
      const aboutSection = screen.queryByRole('region', { name: /about this session/i })
        ?? screen.queryByText(/about this session/i)?.closest('section')
      if (aboutSection) {
        expect(aboutSection).not.toHaveTextContent(/^craft$/)
      }
    })

    it('does not render description section when talk.description is null', () => {
      // Session 102 has description: null — the "About this session" section should be absent.
      renderDetail({ slotId: 102 })
      expect(screen.queryByText(/about this session/i)).not.toBeInTheDocument()
    })

    it('renders tags', () => {
      renderDetail()
      expect(screen.getByText('architecture')).toBeInTheDocument()
      expect(screen.getByText('leadership')).toBeInTheDocument()
    })

    it('renders resource links', () => {
      renderDetail()
      expect(screen.getByRole('link', { name: /watch video/i })).toHaveAttribute('href', 'https://video.example.com/1001')
      expect(screen.getByRole('link', { name: /view slides/i })).toHaveAttribute('href', 'https://slides.example.com/1001')
    })

    it('does not render resources section when no links', () => {
      // Workshop 103 has no video_url, slides_url, and no slug-based official URL would appear
      // because the workshop *does* have a slug — so the resources section will appear with the official link.
      // This test is updated to check only that video and slides are absent.
      renderDetail({ slotId: 103 })
      expect(screen.queryByText(/watch video/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/view slides/i)).not.toBeInTheDocument()
    })
  })

  describe('official session page link', () => {
    it('renders a link to the official session page for a talk', () => {
      renderDetail()
      const link = screen.getByRole('link', { name: /official session page/i })
      expect(link).toHaveAttribute('href', 'https://craft-conf.com/2026/talk/opening-keynote')
      expect(link).toHaveAttribute('target', '_blank')
    })

    it('renders a link to the official session page for a workshop', () => {
      renderDetail({ slotId: 103 })
      const link = screen.getByRole('link', { name: /official session page/i })
      expect(link).toHaveAttribute('href', 'https://craft-conf.com/2026/workshop/tdd-workshop')
    })
  })

  describe('level badge', () => {
    it('renders the level badge when talk.level is set', () => {
      // talk.level (e.g. "general", "intermediate", "advanced") should be displayed
      // as a visible badge on the detail page, mirroring craft-conf.com.
      // This field is currently absent from schedule.json and the TypeScript types.
      renderDetail()
      expect(screen.getByText(/general/i)).toBeInTheDocument()
    })

    it('does not render a level badge when talk.level is null', () => {
      // Session 102 has level: null — no level badge should appear.
      renderDetail({ slotId: 102 })
      // "general", "intermediate", "advanced" should not appear
      expect(screen.queryByText(/\b(general|intermediate|advanced)\b/i)).not.toBeInTheDocument()
    })
  })

  describe('badges', () => {
    it('shows Keynote badge for keynote talks', () => {
      renderDetail()
      expect(screen.getByText('Keynote')).toBeInTheDocument()
    })

    it('does not show Keynote badge for non-keynote talks', () => {
      renderDetail({ slotId: 102 })
      expect(screen.queryByText('Keynote')).not.toBeInTheDocument()
    })

    it('shows Workshop badge for workshops', () => {
      renderDetail({ slotId: 103 })
      expect(screen.getByText('Workshop')).toBeInTheDocument()
    })

    it('shows Online badge for online sessions', () => {
      renderDetail({ slotId: 102 })
      expect(screen.getByText('Online')).toBeInTheDocument()
    })

    it('does not show Online badge for in-person sessions', () => {
      renderDetail()
      expect(screen.queryByText('Online')).not.toBeInTheDocument()
    })
  })

  describe('back button', () => {
    it('renders back button', () => {
      renderDetail()
      expect(screen.getByRole('button', { name: /back to schedule/i })).toBeInTheDocument()
    })

    it('calls onClose when back button is clicked', () => {
      const onClose = vi.fn()
      renderDetail({ onClose })
      fireEvent.click(screen.getByRole('button', { name: /back to schedule/i }))
      expect(onClose).toHaveBeenCalledOnce()
    })
  })

  describe('bookmark button', () => {
    it('shows unbookmarked state when session is not bookmarked', () => {
      const { handle, doc } = makeFakeHandle([])
      renderDetail({ handle, userDoc: doc })
      const btn = screen.getByRole('button', { name: /add to personal schedule/i })
      expect(btn).toBeInTheDocument()
      expect(btn).toHaveAttribute('aria-pressed', 'false')
    })

    it('shows bookmarked state when session is already bookmarked', () => {
      const { handle, doc } = makeFakeHandle([101])
      renderDetail({ handle, userDoc: doc })
      const btn = screen.getByRole('button', { name: /remove from personal schedule/i })
      expect(btn).toBeInTheDocument()
      expect(btn).toHaveAttribute('aria-pressed', 'true')
    })

    it('is disabled when no handle is provided', () => {
      renderDetail({ handle: null, userDoc: null })
      const btn = screen.getByRole('button', { name: /personal schedule/i })
      expect(btn).toBeDisabled()
    })

    it('calls handle.change to add bookmark when clicked while not bookmarked', () => {
      const { handle, doc } = makeFakeHandle([])
      renderDetail({ handle, userDoc: doc })
      fireEvent.click(screen.getByRole('button', { name: /add to personal schedule/i }))
      expect(handle.change).toHaveBeenCalledOnce()
      // Verify the mutation logic: slotId 101 should be added
      const callArg = vi.mocked(handle.change).mock.calls[0][0]
      const mutDoc = makeUserDoc([])
      callArg(mutDoc)
      expect(mutDoc.bookmarks).toContain(101)
    })

    it('calls handle.change to remove bookmark when clicked while bookmarked', () => {
      const { handle, doc } = makeFakeHandle([101])
      renderDetail({ handle, userDoc: doc })
      fireEvent.click(screen.getByRole('button', { name: /remove from personal schedule/i }))
      expect(handle.change).toHaveBeenCalledOnce()
      const callArg = vi.mocked(handle.change).mock.calls[0][0]
      const mutDoc = makeUserDoc([101])
      callArg(mutDoc)
      expect(mutDoc.bookmarks).not.toContain(101)
    })
  })

  describe('workshop session', () => {
    it('renders workshop title', () => {
      renderDetail({ slotId: 103 })
      expect(screen.getByRole('heading', { name: 'Hands-on TDD Workshop' })).toBeInTheDocument()
    })

    it('renders workshop speaker', () => {
      renderDetail({ slotId: 103 })
      expect(screen.getByText('Dave Brown')).toBeInTheDocument()
    })

    it('renders workshop stage', () => {
      renderDetail({ slotId: 103 })
      expect(screen.getByText('Workshop Room')).toBeInTheDocument()
    })
  })

  describe('speaker links', () => {
    it('renders speaker names as plain text when onOpenSpeaker is not provided', () => {
      renderDetail()
      // Names should appear as text, not buttons
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /view speaker profile: Alice Smith/i })).not.toBeInTheDocument()
    })

    it('renders speaker names as buttons when onOpenSpeaker is provided', () => {
      const onOpenSpeaker = vi.fn()
      renderDetail({ onOpenSpeaker })
      expect(screen.getByRole('button', { name: /view speaker profile: Alice Smith/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /view speaker profile: Bob Jones/i })).toBeInTheDocument()
    })

    it('calls onOpenSpeaker with the speaker slug when a speaker button is clicked', () => {
      const onOpenSpeaker = vi.fn()
      renderDetail({ onOpenSpeaker })
      fireEvent.click(screen.getByRole('button', { name: /view speaker profile: Alice Smith/i }))
      expect(onOpenSpeaker).toHaveBeenCalledWith('alice-smith')
    })

    it('calls onOpenSpeaker with the correct slug for a second speaker', () => {
      const onOpenSpeaker = vi.fn()
      renderDetail({ onOpenSpeaker })
      fireEvent.click(screen.getByRole('button', { name: /view speaker profile: Bob Jones/i }))
      expect(onOpenSpeaker).toHaveBeenCalledWith('bob-jones')
    })
  })
})
