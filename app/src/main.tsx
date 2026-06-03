import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { createRepo, PUBLIC_SYNC_SERVER_URL } from './automerge/repo'
import { loadSyncServerUrl } from './automerge/syncServerStorage'
import { RepoProvider } from './automerge/RepoContext'
import { ScheduleProvider } from './schedule/ScheduleContext'

// Initialise Automerge's WebAssembly module before mounting.
// vite-plugin-wasm handles the import; `?url` gives us the asset URL at build time.
import wasmUrl from '@automerge/automerge/automerge.wasm?url'
import * as Automerge from '@automerge/automerge/slim'
import { registerSW } from 'virtual:pwa-register'

// Register the service worker — it will auto-update in the background.
// The page reloads automatically when a new SW takes over.
registerSW({ immediate: true })

Automerge.initializeWasm(wasmUrl).then(() => {
  const initialSyncUrl = loadSyncServerUrl() ?? PUBLIC_SYNC_SERVER_URL
  const { repo, networkAdapter } = createRepo(initialSyncUrl)

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <RepoProvider repo={repo}>
        <ScheduleProvider>
          <App
            initialSyncServerUrl={initialSyncUrl}
            initialNetworkAdapter={networkAdapter}
          />
        </ScheduleProvider>
      </RepoProvider>
    </StrictMode>,
  )
})
