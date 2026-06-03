/**
 * Speakers list view — a searchable, alphabetically sorted list of all
 * speakers derived from the schedule data.
 *
 * Each speaker card shows the speaker's name, their session count, and
 * clicking it opens the SpeakerDetailView.
 *
 * The search input filters by name in real time.
 */

import { useMemo } from 'react'
import { useScheduleContext } from '../schedule/ScheduleContext'
import { useScrollRestoration } from '../schedule/useScrollRestoration'
import { useSessionListParams } from '../schedule/useSessionListParams'
import type { Schedule, Speaker } from '../types/schedule'
import './SpeakersListView.css'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface SpeakerEntry extends Speaker {
  sessionCount: number
}

function collectSpeakers(schedule: Schedule): SpeakerEntry[] {
  const map = new Map<string, { speaker: Speaker; count: number }>()

  for (const day of schedule.days) {
    for (const stage of day.stages) {
      for (const slot of stage.slots) {
        const src = slot.talk ?? slot.workshop
        if (!src) continue
        for (const sp of src.speakers) {
          const existing = map.get(sp.slug)
          if (existing) {
            existing.count += 1
          } else {
            map.set(sp.slug, { speaker: sp, count: 1 })
          }
        }
      }
    }
  }

  return Array.from(map.values())
    .map(({ speaker, count }) => ({ ...speaker, sessionCount: count }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface SpeakerCardProps {
  speaker: SpeakerEntry
  onOpen: (slug: string) => void
}

function SpeakerCard({ speaker, onOpen }: SpeakerCardProps) {
  return (
    <li className="speaker-list-card">
      <button
        className="speaker-list-card__btn"
        onClick={() => onOpen(speaker.slug)}
        aria-label={`View ${speaker.name}'s sessions`}
      >
        <span className="speaker-list-card__name">{speaker.name}</span>
        <span
          className="speaker-list-card__count"
          aria-label={`${speaker.sessionCount} session${speaker.sessionCount !== 1 ? 's' : ''}`}
        >
          {speaker.sessionCount} session{speaker.sessionCount !== 1 ? 's' : ''}
        </span>
      </button>
    </li>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export interface SpeakersListViewProps {
  onOpenSpeaker: (slug: string) => void
}

export function SpeakersListView({ onOpenSpeaker }: SpeakersListViewProps) {
  useScrollRestoration()
  const { schedule, loading, error } = useScheduleContext()
  const { params, setSpeakersSearch } = useSessionListParams()
  const search = params.speakersSearch

  const allSpeakers = useMemo(
    () => (schedule ? collectSpeakers(schedule) : []),
    [schedule],
  )

  const filteredSpeakers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return allSpeakers
    return allSpeakers.filter((s) => s.name.toLowerCase().includes(q))
  }, [allSpeakers, search])

  if (loading) {
    return (
      <div className="speakers-list-loading" aria-live="polite">
        Loading schedule…
      </div>
    )
  }

  if (error) {
    return (
      <div className="speakers-list-error" role="alert">
        Failed to load schedule: {error.message}
      </div>
    )
  }

  return (
    <div className="speakers-list-view">
      <div className="speakers-list-header">
        <h2 className="speakers-list-title">Speakers</h2>
        <p className="speakers-list-subtitle">
          {allSpeakers.length} speakers at Craft 2026
        </p>
      </div>

      <div className="speakers-list-search-wrap">
        <label htmlFor="speaker-search" className="sr-only">
          Search speakers
        </label>
        <input
          id="speaker-search"
          type="search"
          className="speakers-list-search"
          placeholder="Search speakers…"
          value={search}
          onChange={(e) => setSpeakersSearch(e.target.value)}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>

      {filteredSpeakers.length === 0 ? (
        <p className="speakers-list-empty">
          No speakers match &ldquo;{search}&rdquo;.
        </p>
      ) : (
        <ul className="speakers-list" aria-label="Speakers">
          {filteredSpeakers.map((speaker) => (
            <SpeakerCard
              key={speaker.slug}
              speaker={speaker}
              onOpen={onOpenSpeaker}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
