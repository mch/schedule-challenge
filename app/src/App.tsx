import { useState } from 'react'
import { useIdentity } from './identity/useIdentity'
import { IdentitySetup } from './components/IdentitySetup'
import { PassphraseDisplay } from './components/PassphraseDisplay'
import { SessionListView } from './components/SessionListView'
import { SessionDetailView } from './components/SessionDetailView'
import { PersonalScheduleView } from './components/PersonalScheduleView'
import { useUserDoc } from './automerge/useUserDoc'
import { useSessionDetailParam } from './schedule/useSessionDetailParam'
import './App.css'

function App() {
  const { identity, confirm, generateNew } = useIdentity()

  const docId = identity.status === 'ready' ? identity.docId : null
  const { doc, handle } = useUserDoc(docId)
  const { sessionId, openSession, closeSession } = useSessionDetailParam()

  if (identity.status === 'loading') {
    return <div className="app-loading" aria-live="polite">Loading…</div>
  }

  if (identity.status === 'new') {
    return <IdentitySetup onConfirm={confirm} generateNew={generateNew} />
  }

  // identity.status === 'ready'
  const [view, setView] = useState<'schedule' | 'personal'>('schedule')

  function handleOpenSession(slotId: number) {
    openSession(slotId)
    // Make sure we're showing the schedule view when a session detail opens
    setView('schedule')
  }

  return (
    <main>
      <header className="app-header">
        <h1>Craft 2026</h1>
        <nav className="app-nav" aria-label="Main navigation">
          <button
            className={`app-nav-tab${view === 'schedule' ? ' app-nav-tab--active' : ''}`}
            aria-pressed={view === 'schedule'}
            onClick={() => { closeSession(); setView('schedule') }}
          >
            Schedule
          </button>
          <button
            className={`app-nav-tab${view === 'personal' ? ' app-nav-tab--active' : ''}`}
            aria-pressed={view === 'personal'}
            onClick={() => { closeSession(); setView('personal') }}
          >
            My Schedule
            {doc !== null && doc.bookmarks.length > 0 && (
              <span className="app-nav-tab__count">{doc.bookmarks.length}</span>
            )}
          </button>
        </nav>
        <PassphraseDisplay passphrase={identity.passphrase} />
      </header>
      {sessionId !== null ? (
        <SessionDetailView
          slotId={sessionId}
          onClose={closeSession}
          handle={handle}
          userDoc={doc}
        />
      ) : view === 'personal' ? (
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
