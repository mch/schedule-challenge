import { useState } from 'react'
import { saveSyncServerUrl } from './automerge/syncServerStorage'
import { useUserDoc } from './automerge/useUserDoc'
import { IdentitySetup } from './components/IdentitySetup'
import { PersonalScheduleView } from './components/PersonalScheduleView'
import { SessionDetailView } from './components/SessionDetailView'
import { SessionListView } from './components/SessionListView'
import { SettingsView } from './components/SettingsView'
import { SpeakerDetailView } from './components/SpeakerDetailView'
import { SpeakersListView } from './components/SpeakersListView'
import type { NetworkAdapterLike } from './components/SyncServerSettings'
import { useIdentity } from './identity/useIdentity'
import { OfflineBanner } from './pwa/OfflineBanner'
import { useSessionDetailParam } from './schedule/useSessionDetailParam'
import { useSessionListParams } from './schedule/useSessionListParams'
import { useSpeakerParam } from './schedule/useSpeakerParam'
import './App.css'

interface AppProps {
  initialSyncServerUrl: string
  initialNetworkAdapter: NetworkAdapterLike
}

function App({ initialSyncServerUrl, initialNetworkAdapter }: AppProps) {
  const { identity, confirm, generateNew } = useIdentity()
  const [syncServerUrl, setSyncServerUrl] = useState(initialSyncServerUrl)

  function handleSyncServerUrlChange(url: string) {
    saveSyncServerUrl(url)
    setSyncServerUrl(url)
    // Reload the page so a fresh Repo is created with the new URL.
    window.location.reload()
  }
  const { params, setView } = useSessionListParams()
  const view = params.view

  const docId = identity.status === 'ready' ? identity.docId : null
  const { doc, handle } = useUserDoc(docId)
  const { sessionId, openSession, closeSession } = useSessionDetailParam()
  const { speakerSlug, openSpeaker, closeSpeaker } = useSpeakerParam()

  if (identity.status === 'loading') {
    return (
      <div className="app-loading" aria-live="polite">
        Loading…
      </div>
    )
  }

  if (identity.status === 'new') {
    return <IdentitySetup onConfirm={confirm} generateNew={generateNew} />
  }

  // identity.status === 'ready'

  function handleOpenSession(slotId: number) {
    openSession(slotId)
    closeSpeaker()
    // Make sure we're showing the schedule view when a session detail opens
    if (view !== 'schedule' && view !== 'myschedule') setView('schedule')
  }

  function handleOpenSpeaker(slug: string) {
    openSpeaker(slug)
  }

  return (
    <main>
      <OfflineBanner />
      <header className="app-header">
        <h1>Craft 2026</h1>
        <nav className="app-nav" aria-label="Main navigation">
          <button
            type="button"
            className={`app-nav-tab${view === 'schedule' ? ' app-nav-tab--active' : ''}`}
            aria-pressed={view === 'schedule'}
            onClick={() => {
              closeSession()
              closeSpeaker()
              setView('schedule')
            }}
          >
            Schedule
          </button>
          <button
            type="button"
            className={`app-nav-tab${view === 'myschedule' ? ' app-nav-tab--active' : ''}`}
            aria-pressed={view === 'myschedule'}
            onClick={() => {
              closeSession()
              closeSpeaker()
              setView('myschedule')
            }}
          >
            My Schedule
            {doc !== null && doc.bookmarks.length > 0 && (
              <span className="app-nav-tab__count">{doc.bookmarks.length}</span>
            )}
          </button>
          <button
            type="button"
            className={`app-nav-tab${view === 'speakers' ? ' app-nav-tab--active' : ''}`}
            aria-pressed={view === 'speakers'}
            onClick={() => {
              closeSession()
              closeSpeaker()
              setView('speakers')
            }}
          >
            Speakers
          </button>
          <button
            type="button"
            className={`app-nav-tab app-nav-tab--gear${view === 'settings' ? ' app-nav-tab--active' : ''}`}
            aria-pressed={view === 'settings'}
            aria-label="Settings"
            onClick={() => {
              closeSession()
              closeSpeaker()
              setView('settings')
            }}
          >
            ⚙
          </button>
        </nav>
      </header>
      {view === 'settings' ? (
        <SettingsView
          passphrase={identity.passphrase}
          syncServerUrl={syncServerUrl}
          onSyncServerUrlChange={handleSyncServerUrlChange}
          networkAdapter={initialNetworkAdapter}
        />
      ) : speakerSlug !== null ? (
        <SpeakerDetailView
          speakerSlug={speakerSlug}
          onClose={closeSpeaker}
          onOpenSession={handleOpenSession}
        />
      ) : view === 'speakers' && sessionId === null ? (
        <SpeakersListView onOpenSpeaker={handleOpenSpeaker} />
      ) : sessionId !== null ? (
        <SessionDetailView
          slotId={sessionId}
          onClose={closeSession}
          handle={handle}
          userDoc={doc}
          onOpenSpeaker={handleOpenSpeaker}
        />
      ) : view === 'myschedule' ? (
        <PersonalScheduleView
          userDoc={doc}
          handle={handle}
          onOpenSession={handleOpenSession}
        />
      ) : (
        <SessionListView
          onOpenSession={handleOpenSession}
          handle={handle}
          userDoc={doc}
        />
      )}
    </main>
  )
}

export default App
