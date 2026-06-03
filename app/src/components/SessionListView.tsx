/**
 * Session list view — the main schedule browsing screen.
 *
 * Features:
 * - Day tabs (one per conference day)
 * - Session cards: title, time, stage/room, speakers, tags
 * - Filter by tag
 * - Filter by stage/room
 * - All filters reflected in URL query params (back/forward works)
 * - Scroll position preserved on navigation and refresh
 */

import { useRef, useCallback } from 'react'
import type { DocHandle } from '@automerge/automerge-repo'
import { useScheduleContext } from '../schedule/ScheduleContext'
import { useScrollRestoration } from '../schedule/useScrollRestoration'
import { useSessionListParams } from '../schedule/useSessionListParams'
import type { UserDocument } from '../types/user-document'
import type { Day } from '../types/schedule'
import { DayTabs, Filters } from './ScheduleShared'
import './SessionListView.css'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface SessionInfo {
  slotId: number
  title: string
  startTime: string
  endTime: string
  stageName: string
  stageColor: string
  speakers: string[]
  tags: string[]
  type: 'talk' | 'workshop'
  isKeynote: boolean
}

function extractSessions(day: Day): SessionInfo[] {
  const sessions: SessionInfo[] = []

  for (const stage of day.stages) {
    for (const slot of stage.slots) {
      const src = slot.talk ?? slot.workshop
      if (!src) continue

      sessions.push({
        slotId: slot.id,
        title: src.title,
        startTime: slot.start_time,
        endTime: slot.end_time,
        stageName: stage.name,
        stageColor: stage.color,
        speakers: src.speakers.map((s) => s.name),
        tags: src.tags.map((t) => t.name),
        type: slot.type === 'workshop' ? 'workshop' : 'talk',
        isKeynote: 'is_keynote' in src ? (src.is_keynote as boolean) : false,
      })
    }
  }

  // Sort chronologically
  sessions.sort((a, b) => a.startTime.localeCompare(b.startTime))
  return sessions
}

function collectTags(day: Day): string[] {
  const tags = new Set<string>()
  for (const stage of day.stages) {
    for (const slot of stage.slots) {
      const src = slot.talk ?? slot.workshop
      if (src) src.tags.forEach((t) => tags.add(t.name))
    }
  }
  return Array.from(tags).sort()
}

function collectStages(day: Day): string[] {
  const stages: string[] = []
  for (const stage of day.stages) {
    const hasSession = stage.slots.some((s) => s.talk ?? s.workshop)
    if (hasSession) stages.push(stage.name)
  }
  return stages
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface SessionCardProps {
  session: SessionInfo
  onOpen: (slotId: number) => void
  isBookmarked: boolean
  onToggleBookmark: (slotId: number) => void
  bookmarkDisabled: boolean
}

function SessionCard({ session, onOpen, isBookmarked, onToggleBookmark, bookmarkDisabled }: SessionCardProps) {
  const stageStyle = { '--stage-color': `#${session.stageColor}` } as React.CSSProperties

  function handleBookmarkClick(e: React.MouseEvent) {
    e.stopPropagation()
    onToggleBookmark(session.slotId)
  }

  return (
    <article
      className={`session-card${session.isKeynote ? ' session-card--keynote' : ''}${session.type === 'workshop' ? ' session-card--workshop' : ''} session-card--clickable`}
      style={stageStyle}
      data-slot-id={session.slotId}
      onClick={() => onOpen(session.slotId)}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${session.title}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(session.slotId) } }}
    >
      <div className="session-card__time">
        {session.startTime}–{session.endTime}
      </div>

      <div className="session-card__body">
        <h3 className="session-card__title">
          {session.isKeynote && <span className="session-badge session-badge--keynote">Keynote</span>}
          {session.type === 'workshop' && <span className="session-badge session-badge--workshop">Workshop</span>}
          {session.title}
        </h3>

        {session.speakers.length > 0 && (
          <p className="session-card__speakers">
            {session.speakers.join(', ')}
          </p>
        )}

        <div className="session-card__meta">
          <span
            className="session-card__stage"
            style={{ borderColor: `#${session.stageColor}` }}
          >
            {session.stageName}
          </span>

          {session.tags.length > 0 && (
            <ul className="session-card__tags" aria-label="Tags">
              {session.tags.map((tag) => (
                <li key={tag} className="session-tag">
                  {tag}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="session-card__bookmark">
        <button
          className={`session-card__bookmark-btn${isBookmarked ? ' session-card__bookmark-btn--active' : ''}`}
          aria-label={isBookmarked ? 'Remove from personal schedule' : 'Add to personal schedule'}
          aria-pressed={isBookmarked}
          disabled={bookmarkDisabled}
          onClick={handleBookmarkClick}
          title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
        >
          {isBookmarked ? '★' : '☆'}
        </button>
      </div>
    </article>
  )
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export interface SessionListViewProps {
  onOpenSession?: (slotId: number) => void
  handle?: DocHandle<UserDocument> | null
  userDoc?: UserDocument | null
  /** Injected current time (ms since epoch) for testability; defaults to Date.now() */
  nowMs?: number
}

export function SessionListView({ onOpenSession, handle = null, userDoc = null, nowMs }: SessionListViewProps = {}) {
  const { schedule, loading, error } = useScheduleContext()
  const { params, setDay, setTag, setStage } = useSessionListParams()
  const listRef = useRef<HTMLDivElement>(null)

  useScrollRestoration()

  const handleDayChange = useCallback((index: number) => {
    setDay(index)
  }, [setDay])

  if (loading) {
    return (
      <div className="session-list-loading" aria-live="polite">
        Loading schedule…
      </div>
    )
  }

  if (error) {
    return (
      <div className="session-list-error" role="alert">
        Failed to load schedule: {error.message}
      </div>
    )
  }

  const days = schedule.days
  const dayIndex = Math.min(params.day, days.length - 1)
  const currentDay = days[dayIndex]

  const allSessions = extractSessions(currentDay)
  const allTags = collectTags(currentDay)
  const allStages = collectStages(currentDay)

  const hidePastEvents = userDoc?.hidePastEvents ?? false

  const filteredSessions = allSessions.filter((s) => {
    if (params.tag && !s.tags.includes(params.tag)) return false
    if (params.stage && s.stageName !== params.stage) return false
    if (hidePastEvents) {
      // Parse "HH:MM" end time against the current day's date
      const [endH, endM] = s.endTime.split(':').map(Number)
      const endDate = new Date(currentDay.date)
      endDate.setHours(endH, endM, 0, 0)
      const now = nowMs !== undefined ? nowMs : Date.now()
      if (endDate.getTime() <= now) return false
    }
    return true
  })

  return (
    <div className="session-list-view">
      <DayTabs days={days} selectedIndex={dayIndex} onSelect={handleDayChange} />

      <div className="session-list-controls">
        <Filters
          tags={allTags}
          stages={allStages}
          selectedTag={params.tag}
          selectedStage={params.stage}
          hidePastEvents={hidePastEvents}
          onTagChange={setTag}
          onStageChange={setStage}
          onToggleHidePastEvents={() => {
            if (!handle) return
            handle.change((doc) => {
              doc.hidePastEvents = !doc.hidePastEvents
            })
          }}
          hidePastEventsDisabled={handle === null}
        />
        <p className="session-count" aria-live="polite">
          {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}
          {(params.tag || params.stage) ? ' (filtered)' : ''}
        </p>
      </div>

      <div
        id={`day-panel-${dayIndex}`}
        role="tabpanel"
        aria-labelledby={`day-tab-${dayIndex}`}
        className="session-list"
        ref={listRef}
      >
        {filteredSessions.length === 0 ? (
          <p className="session-list-empty">No sessions match the current filters.</p>
        ) : (
          filteredSessions.reduce<React.ReactNode[]>((nodes, session, idx) => {
            const isBookmarked = userDoc?.bookmarks.includes(session.slotId) ?? false
            const isNewSlot = idx === 0 || filteredSessions[idx - 1].startTime !== session.startTime
            if (isNewSlot) {
              nodes.push(
                <div
                  key={`timeslot-${session.startTime}`}
                  role="separator"
                  aria-label={session.startTime}
                  className="timeslot-separator"
                >
                  <span className="timeslot-separator__time">{session.startTime}</span>
                </div>
              )
            }
            nodes.push(
              <SessionCard
                key={session.slotId}
                session={session}
                onOpen={onOpenSession ?? (() => {})}
                isBookmarked={isBookmarked}
                bookmarkDisabled={handle === null}
                onToggleBookmark={(slotId) => {
                  if (!handle) return
                  handle.change((doc) => {
                    const idx = doc.bookmarks.indexOf(slotId)
                    if (idx === -1) {
                      doc.bookmarks.push(slotId)
                    } else {
                      doc.bookmarks.splice(idx, 1)
                    }
                  })
                }}
              />
            )
            return nodes
          }, [])
        )}
      </div>
    </div>
  )
}
