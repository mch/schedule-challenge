/**
 * Speaker detail view (Option B — in-app, no scraping).
 *
 * Derives all speaker information from the existing schedule data:
 *   - Speaker name
 *   - All their talks, workshops, and other events across both days
 *   - A clearly labelled external link to craft-conf.com/2026/speakers/{slug}
 *     for the full bio and photo
 *
 * Props:
 *   speakerSlug   — URL slug of the speaker to display
 *   onClose       — called when the user navigates back
 *   onOpenSession — called when the user taps a session card to open its detail
 */

import { useScheduleContext } from '../schedule/ScheduleContext'
import { useScrollRestoration } from '../schedule/useScrollRestoration'
import type { Day, Slot, Speaker, Stage } from '../types/schedule'
import './SpeakerDetailView.css'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SpeakerSession {
  slot: Slot
  stage: Stage
  day: Day
  title: string
  type: 'talk' | 'workshop'
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findSpeakerSessions(
  schedule: ReturnType<typeof useScheduleContext>['schedule'],
  speakerSlug: string,
): { speaker: Speaker | null; sessions: SpeakerSession[] } {
  if (!schedule) return { speaker: null, sessions: [] }

  let foundSpeaker: Speaker | null = null
  const sessions: SpeakerSession[] = []

  for (const day of schedule.days) {
    for (const stage of day.stages) {
      for (const slot of stage.slots) {
        const src = slot.talk ?? slot.workshop
        if (!src) continue
        const match = src.speakers.find((s) => s.slug === speakerSlug)
        if (!match) continue
        if (!foundSpeaker) foundSpeaker = match
        const type = slot.type === 'workshop' ? 'workshop' : 'talk'
        sessions.push({ slot, stage, day, title: src.title, type })
      }
    }
  }

  return { speaker: foundSpeaker, sessions }
}

function speakerProfileUrl(domain: string | undefined, slug: string): string {
  const host = domain ?? 'craft-conf.com'
  return `https://${host}/2026/speaker/${slug}`
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface SessionCardProps {
  session: SpeakerSession
  onOpen: (slotId: number) => void
}

function SessionCard({ session, onOpen }: SessionCardProps) {
  const { slot, stage, day, title, type } = session
  const stageStyle = {
    '--stage-color': `#${stage.color}`,
  } as React.CSSProperties
  const isKeynote = slot.talk?.is_keynote ?? false
  const isOnline = slot.talk?.is_online ?? false

  return (
    <li className="speaker-session-card" style={stageStyle}>
      <button
        className="speaker-session-card__inner"
        onClick={() => onOpen(slot.id)}
        aria-label={`View session: ${title}`}
      >
        <div className="speaker-session-card__badges">
          {isKeynote && (
            <span className="session-badge session-badge--keynote">
              Keynote
            </span>
          )}
          {type === 'workshop' && (
            <span className="session-badge session-badge--workshop">
              Workshop
            </span>
          )}
          {isOnline && (
            <span className="session-badge session-badge--online">Online</span>
          )}
        </div>
        <span className="speaker-session-card__title">{title}</span>
        <div className="speaker-session-card__meta">
          <span className="speaker-session-card__time">
            {slot.start_time}–{slot.end_time}
          </span>
          <span
            className="speaker-session-card__stage"
            style={{ borderColor: `#${stage.color}` }}
          >
            {stage.name}
          </span>
          <span className="speaker-session-card__day">{day.name}</span>
        </div>
      </button>
    </li>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export interface SpeakerDetailViewProps {
  speakerSlug: string
  onClose: () => void
  onOpenSession: (slotId: number) => void
}

export function SpeakerDetailView({
  speakerSlug,
  onClose,
  onOpenSession,
}: SpeakerDetailViewProps) {
  useScrollRestoration()
  const { schedule, loading, error } = useScheduleContext()

  if (loading) {
    return (
      <div className="speaker-detail-loading" aria-live="polite">
        Loading schedule…
      </div>
    )
  }

  if (error) {
    return (
      <div className="speaker-detail-error" role="alert">
        Failed to load schedule: {error.message}
      </div>
    )
  }

  const { speaker, sessions } = findSpeakerSessions(schedule, speakerSlug)

  if (!speaker) {
    return (
      <div className="speaker-detail-not-found" role="alert">
        <button className="speaker-detail-back" onClick={onClose}>
          ← Back
        </button>
        <p>Speaker not found.</p>
      </div>
    )
  }

  const profileUrl = speakerProfileUrl(schedule?.conference.domain, speakerSlug)

  return (
    <div className="speaker-detail-view">
      {/* Back navigation */}
      <button
        className="speaker-detail-back"
        onClick={onClose}
        aria-label="Back"
      >
        ← Back
      </button>

      {/* Header */}
      <header className="speaker-detail-header">
        <h2 className="speaker-detail-name">{speaker.name}</h2>
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="speaker-detail-profile-link"
          aria-label={`View ${speaker.name}'s full profile on craft-conf.com`}
        >
          Full bio &amp; photo on craft-conf.com ↗
        </a>
      </header>

      {/* Sessions */}
      {sessions.length > 0 ? (
        <section className="speaker-detail-section" aria-label="Sessions">
          <h3 className="speaker-detail-section-title">
            {sessions.length === 1 ? 'Session' : 'Sessions'}
          </h3>
          <ul className="speaker-sessions-list">
            {sessions.map((s) => (
              <SessionCard key={s.slot.id} session={s} onOpen={onOpenSession} />
            ))}
          </ul>
        </section>
      ) : (
        <p className="speaker-detail-no-sessions">
          No sessions found for this speaker.
        </p>
      )}
    </div>
  )
}
