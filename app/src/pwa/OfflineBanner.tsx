/**
 * OfflineBanner — shown when the browser is offline.
 *
 * The app is fully functional offline (schedule + bookmarks via IndexedDB),
 * so this is an informational banner, not an error state.
 * It disappears automatically when the browser comes back online.
 */
import { useNetworkStatus } from './useNetworkStatus'
import './OfflineBanner.css'

export function OfflineBanner() {
  const online = useNetworkStatus()

  if (online) return null

  return (
    <div className="offline-banner" role="status" aria-live="polite">
      <span className="offline-banner__icon" aria-hidden="true">
        ✈︎
      </span>
      <span>
        You're offline — schedule and bookmarks are available, sync will resume
        when you reconnect.
      </span>
    </div>
  )
}
