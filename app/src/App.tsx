import { useState } from 'react'
import { useIdentity } from './identity/useIdentity'
import { IdentitySetup } from './components/IdentitySetup'
import { SettingsView } from './components/SettingsView'
import { SessionListView } from './components/SessionListView'
import { SessionDetailView } from './components/SessionDetailView'
import { SpeakerDetailView } from './components/SpeakerDetailView'
import { PersonalScheduleView } from './components/PersonalScheduleView'
import { SpeakersListView } from './components/SpeakersListView'
import { useUserDoc } from './automerge/useUserDoc'
import { useSessionDetailParam } from './schedule/useSessionDetailParam'
import { useSpeakerParam } from './schedule/useSpeakerParam'
import { useSessionListParams } from './schedule/useSessionListParams'
import { OfflineBanner } from './pwa/OfflineBanner'
import { saveSyncServerUrl } from './automerge/syncServerStorage'
import type { NetworkAdapterLike } from './components/SyncServerSettings'
import './App.css'

interface AppProps {
  initialSyncServerUrl: string
  initialNetworkAdapter: NetworkAdapterLike
}

function App({ initialSyncServerUrl, initialNetworkAdapter }: AppProps) {
  const { identity, confirm, generateNew } = useIdentity()
  const [settingsOpen, setSettingsOpen] = useState(false)
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
    return <div className="app-loading" aria-live="polite">Loading…</div>
  }

  if (identity.status === 'new') {
    return <IdentitySetup onConfirm={confirm} generateNew={generateNew} />
  }

  // identity.status === 'ready'

  function handleOpenSession(slotId: number) {
    openSession(slotId)
    closeSpeaker()
    // Make sure we're showing the schedule view when a session detail opens
    if (view !== 'schedule') setView('schedule')
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
            className={`app-nav-tab${view === 'schedule' ? ' app-nav-tab--active' : ''}`}
            aria-pressed={view === 'schedule'}
            onClick={() => { closeSession(); closeSpeaker(); setView('schedule') }}
          >
            Schedule
          </button>
          <button
            className={`app-nav-tab${view === 'myschedule' ? ' app-nav-tab--active' : ''}`}
            aria-pressed={view === 'myschedule'}
            onClick={() => { closeSession(); closeSpeaker(); setView('myschedule') }}
          >
            My Schedule
            {doc !== null && doc.bookmarks.length > 0 && (
              <span className="app-nav-tab__count">{doc.bookmarks.length}</span>
            )}
          </button>
          <button
            className={`app-nav-tab${view === 'speakers' ? ' app-nav-tab--active' : ''}`}
            aria-pressed={view === 'speakers'}
            onClick={() => { closeSession(); closeSpeaker(); setView('speakers') }}
          >
            Speakers
          </button>
        </nav>
        <button
          type="button"
          className="app-hamburger"
          aria-label="Open settings"
          aria-expanded={settingsOpen}
          onClick={() => setSettingsOpen(true)}
        >
          <span className="app-hamburger__bar" />
          <span className="app-hamburger__bar" />
          <span className="app-hamburger__bar" />
        </button>
      </header>
      {settingsOpen ? (
        <SettingsView
          passphrase={identity.passphrase}
          onClose={() => setSettingsOpen(false)}
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
