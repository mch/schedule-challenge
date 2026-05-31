import { useIdentity } from './identity/useIdentity'
import { IdentitySetup } from './components/IdentitySetup'
import { PassphraseDisplay } from './components/PassphraseDisplay'
import { SessionListView } from './components/SessionListView'
import { SessionDetailView } from './components/SessionDetailView'
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
  return (
    <main>
      <header className="app-header">
        <h1>Craft 2026</h1>
        <PassphraseDisplay passphrase={identity.passphrase} />
        {doc !== null && (
          <p className="app-bookmark-count">{doc.bookmarks.length} bookmarked</p>
        )}
      </header>
      {sessionId !== null ? (
        <SessionDetailView
          slotId={sessionId}
          onClose={closeSession}
          handle={handle}
          userDoc={doc}
        />
      ) : (
        <SessionListView onOpenSession={openSession} />
      )}
    </main>
  )
}

export default App
