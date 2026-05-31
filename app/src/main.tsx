import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { createRepo } from './automerge/repo'
import { RepoProvider } from './automerge/RepoContext'

// Initialise Automerge's WebAssembly module before mounting.
// vite-plugin-wasm handles the import; `?url` gives us the asset URL at build time.
import wasmUrl from '@automerge/automerge/automerge.wasm?url'
import * as Automerge from '@automerge/automerge/slim'

Automerge.initializeWasm(wasmUrl).then(() => {
  const repo = createRepo()

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <RepoProvider repo={repo}>
        <App />
      </RepoProvider>
    </StrictMode>,
  )
})
