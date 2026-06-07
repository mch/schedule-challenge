/**
 * Personal schedule view — shows the user's bookmarked sessions.
 *
 * Features:
 * - Empty state when no bookmarks
 * - Bookmarked sessions grouped by conference day
 * - Sessions sorted chronologically within each day
 * - Overlap detection: warns when two bookmarked sessions overlap in time
 * - Tag and stage/room filter dropdowns, scoped to bookmarked sessions on the selected day
 * - Filters reflected in URL (?tag= and ?stage= params, shared with the full schedule)
 * - Remove bookmark button on each card
 * - Clicking a card opens the session detail view
 *
 * Props:
 *   userDoc        — current snapshot of the user document (or null)
 *   handle         — Automerge DocHandle for the user doc (optional; remove
 *                    button is disabled when null)
 *   onOpenSession  — called with slotId when the user clicks a card
 */

import type { DocHandle } from '@automerge/automerge-repo'
import { useCallback } from 'react'
import { useScheduleContext } from '../schedule/ScheduleContext'
import { useScrollRestoration } from '../schedule/useScrollRestoration'
import { useSessionListParams } from '../schedule/useSessionListParams'
import type { Day, Slot, Stage } from '../types/schedule'
import type { UserDocument } from '../types/user-document'
import { DayTabs, Filters } from './ScheduleShared'
import './PersonalScheduleView.css'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BookmarkedSession {
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
  overlaps: boolean
}

interface DayGroup {
  dayId: number
  dayName: string
  sessions: BookmarkedSession[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse "HH:MM" into minutes-since-midnight for comparison. */
function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/** Returns true if two time intervals [aStart, aEnd) and [bStart, bEnd) overlap. */
function timesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return (
    toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd)
  )
}

/** Collect unique sorted tag names from a list of bookmarked sessions. */
function collectTagsFromSessions(sessions: BookmarkedSession[]): string[] {
  const tags = new Set<string>()
  for (const s of sessions) for (const t of s.tags) tags.add(t)
  return Array.from(tags).sort()
}

/** Collect unique stage names (in schedule order) from a list of bookmarked sessions. */
function collectStagesFromSessions(sessions: BookmarkedSession[]): string[] {
  const seen = new Set<string>()
  const stages: string[] = []
  for (const s of sessions) {
    if (!seen.has(s.stageName)) {
      seen.add(s.stageName)
      stages.push(s.stageName)
    }
  }
  return stages
}

/**
 * Build DayGroup[] from a list of bookmarked slot IDs + the full schedule.
 * Slots not found in the schedule are silently ignored.
 */
function buildDayGroups(
  schedule: ReturnType<typeof useScheduleContext>['schedule'],
  bookmarks: number[],
): DayGroup[] {
  if (!schedule) return []

  // Collect all slot metadata keyed by slot ID
  const slotMap = new Map<number, { slot: Slot; stage: Stage; day: Day }>()
  for (const day of schedule.days) {
    for (const stage of day.stages) {
      for (const slot of stage.slots) {
        slotMap.set(slot.id, { slot, stage, day })
      }
    }
  }

  // Build flat list of found bookmarks
  const found: { slotId: number; slot: Slot; stage: Stage; day: Day }[] = []
  for (const id of bookmarks) {
    const entry = slotMap.get(id)
    if (entry) found.push({ slotId: id, ...entry })
  }

  if (found.length === 0) return []

  // Detect overlaps across ALL bookmarked sessions (regardless of day —
  // same-day overlap is the relevant case in practice, but we check all pairs)
  const overlapSet = new Set<number>()
  for (let i = 0; i < found.length; i++) {
    for (let j = i + 1; j < found.length; j++) {
      const a = found[i].slot
      const b = found[j].slot
      if (
        found[i].day.id === found[j].day.id &&
        timesOverlap(a.start_time, a.end_time, b.start_time, b.end_time)
      ) {
        overlapSet.add(found[i].slotId)
        overlapSet.add(found[j].slotId)
      }
    }
  }

  // Group by day, maintaining schedule day order
  const groupMap = new Map<number, DayGroup>()
  for (const day of schedule.days) {
    // Insert placeholder in map-iteration order
    groupMap.set(day.id, { dayId: day.id, dayName: day.name, sessions: [] })
  }

  for (const { slotId, slot, stage, day } of found) {
    const src = slot.talk ?? slot.workshop
    if (!src) continue

    const group = groupMap.get(day.id)!
    group.sessions.push({
      slotId,
      title: src.title,
      startTime: slot.start_time,
      endTime: slot.end_time,
      stageName: stage.name,
      stageColor: stage.color,
      speakers: src.speakers.map((s) => s.name),
      tags: src.tags.map((t) => t.name),
      type: slot.type === 'workshop' ? 'workshop' : 'talk',
      isKeynote: 'is_keynote' in src ? (src.is_keynote as boolean) : false,
      overlaps: overlapSet.has(slotId),
    })
  }

  // Sort sessions within each group, remove empty groups
  const result: DayGroup[] = []
  for (const group of groupMap.values()) {
    if (group.sessions.length === 0) continue
    group.sessions.sort((a, b) => a.startTime.localeCompare(b.startTime))
    result.push(group)
  }

  return result
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface BookmarkedSessionCardProps {
  session: BookmarkedSession
  onOpen: (slotId: number) => void
  onRemove: (slotId: number) => void
  removeDisabled: boolean
}

function BookmarkedSessionCard({
  session,
  onOpen,
  onRemove,
  removeDisabled,
}: BookmarkedSessionCardProps) {
  const stageStyle = {
    '--stage-color': `#${session.stageColor}`,
  } as React.CSSProperties

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onOpen(session.slotId)
    }
  }

  function handleRemoveClick(e: React.MouseEvent) {
    e.stopPropagation()
    onRemove(session.slotId)
  }

  return (
    <article
      className={`session-card session-card--clickable${session.isKeynote ? ' session-card--keynote' : ''}${session.overlaps ? ' session-card--overlap' : ''}`}
      style={stageStyle}
      data-slot-id={session.slotId}
      onClick={() => onOpen(session.slotId)}
      aria-label={`View details for ${session.title}`}
      onKeyDown={handleKeyDown}
    >
      <div className="session-card__time">
        {session.startTime}–{session.endTime}
      </div>

      <div className="session-card__body">
        <h3 className="session-card__title">
          {session.isKeynote && (
            <span className="session-badge session-badge--keynote">
              Keynote
            </span>
          )}
          {session.type === 'workshop' && (
            <span className="session-badge session-badge--workshop">
              Workshop
            </span>
          )}
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

          {session.overlaps && (
            <span
              role="img"
              className="session-card__overlap-badge"
              aria-label="Overlaps with another bookmarked session"
            >
              ⚠ overlap
            </span>
          )}
        </div>
      </div>

      <div className="session-card__actions">
        <button
          type="button"
          className="session-card__remove"
          aria-label="Remove from personal schedule"
          disabled={removeDisabled}
          onClick={handleRemoveClick}
          title="Remove bookmark"
        >
          ★
        </button>
      </div>
    </article>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export interface PersonalScheduleViewProps {
  userDoc: UserDocument | null
  handle: DocHandle<UserDocument> | null
  onOpenSession: (slotId: number) => void
  /** Injected current time (ms since epoch) for testability; defaults to Date.now() */
  nowMs?: number
}

export function PersonalScheduleView({
  userDoc,
  handle,
  onOpenSession,
  nowMs,
}: PersonalScheduleViewProps) {
  const { schedule, loading, error } = useScheduleContext()
  const { params, setDay, setTag, setStage } = useSessionListParams()

  useScrollRestoration()

  const handleDayChange = useCallback(
    (index: number) => {
      setDay(index)
    },
    [setDay],
  )

  if (loading) {
    return (
      <div className="personal-schedule-loading" aria-live="polite">
        Loading schedule…
      </div>
    )
  }

  if (error) {
    return (
      <div className="personal-schedule-error" role="alert">
        Failed to load schedule: {error.message}
      </div>
    )
  }

  const days = schedule.days
  const dayIndex = Math.min(params.day, days.length - 1)
  const currentDay = days[dayIndex]

  const bookmarks = userDoc?.bookmarks ?? []
  const allDayGroups = buildDayGroups(schedule, bookmarks)

  // Only show sessions for the currently selected day
  const currentGroup =
    allDayGroups.find((g) => g.dayId === currentDay.id) ?? null

  // Filter options are derived from the bookmarked sessions on the current day
  const daySessions = currentGroup?.sessions ?? []
  const availableTags = collectTagsFromSessions(daySessions)
  const availableStages = collectStagesFromSessions(daySessions)

  const hidePastEvents = userDoc?.hidePastEvents ?? false

  // Apply active filters
  const filteredSessions = daySessions.filter((s) => {
    if (params.tag && !s.tags.includes(params.tag)) return false
    if (params.stage && s.stageName !== params.stage) return false
    if (hidePastEvents) {
      const [endH, endM] = s.endTime.split(':').map(Number)
      const endDate = new Date(currentDay.date)
      endDate.setHours(endH, endM, 0, 0)
      const now = nowMs !== undefined ? nowMs : Date.now()
      if (endDate.getTime() <= now) return false
    }
    return true
  })

  function handleRemove(slotId: number) {
    if (!handle) return
    handle.change((doc) => {
      const idx = doc.bookmarks.indexOf(slotId)
      if (idx !== -1) doc.bookmarks.splice(idx, 1)
    })
  }

  return (
    <div className="personal-schedule-view">
      <DayTabs
        days={days}
        selectedIndex={dayIndex}
        onSelect={handleDayChange}
        idPrefix="my-day"
      />

      {currentGroup && (
        <div className="session-list-controls">
          <Filters
            tags={availableTags}
            stages={availableStages}
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
            idPrefix="my-"
          />
          <p className="session-count" aria-live="polite">
            {filteredSessions.length} session
            {filteredSessions.length !== 1 ? 's' : ''}
            {params.tag || params.stage ? ' (filtered)' : ''}
          </p>
        </div>
      )}

      <div
        id={`my-day-panel-${dayIndex}`}
        role="tabpanel"
        aria-labelledby={`my-day-tab-${dayIndex}`}
        className="personal-schedule-day-panel"
      >
        {!currentGroup ? (
          <div className="personal-schedule-empty">
            <p className="personal-schedule-empty__message">
              {bookmarks.length === 0
                ? 'No bookmarks yet — star sessions in the schedule to build your personal agenda.'
                : `No bookmarks for ${currentDay.name} yet.`}
            </p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="personal-schedule-empty">
            <p className="personal-schedule-empty__message">
              No bookmarked sessions match the current filters.
            </p>
          </div>
        ) : (
          <div className="personal-schedule-sessions">
            {filteredSessions.reduce<React.ReactNode[]>(
              (nodes, session, idx) => {
                const isNewSlot =
                  idx === 0 ||
                  filteredSessions[idx - 1].startTime !== session.startTime
                if (isNewSlot) {
                  nodes.push(
                    <section
                      key={`timeslot-${session.startTime}`}
                      aria-label={session.startTime}
                      className="timeslot-separator"
                    >
                      <hr
                        aria-label={session.startTime}
                        className="timeslot-separator__rule"
                      />
                      <span className="timeslot-separator__time">
                        {session.startTime}
                      </span>
                    </section>,
                  )
                }
                nodes.push(
                  <BookmarkedSessionCard
                    key={session.slotId}
                    session={session}
                    onOpen={onOpenSession}
                    onRemove={handleRemove}
                    removeDisabled={handle === null}
                  />,
                )
                return nodes
              },
              [],
            )}
          </div>
        )}
      </div>
    </div>
  )
}
