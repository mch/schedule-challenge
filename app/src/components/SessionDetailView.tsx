/**
 * Session detail view.
 *
 * Shows the full details of a single session (slot):
 *   - Back button (returns to list)
 *   - Title, type badges (Keynote / Workshop)
 *   - Time and stage/room
 *   - Speaker(s)
 *   - Description
 *   - Tags
 *   - Bookmark button (toggle add/remove from personal schedule)
 *
 * Props:
 *   slotId       — the ID of the slot to display
 *   onClose      — called when the user navigates back
 *   handle       — Automerge DocHandle for the user doc (optional; bookmark
 *                  button is disabled when null)
 *   userDoc      — current snapshot of the user document (or null)
 *   onOpenSpeaker — optional callback; when provided, speaker names are
 *                   rendered as buttons that open the speaker detail view
 */

import type { DocHandle } from '@automerge/automerge-repo'
import { useScheduleContext } from '../schedule/ScheduleContext'
import type { UserDocument } from '../types/user-document'
import type { Day, Slot, Stage } from '../types/schedule'
import './SessionDetailView.css'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface FoundSlot {
  slot: Slot
  stage: Stage
  day: Day
}

function findSlot(schedule: ReturnType<typeof useScheduleContext>['schedule'], slotId: number): FoundSlot | null {
  if (!schedule) return null
  for (const day of schedule.days) {
    for (const stage of day.stages) {
      for (const slot of stage.slots) {
        if (slot.id === slotId) return { slot, stage, day }
      }
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface BookmarkButtonProps {
  isBookmarked: boolean
  disabled: boolean
  onToggle: () => void
}

function BookmarkButton({ isBookmarked, disabled, onToggle }: BookmarkButtonProps) {
  return (
    <button
      className={`bookmark-button${isBookmarked ? ' bookmark-button--active' : ''}`}
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={isBookmarked}
      aria-label={isBookmarked ? 'Remove from personal schedule' : 'Add to personal schedule'}
    >
      <span className="bookmark-button__icon" aria-hidden="true">
        {isBookmarked ? '★' : '☆'}
      </span>
      {isBookmarked ? 'Bookmarked' : 'Bookmark'}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export interface SessionDetailViewProps {
  slotId: number
  onClose: () => void
  handle: DocHandle<UserDocument> | null
  userDoc: UserDocument | null
  onOpenSpeaker?: (slug: string) => void
}

export function SessionDetailView({ slotId, onClose, handle, userDoc, onOpenSpeaker }: SessionDetailViewProps) {
  const { schedule, loading, error } = useScheduleContext()
  const domain = schedule?.conference.domain ?? 'craft-conf.com'
  const year = schedule?.conference.year ?? 2026

  if (loading) {
    return (
      <div className="session-detail-loading" aria-live="polite">
        Loading schedule…
      </div>
    )
  }

  if (error) {
    return (
      <div className="session-detail-error" role="alert">
        Failed to load schedule: {error.message}
      </div>
    )
  }

  const found = findSlot(schedule, slotId)

  if (!found) {
    return (
      <div className="session-detail-not-found" role="alert">
        <button className="session-detail-back" onClick={onClose}>
          ← Back to schedule
        </button>
        <p>Session not found.</p>
      </div>
    )
  }

  const { slot, stage, day } = found
  const src = slot.talk ?? slot.workshop
  const talk = slot.talk ?? null
  const type: 'talk' | 'workshop' | 'text' = slot.type
  const isKeynote: boolean = talk ? talk.is_keynote : false
  const isOnline: boolean = talk ? talk.is_online : false
  const description: string | null = (talk?.description != null ? talk.description : null) ?? slot.description ?? null
  const level: string | null = talk ? talk.level ?? null : null
  const videoUrl: string | null = talk ? talk.video_url ?? null : null
  const slidesUrl: string | null = talk ? talk.slides_url ?? null : null
  const title: string = src?.title ?? slot.title ?? `Slot ${slot.id}`
  const speakers = src?.speakers ?? []
  const tags = src?.tags ?? []

  const officialSlug = src?.slug ?? null
  const officialUrl = officialSlug
    ? `https://${domain}/${year}/${type === 'workshop' ? 'workshop' : 'talk'}/${officialSlug}`
    : null

  const isBookmarked = userDoc?.bookmarks.includes(slotId) ?? false
  const canBookmark = handle !== null

  function toggleBookmark() {
    if (!handle) return
    handle.change((doc) => {
      const idx = doc.bookmarks.indexOf(slotId)
      if (idx === -1) {
        doc.bookmarks.push(slotId)
      } else {
        doc.bookmarks.splice(idx, 1)
      }
    })
  }

  const stageStyle = { '--stage-color': `#${stage.color}` } as React.CSSProperties

  return (
    <div className="session-detail-view" style={stageStyle}>
      {/* Back navigation */}
      <button className="session-detail-back" onClick={onClose} aria-label="Back to schedule">
        ← Back to schedule
      </button>

      {/* Header */}
      <header className="session-detail-header">
        <div className="session-detail-badges">
          {isKeynote && (
            <span className="session-badge session-badge--keynote">Keynote</span>
          )}
          {type === 'workshop' && (
            <span className="session-badge session-badge--workshop">Workshop</span>
          )}
          {isOnline && (
            <span className="session-badge session-badge--online">Online</span>
          )}
          {level && (
            <span className="session-badge session-badge--level">{level}</span>
          )}
        </div>

        <h2 className="session-detail-title">{title}</h2>

        <div className="session-detail-meta">
          <span className="session-detail-time">
            {slot.start_time}–{slot.end_time}
          </span>
          <span
            className="session-detail-stage"
            style={{ borderColor: `#${stage.color}` }}
          >
            {stage.name}
          </span>
          <span className="session-detail-day">{day.name}</span>
        </div>
      </header>

      {/* Bookmark */}
      <div className="session-detail-actions">
        <BookmarkButton
          isBookmarked={isBookmarked}
          disabled={!canBookmark}
          onToggle={toggleBookmark}
        />
      </div>

      {/* Speakers */}
      {speakers.length > 0 && (
        <section className="session-detail-section" aria-label="Speakers">
          <h3 className="session-detail-section-title">
            {speakers.length === 1 ? 'Speaker' : 'Speakers'}
          </h3>
          <ul className="session-detail-speakers">
            {speakers.map((speaker) => (
              <li key={speaker.slug} className="session-detail-speaker">
                {onOpenSpeaker ? (
                  <button
                    className="session-detail-speaker-link"
                    onClick={() => onOpenSpeaker(speaker.slug)}
                    aria-label={`View speaker profile: ${speaker.name}`}
                  >
                    {speaker.name}
                  </button>
                ) : (
                  speaker.name
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Description */}
      {description && (
        <section className="session-detail-section" aria-label="Description">
          <h3 className="session-detail-section-title">About this session</h3>
          <div
            className="session-detail-description"
            // Description is HTML sourced directly from craft-conf.com (no user input)
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </section>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <section className="session-detail-section" aria-label="Tags">
          <h3 className="session-detail-section-title">Tags</h3>
          <ul className="session-detail-tags" aria-label="Session tags">
            {tags.map((tag) => (
              <li key={tag.id} className={`session-tag${tag.is_trending ? ' session-tag--trending' : ''}`}>
                {tag.name}
                {tag.is_trending && <span className="session-tag-trending-mark" aria-label="Trending"> 🔥</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Links */}
      {(officialUrl || videoUrl || slidesUrl) && (
        <section className="session-detail-section" aria-label="Resources">
          <h3 className="session-detail-section-title">Resources</h3>
          <div className="session-detail-links">
            {officialUrl && (
              <a href={officialUrl} target="_blank" rel="noopener noreferrer" className="session-detail-link">
                🔗 Official session page
              </a>
            )}
            {videoUrl && (
              <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="session-detail-link">
                ▶ Watch video
              </a>
            )}
            {slidesUrl && (
              <a href={slidesUrl} target="_blank" rel="noopener noreferrer" className="session-detail-link">
                📄 View slides
              </a>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
