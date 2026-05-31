import { useIdentity } from './identity/useIdentity'
import { IdentitySetup } from './components/IdentitySetup'
import { PassphraseDisplay } from './components/PassphraseDisplay'
import { useUserDoc } from './automerge/useUserDoc'
import './App.css'

function App() {
  const { identity, confirm, generateNew } = useIdentity()

  const docId = identity.status === 'ready' ? identity.docId : null
  const { doc } = useUserDoc(docId)

  if (identity.status === 'loading') {
    return <div className="app-loading" aria-live="polite">Loading…</div>
  }

  if (identity.status === 'new') {
    return <IdentitySetup onConfirm={confirm} generateNew={generateNew} />
  }

  // identity.status === 'ready'
  return (
    <main>
      <h1>Craft 2026 Schedule</h1>
      <PassphraseDisplay passphrase={identity.passphrase} />
      <p>Doc ID: <code>{identity.docId}</code></p>
      {doc === null
        ? <p aria-live="polite">Syncing…</p>
        : <p>Bookmarks: {doc.bookmarks.length}</p>
      }
    </main>
  )
}

export default App
