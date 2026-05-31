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

import { useEffect, useRef, useCallback } from 'react'
import { useScheduleContext } from '../schedule/ScheduleContext'
import { useSessionListParams } from '../schedule/useSessionListParams'
import type { Day, Slot, Stage } from '../types/schedule'
import './SessionListView.css'

// ---------------------------------------------------------------------------
// Scroll-position preservation
// ---------------------------------------------------------------------------
const SCROLL_KEY = 'session-list-scroll'

function saveScroll() {
  sessionStorage.setItem(SCROLL_KEY, String(window.scrollY))
}

function restoreScroll() {
  const y = parseInt(sessionStorage.getItem(SCROLL_KEY) ?? '0', 10)
  if (y > 0) window.scrollTo({ top: y, behavior: 'instant' })
}

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
        isKeynote: 'is_keynote' in src ? src.is_keynote : false,
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

interface DayTabsProps {
  days: { id: number; name: string }[]
  selectedIndex: number
  onSelect: (index: number) => void
}

function DayTabs({ days, selectedIndex, onSelect }: DayTabsProps) {
  return (
    <div className="day-tabs" role="tablist" aria-label="Conference days">
      {days.map((day, i) => (
        <button
          key={day.id}
          role="tab"
          aria-selected={i === selectedIndex}
          aria-controls={`day-panel-${i}`}
          id={`day-tab-${i}`}
          className={`day-tab${i === selectedIndex ? ' day-tab--active' : ''}`}
          onClick={() => onSelect(i)}
        >
          {day.name}
        </button>
      ))}
    </div>
  )
}

interface FiltersProps {
  tags: string[]
  stages: string[]
  selectedTag: string
  selectedStage: string
  onTagChange: (tag: string) => void
  onStageChange: (stage: string) => void
}

function Filters({ tags, stages, selectedTag, selectedStage, onTagChange, onStageChange }: FiltersProps) {
  return (
    <div className="session-filters" aria-label="Session filters">
      <label className="filter-label" htmlFor="tag-filter">
        Tag
        <select
          id="tag-filter"
          className="filter-select"
          value={selectedTag}
          onChange={(e) => onTagChange(e.target.value)}
        >
          <option value="">All tags</option>
          {tags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </label>

      <label className="filter-label" htmlFor="stage-filter">
        Stage / Room
        <select
          id="stage-filter"
          className="filter-select"
          value={selectedStage}
          onChange={(e) => onStageChange(e.target.value)}
        >
          <option value="">All stages</option>
          {stages.map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </select>
      </label>

      {(selectedTag || selectedStage) && (
        <button
          className="filter-clear"
          onClick={() => { onTagChange(''); onStageChange('') }}
        >
          Clear filters
        </button>
      )}
    </div>
  )
}

interface SessionCardProps {
  session: SessionInfo
}

function SessionCard({ session }: SessionCardProps) {
  const stageStyle = { '--stage-color': `#${session.stageColor}` } as React.CSSProperties

  return (
    <article
      className={`session-card${session.isKeynote ? ' session-card--keynote' : ''}${session.type === 'workshop' ? ' session-card--workshop' : ''}`}
      style={stageStyle}
      data-slot-id={session.slotId}
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
    </article>
  )
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export function SessionListView() {
  const { schedule, loading, error } = useScheduleContext()
  const { params, setDay, setTag, setStage } = useSessionListParams()
  const listRef = useRef<HTMLDivElement>(null)

  // Restore scroll on mount
  useEffect(() => {
    restoreScroll()
  }, [])

  // Save scroll on unload / visibility change
  useEffect(() => {
    window.addEventListener('beforeunload', saveScroll)
    document.addEventListener('visibilitychange', saveScroll)
    return () => {
      window.removeEventListener('beforeunload', saveScroll)
      document.removeEventListener('visibilitychange', saveScroll)
    }
  }, [])

  // Save scroll when switching day / changing filters
  const handleDayChange = useCallback((index: number) => {
    saveScroll()
    setDay(index)
    window.scrollTo({ top: 0, behavior: 'instant' })
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

  const filteredSessions = allSessions.filter((s) => {
    if (params.tag && !s.tags.includes(params.tag)) return false
    if (params.stage && s.stageName !== params.stage) return false
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
          onTagChange={setTag}
          onStageChange={setStage}
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
          filteredSessions.map((session) => (
            <SessionCard key={session.slotId} session={session} />
          ))
        )}
      </div>
    </div>
  )
}
